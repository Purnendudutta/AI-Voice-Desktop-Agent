import { ToolCall, ToolVerificationResult } from './tools';
import { RiskLevel } from './permissions';

export type TaskStatus = 
  | 'idle'
  | 'planning'
  | 'confirming'
  | 'executing'
  | 'verifying'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type StepStatus = 
  | 'pending'
  | 'confirming'
  | 'running'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'recovering';

export interface TaskStep {
  id: string;
  order: number;
  title: string;
  description: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: StepStatus;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  observation?: string;
  verification?: ToolVerificationResult;
  error?: string;
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  startedAt?: number;
  completedAt?: number;
}

export interface TaskPlan {
  taskId: string;
  goal: string;
  status: TaskStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  steps: TaskStep[];
  currentStepIndex: number;
  requiredTools: string[];
  overallRiskLevel: RiskLevel;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  summary?: string;
  error?: string;
}

export interface DesktopContext {
  activeApplication?: {
    name: string;
    title: string;
    processId?: number;
  };
  activeWindow?: {
    title: string;
    bounds?: { x: number; y: number; width: number; height: number };
  };
  openWindows: Array<{ id: string; title: string; app: string }>;
  currentProject?: {
    name: string;
    path: string;
    branch?: string;
  };
  recentActions: string[];
  clipboardPreview?: string;
  systemMetrics?: {
    cpuPercent: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
  };
  relevantMemory?: string[];
  timestamp: number;
}

export type AgentState = 
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'speaking'
  | 'waiting_confirmation'
  | 'error';
