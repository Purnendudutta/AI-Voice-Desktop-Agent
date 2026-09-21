import { useState, useEffect, useCallback } from 'react';
import { AgentState, TaskPlan } from '../../shared/types/agent';
import { PermissionRequest } from '../../shared/types/permissions';

export function useAgentStore() {
  const [state, setState] = useState<AgentState>('idle');
  const [activePlan, setActivePlan] = useState<TaskPlan | null>(null);
  const [permissionPrompt, setPermissionPrompt] = useState<PermissionRequest | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubState = window.electronAPI.onAgentState((newState) => {
      setState(newState);
    });

    const unsubPlan = window.electronAPI.onPlanUpdated((newPlan) => {
      setActivePlan(newPlan);
    });

    const unsubPerm = window.electronAPI.onPermissionRequest((req) => {
      setPermissionPrompt(req);
    });

    return () => {
      unsubState();
      unsubPlan();
      unsubPerm();
    };
  }, []);

  const sendPrompt = useCallback(async (text: string) => {
    if (!window.electronAPI) return;
    setState('thinking');
    const plan = await window.electronAPI.sendPrompt(text);
    if (plan) {
      setActivePlan(plan);
    }
    return plan;
  }, []);

  const cancelTask = useCallback(async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.cancelTask();
  }, []);

  const toggleRecording = useCallback(async () => {
    if (!window.electronAPI) return;
    if (isRecording) {
      await window.electronAPI.stopAudio();
      setIsRecording(false);
    } else {
      await window.electronAPI.startAudio();
      setIsRecording(true);
    }
  }, [isRecording]);

  const respondPermission = useCallback(async (approved: boolean, rememberChoice = false) => {
    if (!window.electronAPI || !permissionPrompt) return;
    await window.electronAPI.respondPermission({
      requestId: permissionPrompt.id,
      approved,
      rememberChoice,
      decidedAt: Date.now(),
    });
    setPermissionPrompt(null);
  }, [permissionPrompt]);

  return {
    state,
    activePlan,
    permissionPrompt,
    isRecording,
    sendPrompt,
    cancelTask,
    toggleRecording,
    respondPermission,
  };
}
