import os from 'node:os';

export interface ProactiveAlert {
  id: string;
  category: 'disk' | 'memory' | 'git' | 'process';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
}

export class ProactiveAssistant {
  private isEnabled = true;
  private alerts: ProactiveAlert[] = [];
  private onAlertCallback?: (alert: ProactiveAlert) => void;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  public setAlertCallback(cb: (alert: ProactiveAlert) => void): void {
    this.onAlertCallback = cb;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  private startMonitoring(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.isEnabled) return;
      this.checkSystemHealth();
    }, 120000); // every 2 minutes
  }

  public checkSystemHealth(): void {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const freeRatio = freeMem / totalMem;

    // High memory alert
    if (freeRatio < 0.1) {
      const alert: ProactiveAlert = {
        id: `alert_mem_${Date.now()}`,
        category: 'memory',
        severity: 'warning',
        title: 'High Memory Pressure',
        message: `Available system RAM is below 10% (${Math.round(freeMem / 1024 / 1024)} MB remaining).`,
        timestamp: Date.now(),
      };
      this.pushAlert(alert);
    }
  }

  private pushAlert(alert: ProactiveAlert): void {
    this.alerts.unshift(alert);
    if (this.alerts.length > 50) this.alerts.pop();
    if (this.onAlertCallback) {
      this.onAlertCallback(alert);
    }
  }

  public getRecentAlerts(): ProactiveAlert[] {
    return this.alerts.slice(0, 10);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
