import { TaskPlan, TaskStep, TaskStatus, StepStatus } from '../../shared/types/agent';

export class TaskManager {
  private currentPlan: TaskPlan | null = null;
  private isCancelled = false;
  private onPlanUpdated?: (plan: TaskPlan) => void;

  public setUpdateListener(listener: (plan: TaskPlan) => void): void {
    this.onPlanUpdated = listener;
  }

  public setActivePlan(plan: TaskPlan): void {
    this.currentPlan = plan;
    this.isCancelled = false;
    this.emitUpdate();
  }

  public getActivePlan(): TaskPlan | null {
    return this.currentPlan;
  }

  public updateTaskStatus(status: TaskStatus, summary?: string, error?: string): void {
    if (!this.currentPlan) return;
    this.currentPlan.status = status;
    this.currentPlan.updatedAt = Date.now();
    if (summary) this.currentPlan.summary = summary;
    if (error) this.currentPlan.error = error;
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      this.currentPlan.completedAt = Date.now();
    }
    this.emitUpdate();
  }

  public updateStep(
    stepIndex: number,
    updates: Partial<TaskStep>
  ): void {
    if (!this.currentPlan || !this.currentPlan.steps[stepIndex]) return;
    const step = this.currentPlan.steps[stepIndex];
    Object.assign(step, updates);
    this.currentPlan.currentStepIndex = stepIndex;
    this.currentPlan.updatedAt = Date.now();
    this.emitUpdate();
  }

  public cancelActiveTask(): boolean {
    if (!this.currentPlan || this.currentPlan.status === 'completed') {
      return false;
    }
    this.isCancelled = true;
    this.updateTaskStatus('cancelled', 'Task was cancelled by user request.');
    return true;
  }

  public checkCancelled(): boolean {
    return this.isCancelled;
  }

  private emitUpdate(): void {
    if (this.currentPlan && this.onPlanUpdated) {
      this.onPlanUpdated({ ...this.currentPlan, steps: [...this.currentPlan.steps] });
    }
  }
}
