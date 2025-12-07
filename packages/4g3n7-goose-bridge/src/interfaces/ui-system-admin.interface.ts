/**
 * Phase 6.3: UI System Administration Interfaces
 * 
 * Comprehensive type definitions for system dashboard, user/role management,
 * license management, audit logging, and system configuration.
 */

// ─────────────────────────────────────────────────────────────────
// SYSTEM DASHBOARD & METRICS
// ─────────────────────────────────────────────────────────────────

export enum SystemHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  OFFLINE = 'offline',
}

export enum MetricCategory {
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  PROCESS = 'process',
  SERVICE = 'service',
}

export interface SystemMetric {
  metricId: string;
  timestamp: Date;
  category: MetricCategory;
  value: number;
  unit: string;
  threshold?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface DashboardWidget {
  widgetId: string;
  name: string;
  type: 'chart' | 'gauge' | 'list' | 'stat' | 'alert' | 'table';
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  refreshInterval: number;
  enabled: boolean;
}

export interface SystemDashboard {
  dashboardId: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  refreshRate: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthCheckResult {
  checkId: string;
  timestamp: Date;
  status: SystemHealthStatus;
  components: Array<{
    name: string;
    status: SystemHealthStatus;
    message?: string;
    value?: number;
  }>;
  overallHealth: number;
  recommendations: string[];
}

export interface PerformanceMetrics {
  metricsId: string;
  timestamp: Date;
  cpu: { usage: number; cores: number; temperature?: number };
  memory: { used: number; total: number; usage: number };
  disk: { used: number; total: number; usage: number; iops: number };
  network: { bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number };
  services: { total: number; running: number; failed: number };
  processCount: number;
}

// ─────────────────────────────────────────────────────────────────
// USER & ROLE MANAGEMENT
// ─────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  DEVELOPER = 'developer',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface User {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
}

export interface UserPermission {
  permissionId: string;
  name: string;
  description: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute' | 'admin';
}

export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: UserPermission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
  mfaVerified: boolean;
  isActive: boolean;
}

export interface UserLoginAttempt {
  attemptId: string;
  username: string;
  ipAddress: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
  userAgent?: string;
}

// ─────────────────────────────────────────────────────────────────
// LICENSE MANAGEMENT
// ─────────────────────────────────────────────────────────────────

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  TRIAL = 'trial',
  EVALUATION = 'evaluation',
}

export enum LicenseType {
  PERPETUAL = 'perpetual',
  SUBSCRIPTION = 'subscription',
  TRIAL = 'trial',
  EVALUATION = 'evaluation',
}

export interface License {
  licenseId: string;
  licenseKey: string;
  type: LicenseType;
  status: LicenseStatus;
  productName: string;
  productVersion: string;
  organization: string;
  maxUsers: number;
  maxConnections: number;
  features: string[];
  issuedAt: Date;
  expiresAt?: Date;
  supportExpiresAt?: Date;
  maintenanceExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseUsage {
  usageId: string;
  licenseId: string;
  timestamp: Date;
  activeUsers: number;
  activeConnections: number;
  activeModules: string[];
  utilizationPercentage: number;
}

export interface LicenseFeature {
  featureId: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  tier: 'basic' | 'professional' | 'enterprise';
}

// ─────────────────────────────────────────────────────────────────
// AUDIT LOGGING & COMPLIANCE
// ─────────────────────────────────────────────────────────────────

export enum AuditEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  PERMISSION_CHANGE = 'permission_change',
  CONFIG_CHANGE = 'config_change',
  LICENSE_CHANGE = 'license_change',
  ERROR = 'error',
  SECURITY = 'security',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLog {
  logId: string;
  timestamp: Date;
  userId: string;
  username: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  resource: string;
  resourceId?: string;
  action: string;
  changes?: { before: any; after: any };
  ipAddress: string;
  userAgent?: string;
  status: 'success' | 'failure';
  message?: string;
}

export interface ComplianceReport {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  totalEvents: number;
  failureCount: number;
  criticalCount: number;
  recommendations: string[];
  attachments?: string[];
}

export interface SecurityPolicy {
  policyId: string;
  name: string;
  description: string;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays?: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  mfaRequired: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// SYSTEM CONFIGURATION
// ─────────────────────────────────────────────────────────────────

export interface SystemConfig {
  configId: string;
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  category: string;
  modifiedAt: Date;
  modifiedBy: string;
}

export interface NotificationSettings {
  settingsId: string;
  emailNotifications: boolean;
  slackIntegration: boolean;
  webhookUrl?: string;
  alertThresholds: Record<string, number>;
  notificationChannels: Array<{
    type: 'email' | 'slack' | 'webhook' | 'log';
    enabled: boolean;
    config: Record<string, any>;
  }>;
}

export interface BackupConfig {
  configId: string;
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  storageLocation: string;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  verifyIntegrity: boolean;
  lastBackupTime?: Date;
  nextBackupTime?: Date;
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED UI SYSTEM ADMIN SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IUISystemAdminService {
  // Dashboard Operations
  getDashboard(dashboardId?: string): Promise<SystemDashboard>;
  listDashboards(): Promise<SystemDashboard[]>;
  createDashboard(dashboard: SystemDashboard): Promise<SystemDashboard>;
  updateDashboard(dashboardId: string, updates: Partial<SystemDashboard>): Promise<void>;
  getSystemMetrics(category?: MetricCategory): Promise<SystemMetric[]>;
  getHealthStatus(): Promise<HealthCheckResult>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;

  // User Management
  createUser(user: User): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  listUsers(filter?: { role?: UserRole; status?: UserStatus }): Promise<User[]>;
  getUser(userId: string): Promise<User>;
  getUserSessions(userId: string): Promise<UserSession[]>;
  revokeUserSession(sessionId: string): Promise<void>;
  getLoginAttempts(userId?: string, limit?: number): Promise<UserLoginAttempt[]>;

  // Role Management
  createRole(role: Role): Promise<Role>;
  updateRole(roleId: string, updates: Partial<Role>): Promise<Role>;
  deleteRole(roleId: string): Promise<void>;
  listRoles(): Promise<Role[]>;
  getRole(roleId: string): Promise<Role>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;

  // License Management
  addLicense(license: License): Promise<License>;
  updateLicense(licenseId: string, updates: Partial<License>): Promise<License>;
  removeLicense(licenseId: string): Promise<void>;
  listLicenses(): Promise<License[]>;
  getLicense(licenseId: string): Promise<License>;
  validateLicense(licenseKey: string): Promise<License>;
  getLicenseUsage(licenseId: string): Promise<LicenseUsage>;
  getFeatures(licenseId: string): Promise<LicenseFeature[]>;

  // Audit & Compliance
  logAuditEvent(event: AuditLog): Promise<void>;
  getAuditLogs(filter?: { userId?: string; eventType?: AuditEventType; startDate?: Date; endDate?: Date }, limit?: number): Promise<AuditLog[]>;
  generateComplianceReport(reportType: string, period: { start: Date; end: Date }): Promise<ComplianceReport>;
  getSecurityPolicy(): Promise<SecurityPolicy>;
  updateSecurityPolicy(updates: Partial<SecurityPolicy>): Promise<void>;

  // System Configuration
  getConfig(key: string): Promise<SystemConfig>;
  getAllConfigs(): Promise<SystemConfig[]>;
  updateConfig(key: string, value: any): Promise<void>;
  getNotificationSettings(): Promise<NotificationSettings>;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;
  getBackupConfig(): Promise<BackupConfig>;
  updateBackupConfig(config: Partial<BackupConfig>): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface UISystemAdminResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
