import { AutomationWorkflow } from '../../shared/types/memory';
import { AppDatabase } from '../memory/Database';
import { ToolRegistry } from '../tools/ToolRegistry';

export class SchedulerService {
  private db: AppDatabase;
  private toolRegistry: ToolRegistry;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(db: AppDatabase, toolRegistry: ToolRegistry) {
    this.db = db;
    this.toolRegistry = toolRegistry;
    this.initDefaultWorkflows();
    this.startScheduler();
  }

  private initDefaultWorkflows(): void {
    const existing = this.db.getWorkflows();
    if (existing.length === 0) {
      const defaults: AutomationWorkflow[] = [
        {
          id: 'wf_morning_dev',
          name: 'Morning Development Prep',
          description: 'Open development project, check Git status, and check system health',
          trigger: { type: 'cron', cronExpression: '0 9 * * 1-5' },
          steps: [
            { toolId: 'git_status', arguments: {}, verify: true },
            { toolId: 'get_system_status', arguments: {}, verify: true },
            {
              toolId: 'create_notification',
              arguments: { title: 'Workspace Ready', body: 'Development environment checked and active.' },
              verify: true,
            },
          ],
          enabled: true,
          createdAt: Date.now(),
        },
      ];
      for (const wf of defaults) {
        this.db.saveWorkflow(wf);
      }
    }
  }

  public startScheduler(): void {
    if (this.intervalId) return;
    // Check every 60 seconds
    this.intervalId = setInterval(() => {
      this.checkScheduledWorkflows();
    }, 60000);
  }

  public stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkScheduledWorkflows(): void {
    // Basic schedule check
  }

  public async runWorkflow(workflowId: string): Promise<boolean> {
    const workflows = this.db.getWorkflows();
    const wf = workflows.find((w) => w.id === workflowId);
    if (!wf) return false;

    let allSuccess = true;
    for (const step of wf.steps) {
      const res = await this.toolRegistry.executeTool(step.toolId, step.arguments);
      if (!res.success) {
        allSuccess = false;
        break;
      }
    }

    wf.lastRunAt = Date.now();
    wf.lastRunStatus = allSuccess ? 'success' : 'failed';
    this.db.saveWorkflow(wf);
    return allSuccess;
  }
}
