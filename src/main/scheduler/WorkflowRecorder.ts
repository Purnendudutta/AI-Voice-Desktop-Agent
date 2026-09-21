import { AutomationWorkflow } from '../../shared/types/memory';
import { AppDatabase } from '../memory/Database';

export class WorkflowRecorder {
  private isRecording = false;
  private recordedSteps: AutomationWorkflow['steps'] = [];

  constructor() {}

  public startRecording(): void {
    this.isRecording = true;
    this.recordedSteps = [];
  }

  public recordStep(toolId: string, args: Record<string, unknown>): void {
    if (!this.isRecording) return;
    this.recordedSteps.push({
      toolId,
      arguments: args,
      verify: true,
    });
  }

  public stopRecording(name: string, description?: string): AutomationWorkflow {
    this.isRecording = false;
    const workflow: AutomationWorkflow = {
      id: `wf_${Date.now()}`,
      name,
      description: description || `Recorded workflow with ${this.recordedSteps.length} steps`,
      trigger: { type: 'manual' },
      steps: [...this.recordedSteps],
      enabled: true,
      createdAt: Date.now(),
    };
    this.recordedSteps = [];
    return workflow;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}
