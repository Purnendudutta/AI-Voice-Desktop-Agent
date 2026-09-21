import React, { useState, useEffect } from 'react';
import { AppConfig } from '../../../shared/types/config';
import { Settings, Bot, Key, Shield, Sparkles, Check, Globe, Volume2, Eye } from 'lucide-react';

interface SettingsViewProps {
  config: AppConfig;
  onUpdateConfig: (partial: Partial<AppConfig>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdateConfig }) => {
  const [identity, setIdentity] = useState(config.identity);
  const [ai, setAi] = useState(config.ai);
  const [security, setSecurity] = useState(config.security);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setIdentity(config.identity);
    setAi(config.ai);
    setSecurity(config.security);
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      identity,
      ai,
      security,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Agent Settings & Configuration</span>
          </h2>
          <p className="text-xs text-slate-400">
            Personalize your AI agent's name, wake-word, voice, and API provider credentials.
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Configuration updated dynamically!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Agent Identity */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Profile & Agent Identity</span>
            </h3>
            <p className="text-xs text-slate-400">
              The agent name is dynamically bound across the entire system.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Agent Name</label>
              <input
                type="text"
                value={identity.agentName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setIdentity({ ...identity, agentName: newName, wakePhrase: `Hey ${newName}` });
                }}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Wake Phrase</label>
              <input
                type="text"
                value={identity.wakePhrase}
                onChange={(e) => setIdentity({ ...identity, wakePhrase: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">User Name</label>
              <input
                type="text"
                value={identity.userName}
                onChange={(e) => setIdentity({ ...identity, userName: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Language</label>
              <select
                value={identity.language}
                onChange={(e) => setIdentity({ ...identity, language: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish (ES)</option>
                <option value="fr-FR">French (FR)</option>
                <option value="de-DE">German (DE)</option>
                <option value="ja-JP">Japanese (JA)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Voice</label>
              <select
                value={identity.voice}
                onChange={(e) => setIdentity({ ...identity, voice: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="Aoede">Aoede</option>
                <option value="Puck">Puck</option>
                <option value="Charon">Charon</option>
                <option value="Kore">Kore</option>
                <option value="Fenrir">Fenrir</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={identity.voiceResponseEnabled}
                onChange={(e) => setIdentity({ ...identity, voiceResponseEnabled: e.target.checked })}
                className="rounded bg-dark-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Spoken voice feedback enabled</span>
            </label>
          </div>
        </div>

        {/* Section 2: AI Provider Settings */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-violet-400" />
              <span>AI Models & Cloud Routing</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure Google Gemini API keys or choose offline mock execution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">AI Provider Engine</label>
              <select
                value={ai.provider}
                onChange={(e) => setAi({ ...ai, provider: e.target.value as any })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="gemini">Google Gemini (GenAI SDK)</option>
                <option value="mock">Deterministic Mock (Offline / No Key)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Routing Mode</label>
              <select
                value={ai.cloudRoutingMode}
                onChange={(e) => setAi({ ...ai, cloudRoutingMode: e.target.value as any })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="auto">Auto (Simple local / Complex cloud)</option>
                <option value="cloud_only">Cloud Only</option>
                <option value="local_only">Local Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Gemini API Key</label>
            <input
              type="password"
              value={ai.geminiApiKey || ''}
              onChange={(e) => setAi({ ...ai, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Planning Model</label>
              <input
                type="text"
                value={ai.planningModel}
                onChange={(e) => setAi({ ...ai, planningModel: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Live Voice Model</label>
              <input
                type="text"
                value={ai.liveVoiceModel}
                onChange={(e) => setAi({ ...ai, liveVoiceModel: e.target.value })}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Privacy & Screen Awareness */}
        <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Vision Awareness</span>
            </h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={security.screenAwarenessConsent}
              onChange={(e) => setSecurity({ ...security, screenAwarenessConsent: e.target.checked })}
              className="rounded bg-dark-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Enable screen-awareness mode (allows vision model to inspect desktop window screenshots)</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-semibold rounded-xl text-xs transition-all font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};
