import { RiskLevel, PermissionOutcome, PermissionRequest, PermissionDecision } from '../../shared/types/permissions';
import { AppConfig } from '../../shared/types/config';

export class PermissionEngine {
  private config: AppConfig;
  private pendingRequests = new Map<string, {
    resolve: (approved: boolean) => void;
    request: PermissionRequest;
  }>();
  private rememberedDecisions = new Map<string, boolean>();
  private onPromptCallback?: (request: PermissionRequest) => void;

  constructor(config: AppConfig) {
    this.config = config;
  }

  public updateConfig(config: AppConfig): void {
    this.config = config;
  }

  public setPromptCallback(callback: (request: PermissionRequest) => void): void {
    this.onPromptCallback = callback;
  }

  public evaluateRisk(toolId: string, riskLevel: RiskLevel): PermissionOutcome {
    if (riskLevel === 'HIGH') {
      if (this.config.security.defaultActionForHighRisk === 'BLOCK') {
        return 'BLOCK';
      }
      return 'CONFIRM';
    }
    if (riskLevel === 'MEDIUM') {
      return 'ALLOW'; // Medium operations proceed unless specific rule triggers
    }
    return 'ALLOW';
  }

  public async requestPermission(request: Omit<PermissionRequest, 'id' | 'createdAt'>): Promise<boolean> {
    const cacheKey = `${request.toolId}:${JSON.stringify(request.affectedResources)}`;
    if (this.rememberedDecisions.has(cacheKey)) {
      return this.rememberedDecisions.get(cacheKey)!;
    }

    const id = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullRequest: PermissionRequest = {
      ...request,
      id,
      createdAt: Date.now(),
    };

    return new Promise<boolean>((resolve) => {
      this.pendingRequests.set(id, { resolve, request: fullRequest });
      if (this.onPromptCallback) {
        this.onPromptCallback(fullRequest);
      } else {
        // Safe default if no UI attached: reject high risk
        resolve(false);
      }
    });
  }

  public handleDecision(decision: PermissionDecision): void {
    const pending = this.pendingRequests.get(decision.requestId);
    if (!pending) return;

    if (decision.rememberChoice) {
      const cacheKey = `${pending.request.toolId}:${JSON.stringify(pending.request.affectedResources)}`;
      this.rememberedDecisions.set(cacheKey, decision.approved);
    }

    pending.resolve(decision.approved);
    this.pendingRequests.delete(decision.requestId);
  }

  public cancelPendingForTask(taskId: string): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      if (pending.request.taskId === taskId) {
        pending.resolve(false);
        this.pendingRequests.delete(id);
      }
    }
  }
}
