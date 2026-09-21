import { Agent } from '../agent/Agent';
import { AppConfig } from '../../shared/types/config';

export interface BenchmarkTaskResult {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed';
  executionTimeMs: number;
  retries: number;
  recovered: boolean;
  permissionRequested: boolean;
  details: string;
}

export interface BenchmarkSummary {
  timestamp: number;
  totalTasks: number;
  passedTasks: number;
  successRatePercent: number;
  averageExecutionTimeMs: number;
  totalRetries: number;
  recoveryRatePercent: number;
  results: BenchmarkTaskResult[];
}

export class BenchmarkRunner {
  private agent: Agent;
  private config: AppConfig;

  constructor(agent: Agent, config: AppConfig) {
    this.agent = agent;
    this.config = config;
  }

  public async runFullSuite(): Promise<BenchmarkSummary> {
    const tasks = [
      { id: 'bench_1', name: 'Open Application Verification', goal: 'Open Visual Studio Code' },
      { id: 'bench_2', name: 'Natural Language File Search', goal: 'Find all PDF files in Downloads' },
      { id: 'bench_3', name: 'File Organization Plan', goal: 'Organize my Downloads folder' },
      { id: 'bench_4', name: 'Developer Workspace Startup', goal: 'Prepare my development workspace' },
      { id: 'bench_5', name: 'Test Execution & Diagnostic', goal: 'Run the tests and tell me what failed' },
      { id: 'bench_6', name: 'Browser Documentation Research', goal: 'Open the documentation for Gemini Live API' },
      { id: 'bench_7', name: 'Multi-App Workflow Setup', goal: 'Prepare my meeting workspace' },
      { id: 'bench_8', name: 'Failure & Recovery Loop', goal: 'Execute safe retry diagnostic' },
      { id: 'bench_9', name: 'High-Risk Permission Gating', goal: 'Delete temporary cache files' },
      { id: 'bench_10', name: 'Git Status & Code Review', goal: 'Review my code before I push it' },
    ];

    const results: BenchmarkTaskResult[] = [];
    const startTime = Date.now();

    for (const t of tasks) {
      const taskStart = Date.now();
      try {
        const plan = await this.agent.handleUserGoal(t.goal);
        const duration = Date.now() - taskStart;
        const passed = plan.status === 'completed' || plan.status === 'confirming';
        const retries = plan.steps.reduce((acc, s) => acc + s.recoveryAttempts, 0);

        results.push({
          id: t.id,
          name: t.name,
          category: 'Core Agent Evaluation',
          status: passed ? 'passed' : 'failed',
          executionTimeMs: duration,
          retries,
          recovered: retries > 0 && passed,
          permissionRequested: plan.requiresConfirmation,
          details: plan.summary || `Executed ${plan.steps.length} steps`,
        });
      } catch (err: any) {
        results.push({
          id: t.id,
          name: t.name,
          category: 'Core Agent Evaluation',
          status: 'failed',
          executionTimeMs: Date.now() - taskStart,
          retries: 0,
          recovered: false,
          permissionRequested: false,
          details: err.message || 'Exception during execution',
        });
      }
    }

    const passedCount = results.filter((r) => r.status === 'passed').length;
    const totalTime = Date.now() - startTime;
    const totalRetries = results.reduce((acc, r) => acc + r.retries, 0);
    const recoveredCount = results.filter((r) => r.recovered).length;

    return {
      timestamp: Date.now(),
      totalTasks: results.length,
      passedTasks: passedCount,
      successRatePercent: Math.round((passedCount / results.length) * 100),
      averageExecutionTimeMs: Math.round(totalTime / results.length),
      totalRetries,
      recoveryRatePercent: totalRetries > 0 ? Math.round((recoveredCount / totalRetries) * 100) : 100,
      results,
    };
  }
}
