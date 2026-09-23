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

  # 1. High-accuracy Desktop & Agent Command Grammar
  $choices = New-Object System.Speech.Recognition.Choices
  $commands = @(
    'open terminal', 'open powershell', 'open cmd', 'open command prompt',
    'open notepad', 'open text editor',
    'open calculator', 'open calc',
    'open chrome', 'open browser', 'open web browser',
    'open explorer', 'open files', 'open file explorer',
    'open settings', 'show settings',
    'close terminal', 'close notepad', 'close calculator', 'close chrome',
    'run tests', 'run test', 'npm test', 'execute tests',
    'git status', 'git diff', 'git log', 'check git',
    'who are you', 'what can you do', 'help', 'help me',
    'hello', 'hi', 'hey atlas', 'hello atlas', 'hi atlas',
    'system status', 'show status', 'system info', 'show memory',
    'show tasks', 'show workflows', 'show plugins', 'show security',
    'clean temporary files', 'clean files', 'organize downloads', 'list files',
    'take screenshot', 'capture screen', 'screen shot',
    'cancel', 'stop', 'abort', 'yes', 'no'
  )
  $choices.Add([string[]]$commands)
  $builder = New-Object System.Speech.Recognition.GrammarBuilder($choices)
  $cmdGrammar = New-Object System.Speech.Recognition.Grammar($builder)
  $cmdGrammar.Name = 'Commands'
  $engine.LoadGrammar($cmdGrammar)

  # 2. General Dictation Grammar for arbitrary natural language speech
  $dictGrammar = New-Object System.Speech.Recognition.DictationGrammar
  $dictGrammar.Name = 'Dictation'
  $engine.LoadGrammar($dictGrammar)

  $engine.SetInputToWaveFile('${tempWav.replace(/'/g, "''")}')
  $res = $engine.Recognize([TimeSpan]::FromSeconds(5))
  if ($res -and $res.Text) {
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
          { timeout: 20000 },
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
