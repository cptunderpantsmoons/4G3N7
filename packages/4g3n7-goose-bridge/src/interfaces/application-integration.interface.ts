/**
 * Phase 5.3: Application Integration Interfaces
 * 
 * Comprehensive type definitions for deep integration with common applications:
 * browsers, office suites, IDEs, and communication tools.
 */

// ─────────────────────────────────────────────────────────────────
// BROWSER AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  SAFARI = 'safari',
  EDGE = 'edge',
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  active: boolean;
  favicon?: string;
  loadProgress: number;
}

export interface BrowserSession {
  sessionId: string;
  browserType: BrowserType;
  startTime: Date;
  endTime?: Date;
  tabs: BrowserTab[];
  currentTabId: string;
  history: string[];
  cookies: Array<{ name: string; value: string; domain: string }>;
}

export interface NavigationAction {
  action: 'navigate' | 'back' | 'forward' | 'reload' | 'stop';
  url?: string;
  waitTime?: number;
}

export interface BrowserCommand {
  action: 'click' | 'type' | 'select' | 'scroll' | 'screenshot' | 'execute';
  selector?: string;
  text?: string;
  value?: string;
  script?: string;
  waitTime?: number;
}

export interface PageElement {
  id: string;
  selector: string;
  type: string;
  text?: string;
  value?: string;
  attributes: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
}

export interface BrowserAutomationResult {
  success: boolean;
  command: BrowserCommand;
  result?: any;
  screenshot?: string;
  elements?: PageElement[];
  error?: string;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────
// OFFICE SUITE AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum OfficeDocumentType {
  WRITER = 'writer',      // Documents
  CALC = 'calc',          // Spreadsheets
  IMPRESS = 'impress',    // Presentations
  DRAW = 'draw',          // Drawings
}

export interface LibreOfficeDocument {
  docId: string;
  title: string;
  type: OfficeDocumentType;
  path?: string;
  modified: boolean;
  readOnly: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface SpreadsheetCell {
  row: number;
  col: number;
  value: string | number;
  formula?: string;
  format?: string;
  style?: Record<string, any>;
}

export interface SpreadsheetRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  cells: SpreadsheetCell[];
}

export interface PresentationSlide {
  slideId: string;
  title: string;
  index: number;
  elements: Array<{ type: string; content: string }>;
  notes?: string;
}

export interface OfficeCommand {
  action: 'open' | 'close' | 'save' | 'edit' | 'insert' | 'format' | 'navigate';
  docType?: OfficeDocumentType;
  path?: string;
  content?: string;
  position?: { row?: number; col?: number; slide?: number };
  formatting?: Record<string, any>;
}

export interface OfficeAutomationResult {
  success: boolean;
  command: OfficeCommand;
  document?: LibreOfficeDocument;
  data?: any;
  error?: string;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────
// IDE & TERMINAL AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum IDEType {
  VSCODE = 'vscode',
  TERMINAL = 'terminal',
  INTELLIJ = 'intellij',
  NEOVIM = 'neovim',
}

export interface CodeFile {
  fileId: string;
  path: string;
  name: string;
  language: string;
  size: number;
  modified: boolean;
  createdAt: Date;
  modifiedAt: Date;
  content?: string;
}

