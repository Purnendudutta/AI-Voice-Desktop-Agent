import { describe, it, expect } from 'vitest';
import { CommandSandbox } from '../../src/main/security/CommandSandbox';
import { DEFAULT_CONFIG } from '../../src/shared/constants/defaults';

describe('Command Sandbox & Security Restrictions', () => {
  const sandbox = new CommandSandbox(DEFAULT_CONFIG.security);

  it('detects dangerous shell command patterns', () => {
    expect(sandbox.isDangerous('rm -rf /').dangerous).toBe(true);
    expect(sandbox.isDangerous('rm -rf \\').dangerous).toBe(true);
    expect(sandbox.isDangerous('del /f /s /q c:\\').dangerous).toBe(true);
    expect(sandbox.isDangerous('format c:').dangerous).toBe(true);
    expect(sandbox.isDangerous(':(){ :|:& };:').dangerous).toBe(true);
    expect(sandbox.isDangerous('shutdown -s').dangerous).toBe(true);
  });

  it('allows safe development commands', () => {
    expect(sandbox.isDangerous('git status').dangerous).toBe(false);
    expect(sandbox.isDangerous('npm test').dangerous).toBe(false);
    expect(sandbox.isDangerous('node --version').dangerous).toBe(false);
  });

  it('executes safe commands and captures output', async () => {
    const res = await sandbox.execute('node --version');
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain('v');
    expect(res.durationMs).toBeGreaterThan(0);
  });

  it('blocks dangerous commands with an exception', async () => {
    await expect(sandbox.execute('rm -rf /')).rejects.toThrow(/Execution Blocked/);
  });
});
