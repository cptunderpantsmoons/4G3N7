/**
 * Phase 5.4: System Administration Interfaces
 * 
 * Comprehensive type definitions for system monitoring, maintenance,
 * optimization, backup/recovery, security, and log analysis.
 */

// ─────────────────────────────────────────────────────────────────
// SYSTEM MONITORING & HEALTH CHECKS
// ─────────────────────────────────────────────────────────────────

export enum SystemHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

export enum ResourceType {
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  GPU = 'gpu',
  THERMAL = 'thermal',
}

export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: { [partition: string]: number };
  networkIO: { bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number };
  gpuUsage?: number;
  thermalInfo?: { [sensor: string]: number };
  loadAverage: [number, number, number];
  uptime: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  startTime: Date;
  user: string;
}

export interface DiskInfo {
  partition: string;
  mountPoint: string;
  total: number;
  used: number;
  available: number;
  percentage: number;
  fsType: string;
}

export interface NetworkInterface {
  name: string;
  address: string;
  netmask: string;
  gateway: string;
  mac: string;
  speed: number;
  state: 'up' | 'down';
}

export interface HealthCheckResult {
  checkId: string;
  timestamp: Date;
  status: SystemHealthStatus;
  checks: Array<{
    name: string;
    status: SystemHealthStatus;
    value: number;
    threshold: number;
    message?: string;
  }>;
  overallHealth: number;
  criticalIssues: string[];
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────
// AUTOMATED MAINTENANCE
// ─────────────────────────────────────────────────────────────────

export enum MaintenanceTaskType {
  CLEANUP = 'cleanup',
  UPDATE = 'update',
  DEFRAGMENTATION = 'defragmentation',
  CACHE_CLEAR = 'cache_clear',
  LOG_ROTATION = 'log_rotation',
  DISK_CHECK = 'disk_check',
  BACKUP = 'backup',
  SECURITY_SCAN = 'security_scan',
}

export enum MaintenanceSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export interface MaintenanceTask {
  taskId: string;
  name: string;
  type: MaintenanceTaskType;
  description: string;
  schedule: MaintenanceSchedule;
  cron?: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceExecution {
  executionId: string;
  taskId: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  result?: {
    itemsProcessed: number;
    itemsSkipped: number;
    itemsFailed: number;
    sizeFreed?: number;
    details: string[];
  };
  error?: string;
}

export interface MaintenanceScheduleConfig {
  configId: string;
  name: string;
  tasks: MaintenanceTask[];
  enabled: boolean;
  totalDuration?: number;
  maintenanceWindow?: {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// SYSTEM OPTIMIZATION & TUNING
// ─────────────────────────────────────────────────────────────────

export interface OptimizationProfile {
  profileId: string;
  name: string;
  description: string;
  type: 'performance' | 'balanced' | 'power-saving' | 'custom';
  settings: {
    cpuGovernor?: string;
    cpuFrequencyScaling?: boolean;
    cacheSize?: number;
    memoryAllocation?: number;
    diskIOPriority?: 'low' | 'normal' | 'high';
    networkBufferSize?: number;
  };
  enabled: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface PerformanceMetrics {
  metricsId: string;
  timestamp: Date;
  cpuEfficiency: number;
  memoryEfficiency: number;
  diskIOEfficiency: number;
  networkEfficiency: number;
  thermalEfficiency?: number;
  overallScore: number;
}

export interface OptimizationRecommendation {
  recommendationId: string;
  timestamp: Date;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'thermal';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  currentValue: number;
  recommendedValue: number;
  estimatedImprovement: string;
  implementationSteps?: string[];
}

export interface TuningParameter {
  parameterId: string;
  name: string;
  category: string;
  currentValue: any;
  minValue: any;
  maxValue: any;
  unit?: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

// ─────────────────────────────────────────────────────────────────
// BACKUP & RECOVERY
// ─────────────────────────────────────────────────────────────────

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  DIFFERENTIAL = 'differential',
  SNAPSHOT = 'snapshot',
}

export enum BackupDestination {
  LOCAL = 'local',
  EXTERNAL_DRIVE = 'external_drive',
  NAS = 'nas',
  CLOUD = 'cloud',
  NETWORK = 'network',
}

export interface BackupPolicy {
  policyId: string;
  name: string;
  description: string;
  enabled: boolean;
  sourcePaths: string[];
  destination: BackupDestination;
  backupType: BackupType;
  schedule: MaintenanceSchedule;
  cron?: string;
  retention: {
    dailyRetention: number;
    weeklyRetention: number;
    monthlyRetention: number;
  };
  compression: boolean;
  encryption: boolean;
  deduplication: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface BackupJob {
  jobId: string;
  policyId: string;
  policyName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  backupType: BackupType;
  statistics: {
    filesProcessed: number;
    filesSkipped: number;
    filesFailed: number;
    totalSize: number;
    compressedSize?: number;
    duration: number;
  };
  error?: string;
  backupLocation: string;
  verificationStatus?: 'verified' | 'failed' | 'pending';
}

export interface RestoreOperation {
  restoreId: string;
  backupJobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  sourcePath: string;
  destinationPath: string;
  statistics: {
    filesRestored: number;
    filesSkipped: number;
    filesFailed: number;
    totalSize: number;
    duration: number;
  };
  error?: string;
  verifyAfterRestore: boolean;
  verificationStatus?: 'verified' | 'failed' | 'pending';
}

export interface RecoveryPoint {
  pointId: string;
  backupJobId: string;
  timestamp: Date;
  backupType: BackupType;
  size: number;
  compressedSize?: number;
  filesIncluded: number;
  retentionDate: Date;
  verificationStatus: 'verified' | 'failed' | 'pending';
  location: string;
  metadata: {
    systemInfo?: string;
    applicationVersions?: Record<string, string>;
    configHash?: string;
  };
}

// ─────────────────────────────────────────────────────────────────
// SECURITY MONITORING & ALERTING
// ─────────────────────────────────────────────────────────────────

export enum ThreatLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SecurityCheckType {
  FIREWALL = 'firewall',
  ANTIVIRUS = 'antivirus',
  MALWARE = 'malware',
  INTRUSION = 'intrusion',
  VULNERABILITY = 'vulnerability',
  ACCESS_CONTROL = 'access_control',
  ENCRYPTION = 'encryption',
  AUDIT_LOG = 'audit_log',
}

export interface SecurityEvent {
  eventId: string;
  timestamp: Date;
  type: SecurityCheckType;
  severity: ThreatLevel;
  source: string;
  description: string;
  details: {
    user?: string;
    resource?: string;
    action?: string;
    ipAddress?: string;
    port?: number;
  };
  acknowledged: boolean;
  response?: string;
}

export interface SecurityAlert {
  alertId: string;
  timestamp: Date;
  type: SecurityCheckType;
  severity: ThreatLevel;
  title: string;
  description: string;
  affectedResources: string[];
  recommendedActions: string[];
  acknowledged: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export interface SecurityScan {
  scanId: string;
  startTime: Date;
  endTime?: Date;
  type: SecurityCheckType;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  scope: string[];
  statistics: {
    itemsScanned: number;
    threatsDetected: number;
    itemsQuarantined?: number;
    itemsCleaned?: number;
  };
  findings: Array<{
    id: string;
    severity: ThreatLevel;
    name: string;
    path?: string;
    hash?: string;
    action?: 'ignore' | 'quarantine' | 'remove';
  }>;
  error?: string;
}

export interface UserAccessLog {
  logId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'access' | 'modify' | 'delete';
  resource: string;
  status: 'success' | 'failure';
  ipAddress: string;
  details?: string;
}

// ─────────────────────────────────────────────────────────────────
// LOG ANALYSIS & TROUBLESHOOTING
// ─────────────────────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  logId: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  module: string;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
  duration?: number;
}

export interface LogAnalysisResult {
  analysisId: string;
  timestamp: Date;
  timeRange: { start: Date; end: Date };
  statistics: {
    totalLogs: number;
    byLevel: Record<LogLevel, number>;
    byService: Record<string, number>;
    errorRate: number;
    averageResponseTime: number;
  };
  patterns: Array<{
    pattern: string;
    count: number;
    services: string[];
    severity: LogLevel;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    timestamp: Date;
    relatedLogs: string[];
  }>;
  recommendations: string[];
}

export interface DiagnosticReport {
  reportId: string;
  timestamp: Date;
  title: string;
  systemSnapshot: SystemMetrics;
  processSnapshot: ProcessInfo[];
  diskSnapshot: DiskInfo[];
  networkSnapshot: NetworkInterface[];
  recentLogs: LogEntry[];
  recentErrors: Array<{ timestamp: Date; error: string; context?: any }>;
  systemHealth: HealthCheckResult;
  analysis: {
    rootCauses: string[];
    affectedSystems: string[];
    recommendations: string[];
  };
}

export interface TroubleshootingGuide {
  guideId: string;
  title: string;
  symptom: string;
  category: string;
  severity: ThreatLevel;
  steps: Array<{
    step: number;
    description: string;
    commands?: string[];
    expectedOutput?: string;
    troubleshootingTips?: string[];
  }>;
  relatedIssues: string[];
  references?: string[];
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED SYSTEM ADMINISTRATION SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface ISystemAdministrationService {
  // System Monitoring
  getSystemMetrics(): Promise<SystemMetrics>;
  getProcessInfo(pid?: number): Promise<ProcessInfo[]>;
  getDiskInfo(): Promise<DiskInfo[]>;
  getNetworkInterfaces(): Promise<NetworkInterface[]>;
  performHealthCheck(): Promise<HealthCheckResult>;
  getSystemHealth(): Promise<SystemHealthStatus>;

  // Maintenance
  createMaintenanceTask(task: MaintenanceTask): Promise<void>;
  executeMaintenanceTask(taskId: string): Promise<MaintenanceExecution>;
  getMaintenanceHistory(limit?: number): Promise<MaintenanceExecution[]>;
  scheduleMaintenanceTasks(config: MaintenanceScheduleConfig): Promise<void>;
  getScheduledTasks(): Promise<MaintenanceTask[]>;

  // Optimization
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  getOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
  applyOptimizationProfile(profileId: string): Promise<void>;
  createCustomProfile(profile: OptimizationProfile): Promise<void>;
  listOptimizationProfiles(): Promise<OptimizationProfile[]>;
  getTuningParameters(): Promise<TuningParameter[]>;
  updateTuningParameter(parameterId: string, value: any): Promise<void>;

  // Backup & Recovery
  createBackupPolicy(policy: BackupPolicy): Promise<void>;
  executeBackup(policyId: string): Promise<BackupJob>;
  listBackupJobs(limit?: number): Promise<BackupJob[]>;
  getRecoveryPoints(limit?: number): Promise<RecoveryPoint[]>;
  restoreFromBackup(backupJobId: string, destinationPath: string): Promise<RestoreOperation>;
  verifyBackupIntegrity(backupJobId: string): Promise<boolean>;

  // Security Monitoring
  getSecurityEvents(limit?: number): Promise<SecurityEvent[]>;
  getSecurityAlerts(severity?: ThreatLevel): Promise<SecurityAlert[]>;
  executSecurityScan(type: SecurityCheckType, scope?: string[]): Promise<SecurityScan>;
  acknowledgeSecurityAlert(alertId: string, response: string): Promise<void>;
  getUserAccessLogs(limit?: number): Promise<UserAccessLog[]>;

  // Log Analysis
  analyzeLogRange(startTime: Date, endTime: Date): Promise<LogAnalysisResult>;
  searchLogs(query: string, limit?: number): Promise<LogEntry[]>;
  generateDiagnosticReport(): Promise<DiagnosticReport>;
  getTroubleshootingGuides(category?: string): Promise<TroubleshootingGuide[]>;
  getRecentErrors(limit?: number): Promise<Array<{ timestamp: Date; error: string }>>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface SystemAdministrationResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
