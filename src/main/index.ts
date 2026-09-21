import electron, { type BrowserWindow } from 'electron';
const { app, BrowserWindow: BrowserWindowClass, ipcMain } = electron;
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { IPC_CHANNELS } from '../shared/types/ipc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { AppDatabase } from './memory/Database';
import { MemoryStore } from './memory/MemoryStore';
import { PermissionEngine } from './security/PermissionEngine';
import { CommandSandbox } from './security/CommandSandbox';
import { AuditLogger } from './security/AuditLogger';
import { WindowManager } from './desktop/WindowManager';
import { ScreenCapture } from './desktop/ScreenCapture';
import { ClipboardManager } from './desktop/ClipboardManager';
import { FileAgent } from './files/FileAgent';
import { FileOrganizer } from './files/FileOrganizer';
import { GitAgent } from './git/GitAgent';
import { BrowserAgent } from './browser/BrowserAgent';
import { ToolRegistry } from './tools/ToolRegistry';
import { ModelRouter } from './ai/ModelRouter';
import { ContextEngine } from './agent/ContextEngine';
import { TaskManager } from './agent/TaskManager';
import { RecoveryEngine } from './agent/RecoveryEngine';
import { Agent } from './agent/Agent';
import { AudioPipeline } from './audio/AudioPipeline';
import { VoiceService } from './audio/VoiceService';
import { WindowsSpeechService } from './audio/WindowsSpeechService';
import { WorkspaceManager } from './scheduler/WorkspaceManager';
import { SchedulerService } from './scheduler/SchedulerService';
import { WorkflowRecorder } from './scheduler/WorkflowRecorder';
import { ProactiveAssistant } from './scheduler/ProactiveAssistant';
import { PluginManager } from './plugins/PluginManager';
import { SystemMonitor } from './system/SystemMonitor';
import { BenchmarkRunner } from './telemetry/BenchmarkRunner';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');

  mainWindow = new BrowserWindowClass({
    width: 1360,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#06080d',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#06080d',
      symbolColor: '#94a3b8',
      height: 38,
    },
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for custom preload bridge in some environments
    },
  });

  // Explicitly grant media/microphone permissions for local hardware audio
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      return callback(true);
    }
    callback(true);
  });

  mainWindow.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return true;
    }
    return true;
  });

  // Services bootstrap
  const db = new AppDatabase();
  await db.initialize();
  const config = db.getConfig();

  const auditLogger = new AuditLogger();
  const permissionEngine = new PermissionEngine(config);
  const sandbox = new CommandSandbox(config.security);
  const memoryStore = new MemoryStore();
  const windowManager = new WindowManager();
  const screenCapture = new ScreenCapture();
  const clipboardManager = new ClipboardManager();
  const fileAgent = new FileAgent();
  const fileOrganizer = new FileOrganizer(fileAgent);
  const gitAgent = new GitAgent(sandbox);
  const browserAgent = new BrowserAgent();
  const systemMonitor = new SystemMonitor();

  const toolRegistry = new ToolRegistry(
    windowManager,
    screenCapture,
    clipboardManager,
    fileAgent,
    fileOrganizer,
    gitAgent,
    browserAgent,
    sandbox
  );

  const modelRouter = new ModelRouter(config);
  const contextEngine = new ContextEngine(windowManager, clipboardManager, memoryStore);
  const taskManager = new TaskManager();
  const recoveryEngine = new RecoveryEngine(toolRegistry);

  const agent = new Agent(
    config,
    modelRouter,
    toolRegistry,
    permissionEngine,
    auditLogger,
    contextEngine,
    taskManager,
    recoveryEngine,
    memoryStore
  );

  const audioPipeline = new AudioPipeline({
    onBargeIn: () => {
      agent.cancelActiveTask();
    },
  });
  const voiceService = new VoiceService();
  const workspaceManager = new WorkspaceManager(db, windowManager, browserAgent, sandbox);
  const schedulerService = new SchedulerService(db, toolRegistry);
  const workflowRecorder = new WorkflowRecorder();
  const proactiveAssistant = new ProactiveAssistant();
  const pluginManager = new PluginManager(db);
  const benchmarkRunner = new BenchmarkRunner(agent, config);

  // Setup callbacks to renderer
  permissionEngine.setPromptCallback((req) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.PERMISSION_REQUEST, req);
    }
  });

  agent.setStateListener((state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.AGENT_STATE_CHANGED, state);
    }
  });

  taskManager.setUpdateListener((plan) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.AGENT_PLAN_UPDATED, plan);
    }
  });

  // Wire up IPC Handlers
  ipcMain.handle(IPC_CHANNELS.AGENT_SEND_PROMPT, async (_event, prompt: string) => {
    return agent.handleUserGoal(prompt);
  });

  ipcMain.handle(IPC_CHANNELS.AGENT_CANCEL_TASK, async () => {
    return agent.cancelActiveTask();
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_START_RECORDING, async () => {
    return audioPipeline.start();
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_STOP_RECORDING, async () => {
    return audioPipeline.stop();
  });

  ipcMain.on(IPC_CHANNELS.AUDIO_STREAM_CHUNK, (_event, base64Pcm: string) => {
    audioPipeline.processAudioChunk(base64Pcm);
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_TRANSCRIBE, async (_event, base64Audio: string, mimeType?: string) => {
    const currentConfig = db.getConfig();

    // 1. If Gemini API key is configured, try Gemini cloud transcription first
    if (currentConfig.ai.geminiApiKey) {
      try {
        const gemini = modelRouter.getGeminiProvider();
        const text = await gemini.transcribeAudio(base64Audio, mimeType || 'audio/wav');
        if (text && text.trim()) {
          return { text: text.trim(), error: null };
        }
      } catch (err: any) {
        console.warn('Gemini cloud transcription notice, checking local engine:', err.message);
      }
    }

    // 2. Offline fallback: Windows native System.Speech recognition
    try {
      const localText = await WindowsSpeechService.transcribeWav(base64Audio);
      if (localText && localText.trim()) {
        return { text: localText.trim(), error: null };
      }
    } catch (err: any) {
      console.warn('Windows local speech transcription error:', err);
    }

    if (!currentConfig.ai.geminiApiKey) {
      return {
        text: '',
        error: 'NO_API_KEY',
        message: 'Voice recorded! For full conversational AI, configure your Gemini API key in Settings, or type your goal below.',
      };
    }

    return { text: '', error: 'NO_SPEECH', message: 'No clear speech detected.' };
  });

  ipcMain.handle(IPC_CHANNELS.AUDIO_BARGE_IN, async () => {
    voiceService.interrupt();
    return agent.cancelActiveTask();
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSION_RESPOND, async (_event, decision) => {
    permissionEngine.handleDecision(decision);
  });

  ipcMain.handle(IPC_CHANNELS.AUDIT_LOG_GET, async (_event, limit) => {
    return auditLogger.getEvents(limit || 100);
  });

  ipcMain.handle(IPC_CHANNELS.AUDIT_LOG_CLEAR, async () => {
    auditLogger.clear();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => {
    return db.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, async (_event, partial) => {
    const current = db.getConfig();
    const updated = {
      ...current,
      ...partial,
      identity: { ...current.identity, ...(partial.identity || {}) },
      security: { ...current.security, ...(partial.security || {}) },
      ai: { ...current.ai, ...(partial.ai || {}) },
      updatedAt: Date.now(),
    };
    db.saveConfig(updated);
    agent.updateConfig(updated);
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_ONBOARD, async (_event, identity) => {
    const current = db.getConfig();
    const updated = {
      ...current,
      identity: { ...current.identity, ...identity },
      isOnboarded: true,
      updatedAt: Date.now(),
    };
    db.saveConfig(updated);
    agent.updateConfig(updated);
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_GET_ALL, async () => {
    return memoryStore.getAllItems();
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_SET, async (_event, item) => {
    return memoryStore.setItem(item);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_DELETE, async (_event, id) => {
    return memoryStore.deleteItem(id);
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_LIST, async () => {
    return workspaceManager.listWorkspaces();
  });

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_START, async (_event, workspaceId) => {
    return workspaceManager.restoreWorkspace(workspaceId);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_LIST, async () => {
    return db.getWorkflows();
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_RUN, async (_event, workflowId) => {
    return schedulerService.runWorkflow(workflowId);
  });

  ipcMain.handle(IPC_CHANNELS.WORKFLOW_CREATE, async (_event, workflow) => {
    const record = {
      ...workflow,
      id: `wf_${Date.now()}`,
      createdAt: Date.now(),
    };
    db.saveWorkflow(record);
    return record;
  });

  ipcMain.handle(IPC_CHANNELS.PLUGINS_LIST, async () => {
    return pluginManager.getPlugins();
  });

  ipcMain.handle(IPC_CHANNELS.PLUGINS_TOGGLE, async (_event, id, enabled) => {
    return pluginManager.togglePlugin(id, enabled);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_METRICS_GET, async () => {
    return systemMonitor.getMetrics();
  });

  ipcMain.handle(IPC_CHANNELS.BENCHMARK_RUN, async () => {
    return benchmarkRunner.runFullSuite();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const distHtml = path.join(__dirname, '../../dist/index.html');
    const localHtml = path.join(__dirname, '../renderer/index.html');
    const targetHtml = fs.existsSync(distHtml) ? distHtml : localHtml;
    mainWindow.loadFile(targetHtml);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
