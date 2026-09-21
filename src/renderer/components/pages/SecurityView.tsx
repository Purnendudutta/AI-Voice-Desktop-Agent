import React from 'react';
import { AppConfig } from '../../../shared/types/config';
import { ShieldCheck, Lock, Terminal, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

interface SecurityViewProps {
  config: AppConfig;
  onUpdateConfig: (partial: Partial<AppConfig>) => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ config, onUpdateConfig }) => {
  const security = config.security;

  const handleToggleAllowlist = () => {
    onUpdateConfig({
      security: {
        ...security,
        commandAllowlistEnabled: !security.commandAllowlistEnabled,
      },
    });
  };

  const handleActionChange = (action: 'CONFIRM' | 'BLOCK') => {
    onUpdateConfig({
      security: {
        ...security,
        defaultActionForHighRisk: action,
      },
    });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-400" />
          <span>Security & Sandbox Engine</span>
        </h2>
        <p className="text-xs text-slate-400">
          Zero-trust permission boundaries, dangerous command blocking, and sandbox isolation.
        </p>
      </div>

      {/* Risk Category Matrix */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Risk Classification & Outcomes</span>
        </h3>

        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold">LOW RISK</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                AUTO-ALLOW
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Read-only operations, app launches, file searches, system metrics.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold">MEDIUM RISK</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                CONTROLLED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              Creating/moving files, installing project dependencies, sandboxed commands.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-950 border border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-rose-400 font-bold">HIGH RISK</span>
              <div className="flex items-center gap-1">
                {(['CONFIRM', 'BLOCK'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleActionChange(mode)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      security.defaultActionForHighRisk === mode
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                        : 'bg-dark-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-slate-400 text-[11px] font-sans">
              File deletion, privileged terminal execution, code push, destructive changes.
            </p>
          </div>
        </div>
      </div>

      {/* Dangerous Commands Blacklist */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-200">Enforced Dangerous Patterns</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">HARD-BLOCKED IN MAIN PROCESS</span>
        </div>
        <p className="text-xs text-slate-400">
          The following destructive shell command signatures are immediately intercepted and aborted before execution:
        </p>
        <div className="p-3 bg-dark-950 rounded-xl border border-slate-850 font-mono text-[11px] text-rose-300/80 space-y-1">
          <div>• rm -rf / or rm -rf \</div>
          <div>• del /f /s /q c:\</div>
          <div>• format [c-z]: or mkfs</div>
          <div>• fork bombs :() &#123; :|:& &#125;; :</div>
          <div>• shutdown /s or reboot</div>
        </div>
      </div>

      {/* Command Allowlist Switch */}
      <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Strict Command Allowlist Mode</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            When enabled, only strictly verified commands (e.g. git, npm test, node) can be executed.
          </p>
        </div>
        <button
          onClick={handleToggleAllowlist}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
            security.commandAllowlistEnabled
              ? 'bg-cyan-500 text-dark-950 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-dark-800 text-slate-400 border border-slate-700'
          }`}
        >
          {security.commandAllowlistEnabled ? 'ALLOWLIST ACTIVE' : 'ALLOWLIST DISABLED'}
        </button>
      </div>
    </div>
  );
};
