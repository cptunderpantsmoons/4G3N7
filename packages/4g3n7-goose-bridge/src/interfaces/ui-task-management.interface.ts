/**
 * Phase 6.1: UI Task Management Interfaces
 * 
 * Comprehensive type definitions for enhanced task management UI including
 * task creation wizards, templates, progress visualization, scheduling,
 * collaboration, and analytics.
 */

// ─────────────────────────────────────────────────────────────────
// TASK CREATION & WIZARDS
// ─────────────────────────────────────────────────────────────────

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskType {
  AUTOMATION = 'automation',
  WORKFLOW = 'workflow',
  REPORT = 'report',
  ANALYSIS = 'analysis',
  BACKUP = 'backup',
  MAINTENANCE = 'maintenance',
  MONITORING = 'monitoring',
  CUSTOM = 'custom',
}

export interface TaskDefinition {
  taskId: string;
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  modifiedAt: Date;
  dueDate?: Date;
  estimatedDuration?: number;
  assignedTo?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface TaskStep {
  stepId: string;
  name: string;
  description: string;
  action: string;
  params?: Record<string, any>;
  sequence: number;
  optional: boolean;
  condition?: string;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
    backoff: boolean;
  };
}

export interface WizardStep {
  stepId: string;
  title: string;
  description: string;
  type: 'input' | 'select' | 'confirm' | 'summary';
  fields?: Array<{
    fieldId: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox';
    required: boolean;
    options?: Array<{ value: any; label: string }>;
    validation?: { pattern?: string; min?: number; max?: number };
  }>;
  nextStep?: string;
  previousStep?: string;
}

export interface TaskWizard {
  wizardId: string;
  name: string;
  description: string;
  steps: WizardStep[];
  startStepId: string;
  category: string;
  created: Date;
  modified: Date;
  enabled: boolean;
  previewData?: Record<string, any>;
}

export interface WizardSession {
  sessionId: string;
  wizardId: string;
  currentStepId: string;
  completedSteps: number;
  totalSteps: number;
  formData: Record<string, any>;
  startTime: Date;
  lastModified: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
}

// ─────────────────────────────────────────────────────────────────
// TASK TEMPLATES
// ─────────────────────────────────────────────────────────────────

export interface TaskTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  type: TaskType;
  steps: TaskStep[];
  defaultPriority: TaskPriority;
  estimatedDuration: number;
  variables?: Array<{
    name: string;
    type: string;
    defaultValue?: any;
    description?: string;
  }>;
  tags: string[];
  created: Date;
  modified: Date;
  usageCount: number;
  rating?: number;
}

export interface TaskSuggestion {
  suggestionId: string;
  taskName: string;
  description: string;
  templateId: string;
  confidence: number;
  reason: string;
  context?: Record<string, any>;
  suggestedAt: Date;
}

export interface TemplateLibrary {
  libraryId: string;
  name: string;
  description: string;
  templates: TaskTemplate[];
  categories: string[];
  totalTemplates: number;
  lastUpdated: Date;
  shared: boolean;
  owner?: string;
}

// ─────────────────────────────────────────────────────────────────
// TASK PROGRESS & VISUALIZATION
// ─────────────────────────────────────────────────────────────────

export interface TaskProgress {
  taskId: string;
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  status: TaskStatus;
  startTime: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  elapsedTime: number;
}

export interface StepExecution {
  stepId: string;
  stepName: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration: number;
  retryCount: number;
}

export interface TaskVisualization {
  visualizationId: string;
  taskId: string;
  type: 'timeline' | 'gantt' | 'flowchart' | 'kanban' | 'custom';
  data: {
    steps: Array<{
      id: string;
      name: string;
      startTime: Date;
      endTime?: Date;
      status: string;
      progress?: number;
    }>;
    dependencies?: Array<{ from: string; to: string }>;
    criticalPath?: string[];
  };
  generated: Date;
}

export interface TaskDiagnostics {
  diagnosticsId: string;
  taskId: string;
  status: TaskStatus;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
    context?: any;
  }>;
  errors: Array<{
    stepId: string;
    error: string;
    stackTrace?: string;
    suggestions: string[];
  }>;
  performance: {
    totalDuration: number;
    slowestStep?: { stepId: string; duration: number };
    averageStepDuration: number;
  };
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────
// TASK SCHEDULING & AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum ScheduleType {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CRON = 'cron',
  EVENT_BASED = 'event_based',
}

export interface TaskSchedule {
  scheduleId: string;
  taskId: string;
  enabled: boolean;
  type: ScheduleType;
  cron?: string;
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  nextRun?: Date;
  lastRun?: Date;
  maxExecutions?: number;
  executionCount: number;
}

