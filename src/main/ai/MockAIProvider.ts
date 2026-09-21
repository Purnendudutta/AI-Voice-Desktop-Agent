import { AIProvider } from './AIProvider';
import { ToolDefinition } from '../../shared/types/tools';
import { TaskPlan, TaskStep, DesktopContext } from '../../shared/types/agent';
import { RiskLevel } from '../../shared/types/permissions';

export class MockAIProvider implements AIProvider {
  public id = 'mock';
  public name = 'Deterministic Mock & Offline Provider';

  public async generate(prompt: string): Promise<string> {
    if (prompt.toLowerCase().includes('workspace')) {
      return 'Development workspace prepared with active services verified.';
    }
    if (prompt.toLowerCase().includes('test')) {
      return 'Analyzed 1 failed test in src/agent/Planner.test.ts. Expected status code 200, got 500.';
    }
    return `Processed request: "${prompt}". All operations completed successfully.`;
  }

  public async stream(
    prompt: string,
    onDelta: (chunk: string) => void
  ): Promise<string> {
    const response = await this.generate(prompt);
    const words = response.split(' ');
    for (const word of words) {
      onDelta(word + ' ');
      await new Promise((r) => setTimeout(r, 10));
    }
    return response;
  }

  public async planTask(
    goal: string,
    _availableTools: ToolDefinition[],
    _context?: DesktopContext,
    _agentName = 'Agent'
  ): Promise<TaskPlan> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const lower = goal.toLowerCase();
    const steps: TaskStep[] = [];

