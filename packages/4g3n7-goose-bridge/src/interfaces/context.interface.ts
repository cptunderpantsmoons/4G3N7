/**
 * Context Management Interfaces for Phase 4
 * Defines session context, state persistence, and context switching
 */

export enum ContextType {
  SESSION = 'session',
  USER = 'user',
  TASK = 'task',
  WORKFLOW = 'workflow',
  CONVERSATION = 'conversation',
}

export enum ContextState {
  CREATED = 'created',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

export interface ContextEntity {
  id: string;
  type: string;
  name: string;
  value: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ContextMemory {
  key: string;
  value: any;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
  ttl?: number; // milliseconds
}

export interface ContextSnapshot {
  id: string;
  contextId: string;
  timestamp: Date;
  state: Record<string, any>;
  entities: ContextEntity[];
  memory: ContextMemory[];
  metadata?: Record<string, any>;
}

export interface ExecutionContext {
  contextId: string;
  type: ContextType;
  state: ContextState;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  workflowId?: string;
  startTime: Date;
  lastActivityTime: Date;
  endTime?: Date;
  entities: Map<string, ContextEntity>;
  memory: Map<string, ContextMemory>;
  variables: Map<string, any>;
  results: Map<string, any>;
  errors: Error[];
  metadata?: Record<string, any>;
}

export interface ContextSwitchOperation {
  fromContextId: string;
  toContextId: string;
  reason: string;
  timestamp: Date;
  dataTransferred?: string[];
  preserveState?: boolean;
}

export interface ContextHistory {
  contextId: string;
  snapshots: ContextSnapshot[];
  switches: ContextSwitchOperation[];
  createdAt: Date;
  lastModified: Date;
  totalSnapshots: number;
}

export interface ContextPersistenceConfig {
  enabled: boolean;
  storageBackend: 'memory' | 'database' | 'redis';
  snapshotInterval?: number; // milliseconds
  maxSnapshots?: number;
  autoArchive?: boolean;
  archiveAfter?: number; // milliseconds
  encryptionEnabled?: boolean;
}

export interface ContextMergingStrategy {
  strategy: 'overwrite' | 'merge' | 'conflict';
  prioritizeNew?: boolean;
  preserveHistory?: boolean;
  conflictResolution?: 'first-write-wins' | 'last-write-wins' | 'manual';
}

export interface ContextDiff {
  contextId: string;
  previousSnapshot: ContextSnapshot;
  currentSnapshot: ContextSnapshot;
  added: Record<string, any>;
  modified: Record<string, any>;
  removed: string[];
  timestamp: Date;
}

export interface ContextStatistics {
  totalContexts: number;
  activeContexts: number;
  totalSessions: number;
  avgContextDuration: number;
  avgMemorySize: number;
  mostActiveContext?: string;
  lastActivity: Date;
  snapshotsCreated: number;
  contextSwitches: number;
}

export interface ContextQuery {
  contextId?: string;
  type?: ContextType;
  state?: ContextState;
  userId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface ContextQueryResult {
  contexts: ExecutionContext[];
  total: number;
  timestamp: Date;
}

export interface ContextConfig {
  maxContexts: number;
  defaultTTL: number; // milliseconds
  snapshotInterval: number;
  persistenceConfig: ContextPersistenceConfig;
  mergingStrategy: ContextMergingStrategy;
  autoCleanup: boolean;
  cleanupInterval: number; // milliseconds
}

export interface ContextEvent {
  id: string;
  type: 'created' | 'updated' | 'switched' | 'archived' | 'closed';
  contextId: string;
  timestamp: Date;
  changes?: ContextDiff;
  metadata?: Record<string, any>;
}
