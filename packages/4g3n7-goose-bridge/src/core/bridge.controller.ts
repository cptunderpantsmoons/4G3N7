/**
 * Goose Bridge Controller
 * REST API endpoints for Goose integration
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GooseBridgeService } from './bridge.service';
import {
  GooseTask,
  GooseTaskPriority,
  GooseTaskStatus,
} from '../interfaces/types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import {
  ExtensionNotFoundException,
  TaskNotFoundException,
  TaskExecutionException,
  InvalidTaskStateException,
} from '../common/exceptions/custom.exceptions';

// DTOs for API requests/responses
export class SubmitTaskDto {
  type: string;
  extensionId: string;
  payload: Record<string, any>;
  priority?: GooseTaskPriority;
  timeout?: number;
  userId?: string;
}

export class TaskResultDto {
  taskId: string;
  status: GooseTaskStatus;
  result?: Record<string, any>;
  error?: any;
  metadata?: any;
}

@ApiTags('goose')
@Controller('api/v1/goose')
export class GooseBridgeController {
  constructor(private readonly bridgeService: GooseBridgeService) {}

  /**
   * List all available extensions
   */
  @Get('extensions')
  @ApiOperation({ summary: 'List all available Goose extensions' })
  @ApiResponse({ status: 200, description: 'List of extensions' })
  async listExtensions() {
    return this.bridgeService.listExtensions();
  }

  /**
   * Get extension details
   */
  @Get('extensions/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.extensions.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get extension details' })
  @ApiResponse({ status: 200, description: 'Extension details' })
  @ApiResponse({ status: 404, description: 'Extension not found' })
  async getExtension(@Param('id') id: string) {
    const extension = await this.bridgeService.getExtension(id);
    
    if (!extension) {
      throw new ExtensionNotFoundException(id);
    }
    
    return extension;
  }

  /**
   * Get extension capabilities
   */
  @Get('extensions/:id/capabilities')
  @ApiOperation({ summary: 'Get extension capabilities' })
  @ApiResponse({ status: 200, description: 'Extension capabilities' })
  async getExtensionCapabilities(@Param('id') id: string) {
    return this.bridgeService.getExtensionCapabilities(id);
  }

  /**
   * Submit a task to Goose
   */
  @Post('tasks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.tasks.create')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a task to Goose' })
  @ApiResponse({ status: 202, description: 'Task accepted' })
  @ApiResponse({ status: 400, description: 'Invalid task data' })
  async submitTask(@Body() taskDto: SubmitTaskDto) {
    try {
      const task = await this.bridgeService.submitTask(taskDto);
      return {
        taskId: task.taskId,
        status: task.status,
        message: 'Task submitted successfully',
      };
    } catch (error) {
      if (error instanceof TaskExecutionException || error instanceof InvalidTaskStateException) {
        throw error;
      }
      throw new TaskExecutionException('unknown', (error as Error).message);
    }
  }

  /**
   * Get task status
   */
  @Get('tasks/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.tasks.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get task status' })
  @ApiResponse({ status: 200, description: 'Task status' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskStatus(@Param('id') id: string) {
    const task = await this.bridgeService.getTask(id);
    
    if (!task) {
      throw new TaskNotFoundException(id);
    }
    
    return {
      taskId: task.taskId,
      status: task.status,
      type: task.type,
      extensionId: task.extensionId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  /**
   * Get task results
   */
  @Get('tasks/:id/results')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.tasks.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get task results' })
  @ApiResponse({ status: 200, description: 'Task results' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskResults(@Param('id') id: string): Promise<TaskResultDto> {
    const result = await this.bridgeService.getTaskResult(id);
    
    if (!result) {
      throw new TaskNotFoundException(id);
    }
    
    return {
      taskId: result.taskId,
      status: GooseTaskStatus.COMPLETED,
      result: result.result,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * List all tasks
   */
  @Get('tasks')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.tasks.read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async listTasks(
    @Query('status') status?: GooseTaskStatus,
    @Query('extensionId') extensionId?: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.bridgeService.listTasks({
      status,
      extensionId,
      limit,
      offset,
    });
  }

  /**
   * Cancel a task
   */
  @Post('tasks/:id/cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.tasks.cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a task' })
  @ApiResponse({ status: 200, description: 'Task cancelled' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async cancelTask(@Param('id') id: string) {
    const success = await this.bridgeService.cancelTask(id);
    
    if (!success) {
      throw new TaskNotFoundException(id);
    }
    
    return { message: 'Task cancelled successfully' };
  }

  /**
   * Get system health
   */
  @Get('health')
  @ApiOperation({ summary: 'Get Goose bridge health status' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async getHealth() {
    return this.bridgeService.getHealth();
  }

  /**
   * Get system metrics
   */
  @Get('metrics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('goose.system.metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Goose bridge metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getMetrics() {
    return this.bridgeService.getMetrics();
  }
}
