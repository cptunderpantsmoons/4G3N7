/**
 * Claude Code Integration Controller for Goose Bridge
 * 
 * This controller provides REST API endpoints for managing Claude Code Skills
 * and agent execution within the Goose system.
 */

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ClaudeSkillMetadata,
  ClaudeAgentTask,
  ClaudeTaskResult,
  ClaudeAgentModel,
  ClaudeSkillEvent,
} from './skills.interface';
import { ClaudeSkillsRegistryService } from './skills-registry.service';
import { ClaudeAgentExecutorService } from './agent-executor.service';
import { ClaudeModelService } from './model.service';

@Controller('api/v1/claude-code')
export class ClaudeCodeController {
  constructor(
    private readonly skillsRegistry: ClaudeSkillsRegistryService,
    private readonly agentExecutor: ClaudeAgentExecutorService,
    private readonly modelService: ClaudeModelService,
  ) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    const isModelHealthy = await this.modelService.healthCheck();
    
    return {
      status: isModelHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        modelService: isModelHealthy,
      },
    };
  }

  /**
   * Skills Management Endpoints
   */

  /**
   * List all available skills
   */
  @Get('skills')
  async listSkills(
    @Query('type') type?: string,
    @Query('capability') capability?: string,
  ): Promise<ClaudeSkillMetadata[]> {
    return this.skillsRegistry.listSkills({ 
      type: type as any, 
      capability 
    });
  }

  /**
   * Get a specific skill by ID
   */
  @Get('skills/:skillId')
  async getSkill(@Param('skillId') skillId: string): Promise<ClaudeSkillMetadata | null> {
    const skill = await this.skillsRegistry.getSkill(skillId);
    
    if (!skill) {
      throw new NotFoundException(`Skill not found: ${skillId}`);
    }
    
    return skill;
  }

  /**
   * Get skill manifest
   */
  @Get('skills/:skillId/manifest')
  async getSkillManifest(@Param('skillId') skillId: string): Promise<any> {
    const manifest = await this.skillsRegistry.getSkillManifest(skillId);
    
    if (!manifest) {
      throw new NotFoundException(`Skill manifest not found: ${skillId}`);
    }
    
    return manifest;
  }

  /**
   * Get skill content blocks
   */
  @Get('skills/:skillId/content')
  async getSkillContent(@Param('skillId') skillId: string): Promise<any[]> {
    const content = await this.skillsRegistry.getSkillContentBlocks(skillId);
    return content;
  }

  /**
   * Register a new skill
   */
  @Post('skills')
  async registerSkill(@Body() skill: ClaudeSkillMetadata): Promise<void> {
    try {
      await this.skillsRegistry.registerSkill(skill);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Update an existing skill
   */
  @Put('skills/:skillId')
  async updateSkill(
    @Param('skillId') skillId: string,
    @Body() updates: Partial<ClaudeSkillMetadata>,
  ): Promise<void> {
    try {
      await this.skillsRegistry.updateSkill(skillId, updates);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Unregister a skill
   */
  @Delete('skills/:skillId')
  async unregisterSkill(@Param('skillId') skillId: string): Promise<void> {
    try {
      await this.skillsRegistry.unregisterSkill(skillId);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Refresh skills from file system
   */
  @Post('skills/refresh')
  async refreshSkills(): Promise<void> {
    try {
      await this.skillsRegistry.refreshSkills();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Agent Execution Endpoints
   */

  /**
   * Execute a Claude Code agent task
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async executeTask(@Body() task: ClaudeAgentTask): Promise<ClaudeTaskResult> {
    try {
      return await this.agentExecutor.executeTask(task);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * Get task status
   */
  @Get('tasks/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string): Promise<ClaudeAgentTask | null> {
    return this.agentExecutor.getTaskStatus(taskId);
  }

  /**
   * Cancel a running task
   */
  @Post('tasks/:taskId/cancel')
  async cancelTask(@Param('taskId') taskId: string): Promise<boolean> {
    return this.agentExecutor.cancelTask(taskId);
  }

  /**
   * List active tasks
   */
  @Get('tasks/active')
  async listActiveTasks(): Promise<ClaudeAgentTask[]> {
    return this.agentExecutor.listActiveTasks();
  }

  /**
   * Model Management Endpoints
   */

  /**
   * List available models
   */
  @Get('models')
  async listModels(): Promise<ClaudeAgentModel[]> {
    return this.modelService.listAvailableModels();
  }

  /**
   * Get model details
   */
  @Get('models/:modelName')
  async getModel(@Param('modelName') modelName: string): Promise<ClaudeAgentModel> {
    try {
      return await this.modelService.getModel(modelName);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Get model capabilities
   */
  @Get('models/:modelName/capabilities')
  async getModelCapabilities(@Param('modelName') modelName: string): Promise<string[]> {
    try {
      return this.modelService.getModelCapabilities(modelName);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  /**
   * Test model connection
   */
  @Get('models/:modelName/test')
  async testModel(@Param('modelName') modelName: string): Promise<{ healthy: boolean }> {
    try {
      const model = await this.modelService.getModel(modelName);
      return { healthy: true };
    } catch (error) {
      return { healthy: false };
    }
  }

  /**
   * Utility Endpoints
   */

  /**
   * Get integration status
   */
  @Get('status')
  async getStatus() {
    const skills = await this.skillsRegistry.listSkills();
    const activeTasks = await this.agentExecutor.listActiveTasks();
    const models = await this.modelService.listAvailableModels();
    const modelHealthy = await this.modelService.healthCheck();

    return {
      skills: {
        total: skills.length,
        byType: {
          personal: skills.filter(s => s.type === 'personal').length,
          project: skills.filter(s => s.type === 'project').length,
          plugin: skills.filter(s => s.type === 'plugin').length,
        },
      },
      tasks: {
        active: activeTasks.length,
        byStatus: {
          pending: activeTasks.filter(t => t.status === 'PENDING').length,
          running: activeTasks.filter(t => t.status === 'RUNNING').length,
          completed: activeTasks.filter(t => t.status === 'COMPLETED').length,
          failed: activeTasks.filter(t => t.status === 'FAILED').length,
          cancelled: activeTasks.filter(t => t.status === 'CANCELLED').length,
        },
      },
      models: {
        available: models.length,
        healthy: modelHealthy,
        list: models.map(m => ({ name: m.name, provider: m.provider })),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
