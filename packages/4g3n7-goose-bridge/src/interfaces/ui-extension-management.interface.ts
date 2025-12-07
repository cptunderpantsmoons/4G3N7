/**
 * Phase 6.2: UI Extension Management Interfaces
 * 
 * Comprehensive type definitions for extension marketplace, installation,
 * configuration, monitoring, development tools, and community features.
 */

// ─────────────────────────────────────────────────────────────────
// EXTENSION BASICS
// ─────────────────────────────────────────────────────────────────

export enum ExtensionType {
  AUTOMATION = 'automation',
  INTEGRATION = 'integration',
  VISUALIZATION = 'visualization',
  ANALYSIS = 'analysis',
  UTILITY = 'utility',
  TEMPLATE = 'template',
  PLUGIN = 'plugin',
  SDK = 'sdk',
}

export enum ExtensionStatus {
  AVAILABLE = 'available',
  INSTALLED = 'installed',
  UPDATING = 'updating',
  DISABLED = 'disabled',
  ERROR = 'error',
  DEPRECATED = 'deprecated',
}

export enum LicenseType {
  MIT = 'mit',
  APACHE2 = 'apache2',
  GPL = 'gpl',
  BSD = 'bsd',
  COMMERCIAL = 'commercial',
  PROPRIETARY = 'proprietary',
}

export interface Extension {
  extensionId: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  type: ExtensionType;
  author: string;
  license: LicenseType;
  status: ExtensionStatus;
  homepage?: string;
  repository?: string;
  icon?: string;
  banner?: string;
  tags: string[];
  keywords: string[];
  rating: number;
  downloads: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  deprecated: boolean;
  deprecationMessage?: string;
}

export interface ExtensionMetadata {
  metadataId: string;
  extensionId: string;
  version: string;
  manifest: {
    activationEvents?: string[];
    contributes?: Record<string, any>;
    dependencies?: Record<string, string>;
    engines?: { 'goose-bridge'?: string };
  };
  permissions?: string[];
  capabilities?: string[];
  requirements?: { name: string; version: string }[];
}

// ─────────────────────────────────────────────────────────────────
// MARKETPLACE & INSTALLATION
// ─────────────────────────────────────────────────────────────────

export interface MarketplaceExtension {
  extensionId: string;
  extension: Extension;
  featured: boolean;
  trending: boolean;
  verified: boolean;
  officialProvider: boolean;
  trustScore: number;
  lastReviewDate?: Date;
  securityScanStatus: 'passed' | 'pending' | 'failed';
}

export interface ExtensionVersion {
  versionId: string;
  extensionId: string;
  version: string;
  releaseDate: Date;
  changelog: string;
  downloadUrl: string;
  checksum: string;
  size: number;
  stable: boolean;
  breaking: boolean;
}

export interface InstallationRequest {
  requestId: string;
  extensionId: string;
  version: string;
  userId: string;
  installPath: string;
  dependencies?: string[];
  autoUpdate: boolean;
  requestedAt: Date;
}

export interface InstalledExtension {
  installedId: string;
  extensionId: string;
  name: string;
  version: string;
  type: ExtensionType;
  status: ExtensionStatus;
  installPath: string;
  installDate: Date;
  lastUpdated: Date;
  lastUsed?: Date;
  autoUpdate: boolean;
  enabled: boolean;
  dataFolder: string;
}

export interface ExtensionMarketplace {
  listings: MarketplaceExtension[];
  featured: MarketplaceExtension[];
  trending: MarketplaceExtension[];
  recommended: MarketplaceExtension[];
  recentlyUpdated: MarketplaceExtension[];
  totalListings: number;
  categoriesCount: Record<ExtensionType, number>;
}

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION & MANAGEMENT
// ─────────────────────────────────────────────────────────────────

export interface ExtensionConfig {
  configId: string;
  extensionId: string;
  enabled: boolean;
  autoUpdate: boolean;
  autoLaunch: boolean;
  settings: Record<string, any>;
  permissions: {
    granted: string[];
    requested: string[];
    denied: string[];
  };
  dataPath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  createdAt: Date;
  modifiedAt: Date;
}

export interface ExtensionSetting {
  settingId: string;
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'array';
  defaultValue: any;
  value: any;
  required: boolean;
  options?: Array<{ label: string; value: any }>;
  validation?: { pattern?: string; min?: number; max?: number };
  category?: string;
}

