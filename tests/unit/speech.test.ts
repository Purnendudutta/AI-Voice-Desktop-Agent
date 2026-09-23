import { describe, it, expect } from 'vitest';
import { WindowsSpeechService } from '../../src/main/audio/WindowsSpeechService';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Windows Speech Service', () => {
  it('handles empty or non-wav audio gracefully', async () => {
    const result = await WindowsSpeechService.transcribeWav('');
    expect(result).toBe('');
  });

  it('handles invalid base64 input without crashing', async () => {
    const result = await WindowsSpeechService.transcribeWav('invalid-base64-content');
    expect(result).toBe('');
  });

  it('accurately transcribes desktop voice command on Windows', async () => {
    if (os.platform() !== 'win32') return;

    const tmpWav = path.join(os.tmpdir(), `test_synth_${Date.now()}.wav`);
    try {
      execSync(
        `powershell -NoProfile -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono); $s.SetOutputToWaveFile('${tmpWav.replace(/'/g, "''")}', $fmt); $s.Speak('open terminal'); $s.Dispose()"`,
        { timeout: 15000 }
      );

      const wavBuffer = fs.readFileSync(tmpWav);
      const base64 = wavBuffer.toString('base64');
      const text = await WindowsSpeechService.transcribeWav(base64);
      expect(text.toLowerCase()).toContain('open terminal');
    } finally {
      if (fs.existsSync(tmpWav)) fs.unlinkSync(tmpWav);
    }
  }, 25000);
});
