import { describe, it, expect } from 'vitest';
import { BenchmarkRunner } from '../../src/main/telemetry/BenchmarkRunner';
import { Agent } from '../../src/main/agent/Agent';
import { TaskManager } from '../../src/main/agent/TaskManager';
import { RecoveryEngine } from '../../src/main/agent/RecoveryEngine';
import { ContextEngine } from '../../src/main/agent/ContextEngine';
import { ModelRouter } from '../../src/main/ai/ModelRouter';
import { ToolRegistry } from '../../src/main/tools/ToolRegistry';
import { PermissionEngine } from '../../src/main/security/PermissionEngine';
import { CommandSandbox } from '../../src/main/security/CommandSandbox';
import { AuditLogger } from '../../src/main/security/AuditLogger';
import { MemoryStore } from '../../src/main/memory/MemoryStore';
import { WindowManager } from '../../src/main/desktop/WindowManager';
import { ScreenCapture } from '../../src/main/desktop/ScreenCapture';
import { ClipboardManager } from '../../src/main/desktop/ClipboardManager';
import { FileAgent } from '../../src/main/files/FileAgent';
import { FileOrganizer } from '../../src/main/files/FileOrganizer';
import { GitAgent } from '../../src/main/git/GitAgent';
import { BrowserAgent } from '../../src/main/browser/BrowserAgent';
import { DEFAULT_CONFIG } from '../../src/shared/constants/defaults';

describe('Automated Agent Evaluation Benchmarks', () => {
  const config = {
    ...DEFAULT_CONFIG,
    identity: {
      ...DEFAULT_CONFIG.identity,
      agentName: 'Atlas',
    },
    ai: {
      ...DEFAULT_CONFIG.ai,
      provider: 'mock' as const,
    },
  };

  const auditLogger = new AuditLogger();
  const permissionEngine = new PermissionEngine(config);
  // Auto-approve during benchmark runs
  permissionEngine.setPromptCallback((req) => {
    setTimeout(() => {
      permissionEngine.handleDecision({
        requestId: req.id,
        approved: true,
        decidedAt: Date.now(),
      });
    }, 20);
  });

  const sandbox = new CommandSandbox(config.security);
  const memoryStore = new MemoryStore();
  const windowManager = new WindowManager();
  const screenCapture = new ScreenCapture();
  const clipboard = new ClipboardManager();
  const fileAgent = new FileAgent();
  const fileOrganizer = new FileOrganizer(fileAgent);
  const gitAgent = new GitAgent(sandbox);
  const browserAgent = new BrowserAgent();

  const toolRegistry = new ToolRegistry(
    windowManager,
    screenCapture,
    clipboard,
    fileAgent,
    fileOrganizer,
    gitAgent,
    browserAgent,
    sandbox
  );

  const modelRouter = new ModelRouter(config);
  const contextEngine = new ContextEngine(windowManager, clipboard, memoryStore);
  const taskManager = new TaskManager();
  const recoveryEngine = new RecoveryEngine(toolRegistry);

  const agent = new Agent(
    config,
    modelRouter,
    toolRegistry,
    permissionEngine,
    auditLogger,
    contextEngine,
    taskManager,
    recoveryEngine,
    memoryStore
  );

  const runner = new BenchmarkRunner(agent, config);

  it('executes the full 10-task evaluation benchmark suite successfully', async () => {
    const summary = await runner.runFullSuite();
    expect(summary.totalTasks).toBe(10);
    expect(summary.passedTasks).toBe(10);
    expect(summary.successRatePercent).toBe(100);
    expect(summary.averageExecutionTimeMs).toBeGreaterThan(0);
    expect(summary.results.length).toBe(10);

    // Verify task categories
    const tasks = summary.results.map((r) => r.name);
    expect(tasks).toContain('Open Application Verification');
    expect(tasks).toContain('Natural Language File Search');
    expect(tasks).toContain('File Organization Plan');
    expect(tasks).toContain('Developer Workspace Startup');
    expect(tasks).toContain('Test Execution & Diagnostic');
    expect(tasks).toContain('Browser Documentation Research');
    expect(tasks).toContain('Multi-App Workflow Setup');
    expect(tasks).toContain('Failure & Recovery Loop');
    expect(tasks).toContain('High-Risk Permission Gating');
    expect(tasks).toContain('Git Status & Code Review');
  });
});
