import { AppConfig } from './config';
import { TaskPlan, DesktopContext, AgentState } from './agent';
import { PermissionRequest, PermissionDecision, AuditEvent } from './permissions';
import { MemoryItem, WorkspaceConfig, AutomationWorkflow, PluginManifest } from './memory';

export const IPC_CHANNELS = {
  // Agent core
  AGENT_SEND_PROMPT: 'agent:send-prompt',
  AGENT_CANCEL_TASK: 'agent:cancel-task',
  AGENT_STATE_CHANGED: 'agent:state-changed',
  AGENT_PLAN_UPDATED: 'agent:plan-updated',
  AGENT_CONTEXT_REQUEST: 'agent:context-request',

  // Audio / Voice
  AUDIO_START_RECORDING: 'audio:start-recording',
  AUDIO_STOP_RECORDING: 'audio:stop-recording',
  AUDIO_STREAM_CHUNK: 'audio:stream-chunk',
  AUDIO_TRANSCRIBE: 'audio:transcribe',
  AUDIO_BARGE_IN: 'audio:barge-in',
  AUDIO_SPEAK_TEXT: 'audio:speak-text',

  // Security / Permissions
  PERMISSION_REQUEST: 'permission:request',
  PERMISSION_RESPOND: 'permission:respond',
  AUDIT_LOG_GET: 'audit:get-events',
  AUDIT_LOG_CLEAR: 'audit:clear',

  // Configuration
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  CONFIG_ONBOARD: 'config:onboard',

  // Memory & Workspaces
  MEMORY_GET_ALL: 'memory:get-all',
  MEMORY_SET: 'memory:set',
  MEMORY_DELETE: 'memory:delete',
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_START: 'workspace:start',
  WORKSPACE_CREATE: 'workspace:create',
  WORKFLOW_LIST: 'workflow:list',
  WORKFLOW_RUN: 'workflow:run',
  WORKFLOW_CREATE: 'workflow:create',

  // Plugins & System
  PLUGINS_LIST: 'plugins:list',
  PLUGINS_TOGGLE: 'plugins:toggle',
  SYSTEM_METRICS_GET: 'system:metrics-get',
  BENCHMARK_RUN: 'benchmark:run',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

export interface ElectronAPI {
  sendPrompt: (prompt: string) => Promise<TaskPlan>;
  cancelTask: (taskId?: string) => Promise<boolean>;
  onAgentState: (callback: (state: AgentState) => void) => () => void;
  onPlanUpdated: (callback: (plan: TaskPlan) => void) => () => void;
  
  // Audio
  startAudio: () => Promise<boolean>;
  stopAudio: () => Promise<boolean>;
  sendAudioChunk: (base64Pcm: string) => void;
  transcribeAudio: (
    audioBase64: string,
    mimeType?: string
  ) => Promise<{ text: string; error?: string | null; message?: string }>;
  sendBargeIn: () => Promise<void>;
  
  // Permissions
  onPermissionRequest: (callback: (req: PermissionRequest) => void) => () => void;
  respondPermission: (decision: PermissionDecision) => Promise<void>;
  getAuditLogs: (limit?: number) => Promise<AuditEvent[]>;
  clearAuditLogs: () => Promise<boolean>;

  // Config
  getConfig: () => Promise<AppConfig>;
  updateConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
  completeOnboarding: (identity: AppConfig['identity']) => Promise<AppConfig>;

  // Memory & Workspaces
  getMemoryItems: () => Promise<MemoryItem[]>;
  setMemoryItem: (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MemoryItem>;
  deleteMemoryItem: (id: string) => Promise<boolean>;
  getWorkspaces: () => Promise<WorkspaceConfig[]>;
  startWorkspace: (workspaceId: string) => Promise<boolean>;
  createWorkspace: (workspace: WorkspaceConfig) => Promise<WorkspaceConfig>;
  getWorkflows: () => Promise<AutomationWorkflow[]>;
  runWorkflow: (workflowId: string) => Promise<boolean>;
  createWorkflow: (workflow: Omit<AutomationWorkflow, 'id' | 'createdAt'>) => Promise<AutomationWorkflow>;

  // Plugins & System
  getPlugins: () => Promise<PluginManifest[]>;
  togglePlugin: (id: string, enabled: boolean) => Promise<boolean>;
  getSystemMetrics: () => Promise<DesktopContext['systemMetrics']>;
  runBenchmarks: () => Promise<Record<string, unknown>>;
}
