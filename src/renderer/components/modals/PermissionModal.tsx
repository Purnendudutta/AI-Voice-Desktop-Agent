import React, { useState } from 'react';
import { PermissionRequest } from '../../../shared/types/permissions';
import { ShieldAlert, AlertTriangle, Check, X, Terminal, FileText } from 'lucide-react';

interface PermissionModalProps {
  request: PermissionRequest;
  onRespond: (approved: boolean, rememberChoice: boolean) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ request, onRespond }) => {
  const [remember, setRemember] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-rose-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-rose-950/50 to-dark-900 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">High-Risk Operation Confirmation</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800 font-semibold">
                {request.riskLevel}
              </span>
            </div>
            <p className="text-xs text-slate-400">Review required before execution continues.</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-sans">
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-1">{request.title}</div>
            <div className="text-slate-400 leading-relaxed">{request.description}</div>
          </div>

          {/* Affected Resources / Command Preview */}
          {request.affectedResources.length > 0 && (
            <div className="p-3 bg-dark-950 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div className="text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Affected Resources:
              </div>
              <ul className="space-y-1 text-slate-300">
                {request.affectedResources.map((res, idx) => (
                  <li key={idx} className="truncate">• {res}</li>
                ))}
              </ul>
            </div>
          )}

          {request.arguments && Object.keys(request.arguments).length > 0 && (
            <div className="p-3 bg-dark-950 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto">
              <div className="text-slate-500 mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Arguments Payload:
              </div>
              <pre className="text-cyan-300/90 text-[10px]">
                {JSON.stringify(request.arguments, null, 2)}
              </pre>
            </div>
          )}

          {/* Remember Choice Checkbox */}
          <label className="flex items-center gap-2 pt-2 cursor-pointer text-slate-400 hover:text-slate-200 text-xs">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded bg-dark-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Remember my approval for this action during this session</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-dark-950 flex items-center justify-end gap-3">
          <button
            onClick={() => onRespond(false, remember)}
            className="px-4 py-2 bg-dark-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            onClick={() => onRespond(true, remember)}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Continue & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
