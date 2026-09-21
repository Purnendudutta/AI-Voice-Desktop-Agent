export type MemoryCategory =
  | 'preference'
  | 'workspace'
  | 'task'
  | 'semantic'
  | 'system';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  applications: string[];
  urls: string[];
  directories: string[];
  startupCommands: string[];
  environmentVars?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'cron' | 'event' | 'manual';
    cronExpression?: string;
    eventType?: string;
  };
  steps: Array<{
    toolId: string;
    arguments: Record<string, unknown>;
    verify: boolean;
  }>;
  enabled: boolean;
  lastRunAt?: number;
  lastRunStatus?: 'success' | 'failed';
  createdAt: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  toolsProvided: string[];
  enabled: boolean;
  config?: Record<string, unknown>;
}
