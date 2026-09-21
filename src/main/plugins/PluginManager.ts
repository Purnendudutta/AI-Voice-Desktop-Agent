import { PluginManifest } from '../../shared/types/memory';
import { AppDatabase } from '../memory/Database';

export class PluginManager {
  private db: AppDatabase;
  private plugins: Map<string, PluginManifest> = new Map();

  constructor(db: AppDatabase) {
    this.db = db;
    this.loadBuiltinPlugins();
  }

  private loadBuiltinPlugins(): void {
    const defaultPlugins: PluginManifest[] = [
      {
        id: 'plugin_vscode',
        name: 'VS Code Integration',
        version: '1.0.0',
        description: 'Deep integration with Visual Studio Code workspace and terminal',
        author: 'Antigravity Core',
        permissions: ['desktop:launch', 'terminal:execute'],
        toolsProvided: ['open_application', 'run_command'],
        enabled: true,
      },
      {
        id: 'plugin_github',
        name: 'GitHub & Git Assistant',
        version: '1.2.0',
        description: 'Git status, diff, branches, and commit generation',
        author: 'Antigravity Core',
        permissions: ['git:read', 'git:write'],
        toolsProvided: ['git_status', 'git_diff'],
        enabled: true,
      },
      {
        id: 'plugin_browser',
        name: 'Web Navigator & Research',
        version: '1.1.0',
        description: 'Automated web browsing and search documentation extraction',
        author: 'Antigravity Core',
        permissions: ['browser:navigate'],
        toolsProvided: ['open_url', 'browser_search'],
        enabled: true,
      },
      {
        id: 'plugin_file_organizer',
        name: 'Smart File Organizer',
        version: '1.0.0',
        description: 'Categorization and organization for Downloads and Desktop',
        author: 'Antigravity Core',
        permissions: ['files:read', 'files:write'],
        toolsProvided: ['search_files', 'organize_directory'],
        enabled: true,
      },
    ];

    const saved = this.db.getPlugins();
    if (saved.length === 0) {
      for (const p of defaultPlugins) {
        this.plugins.set(p.id, p);
        this.db.savePlugin(p);
      }
    } else {
      for (const p of saved) {
        this.plugins.set(p.id, p);
      }
    }
  }

  public getPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public togglePlugin(id: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.enabled = enabled;
    this.plugins.set(id, plugin);
    this.db.savePlugin(plugin);
    return true;
  }
}