    if (lower.includes('workspace') || lower.includes('dev')) {
      steps.push(
        {
          id: `step_${taskId}_1`,
          order: 1,
          title: 'Detecting current project',
          description: 'Locate git repository and project manifest in active workspace',
          tool: 'git_status',
          arguments: { repoPath: process.cwd() },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_2`,
          order: 2,
          title: 'Opening VS Code',
          description: 'Launch VS Code editor targeting the current project directory',
          tool: 'open_application',
          arguments: { appName: 'Visual Studio Code', path: process.cwd() },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_3`,
          order: 3,
          title: 'Starting backend service',
          description: 'Execute npm run dev for API server',
          tool: 'run_command',
          arguments: { command: 'node --version' },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_4`,
          order: 4,
          title: 'Verifying services health',
          description: 'Check active windows and local system responsiveness',
          tool: 'get_system_status',
          arguments: {},
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        }
      );
    } else if (lower.includes('download') || lower.includes('organize')) {
      steps.push(
        {
          id: `step_${taskId}_1`,
          order: 1,
          title: 'Scanning Downloads directory',
          description: 'List all files and categorize by type and date',
          tool: 'search_files',
          arguments: { query: '*', directory: 'Downloads' },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_2`,
          order: 2,
          title: 'Organizing categorized files',
          description: 'Move matching files to appropriate subdirectories',
          tool: 'organize_directory',
          arguments: { directory: 'Downloads' },
          status: 'pending',
          riskLevel: 'MEDIUM',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        }
      );
    } else if (lower.includes('test')) {
      steps.push(
        {
          id: `step_${taskId}_1`,
          order: 1,
          title: 'Executing test runner',
          description: 'Run project test suite through secure sandbox',
          tool: 'run_tests',
          arguments: { command: 'node --version' },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_2`,
          order: 2,
          title: 'Analyzing test results',
          description: 'Parse stdout/stderr for test failures and stack traces',
          tool: 'analyze_logs',
          arguments: { logType: 'test' },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        }
      );
    } else if (lower.includes('delete') || lower.includes('remove') || lower.includes('clean')) {
      steps.push(
        {
          id: `step_${taskId}_1`,
          order: 1,
          title: 'Finding target files to delete',
          description: 'Search for stale temporary files',
          tool: 'search_files',
          arguments: { query: '*.tmp' },
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_2`,
          order: 2,
          title: 'Deleting matching files',
          description: 'Remove identified temporary files permanently',
          tool: 'delete_file',
          arguments: { path: './temp.tmp' },
          status: 'pending',
          riskLevel: 'HIGH',
          requiresConfirmation: true,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        }
      );
    } else if (lower.includes('git') || lower.includes('commit') || lower.includes('diff')) {
      steps.push(
        {
          id: `step_${taskId}_1`,
          order: 1,
          title: 'Checking Git repository status',
          description: 'Inspect modified, untracked, and staged files',
          tool: 'git_status',
          arguments: {},
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        },
        {
          id: `step_${taskId}_2`,
          order: 2,
          title: 'Generating changes diff',
          description: 'Inspect precise code modifications',
          tool: 'git_diff',
          arguments: {},
          status: 'pending',
          riskLevel: 'LOW',
          requiresConfirmation: false,
          recoveryAttempts: 0,
          maxRecoveryAttempts: 2,
        }
      );
    } else if (
      lower.includes('terminal') ||
      lower.includes('powershell') ||
      lower.includes('command prompt') ||
      lower === 'cmd'
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Opening Terminal',
        description: 'Launch system terminal or PowerShell console',
        tool: 'open_application',
        arguments: { appName: 'terminal' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (
      lower.includes('notepad') ||
      lower.includes('text editor')
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Opening Notepad',
        description: 'Launch Windows Notepad editor',
        tool: 'open_application',
        arguments: { appName: 'notepad' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (
      lower.includes('calc') ||
      lower.includes('calculator')
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Opening Calculator',
        description: 'Launch system calculator utility',
        tool: 'open_application',
        arguments: { appName: 'calc' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (
      lower.includes('chrome') ||
      lower.includes('browser')
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Opening Web Browser',
        description: 'Launch Google Chrome web browser',
        tool: 'open_application',
        arguments: { appName: 'chrome' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (lower.startsWith('open ') || lower.startsWith('launch ')) {
      const targetApp = goal.replace(/^(open|launch)\s+/i, '').trim();
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: `Opening ${targetApp}`,
        description: `Launch desktop application ${targetApp}`,
        tool: 'open_application',
        arguments: { appName: targetApp },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (lower.startsWith('close ') || lower.startsWith('kill ') || lower.startsWith('exit ')) {
      const targetApp = goal.replace(/^(close|kill|exit)\s+/i, '').trim();
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: `Closing ${targetApp}`,
        description: `Close application ${targetApp}`,
        tool: 'close_application',
        arguments: { appName: targetApp },
        status: 'pending',
        riskLevel: 'MEDIUM',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (lower.includes('screenshot') || lower.includes('capture screen')) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Capturing Desktop Screen',
        description: 'Capture active screen for visual diagnosis',
        tool: 'capture_screen',
        arguments: {},
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (lower.includes('search') || lower.includes('find file')) {
      const query = goal.replace(/^(search|find|look for)\s*(files?)?\s*(for)?\s*/i, '').trim() || '*';
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: `Searching for files matching "${query}"`,
        description: 'Search workspace files matching query',
        tool: 'search_files',
        arguments: { query, directory: '.' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (
      lower.includes('explorer') ||
      lower.includes('file manager') ||
      lower === 'files' ||
      lower === 'open files'
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: 'Opening File Explorer',
        description: 'Launch Windows File Explorer',
        tool: 'open_application',
        arguments: { appName: 'explorer' },
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else if (
      lower.includes('hello') ||
      lower.includes('hi') ||
      lower.includes('who are you') ||
      lower.includes('what can you do') ||
      lower.includes('help')
    ) {
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: `Assisting user query: "${goal.substring(0, 30)}"`,
        description: `I am ${_agentName}, your desktop AI operating layer. I can launch applications (terminal, notepad, calculator, browser), inspect git repos, run tests, organize files, and automate desktop workflows.`,
        tool: 'get_system_status',
        arguments: {},
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    } else {
      // Default general step
      steps.push({
        id: `step_${taskId}_1`,
        order: 1,
        title: `Executing request: ${goal.substring(0, 30)}`,
        description: goal,
        tool: 'get_system_status',
        arguments: {},
        status: 'pending',
        riskLevel: 'LOW',
        requiresConfirmation: false,
        recoveryAttempts: 0,
        maxRecoveryAttempts: 2,
      });
    }

    const hasHighRisk = steps.some((s) => s.riskLevel === 'HIGH');

    return {
      taskId,
      goal,
      status: 'planning',
      priority: 'normal',
      steps,
      currentStepIndex: 0,
      requiredTools: Array.from(new Set(steps.map((s) => s.tool))),
      overallRiskLevel: hasHighRisk ? 'HIGH' : 'LOW',
      requiresConfirmation: hasHighRisk,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  public async analyzeScreen(_imageBuffer: Buffer, _prompt: string): Promise<string> {
    return 'Screen Analysis: Detected desktop environment with Visual Studio Code window focused, active terminal showing port 5173 listening.';
  }

  public async embed(_text: string): Promise<number[]> {
    return new Array(64).fill(0.1);
  }
}
