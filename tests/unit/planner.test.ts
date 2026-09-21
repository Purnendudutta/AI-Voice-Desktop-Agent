import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../../src/main/ai/MockAIProvider';

describe('Planner & Task Decomposition', () => {
  const provider = new MockAIProvider();

  it('decomposes a complex developer goal into operational steps', async () => {
    const plan = await provider.planTask('Prepare my development workspace', [], undefined, 'Atlas');
    expect(plan.taskId).toBeDefined();
    expect(plan.goal).toBe('Prepare my development workspace');
    expect(plan.steps.length).toBeGreaterThanOrEqual(4);
    expect(plan.steps[0].title).toBe('Detecting current project');
    expect(plan.steps[1].title).toBe('Opening VS Code');
    expect(plan.steps[2].title).toBe('Starting backend service');
    expect(plan.steps[3].title).toBe('Verifying services health');
    expect(plan.status).toBe('planning');
  });

  it('categorizes file deletion as high risk requiring confirmation', async () => {
    const plan = await provider.planTask('Delete old temporary files', [], undefined, 'Atlas');
    expect(plan.overallRiskLevel).toBe('HIGH');
    expect(plan.requiresConfirmation).toBe(true);
    const deleteStep = plan.steps.find((s) => s.tool === 'delete_file');
    expect(deleteStep).toBeDefined();
    expect(deleteStep?.riskLevel).toBe('HIGH');
    expect(deleteStep?.requiresConfirmation).toBe(true);
  });

  it('plans file organization workflow with categorization', async () => {
    const plan = await provider.planTask('Organize my Downloads folder', [], undefined, 'Atlas');
    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0].tool).toBe('search_files');
    expect(plan.steps[1].tool).toBe('organize_directory');
  });

  it('plans test running and failure diagnostics', async () => {
    const plan = await provider.planTask('Run the tests and tell me what failed', [], undefined, 'Atlas');
    expect(plan.steps.length).toBe(2);
    expect(plan.steps[0].tool).toBe('run_tests');
    expect(plan.steps[1].tool).toBe('analyze_logs');
  });
});
