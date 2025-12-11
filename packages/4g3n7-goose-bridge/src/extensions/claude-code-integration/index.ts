/**
 * Claude Code Integration for Goose Bridge - Main Export
 * 
 * This module exports all components of the Claude Code integration,
 * including services, interfaces, examples, and the main module.
 */

// Core interfaces and types
export * from './skills.interface';

// Services
export { ClaudeSkillsRegistryService } from './skills-registry.service';
export { ClaudeAgentExecutorService } from './agent-executor.service';
export { ClaudeModelService } from './model.service';

// Controller
export { ClaudeCodeController } from './claude-code-integration.controller';

// Module
export { ClaudeCodeIntegrationModule } from './claude-code-integration.module';

// Example skills (for reference and testing)
export const ExampleSkills = {
  webScraper: './examples/web-scraper.skill.md',
  fileProcessor: './examples/file-processor.skill.md',
  dataAnalyzer: './examples/data-analyzer.skill.md',
  codeReviewer: './examples/code-reviewer.skill.md',
  taskOrchestrator: './examples/task-orchestrator.skill.md',
};

/**
 * Factory function to create a complete Claude Code integration
 * 
 * @param config Integration configuration
 * @returns Configured integration instance
 */
export function createClaudeCodeIntegration(config?: any) {
  // This function would typically be used to create
  // a configured instance of the integration
  // Implementation would depend on specific requirements
  
  return {
    // Integration instance with configured services
    skillsRegistry: null, // Would be instantiated
    agentExecutor: null,  // Would be instantiated
    modelService: null,   // Would be instantiated
    config,
  };
}

/**
 * Utility functions for working with Claude Code Skills
 */
export const ClaudeCodeUtils = {
  /**
   * Validate a skill manifest
   */
  validateSkillManifest(manifest: any): boolean {
    const required = ['name', 'description', 'version', 'author', 'capabilities'];
    return required.every(field => manifest[field]);
  },

  /**
   * Generate a skill ID from name and type
   */
  generateSkillId(name: string, type: 'personal' | 'project' | 'plugin'): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${type}-${sanitized}-${Date.now()}`;
  },

  /**
   * Check if a model supports specific capabilities
   */
  modelSupports(model: any, capability: string): boolean {
    return model.capabilities && model.capabilities.includes(capability);
  },

  /**
   * Format Claude response for display
   */
  formatResponse(response: any): string {
    if (typeof response === 'string') {
      return response;
    }
    
    if (response.messages) {
      return response.messages.map((msg: any) => msg.content).join('\n\n');
    }
    
    return JSON.stringify(response, null, 2);
  },
};

/**
 * Predefined tool sets for common use cases
 */
export const ToolSets = {
  /**
   * Basic computer use tools
   */
  basicComputerUse: [
    'computer_move_mouse',
    'computer_click_mouse',
    'computer_type_text',
    'computer_screenshot',
  ],

  /**
   * Advanced computer use tools
   */
  advancedComputerUse: [
    'computer_move_mouse',
    'computer_trace_mouse',
    'computer_click_mouse',
    'computer_press_mouse',
    'computer_drag_mouse',
    'computer_scroll',
    'computer_type_keys',
    'computer_press_keys',
    'computer_type_text',
    'computer_paste_text',
    'computer_wait',
    'computer_screenshot',
    'computer_cursor_position',
    'computer_application',
  ],

  /**
   * Task management tools
   */
  taskManagement: [
    'set_task_status',
    'create_task',
  ],

  /**
   * File system tools
   */
  fileSystem: [
    'computer_read_file',
  ],
};

/**
 * Common error types for Claude Code integration
 */
export class ClaudeCodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ClaudeCodeError';
  }
}

export class SkillNotFoundError extends ClaudeCodeError {
  constructor(skillId: string) {
    super(`Skill not found: ${skillId}`, 'SKILL_NOT_FOUND', { skillId });
  }
}

export class ModelNotFoundError extends ClaudeCodeError {
  constructor(modelName: string) {
    super(`Model not found: ${modelName}`, 'MODEL_NOT_FOUND', { modelName });
  }
}

export class TaskExecutionError extends ClaudeCodeError {
  constructor(taskId: string, details: any) {
    super(`Task execution failed: ${taskId}`, 'TASK_EXECUTION_ERROR', { taskId, details });
  }
}

/**
 * Configuration schema for Claude Code integration
 */
export const IntegrationConfigSchema = {
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
    models: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          provider: { type: 'string', enum: ['anthropic', 'openai', 'google'] },
          capabilities: { type: 'array', items: { type: 'string' } },
          maxTokens: { type: 'number' },
          temperature: { type: 'number' },
        },
        required: ['name', 'provider', 'capabilities'],
      },
    },
    skillsPath: {
      type: 'object',
      properties: {
        personal: { type: 'string' },
        project: { type: 'string' },
        plugin: { type: 'string' },
      },
      required: ['personal', 'project', 'plugin'],
    },
    defaultTimeout: { type: 'number' },
    maxConcurrentTasks: { type: 'number' },
    autoUpdateSkills: { type: 'boolean' },
    verboseLogging: { type: 'boolean' },
  },
  required: ['enabled', 'models', 'skillsPath'],
};

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const COMPATIBILITY = {
  gooseBridge: '>=1.0.0',
  node: '>=18.0.0',
  claudeCode: '>=1.0.0',
};
