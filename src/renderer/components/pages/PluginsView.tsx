import React, { useState, useEffect } from 'react';
import { PluginManifest } from '../../../shared/types/memory';
import { Boxes, Shield, Wrench, CheckCircle2, XCircle } from 'lucide-react';

export const PluginsView: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);

  const loadPlugins = async () => {
    if (window.electronAPI) {
      const list = await window.electronAPI.getPlugins();
      setPlugins(list || []);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    if (window.electronAPI) {
      await window.electronAPI.togglePlugin(id, !current);
      loadPlugins();
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-cyan-400" />
          <span>Extensible Tool Plugins</span>
        </h2>
        <p className="text-xs text-slate-400">
          Modular integrations declaring sandboxed tools and explicit permissions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{plugin.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                    v{plugin.version}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(plugin.id, plugin.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                    plugin.enabled
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {plugin.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              <p className="text-xs text-slate-400">{plugin.description}</p>

              {/* Required Permissions */}
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-rose-400" /> Required Permissions:
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
                </div>
              </div>

              {/* Tools Provided */}
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Tools Provided:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plugin.toolsProvided.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-dark-950 border border-cyan-900/40 text-cyan-400 text-[10px]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
              Author: {plugin.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
