import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import {
  WorkflowDefinition,
  WorkflowExecutionResult,
} from '../interfaces/workflow.interface';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowExecutionRequest {
  workflowDefinition: WorkflowDefinition;
  inputs: Record<string, any>;
  userId?: string;
}

export interface WorkflowExecutionResponse {
  executionId: string;
  workflowId: string;
  status: string;
  result: any;
}

/**
 * Workflow Extension
 * Provides workflow orchestration and execution capabilities
 */
@Injectable()
export class WorkflowExtension extends BaseExtension {
  private readonly logger = new Logger(WorkflowExtension.name);
  private workflowEngine: WorkflowEngineService;
  private executions: Map<string, WorkflowExecutionResult> = new Map();

  constructor() {
    super();
    this.workflowEngine = new WorkflowEngineService();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'workflow-engine',
      name: 'Workflow Engine',
      version: '1.0.0',
      description: 'Workflow orchestration and execution with conditional logic and parallel steps',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/workflow.extension.ts',
      permissions: ['workflow:read', 'workflow:write', 'workflow:execute'],
      capabilities: [
        {
          id: 'execute-workflow',
          name: 'Execute Workflow',
          description: 'Execute a workflow definition',
          operations: ['execute_workflow'],
          requiredPermissions: ['workflow:execute'],
        },
        {
          id: 'get-execution-status',
          name: 'Get Execution Status',
          description: 'Get status of a workflow execution',
          operations: ['get_execution_status'],
          requiredPermissions: ['workflow:read'],
        },
        {
          id: 'cancel-execution',
          name: 'Cancel Execution',
          description: 'Cancel a running workflow execution',
          operations: ['cancel_execution'],
          requiredPermissions: ['workflow:write'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.debug(`Workflow Engine executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'execute_workflow':
          result = await this.executeWorkflow(
            payload.workflowDefinition,
            payload.inputs,
            payload.userId
          );
          break;

        case 'get_execution_status':
          result = await this.getExecutionStatus(payload.executionId);
          break;

        case 'cancel_execution':
          result = await this.cancelExecution(payload.executionId);
          break;

        default:
          throw new Error(`Unknown task type: ${type}`);
      }

      const duration = Date.now() - startTime;

      return {
        taskId: task.taskId,
        result,
        metadata: {
          duration,
          extensionVersion: this.getManifest().version,
          completedAt: new Date(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      this.context.logger.error(`Workflow Engine task failed: ${type}`, errorObj, {
        taskId: task.taskId,
      });

      return {
        taskId: task.taskId,
        result: {},
        metadata: {
          duration,
          extensionVersion: this.getManifest().version,
          completedAt: new Date(),
        },
        error: {
          code: 'WORKFLOW_EXECUTION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowDefinition: WorkflowDefinition,
    inputs: Record<string, any>,
    userId?: string
  ): Promise<WorkflowExecutionResponse> {
    try {
      this.context.logger.debug(`Executing workflow: ${workflowDefinition.id}`, {
        workflowVersion: workflowDefinition.version,
      });

      const result = await this.workflowEngine.executeWorkflow(
        workflowDefinition,
        inputs,
        userId
      );

      // Store execution result
      this.executions.set(result.executionId, result);

      const response: WorkflowExecutionResponse = {
        executionId: result.executionId,
        workflowId: result.workflowId,
        status: result.status,
        result: result.finalOutput,
      };

      this.context.logger.debug(`Workflow execution completed: ${result.executionId}`, {
        status: result.status,
        duration: result.duration,
      });

      return response;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error executing workflow', errorObj);
      throw error;
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(
    executionId: string
  ): Promise<{ executionId: string; status: string; result?: any }> {
    try {
      const execution = this.executions.get(executionId);

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      return {
        executionId,
        status: execution.status,
        result: execution.finalOutput,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error(`Error getting execution status: ${executionId}`, errorObj);
      throw error;
    }
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<{ executionId: string; cancelled: boolean }> {
    try {
      const execution = this.executions.get(executionId);

      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      await this.workflowEngine.cancelExecution(executionId);

      return {
        executionId,
        cancelled: true,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error(`Error cancelling execution: ${executionId}`, errorObj);
      throw error;
    }
  }

  /**
   * List active executions
   */
  listExecutions(): string[] {
    return Array.from(this.executions.keys());
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.executions.clear();
    this.context.logger.debug('Execution history cleared');
  }

  async onUnload(): Promise<void> {
    try {
      this.executions.clear();
      this.context.logger.debug('Workflow Extension unloaded');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error unloading Workflow Extension', errorObj);
    }
  }
}
