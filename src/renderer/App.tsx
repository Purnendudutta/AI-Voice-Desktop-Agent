import React, { useState } from 'react';
import { useConfigStore } from './stores/useConfigStore';
import { useAgentStore } from './stores/useAgentStore';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { VoiceBar } from './components/layout/VoiceBar';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { PermissionModal } from './components/modals/PermissionModal';

// Pages
import { DashboardView } from './components/pages/DashboardView';
import { TasksView } from './components/pages/TasksView';
import { WorkflowsView } from './components/pages/WorkflowsView';
import { MemoryView } from './components/pages/MemoryView';
import { PluginsView } from './components/pages/PluginsView';
import { DeveloperModeView } from './components/pages/DeveloperModeView';
import { SecurityView } from './components/pages/SecurityView';
import { ActivityView } from './components/pages/ActivityView';
import { SystemStatusView } from './components/pages/SystemStatusView';
import { SettingsView } from './components/pages/SettingsView';
import { BenchmarkView } from './components/pages/BenchmarkView';
import { useAudioStream } from './hooks/useAudioStream';

export const App: React.FC = () => {
  const { config, updateConfig, completeOnboarding, isLoading } = useConfigStore();
  const {
    state,
    activePlan,
    permissionPrompt,
    sendPrompt,
    cancelTask,
    respondPermission,
  } = useAgentStore();

  const {
    isListening,
    audioLevels,
    interimText,
    micError,
    toggleListening,
    speakText,
    stopSpeaking,
  } = useAudioStream({
    wakePhrase: config.identity.wakePhrase,
    agentName: config.identity.agentName,
    voiceResponseEnabled: config.identity.voiceResponseEnabled,
    onCommand: (cmd) => sendPrompt(cmd),
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Speak agent response when a plan completes and voice is enabled
  React.useEffect(() => {
    if (
      activePlan?.status === 'completed' &&
      config.identity.voiceResponseEnabled &&
      activePlan.summary
    ) {
      speakText(activePlan.summary);
    }
  }, [activePlan?.status, activePlan?.summary, config.identity.voiceResponseEnabled, speakText]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-dark-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        Initializing Agent Operating Layer...
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            config={config}
            activePlan={activePlan}
            onSendPrompt={sendPrompt}
            onCancelTask={cancelTask}
          />
        );
      case 'tasks':
        return <TasksView activePlan={activePlan} onCancelTask={cancelTask} />;
      case 'workflows':
        return <WorkflowsView />;
      case 'memory':
        return <MemoryView />;
      case 'plugins':
        return <PluginsView />;
      case 'developer':
        return <DeveloperModeView />;
      case 'security':
        return <SecurityView config={config} onUpdateConfig={updateConfig} />;
      case 'activity':
        return <ActivityView />;
      case 'system':
        return <SystemStatusView />;
      case 'settings':
        return <SettingsView config={config} onUpdateConfig={updateConfig} />;
      case 'benchmarks':
        return <BenchmarkView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Dynamic Header */}
      <Header
        config={config}
        agentState={isListening && state === 'idle' ? 'listening' : state}
        isRecording={isListening}
        onToggleRecording={toggleListening}
        onToggleVision={() => {
          updateConfig({
            security: {
              ...config.security,
              screenAwarenessConsent: !config.security.screenAwarenessConsent,
            },
          });
        }}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden bg-dark-950/60 relative">
          {renderActiveView()}
        </main>
      </div>

      {/* Voice & Prompt Bar */}
      <VoiceBar
        agentName={config.identity.agentName || 'Agent'}
        agentState={isListening && state === 'idle' ? 'listening' : state}
        isRecording={isListening}
        voiceResponseEnabled={config.identity.voiceResponseEnabled}
        audioLevels={audioLevels}
        interimTranscript={interimText}
        micError={micError}
        onSendPrompt={sendPrompt}
        onToggleRecording={toggleListening}
        onToggleVoiceResponse={() => {
          updateConfig({
            identity: {
              ...config.identity,
              voiceResponseEnabled: !config.identity.voiceResponseEnabled,
            },
          });
        }}
        onCancelTask={() => {
          stopSpeaking();
          cancelTask();
        }}
      />

      {/* First-launch Onboarding Modal */}
      {!config.isOnboarded && (
        <OnboardingModal onComplete={completeOnboarding} />
      )}

      {/* High-Risk Permission Approval Dialog */}
      {permissionPrompt && (
        <PermissionModal
          request={permissionPrompt}
          onRespond={respondPermission}
        />
      )}
    </div>
  );
};
