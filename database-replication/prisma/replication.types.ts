/**
 * Types and interfaces for PostgreSQL replication system
 */

export enum QueryType {
  READ = 'read',
  WRITE = 'write',
  TRANSACTION = 'transaction',
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: string;
  connectionLimit?: number;
  connectionTimeout?: number;
  poolTimeout?: number;
}

export interface HealthCheckConfig {
  interval?: number; // milliseconds
  maxResponseTime?: number; // milliseconds
}

export interface FailoverConfig {
  enabled: boolean;
  notification?: {
    webhook?: string;
    email?: string;
    slack?: string;
  };
}

export interface ReplicationConfig {
  primary: DatabaseConfig;
  replicas: DatabaseConfig[];
  healthCheck?: HealthCheckConfig;
  failover?: FailoverConfig;
}

export interface DatabaseHealth {
  isHealthy: boolean;
  responseTime: number | null;
  error: string | null;
  timestamp: Date;
}

export interface ReplicaStatus {
  index: number;
  isHealthy: boolean;
  responseTime: number | null;
  error: string | null;
  isInPool: boolean;
}

export interface ReplicationStatus {
  primary: {
    isHealthy: boolean;
    responseTime: number | null;
    error: string | null;
  };
  replicas: ReplicaStatus[];
  healthyReplicaCount: number;
  totalReplicaCount: number;
  timestamp: Date;
}

export interface ReplicationMetrics {
  primaryQueries: number;
  replicaQueries: number;
  totalQueries: number;
  averageResponseTime: number;
  errorCount: number;
  uptime: number;
}

export interface DatabaseConnectionInfo {
  type: 'primary' | 'replica';
  index?: number;
  host: string;
  port: number;
  database: string;
  isHealthy: boolean;
  responseTime: number | null;
}

// Enhanced Prisma client with replication support
export interface ReplicatedPrismaClient {
  // Read operations - go to replicas
  findUnique: (...args: any[]) => Promise<any>;
  findMany: (...args: any[]) => Promise<any>;
  findFirst: (...args: any[]) => Promise<any>;
  count: (...args: any[]) => Promise<any>;
  aggregate: (...args: any[]) => Promise<any>;
  groupBy: (...args: any[]) => Promise<any>;

  // Write operations - go to primary
  create: (...args: any[]) => Promise<any>;
  update: (...args: any[]) => Promise<any>;
  updateMany: (...args: any[]) => Promise<any>;
  delete: (...args: any[]) => Promise<any>;
  deleteMany: (...args: any[]) => Promise<any>;
  upsert: (...args: any[]) => Promise<any>;

  // Transaction operations - go to primary
  $transaction: (...args: any[]) => Promise<any>;
  $executeRaw: (...args: any[]) => Promise<any>;
  $queryRaw: (...args: any[]) => Promise<any>;

  // Health and status
  $health: () => Promise<ReplicationStatus>;
  $metrics: () => Promise<ReplicationMetrics>;
  $connections: () => Promise<DatabaseConnectionInfo[]>;
}

// Query metadata for routing decisions
export interface QueryMetadata {
  type: QueryType;
  model?: string;
  operation?: string;
  timestamp: Date;
  duration?: number;
  success?: boolean;
  error?: string;
}

// Configuration for connection pooling
export interface ConnectionPoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

// Monitor configuration
export interface MonitorConfig {
  enabled: boolean;
  interval: number; // milliseconds
  metricsRetention: number; // hours
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    replicationLag: number;
  };
}

// Replication lag information
export interface ReplicationLag {
  replicaIndex: number;
  lagBytes: number;
  lagSeconds: number;
  timestamp: Date;
}

// Failover event
export interface FailoverEvent {
  timestamp: Date;
  reason: string;
  promotedReplicaIndex: number;
  previousPrimaryHost: string;
  newPrimaryHost: string;
  duration: number; // milliseconds
  success: boolean;
}