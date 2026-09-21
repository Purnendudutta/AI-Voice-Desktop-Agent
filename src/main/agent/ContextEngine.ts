import { DesktopContext } from '../../shared/types/agent';
import { WindowManager } from '../desktop/WindowManager';
import { ClipboardManager } from '../desktop/ClipboardManager';
import { MemoryStore } from '../memory/MemoryStore';

export class ContextEngine {
  private windowManager: WindowManager;
  private clipboardManager: ClipboardManager;
  private memoryStore: MemoryStore;
  private recentActions: string[] = [];

  constructor(
    windowManager: WindowManager,
    clipboardManager: ClipboardManager,
    memoryStore: MemoryStore
  ) {
    this.windowManager = windowManager;
    this.clipboardManager = clipboardManager;
    this.memoryStore = memoryStore;
  }

  public recordAction(actionDescription: string): void {
    this.recentActions.unshift(actionDescription);
    if (this.recentActions.length > 20) {
      this.recentActions.pop();
    }
  }

  public async collectContext(userQuery?: string): Promise<DesktopContext> {
    const activeWindow = await this.windowManager.getActiveWindow();
    const openWindows = await this.windowManager.listOpenWindows();
    const clipboardText = await this.clipboardManager.readText();

    // Context selection / compression: query semantic memory only if query present
    let relevantMemory: string[] = [];
    if (userQuery) {
      const semanticResults = this.memoryStore.searchSemantic(userQuery, 3);
      relevantMemory = semanticResults.map((r) => r.text);
    }

    const preferences = this.memoryStore.getAllItems('preference').map((p) => `${p.key}: ${p.value}`);
    if (preferences.length > 0) {
      relevantMemory.push(...preferences.slice(0, 3));
    }

    return {
      activeApplication: activeWindow
        ? {
            name: activeWindow.processName,
            title: activeWindow.title,
            processId: activeWindow.processId,
          }
        : undefined,
      activeWindow: activeWindow ? { title: activeWindow.title } : undefined,
      openWindows: openWindows.map((w) => ({ id: w.id, title: w.title, app: w.processName })),
      currentProject: {
        name: 'AI-Voice-Desktop-Agent',
        path: process.cwd(),
        branch: 'main',
      },
      recentActions: this.recentActions.slice(0, 5),
      clipboardPreview: clipboardText ? clipboardText.substring(0, 100) : undefined,
      relevantMemory: relevantMemory.length > 0 ? relevantMemory : undefined,
      timestamp: Date.now(),
    };
  }

  public compressForPrompt(context: DesktopContext): Record<string, unknown> {
    // Only send strictly relevant compressed context to avoid token bloat
    return {
      activeApp: context.activeApplication?.name,
      windowTitle: context.activeWindow?.title,
      project: context.currentProject?.name,
      recentActions: context.recentActions.slice(0, 3),
      clipboardPreview: context.clipboardPreview ? context.clipboardPreview.substring(0, 60) : undefined,
      memory: context.relevantMemory,
    };
  }
}
