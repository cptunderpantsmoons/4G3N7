/**
 * Context Management Interfaces
 * Multi-dimensional context management with persistence, snapshots, and recovery
 */

export enum ContextType {
  USER = 'user',
  SESSION = 'session',
  TASK = 'task',
  CONVERSATION = 'conversation',
  SYSTEM = 'system',
}

export interface Context {
  id: string;
  type: ContextType;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  state: ContextState;
  parent?: string; // Parent context ID
  children?: string[]; // Child context IDs
  metadata?: Record<string, any>;
}

export interface ContextState {
  variables: Map<string, any>;
  properties: Record<string, any>;
  timestamp: Date;
}

// User Context
export interface UserContext extends Context {
  type: ContextType.USER;
  state: UserContextState;
}

export interface UserContextState extends ContextState {
  userId: string;
  username: string;
  preferences: Record<string, any>;
  roles: string[];
  permissions: string[];
  profile: Record<string, any>;
}

// Session Context
export interface SessionContext extends Context {
  type: ContextType.SESSION;
  state: SessionContextState;
}

export interface SessionContextState extends ContextState {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  isActive: boolean;
  interactions: Interaction[];
  environment: Record<string, any>;
}

// Task Context
export interface TaskContext extends Context {
  type: ContextType.TASK;
  state: TaskContextState;
}

export interface TaskContextState extends ContextState {
  taskId: string;
  taskType: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  startTime?: Date;
  endTime?: Date;
  attempts: number;
  steps: TaskStep[];
}

// Conversation Context
export interface ConversationContext extends Context {
  type: ContextType.CONVERSATION;
  state: ConversationContextState;
}

export interface ConversationContextState extends ContextState {
  conversationId: string;
  userId: string;
  sessionId: string;
  messages: Message[];
  topic?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  language: string;
  summary?: string;
}

// System Context
export interface SystemContext extends Context {
  type: ContextType.SYSTEM;
  state: SystemContextState;
}

export interface SystemContextState extends ContextState {
  resources: ResourceInfo;
  configuration: Record<string, any>;
  loadAverage: number;
  activeExtensions: string[];
  activeServices: string[];
}

// Context Components
export interface Interaction {
  timestamp: Date;
  type: string;
  action: string;
  details: Record<string, any>;
}

export interface Message {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface TaskStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
}

export interface ResourceInfo {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkBandwidth: number;
  timestamp: Date;
}

// Context Snapshot
export interface ContextSnapshot {
  id: string;
  contextId: string;
  snapshotTime: Date;
  state: ContextState;
  label?: string;
  description?: string;
  tags: string[];
}

// Context History
export interface ContextHistory {
  contextId: string;
  snapshots: ContextSnapshot[];
  totalSnapshots: number;
  oldestSnapshot: Date;
  newestSnapshot: Date;
}

// Context Search Query
export interface ContextSearchQuery {
  type?: ContextType;
  userId?: string;
  sessionId?: string;
  taskId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// Context Search Result
export interface ContextSearchResult {
  contexts: Context[];
  total: number;
  hasMore: boolean;
}

// Context Merge Request
export interface ContextMergeRequest {
  sourceContextId: string;
  targetContextId: string;
  mergeStrategy: 'overwrite' | 'merge' | 'conflict';
}

// Context Sharing
export interface ContextSharingRequest {
  contextId: string;
  sharedWith: string[]; // User IDs or extension IDs
  permissions: 'read' | 'write';
  expiresAt?: Date;
}

// Context Recovery
export interface ContextRecoveryPoint {
  id: string;
  contextId: string;
  timestamp: Date;
  snapshotId: string;
  label: string;
}

// Context Validation Result
export interface ContextValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

// Context Statistics
export interface ContextStatistics {
  type: ContextType;
  activeCount: number;
  inactiveCount: number;
  averageLifetime: number; // milliseconds
  totalCreated: number;
  lastActivityTime: Date;
}

// Context Update Request
export interface ContextUpdateRequest {
  variables?: Record<string, any>;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

// Context Cleanup Policy
export interface ContextCleanupPolicy {
  type?: ContextType;
  maxAge?: number; // milliseconds
  keepActive?: boolean;
  archiveBeforeDelete?: boolean;
}

// Context Inheritance
export interface ContextInheritanceRequest {
  parentContextId: string;
  childContextType: ContextType;
  inheritedVariables?: string[];
  inheritedProperties?: string[];
}
