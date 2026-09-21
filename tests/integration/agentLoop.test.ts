import { describe, it, expect } from 'vitest';
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

describe('Agent Core Execution Loop (Observe-Act-Verify-Recover)', () => {
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

  it('runs complete developer workspace startup task to completion', async () => {
    const plan = await agent.handleUserGoal('Prepare my development workspace');
    expect(plan.status).toBe('completed');
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    for (const step of plan.steps) {
      expect(step.status).toBe('completed');
      expect(step.verification?.verified).toBe(true);
    }
    expect(agent.getState()).toBe('idle');
  });

  it('gates high-risk plan behind user confirmation', async () => {
    let capturedReq: any = null;
    permissionEngine.setPromptCallback((req) => {
      capturedReq = req;
      // Auto-approve after a microtick
      setTimeout(() => {
        permissionEngine.handleDecision({
          requestId: req.id,
          approved: true,
          decidedAt: Date.now(),
        });
      }, 50);
    });

    const plan = await agent.handleUserGoal('Delete old temporary files');
    expect(capturedReq).toBeDefined();
    expect(plan.overallRiskLevel).toBe('HIGH');
  });

  it('supports task cancellation during execution', async () => {
    taskManager.setActivePlan({
      taskId: 'test_cancel',
      goal: 'Long running task',
      status: 'executing',
      priority: 'normal',
      steps: [],
      currentStepIndex: 0,
      requiredTools: [],
      overallRiskLevel: 'LOW',
      requiresConfirmation: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const cancelled = await agent.cancelActiveTask();
    expect(cancelled).toBe(true);
    expect(taskManager.getActivePlan()?.status).toBe('cancelled');
  });
});
