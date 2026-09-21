import React, { useState, useEffect } from 'react';
import { TaskPlan } from '../../../shared/types/agent';
import { AppConfig } from '../../../shared/types/config';
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Terminal,
  FolderSync,
  Layers,
  Sparkles,
  Laptop,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface DashboardViewProps {
  config: AppConfig;
  activePlan: TaskPlan | null;
  onSendPrompt: (prompt: string) => void;
  onCancelTask: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  config,
  activePlan,
  onSendPrompt,
  onCancelTask,
}) => {
  const agentName = config.identity.agentName || 'Agent';
  const [metrics, setMetrics] = useState<any>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSystemMetrics().then(setMetrics);
      const interval = setInterval(() => {
        window.electronAPI.getSystemMetrics().then(setMetrics);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleActionClick = async (prompt: string, title: string) => {
    setExecutingAction(title);
    try {
      await onSendPrompt(prompt);
    } finally {
      setExecutingAction(null);
    }
  };

  const quickActions = [
    {
      title: 'Open Terminal',
      desc: 'Launch PowerShell command prompt in current workspace',
      prompt: 'open terminal',
      icon: Terminal,
      color: 'text-cyan-400',
    },
    {
      title: 'Launch Notepad',
      desc: 'Open Windows Notepad for quick notes or editing',
      prompt: 'open notepad',
      icon: Laptop,
      color: 'text-amber-400',
    },
    {
      title: 'Prepare Development Workspace',
      desc: 'Launch VS Code, check Git status, verify background services',
      prompt: 'Prepare my development workspace',
      icon: Terminal,
      color: 'text-cyan-400',
    },
    {
      title: 'Organize Downloads Folder',
      desc: 'Sort PDFs, images, archives into organized categories',
      prompt: 'Organize my Downloads folder',
      icon: FolderSync,
      color: 'text-violet-400',
    },
    {
      title: 'Run Tests & Diagnose Failures',
      desc: 'Execute test suite and analyze failure logs',
      prompt: 'Run the tests and tell me what failed',
      icon: Play,
      color: 'text-emerald-400',
    },
    {
      title: 'System Health Diagnostics',
      desc: 'Retrieve CPU, RAM, uptime, and desktop session metrics',
      prompt: 'get system status',
      icon: RotateCw,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border border-slate-800 p-6">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACTIVE DESKTOP OPERATING LAYER</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">
              Welcome back, {config.identity.userName || 'User'}. {agentName} is ready.
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Wake phrase: <span className="font-mono text-cyan-300">"{config.identity.wakePhrase}"</span> • 
              Voice: <span className="font-mono text-slate-300">{config.identity.voice}</span>
            </p>
          </div>

          {metrics && (
            <div className="flex items-center gap-4 bg-dark-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <div className="text-slate-500">CPU LOAD</div>
                <div className="text-cyan-400 font-semibold">{metrics.cpuPercent}%</div>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div>
                <div className="text-slate-500">RAM USED</div>
                <div className="text-violet-400 font-semibold">{metrics.memoryUsedMB} MB</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Task / Plan Card */}
      {activePlan ? (
        <div className="bg-dark-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Current Goal
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{activePlan.goal}</span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-normal uppercase ${
                    activePlan.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : activePlan.status === 'executing'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : activePlan.status === 'failed'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {activePlan.status}
                </span>
              </h3>
            </div>

            {activePlan.status === 'executing' && (
              <button
                onClick={onCancelTask}
                className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs rounded-lg font-mono transition-all"
              >
                Cancel Task
              </button>
            )}
          </div>

          {/* Operational Steps list without exposing chain-of-thought */}
          <div className="space-y-2">
            {activePlan.steps.map((step, idx) => {
              const isCurrent = activePlan.currentStepIndex === idx && activePlan.status === 'executing';
              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    step.status === 'completed'
                      ? 'bg-dark-950/60 border-slate-800 text-slate-300'
                      : isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : step.status === 'failed'
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-dark-950/30 border-slate-850 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <RotateCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : step.status === 'failed' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-slate-200">{step.title}</div>
                      {step.observation && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {step.observation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-dark-900 border border-slate-800">
                      {step.tool}
                    </span>
                    {step.riskLevel === 'HIGH' && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        HIGH RISK
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-6 text-center text-slate-500">
          <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
          <div className="text-sm font-medium text-slate-400">No task currently active</div>
          <div className="text-xs text-slate-500 mt-1">
            Give {agentName} a goal via natural voice or click one of the quick actions below.
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div>
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
          Quick Workflows
        </div>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => handleActionClick(action.prompt, action.title)}
                disabled={!!executingAction}
                className="p-4 rounded-xl bg-dark-900 hover:bg-dark-850 disabled:opacity-60 border border-slate-800 hover:border-slate-700 transition-all text-left flex items-start gap-3.5 group shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className={`p-2.5 rounded-lg bg-dark-950 border border-slate-800 group-hover:border-slate-700 ${action.color}`}>
                  {executingAction === action.title ? (
                    <RotateCw className="w-5 h-5 animate-spin text-cyan-400" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                    <span>{action.title}</span>
                    {executingAction === action.title && (
                      <span className="text-[10px] font-mono text-cyan-400 font-normal">Starting...</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {action.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
