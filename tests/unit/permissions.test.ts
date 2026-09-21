import { describe, it, expect } from 'vitest';
import { PermissionEngine } from '../../src/main/security/PermissionEngine';
import { DEFAULT_CONFIG } from '../../src/shared/constants/defaults';

describe('Permission Engine & Risk Evaluation', () => {
  it('allows LOW and MEDIUM risk operations by default', () => {
    const engine = new PermissionEngine(DEFAULT_CONFIG);
    expect(engine.evaluateRisk('search_files', 'LOW')).toBe('ALLOW');
    expect(engine.evaluateRisk('move_file', 'MEDIUM')).toBe('ALLOW');
  });

  it('requires CONFIRM for HIGH risk operations by default', () => {
    const engine = new PermissionEngine(DEFAULT_CONFIG);
    expect(engine.evaluateRisk('delete_file', 'HIGH')).toBe('CONFIRM');
  });

  it('blocks HIGH risk when configured to BLOCK in security settings', () => {
    const config = {
      ...DEFAULT_CONFIG,
      security: {
        ...DEFAULT_CONFIG.security,
        defaultActionForHighRisk: 'BLOCK' as const,
      },
    };
    const engine = new PermissionEngine(config);
    expect(engine.evaluateRisk('delete_file', 'HIGH')).toBe('BLOCK');
  });

  it('handles asynchronous user confirmation workflow', async () => {
    const engine = new PermissionEngine(DEFAULT_CONFIG);
    let capturedReq: any = null;
    engine.setPromptCallback((req) => {
      capturedReq = req;
    });

    const promise = engine.requestPermission({
      taskId: 'task_1',
      stepId: 'step_1',
      toolId: 'delete_file',
      toolName: 'Delete File',
      riskLevel: 'HIGH',
      title: 'Confirm Delete',
      description: 'Delete files',
      affectedResources: ['/tmp/junk.txt'],
      arguments: {},
    });

    expect(capturedReq).toBeDefined();
    expect(capturedReq.toolId).toBe('delete_file');

    // Simulate user approving
    engine.handleDecision({
      requestId: capturedReq.id,
      approved: true,
      decidedAt: Date.now(),
    });

    const approved = await promise;
    expect(approved).toBe(true);
  });
});
