/**
 * Extension Loader Service
 * Loads and registers built-in extensions at startup
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ExtensionRegistry } from '../extensions/registry.service';
import { ExtensionLifecycleManager } from '../extensions/lifecycle.manager';
import { ApiClientExtension } from '../extensions/api-client.extension';
import { DocumentProcessorExtension } from '../extensions/document-processor.extension';
import { WebScraperExtension } from '../extensions/web-scraper.extension';
import { WorkflowExtension } from '../extensions/workflow.extension';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { WorkflowEngineService } from './workflow-engine.service';

@Injectable()
export class ExtensionLoaderService implements OnModuleInit {
  private readonly logger = new Logger(ExtensionLoaderService.name);

  constructor(
    private readonly registry: ExtensionRegistry,
    private readonly lifecycleManager: ExtensionLifecycleManager,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Loading built-in extensions...');

    try {
      // Load all built-in extensions
      await this.loadBuiltInExtensions();

      this.logger.log('Built-in extensions loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load built-in extensions', error);
      throw error;
    }
  }

  /**
   * Load all built-in extensions
   */
  private async loadBuiltInExtensions(): Promise<void> {
    const extensions = [
      this.createApiClientExtension(),
      this.createDocumentProcessorExtension(),
      this.createWebScraperExtension(),
      this.createWorkflowExtension(),
    ];

    for (const extension of extensions) {
      try {
        await this.loadExtension(extension);
      } catch (error) {
        this.logger.error(`Failed to load extension: ${extension.constructor.name}`, error);
        // Continue with other extensions
      }
    }
  }

  /**
   * Load a single extension
   */
  private async loadExtension(extension: any): Promise<void> {
    const manifest = extension.getManifest();
    this.logger.log(`Loading extension: ${manifest.name} (${manifest.id})`);

    // Create extension context
    const context = {
      config: {
        extensionId: manifest.id,
        config: {},
        enabled: true,
        autoLoad: true,
      },
      logger: {
        debug: (message: string, metadata?: Record<string, any>) => this.logger.debug(message, metadata),
        info: (message: string, metadata?: Record<string, any>) => this.logger.log(message, metadata),
        warn: (message: string, metadata?: Record<string, any>) => this.logger.warn(message, metadata),
        error: (message: string, error?: Error, metadata?: Record<string, any>) => this.logger.error(message, error, metadata),
      },
      storage: {
        get: <T = any>(key: string): Promise<T | null> => this.cacheService.get(key),
        set: <T = any>(key: string, value: T, ttl?: number): Promise<void> => this.cacheService.set(key, value, ttl ? { ttl } : undefined),
        delete: (key: string): Promise<void> => {
          this.cacheService.delete(key);
          return Promise.resolve();
        },
        exists: (key: string): Promise<boolean> => this.cacheService.exists(key),
        mget: <T = any>(keys: string[]): Promise<(T | null)[]> => Promise.all(keys.map(key => this.cacheService.get<T>(key))),
        mset: (entries: Record<string, any>): Promise<void> => {
          const promises = Object.entries(entries).map(([key, value]) =>
            this.cacheService.set(key, value)
          );
          return Promise.all(promises).then(() => undefined);
        },
      },
      events: {
        emit: (event: string, data: any) => this.logger.log(`Event emitted: ${event}`, data),
        on: (event: string, handler: (data: any) => void) => {
          // Simple implementation - in a real system this would be an event bus
          this.logger.log(`Event listener registered: ${event}`);
        },
        once: (event: string, handler: (data: any) => void) => {
          this.logger.log(`One-time event listener registered: ${event}`);
        },
        off: (event: string, handler?: (data: any) => void) => {
          this.logger.log(`Event listener removed: ${event}`);
        },
      },
      metrics: {
        increment: (metric: string, value?: number, tags?: Record<string, string>) =>
          this.logger.log(`Metric incremented: ${metric}`, { value, tags }),
        gauge: (metric: string, value: number, tags?: Record<string, string>) =>
          this.logger.log(`Gauge recorded: ${metric}`, { value, tags }),
        histogram: (metric: string, value: number, tags?: Record<string, string>) =>
          this.logger.log(`Histogram recorded: ${metric}`, { value, tags }),
        timing: (metric: string, duration: number, tags?: Record<string, string>) =>
          this.logger.log(`Timing recorded: ${metric}`, { duration, tags }),
        startTimer: (metric: string, tags?: Record<string, string>) => {
          const startTime = Date.now();
          return () => {
            const duration = Date.now() - startTime;
            this.logger.log(`Timer completed: ${metric}`, { duration, tags });
          };
        },
      },
    };

    // Load extension through lifecycle manager
    await this.lifecycleManager.loadExtension(
      extension,
      {
        extensionId: manifest.id,
        config: {},
        enabled: true,
        autoLoad: true,
      },
      context
    );

    this.logger.log(`Extension loaded successfully: ${manifest.name}`);
  }

  /**
   * Create API Client Extension instance
   */
  private createApiClientExtension(): ApiClientExtension {
    return new ApiClientExtension();
  }

  /**
   * Create Document Processor Extension instance
   */
  private createDocumentProcessorExtension(): DocumentProcessorExtension {
    return new DocumentProcessorExtension();
  }

  /**
   * Create Web Scraper Extension instance
   */
  private createWebScraperExtension(): WebScraperExtension {
    return new WebScraperExtension();
  }

  /**
   * Create Workflow Extension instance
   */
  private createWorkflowExtension(): WorkflowExtension {
    return new WorkflowExtension();
  }
}
