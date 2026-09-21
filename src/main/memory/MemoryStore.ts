import { MemoryItem, MemoryCategory } from '../../shared/types/memory';
import { TaskPlan } from '../../shared/types/agent';
import { VectorStore } from './VectorStore';

export class MemoryStore {
  private items: Map<string, MemoryItem> = new Map();
  private vectorStore: VectorStore;
  private shortTermHistory: Array<{ role: 'user' | 'agent'; text: string; timestamp: number }> = [];
  private taskHistory: TaskPlan[] = [];
  private enabledCategories: Set<MemoryCategory> = new Set([
    'preference',
    'workspace',
    'task',
    'semantic',
    'system',
  ]);

  constructor(vectorStore?: VectorStore) {
    this.vectorStore = vectorStore || new VectorStore();
  }

  public setCategoryEnabled(category: MemoryCategory, enabled: boolean): void {
    if (enabled) {
      this.enabledCategories.add(category);
    } else {
      this.enabledCategories.delete(category);
    }
  }

  public isCategoryEnabled(category: MemoryCategory): boolean {
    return this.enabledCategories.has(category);
  }

  // Short-term conversational memory
  public addShortTermMessage(role: 'user' | 'agent', text: string): void {
    this.shortTermHistory.push({ role, text, timestamp: Date.now() });
    if (this.shortTermHistory.length > 50) {
      this.shortTermHistory.shift();
    }
  }

  public getShortTermHistory(limit = 10): Array<{ role: 'user' | 'agent'; text: string; timestamp: number }> {
    return this.shortTermHistory.slice(-limit);
  }

  // Task Memory
  public recordTask(task: TaskPlan): void {
    if (!this.isCategoryEnabled('task')) return;
    this.taskHistory.unshift(task);
    if (this.taskHistory.length > 50) {
      this.taskHistory.pop();
    }
  }

  public getRecentTasks(limit = 10): TaskPlan[] {
    return this.taskHistory.slice(0, limit);
  }

  public getTaskById(taskId: string): TaskPlan | undefined {
    return this.taskHistory.find((t) => t.taskId === taskId);
  }

  // General Memory (Preferences, Workspaces, Semantic)
  public setItem(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): MemoryItem {
    if (!this.isCategoryEnabled(item.category)) {
      throw new Error(`Memory category "${item.category}" is currently disabled in settings.`);
    }

    const id = `mem_${item.category}_${item.key.replace(/\s+/g, '_')}`;
    const existing = this.items.get(id);

    const record: MemoryItem = {
      id,
      category: item.category,
      key: item.key,
      value: item.value,
      metadata: item.metadata,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    this.items.set(id, record);

    // Also index into vector store if semantic or preference
    if (item.category === 'semantic' || item.category === 'preference') {
      this.vectorStore.addEntry({
        id,
        text: `${item.key}: ${item.value}`,
        category: item.category,
        metadata: item.metadata,
      });
    }

    return record;
  }

  public getItem(key: string, category?: MemoryCategory): MemoryItem | undefined {
    for (const item of this.items.values()) {
      if (item.key === key && (!category || item.category === category)) {
        item.lastAccessedAt = Date.now();
        return item;
      }
    }
    return undefined;
  }

  public deleteItem(id: string): boolean {
    const item = this.items.get(id);
    if (item) {
      this.vectorStore.delete(id);
      return this.items.delete(id);
    }
    return false;
  }

  public getAllItems(category?: MemoryCategory): MemoryItem[] {
    const list = Array.from(this.items.values());
    if (category) {
      return list.filter((i) => i.category === category);
    }
    return list;
  }

  // Semantic query
  public searchSemantic(query: string, limit = 5): Array<{ text: string; score: number }> {
    if (!this.isCategoryEnabled('semantic')) return [];
    const results = this.vectorStore.search(query, { topK: limit, threshold: 0.15 });
    return results.map((r) => ({
      text: r.entry.text,
      score: r.score,
    }));
  }

  public wipe(): void {
    this.items.clear();
    this.shortTermHistory = [];
    this.taskHistory = [];
    this.vectorStore.clear();
  }
}
