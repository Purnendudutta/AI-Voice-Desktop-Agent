import { exec, ChildProcess } from 'node:child_process';
import { DANGEROUS_COMMAND_PATTERNS, SAFE_COMMAND_ALLOWLIST } from '../../shared/constants/defaults';
import { SecuritySettings } from '../../shared/types/config';

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  truncated: boolean;
}

export class CommandSandbox {
  private activeProcesses = new Map<string, ChildProcess>();
  private settings: SecuritySettings;
  private readonly MAX_OUTPUT_BYTES = 512 * 1024; // 512 KB limit

  constructor(settings: SecuritySettings) {
    this.settings = settings;
  }

  public updateSettings(settings: SecuritySettings): void {
    this.settings = settings;
  }

  public isDangerous(command: string): { dangerous: boolean; reason?: string } {
    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(command)) {
        return {
          dangerous: true,
          reason: `Command matched dangerous pattern: ${pattern.toString()}`,
        };
      }
    }
    return { dangerous: false };
  }

  public isAllowed(command: string): boolean {
    if (!this.settings.commandAllowlistEnabled) {
      return true;
    }
    return SAFE_COMMAND_ALLOWLIST.some((pattern) => pattern.test(command.trim()));
  }

  public async execute(
    command: string,
    options: {
      cwd?: string;
      timeoutMs?: number;
      taskId?: string;
    } = {}
  ): Promise<CommandExecutionResult> {
    const dangerCheck = this.isDangerous(command);
    if (dangerCheck.dangerous) {
      throw new Error(`Execution Blocked: ${dangerCheck.reason}`);
    }

    if (!this.isAllowed(command)) {
      throw new Error(`Execution Blocked: Command "${command}" is not in the allowlist.`);
    }

    const startTime = Date.now();
    const timeout = options.timeoutMs || this.settings.maxCommandTimeoutMs || 15000;
    const procKey = options.taskId || `proc_${Date.now()}`;

    return new Promise((resolve, reject) => {
      let isSettled = false;
      let stdoutAcc = '';
      let stderrAcc = '';
      let truncated = false;

      const child = exec(
        command,
        {
          cwd: options.cwd || process.cwd(),
          timeout,
          maxBuffer: this.MAX_OUTPUT_BYTES,
          windowsHide: true,
        },
        (error, stdout, stderr) => {
          if (isSettled) return;
          isSettled = true;
          this.activeProcesses.delete(procKey);

          const durationMs = Date.now() - startTime;
          if (error && error.killed) {
            reject(new Error(`Command timed out after ${timeout}ms or was cancelled.`));
            return;
          }

          resolve({
            stdout: stdout || stdoutAcc,
            stderr: stderr || stderrAcc,
            exitCode: error ? (error.code ?? 1) : 0,
            durationMs,
            truncated,
          });
        }
      );

      this.activeProcesses.set(procKey, child);

      if (child.stdout) {
        child.stdout.on('data', (chunk) => {
          if (stdoutAcc.length < this.MAX_OUTPUT_BYTES) {
            stdoutAcc += chunk.toString();
          } else {
            truncated = true;
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (chunk) => {
          if (stderrAcc.length < this.MAX_OUTPUT_BYTES) {
            stderrAcc += chunk.toString();
          }
        });
      }
    });
  }

  public cancel(taskId: string): boolean {
    const proc = this.activeProcesses.get(taskId);
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      this.activeProcesses.delete(taskId);
      return true;
    }
    return false;
  }
}
