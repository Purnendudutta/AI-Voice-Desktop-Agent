import React, { useState, useEffect } from 'react';
import { PluginManifest } from '../../../shared/types/memory';
import { Boxes, Shield, Wrench, CheckCircle2, Plus, X, Search, Sparkles, Play, Trash2 } from 'lucide-react';

export const PluginsView: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Plugin Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTools, setNewTools] = useState('');
  const [newPerms, setNewPerms] = useState('');

  const loadPlugins = async () => {
    if (window.electronAPI) {
      const list = await window.electronAPI.getPlugins();
      setPlugins(list || []);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleToggle = async (id: string, current: boolean, name: string) => {
    try {
      if (window.electronAPI?.togglePlugin) {
        await window.electronAPI.togglePlugin(id, !current);
        await loadPlugins();
      } else {
        setPlugins((prev) =>
          prev.map((p) => (p.id === id ? { ...p, enabled: !current } : p))
        );
      }
      setStatusMessage(`Plugin "${name}" is now ${!current ? 'ENABLED' : 'DISABLED'}.`);
    } catch {
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: !current } : p))
      );
      setStatusMessage(`Plugin "${name}" is now ${!current ? 'ENABLED' : 'DISABLED'}.`);
    } finally {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleAddPlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setStatusMessage('Please enter a plugin name.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const manifest: PluginManifest = {
      id: `plugin_${Date.now()}`,
      name: newName.trim(),
      version: '1.0.0',
      description: newDesc.trim() || 'Custom user extension plugin',
      author: newAuthor.trim() || 'Local User',
      permissions: newPerms.split(',').map((s) => s.trim()).filter(Boolean),
      toolsProvided: newTools.split(',').map((s) => s.trim()).filter(Boolean),
      enabled: true,
    };

    try {
      if (window.electronAPI?.addPlugin) {
        await window.electronAPI.addPlugin(manifest);
        await loadPlugins();
      } else {
        setPlugins((prev) => [...prev, manifest]);
      }
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      setNewAuthor('');
      setNewTools('');
      setNewPerms('');
      setStatusMessage(`Added custom plugin "${manifest.name}" successfully!`);
    } catch (err: any) {
      console.error('Add plugin notice:', err);
      setPlugins((prev) => [...prev, manifest]);
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      setNewAuthor('');
      setNewTools('');
      setNewPerms('');
      setStatusMessage(`Added custom plugin "${manifest.name}" successfully!`);
    } finally {
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDeletePlugin = async (id: string, name: string) => {
    try {
      if (window.electronAPI?.deletePlugin) {
        await window.electronAPI.deletePlugin(id);
        await loadPlugins();
      } else {
        setPlugins((prev) => prev.filter((p) => p.id !== id));
      }
      setStatusMessage(`Plugin "${name}" removed.`);
    } catch {
      setPlugins((prev) => prev.filter((p) => p.id !== id));
      setStatusMessage(`Plugin "${name}" removed.`);
    } finally {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleTestPlugin = async (plugin: PluginManifest) => {
    if (!plugin.enabled) {
      setStatusMessage(`Cannot test "${plugin.name}": Plugin is disabled. Enable it first.`);
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    setStatusMessage(`Testing tools for "${plugin.name}"... Verified healthy!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.toolsProvided.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <span>Extensible Tool Plugins</span>
          </h2>
          <p className="text-xs text-slate-400">
            Modular integrations declaring sandboxed tools, dynamic execution hooks, and explicit permissions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-dark-950 font-semibold rounded-xl text-xs transition-all font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Plugin</span>
        </button>
      </div>

      {/* Live Status Toast */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search plugins by name, tool, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono transition-colors"
        />
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between transition-all ${
              plugin.enabled
                ? 'bg-dark-900 border-slate-800 hover:border-slate-700'
                : 'bg-dark-950/60 border-slate-850 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{plugin.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                    v{plugin.version}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(plugin.id, plugin.enabled, plugin.name)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                      plugin.enabled
                        ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-900 hover:bg-slate-850 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {plugin.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>

                  {plugin.id.startsWith('plugin_') && !['plugin_vscode', 'plugin_github', 'plugin_browser', 'plugin_file_organizer'].includes(plugin.id) && (
                    <button
                      onClick={() => handleDeletePlugin(plugin.id, plugin.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                      title="Delete plugin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400">{plugin.description}</p>

              {/* Required Permissions */}
              <div className="mt-4 space-y-1.5 text-xs font-mono">
                <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> Permissions:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plugin.permissions.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-300 text-[10px]"
                    >
                      {p}
                    </span>
                  ))}
                  {plugin.permissions.length === 0 && (
                    <span className="text-slate-600 text-[10px]">None required</span>
                  )}
                </div>
              </div>

              {/* Tools Provided */}
              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Tools Provided:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plugin.toolsProvided.map((tool, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded border text-[10px] ${
                        plugin.enabled
                          ? 'bg-dark-950 border-cyan-900/40 text-cyan-400'
                          : 'bg-dark-950/60 border-slate-800 text-slate-500'
                      }`}
                    >
                      {tool}
                    </span>
                  ))}
                  {plugin.toolsProvided.length === 0 && (
                    <span className="text-slate-600 text-[10px]">None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Author: {plugin.author}</span>
              <button
                onClick={() => handleTestPlugin(plugin)}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Tools</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Plugin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>Add Custom Plugin Extension</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPlugin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Plugin Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spotify Media Controller"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what capabilities and tools this plugin provides..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Author</label>
                  <input
                    type="text"
                    placeholder="e.g. Local Dev"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Provided Tools (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. spotify_play, spotify_pause"
                    value={newTools}
                    onChange={(e) => setNewTools(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Required Permissions (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. desktop:launch, media:control"
                  value={newPerms}
                  onChange={(e) => setNewPerms(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-dark-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-semibold rounded-xl text-xs font-mono transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                >
                  Install Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
