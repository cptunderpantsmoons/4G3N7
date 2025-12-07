/**
 * Phase 6.2 - Extension Monitor Service
 * Extension status monitoring and health checks
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ExtensionStatusInfo,
  ExtensionAlert,
  ExtensionLog,
  ExtensionHealthCheck,
} from '../interfaces/ui-extension-management.interface';

@Injectable()
export class ExtensionMonitorService {
  private readonly logger = new Logger(ExtensionMonitorService.name);

  private statuses = new Map<string, ExtensionStatusInfo>();
  private alerts = new Map<string, ExtensionAlert[]>();
  private logs = new Map<string, ExtensionLog[]>();
  private health = new Map<string, ExtensionHealthCheck>();

  constructor() {
    this.startMonitoring();
  }

  async getExtensionStatus(extensionId: string): Promise<ExtensionStatusInfo> {
    this.logger.debug(`Getting status for extension: ${extensionId}`);

    let status = this.statuses.get(extensionId);
    if (!status) {
      status = {
        statusId: `status_${extensionId}`,
        extensionId,
        installed: true,
        enabled: true,
        running: true,
        uptime: 3600000,
        crashes: 0,
        errorCount: 0,
        warningCount: 0,
        memoryUsage: 50,
        cpuUsage: 5,
        dataUsage: 100,
      };
      this.statuses.set(extensionId, status);
    }

    return status;
  }

  async listExtensionAlerts(extensionId?: string): Promise<ExtensionAlert[]> {
    this.logger.debug(`Listing alerts for extension: ${extensionId}`);

    let allAlerts: ExtensionAlert[] = [];
    if (extensionId) {
      allAlerts = this.alerts.get(extensionId) || [];
    } else {
      for (const alerts of this.alerts.values()) {
        allAlerts.push(...alerts);
      }
    }

    return allAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getExtensionLogs(extensionId: string, limit: number = 100): Promise<ExtensionLog[]> {
    this.logger.debug(`Getting logs for extension: ${extensionId}`);

    const logs = this.logs.get(extensionId) || [];
    return logs.slice(-limit);
  }

  async checkExtensionHealth(extensionId: string): Promise<ExtensionHealthCheck> {
    this.logger.log(`Checking health for extension: ${extensionId}`);

    const status = await this.getExtensionStatus(extensionId);

    const health: ExtensionHealthCheck = {
      healthId: `health_${Date.now()}`,
      extensionId,
      timestamp: new Date(),
      overallHealth: 85,
      checks: [
        { name: 'Status', status: status.running ? 'pass' : 'fail' },
        { name: 'Memory', status: status.memoryUsage < 500 ? 'pass' : 'warning' },
        { name: 'Errors', status: status.errorCount < 5 ? 'pass' : 'warning' },
      ],
      recommendations: status.errorCount > 0 ? ['Check error logs'] : [],
    };

    this.health.set(extensionId, health);
    return health;
  }

  recordLog(extensionId: string, log: ExtensionLog): void {
    if (!this.logs.has(extensionId)) {
      this.logs.set(extensionId, []);
    }
    const logs = this.logs.get(extensionId)!;
    logs.push(log);

    if (logs.length > 1000) {
      logs.shift();
    }
  }

  recordAlert(extensionId: string, alert: ExtensionAlert): void {
    if (!this.alerts.has(extensionId)) {
      this.alerts.set(extensionId, []);
    }
    this.alerts.get(extensionId)!.push(alert);
  }

  private startMonitoring(): void {
    const MONITORING_INTERVAL = 60 * 1000; // 1 minute
    setInterval(() => {
      this.logger.debug('Monitoring extensions');
      // TODO: Check extension health and status
    }, MONITORING_INTERVAL);
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Extension Monitor Service');
    this.statuses.clear();
    this.alerts.clear();
    this.logs.clear();
    this.health.clear();
  }
}
