import { describe, it, expect } from 'vitest';
import { MemoryStore } from '../../src/main/memory/MemoryStore';
import { VectorStore } from '../../src/main/memory/VectorStore';

describe('Memory Store & Vector Similarity', () => {
  it('stores and retrieves preference memory', () => {
    const store = new MemoryStore();
    store.setItem({
      category: 'preference',
      key: 'preferred_terminal',
      value: 'powershell',
    });

    const item = store.getItem('preferred_terminal', 'preference');
    expect(item).toBeDefined();
    expect(item?.value).toBe('powershell');
  });

  it('performs semantic vector memory search', () => {
    const vectorStore = new VectorStore();
    vectorStore.addEntry({
      id: 'doc_1',
      text: 'Visual Studio Code is my favorite code editor',
      category: 'preferences',
    });
    vectorStore.addEntry({
      id: 'doc_2',
      text: 'I prefer Italian pizza for dinner',
      category: 'food',
    });

    const results = vectorStore.search('Which IDE or code editor do I use?', { topK: 1 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.text).toContain('Visual Studio Code');
  });

  it('respects category disable settings', () => {
    const store = new MemoryStore();
    store.setCategoryEnabled('task', false);
    expect(store.isCategoryEnabled('task')).toBe(false);

    expect(() => {
      store.setItem({
        category: 'task',
        key: 'last_run',
        value: 'failed',
      });
    }).toThrow(/disabled in settings/);
  });
});
