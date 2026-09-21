import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export class WindowsSpeechService {
  /**
   * Transcribe a 16-bit PCM WAV audio base64 payload using Windows native System.Speech
   */
  public static async transcribeWav(wavBase64: string): Promise<string> {
    if (os.platform() !== 'win32') return '';

    const tempWav = path.join(os.tmpdir(), `agent_voice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.wav`);
    const tempPs1 = path.join(os.tmpdir(), `agent_speech_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.ps1`);

    try {
      const buffer = Buffer.from(wavBase64, 'base64');
      fs.writeFileSync(tempWav, buffer);

      const script = `
Add-Type -AssemblyName System.Speech
try {
  $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $engine.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
  $engine.SetInputToWaveFile('${tempWav.replace(/'/g, "''")}')
  $res = $engine.Recognize()
  if ($res) {
    Write-Output $res.Text
  }
  $engine.Dispose()
} catch {
  Write-Output ""
}
`;
      fs.writeFileSync(tempPs1, script);

      return new Promise<string>((resolve) => {
        exec(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`,
          { timeout: 7000 },
          (_err, stdout) => {
            try {
              if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);
              if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);
            } catch {}
            const text = (stdout || '').trim();
            resolve(text);
          }
        );
      });
    } catch (err) {
      console.warn('Windows native speech recognition fallback failed:', err);
      return '';
    }
  }
}
