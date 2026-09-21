import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../../src/main/tools/ToolRegistry';
import { WindowManager } from '../../src/main/desktop/WindowManager';
import { ScreenCapture } from '../../src/main/desktop/ScreenCapture';
import { ClipboardManager } from '../../src/main/desktop/ClipboardManager';
import { FileAgent } from '../../src/main/files/FileAgent';
import { FileOrganizer } from '../../src/main/files/FileOrganizer';
import { GitAgent } from '../../src/main/git/GitAgent';
import { BrowserAgent } from '../../src/main/browser/BrowserAgent';
import { CommandSandbox } from '../../src/main/security/CommandSandbox';
import { DEFAULT_CONFIG } from '../../src/shared/constants/defaults';

describe('Tool Registry & Observe-Act-Verify', () => {
  const windowManager = new WindowManager();
  const screenCapture = new ScreenCapture();
  const clipboard = new ClipboardManager();
  const fileAgent = new FileAgent();
  const fileOrganizer = new FileOrganizer(fileAgent);
  const sandbox = new CommandSandbox(DEFAULT_CONFIG.security);
  const gitAgent = new GitAgent(sandbox);
  const browserAgent = new BrowserAgent();

  const registry = new ToolRegistry(
    windowManager,
    screenCapture,
    clipboard,
    fileAgent,
    fileOrganizer,
    gitAgent,
    browserAgent,
    sandbox
  );

  it('registers all built-in tools', () => {
    const tools = registry.getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(15);
    expect(registry.getTool('open_application')).toBeDefined();
    expect(registry.getTool('search_files')).toBeDefined();
    expect(registry.getTool('delete_file')).toBeDefined();
    expect(registry.getTool('git_status')).toBeDefined();
    expect(registry.getTool('get_system_status')).toBeDefined();
  });

  it('executes and verifies get_system_status', async () => {
    const res = await registry.executeTool('get_system_status', {});
    expect(res.success).toBe(true);
    expect(res.verification?.verified).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.platform).toBeDefined();
  });

  it('executes and verifies clipboard read/write', async () => {
    const writeRes = await registry.executeTool('write_clipboard', { text: 'Testing agent clipboard' });
    expect(writeRes.success).toBe(true);
    expect(writeRes.verification?.verified).toBe(true);

    const readRes = await registry.executeTool('read_clipboard', {});
    expect(readRes.success).toBe(true);
    expect(readRes.data).toBe('Testing agent clipboard');
  });

  it('returns graceful failure when tool does not exist', async () => {
    const res = await registry.executeTool('non_existent_tool', {});
    expect(res.success).toBe(false);
    expect(res.error).toContain('not found');
  });
});
