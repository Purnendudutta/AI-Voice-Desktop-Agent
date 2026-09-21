export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PermissionOutcome = 'ALLOW' | 'CONFIRM' | 'BLOCK';

export interface PermissionRequest {
  id: string;
  taskId: string;
  stepId: string;
  toolId: string;
  toolName: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  affectedResources: string[];
  commandPreview?: string;
  arguments: Record<string, unknown>;
  createdAt: number;
}

export interface PermissionDecision {
  requestId: string;
  approved: boolean;
  rememberChoice?: boolean;
  decidedAt: number;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  taskId?: string;
  action: string;
  toolId?: string;
  riskLevel: RiskLevel;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'BLOCKED' | 'CANCELLED';
  details: Record<string, unknown>;
  executionTimeMs?: number;
  userConfirmed?: boolean;
}
