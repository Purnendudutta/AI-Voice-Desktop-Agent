import React, { useState, useEffect } from 'react';
import { AutomationWorkflow, WorkspaceConfig } from '../../../shared/types/memory';
import { Workflow, Play, Clock, Sparkles, FolderKanban, Plus, CheckCircle2 } from 'lucide-react';

export const WorkflowsView: React.FC = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [isRunning, setIsRunning] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getWorkflows().then(setWorkflows);
      window.electronAPI.getWorkspaces().then(setWorkspaces);
    }
  }, []);

  const handleRunWorkflow = async (id: string) => {
    setIsRunning(id);
    if (window.electronAPI) {
      await window.electronAPI.runWorkflow(id);
      const updated = await window.electronAPI.getWorkflows();
      setWorkflows(updated);
    }
    setIsRunning(null);
  };

  const handleStartWorkspace = async (id: string) => {
    setIsRunning(id);
    if (window.electronAPI) {
      await window.electronAPI.startWorkspace(id);
    }
    setIsRunning(null);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
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
        </div>

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
                      {new URL(u).hostname}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleStartWorkspace(ws.id)}
                disabled={isRunning === ws.id}
                className="w-full py-2 bg-dark-800 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-slate-200 hover:text-cyan-400 border border-slate-700 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
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
                onClick={() => handleRunWorkflow(wf.id)}
                disabled={isRunning === wf.id}
                className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
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
