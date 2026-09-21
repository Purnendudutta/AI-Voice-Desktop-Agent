import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class ScreenCapture {
  private isCapturing = false;

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  public async captureScreen(): Promise<{ buffer: Buffer; format: string; width: number; height: number }> {
    this.isCapturing = true;
    try {
      // In production Electron, this uses desktopCapturer.getSources or native display capture.
      // Here we create a realistic mock/testable PNG buffer:
      const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      return {
        buffer: placeholder,
        format: 'image/png',
        width: 1920,
        height: 1080,
      };
    } finally {
      this.isCapturing = false;
    }
  }

  public async saveScreenshot(destPath?: string): Promise<string> {
    const target = destPath || path.join(os.tmpdir(), `screenshot_${Date.now()}.png`);
    const { buffer } = await this.captureScreen();
    fs.writeFileSync(target, buffer);
    return target;
  }
}
