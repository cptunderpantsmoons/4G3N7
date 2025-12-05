/**
 * Echo Extension
 * Simple example extension that returns input data
 */

import {
  BaseExtension,
  GooseTask,
  GooseResult,
  ExtensionManifest,
} from '../../../src';
import manifestJson from './manifest.json';

export class EchoExtension extends BaseExtension {
  /**
   * Get extension manifest
   */
  getManifest(): ExtensionManifest {
    return manifestJson as ExtensionManifest;
  }

  /**
   * Execute echo operation
   */
  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    
    this.context.logger.info('Echo extension processing task', {
      taskId: task.taskId,
      payload: task.payload,
    });
    
    try {
      // Get message from payload
      const message = task.payload.message as string;
      const delay = (task.payload.delay as number) || 0;
      
      // Validate message length
      const maxLength = this.config.config.maxMessageLength || 1000;
      if (message.length > maxLength) {
        throw new Error(`Message too long: ${message.length} > ${maxLength}`);
      }
      
      // Simulate delay if requested
      if (delay > 0) {
        await this.sleep(delay);
      }
      
      // Create result
      const result = {
        message,
        timestamp: new Date().toISOString(),
        receivedAt: task.createdAt.toISOString(),
        processedIn: Date.now() - startTime,
      };
      
      const duration = Date.now() - startTime;
      
      this.context.logger.info('Echo extension completed', {
        taskId: task.taskId,
        duration,
      });
      
      return this.createResult(task, result, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.context.logger.error('Echo extension failed', error as Error, {
        taskId: task.taskId,
      });
      
      return this.createErrorResult(task, error as Error, duration);
    }
  }

  /**
   * Custom health check
   */
  protected async customHealthCheck(): Promise<boolean> {
    // Echo extension is always healthy if it's loaded
    return true;
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export factory function
export function createExtension(): EchoExtension {
  return new EchoExtension();
}
