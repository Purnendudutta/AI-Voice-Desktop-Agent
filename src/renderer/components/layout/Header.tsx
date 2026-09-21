import React from 'react';
import { AppConfig } from '../../../shared/types/config';
import { AgentState } from '../../../shared/types/agent';
import { Mic, Eye, Cloud, Cpu, AlertCircle, CheckCircle2, Loader2, Volume2 } from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  agentState: AgentState;
  isRecording: boolean;
}

export const Header: React.FC<HeaderProps> = ({ config, agentState, isRecording }) => {
  const agentName = config.identity.agentName || 'Agent';

  const getStateBadge = () => {
    switch (agentState) {
      case 'listening':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse">
            <Mic className="w-3.5 h-3.5 text-cyan-400" /> {agentName} is listening...
          </span>
        );
      case 'thinking':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/80 text-violet-300 border border-violet-500/50">
            <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" /> Planning task...
          </span>
        );
      case 'executing':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Executing steps
          </span>
        );
      case 'waiting_confirmation':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-bounce">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Awaiting approval
          </span>
        );
      case 'speaking':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Speaking
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Execution halted
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-dark-850 text-slate-300 border border-slate-700/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ready
          </span>
        );
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-dark-900/95 backdrop-blur-md pl-6 pr-44 flex items-center justify-between z-20 select-none [-webkit-app-region:drag]">
      {/* Left side: Identity & Status */}
      <div className="flex items-center gap-4 [-webkit-app-region:no-drag]">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
          <h1 className="text-base font-bold tracking-wider uppercase text-slate-100 flex items-center gap-2">
            <span>{agentName}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 normal-case font-mono font-normal">
              Desktop Agent
            </span>
          </h1>
        </div>
        {getStateBadge()}
      </div>

      {/* Right side: High-contrast badges with pr-44 margin avoiding Windows caption buttons */}
      <div className="flex items-center gap-2.5 text-xs font-mono [-webkit-app-region:no-drag]">
        {/* Mic Active Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            isRecording
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse font-semibold'
              : 'bg-dark-850 text-slate-400 border-slate-700'
          }`}
          title={isRecording ? 'Microphone is actively capturing audio' : 'Microphone is standby'}
        >
          <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-400 animate-ping' : 'bg-slate-500'}`} />
          <Mic className="w-3.5 h-3.5" />
          <span>{isRecording ? 'MIC LIVE' : 'MIC IDLE'}</span>
        </div>

        {/* Screen Awareness Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            config.security.screenAwarenessConsent
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] font-semibold'
              : 'bg-dark-850 text-slate-400 border-slate-700'
          }`}
          title="Screen understanding & vision status"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>{config.security.screenAwarenessConsent ? 'VISION ON' : 'VISION OFF'}</span>
        </div>

        {/* AI Provider Mode Pill - Bright, High Contrast, Crystal Clear */}
        {config.ai.provider === 'gemini' && config.ai.geminiApiKey ? (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-violet-500/15 text-violet-200 border-violet-500/40 font-semibold shadow-[0_0_12px_rgba(139,92,246,0.2)]"
            title="Connected to Google Gemini Live & Flash Cloud API"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <Cloud className="w-3.5 h-3.5 text-violet-400" />
            <span>GEMINI CLOUD</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-500/15 text-emerald-200 border-emerald-500/40 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            title="Running in Local / Offline Mode (Deterministic Mock & Local Tools)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>LOCAL MODE</span>
          </div>
        )}
      </div>
    </header>
  );
};
