import { AuditEvent, RiskLevel } from '../../shared/types/permissions';

export class AuditLogger {
  private events: AuditEvent[] = [];
  private readonly maxMemoryEvents = 1000;
  private onEventLogged?: (event: AuditEvent) => void;

  constructor() {}

  public setListener(listener: (event: AuditEvent) => void): void {
    this.onEventLogged = listener;
  }

  public log(entry: {
    taskId?: string;
    action: string;
    toolId?: string;
    riskLevel: RiskLevel;
    status: AuditEvent['status'];
    details?: Record<string, unknown>;
    executionTimeMs?: number;
    userConfirmed?: boolean;
  }): AuditEvent {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      taskId: entry.taskId,
      action: entry.action,
      toolId: entry.toolId,
      riskLevel: entry.riskLevel,
      status: entry.status,
      details: entry.details || {},
      executionTimeMs: entry.executionTimeMs,
      userConfirmed: entry.userConfirmed,
    };

    this.events.unshift(event);
    if (this.events.length > this.maxMemoryEvents) {
      this.events.pop();
    }

    if (this.onEventLogged) {
      this.onEventLogged(event);
    }

    return event;
  }

  public getEvents(limit = 100, filter?: { riskLevel?: RiskLevel; status?: string }): AuditEvent[] {
    let result = this.events;
    if (filter?.riskLevel) {
      result = result.filter((e) => e.riskLevel === filter.riskLevel);
    }
    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }
    return result.slice(0, limit);
  }

  public clear(): void {
    this.events = [];
  }
}
