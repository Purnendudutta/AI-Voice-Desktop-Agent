import React, { useState, useEffect } from 'react';
import { AuditEvent } from '../../../shared/types/permissions';
import { Activity, Trash2, Download, Filter, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  const loadAuditLogs = async () => {
    if (window.electronAPI) {
      const logs = await window.electronAPI.getAuditLogs(100);
      setEvents(logs || []);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleClear = async () => {
    if (window.electronAPI) {
      await window.electronAPI.clearAuditLogs();
      setEvents([]);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agent_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filtered = events.filter((e) => {
    if (filterRisk === 'ALL') return true;
    return e.riskLevel === filterRisk;
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Audit Trail & Execution Log</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable chronological record of all agent decisions, tool invocations, and user confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterRisk(level)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterRisk === level
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-dark-900 border border-slate-800'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={events.length === 0}
            className="p-2 text-slate-400 hover:text-cyan-400 disabled:opacity-40 bg-dark-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Export audit log to JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 text-slate-500 hover:text-rose-400 bg-dark-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Clear audit log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-dark-900 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-dark-950 text-slate-400 font-mono text-[11px]">
              <th className="p-3 pl-4">TIMESTAMP</th>
              <th className="p-3">ACTION / TOOL</th>
              <th className="p-3">RISK</th>
              <th className="p-3">STATUS</th>
              <th className="p-3">DURATION</th>
              <th className="p-3 pr-4">DETAILS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No audit log entries recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="p-3 pl-4 text-slate-500 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-medium text-slate-200">{evt.action}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        evt.riskLevel === 'HIGH'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : evt.riskLevel === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-dark-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {evt.riskLevel}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                        evt.status === 'COMPLETED'
                          ? 'text-emerald-400'
                          : evt.status === 'FAILED'
                          ? 'text-rose-400'
                          : evt.status === 'CANCELLED'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {evt.executionTimeMs ? `${evt.executionTimeMs}ms` : '-'}
                  </td>
                  <td className="p-3 pr-4 text-slate-400 truncate max-w-xs">
                    {JSON.stringify(evt.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
