import React, { useState, useEffect } from 'react';
import { MemoryItem, MemoryCategory } from '../../../shared/types/memory';
import { BrainCircuit, Trash2, Search, Plus, Sparkles, Tag } from 'lucide-react';

export const MemoryView: React.FC = () => {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');

  const loadMemory = async () => {
    if (window.electronAPI) {
      const data = await window.electronAPI.getMemoryItems();
      setItems(data || []);
    }
  };

  useEffect(() => {
    loadMemory();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim() || !window.electronAPI) return;

    await window.electronAPI.setMemoryItem({
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim(),
    });
    setNewKey('');
    setNewValue('');
    loadMemory();
  };

  const handleDelete = async (id: string) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteMemoryItem(id);
      loadMemory();
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span>Memory & Context Store</span>
          </h2>
          <p className="text-xs text-slate-400">
            Persistent preferences, workspace context, and semantic vector memory.
          </p>
        </div>
      </div>

      {/* Add New Memory Entry */}
      <form onSubmit={handleAdd} className="p-4 rounded-xl bg-dark-900 border border-slate-800 space-y-3">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Remember New Context / Preference</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="preference">Preference</option>
              <option value="semantic">Semantic</option>
              <option value="workspace">Workspace</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Key (e.g. preferred_editor)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Value (e.g. Visual Studio Code)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-semibold rounded-lg text-xs transition-all font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              Save Memory
            </button>
          </div>
        </div>
      </form>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search memory items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-1 font-mono text-xs">
          {(['all', 'preference', 'semantic', 'workspace', 'task'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-dark-900 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-dark-900/40 rounded-xl border border-slate-800/80 text-xs">
            No memory items matching filter.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-cyan-400 font-semibold">{item.key}</span>
                  <span className="px-1.5 py-0.5 rounded bg-dark-950 border border-slate-800 text-[10px] text-slate-400 uppercase">
                    {item.category}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 font-sans">{item.value}</div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                title="Delete memory item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
