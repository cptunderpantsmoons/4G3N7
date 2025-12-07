import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { AppWorkflowService } from '../services/app-workflow.service';
import { ApplicationWorkflow, WorkflowTemplate } from '../interfaces/application-integration.interface';

/**
 * Application Workflow Extension
 * Provides cross-application workflow orchestration
 */
@Injectable()
export class AppWorkflowExtension extends BaseExtension {
  private readonly logger = new Logger(AppWorkflowExtension.name);

  constructor(private readonly workflowService: AppWorkflowService) {
    super();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'app-workflow',
      name: 'Application Workflow',
      version: '1.0.0',
      description: 'Cross-application workflow orchestration and automation',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/app-workflow.extension.ts',
      permissions: ['workflow:execute', 'workflow:manage', 'app:control'],
      capabilities: [
        {
          id: 'create-workflow',
          name: 'Create Workflow',
          description: 'Create a new application workflow',
          operations: ['create_workflow'],
          requiredPermissions: ['workflow:manage'],
        },
        {
          id: 'execute-workflow',
          name: 'Execute Workflow',
          description: 'Execute an application workflow',
          operations: ['execute_workflow'],
          requiredPermissions: ['workflow:execute', 'app:control'],
        },
        {
          id: 'manage-workflows',
          name: 'Manage Workflows',
          description: 'Manage workflow lifecycle',
          operations: ['get_workflow', 'update_workflow', 'delete_workflow', 'list_workflows'],
          requiredPermissions: ['workflow:manage'],
        },
        {
          id: 'monitor-execution',
          name: 'Monitor Execution',
          description: 'Monitor workflow execution status',
          operations: ['get_execution_status', 'cancel_execution', 'get_execution_history'],
          requiredPermissions: ['workflow:execute'],
        },
        {
          id: 'workflow-templates',
          name: 'Workflow Templates',
          description: 'Work with workflow templates',
          operations: ['create_template', 'get_templates', 'apply_template'],
          requiredPermissions: ['workflow:manage'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`Application Workflow executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'create_workflow':
          result = await this.workflowService.createWorkflow(payload.workflow as ApplicationWorkflow);
          break;
        case 'execute_workflow':
          result = await this.workflowService.executeWorkflow(payload.workflowId);
          break;
        case 'get_workflow':
          result = this.workflowService.getWorkflow(payload.workflowId);
          break;
        case 'update_workflow':
          // Update workflow by recreating it
          const existingWorkflow = this.workflowService.getWorkflow(payload.workflowId);
          if (existingWorkflow) {
            const updatedWorkflow = { ...existingWorkflow, ...payload.updates };
            await this.workflowService.createWorkflow(updatedWorkflow);
            result = updatedWorkflow;
          } else {
            throw new Error(`Workflow not found: ${payload.workflowId}`);
          }
          break;
        case 'delete_workflow':
          // Delete by removing from map (service doesn't have delete method)
          this.workflowService['workflows'].delete(payload.workflowId);
          result = { success: true };
          break;
        case 'list_workflows':
          result = this.workflowService.listWorkflows();
          break;
        case 'get_execution_status':
          result = this.workflowService.getExecution(payload.executionId);
          break;
        case 'cancel_execution':
          // Cancel by updating execution status (service doesn't have cancel method)
          const execution = this.workflowService.getExecution(payload.executionId);
          if (execution) {
            execution.status = 'cancelled';
            execution.endTime = new Date();
            result = execution;
          } else {
            throw new Error(`Execution not found: ${payload.executionId}`);
          }
          break;
        case 'get_execution_history':
          result = await this.workflowService.getWorkflowHistory(payload.workflowId);
          break;
        case 'create_template':
          // Add template to map (service doesn't have create method)
          this.workflowService['templates'].set(payload.template.templateId, payload.template as WorkflowTemplate);
          result = payload.template;
          break;
        case 'get_templates':
          result = await this.workflowService.getWorkflowTemplates();
          break;
        case 'apply_template':
          // Apply template by creating workflow from template
          const template = this.workflowService['templates'].get(payload.templateId);
          if (template) {
            const workflow: ApplicationWorkflow = {
              workflowId: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: template.name,
              description: template.description,
              steps: template.steps,
              startStepId: template.steps[0]?.stepId,
              enabled: true,
              createdAt: new Date(),
              modifiedAt: new Date(),
            };
            await this.workflowService.createWorkflow(workflow);
            result = workflow;
          } else {
            throw new Error(`Template not found: ${payload.templateId}`);
          }
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

      this.context.logger.error(`Application Workflow task failed: ${type}`, errorObj, {
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
          code: 'APP_WORKFLOW_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  async onUnload(): Promise<void> {
    // Cancel any running workflow executions
    const executions = Array.from(this.workflowService['executions'].values());
    for (const execution of executions) {
      if (execution.status === 'running') {
        try {
          execution.status = 'cancelled';
          execution.endTime = new Date();
        } catch (error) {
          this.logger.error(`Failed to cancel execution ${execution.executionId}`, error);
        }
      }
    }
  }
}
