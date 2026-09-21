import React, { useState, useEffect } from 'react';
import { AutomationWorkflow, WorkspaceConfig } from '../../../shared/types/memory';
import { Workflow, Play, Clock, Sparkles, FolderKanban, Plus, CheckCircle2, X } from 'lucide-react';

export const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAddWorkspace, setShowAddWorkspace] = useState(false);

  // New Workspace form state
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [wsApps, setWsApps] = useState('');
  const [wsUrls, setWsUrls] = useState('');

  const loadData = async () => {
    if (window.electronAPI) {
      const wfList = await window.electronAPI.getWorkflows();
      const wsList = await window.electronAPI.getWorkspaces();
      setWorkflows(wfList || []);
      setWorkspaces(wsList || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getHostname = (u: string) => {
    try {
      return new URL(u.startsWith('http') ? u : `https://${u}`).hostname;
    } catch {
      return u;
    }
  };

  const handleRunWorkflow = async (id: string, name: string) => {
    setIsRunning(id);
    setStatusMessage(`Running workflow "${name}"...`);
    try {
      if (window.electronAPI) {
        await window.electronAPI.runWorkflow(id);
        const updated = await window.electronAPI.getWorkflows();
        setWorkflows(updated);
        setStatusMessage(`Workflow "${name}" completed successfully!`);
      }
    } catch (err: any) {
      setStatusMessage(`Workflow error: ${err.message}`);
    } finally {
      setIsRunning(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleStartWorkspace = async (id: string, name: string) => {
    setIsRunning(id);
    setStatusMessage(`Restoring workspace "${name}"...`);
    try {
      if (window.electronAPI) {
        await window.electronAPI.startWorkspace(id);
        setStatusMessage(`Workspace "${name}" launched!`);
      }
    } catch (err: any) {
      setStatusMessage(`Workspace error: ${err.message}`);
    } finally {
      setIsRunning(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    const newWs: WorkspaceConfig = {
      id: `ws_${Date.now()}`,
      name: wsName.trim(),
      description: wsDesc.trim(),
      applications: wsApps.split(',').map((s) => s.trim()).filter(Boolean),
      urls: wsUrls.split(',').map((s) => s.trim()).filter(Boolean),
      directories: [],
      startupCommands: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (window.electronAPI) {
      await window.electronAPI.createWorkspace(newWs);
    }
    setWorkspaces([...workspaces, newWs]);
    setShowAddWorkspace(false);
    setWsName('');
    setWsDesc('');
    setWsApps('');
    setWsUrls('');
    setStatusMessage(`Created workspace "${newWs.name}"`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      {/* Toast notification banner */}
      {statusMessage && (
        <div className="p-3 bg-cyan-950/90 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Workspaces Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <span>Configured Workspaces</span>
            </h3>
            <p className="text-xs text-slate-400">Restore complete application, terminal, and URL environments.</p>
          </div>
          <button
            onClick={() => setShowAddWorkspace(!showAddWorkspace)}
            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workspace</span>
          </button>
        </div>

        {/* Modal / Form to add a new workspace */}
        {showAddWorkspace && (
          <form onSubmit={handleCreateWorkspace} className="p-4 mb-4 rounded-xl bg-dark-900 border border-cyan-500/40 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Create New Workspace</span>
              <button type="button" onClick={() => setShowAddWorkspace(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <input
                type="text"
                required
                placeholder="Workspace Name (e.g. Graphic Design)"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                className="bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Apps comma-separated (e.g. Notepad, PowerShell)"
                value={wsApps}
                onChange={(e) => setWsApps(e.target.value)}
                className="bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="URLs comma-separated (e.g. https://github.com)"
                value={wsUrls}
                onChange={(e) => setWsUrls(e.target.value)}
                className="bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddWorkspace(false)}
                className="px-3 py-1.5 bg-dark-800 text-slate-400 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-500 text-dark-950 font-semibold rounded-lg text-xs"
              >
                Save Workspace
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className="p-4 rounded-xl bg-dark-900 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{ws.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{ws.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {ws.applications.map((app, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-dark-950 text-[10px] font-mono text-cyan-400 border border-slate-800">
                      {app}
                    </span>
                  ))}
                  {ws.urls.map((u, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-dark-950 text-[10px] font-mono text-violet-400 border border-slate-800">
                      {getHostname(u)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleStartWorkspace(ws.id, ws.name)}
                disabled={isRunning === ws.id}
                className="w-full py-2 bg-dark-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-200 hover:text-cyan-400 border border-slate-700 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning === ws.id ? 'Restoring...' : 'Launch Workspace'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Workflows Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-violet-400" />
              <span>Automated Workflows & Triggers</span>
            </h3>
            <p className="text-xs text-slate-400">Scheduled, event-triggered, and recorded desktop routines.</p>
          </div>
        </div>

        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf.id} className="p-4 rounded-xl bg-dark-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-200">{wf.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-950 text-violet-400 border border-violet-800 uppercase">
                    {wf.trigger.type === 'cron' ? `Cron: ${wf.trigger.cronExpression}` : 'Manual'}
                  </span>
                  {wf.lastRunStatus && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        wf.lastRunStatus === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {wf.lastRunStatus}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{wf.description}</p>
                <div className="text-[11px] font-mono text-slate-500 mt-2">
                  {wf.steps.length} steps • Last run:{' '}
                  {wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleTimeString() : 'Never'}
                </div>
              </div>

              <button
                onClick={() => handleRunWorkflow(wf.id, wf.name)}
                disabled={isRunning === wf.id}
                className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.15)] cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning === wf.id ? 'Running...' : 'Execute Now'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
