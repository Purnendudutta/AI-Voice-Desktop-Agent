import { RiskLevel } from './permissions';

export type ToolCategory =
  | 'desktop'
  | 'browser'
  | 'files'
  | 'system'
  | 'developer'
  | 'git'
  | 'productivity'
  | 'vision'
  | 'memory';

export interface ToolVerificationResult {
  verified: boolean;
  message: string;
  details?: Record<string, unknown>;
  retryRecommended?: boolean;
}

export interface ToolRecoveryStrategy {
  canRecover: boolean;
  alternativeTool?: string;
  suggestedArguments?: Record<string, unknown>;
  userClarificationRequired?: boolean;
  clarificationQuestion?: string;
}

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
  returns: {
    type: string;
    description: string;
  };
  riskLevel: RiskLevel;
  timeoutMs: number;
  requiresPermissions: string[];
}

export interface ToolCall {
  toolId: string;
  arguments: Record<string, unknown>;
}

export interface ToolExecutionResult {
  toolId: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTimeMs: number;
  verification?: ToolVerificationResult;
}
