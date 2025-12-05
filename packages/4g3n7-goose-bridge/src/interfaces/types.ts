/**
 * Core interfaces for Goose integration
 * Defines the contract between 4G3N7 and Goose extensions
 */

/**
 * Task status enumeration
 */
export enum GooseTaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Task priority levels
 */
export enum GooseTaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Extension lifecycle states
 */
export enum ExtensionState {
  REGISTERED = 'REGISTERED',
  LOADING = 'LOADING',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  EXECUTING = 'EXECUTING',
  UNLOADING = 'UNLOADING',
  UNLOADED = 'UNLOADED',
  FAILED = 'FAILED',
}

/**
 * Represents a work unit delegated to Goose
 */
export interface GooseTask {
  /** Unique task identifier */
  taskId: string;
  
  /** Task type/operation to perform */
  type: string;
  
  /** Extension that will process this task */
  extensionId: string;
  
  /** Task payload containing input data */
  payload: Record<string, any>;
  
  /** Task priority */
  priority: GooseTaskPriority;
  
  /** Current task status */
  status: GooseTaskStatus;
  
  /** Task creation timestamp */
  createdAt: Date;
  
  /** Task last update timestamp */
  updatedAt: Date;
  
  /** Optional task timeout in milliseconds */
  timeout?: number;
  
  /** User/tenant who submitted the task */
  userId?: string;
  
  /** Correlation ID for request tracing */
  correlationId?: string;
  
  /** Task metadata */
  metadata?: Record<string, any>;
}

/**
 * Encapsulates Goose processing output
 */
export interface GooseResult {
  /** Task identifier this result belongs to */
  taskId: string;
  
  /** Processing result data */
  result: Record<string, any>;
  
  /** Result metadata */
  metadata: {
    /** Processing duration in milliseconds */
    duration: number;
    
    /** Extension version that processed the task */
    extensionVersion: string;
    
    /** Timestamp when processing completed */
    completedAt: Date;
    
    /** Additional metadata */
    [key: string]: any;
  };
  
  /** Generated artifacts (files, documents, etc.) */
  artifacts?: Array<{
    type: string;
    path: string;
    size: number;
    mimeType: string;
  }>;
  
  /** Error information if task failed */
  error?: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Describes what an extension can do
 */
export interface ExtensionCapability {
  /** Unique capability identifier */
  id: string;
  
  /** Human-readable capability name */
  name: string;
  
  /** Capability description */
  description: string;
  
  /** Supported operations */
  operations: string[];
  
  /** Required permissions */
  requiredPermissions: string[];
  
  /** Input schema (JSON Schema) */
  inputSchema?: Record<string, any>;
  
  /** Output schema (JSON Schema) */
  outputSchema?: Record<string, any>;
  
  /** Capability requirements */
  requirements?: {
    memory?: number;
    cpu?: number;
    storage?: number;
    dependencies?: string[];
  };
}

/**
 * Extension manifest metadata
 */
export interface ExtensionManifest {
  /** Extension identifier */
  id: string;
  
  /** Extension name */
  name: string;
  
  /** Extension version (semver) */
  version: string;
  
  /** Extension description */
  description: string;
  
  /** Extension author */
  author: string;
  
  /** Extension homepage URL */
  homepage?: string;
  
  /** Extension capabilities */
  capabilities: ExtensionCapability[];
  
  /** Required permissions */
  permissions: string[];
  
  /** Extension dependencies */
  dependencies?: Record<string, string>;
  
  /** Configuration schema (JSON Schema) */
  configSchema?: Record<string, any>;
  
  /** Extension entry point */
  entryPoint: string;
  
  /** Minimum bridge version required */
  minBridgeVersion?: string;
}

/**
 * Wrapper for all cross-system communication
 */
export interface BridgeMessage<T = any> {
  /** Unique message identifier */
  messageId: string;
  
  /** Message type */
  type: 'task_submit' | 'task_status' | 'task_result' | 'extension_load' | 'extension_unload' | 'event' | 'control' | 'log';
  
  /** Message payload */
  payload: T;
  
  /** Message timestamp (ISO 8601) */
  timestamp: string;
  
  /** Correlation ID for request/response matching */
  correlationId?: string;
  
  /** Source service/component */
  source?: string;
  
  /** Destination service/component */
  destination?: string;
  
  /** Message metadata */
  metadata?: Record<string, any>;
}

/**
 * WebSocket message types
 */
export interface TaskProgressMessage {
  taskId: string;
  status: GooseTaskStatus;
  progress: number; // 0-100
  message: string;
  timestamp: string;
}

export interface LogEntryMessage {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface ControlMessage {
  action: 'pause' | 'resume' | 'cancel' | 'reload' | 'configure';
  target: string; // task ID or extension ID
  parameters?: Record<string, any>;
}

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  /** Extension ID */
  extensionId: string;
  
  /** Configuration values */
  config: Record<string, any>;
  
  /** Whether extension is enabled */
  enabled: boolean;
  
  /** Auto-load on startup */
  autoLoad: boolean;
  
  /** Resource limits */
  limits?: {
    maxConcurrentTasks?: number;
    maxMemory?: number;
    maxCpu?: number;
    timeout?: number;
  };
}

/**
 * Permission definition
 */
export interface Permission {
  /** Permission identifier */
  id: string;
  
  /** Permission scope */
  scope: 'extension' | 'resource' | 'data';
  
  /** Permission action */
  action: 'read' | 'write' | 'execute' | 'delete' | 'admin';
  
  /** Resource type or extension capability */
  resource: string;
  
  /** Optional resource path/pattern */
  resourcePath?: string;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  /** Unique log entry ID */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Event type */
  eventType: 'task_submit' | 'extension_load' | 'permission_denied' | 'data_access' | 'config_change';
  
  /** User/service that triggered the event */
  actor: string;
  
  /** Target resource */
  target: string;
  
  /** Action performed */
  action: string;
  
  /** Event details */
  details: Record<string, any>;
  
  /** IP address or service identifier */
  source: string;
  
  /** Result status */
  status: 'success' | 'failure' | 'denied';
  
  /** Error message if failed */
  error?: string;
}
