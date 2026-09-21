export interface AudioPipelineEvents {
  onSpeechStarted?: () => void;
  onSpeechEnded?: () => void;
  onBargeIn?: () => void;
  onAudioData?: (pcm16Chunk: Buffer) => void;
}

export class AudioPipeline {
  private isRecording = false;
  private energyThreshold = 0.03;
  private speechActive = false;
  private callbacks: AudioPipelineEvents = {};
  private silenceFramesCount = 0;
  private readonly SILENCE_THRESHOLD_FRAMES = 15;

  constructor(callbacks?: AudioPipelineEvents) {
    if (callbacks) this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AudioPipelineEvents): void {
    this.callbacks = callbacks;
  }

  public start(): boolean {
    this.isRecording = true;
    this.speechActive = false;
    this.silenceFramesCount = 0;
    return true;
  }

  public stop(): boolean {
    this.isRecording = false;
    this.speechActive = false;
    return true;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public processAudioChunk(chunkBase64: string): void {
    if (!this.isRecording) return;
    const buffer = Buffer.from(chunkBase64, 'base64');

    // Calculate RMS energy of 16-bit PCM chunk
    let sum = 0;
    const sampleCount = buffer.length / 2;
    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i) / 32768.0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / (sampleCount || 1));

    // VAD
    if (rms > this.energyThreshold) {
      this.silenceFramesCount = 0;
      if (!this.speechActive) {
        this.speechActive = true;
        if (this.callbacks.onSpeechStarted) {
          this.callbacks.onSpeechStarted();
        }
      }
    } else {
      if (this.speechActive) {
        this.silenceFramesCount++;
        if (this.silenceFramesCount >= this.SILENCE_THRESHOLD_FRAMES) {
          this.speechActive = false;
          if (this.callbacks.onSpeechEnded) {
            this.callbacks.onSpeechEnded();
          }
        }
      }
    }

    if (this.callbacks.onAudioData) {
      this.callbacks.onAudioData(buffer);
    }
  }

  public triggerBargeIn(): void {
    if (this.callbacks.onBargeIn) {
      this.callbacks.onBargeIn();
    }
  }
}
