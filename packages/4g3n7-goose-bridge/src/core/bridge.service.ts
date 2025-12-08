/**
 * Goose Bridge Service
 * Core business logic for Goose integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  GooseTask,
  GooseResult,
  GooseTaskStatus,
  GooseTaskPriority,
} from '../interfaces/types';
import { ExtensionRegistry } from '../extensions/registry.service';
import { ExtensionLifecycleManager } from '../extensions/lifecycle.manager';

export interface TaskQuery {
  status?: GooseTaskStatus;
  extensionId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class GooseBridgeService {
  private readonly logger = new Logger(GooseBridgeService.name);
  private tasks: Map<string, GooseTask> = new Map();
  private results: Map<string, GooseResult> = new Map();

  constructor(
    private readonly registry: ExtensionRegistry,
    private readonly lifecycleManager: ExtensionLifecycleManager,
  ) {}

  /**
   * List all available extensions
   */
  async listExtensions() {
    const extensions = this.registry.getAllExtensions();
    
    return {
      extensions: extensions.map(ext => ({
        id: ext.manifest.id,
        name: ext.manifest.name,
        version: ext.manifest.version,
        description: ext.manifest.description,
        author: ext.manifest.author,
        capabilities: ext.manifest.capabilities.map(cap => ({
          id: cap.id,
          name: cap.name,
          description: cap.description,
        })),
        source: ext.source,
        registered: ext.registered,
      })),
      total: extensions.length,
    };
  }

  /**
   * Get extension details
   */
  async getExtension(extensionId: string) {
    const entry = this.registry.getExtension(extensionId);
    const instance = this.lifecycleManager.getExtension(extensionId);
    
    if (!entry) {
      return null;
    }
    
    return {
      manifest: entry.manifest,
      registered: entry.registered,
      installedAt: entry.installedAt,
      updatedAt: entry.updatedAt,
      source: entry.source,
      loaded: instance !== undefined,
      state: instance?.state,
      stats: instance ? {
        taskCount: instance.taskCount,
        errorCount: instance.errorCount,
        lastUsedAt: instance.lastUsedAt,
      } : null,
    };
  }

  /**
   * Get extension capabilities
   */
  async getExtensionCapabilities(extensionId: string) {
    const entry = this.registry.getExtension(extensionId);
    
    if (!entry) {
      return null;
    }
    
    return {
      extensionId,
      capabilities: entry.manifest.capabilities,
    };
  }

  /**
   * Submit a task
   */
  async submitTask(taskDto: any): Promise<GooseTask> {
    const taskId = uuidv4();
    
    const task: GooseTask = {
      taskId,
      type: taskDto.type,
      extensionId: taskDto.extensionId,
      payload: taskDto.payload,
      priority: taskDto.priority || GooseTaskPriority.NORMAL,
      status: GooseTaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      timeout: taskDto.timeout,
      userId: taskDto.userId,
      correlationId: uuidv4(),
    };
    
    // Store task
    this.tasks.set(taskId, task);
    
    // Queue task for execution (async) - don't await
    setImmediate(() => this.executeTaskAsync(task));
    
    this.logger.log(`Task submitted: ${taskId} (type: ${task.type}, extension: ${task.extensionId})`);
    
    return task;
  }

  /**
   * Execute task asynchronously
   */
  private async executeTaskAsync(task: GooseTask): Promise<void> {
    try {
      // Update status
      task.status = GooseTaskStatus.RUNNING;
      task.updatedAt = new Date();
      this.tasks.set(task.taskId, task);
      
      // Execute via lifecycle manager
      const result = await this.lifecycleManager.executeTask(task.extensionId, task);
      
      // Store result
      this.results.set(task.taskId, result);
      
      // Update task status
      task.status = result.error ? GooseTaskStatus.FAILED : GooseTaskStatus.COMPLETED;
      task.updatedAt = new Date();
      this.tasks.set(task.taskId, task);
      
      this.logger.log(`Task completed: ${task.taskId} (status: ${task.status})`);
    } catch (error) {
      this.logger.error(`Task execution failed: ${task.taskId}`, error);
      
      task.status = GooseTaskStatus.FAILED;
      task.updatedAt = new Date();
      this.tasks.set(task.taskId, task);
      
      // Store error result
      const errorResult: GooseResult = {
        taskId: task.taskId,
        result: {},
        metadata: {
          duration: 0,
          extensionVersion: 'unknown',
          completedAt: new Date(),
        },
        error: {
          code: 'EXECUTION_ERROR',
          message: (error as Error).message,
          stack: (error as Error).stack,
        },
      };
      
      this.results.set(task.taskId, errorResult);
    }
  }

  /**
   * Get task
   */
  async getTask(taskId: string): Promise<GooseTask | null> {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Get task result
   */
  async getTaskResult(taskId: string): Promise<GooseResult | null> {
    return this.results.get(taskId) || null;
  }

  /**
   * List tasks
   */
  async listTasks(query: TaskQuery) {
    let tasks = Array.from(this.tasks.values());
    
    // Filter by status
    if (query.status) {
      tasks = tasks.filter(t => t.status === query.status);
    }
    
    // Filter by extension
    if (query.extensionId) {
      tasks = tasks.filter(t => t.extensionId === query.extensionId);
    }
    
    // Sort by creation date (newest first)
    tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Pagination
    const total = tasks.length;
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    tasks = tasks.slice(offset, offset + limit);
    
    return {
      tasks: tasks.map(t => ({
        taskId: t.taskId,
        type: t.type,
        extensionId: t.extensionId,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      return false;
    }
    
    // Can only cancel pending or running tasks
    if (task.status !== GooseTaskStatus.PENDING && task.status !== GooseTaskStatus.RUNNING) {
      return false;
    }
    
    task.status = GooseTaskStatus.CANCELLED;
    task.updatedAt = new Date();
    this.tasks.set(taskId, task);
    
    this.logger.log(`Task cancelled: ${taskId}`);
    
    return true;
  }

  /**
   * Get health status
   */
  async getHealth() {
    const extensionHealth = await this.lifecycleManager.checkAllExtensionsHealth();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      extensions: {
        total: this.registry.getExtensionCount(),
        loaded: this.lifecycleManager.getExtensionCount(),
        healthy: Array.from(extensionHealth.values()).filter(h => h).length,
      },
      tasks: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === GooseTaskStatus.PENDING).length,
        running: Array.from(this.tasks.values()).filter(t => t.status === GooseTaskStatus.RUNNING).length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === GooseTaskStatus.COMPLETED).length,
        failed: Array.from(this.tasks.values()).filter(t => t.status === GooseTaskStatus.FAILED).length,
      },
    };
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    const tasks = Array.from(this.tasks.values());
    const results = Array.from(this.results.values());
    
    return {
      tasks: {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter(t => t.status === GooseTaskStatus.PENDING).length,
          running: tasks.filter(t => t.status === GooseTaskStatus.RUNNING).length,
          completed: tasks.filter(t => t.status === GooseTaskStatus.COMPLETED).length,
          failed: tasks.filter(t => t.status === GooseTaskStatus.FAILED).length,
          cancelled: tasks.filter(t => t.status === GooseTaskStatus.CANCELLED).length,
        },
        byExtension: this.getTaskCountByExtension(tasks),
      },
      results: {
        total: results.length,
        successful: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        averageDuration: this.calculateAverageDuration(results),
      },
      extensions: {
        total: this.registry.getExtensionCount(),
        loaded: this.lifecycleManager.getExtensionCount(),
      },
    };
  }

  private getTaskCountByExtension(tasks: GooseTask[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const task of tasks) {
      counts[task.extensionId] = (counts[task.extensionId] || 0) + 1;
    }
    
    return counts;
  }

  private calculateAverageDuration(results: GooseResult[]): number {
    if (results.length === 0) {
      return 0;
    }
    
    const total = results.reduce((sum, r) => sum + r.metadata.duration, 0);
    return Math.round(total / results.length);
  }
}