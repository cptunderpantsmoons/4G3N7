/**
 * Phase 5.1 - System Monitor Service
 * 
 * Monitors system performance, processes, and generates alerts/optimizations.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  PerformanceMetrics,
  ProcessMetrics,
  SystemAlert,
  SystemProfile,
  PerformanceOptimization,
} from '../interfaces/desktop-control.interface';
import * as os from 'os';

@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);

  // Store performance metrics history
  private metricsHistory: PerformanceMetrics[] = [];
  // Store process metrics
  private processMetrics = new Map<number, ProcessMetrics>();
  // Store alerts
  private alerts: SystemAlert[] = [];
  // Store optimization suggestions
  private optimizations: PerformanceOptimization[] = [];
  // Monitor configuration
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  // Alert thresholds
  private thresholds = {
    cpu: 85,
    memory: 85,
    disk: 90,
    temperature: 80,
  };

  constructor() {
    this.gatherSystemProfile();
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<PerformanceMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: this.calculateCpuUsage(cpus),
        cores: cpus.length,
        frequency: cpus[0]?.speed || 0,
        temperature: undefined, // TODO: Get from system sensors
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100,
      },
      disk: {
        total: 0, // TODO: Get actual disk size
        used: 0,
        free: 0,
        usagePercent: 0,
      },
    };

    this.metricsHistory.push(metrics);

    // Keep only last 1000 metric snapshots
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    // Check thresholds and generate alerts
    this.checkThresholds(metrics);

    return metrics;
  }

  /**
   * Calculate CPU usage from os.cpus()
   */
  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      const times = cpu.times as Record<string, number>;
      for (const type of Object.keys(times)) {
        totalTick += times[type];
      }
      totalIdle += times['idle'];
    }

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Get process metrics
   */
  async getProcessMetrics(processId?: number): Promise<ProcessMetrics[]> {
    const processesToAnalyze: number[] = [];

    if (processId) {
      processesToAnalyze.push(processId);
    } else {
      // TODO: Get top N processes
      // For now, return empty
    }

    const metrics: ProcessMetrics[] = [];

    for (const pid of processesToAnalyze) {
      // TODO: Use ps or /proc on Linux to get process metrics
      const processMetric: ProcessMetrics = {
        processId: pid,
        processName: `process_${pid}`,
        cpuUsage: 0,
        memoryUsage: 0,
        threadCount: 1,
        state: 'running',
      };

      metrics.push(processMetric);
      this.processMetrics.set(pid, processMetric);
    }

    return metrics;
  }

  /**
   * Get system profile/information
   */
  getSystemProfile(): SystemProfile {
    return {
      os: os.platform(),
      osVersion: os.release(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMemory: os.totalmem(),
      totalDisk: 0, // TODO: Get actual disk size
      monitors: [], // TODO: Get from display service
    };
  }

  /**
   * Private method to gather system profile on init
   */
  private gatherSystemProfile(): void {
    const profile = this.getSystemProfile();
    this.logger.log(`System Profile: ${JSON.stringify(profile)}`);
  }

  /**
   * Start monitoring system metrics
   */
  async startMonitoring(intervalMs: number = 5000): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring already started');
      return;
    }

    this.isMonitoring = true;
    this.logger.log(`Starting system monitoring (interval: ${intervalMs}ms)`);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.getSystemMetrics();
      } catch (error) {
        this.logger.error(`Error collecting metrics: ${error.message}`);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring system metrics
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    this.logger.log('Stopped system monitoring');
  }

  /**
   * Check metrics against thresholds
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // Check CPU usage
    if (metrics.cpu.usage > this.thresholds.cpu) {
      this.createAlert('cpu', metrics.cpu.usage, this.thresholds.cpu, 'critical');
    }

    // Check memory usage
    if (metrics.memory.usagePercent > this.thresholds.memory) {
      this.createAlert('memory', metrics.memory.usagePercent, this.thresholds.memory, 'critical');
    }

    // Check disk usage
    if (metrics.disk.usagePercent > this.thresholds.disk) {
      this.createAlert('disk', metrics.disk.usagePercent, this.thresholds.disk, 'warning');
    }
  }

  /**
   * Create an alert
   */
  private createAlert(type: string, currentValue: number, threshold: number, severity: 'info' | 'warning' | 'critical'): void {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}`,
      type: type as any,
      severity,
      message: `${type.toUpperCase()} usage at ${currentValue.toFixed(2)}% (threshold: ${threshold}%)`,
      threshold,
      currentValue,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    this.logger.warn(`Alert: ${alert.message}`);
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit: number = 20): SystemAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logger.debug(`Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Set alert threshold
   */
  setThreshold(metric: string, value: number): void {
    if (metric in this.thresholds) {
      this.thresholds[metric as keyof typeof this.thresholds] = value;
      this.logger.log(`Updated threshold for ${metric} to ${value}`);
    }
  }

  /**
   * Get metrics statistics
   */
  getMetricsStatistics(): {
    totalSnapshots: number;
    averageCpuUsage: number;
    averageMemoryUsage: number;
    peakCpuUsage: number;
    peakMemoryUsage: number;
    minCpuUsage: number;
    minMemoryUsage: number;
  } {
    if (this.metricsHistory.length === 0) {
      return {
        totalSnapshots: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        peakCpuUsage: 0,
        peakMemoryUsage: 0,
        minCpuUsage: 0,
        minMemoryUsage: 0,
      };
    }

    const cpuUsages = this.metricsHistory.map(m => m.cpu.usage);
    const memoryUsages = this.metricsHistory.map(m => m.memory.usagePercent);

    const avgCpu = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length;
    const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    return {
      totalSnapshots: this.metricsHistory.length,
      averageCpuUsage: avgCpu,
      averageMemoryUsage: avgMemory,
      peakCpuUsage: Math.max(...cpuUsages),
      peakMemoryUsage: Math.max(...memoryUsages),
      minCpuUsage: Math.min(...cpuUsages),
      minMemoryUsage: Math.min(...memoryUsages),
    };
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizations(): Promise<PerformanceOptimization[]> {
    this.optimizations = [];
    const stats = this.getMetricsStatistics();

    // Check for high CPU usage
    if (stats.averageCpuUsage > 70) {
      this.optimizations.push({
        id: `opt_cpu_${Date.now()}`,
        name: 'Reduce CPU Usage',
        category: 'cpu',
        description: 'Average CPU usage is consistently high',
        priority: 1,
        estimatedImprovement: '10-20% reduction',
        implementation: 'Close unnecessary applications, disable heavy processes',
        implemented: false,
        timestamp: new Date(),
      });
    }

    // Check for high memory usage
    if (stats.averageMemoryUsage > 75) {
      this.optimizations.push({
        id: `opt_memory_${Date.now()}`,
        name: 'Reduce Memory Usage',
        category: 'memory',
        description: 'Average memory usage is consistently high',
        priority: 1,
        estimatedImprovement: '15-25% reduction',
        implementation: 'Increase available RAM or reduce memory-heavy applications',
        implemented: false,
        timestamp: new Date(),
      });
    }

    // Check for performance variability
    const cpuVariance = Math.max(...this.metricsHistory.map(m => m.cpu.usage)) - 
                        Math.min(...this.metricsHistory.map(m => m.cpu.usage));
    
    if (cpuVariance > 50) {
      this.optimizations.push({
        id: `opt_variance_${Date.now()}`,
        name: 'Reduce Performance Variability',
        category: 'cpu',
        description: 'CPU usage has high variance',
        priority: 2,
        estimatedImprovement: '5-10% stabilization',
        implementation: 'Balance workload, use task scheduling',
        implemented: false,
        timestamp: new Date(),
      });
    }

    return this.optimizations;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizations(): PerformanceOptimization[] {
    return [...this.optimizations];
  }

  /**
   * Mark optimization as implemented
   */
  markOptimizationImplemented(optimizationId: string): void {
    const opt = this.optimizations.find(o => o.id === optimizationId);
    if (opt) {
      opt.implemented = true;
      this.logger.log(`Marked optimization as implemented: ${optimizationId}`);
    }
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    if (limit) {
      return this.metricsHistory.slice(-limit);
    }
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  clearMetricsHistory(): void {
    this.metricsHistory = [];
    this.alerts = [];
    this.logger.log('Cleared metrics history and alerts');
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down System Monitor Service');
    await this.stopMonitoring();
  }
}
