/**
 * Phase 5.4 - System Monitor Service
 * System health checks, metrics collection, and monitoring
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SystemMetrics,
  ProcessInfo,
  DiskInfo,
  NetworkInterface,
  HealthCheckResult,
  SystemHealthStatus,
  ResourceType,
} from '../interfaces/system-administration.interface';
import * as os from 'os';

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);

  private metricsHistory = new Map<string, SystemMetrics[]>();
  private healthHistory = new Map<string, HealthCheckResult[]>();

  constructor() {
    this.startMetricsCollector();
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    this.logger.debug('Collecting system metrics');

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      const times = cpu.times as Record<string, number>;
      for (const type of Object.keys(times)) {
        totalTick += times[type];
      }
      totalIdle += cpu.times.idle;
    }

    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpuUsage,
      memoryUsage: (1 - os.freemem() / os.totalmem()) * 100,
      diskUsage: {},
      networkIO: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
      loadAverage: os.loadavg() as [number, number, number],
      uptime: os.uptime(),
    };

    this.storeMetrics(metrics);
    return metrics;
  }

  async getProcessInfo(pid?: number): Promise<ProcessInfo[]> {
    this.logger.debug(`Getting process info for PID: ${pid}`);

    const processes: ProcessInfo[] = [];
    // TODO: Implement actual process enumeration using os module or child_process
    return processes;
  }

  async getDiskInfo(): Promise<DiskInfo[]> {
    this.logger.debug('Getting disk information');

    const disks: DiskInfo[] = [];
    // TODO: Implement disk information retrieval
    return disks;
  }

  async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    this.logger.debug('Getting network interfaces');

    const interfaces: NetworkInterface[] = [];
    const networkInterfaces = os.networkInterfaces();

    for (const [name, addrs] of Object.entries(networkInterfaces)) {
      if (addrs) {
        const addr = addrs[0];
        interfaces.push({
          name,
          address: addr.address,
          netmask: addr.netmask,
          gateway: '0.0.0.0',
          mac: addr.mac,
          speed: 1000,
          state: 'up',
        });
      }
    }

    return interfaces;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    this.logger.log('Performing system health check');

    const metrics = await this.getSystemMetrics();
    const checks = [
      {
        name: 'CPU Usage',
        status: metrics.cpuUsage > 80 ? 'critical' : metrics.cpuUsage > 60 ? 'warning' : 'healthy',
        value: metrics.cpuUsage,
        threshold: 80,
      },
      {
        name: 'Memory Usage',
        status: metrics.memoryUsage > 85 ? 'critical' : metrics.memoryUsage > 70 ? 'warning' : 'healthy',
        value: metrics.memoryUsage,
        threshold: 85,
      },
      {
        name: 'System Uptime',
        status: metrics.uptime > 3600 ? 'healthy' : 'warning',
        value: metrics.uptime,
        threshold: 3600,
      },
    ];

    const criticalCount = checks.filter(c => c.status === 'critical').length;
    const overallHealth = 100 - (criticalCount * 50 + checks.filter(c => c.status === 'warning').length * 25);

    const result: HealthCheckResult = {
      checkId: `health_${Date.now()}`,
      timestamp: new Date(),
      status: criticalCount > 0 ? SystemHealthStatus.CRITICAL : checks.some(c => c.status === 'warning') ? SystemHealthStatus.WARNING : SystemHealthStatus.HEALTHY,
      checks: checks.map(c => ({
        name: c.name,
        status: c.status as any,
        value: c.value,
        threshold: c.threshold,
      })),
      overallHealth: Math.max(0, overallHealth),
      criticalIssues: checks.filter(c => c.status === 'critical').map(c => c.name),
      recommendations: this.generateRecommendations(checks),
    };

    this.storeHealthCheck(result);
    return result;
  }

  async getSystemHealth(): Promise<SystemHealthStatus> {
    const health = await this.performHealthCheck();
    return health.status;
  }

  private generateRecommendations(checks: any[]): string[] {
    const recommendations: string[] = [];

    for (const check of checks) {
      if (check.status === 'critical') {
        recommendations.push(`Critical: ${check.name} is at ${check.value.toFixed(2)}%`);
      } else if (check.status === 'warning') {
        recommendations.push(`Warning: ${check.name} is at ${check.value.toFixed(2)}%`);
      }
    }

    return recommendations;
  }

  private storeMetrics(metrics: SystemMetrics): void {
    const key = 'system_metrics';
    if (!this.metricsHistory.has(key)) {
      this.metricsHistory.set(key, []);
    }
    const history = this.metricsHistory.get(key)!;
    history.push(metrics);

    if (history.length > 1000) {
      history.shift();
    }
  }

  private storeHealthCheck(result: HealthCheckResult): void {
    const key = 'health_checks';
    if (!this.healthHistory.has(key)) {
      this.healthHistory.set(key, []);
    }
    const history = this.healthHistory.get(key)!;
    history.push(result);

    if (history.length > 500) {
      history.shift();
    }
  }

  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    const history = this.metricsHistory.get('system_metrics') || [];
    return history.slice(-limit);
  }

  getHealthHistory(limit: number = 100): HealthCheckResult[] {
    const history = this.healthHistory.get('health_checks') || [];
    return history.slice(-limit);
  }

  private startMetricsCollector(): void {
    const COLLECTION_INTERVAL = 60 * 1000; // 1 minute
    setInterval(async () => {
      await this.getSystemMetrics();
    }, COLLECTION_INTERVAL);
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down System Monitor Service');
    this.metricsHistory.clear();
    this.healthHistory.clear();
  }
}
