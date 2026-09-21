import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioStreamOptions {
  wakePhrase?: string;
  agentName?: string;
  voiceResponseEnabled?: boolean;
  onCommand?: (command: string) => void;
  onInterimTranscript?: (text: string) => void;
  onWakeWordDetected?: () => void;
}

/**
 * Encodes Float32 mono PCM samples to a standard 16-bit PCM RIFF WAV ArrayBuffer
 */
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 = raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count (1 = mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Downsamples Float32Array to 16,000 Hz for optimal speech recognition
 */
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate = 16000): Float32Array {
  if (outputRate >= inputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLen = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLen);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export function useAudioStream(options: AudioStreamOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 10, 12, 18, 14, 10, 16, 12, 10]);
  const [interimText, setInterimText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // PCM collection for speech recognition
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const preSpeechBufferRef = useRef<Float32Array[]>([]);

  // VAD tracking
  const isSpeakingUserRef = useRef(false);
  const silenceCounterRef = useRef(0);
  const isTranscribingRef = useRef(false);
  const isListeningRef = useRef(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Process and transcribe a completed voice segment
  const processVoiceSegment = useCallback(async (audioBlob: Blob) => {
    if (audioBlob.size < 2048) {
      // Chunk too small / empty noise
      return;
    }

    if (!window.electronAPI?.transcribeAudio) {
      return;
    }

    isTranscribingRef.current = true;
    setInterimText('Processing speech...');

    try {
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      const mimeType = audioBlob.type || 'audio/wav';
      const result = await window.electronAPI.transcribeAudio(base64Audio, mimeType);

      const text = typeof result === 'string' ? result : result?.text || '';

      if (text && text.trim()) {
        const cleanFinal = text.trim();
        setInterimText(`Heard: "${cleanFinal}"`);
        setTimeout(() => setInterimText(''), 2000);

        const wake = optionsRef.current.wakePhrase?.toLowerCase() || '';
        const agent = optionsRef.current.agentName?.toLowerCase() || 'atlas';

        let command = cleanFinal;

        // Check if user spoke the wake phrase
        if (wake && cleanFinal.toLowerCase().includes(wake)) {
          if (optionsRef.current.onWakeWordDetected) {
            optionsRef.current.onWakeWordDetected();
          }
          const parts = cleanFinal.toLowerCase().split(wake);
          command = parts[1]?.trim() || cleanFinal;
        } else if (cleanFinal.toLowerCase().startsWith(`hey ${agent}`)) {
          if (optionsRef.current.onWakeWordDetected) {
            optionsRef.current.onWakeWordDetected();
          }
          command = cleanFinal.replace(new RegExp(`^hey\\s+${agent}\\s*`, 'i'), '').trim();
        } else if (cleanFinal.toLowerCase().startsWith(agent)) {
          if (optionsRef.current.onWakeWordDetected) {
            optionsRef.current.onWakeWordDetected();
          }
          command = cleanFinal.replace(new RegExp(`^${agent}[,:\\s]+`, 'i'), '').trim();
        }

        if (command && optionsRef.current.onCommand) {
          optionsRef.current.onCommand(command);
        }
      } else if (result && typeof result === 'object' && result.error === 'NO_API_KEY') {
        setInterimText('Local mode: speak clearly or configure Gemini in Settings');
        setTimeout(() => setInterimText(''), 3000);
      }
    } catch (err) {
      console.warn('Voice segment transcription notice:', err);
    } finally {
      isTranscribingRef.current = false;
    }
  }, []);

  // Commit accumulated PCM audio to WAV blob and transcribe
  const commitVoiceSegment = useCallback(() => {
    const chunks = pcmChunksRef.current;
    const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);
    if (totalSamples < 4000) {
      // Too short / tap noise (< ~100ms)
      pcmChunksRef.current = [];
      return;
    }

    const merged = new Float32Array(totalSamples);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    pcmChunksRef.current = [];

    const inputRate = audioContextRef.current?.sampleRate || 44100;
    const downsampled = downsampleBuffer(merged, inputRate, 16000);
    const wavBuffer = encodeWav(downsampled, 16000);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    processVoiceSegment(wavBlob);
  }, [processVoiceSegment]);

  // Animate audio waveform bars from real mic data & perform VAD
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample 10 frequency buckets
    const bucketSize = Math.floor(bufferLength / 10);
    const levels: number[] = [];
    let totalEnergy = 0;

    for (let i = 0; i < 10; i++) {
      let sum = 0;
      for (let j = 0; j < bucketSize; j++) {
        sum += dataArray[i * bucketSize + j];
      }
      const avg = sum / (bucketSize || 1);
      levels.push(Math.min(100, Math.max(10, Math.round((avg / 255) * 100))));
      totalEnergy += avg;
    }

    setAudioLevels(levels);

    // Voice Activity Detection (VAD)
    const SPEECH_ENERGY_THRESHOLD = 22;
    const SILENCE_FRAMES_LIMIT = 45; // ~1.2 seconds of silence at 60fps

    if (totalEnergy > SPEECH_ENERGY_THRESHOLD) {
      silenceCounterRef.current = 0;
      if (!isSpeakingUserRef.current && !isTranscribingRef.current) {
        isSpeakingUserRef.current = true;
        setInterimText('Listening...');
      }
    } else {
      if (isSpeakingUserRef.current) {
        silenceCounterRef.current += 1;
        if (silenceCounterRef.current >= SILENCE_FRAMES_LIMIT) {
          // User finished their voice sentence
          isSpeakingUserRef.current = false;
          silenceCounterRef.current = 0;
          commitVoiceSegment();
        }
      }
    }

    // Stream base64 audio chunk to Electron Main AudioPipeline if active
    if (totalEnergy > 50 && window.electronAPI?.sendAudioChunk) {
      let binary = '';
      const bytes = new Uint8Array(dataArray.buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const dummyPcm = btoa(binary);
      window.electronAPI.sendAudioChunk(dummyPcm);
    }

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [commitVoiceSegment]);

  const startListening = useCallback(async () => {
    setMicError(null);
    try {
      // 1. Request hardware microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      isListeningRef.current = true;
      pcmChunksRef.current = [];
      preSpeechBufferRef.current = [];

      // 2. Set up Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 3. Set up ScriptProcessorNode for clean PCM capture
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;

      processor.onaudioprocess = (e) => {
        if (!isListeningRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const copy = new Float32Array(channelData);

        if (isSpeakingUserRef.current) {
          if (pcmChunksRef.current.length === 0 && preSpeechBufferRef.current.length > 0) {
            pcmChunksRef.current.push(...preSpeechBufferRef.current);
            preSpeechBufferRef.current = [];
          }
          pcmChunksRef.current.push(copy);
        } else {
          preSpeechBufferRef.current.push(copy);
          if (preSpeechBufferRef.current.length > 4) {
            preSpeechBufferRef.current.shift();
          }
        }
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      scriptProcessorRef.current = processor;
      silentGainRef.current = silentGain;

      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(updateWaveform);

      setIsListening(true);
      if (window.electronAPI) {
        await window.electronAPI.startAudio();
      }
    } catch (err: any) {
      console.error('Microphone access error:', err);
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission denied. Please allow microphone access in Windows / System Settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device found on your computer.';
      } else {
        msg = err.message || 'Microphone error.';
      }
      setMicError(msg);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [updateWaveform]);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    isSpeakingUserRef.current = false;
    silenceCounterRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }

    if (silentGainRef.current) {
      try {
        silentGainRef.current.disconnect();
      } catch {}
      silentGainRef.current = null;
    }

    pcmChunksRef.current = [];
    preSpeechBufferRef.current = [];

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsListening(false);
    setAudioLevels([10, 12, 10, 14, 12, 10, 12, 10, 12, 10]);
    setInterimText('');

    if (window.electronAPI) {
      await window.electronAPI.stopAudio();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Voice synthesis (Text to Speech)
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (window.electronAPI) {
      window.electronAPI.sendBargeIn();
    }
  }, []);

  return {
    isListening,
    audioLevels,
    interimText,
    micError,
    isSpeaking,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking,
  };
}