export interface TaskAutomation {
  automationId: string;
  name: string;
  description: string;
  triggers: Array<{
    triggerId: string;
    type: 'schedule' | 'event' | 'condition' | 'webhook';
    config: Record<string, any>;
  }>;
  taskTemplate: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  created: Date;
  modified: Date;
  executionHistory: Array<{
    executionId: string;
    timestamp: Date;
    status: 'success' | 'failure';
    result?: any;
    error?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────
// TASK COLLABORATION & SHARING
// ─────────────────────────────────────────────────────────────────

export interface TaskCollaborator {
  collaboratorId: string;
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  joinedAt: Date;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canComment: boolean;
  };
}

export interface TaskComment {
  commentId: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  edited: boolean;
  editedAt?: Date;
  replies?: TaskComment[];
  attachments?: Array<{ fileId: string; fileName: string; size: number }>;
}

export interface TaskAttachment {
  attachmentId: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

export interface SharedTask {
  shareId: string;
  taskId: string;
  sharedWith: string[];
  shareType: 'email' | 'link' | 'group';
  permission: 'view' | 'edit' | 'manage';
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────────
// TASK ANALYTICS & REPORTING
// ─────────────────────────────────────────────────────────────────

export interface TaskMetrics {
  metricsId: string;
  taskId: string;
  completionRate: number;
  successRate: number;
  averageDuration: number;
  totalExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  totalRetries: number;
  lastExecuted?: Date;
  nextScheduled?: Date;
}

export interface TaskReport {
  reportId: string;
  title: string;
  generatedAt: Date;
  timeRange: { start: Date; end: Date };
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageCompletionTime: number;
    successRate: number;
  };
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byType: Record<TaskType, number>;
  topTasks: Array<{
    taskId: string;
    name: string;
    executionCount: number;
    successRate: number;
  }>;
  trends: Array<{
    date: Date;
    completed: number;
    failed: number;
    average_duration: number;
  }>;
  recommendations: string[];
}

export interface TaskAnalytics {
  analyticsId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalTasks: number;
    activeTasks: number;
    completionRate: number;
    failureRate: number;
    averageCompletionTime: number;
    totalExecutionTime: number;
    timeToComplete: Array<{ percentile: number; time: number }>;
  };
  topPerformers: Array<{
    taskId: string;
    name: string;
    completionRate: number;
    avgDuration: number;
  }>;
  bottlenecks: Array<{
    stepId: string;
    stepName: string;
    averageDuration: number;
    failureRate: number;
  }>;
  insights: string[];
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED UI TASK MANAGEMENT SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IUITaskManagementService {
  // Task Wizard Operations
  createWizard(wizard: TaskWizard): Promise<void>;
  startWizardSession(wizardId: string): Promise<WizardSession>;
  getWizardStep(sessionId: string, stepId: string): Promise<WizardStep>;
  submitWizardStep(sessionId: string, stepId: string, data: Record<string, any>): Promise<WizardStep | TaskDefinition>;
  completeWizardSession(sessionId: string): Promise<TaskDefinition>;
  cancelWizardSession(sessionId: string): Promise<void>;
  getWizardSessions(limit?: number): Promise<WizardSession[]>;

  // Task Templates
  createTemplate(template: TaskTemplate): Promise<void>;
  getTemplates(category?: string): Promise<TaskTemplate[]>;
  getSuggestions(context?: Record<string, any>): Promise<TaskSuggestion[]>;
  applyTemplate(templateId: string, overrides?: Record<string, any>): Promise<TaskDefinition>;
  cloneTemplate(templateId: string, newName: string): Promise<TaskTemplate>;

  // Task Progress & Visualization
  getTaskProgress(taskId: string): Promise<TaskProgress>;
  getStepExecutions(taskId: string): Promise<StepExecution[]>;
  getTaskVisualization(taskId: string, type?: string): Promise<TaskVisualization>;
  getTaskDiagnostics(taskId: string): Promise<TaskDiagnostics>;

  // Task Scheduling
  scheduleTask(taskId: string, schedule: TaskSchedule): Promise<void>;
  getScheduledTasks(limit?: number): Promise<TaskSchedule[]>;
  updateSchedule(scheduleId: string, schedule: Partial<TaskSchedule>): Promise<void>;
  getNextScheduledRun(taskId: string): Promise<Date | null>;

  // Task Automation
  createAutomation(automation: TaskAutomation): Promise<void>;
  listAutomations(enabled?: boolean): Promise<TaskAutomation[]>;
  executeAutomation(automationId: string): Promise<any>;
  getAutomationExecutionHistory(automationId: string, limit?: number): Promise<any[]>;

  // Collaboration
  addCollaborator(taskId: string, userId: string, role: string): Promise<void>;
  getCollaborators(taskId: string): Promise<TaskCollaborator[]>;
  removeCollaborator(taskId: string, collaboratorId: string): Promise<void>;
  addComment(taskId: string, comment: TaskComment): Promise<void>;
  getComments(taskId: string, limit?: number): Promise<TaskComment[]>;
  shareTask(taskId: string, share: SharedTask): Promise<void>;

  // Analytics & Reporting
  getTaskMetrics(taskId: string): Promise<TaskMetrics>;
  generateTaskReport(timeRange: { start: Date; end: Date }): Promise<TaskReport>;
  getTaskAnalytics(period: string, startDate: Date, endDate: Date): Promise<TaskAnalytics>;
  getTopTasks(limit?: number): Promise<Array<{ taskId: string; name: string; score: number }>>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface UITaskManagementResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
