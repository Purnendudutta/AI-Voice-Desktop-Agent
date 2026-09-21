import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;
import { IPC_CHANNELS, ElectronAPI } from '../shared/types/ipc';

const api: ElectronAPI = {
  sendPrompt: (prompt: string) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_SEND_PROMPT, prompt),
  cancelTask: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_CANCEL_TASK),
  
  onAgentState: (callback) => {
    const handler = (_event: any, state: any) => callback(state);
    ipcRenderer.on(IPC_CHANNELS.AGENT_STATE_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_STATE_CHANGED, handler);
  },

  onPlanUpdated: (callback) => {
    const handler = (_event: any, plan: any) => callback(plan);
    ipcRenderer.on(IPC_CHANNELS.AGENT_PLAN_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_PLAN_UPDATED, handler);
  },

  startAudio: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_START_RECORDING),
  stopAudio: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_STOP_RECORDING),
  sendAudioChunk: (chunk: string) => ipcRenderer.send(IPC_CHANNELS.AUDIO_STREAM_CHUNK, chunk),
  transcribeAudio: (audioBase64: string, mimeType?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO_TRANSCRIBE, audioBase64, mimeType),
  sendBargeIn: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_BARGE_IN),

  onPermissionRequest: (callback) => {
    const handler = (_event: any, req: any) => callback(req);
    ipcRenderer.on(IPC_CHANNELS.PERMISSION_REQUEST, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PERMISSION_REQUEST, handler);
  },

  respondPermission: (decision) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_RESPOND, decision),
  getAuditLogs: (limit) => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_LOG_GET, limit),
  clearAuditLogs: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_LOG_CLEAR),

  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  updateConfig: (partial) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, partial),
  completeOnboarding: (identity) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_ONBOARD, identity),

  getMemoryItems: () => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_GET_ALL),
  setMemoryItem: (item) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_SET, item),
  deleteMemoryItem: (id) => ipcRenderer.invoke(IPC_CHANNELS.MEMORY_DELETE, id),

  getWorkspaces: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_LIST),
  startWorkspace: (id) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_START, id),
  createWorkspace: (workspace) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE, workspace),

  getWorkflows: () => ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_LIST),
  runWorkflow: (id) => ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_RUN, id),
  createWorkflow: (workflow) => ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_CREATE, workflow),

  getPlugins: () => ipcRenderer.invoke(IPC_CHANNELS.PLUGINS_LIST),
  togglePlugin: (id, enabled) => ipcRenderer.invoke(IPC_CHANNELS.PLUGINS_TOGGLE, id, enabled),
  addPlugin: (manifest) => ipcRenderer.invoke(IPC_CHANNELS.PLUGINS_ADD, manifest),
  deletePlugin: (id) => ipcRenderer.invoke(IPC_CHANNELS.PLUGINS_DELETE, id),

  getSystemMetrics: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_METRICS_GET),
  runBenchmarks: () => ipcRenderer.invoke(IPC_CHANNELS.BENCHMARK_RUN),
};

contextBridge.exposeInMainWorld('electronAPI', api);