export interface CodeEditor {
  editorId: string;
  ideType: IDEType;
  openFiles: CodeFile[];
  activeFile?: CodeFile;
  cursorPosition: { line: number; column: number };
  selectionRange?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

export interface TerminalSession {
  sessionId: string;
  workingDirectory: string;
  shell: string;
  isActive: boolean;
  history: Array<{ command: string; output: string; timestamp: Date }>;
  lastCommand?: { command: string; exitCode: number };
}

export interface IDECommand {
  action: 'open' | 'edit' | 'search' | 'navigate' | 'execute' | 'debug' | 'terminal';
  target?: string;
  content?: string;
  language?: string;
  position?: { line: number; column: number };
}

export interface TerminalCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface IDEAutomationResult {
  success: boolean;
  command: IDECommand;
  files?: CodeFile[];
  output?: string;
  error?: string;
  duration: number;
}

export interface TerminalResult {
  success: boolean;
  command: string;
  output: string;
  exitCode: number;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────
// COMMUNICATION TOOLS AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum CommsType {
  EMAIL = 'email',
  SLACK = 'slack',
  TEAMS = 'teams',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export interface EmailMessage {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: Date;
  read: boolean;
  attachments?: Array<{ name: string; size: number; type: string }>;
}

export interface EmailFolder {
  folderId: string;
  name: string;
  type: 'inbox' | 'sent' | 'draft' | 'trash' | 'custom';
  messageCount: number;
  unreadCount: number;
}

export interface ChatMessage {
  messageId: string;
  channelId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  reactions?: Array<{ emoji: string; count: number }>;
  threaded?: boolean;
  threadId?: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
}

export interface ChatChannel {
  channelId: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  members: string[];
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export interface CommsCommand {
  action: 'send' | 'read' | 'reply' | 'forward' | 'archive' | 'search';
  target?: string;
  content?: string;
  recipient?: string | string[];
  subject?: string;
  threadId?: string;
}

export interface CommsAutomationResult {
  success: boolean;
  command: CommsCommand;
  message?: EmailMessage | ChatMessage;
  messages?: Array<EmailMessage | ChatMessage>;
  error?: string;
  duration: number;
}

// ─────────────────────────────────────────────────────────────────
// APPLICATION STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────

export interface ApplicationState {
  appName: string;
  appType: string;
  isActive: boolean;
  focusedWindow?: string;
  openDocuments: Array<{ id: string; title: string; path?: string }>;
  recentActions: Array<{ action: string; timestamp: Date; details?: any }>;
  settings: Record<string, any>;
}

export interface ApplicationSnapshot {
  snapshotId: string;
  appName: string;
  timestamp: Date;
  state: ApplicationState;
  documents?: any[];
  metadata?: Record<string, any>;
}

export interface ApplicationCommand {
  appName: string;
  command: string;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ApplicationCommandResult {
  success: boolean;
  appName: string;
  command: string;
  result?: any;
  error?: string;
  duration: number;
  snapshot?: ApplicationSnapshot;
}

// ─────────────────────────────────────────────────────────────────
// CROSS-APPLICATION WORKFLOWS
// ─────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  stepId: string;
  appName: string;
  action: string;
  params?: Record<string, any>;
  condition?: {
    type: 'success' | 'failure' | 'custom';
    expression?: string;
  };
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
    backoff: boolean;
  };
  timeout?: number;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
}

export interface ApplicationWorkflow {
  workflowId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  startStepId: string;
  enabled: boolean;
  trigger?: {
    type: 'manual' | 'scheduled' | 'event';
    cron?: string;
    event?: string;
  };
  createdAt: Date;
  modifiedAt: Date;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepId?: string;
  completedSteps: number;
  totalSteps: number;
  results: Array<{
    stepId: string;
    stepName: string;
    status: 'success' | 'failure' | 'skipped';
    result?: any;
    error?: string;
  }>;
}

export interface WorkflowTemplate {
  templateId: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  variables?: Array<{ name: string; description: string; defaultValue?: any }>;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────
// APPLICATION MONITORING & OPTIMIZATION
// ─────────────────────────────────────────────────────────────────

export interface ApplicationMetrics {
  appName: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskIO?: { read: number; write: number };
  networkIO?: { bytesIn: number; bytesOut: number };
  responseTime?: number;
  errorRate?: number;
}

export interface ApplicationAlert {
  alertId: string;
  appName: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  metrics?: ApplicationMetrics;
}

export interface PerformanceOptimization {
  optimizationId: string;
  appName: string;
  type: string;
  description: string;
  estimatedImprovement: string;
  implementation: string;
  implemented: boolean;
}

// ─────────────────────────────────────────────────────────────────
// APPLICATION RECORDING & PLAYBACK
// ─────────────────────────────────────────────────────────────────

export interface ActionRecord {
  actionId: string;
  appName: string;
  actionType: string;
  actionData: any;
  screenshot?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface ApplicationRecording {
  recordingId: string;
  appName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  actions: ActionRecord[];
  name?: string;
  description?: string;
}

export interface ApplicationPlayback {
  playbackId: string;
  recordingId: string;
  currentActionIndex: number;
  isPlaying: boolean;
  speed: number;
  results: any[];
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED APPLICATION INTEGRATION SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IApplicationIntegrationService {
  // Browser Automation
  openBrowser(browserType: BrowserType): Promise<BrowserSession>;
  closeBrowser(sessionId: string): Promise<void>;
  navigateToUrl(sessionId: string, url: string): Promise<BrowserAutomationResult>;
  executeBrowserCommand(sessionId: string, command: BrowserCommand): Promise<BrowserAutomationResult>;
  getPageElements(sessionId: string, selector?: string): Promise<PageElement[]>;

  // Office Suite Automation
  openOfficeDocument(path: string): Promise<LibreOfficeDocument>;
  closeOfficeDocument(docId: string): Promise<void>;
  executeOfficeCommand(docId: string, command: OfficeCommand): Promise<OfficeAutomationResult>;
  getSpreadsheetRange(docId: string, range: string): Promise<SpreadsheetRange>;
  getPresentationSlides(docId: string): Promise<PresentationSlide[]>;

  // IDE & Terminal Automation
  openIDEProject(path: string, ideType: IDEType): Promise<CodeEditor>;
  executeIDECommand(editorId: string, command: IDECommand): Promise<IDEAutomationResult>;
  executeTerminalCommand(command: TerminalCommand): Promise<TerminalResult>;
  searchInCode(editorId: string, query: string): Promise<CodeFile[]>;

  // Communication Tools
  sendEmail(message: EmailMessage): Promise<CommsAutomationResult>;
  readEmails(folder: string, limit?: number): Promise<EmailMessage[]>;
  sendChatMessage(channelId: string, text: string): Promise<CommsAutomationResult>;
  getChannelMessages(channelId: string, limit?: number): Promise<ChatMessage[]>;

  // State Management
  captureApplicationState(appName: string): Promise<ApplicationSnapshot>;
  restoreApplicationState(snapshotId: string): Promise<void>;
  getApplicationState(appName: string): Promise<ApplicationState>;

  // Workflow Management
  createWorkflow(workflow: ApplicationWorkflow): Promise<void>;
  executeWorkflow(workflowId: string): Promise<WorkflowExecution>;
  getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]>;
  getWorkflowHistory(workflowId: string, limit?: number): Promise<WorkflowExecution[]>;

  // Monitoring & Optimization
  getApplicationMetrics(appName: string): Promise<ApplicationMetrics>;
  getApplicationAlerts(appName?: string): Promise<ApplicationAlert[]>;
  getOptimizationSuggestions(appName: string): Promise<PerformanceOptimization[]>;

  // Recording & Playback
  startRecording(appName: string): Promise<ApplicationRecording>;
  stopRecording(recordingId: string): Promise<ApplicationRecording>;
  playRecording(recordingId: string): Promise<ApplicationPlayback>;
  listRecordings(appName?: string): Promise<ApplicationRecording[]>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface ApplicationIntegrationResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
