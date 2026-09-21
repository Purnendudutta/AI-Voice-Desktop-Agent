import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioStreamOptions {
  wakePhrase?: string;
  agentName?: string;
  voiceResponseEnabled?: boolean;
  onCommand?: (command: string) => void;
  onInterimTranscript?: (text: string) => void;
  onWakeWordDetected?: () => void;
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

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
    setInterimText('Transcribing voice...');

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

      const mimeType = audioBlob.type || 'audio/webm';
      const result = await window.electronAPI.transcribeAudio(base64Audio, mimeType);

      if (result && typeof result === 'object' && result.error === 'NO_API_KEY') {
        setMicError(result.message || 'No Gemini API key configured in Settings.');
        setInterimText('Gemini API key needed in Settings for voice transcription');
        setTimeout(() => setInterimText(''), 4000);
        return;
      }

      const text = typeof result === 'string' ? result : result?.text || '';

      if (text && text.trim()) {
        const cleanFinal = text.trim();
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
      }
    } catch (err) {
      console.warn('Voice segment transcription notice:', err);
    } finally {
      isTranscribingRef.current = false;
      setInterimText('');
    }
  }, []);

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
    const SPEECH_ENERGY_THRESHOLD = 25;
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

          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
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
  }, [processVoiceSegment]);

  // Setup / restart MediaRecorder for continuous recording segments
  const setupMediaRecorder = useCallback((stream: MediaStream) => {
    try {
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        recordedChunksRef.current = [];
        processVoiceSegment(audioBlob);

        // If user is still listening, restart recorder for next utterance
        if (isListeningRef.current && mediaStreamRef.current?.active) {
          try {
            recorder.start(250);
          } catch {
            // Already started or restarting
          }
        }
      };

      recorder.start(250);
    } catch (recErr) {
      console.warn('MediaRecorder setup notice:', recErr);
    }
  }, [processVoiceSegment]);

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

      // 2. Set up Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // 3. Initialize MediaRecorder with VAD
      setupMediaRecorder(stream);

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
  }, [updateWaveform, setupMediaRecorder]);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    isSpeakingUserRef.current = false;
    silenceCounterRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

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
