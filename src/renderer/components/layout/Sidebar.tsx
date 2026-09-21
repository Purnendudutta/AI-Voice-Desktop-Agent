import React from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Workflow,
  BrainCircuit,
  Boxes,
  Code2,
  ShieldCheck,
  Activity,
  Gauge,
  Settings,
  Sparkles,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'tasks'
  | 'workflows'
  | 'memory'
  | 'plugins'
  | 'developer'
  | 'security'
  | 'activity'
  | 'system'
  | 'settings'
  | 'benchmarks';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as TabType, label: 'Tasks & Planning', icon: ListTodo },
    { id: 'workflows' as TabType, label: 'Workflows', icon: Workflow },
    { id: 'memory' as TabType, label: 'Memory', icon: BrainCircuit },
    { id: 'plugins' as TabType, label: 'Plugins', icon: Boxes },
    { id: 'developer' as TabType, label: 'Developer Mode', icon: Code2 },
    { id: 'security' as TabType, label: 'Security & Sandbox', icon: ShieldCheck },
    { id: 'activity' as TabType, label: 'Audit Trail', icon: Activity },
    { id: 'system' as TabType, label: 'System Status', icon: Gauge },
    { id: 'benchmarks' as TabType, label: 'Evaluations', icon: Sparkles },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 border-r border-slate-800/80 bg-dark-900/60 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
          Command Center
        </div>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onTabChange('system')}
        className="p-3 rounded-lg bg-dark-850/80 hover:bg-dark-800 border border-slate-800/60 hover:border-cyan-500/40 text-[11px] text-slate-400 font-mono text-left transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="group-hover:text-cyan-400 transition-colors">SYSTEM STATUS</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>
        <div className="truncate text-slate-400 group-hover:text-slate-200">Diagnostics & Metrics →</div>
      </button>
    </aside>
  );
};
