/**
 * Claude Code Skills Integration Interface for Goose Bridge
 *
 * Defines the domain types used by the Claude Code integration. These are kept
 * self-contained to avoid depending on workspace-local packages that are not
 * present in this standalone package.
 */

export enum MessageContentType {
  Text = 'text',
  ToolUse = 'tool_use',
  Thinking = 'thinking',
}

export interface TextContentBlock {
  type: MessageContentType.Text;
  text: string;
}

export interface ToolUseContentBlock {
  type: MessageContentType.ToolUse;
  id: string;
  name: string;
  input: any;
}

export interface ThinkingContentBlock {
  type: MessageContentType.Thinking;
  thinking: string;
  signature?: string;
}

export type MessageContentBlock = TextContentBlock | ToolUseContentBlock | ThinkingContentBlock;

export interface ClaudeTaskError {
  code: string;
  message: string;
  stack?: string;
}

export interface ClaudeSkillMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  type: 'personal' | 'project' | 'plugin';
  path: string;
  source: 'local' | 'git' | 'plugin';
  installedAt: Date;
  updatedAt: Date;
  capabilities: ClaudeSkillCapability[];
}

export interface ClaudeSkillCapability {
  id: string;
  name: string;
  description: string;
  inputSchema: any;
  outputSchema?: any;
  permissions: string[];
}

export interface ClaudeSkillManifest {
  name: string;
  description: string;
  version: string;
  author: string;
  capabilities: ClaudeSkillCapability[];
  allowedTools?: string[];
  dependencies?: string[];
}

export interface ClaudeSkillContent {
  manifest: ClaudeSkillManifest;
  contentBlocks: MessageContentBlock[];
  supportingFiles: ClaudeSupportingFile[];
}

export interface ClaudeSupportingFile {
  name: string;
  path: string;
  type: 'script' | 'template' | 'config' | 'data';
  content?: string;
  hash?: string;
}

export interface ClaudeAgentTask {
  taskId: string;
  skillId: string;
  capabilityId: string;
  input: any;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timeout?: number;
  createdAt: Date;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress?: ClaudeTaskProgress;
  result?: ClaudeTaskResult;
  updatedAt?: Date;
}

export interface ClaudeTaskProgress {
  step: string;
  message: string;
  percentage: number;
  timestamp: Date;
}

export interface ClaudeTaskResult {
  success: boolean;
  output: any;
  error?: ClaudeTaskError;
  metadata: {
    duration: number;
    steps: string[];
    toolsUsed: string[];
    completionTime: Date;
  };
}

export interface ClaudeAgentModel {
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  capabilities: string[];
  maxTokens: number;
  temperature: number;
}

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  permissions?: string[];
  allowed?: boolean;
}

/**
 * Enum for Claude Code tool types
 */
export enum ClaudeToolType {
  COMPUTER_MOVE_MOUSE = 'computer_move_mouse',
  COMPUTER_TRACE_MOUSE = 'computer_trace_mouse',
  COMPUTER_CLICK_MOUSE = 'computer_click_mouse',
  COMPUTER_PRESS_MOUSE = 'computer_press_mouse',
  COMPUTER_DRAG_MOUSE = 'computer_drag_mouse',
  COMPUTER_SCROLL = 'computer_scroll',
  COMPUTER_TYPE_KEYS = 'computer_type_keys',
  COMPUTER_PRESS_KEYS = 'computer_press_keys',
  COMPUTER_TYPE_TEXT = 'computer_type_text',
  COMPUTER_PASTE_TEXT = 'computer_paste_text',
  COMPUTER_WAIT = 'computer_wait',
  COMPUTER_SCREENSHOT = 'computer_screenshot',
  COMPUTER_CURSOR_POSITION = 'computer_cursor_position',
  COMPUTER_APPLICATION = 'computer_application',
  SET_TASK_STATUS = 'set_task_status',
  CREATE_TASK = 'create_task',
  READ_FILE = 'computer_read_file',
}

/**
 * Interface for Claude Code Skills Registry
 */
export interface ClaudeSkillsRegistry {
  registerSkill(skill: ClaudeSkillMetadata): Promise<void>;
  unregisterSkill(skillId: string): Promise<void>;
  getSkill(skillId: string): Promise<ClaudeSkillMetadata | null>;
  listSkills(filter?: { type?: string; capability?: string }): Promise<ClaudeSkillMetadata[]>;
  updateSkill(skillId: string, updates: Partial<ClaudeSkillMetadata>): Promise<void>;
}

/**
 * Interface for Claude Code Agent Execution
 */
export interface ClaudeAgentExecutor {
  executeTask(task: ClaudeAgentTask): Promise<ClaudeTaskResult>;
  cancelTask(taskId: string): Promise<boolean>;
  getTaskStatus(taskId: string): Promise<ClaudeAgentTask | null>;
  listActiveTasks(): Promise<ClaudeAgentTask[]>;
}

/**
 * Interface for Claude Code Model Service
 */
export interface ClaudeModelService {
  getModel(modelName: string): Promise<ClaudeAgentModel>;
  listAvailableModels(): Promise<ClaudeAgentModel[]>;
  generateResponse(
    systemPrompt: string,
    messages: MessageContentBlock[],
    model: ClaudeAgentModel,
    tools?: ClaudeToolDefinition[]
  ): Promise<MessageContentBlock[]>;
}

/**
 * Event types for Claude Code integration
 */
export interface ClaudeSkillEvent {
  type: 'skill_registered' | 'skill_executed' | 'skill_failed' | 'skill_updated';
  skillId: string;
  timestamp: Date;
  data: any;
}

/**
 * Configuration for Claude Code integration
 */
export interface ClaudeCodeIntegrationConfig {
  enabled: boolean;
  models: ClaudeAgentModel[];
  skillsPath: {
    personal: string;
    project: string;
    plugin: string;
  };
  defaultTimeout: number;
  maxConcurrentTasks: number;
  autoUpdateSkills: boolean;
  verboseLogging: boolean;
}
