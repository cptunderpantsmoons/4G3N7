/**
 * Extension lifecycle manager
 * Manages the lifecycle of extensions (load, initialize, execute, unload)
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  IGooseExtension,
  ExtensionContext,
} from '../interfaces/extension.interface';
import {
  ExtensionManifest,
  ExtensionState,
  ExtensionConfig,
  GooseTask,
  GooseResult,
} from '../interfaces/types';

export interface ExtensionInstance {
  extension: IGooseExtension;
  manifest: ExtensionManifest;
  config: ExtensionConfig;
  state: ExtensionState;
  loadedAt: Date;
  lastUsedAt?: Date;
  taskCount: number;
  errorCount: number;
}

@Injectable()
export class ExtensionLifecycleManager {
  private readonly logger = new Logger(ExtensionLifecycleManager.name);
  private extensions: Map<string, ExtensionInstance> = new Map();

  /**
   * Load an extension
   */
  async loadExtension(
    extension: IGooseExtension,
    config: ExtensionConfig,
    context: ExtensionContext
  ): Promise<void> {
    const manifest = extension.getManifest();
    
    try {
      this.logger.log(`Loading extension: ${manifest.name} (${manifest.id})`);
      
      // Set context
      if ('setContext' in extension) {
        (extension as any).setContext(context);
      }
      
      // Call lifecycle hooks
      await extension.onLoad();
      await extension.onInitialize(config);
      await extension.onReady();
      
      // Register extension
      this.extensions.set(manifest.id, {
        extension,
        manifest,
        config,
        state: extension.getState(),
        loadedAt: new Date(),
        taskCount: 0,
        errorCount: 0,
      });
      
      this.logger.log(`Extension loaded successfully: ${manifest.name}`);
    } catch (error) {
      this.logger.error(`Failed to load extension: ${manifest.name}`, error);
      throw error;
    }
  }

  /**
   * Unload an extension
   */
  async unloadExtension(extensionId: string): Promise<void> {
    const instance = this.extensions.get(extensionId);
    
    if (!instance) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    try {
      this.logger.log(`Unloading extension: ${instance.manifest.name}`);
      
      await instance.extension.onUnload();
      
      this.extensions.delete(extensionId);
      
      this.logger.log(`Extension unloaded successfully: ${instance.manifest.name}`);
    } catch (error) {
      this.logger.error(`Failed to unload extension: ${instance.manifest.name}`, error);
      throw error;
    }
  }

  /**
   * Execute a task with an extension
   */
  async executeTask(extensionId: string, task: GooseTask): Promise<GooseResult> {
    const instance = this.extensions.get(extensionId);
    
    if (!instance) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    const startTime = Date.now();
    
    try {
      // Validate task
      const isValid = await instance.extension.onTaskReceive(task);
      if (!isValid) {
        throw new Error('Task validation failed');
      }
      
      // Execute task
      await instance.extension.onBeforeExecute(task);
      const result = await instance.extension.execute(task);
      await instance.extension.onAfterExecute(task, result);
      
      // Update stats
      instance.taskCount++;
      instance.lastUsedAt = new Date();
      instance.state = instance.extension.getState();
      
      return result;
    } catch (error) {
      instance.errorCount++;
      instance.lastUsedAt = new Date();
      
      const duration = Date.now() - startTime;
      
      // Create error result
      const errorResult: GooseResult = {
        taskId: task.taskId,
        result: {},
        metadata: {
          duration,
          extensionVersion: instance.manifest.version,
          completedAt: new Date(),
        },
        error: {
          code: 'EXECUTION_ERROR',
          message: (error as Error).message,
          details: { name: (error as Error).name },
          stack: (error as Error).stack,
        },
      };
      
      return errorResult;
    }
  }

  /**
   * Get extension instance
   */
  getExtension(extensionId: string): ExtensionInstance | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): ExtensionInstance[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extensions by state
   */
  getExtensionsByState(state: ExtensionState): ExtensionInstance[] {
    return this.getAllExtensions().filter(ext => ext.state === state);
  }

  /**
   * Check if extension is loaded
   */
  isExtensionLoaded(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  /**
   * Get extension count
   */
  getExtensionCount(): number {
    return this.extensions.size;
  }

  /**
   * Health check for extension
   */
  async checkExtensionHealth(extensionId: string): Promise<boolean> {
    const instance = this.extensions.get(extensionId);
    
    if (!instance) {
      return false;
    }
    
    try {
      return await instance.extension.healthCheck();
    } catch (error) {
      this.logger.error(`Health check failed for extension: ${instance.manifest.name}`, error);
      return false;
    }
  }

  /**
   * Health check for all extensions
   */
  async checkAllExtensionsHealth(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();
    
    for (const [id, instance] of this.extensions) {
      try {
        health.set(id, await instance.extension.healthCheck());
      } catch (error) {
        health.set(id, false);
      }
    }
    
    return health;
  }
}
