/**
 * Health Service
 * Comprehensive health monitoring for the Goose Bridge
 */

import { Injectable, Logger } from '@nestjs/common';
import { ExtensionRegistry } from '../extensions/registry.service';
import { ExtensionLifecycleManager } from '../extensions/lifecycle.manager';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: ComponentHealth[];
  metrics: HealthMetrics;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    percentage: number;
  };
  extensions: {
    total: number;
    loaded: number;
    healthy: number;
    unhealthy: number;
  };
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime: number = Date.now();
  private lastHealthCheck?: HealthStatus;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly registry: ExtensionRegistry,
    private readonly lifecycleManager: ExtensionLifecycleManager,
  ) {}

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    this.logger.log(`Health checks started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.log('Health checks stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const components: ComponentHealth[] = [];

    // Check registry
    components.push(await this.checkRegistry());

    // Check extensions
    components.push(await this.checkExtensions());

    // Check memory
    components.push(this.checkMemory());

    // Check CPU
    components.push(this.checkCPU());

    // Determine overall status
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      components,
      metrics: await this.collectMetrics(),
    };

    this.lastHealthCheck = health;

    if (overallStatus !== 'healthy') {
      this.logger.warn('Health check status:', { status: overallStatus, components });
    }

    return health;
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck || null;
  }

  /**
   * Check registry health
   */
  private async checkRegistry(): Promise<ComponentHealth> {
    try {
      const count = this.registry.getExtensionCount();
      
      return {
        name: 'extension_registry',
        status: 'healthy',
        message: `Registry operational with ${count} extensions`,
        details: { extensionCount: count },
      };
    } catch (error) {
      return {
        name: 'extension_registry',
        status: 'unhealthy',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Check extensions health
   */
  private async checkExtensions(): Promise<ComponentHealth> {
    try {
      const healthMap = await this.lifecycleManager.checkAllExtensionsHealth();
      const total = healthMap.size;
      const healthy = Array.from(healthMap.values()).filter(h => h).length;
      const unhealthy = total - healthy;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (unhealthy === 0) {
        status = 'healthy';
      } else if (unhealthy < total / 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        name: 'extensions',
        status,
        message: `${healthy}/${total} extensions healthy`,
        details: { total, healthy, unhealthy },
      };
    } catch (error) {
      return {
        name: 'extensions',
        status: 'unhealthy',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): ComponentHealth {
    const usage = process.memoryUsage();
    const total = usage.heapTotal;
    const used = usage.heapUsed;
    const percentage = (used / total) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (percentage < 70) {
      status = 'healthy';
    } else if (percentage < 90) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      name: 'memory',
      status,
      message: `Memory usage: ${percentage.toFixed(1)}%`,
      details: {
        used: Math.round(used / 1024 / 1024),
        total: Math.round(total / 1024 / 1024),
        percentage: Math.round(percentage),
      },
    };
  }

  /**
   * Check CPU usage
   */
  private checkCPU(): ComponentHealth {
    const cpuUsage = process.cpuUsage();
    const percentage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (percentage < 70) {
      status = 'healthy';
    } else if (percentage < 90) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      name: 'cpu',
      status,
      message: `CPU usage: ${percentage.toFixed(1)}%`,
      details: { percentage: Math.round(percentage) },
    };
  }

  /**
   * Collect health metrics
   */
  private async collectMetrics(): Promise<HealthMetrics> {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const extensionHealth = await this.lifecycleManager.checkAllExtensionsHealth();
    const healthyExtensions = Array.from(extensionHealth.values()).filter(h => h).length;

    return {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        percentage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000),
      },
      extensions: {
        total: this.registry.getExtensionCount(),
        loaded: this.lifecycleManager.getExtensionCount(),
        healthy: healthyExtensions,
        unhealthy: extensionHealth.size - healthyExtensions,
      },
      tasks: {
        total: 0, // Will be populated by bridge service
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      },
    };
  }
}
