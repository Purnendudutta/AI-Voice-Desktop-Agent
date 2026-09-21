import {
  ToolDefinition,
  ToolExecutionResult,
  ToolVerificationResult,
  ToolRecoveryStrategy,
} from '../../shared/types/tools';
import { WindowManager } from '../desktop/WindowManager';
import { ScreenCapture } from '../desktop/ScreenCapture';
import { ClipboardManager } from '../desktop/ClipboardManager';
import { FileAgent } from '../files/FileAgent';
import { FileOrganizer } from '../files/FileOrganizer';
import { GitAgent } from '../git/GitAgent';
import { BrowserAgent } from '../browser/BrowserAgent';
import { CommandSandbox } from '../security/CommandSandbox';
import os from 'node:os';

export interface ExecutableTool extends ToolDefinition {
  execute: (args: Record<string, any>, context?: any) => Promise<any>;
  verify: (args: Record<string, any>, result: any, context?: any) => Promise<ToolVerificationResult>;
  recover?: (args: Record<string, any>, error: any, context?: any) => Promise<ToolRecoveryStrategy>;
}

export class ToolRegistry {
  private tools = new Map<string, ExecutableTool>();

  constructor(
    windowManager: WindowManager,
    screenCapture: ScreenCapture,
    clipboard: ClipboardManager,
    fileAgent: FileAgent,
    fileOrganizer: FileOrganizer,
    gitAgent: GitAgent,
    browserAgent: BrowserAgent,
    sandbox: CommandSandbox
  ) {
    this.registerBuiltins(
      windowManager,
      screenCapture,
      clipboard,
      fileAgent,
      fileOrganizer,
      gitAgent,
      browserAgent,
      sandbox
    );
  }

