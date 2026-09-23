import React, { useState } from 'react';
import { Mic, MicOff, Send, Square, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { AgentState } from '../../../shared/types/agent';

interface VoiceBarProps {
  agentName: string;
  agentState: AgentState;
  isRecording: boolean;
  voiceResponseEnabled?: boolean;
  audioLevels?: number[];
  interimTranscript?: string;
  micError?: string | null;
  onSendPrompt: (prompt: string) => void;
  onToggleRecording: () => void;
  onToggleVoiceResponse?: () => void;
  onCancelTask: () => void;
}

export const VoiceBar: React.FC<VoiceBarProps> = ({
  agentName,
  agentState,
  isRecording,
  voiceResponseEnabled = true,
  audioLevels = [15, 25, 30, 45, 60, 40, 55, 35, 20, 15],
  interimTranscript,
  micError,
  onSendPrompt,
  onToggleRecording,
  onToggleVoiceResponse,
  onCancelTask,
}) => {
  const [text, setText] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const promptToSend = text.trim() || (interimTranscript && !interimTranscript.startsWith('Listening') ? interimTranscript.replace(/^Heard:\s*"/, '').replace(/"$/, '').trim() : '');
      if (promptToSend) {
        onSendPrompt(promptToSend);
        setText('');
      }
    }
  };

  const handleSend = () => {
    const promptToSend = text.trim() || (interimTranscript && !interimTranscript.startsWith('Listening') ? interimTranscript.replace(/^Heard:\s*"/, '').replace(/"$/, '').trim() : '');
    if (promptToSend) {
      onSendPrompt(promptToSend);
      setText('');
    }
  };

  const isBusy = agentState === 'thinking' || agentState === 'executing' || agentState === 'speaking';

  return (
    <div className="border-t border-slate-800/80 bg-dark-900/95 backdrop-blur-md px-6 py-3 space-y-2">
      {/* Real-time Voice Transcription Banner */}
      {interimTranscript && (!interimTranscript.startsWith('Listening') || isRecording) && (
        <div
          className={`max-w-4xl mx-auto px-3.5 py-1.5 rounded-lg border text-xs flex items-center justify-between font-mono animate-in fade-in ${
            interimTranscript.startsWith('Speech not recognized')
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{interimTranscript}</span>
          </div>
          {interimTranscript.startsWith('Executing:') && (
            <span className="text-[10px] text-emerald-400 font-medium">Auto-executing...</span>
          )}
        </div>
      )}

      {/* Microphone Error Notification Banner */}
      {micError && (
        <div className="max-w-4xl mx-auto p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 font-sans animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* Hardware Mic Toggle Button */}
        <button
          onClick={onToggleRecording}
          className={`p-3 rounded-xl flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-dark-800 hover:bg-slate-750 text-slate-300 border border-slate-700 hover:border-slate-600'
          }`}
          title={isRecording ? 'Click to stop listening' : `Click to activate microphone and speak to ${agentName}`}
        >
          {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Speaker / Spoken Feedback Toggle Button */}
        {onToggleVoiceResponse && (
          <button
            onClick={onToggleVoiceResponse}
            className={`p-3 rounded-xl flex items-center justify-center transition-all ${
              voiceResponseEnabled
                ? 'bg-dark-800 hover:bg-slate-750 text-cyan-400 border border-cyan-800/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'bg-dark-850 hover:bg-dark-800 text-slate-500 border border-slate-800'
            }`}
            title={
              voiceResponseEnabled
                ? 'Voice speech responses are ENABLED. Click to mute.'
                : 'Voice speech responses are MUTED (Silent mode). Click to unmute.'
            }
          >
            {voiceResponseEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        )}

        {/* Real-time Dynamic Waveform Visualizer */}
        {isRecording && (
          <div className="flex items-center gap-1 px-3.5 py-2.5 bg-dark-950 rounded-xl border border-rose-900/50 shadow-inner">
            {audioLevels.slice(0, 10).map((level, idx) => (
              <div
                key={idx}
                className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(6, Math.min(28, Math.round((level * 28) / 100)))}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Text / Voice Input Prompt */}
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? `Listening to your voice... (or type your goal here and press Enter)`
                : `Tell ${agentName || 'your agent'} a goal... (e.g. "open terminal", "organize downloads")`
            }
            className="w-full bg-dark-950/80 text-sm rounded-xl px-4 py-3 border text-slate-100 placeholder-slate-500 border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 focus:outline-none transition-all font-sans"
          />
          <div className="absolute right-3 top-3 text-slate-600 flex items-center gap-1 text-[11px] font-mono pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ENTER</span>
          </div>
        </div>

        {/* Send Action */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && (!interimTranscript || interimTranscript.startsWith('Listening'))}
          className="p-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-dark-950 rounded-xl transition-all font-semibold flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:shadow-none"
          title="Send goal to agent"
        >
          <Send className="w-4 h-4" />
        </button>

        {/* Instant Stop / Barge-In Button */}
        {isBusy && (
          <button
            onClick={onCancelTask}
            className="px-3.5 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
            title="Interrupt voice and cancel active task safely"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>STOP</span>
          </button>
        )}
      </div>
    </div>
  );
};
