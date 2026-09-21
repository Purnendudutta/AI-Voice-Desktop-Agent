import { WorkspaceConfig } from '../../shared/types/memory';
import { AppDatabase } from '../memory/Database';
import { WindowManager } from '../desktop/WindowManager';
import { BrowserAgent } from '../browser/BrowserAgent';
import { CommandSandbox } from '../security/CommandSandbox';

export class WorkspaceManager {
  private db: AppDatabase;
  private windowManager: WindowManager;
  private browserAgent: BrowserAgent;
  private sandbox: CommandSandbox;

  constructor(
    db: AppDatabase,
    windowManager: WindowManager,
    browserAgent: BrowserAgent,
    sandbox: CommandSandbox
  ) {
    this.db = db;
    this.windowManager = windowManager;
    this.browserAgent = browserAgent;
    this.sandbox = sandbox;
    this.initDefaultWorkspaces();
  }

  private initDefaultWorkspaces(): void {
    const existing = this.db.getWorkspaces();
    if (existing.length === 0) {
      const defaults: WorkspaceConfig[] = [
        {
          id: 'ws_dev',
          name: 'Development',
          description: 'Full stack development setup with VS Code, localhost, and terminal',
          applications: ['Visual Studio Code'],
          urls: ['http://localhost:5173', 'https://github.com'],
          directories: [process.cwd()],
          startupCommands: ['git status'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'ws_study',
          name: 'Study & Research',
          description: 'Focus mode with browser research tabs and documentation',
          applications: [],
          urls: ['https://en.wikipedia.org', 'https://arxiv.org'],
          directories: [],
          startupCommands: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'ws_meeting',
          name: 'Meeting',
          description: 'Clean workspace prepared for presentations or video calls',
          applications: [],
          urls: ['https://meet.google.com'],
          directories: [],
          startupCommands: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      for (const ws of defaults) {
        this.db.saveWorkspace(ws);
      }
    }
  }

  public listWorkspaces(): WorkspaceConfig[] {
    return this.db.getWorkspaces();
  }

  public async restoreWorkspace(workspaceId: string): Promise<boolean> {
    const workspaces = this.db.getWorkspaces();
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (!ws) {
      throw new Error(`Workspace with id ${workspaceId} not found.`);
    }

    // 1. Launch applications
    for (const app of ws.applications) {
      const targetDir = ws.directories[0] || process.cwd();
      await this.windowManager.launchApplication(app, targetDir);
    }

    // 2. Open URLs
    for (const url of ws.urls) {
      await this.browserAgent.openUrl(url);
    }

    // 3. Execute startup commands
    for (const cmd of ws.startupCommands) {
      try {
        await this.sandbox.execute(cmd, { cwd: ws.directories[0] || process.cwd() });
      } catch {
        // ignore command failure during startup
      }
    }

    return true;
  }
}
