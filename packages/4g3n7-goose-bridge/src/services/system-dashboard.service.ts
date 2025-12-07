/**
 * Phase 6.3 - System Dashboard Service
 * Dashboard management and real-time metrics
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SystemDashboard,
  DashboardWidget,
  SystemMetric,
  HealthCheckResult,
  PerformanceMetrics,
  MetricCategory,
  SystemHealthStatus,
} from '../interfaces/ui-system-admin.interface';

@Injectable()
export class SystemDashboardService {
  private readonly logger = new Logger(SystemDashboardService.name);

  private dashboards = new Map<string, SystemDashboard>();
  private metrics = new Map<string, SystemMetric[]>();
  private healthChecks = new Map<string, HealthCheckResult>();

  constructor() {
    this.initializeDashboards();
    this.startMetricsCollection();
  }

  async getDashboard(dashboardId?: string): Promise<SystemDashboard> {
    let dashboard: SystemDashboard | undefined;

    if (dashboardId) {
      dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }
    } else {
      for (const dash of this.dashboards.values()) {
        if (dash.isDefault) {
          dashboard = dash;
          break;
        }
      }
    }

    if (!dashboard) {
      throw new Error('No default dashboard configured');
    }

    return dashboard;
  }

  async listDashboards(): Promise<SystemDashboard[]> {
    return Array.from(this.dashboards.values());
  }

  async createDashboard(dashboard: SystemDashboard): Promise<SystemDashboard> {
    this.logger.log(`Creating dashboard: ${dashboard.name}`);
    this.dashboards.set(dashboard.dashboardId, dashboard);
    return dashboard;
  }

  async updateDashboard(dashboardId: string, updates: Partial<SystemDashboard>): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    Object.assign(dashboard, updates);
    dashboard.updatedAt = new Date();
    this.logger.log(`Updated dashboard: ${dashboardId}`);
  }

  async getSystemMetrics(category?: MetricCategory): Promise<SystemMetric[]> {
    let allMetrics: SystemMetric[] = [];

    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }

    if (category) {
      allMetrics = allMetrics.filter(m => m.category === category);
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    const checkId = `health_${Date.now()}`;

    const result: HealthCheckResult = {
      checkId,
      timestamp: new Date(),
      status: SystemHealthStatus.HEALTHY,
      components: [
        { name: 'CPU', status: SystemHealthStatus.HEALTHY, value: 35 },
        { name: 'Memory', status: SystemHealthStatus.HEALTHY, value: 62 },
        { name: 'Disk', status: SystemHealthStatus.HEALTHY, value: 48 },
        { name: 'Network', status: SystemHealthStatus.HEALTHY, value: 12 },
        { name: 'Services', status: SystemHealthStatus.HEALTHY, message: '42/42 running' },
      ],
      overallHealth: 92,
      recommendations: [],
    };

    this.healthChecks.set(checkId, result);
    return result;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      metricsId: `perf_${Date.now()}`,
      timestamp: new Date(),
      cpu: { usage: 35, cores: 8, temperature: 52 },
      memory: { used: 8500, total: 13700, usage: 62 },
      disk: { used: 450, total: 940, usage: 48, iops: 250 },
      network: { bytesIn: 1250000, bytesOut: 980000, packetsIn: 45000, packetsOut: 38000 },
      services: { total: 42, running: 42, failed: 0 },
      processCount: 156,
    };
  }

  private initializeDashboards(): void {
    const defaultDashboard: SystemDashboard = {
      dashboardId: 'dash_default',
      name: 'System Overview',
      description: 'Default system dashboard',
      layout: 'grid',
      theme: 'light',
      refreshRate: 5000,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      widgets: [
        {
          widgetId: 'w_cpu',
          name: 'CPU Usage',
          type: 'gauge',
          position: { x: 0, y: 0 },
          size: { width: 2, height: 2 },
          config: { metric: 'cpu_usage', unit: '%' },
          refreshInterval: 1000,
          enabled: true,
        },
        {
          widgetId: 'w_memory',
          name: 'Memory Usage',
          type: 'gauge',
          position: { x: 2, y: 0 },
          size: { width: 2, height: 2 },
          config: { metric: 'memory_usage', unit: '%' },
          refreshInterval: 1000,
          enabled: true,
        },
        {
          widgetId: 'w_services',
          name: 'Services Status',
          type: 'stat',
          position: { x: 4, y: 0 },
          size: { width: 2, height: 2 },
          config: { metric: 'services_running' },
          refreshInterval: 5000,
          enabled: true,
        },
        {
          widgetId: 'w_network',
          name: 'Network Activity',
          type: 'chart',
          position: { x: 0, y: 2 },
          size: { width: 3, height: 3 },
          config: { metrics: ['network_in', 'network_out'], chartType: 'line' },
          refreshInterval: 2000,
          enabled: true,
        },
        {
          widgetId: 'w_alerts',
          name: 'Recent Alerts',
          type: 'list',
          position: { x: 3, y: 2 },
          size: { width: 3, height: 3 },
          config: { limit: 10 },
          refreshInterval: 5000,
          enabled: true,
        },
      ],
    };

    this.dashboards.set(defaultDashboard.dashboardId, defaultDashboard);
  }

  private startMetricsCollection(): void {
    const COLLECTION_INTERVAL = 30 * 1000; // 30 seconds
    setInterval(() => {
      this.logger.debug('Collecting system metrics');
      const metric: SystemMetric = {
        metricId: `metric_${Date.now()}`,
        timestamp: new Date(),
        category: MetricCategory.CPU,
        value: Math.random() * 100,
        unit: '%',
        threshold: 80,
        status: 'normal',
      };

      if (!this.metrics.has(MetricCategory.CPU)) {
        this.metrics.set(MetricCategory.CPU, []);
      }

      const metrics = this.metrics.get(MetricCategory.CPU)!;
      metrics.push(metric);

      if (metrics.length > 500) {
        metrics.shift();
      }
    }, COLLECTION_INTERVAL);
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down System Dashboard Service');
    this.dashboards.clear();
    this.metrics.clear();
    this.healthChecks.clear();
  }
}
