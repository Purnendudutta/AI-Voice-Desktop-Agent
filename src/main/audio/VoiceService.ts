export class VoiceService {
  private isSpeaking = false;
  private currentAudioQueue: string[] = [];

  constructor() {}

  public speak(text: string): Promise<boolean> {
    this.isSpeaking = true;
    this.currentAudioQueue.push(text);

    return new Promise((resolve) => {
      // In production Electron renderer, Web Speech Synthesis API or native audio plays the sound
      const simulatedDuration = Math.min(2000, Math.max(500, text.length * 40));
      setTimeout(() => {
        this.isSpeaking = false;
        resolve(true);
      }, simulatedDuration);
    });
  }

  public interrupt(): void {
    this.isSpeaking = false;
    this.currentAudioQueue = [];
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
