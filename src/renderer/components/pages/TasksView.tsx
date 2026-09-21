import React from 'react';
import { TaskPlan } from '../../../shared/types/agent';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  ShieldAlert,
  Terminal,
  Layers,
  Square,
} from 'lucide-react';

interface TasksViewProps {
  activePlan: TaskPlan | null;
  onCancelTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ activePlan, onCancelTask }) => {
  if (!activePlan) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans h-full flex flex-col items-center justify-center">
        <Layers className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Task In Progress</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          When the agent creates a multi-step task plan, full operational step status, verification results, and recovery traces appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      {/* Plan Header */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <span>TASK ID:</span>
            <span className="text-cyan-400">{activePlan.taskId}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-mono uppercase font-semibold ${
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
            {activePlan.status === 'executing' && (
              <button
                onClick={onCancelTask}
                className="px-3 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-mono flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-100">{activePlan.goal}</h2>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
          <div>Priority: <span className="text-slate-200 uppercase">{activePlan.priority}</span></div>
          <div>Risk Level: <span className="text-slate-200">{activePlan.overallRiskLevel}</span></div>
          <div>Total Steps: <span className="text-slate-200">{activePlan.steps.length}</span></div>
          <div>Created: <span className="text-slate-400">{new Date(activePlan.createdAt).toLocaleTimeString()}</span></div>
        </div>
      </div>

      {/* Steps Timeline Tree */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          Task Execution Tree
        </div>

        {activePlan.steps.map((step, idx) => {
          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition-all ${
                step.status === 'completed'
                  ? 'bg-dark-900/80 border-slate-800'
                  : step.status === 'running'
                  ? 'bg-dark-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  : step.status === 'failed'
                  ? 'bg-dark-900 border-rose-800/80'
                  : 'bg-dark-950/40 border-slate-850 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : step.status === 'running' ? (
                      <RotateCw className="w-5 h-5 text-cyan-400 animate-spin" />
                    ) : step.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>

                    {/* Observation & Verification details */}
                    {step.observation && (
                      <div className="mt-2 p-2.5 bg-dark-950 rounded-lg border border-slate-800/80 text-xs font-mono text-cyan-300/90">
                        <span className="text-slate-500 mr-2">[Observation]</span>
                        {step.observation}
                      </div>
                    )}

                    {step.verification && (
                      <div className="mt-1 text-[11px] font-mono text-slate-400">
                        Verification:{' '}
                        <span className={step.verification.verified ? 'text-emerald-400' : 'text-rose-400'}>
                          {step.verification.message}
                        </span>
                      </div>
                    )}

                    {step.recoveryAttempts > 0 && (
                      <div className="mt-1 text-[11px] font-mono text-amber-400">
                        Recovered after {step.recoveryAttempts} retry attempts
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-400">
                    {step.tool}
                  </span>
                  {step.riskLevel === 'HIGH' && (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>HIGH</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
