/**
 * Base interface that all Goose extensions must implement
 */

import {
  ExtensionManifest,
  GooseTask,
  GooseResult,
  ExtensionState,
  ExtensionConfig,
} from '../interfaces/types';

/**
 * Extension lifecycle event hooks
 */
export interface IGooseExtension {
  /**
   * Get extension manifest
   */
  getManifest(): ExtensionManifest;
  
  /**
   * Get current extension state
   */
  getState(): ExtensionState;
  
  /**
   * Hook: Extension loaded into memory
   * Responsibilities: Validate environment, load dependencies
   */
  onLoad(): Promise<void>;
  
  /**
   * Hook: Before first task execution
   * Responsibilities: Connect to required services, warm caches
   */
  onInitialize(config: ExtensionConfig): Promise<void>;
  
  /**
   * Hook: Extension ready for work
   * Responsibilities: Signal availability to bridge
   */
  onReady(): Promise<void>;
  
  /**
   * Hook: New task assigned
   * Responsibilities: Validate task parameters
   */
  onTaskReceive(task: GooseTask): Promise<boolean>;
  
  /**
   * Hook: Just before task execution
   * Responsibilities: Acquire resources, set up context
   */
  onBeforeExecute(task: GooseTask): Promise<void>;
  
  /**
   * Main execution method
   * Process the task and return results
   */
  execute(task: GooseTask): Promise<GooseResult>;
  
  /**
   * Hook: After task completion
   * Responsibilities: Release resources, emit results
   */
  onAfterExecute(task: GooseTask, result: GooseResult): Promise<void>;
  
  /**
   * Hook: Extension being removed
   * Responsibilities: Clean up connections, flush buffers
   */
  onUnload(): Promise<void>;
  
  /**
   * Health check
   * Returns true if extension is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Extension context provided by the bridge
 */
export interface ExtensionContext {
  /** Extension configuration */
  config: ExtensionConfig;
  
  /** Logger instance */
  logger: ExtensionLogger;
  
  /** Storage service */
  storage: ExtensionStorage;
  
  /** Event emitter */
  events: ExtensionEventEmitter;
  
  /** Metrics collector */
  metrics: ExtensionMetrics;
}

/**
 * Extension logger interface
 */
export interface ExtensionLogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
}

/**
 * Extension storage interface
 */
export interface ExtensionStorage {
  /** Get a value from storage */
  get<T = any>(key: string): Promise<T | null>;
  
  /** Set a value in storage */
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  
  /** Delete a value from storage */
  delete(key: string): Promise<void>;
  
  /** Check if key exists */
  exists(key: string): Promise<boolean>;
  
  /** Get multiple keys */
  mget<T = any>(keys: string[]): Promise<(T | null)[]>;
  
  /** Set multiple keys */
  mset(entries: Record<string, any>): Promise<void>;
}

/**
 * Extension event emitter interface
 */
export interface ExtensionEventEmitter {
  /** Emit an event */
  emit(event: string, data: any): void;
  
  /** Subscribe to an event */
  on(event: string, handler: (data: any) => void): void;
  
  /** Subscribe to an event once */
  once(event: string, handler: (data: any) => void): void;
  
  /** Unsubscribe from an event */
  off(event: string, handler?: (data: any) => void): void;
}

/**
 * Extension metrics interface
 */
export interface ExtensionMetrics {
  /** Increment a counter */
  increment(metric: string, value?: number, tags?: Record<string, string>): void;
  
  /** Record a gauge value */
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  
  /** Record a histogram value */
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
  
  /** Record timing */
  timing(metric: string, duration: number, tags?: Record<string, string>): void;
  
  /** Start a timer */
  startTimer(metric: string, tags?: Record<string, string>): () => void;
}
