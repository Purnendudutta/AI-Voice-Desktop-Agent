import React, { useState } from 'react';
import { AgentIdentity } from '../../../shared/types/config';
import { Sparkles, Bot, Mic, User, Volume2, Globe, Shield } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: (identity: AgentIdentity) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [agentName, setAgentName] = useState('Atlas');
  const [nickname, setNickname] = useState('');
  const [userName, setUserName] = useState('Engineer');
  const [wakePhrase, setWakePhrase] = useState('Hey Atlas');
  const [language, setLanguage] = useState('en-US');
  const [voice, setVoice] = useState('Aoede');
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const handleNameChange = (name: string) => {
    setAgentName(name);
    setWakePhrase(`Hey ${name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    onComplete({
      agentName: agentName.trim(),
      nickname: nickname.trim(),
      userName: userName.trim(),
      wakePhrase: wakePhrase.trim(),
      language,
      voice,
      personalityMode: 'efficient',
      voiceResponseEnabled,
      startOnBoot,
      theme,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-cyan-500/30 rounded-2xl w-full max-w-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 to-violet-950/40">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Let's personalize your AI agent.</h2>
              <p className="text-xs text-slate-400">Configure identity, wake phrase, and voice preferences.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" /> Agent Name *
              </label>
              <input
                type="text"
                required
                value={agentName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Atlas, Nova, Friday, Jarvis"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Optional Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Buddy"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your preferred name"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-400" /> Wake Phrase
              </label>
              <input
                type="text"
                value={wakePhrase}
                onChange={(e) => setWakePhrase(e.target.value)}
                placeholder="e.g. Hey Atlas"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish (ES)</option>
                <option value="fr-FR">French (FR)</option>
                <option value="de-DE">German (DE)</option>
                <option value="ja-JP">Japanese (JA)</option>
                <option value="hi-IN">Hindi (HI)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Preferred Voice
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Aoede">Aoede (Natural & Expressive)</option>
                <option value="Puck">Puck (Friendly & Energetic)</option>
                <option value="Charon">Charon (Deep & Professional)</option>
                <option value="Kore">Kore (Calm & Focused)</option>
                <option value="Fenrir">Fenrir (Authoritative)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={voiceResponseEnabled}
                onChange={(e) => setVoiceResponseEnabled(e.target.checked)}
                className="rounded bg-dark-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Enable spoken voice responses (TTS / Gemini Live Audio)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={startOnBoot}
                onChange={(e) => setStartOnBoot(e.target.checked)}
                className="rounded bg-dark-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Launch assistant automatically on system startup</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-dark-950 font-semibold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize Agent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