export interface ExtensionPermission {
  permissionId: string;
  name: string;
  description: string;
  category: 'file' | 'network' | 'system' | 'data' | 'ui' | 'custom';
  level: 'read' | 'write' | 'execute' | 'full';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExtensionDependency {
  dependencyId: string;
  extensionId: string;
  dependsOn: string;
  version: string;
  optional: boolean;
  installed: boolean;
  conflictsWith?: string[];
}

// ─────────────────────────────────────────────────────────────────
// MONITORING & STATUS
// ─────────────────────────────────────────────────────────────────

export interface ExtensionStatusInfo {
  statusId: string;
  extensionId: string;
  installed: boolean;
  enabled: boolean;
  running: boolean;
  uptime: number;
  lastStartTime?: Date;
  lastStopTime?: Date;
  crashes: number;
  errorCount: number;
  warningCount: number;
  memoryUsage: number;
  cpuUsage: number;
  dataUsage: number;
}

export interface ExtensionAlert {
  alertId: string;
  extensionId: string;
  type: 'error' | 'warning' | 'info' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  action?: string;
}

export interface ExtensionLog {
  logId: string;
  extensionId: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

export interface ExtensionHealthCheck {
  healthId: string;
  extensionId: string;
  timestamp: Date;
  overallHealth: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message?: string;
  }>;
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────
// DEVELOPMENT TOOLS
// ─────────────────────────────────────────────────────────────────

export interface ExtensionPackage {
  packageId: string;
  name: string;
  version: string;
  entryPoint: string;
  description: string;
  author: string;
  license: string;
  main: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { 'goose-bridge'?: string };
  keywords: string[];
  repository?: string;
}

export interface ExtensionTest {
  testId: string;
  extensionId: string;
  name: string;
  description: string;
  testFile: string;
  type: 'unit' | 'integration' | 'e2e';
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: {
    duration: number;
    output: string;
    error?: string;
    coverage?: number;
  };
  createdAt: Date;
  runAt?: Date;
}

export interface ExtensionTemplate {
  templateId: string;
  name: string;
  description: string;
  language: 'typescript' | 'javascript' | 'python';
  type: ExtensionType;
  structure: Record<string, string>;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  documentation: string;
}

export interface ExtensionDebugSession {
  sessionId: string;
  extensionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'stopped';
  breakpoints: Array<{ file: string; line: number }>;
  watches: string[];
  callStack: string[];
  variables: Record<string, any>;
}

export interface ExtensionPackageInfo {
  packageId: string;
  extensionId: string;
  name: string;
  version: string;
  size: number;
  compressed: number;
  files: number;
  includes: string[];
  excludes: string[];
  checksums: { sha256: string; sha512?: string };
}

// ─────────────────────────────────────────────────────────────────
// TESTING & VALIDATION
// ─────────────────────────────────────────────────────────────────

export interface ExtensionValidation {
  validationId: string;
  extensionId: string;
  status: 'pending' | 'validating' | 'valid' | 'invalid';
  startTime: Date;
  endTime?: Date;
  checks: Array<{
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message?: string;
    suggestions?: string[];
  }>;
  score: number;
  issues: string[];
  warnings: string[];
  approved: boolean;
}

export interface ExtensionTestSuite {
  suiteId: string;
  extensionId: string;
  name: string;
  tests: ExtensionTest[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  duration: number;
  lastRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// ─────────────────────────────────────────────────────────────────
// COMMUNITY & DOCUMENTATION
// ─────────────────────────────────────────────────────────────────

export interface ExtensionReview {
  reviewId: string;
  extensionId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  text: string;
  helpful: number;
  unhelpful: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExtensionIssue {
  issueId: string;
  extensionId: string;
  userId: string;
  title: string;
  description: string;
  type: 'bug' | 'feature' | 'enhancement' | 'question';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  labels: string[];
  comments: Array<{
    commentId: string;
    userId: string;
    text: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  closedAt?: Date;
}

export interface ExtensionDocumentation {
  docId: string;
  extensionId: string;
  title: string;
  content: string;
  type: 'readme' | 'guide' | 'api' | 'tutorial' | 'faq';
  language: string;
  lastUpdated: Date;
  version: string;
}

export interface ExtensionRelease {
  releaseId: string;
  extensionId: string;
  version: string;
  releaseDate: Date;
  prerelease: boolean;
  changelog: string;
  downloadUrl: string;
  size: number;
  downloads: number;
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED UI EXTENSION MANAGEMENT SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IUIExtensionManagementService {
  // Marketplace Operations
  searchMarketplace(query: string, filters?: Record<string, any>): Promise<MarketplaceExtension[]>;
  getMarketplaceExtension(extensionId: string): Promise<MarketplaceExtension>;
  getFeaturedExtensions(limit?: number): Promise<MarketplaceExtension[]>;
  getTrendingExtensions(limit?: number): Promise<MarketplaceExtension[]>;
  getRecommendedExtensions(limit?: number): Promise<MarketplaceExtension[]>;

  // Installation & Management
  installExtension(extensionId: string, version?: string): Promise<InstalledExtension>;
  uninstallExtension(extensionId: string): Promise<void>;
  updateExtension(extensionId: string): Promise<InstalledExtension>;
  listInstalledExtensions(): Promise<InstalledExtension[]>;
  getInstalledExtension(extensionId: string): Promise<InstalledExtension>;

  // Configuration
  getExtensionConfig(extensionId: string): Promise<ExtensionConfig>;
  updateExtensionConfig(extensionId: string, config: Partial<ExtensionConfig>): Promise<void>;
  getExtensionSettings(extensionId: string): Promise<ExtensionSetting[]>;
  updateExtensionSetting(extensionId: string, settingId: string, value: any): Promise<void>;
  getExtensionPermissions(extensionId: string): Promise<ExtensionPermission[]>;

  // Status & Monitoring
  getExtensionStatus(extensionId: string): Promise<ExtensionStatusInfo>;
  listExtensionAlerts(extensionId?: string): Promise<ExtensionAlert[]>;
  getExtensionLogs(extensionId: string, limit?: number): Promise<ExtensionLog[]>;
  checkExtensionHealth(extensionId: string): Promise<ExtensionHealthCheck>;

  // Development Tools
  createExtensionProject(template: ExtensionTemplate): Promise<ExtensionPackage>;
  validateExtension(extensionId: string): Promise<ExtensionValidation>;
  runExtensionTests(extensionId: string): Promise<ExtensionTestSuite>;
  debugExtension(extensionId: string): Promise<ExtensionDebugSession>;
  packageExtension(extensionId: string): Promise<ExtensionPackageInfo>;

  // Community
  getExtensionReviews(extensionId: string): Promise<ExtensionReview[]>;
  submitExtensionReview(extensionId: string, review: ExtensionReview): Promise<void>;
  getExtensionIssues(extensionId: string): Promise<ExtensionIssue[]>;
  reportExtensionIssue(extensionId: string, issue: ExtensionIssue): Promise<void>;
  getExtensionDocumentation(extensionId: string): Promise<ExtensionDocumentation[]>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface UIExtensionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
