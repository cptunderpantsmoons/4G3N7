/**
 * Claude Code Agent Executor Service for Goose Bridge
 * 
 * This service handles the execution of Claude Code agent tasks, integrating
 * Claude's autonomous agent capabilities with Goose's task management system.
 * It manages task execution, tool usage, and communication with Claude Code.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { 
  ClaudeAgentTask, 
  ClaudeTaskResult, 
  ClaudeAgentExecutor,
  ClaudeAgentModel,
  ClaudeToolDefinition,
  ClaudeSkillMetadata,
  ClaudeSkillEvent,
  ClaudeModelService as ClaudeModelServiceContract,
  ClaudeSkillManifest,
  ClaudeSkillCapability,
  MessageContentBlock,
  MessageContentType,
  ToolUseContentBlock
} from './skills.interface';
import { ClaudeSkillsRegistryService } from './skills-registry.service';

@Injectable()
export class ClaudeAgentExecutorService implements ClaudeAgentExecutor {
  private readonly logger = new Logger(ClaudeAgentExecutorService.name);
  private activeTasks = new Map<string, ClaudeAgentTask>();
  private maxConcurrentTasks = 10;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly skillsRegistry: ClaudeSkillsRegistryService,
    private readonly modelService: ClaudeModelServiceContract,
  ) {}

  /**
   * Execute a Claude Code agent task
   */
  async executeTask(task: ClaudeAgentTask): Promise<ClaudeTaskResult> {
    const taskId = task.taskId || uuidv4();
    
    try {
      // Register the task
      this.activeTasks.set(taskId, {
        ...task,
        taskId,
        status: 'RUNNING',
        createdAt: new Date(),
      });

      this.logger.log(`Starting task ${taskId} for skill ${task.skillId}`);

      // Get skill metadata
      const skill = await this.skillsRegistry.getSkill(task.skillId);
      if (!skill) {
        throw new Error(`Skill not found: ${task.skillId}`);
      }

      // Get skill content
      const contentBlocks = await this.skillsRegistry.getSkillContentBlocks(task.skillId);
      const manifest = await this.skillsRegistry.getSkillManifest(task.skillId);

      if (!manifest) {
        throw new Error(`Skill manifest not found for skill: ${task.skillId}`);
      }

      // Prepare system prompt
      const systemPrompt = this.buildSystemPrompt(skill, manifest, contentBlocks);

      // Prepare initial messages
      const messages: MessageContentBlock[] = [
        {
          type: MessageContentType.Text,
          text: `Execute capability "${task.capabilityId}" with input: ${JSON.stringify(task.input)}`,
        },
      ];

      // Get model
      const model = await this.modelService.getModel(task.input.model || 'sonnet-4');

      // Get available tools
      const tools = this.getAvailableTools(manifest);

      // Execute with Claude
      const result = await this.executeWithClaude(systemPrompt, messages, model, tools, task);

      // Update task status
      const updatedTask: ClaudeAgentTask = {
        ...task,
        taskId,
        status: 'COMPLETED',
        result,
        updatedAt: new Date(),
      };

      this.activeTasks.set(taskId, updatedTask);

      // Emit completion event
      this.eventEmitter.emit('skill.executed', {
        type: 'skill_executed',
        skillId: task.skillId,
        timestamp: new Date(),
        data: { task: updatedTask, result },
      } as ClaudeSkillEvent);

      this.logger.log(`Task ${taskId} completed successfully`);
      
      return result;
    } catch (error) {
      const errorResult: ClaudeTaskResult = {
        success: false,
        output: null,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          stack: error.stack,
        },
        metadata: {
          duration: 0,
          steps: [],
          toolsUsed: [],
          completionTime: new Date(),
        },
      };

      // Update task with error
      const failedTask: ClaudeAgentTask = {
        ...task,
        taskId,
        status: 'FAILED',
        result: errorResult,
        updatedAt: new Date(),
      };

      this.activeTasks.set(taskId, failedTask);

      // Emit failure event
      this.eventEmitter.emit('skill.failed', {
        type: 'skill_failed',
        skillId: task.skillId,
        timestamp: new Date(),
        data: { task: failedTask, error },
      } as ClaudeSkillEvent);

      this.logger.error(`Task ${taskId} failed`, error);
      
      return errorResult;
    } finally {
      // Clean up active task after a delay
      setTimeout(() => {
        this.activeTasks.delete(taskId);
      }, 5000);
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.status !== 'RUNNING') {
      return false;
    }

    // Update task status
    task.status = 'CANCELLED';
    task.updatedAt = new Date();

    this.eventEmitter.emit('skill.cancelled', {
      type: 'skill_updated',
      skillId: task.skillId,
      timestamp: new Date(),
      data: { task },
    } as ClaudeSkillEvent);

    this.logger.log(`Task ${taskId} cancelled`);
    
    return true;
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<ClaudeAgentTask | null> {
    return this.activeTasks.get(taskId) || null;
  }

  /**
   * List all active tasks
   */
  async listActiveTasks(): Promise<ClaudeAgentTask[]> {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Private methods
   */

  private async executeWithClaude(
    systemPrompt: string,
    messages: MessageContentBlock[],
    model: ClaudeAgentModel,
    tools: ClaudeToolDefinition[],
    task: ClaudeAgentTask
  ): Promise<ClaudeTaskResult> {
    const startTime = Date.now();
    const steps: string[] = [];
    const toolsUsed: string[] = [];

    try {
      // Generate response from Claude
      const response = await this.modelService.generateResponse(
        systemPrompt,
        messages,
        model,
        tools
      );

      // Process response
      const result = this.processClaudeResponse(response, toolsUsed, steps);

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: result,
        metadata: {
          duration,
          steps,
          toolsUsed,
          completionTime: new Date(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      throw {
        success: false,
        output: null,
        error: {
          code: 'CLAUDE_ERROR',
          message: error.message,
          stack: error.stack,
        },
        metadata: {
          duration,
          steps,
          toolsUsed,
          completionTime: new Date(),
        },
      };
    }
  }

  private buildSystemPrompt(
    skill: ClaudeSkillMetadata,
    manifest: ClaudeSkillManifest,
    contentBlocks: any[]
  ): string {
    return `
You are an AI agent executing the skill "${skill.name}".

Skill Description: ${skill.description}
Author: ${skill.author}
Version: ${skill.version}

Available Capabilities:
${manifest.capabilities.map((cap: ClaudeSkillCapability) => 
  `- ${cap.id}: ${cap.description}`
).join('\n')}

Content Blocks:
${contentBlocks.map(block => 
  block.type === 'code' 
    ? `Code Block (${block.language}): ${block.content.substring(0, 200)}...`
    : `Section: ${block.title}`
).join('\n')}

Execute the requested capability autonomously using the available tools.
Return your response using the appropriate content blocks.
`;
  }

  private getAvailableTools(manifest: any): ClaudeToolDefinition[] {
    // Default Claude Code tools
    const defaultTools: ClaudeToolDefinition[] = [
      {
        name: 'computer_move_mouse',
        description: 'Moves the mouse cursor to specified coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            coordinates: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
              required: ['x', 'y'],
            },
          },
          required: ['coordinates'],
        },
      },
      {
        name: 'computer_click_mouse',
        description: 'Performs a mouse click at specified coordinates',
        inputSchema: {
          type: 'object',
          properties: {
            coordinates: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
              },
              required: ['x', 'y'],
            },
            button: { type: 'string', enum: ['left', 'right', 'middle'] },
          },
          required: ['coordinates', 'button'],
        },
      },
      {
        name: 'computer_type_text',
        description: 'Types text on the keyboard',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string' },
          },
          required: ['text'],
        },
      },
      {
        name: 'set_task_status',
        description: 'Sets the status of the current task',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['completed', 'needs_help'] },
            description: { type: 'string' },
          },
          required: ['status', 'description'],
        },
      },
    ];

    // Filter tools based on manifest allowed tools
    if (manifest?.allowedTools) {
      return defaultTools.filter(tool => manifest.allowedTools.includes(tool.name));
    }

    return defaultTools;
  }

  private processClaudeResponse(
    response: MessageContentBlock[],
    toolsUsed: string[],
    steps: string[]
  ): any {
    const result: any = {
      messages: [],
      toolUses: [],
    };

    for (const block of response) {
      switch (block.type) {
        case MessageContentType.Text:
          result.messages.push({
            type: 'text',
            content: block.text,
          });
          steps.push(`Text response: ${block.text.substring(0, 100)}...`);
          break;

        case MessageContentType.ToolUse:
          const toolUse = block as ToolUseContentBlock;
          result.toolUses.push({
            id: toolUse.id,
            name: toolUse.name,
            input: toolUse.input,
          });
          toolsUsed.push(toolUse.name);
          steps.push(`Tool used: ${toolUse.name}`);
          break;

        case MessageContentType.Thinking:
          result.messages.push({
            type: 'thinking',
            content: block.thinking,
          });
          steps.push('Thinking step completed');
          break;
      }
    }

    return result;
  }
}
