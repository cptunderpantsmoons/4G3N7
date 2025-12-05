/**
 * Abstract base class for Goose extensions
 * Provides default implementation of lifecycle hooks
 */

import {
  IGooseExtension,
  ExtensionContext,
} from '../interfaces/extension.interface';
import {
  ExtensionManifest,
  GooseTask,
  GooseResult,
  ExtensionState,
  ExtensionConfig,
  GooseTaskStatus,
} from '../interfaces/types';

export abstract class BaseExtension implements IGooseExtension {
  protected state: ExtensionState = ExtensionState.REGISTERED;
  protected context!: ExtensionContext;
  protected config!: ExtensionConfig;

  /**
   * Abstract method: Must be implemented by subclasses
   */
  abstract getManifest(): ExtensionManifest;

  /**
   * Abstract method: Core execution logic
   */
  abstract execute(task: GooseTask): Promise<GooseResult>;

  /**
   * Get current extension state
   */
  getState(): ExtensionState {
    return this.state;
  }

  /**
   * Set extension context (called by the bridge)
   */
  setContext(context: ExtensionContext): void {
    this.context = context;
  }

  /**
   * Hook: Extension loaded into memory
   */
  async onLoad(): Promise<void> {
    this.state = ExtensionState.LOADING;
    this.context.logger.info(`Extension ${this.getManifest().name} loading...`);
    
    // Subclasses can override for custom load logic
    await this.validateEnvironment();
    
    this.context.logger.info(`Extension ${this.getManifest().name} loaded`);
  }

  /**
   * Hook: Before first task execution
   */
  async onInitialize(config: ExtensionConfig): Promise<void> {
    this.state = ExtensionState.INITIALIZING;
    this.config = config;
    
    this.context.logger.info(`Extension ${this.getManifest().name} initializing...`, {
      config: config.config,
    });
    
    // Subclasses can override for custom initialization
    await this.connectServices();
    
    this.context.logger.info(`Extension ${this.getManifest().name} initialized`);
  }

  /**
   * Hook: Extension ready for work
   */
  async onReady(): Promise<void> {
    this.state = ExtensionState.READY;
    this.context.logger.info(`Extension ${this.getManifest().name} ready`);
    
    // Emit ready event
    this.context.events.emit('extension:ready', {
      extensionId: this.getManifest().id,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Hook: New task assigned
   */
  async onTaskReceive(task: GooseTask): Promise<boolean> {
    this.context.logger.debug(`Extension ${this.getManifest().name} received task`, {
      taskId: task.taskId,
      type: task.type,
    });
    
    // Validate task parameters
    return this.validateTask(task);
  }

  /**
   * Hook: Just before task execution
   */
  async onBeforeExecute(task: GooseTask): Promise<void> {
    this.state = ExtensionState.EXECUTING;
    
    this.context.logger.info(`Extension ${this.getManifest().name} executing task`, {
      taskId: task.taskId,
      type: task.type,
    });
    
    // Record metrics
    this.context.metrics.increment('extension.task.started', 1, {
      extension: this.getManifest().id,
      taskType: task.type,
    });
  }

  /**
   * Hook: After task completion
   */
  async onAfterExecute(task: GooseTask, result: GooseResult): Promise<void> {
    this.state = ExtensionState.READY;
    
    const hasError = result.error !== undefined;
    
    if (hasError) {
      this.context.logger.error(`Extension ${this.getManifest().name} task failed`, undefined, {
        taskId: task.taskId,
        duration: result.metadata.duration,
        success: false,
      });
    } else {
      this.context.logger.info(`Extension ${this.getManifest().name} completed task`, {
        taskId: task.taskId,
        duration: result.metadata.duration,
        success: true,
      });
    }
    
    // Record metrics
    this.context.metrics.increment('extension.task.completed', 1, {
      extension: this.getManifest().id,
      taskType: task.type,
      status: hasError ? 'failed' : 'success',
    });
    
    this.context.metrics.timing('extension.task.duration', result.metadata.duration, {
      extension: this.getManifest().id,
      taskType: task.type,
    });
  }

  /**
   * Hook: Extension being removed
   */
  async onUnload(): Promise<void> {
    this.state = ExtensionState.UNLOADING;
    
    this.context.logger.info(`Extension ${this.getManifest().name} unloading...`);
    
    // Subclasses can override for cleanup logic
    await this.cleanup();
    
    this.state = ExtensionState.UNLOADED;
    this.context.logger.info(`Extension ${this.getManifest().name} unloaded`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Basic health checks
      const manifest = this.getManifest();
      const isValidState = [ExtensionState.READY, ExtensionState.EXECUTING].includes(this.state);
      
      // Subclasses can override for additional checks
      const customCheck = await this.customHealthCheck();
      
      return isValidState && customCheck;
    } catch (error) {
      this.context.logger.error('Health check failed', error as Error);
      return false;
    }
  }

  /**
   * Protected helpers - can be overridden by subclasses
   */

  protected async validateEnvironment(): Promise<void> {
    // Override in subclass if needed
  }

  protected async connectServices(): Promise<void> {
    // Override in subclass if needed
  }

  protected async cleanup(): Promise<void> {
    // Override in subclass if needed
  }

  protected async customHealthCheck(): Promise<boolean> {
    // Override in subclass for custom health checks
    return true;
  }

  protected validateTask(task: GooseTask): boolean {
    // Basic validation
    if (!task.taskId || !task.type) {
      this.context.logger.warn('Invalid task: missing required fields', { task });
      return false;
    }
    
    // Check if extension supports this task type
    const manifest = this.getManifest();
    const supportedOperations = manifest.capabilities.flatMap(c => c.operations);
    
    if (!supportedOperations.includes(task.type)) {
      this.context.logger.warn('Unsupported task type', {
        taskType: task.type,
        supportedOperations,
      });
      return false;
    }
    
    return true;
  }

  /**
   * Helper to create a successful result
   */
  protected createResult(task: GooseTask, result: Record<string, any>, duration: number): GooseResult {
    return {
      taskId: task.taskId,
      result,
      metadata: {
        duration,
        extensionVersion: this.getManifest().version,
        completedAt: new Date(),
      },
    };
  }

  /**
   * Helper to create a failed result
   */
  protected createErrorResult(
    task: GooseTask,
    error: Error,
    duration: number,
    code: string = 'EXECUTION_ERROR'
  ): GooseResult {
    return {
      taskId: task.taskId,
      result: {},
      metadata: {
        duration,
        extensionVersion: this.getManifest().version,
        completedAt: new Date(),
      },
      error: {
        code,
        message: error.message,
        details: error,
        stack: error.stack,
      },
    };
  }
}
