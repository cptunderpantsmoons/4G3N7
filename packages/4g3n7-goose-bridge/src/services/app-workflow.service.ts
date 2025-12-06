/**
 * Phase 5.3 - Application Workflow Engine Service
 * Cross-application workflow orchestration and execution
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationWorkflow,
  WorkflowStep,
  WorkflowExecution,
  WorkflowTemplate,
} from '../interfaces/application-integration.interface';

@Injectable()
export class AppWorkflowService {
  private readonly logger = new Logger(AppWorkflowService.name);

  private workflows = new Map<string, ApplicationWorkflow>();
  private executions = new Map<string, WorkflowExecution>();
  private templates = new Map<string, WorkflowTemplate>();
  private executionHistory = new Map<string, WorkflowExecution[]>();

  constructor() {
    this.initializeTemplates();
    this.startCleanupScheduler();
  }

  async createWorkflow(workflow: ApplicationWorkflow): Promise<void> {
    this.logger.log(`Creating workflow: ${workflow.name}`);

    this.workflows.set(workflow.workflowId, workflow);
  }

  async executeWorkflow(workflowId: string): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      executionId,
      workflowId,
      workflowName: workflow.name,
      startTime: new Date(),
      status: 'running',
      completedSteps: 0,
      totalSteps: workflow.steps.length,
      results: [],
    };

    this.executions.set(executionId, execution);
    this.logger.log(`Starting workflow execution: ${executionId}`);

    // Execute steps sequentially
    let currentStepId: string | undefined = workflow.startStepId;
    let executionIndex = 0;

    while (currentStepId && executionIndex < workflow.steps.length) {
      const step = workflow.steps.find(s => s.stepId === currentStepId);
      if (!step) break;

      execution.currentStepId = currentStepId;

      try {
        this.logger.debug(`Executing step: ${step.stepId}`);
        const result = await this.executeStep(step);

        execution.results.push({
          stepId: step.stepId,
          stepName: step.action,
          status: 'success',
          result,
        });

        execution.completedSteps++;
        currentStepId = step.onSuccess;
      } catch (error) {
        this.logger.error(`Step failed: ${step.stepId}`, error);

        execution.results.push({
          stepId: step.stepId,
          stepName: step.action,
          status: 'failure',
          error: error.message,
        });

        currentStepId = step.onFailure;
      }

      executionIndex++;
    }

    execution.endTime = new Date();
    execution.status = execution.results.every(r => r.status !== 'failure') ? 'completed' : 'failed';

    // Store in history
    if (!this.executionHistory.has(workflowId)) {
      this.executionHistory.set(workflowId, []);
    }
    this.executionHistory.get(workflowId)!.push(execution);

    // Keep only last 50 executions
    const history = this.executionHistory.get(workflowId)!;
    if (history.length > 50) {
      history.shift();
    }

    this.logger.log(`Workflow execution completed: ${executionId} - ${execution.status}`);

    return execution;
  }

  async getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
    this.logger.debug(`Fetching workflow templates for category: ${category}`);

    let results: WorkflowTemplate[] = [];

    for (const template of this.templates.values()) {
      if (!category || template.category === category) {
        results.push(template);
      }
    }

    return results;
  }

  async getWorkflowHistory(workflowId: string, limit: number = 20): Promise<WorkflowExecution[]> {
    this.logger.debug(`Fetching workflow history for: ${workflowId}`);

    const history = this.executionHistory.get(workflowId) || [];
    return history.slice(-limit);
  }

  getWorkflow(workflowId: string): ApplicationWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  listWorkflows(): ApplicationWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  private async executeStep(step: WorkflowStep): Promise<any> {
    // TODO: Implement actual cross-application step execution
    // This would involve calling appropriate service based on appName

    return {
      stepId: step.stepId,
      executed: true,
      timestamp: new Date(),
    };
  }

  private initializeTemplates(): void {
    const commonTemplates: WorkflowTemplate[] = [
      {
        templateId: 'tpl_1',
        name: 'Email Report',
        description: 'Generate and email report',
        category: 'communication',
        steps: [],
        tags: ['email', 'report', 'automation'],
      },
      {
        templateId: 'tpl_2',
        name: 'Browser Automation',
        description: 'Automate browser tasks',
        category: 'browser',
        steps: [],
        tags: ['browser', 'automation', 'web'],
      },
      {
        templateId: 'tpl_3',
        name: 'Document Processing',
        description: 'Process office documents',
        category: 'office',
        steps: [],
        tags: ['documents', 'office', 'processing'],
      },
    ];

    for (const template of commonTemplates) {
      this.templates.set(template.templateId, template);
    }
  }

  getStatistics(): {
    totalWorkflows: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    templates: number;
  } {
    let active = 0;
    let completed = 0;
    let failed = 0;

    for (const execution of this.executions.values()) {
      if (execution.status === 'running') active++;
      if (execution.status === 'completed') completed++;
      if (execution.status === 'failed') failed++;
    }

    return {
      totalWorkflows: this.workflows.size,
      activeExecutions: active,
      completedExecutions: completed,
      failedExecutions: failed,
      templates: this.templates.size,
    };
  }

  private startCleanupScheduler(): void {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
    setInterval(() => {
      const keysToDelete: string[] = [];

      for (const [execId, execution] of this.executions) {
        if (execution.endTime) {
          const ageMs = Date.now() - execution.endTime.getTime();
          if (ageMs > CLEANUP_INTERVAL) {
            keysToDelete.push(execId);
          }
        }
      }

      for (const key of keysToDelete) {
        this.executions.delete(key);
      }

      if (keysToDelete.length > 0) {
        this.logger.log(`Cleaned up ${keysToDelete.length} old workflow executions`);
      }
    }, CLEANUP_INTERVAL);
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down App Workflow Service');
    this.workflows.clear();
    this.executions.clear();
    this.templates.clear();
    this.executionHistory.clear();
  }
}
