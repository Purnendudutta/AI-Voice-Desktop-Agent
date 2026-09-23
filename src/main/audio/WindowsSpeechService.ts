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
    'open terminal', 'launch terminal', 'terminal', 'open powershell', 'powershell', 'cmd', 'command prompt',
    'open notepad', 'launch notepad', 'notepad', 'open text editor', 'text editor',
    'open calculator', 'launch calculator', 'calculator', 'calc',
    'open chrome', 'launch chrome', 'chrome', 'browser', 'open browser', 'google chrome',
    'open explorer', 'explorer', 'open files', 'files', 'file explorer',
    'open settings', 'show settings', 'settings',
    'prepare development workspace', 'prepare workspace', 'development workspace', 'start workspace', 'workspace',
    'organize downloads', 'clean downloads', 'downloads',
    'run tests', 'run test', 'test', 'npm test', 'execute tests',
    'system health', 'check system health', 'system status', 'show status', 'system info', 'status', 'health',
    'clean temporary files', 'clean files', 'clear cache',
    'close terminal', 'close notepad', 'close calculator', 'close chrome',
    'git status', 'git diff', 'git log', 'check git',
    'who are you', 'what can you do', 'help', 'help me',
    'hello', 'hi', 'hey atlas', 'hello atlas', 'hi atlas',
    'take screenshot', 'capture screen', 'screen shot',
    'cancel', 'stop', 'abort', 'yes', 'no'
  )
  $choices.Add([string[]]$commands)
  $builder = New-Object System.Speech.Recognition.GrammarBuilder($choices)
  $cmdGrammar = New-Object System.Speech.Recognition.Grammar($builder)
  $cmdGrammar.Name = 'Commands'
  $cmdGrammar.Weight = 1.0
  $engine.LoadGrammar($cmdGrammar)

  # 2. General Dictation Grammar for arbitrary natural language speech
  $dictGrammar = New-Object System.Speech.Recognition.DictationGrammar
  $dictGrammar.Name = 'Dictation'
  $dictGrammar.Weight = 0.3
  $engine.LoadGrammar($dictGrammar)

  $engine.SetInputToWaveFile('${tempWav.replace(/'/g, "''")}')
  $res = $engine.Recognize()
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
