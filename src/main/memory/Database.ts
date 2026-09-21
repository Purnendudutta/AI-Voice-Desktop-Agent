import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { AppConfig } from '../../shared/types/config';
import { DEFAULT_CONFIG } from '../../shared/constants/defaults';
import { WorkspaceConfig, AutomationWorkflow, PluginManifest } from '../../shared/types/memory';

export class AppDatabase {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;

  constructor(customPath?: string) {
    const dataDir = customPath || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // fallback
      }
    }
    this.dbPath = path.join(dataDir, 'agent_storage.sqlite');

    // Automatically migrate from %APPDATA% if local DB doesn't exist yet
    try {
      const legacyPath = path.join(process.env.APPDATA || '', 'ai-voice-desktop-agent', 'agent_storage.sqlite');
      if (!fs.existsSync(this.dbPath) && legacyPath && fs.existsSync(legacyPath)) {
        fs.copyFileSync(legacyPath, this.dbPath);
      }
    } catch {
      // ignore migration error
    }
  }

  public async initialize(): Promise<void> {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(fileBuffer);
      } catch {
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    this.runMigrations();
  }

  private runMigrations(): void {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        enabled INTEGER DEFAULT 1
      );
    `);
    this.persist();
  }

  public persist(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // App Config
  public getConfig(): AppConfig {
    if (!this.db) return DEFAULT_CONFIG;
    const res = this.db.exec("SELECT data FROM config WHERE id = 'app_config'");
    if (res.length > 0 && res[0].values.length > 0) {
      try {
        return JSON.parse(res[0].values[0][0] as string);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: AppConfig): void {
    if (!this.db) return;
    const stmt = this.db.prepare(
      "INSERT OR REPLACE INTO config (id, data, updated_at) VALUES ('app_config', :data, :updated_at)"
    );
    stmt.run({
      ':data': JSON.stringify(config),
      ':updated_at': Date.now(),
    });
    stmt.free();
    this.persist();
  }

  // Workspaces
  public getWorkspaces(): WorkspaceConfig[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT data FROM workspaces');
    if (res.length === 0) return [];
    return res[0].values.map((row) => JSON.parse(row[0] as string));
  }

  public saveWorkspace(workspace: WorkspaceConfig): void {
    if (!this.db) return;
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO workspaces (id, name, description, data, updated_at) VALUES (:id, :name, :description, :data, :updated_at)'
    );
    stmt.run({
      ':id': workspace.id,
      ':name': workspace.name,
      ':description': workspace.description,
      ':data': JSON.stringify(workspace),
      ':updated_at': Date.now(),
    });
    stmt.free();
    this.persist();
  }

  // Workflows
  public getWorkflows(): AutomationWorkflow[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT data FROM workflows');
    if (res.length === 0) return [];
    return res[0].values.map((row) => JSON.parse(row[0] as string));
  }

  public saveWorkflow(workflow: AutomationWorkflow): void {
    if (!this.db) return;
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO workflows (id, name, description, data, enabled, created_at) VALUES (:id, :name, :description, :data, :enabled, :created_at)'
    );
    stmt.run({
      ':id': workflow.id,
      ':name': workflow.name,
      ':description': workflow.description,
      ':data': JSON.stringify(workflow),
      ':enabled': workflow.enabled ? 1 : 0,
      ':created_at': workflow.createdAt,
    });
    stmt.free();
    this.persist();
  }

  // Plugins
  public getPlugins(): PluginManifest[] {
    if (!this.db) return [];
    const res = this.db.exec('SELECT data FROM plugins');
    if (res.length === 0) return [];
    return res[0].values.map((row) => JSON.parse(row[0] as string));
  }

  public savePlugin(plugin: PluginManifest): void {
    if (!this.db) return;
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO plugins (id, name, data, enabled) VALUES (:id, :name, :data, :enabled)'
    );
    stmt.run({
      ':id': plugin.id,
      ':name': plugin.name,
      ':data': JSON.stringify(plugin),
      ':enabled': plugin.enabled ? 1 : 0,
    });
    stmt.free();
    this.persist();
  }

  public deletePlugin(id: string): boolean {
    if (!this.db) return false;
    const stmt = this.db.prepare('DELETE FROM plugins WHERE id = :id');
    stmt.run({ ':id': id });
    stmt.free();
    this.persist();
    return true;
  }
}