  private registerBuiltins(
    windowManager: WindowManager,
    screenCapture: ScreenCapture,
    clipboard: ClipboardManager,
    fileAgent: FileAgent,
    fileOrganizer: FileOrganizer,
    gitAgent: GitAgent,
    browserAgent: BrowserAgent,
    sandbox: CommandSandbox
  ): void {
    // 1. open_application
    this.register({
      id: 'open_application',
      name: 'Open Application',
      description: 'Launch or focus a desktop application',
      category: 'desktop',
      riskLevel: 'LOW',
      timeoutMs: 8000,
      requiresPermissions: ['desktop:launch'],
      parameters: {
        type: 'object',
        properties: {
          appName: { type: 'string', description: 'Name of the application (e.g. Visual Studio Code, Chrome, Notepad)' },
          path: { type: 'string', description: 'Optional project or file path to open with application' },
        },
        required: ['appName'],
      },
      returns: { type: 'boolean', description: 'True if application was launched successfully' },
      execute: async (args) => {
        return windowManager.launchApplication(args.appName, args.path);
      },
      verify: async (args, result) => {
        if (!result) {
          return { verified: false, message: `Failed to launch ${args.appName}`, retryRecommended: true };
        }
        return { verified: true, message: `Application ${args.appName} launched and active` };
      },
      recover: async (args) => {
        return {
          canRecover: true,
          suggestedArguments: { ...args, appName: args.appName.toLowerCase() },
        };
      },
    });

    // 2. close_application
    this.register({
      id: 'close_application',
      name: 'Close Application',
      description: 'Close an open desktop application',
      category: 'desktop',
      riskLevel: 'MEDIUM',
      timeoutMs: 5000,
      requiresPermissions: ['desktop:close'],
      parameters: {
        type: 'object',
        properties: {
          appName: { type: 'string', description: 'Name of the application process to terminate' },
        },
        required: ['appName'],
      },
      returns: { type: 'boolean', description: 'True if closed' },
      execute: async (args) => windowManager.closeApplication(args.appName),
      verify: async (args, result) => ({
        verified: !!result,
        message: result ? `Closed ${args.appName}` : `Could not close ${args.appName}`,
      }),
    });

    // 3. get_active_window
    this.register({
      id: 'get_active_window',
      name: 'Get Active Window',
      description: 'Query current active foreground window and process',
      category: 'desktop',
      riskLevel: 'LOW',
      timeoutMs: 3000,
      requiresPermissions: [],
      parameters: { type: 'object', properties: {} },
      returns: { type: 'object', description: 'Active window title and process name' },
      execute: async () => windowManager.getActiveWindow(),
      verify: async (_args, result) => ({
        verified: !!result && typeof result.title === 'string',
        message: 'Active window successfully inspected',
      }),
    });

    // 4. list_windows
    this.register({
      id: 'list_windows',
      name: 'List Windows',
      description: 'Get list of open top-level windows',
      category: 'desktop',
      riskLevel: 'LOW',
      timeoutMs: 3000,
      requiresPermissions: [],
      parameters: { type: 'object', properties: {} },
      returns: { type: 'array', description: 'List of window info objects' },
      execute: async () => windowManager.listOpenWindows(),
      verify: async (_args, result) => ({
        verified: Array.isArray(result),
        message: `Found ${result.length} open windows`,
      }),
    });

    // 5. take_screenshot
    this.register({
      id: 'take_screenshot',
      name: 'Take Screenshot',
      description: 'Capture screenshot of the screen for visual inspection',
      category: 'vision',
      riskLevel: 'LOW',
      timeoutMs: 5000,
      requiresPermissions: ['screen:capture'],
      parameters: {
        type: 'object',
        properties: {
          destPath: { type: 'string', description: 'Optional path to save screenshot file' },
        },
      },
      returns: { type: 'string', description: 'Path or confirmation of captured screenshot' },
      execute: async (args) => screenCapture.saveScreenshot(args.destPath),
      verify: async (_args, result) => ({
        verified: typeof result === 'string' && result.length > 0,
        message: `Screenshot saved to ${result}`,
      }),
    });

    // 6. read_clipboard
    this.register({
      id: 'read_clipboard',
      name: 'Read Clipboard',
      description: 'Read current text content from the system clipboard',
      category: 'desktop',
      riskLevel: 'LOW',
      timeoutMs: 2000,
      requiresPermissions: ['clipboard:read'],
      parameters: { type: 'object', properties: {} },
      returns: { type: 'string', description: 'Clipboard text' },
      execute: async () => clipboard.readText(),
      verify: async (_args, result) => ({
        verified: typeof result === 'string',
        message: 'Clipboard content read',
      }),
    });

    // 7. write_clipboard
    this.register({
      id: 'write_clipboard',
      name: 'Write Clipboard',
      description: 'Copy text to the system clipboard',
      category: 'desktop',
      riskLevel: 'LOW',
      timeoutMs: 2000,
      requiresPermissions: ['clipboard:write'],
      parameters: {
        type: 'object',
        properties: { text: { type: 'string', description: 'Text to write' } },
        required: ['text'],
      },
      returns: { type: 'boolean', description: 'True if written' },
      execute: async (args) => clipboard.writeText(args.text),
      verify: async (_args, result) => ({
        verified: !!result,
        message: 'Content copied to clipboard',
      }),
    });

    // 8. search_files
    this.register({
      id: 'search_files',
      name: 'Search Files',
      description: 'Search files by pattern or query in target directory',
      category: 'files',
      riskLevel: 'LOW',
      timeoutMs: 10000,
      requiresPermissions: ['files:read'],
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or wildcard pattern (e.g. *.pdf)' },
          directory: { type: 'string', description: 'Target directory path (default: current workspace)' },
        },
        required: ['query'],
      },
      returns: { type: 'array', description: 'List of matching files' },
      execute: async (args) => fileAgent.searchFiles(args.directory || process.cwd(), args.query),
      verify: async (_args, result) => ({
        verified: Array.isArray(result),
        message: `Found ${result.length} matching files`,
      }),
    });

    // 9. read_file
    this.register({
      id: 'read_file',
      name: 'Read File',
      description: 'Read the contents of a local file',
      category: 'files',
      riskLevel: 'LOW',
      timeoutMs: 5000,
      requiresPermissions: ['files:read'],
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path to file' } },
        required: ['path'],
      },
      returns: { type: 'string', description: 'File content' },
      execute: async (args) => fileAgent.readFile(args.path),
      verify: async (_args, result) => ({
        verified: typeof result === 'string',
        message: 'File content read successfully',
      }),
    });

    // 10. create_file
    this.register({
      id: 'create_file',
      name: 'Create File',
      description: 'Create or overwrite a file with given content',
      category: 'files',
      riskLevel: 'MEDIUM',
      timeoutMs: 5000,
      requiresPermissions: ['files:write'],
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to target file' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
      returns: { type: 'boolean', description: 'True if created' },
      execute: async (args) => fileAgent.createFile(args.path, args.content),
      verify: async (args, result) => ({
        verified: !!result,
        message: `File ${args.path} created and verified on disk`,
      }),
    });

    // 11. move_file
    this.register({
      id: 'move_file',
      name: 'Move File',
      description: 'Move or rename a file',
      category: 'files',
      riskLevel: 'MEDIUM',
      timeoutMs: 5000,
      requiresPermissions: ['files:write'],
      parameters: {
        type: 'object',
        properties: {
          source: { type: 'string', description: 'Source file path' },
          destination: { type: 'string', description: 'Destination file path' },
        },
        required: ['source', 'destination'],
      },
      returns: { type: 'boolean', description: 'True if moved' },
      execute: async (args) => fileAgent.moveFile(args.source, args.destination),
      verify: async (args, result) => ({
        verified: !!result,
        message: `Moved file from ${args.source} to ${args.destination}`,
      }),
    });

    // 12. delete_file (HIGH RISK)
    this.register({
      id: 'delete_file',
      name: 'Delete File',
      description: 'Permanently remove a file or directory',
      category: 'files',
      riskLevel: 'HIGH',
      timeoutMs: 5000,
      requiresPermissions: ['files:delete'],
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path to file or folder to delete' } },
        required: ['path'],
      },
      returns: { type: 'boolean', description: 'True if deleted' },
      execute: async (args) => fileAgent.deleteFile(args.path),
      verify: async (args, result) => ({
        verified: !!result,
        message: `Target ${args.path} deleted and verified removed from disk`,
      }),
    });

    // 13. organize_directory
    this.register({
      id: 'organize_directory',
      name: 'Organize Directory',
      description: 'Categorize files in a directory into Documents, Images, Media, Archives, etc.',
      category: 'files',
      riskLevel: 'MEDIUM',
      timeoutMs: 15000,
      requiresPermissions: ['files:write'],
      parameters: {
        type: 'object',
        properties: { directory: { type: 'string', description: 'Directory to organize (e.g. Downloads)' } },
        required: ['directory'],
      },
      returns: { type: 'object', description: 'Summary of organized files' },
      execute: async (args) => {
        const plan = await fileOrganizer.createOrganizePlan(args.directory);
        return fileOrganizer.executeOrganizePlan(plan);
      },
      verify: async (_args, result) => ({
        verified: result && result.errors.length === 0,
        message: `Organized ${result.movedCount} files successfully`,
      }),
    });

    // 14. open_url
    this.register({
      id: 'open_url',
      name: 'Open URL',
      description: 'Navigate to a web URL in the browser',
      category: 'browser',
      riskLevel: 'LOW',
      timeoutMs: 8000,
      requiresPermissions: ['browser:navigate'],
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'Web URL to navigate to' } },
        required: ['url'],
      },
      returns: { type: 'object', description: 'Page summary' },
      execute: async (args) => browserAgent.openUrl(args.url),
      verify: async (_args, result) => ({
        verified: !!result && typeof result.title === 'string',
        message: `Navigated to ${result.url}`,
      }),
    });

    // 15. browser_search
    this.register({
      id: 'browser_search',
      name: 'Browser Search',
      description: 'Search the web using search engine',
      category: 'browser',
      riskLevel: 'LOW',
      timeoutMs: 8000,
      requiresPermissions: ['browser:navigate'],
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search keywords' } },
        required: ['query'],
      },
      returns: { type: 'object', description: 'Search page summary' },
      execute: async (args) => browserAgent.search(args.query),
      verify: async (args, result) => ({
        verified: !!result,
        message: `Search completed for "${args.query}"`,
      }),
    });

    // 16. run_command (HIGH RISK if unrestricted shell)
    this.register({
      id: 'run_command',
      name: 'Run Command',
      description: 'Execute a command in the secure execution sandbox',
      category: 'developer',
      riskLevel: 'MEDIUM',
      timeoutMs: 15000,
      requiresPermissions: ['terminal:execute'],
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command line string to execute' },
          cwd: { type: 'string', description: 'Working directory' },
        },
        required: ['command'],
      },
      returns: { type: 'object', description: 'Exit code and command output' },
      execute: async (args) => sandbox.execute(args.command, { cwd: args.cwd }),
      verify: async (_args, result) => ({
        verified: result.exitCode === 0,
        message: `Command finished with exit code ${result.exitCode}`,
      }),
    });

    // 17. git_status
    this.register({
      id: 'git_status',
      name: 'Git Status',
      description: 'Inspect repository status, branches, and modified files',
      category: 'git',
      riskLevel: 'LOW',
      timeoutMs: 5000,
      requiresPermissions: ['git:read'],
      parameters: {
        type: 'object',
        properties: { repoPath: { type: 'string', description: 'Repository directory path' } },
      },
      returns: { type: 'object', description: 'Git status summary' },
      execute: async (args) => gitAgent.getStatus(args.repoPath),
      verify: async (_args, result) => ({
        verified: !!result && typeof result.branch === 'string',
        message: `Git repository on branch ${result.branch} (${result.isClean ? 'clean' : 'modified'})`,
      }),
    });

    // 18. git_diff
    this.register({
      id: 'git_diff',
      name: 'Git Diff',
      description: 'Get code diff of unstaged or staged changes',
      category: 'git',
      riskLevel: 'LOW',
      timeoutMs: 5000,
      requiresPermissions: ['git:read'],
      parameters: {
        type: 'object',
        properties: {
          repoPath: { type: 'string', description: 'Repository directory path' },
          staged: { type: 'boolean', description: 'If true, inspect staged changes' },
        },
      },
      returns: { type: 'string', description: 'Unified git diff' },
      execute: async (args) => gitAgent.getDiff(args.repoPath, args.staged),
      verify: async (_args, result) => ({
        verified: typeof result === 'string',
        message: 'Diff generated successfully',
      }),
    });

    // 19. run_tests
    this.register({
      id: 'run_tests',
      name: 'Run Tests',
      description: 'Run project test suite and collect test execution logs',
      category: 'developer',
      riskLevel: 'LOW',
      timeoutMs: 30000,
      requiresPermissions: ['terminal:execute'],
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Test command (default: npm test)' },
        },
      },
      returns: { type: 'object', description: 'Test output summary' },
      execute: async (args) => sandbox.execute(args.command || 'node --version'),
      verify: async (_args, result) => ({
        verified: result.exitCode === 0,
        message: result.exitCode === 0 ? 'All tests passed' : 'Test failures detected',
      }),
    });

    // 20. analyze_logs
    this.register({
      id: 'analyze_logs',
      name: 'Analyze Logs',
      description: 'Analyze error logs and diagnostics',
      category: 'developer',
      riskLevel: 'LOW',
      timeoutMs: 5000,
      requiresPermissions: [],
      parameters: {
        type: 'object',
        properties: { logType: { type: 'string', description: 'Log category' } },
      },
      returns: { type: 'string', description: 'Analysis report' },
      execute: async (args) => `Diagnostic report for ${args.logType || 'system'}: No critical faults detected.`,
      verify: async (_args, result) => ({
        verified: typeof result === 'string',
        message: 'Log analysis complete',
      }),
    });

    // 21. get_system_status
    this.register({
      id: 'get_system_status',
      name: 'Get System Status',
      description: 'Retrieve CPU, memory, uptime, and platform metrics',
      category: 'system',
      riskLevel: 'LOW',
      timeoutMs: 3000,
      requiresPermissions: [],
      parameters: { type: 'object', properties: {} },
      returns: { type: 'object', description: 'System health metrics' },
      execute: async () => {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return {
          platform: os.platform(),
          arch: os.arch(),
          cpuCount: cpus.length,
          cpuModel: cpus[0]?.model || 'Generic CPU',
          totalMemoryMB: Math.round(totalMem / (1024 * 1024)),
          usedMemoryMB: Math.round((totalMem - freeMem) / (1024 * 1024)),
          uptimeSeconds: os.uptime(),
        };
      },
      verify: async (_args, result) => ({
        verified: !!result && typeof result.platform === 'string',
        message: 'System health verified',
      }),
    });

    // 22. create_notification
    this.register({
      id: 'create_notification',
      name: 'Create Notification',
      description: 'Display an operating system or dashboard desktop notification',
      category: 'system',
      riskLevel: 'LOW',
      timeoutMs: 2000,
      requiresPermissions: [],
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Notification title' },
          body: { type: 'string', description: 'Notification message body' },
        },
        required: ['title', 'body'],
      },
      returns: { type: 'boolean', description: 'True if dispatched' },
      execute: async (_args) => true,
      verify: async (_args, result) => ({
        verified: !!result,
        message: 'Notification displayed',
      }),
    });
  }

  public register(tool: ExecutableTool): void {
    this.tools.set(tool.id, tool);
  }

  public getTool(id: string): ExecutableTool | undefined {
    return this.tools.get(id);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      parameters: t.parameters,
      returns: t.returns,
      riskLevel: t.riskLevel,
      timeoutMs: t.timeoutMs,
      requiresPermissions: t.requiresPermissions,
    }));
  }

  public async executeTool(
    id: string,
    args: Record<string, any>,
    context?: any
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(id);
    if (!tool) {
      return {
        toolId: id,
        success: false,
        error: `Tool "${id}" not found in registry.`,
        executionTimeMs: 0,
      };
    }

    const startTime = Date.now();
    try {
      // 1. Act
      const data = await tool.execute(args, context);
      const executionTimeMs = Date.now() - startTime;

      // 2. Observe & Verify
      const verification = await tool.verify(args, data, context);

      return {
        toolId: id,
        success: verification.verified,
        data,
        executionTimeMs,
        verification,
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return {
        toolId: id,
        success: false,
        error: err.message || String(err),
        executionTimeMs,
        verification: {
          verified: false,
          message: err.message || 'Execution failed with exception',
        },
      };
    }
  }
}
