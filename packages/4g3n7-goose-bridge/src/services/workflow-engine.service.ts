import { Injectable, Logger } from '@nestjs/common';
import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  StepExecutionResult,
  ExecutionError,
  ExecutionLog,
} from '../interfaces/workflow.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow Engine Service
 * Executes workflow definitions with support for conditional logic, parallel steps, and loops
 */
@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private executions: Map<string, WorkflowExecutionContext> = new Map();

  /**
   * Execute a workflow definition
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    inputs: Record<string, any>,
    userId?: string
  ): Promise<WorkflowExecutionResult> {
    const executionId = uuidv4();
    const startTime = new Date();

    this.logger.debug(`Starting workflow execution: ${executionId}`, {
      workflowId: workflow.id,
      workflowVersion: workflow.version,
    });

    const context: WorkflowExecutionContext = {
      executionId,
      workflowId: workflow.id,
      workflowVersion: workflow.version,
      startTime,
      status: 'running',
      variables: new Map(Object.entries(inputs || {})),
      stepResults: new Map(),
      errors: [],
      logs: [],
      userId,
    };

    this.executions.set(executionId, context);

    try {
      // Find and execute first step
      const firstStep = workflow.steps.find((s) => !s.nextStepId || s.nextStepId === undefined);
      if (!firstStep) {
        throw new Error('No valid workflow entry point found');
      }

      let currentStepId: string | undefined = firstStep.id;

      // Execute steps in sequence
      while (currentStepId) {
        const step = workflow.steps.find((s) => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step not found: ${currentStepId}`);
        }

        try {
          const result = await this.executeStep(step, context, workflow);
          context.stepResults.set(step.id, result);

          if (!result.status) {
            throw new Error('Step did not return status');
          }

          if (result.status === 'failed' && workflow.errorHandling.strategy === 'stop') {
            context.errors.push({
              stepId: step.id,
              code: 'STEP_FAILED',
              message: `Step ${step.name} failed`,
              timestamp: new Date(),
              recoverable: false,
            });
            context.status = 'failed';
            break;
          }

          // Determine next step
          if (result.status === 'failed' && step.errorStepId) {
            currentStepId = step.errorStepId;
          } else {
            currentStepId = step.nextStepId;
          }
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));

          context.errors.push({
            stepId: step.id,
            code: 'STEP_ERROR',
            message: errorObj.message,
            timestamp: new Date(),
            stack: errorObj.stack,
            recoverable: workflow.errorHandling.strategy !== 'stop',
          });

          if (workflow.errorHandling.strategy === 'stop') {
            context.status = 'failed';
            break;
          }

          // Try error handling step
          if (step.errorStepId) {
            currentStepId = step.errorStepId;
          } else {
            break;
          }
        }
      }

      const endTime = new Date();
      context.status = context.errors.length === 0 ? 'completed' : 'failed';
      context.endTime = endTime;

      const result: WorkflowExecutionResult = {
        executionId,
        workflowId: workflow.id,
        status: context.status as 'completed' | 'failed' | 'cancelled',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        stepResults: Array.from(context.stepResults.values()),
        finalOutput: this.getFinalOutput(context),
        errors: context.errors,
        logs: context.logs,
      };

      this.logger.debug(`Workflow execution completed: ${executionId}`, {
        status: result.status,
        duration: result.duration,
        errorCount: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const endTime = new Date();

      context.errors.push({
        code: 'WORKFLOW_ERROR',
        message: errorObj.message,
        timestamp: new Date(),
        stack: errorObj.stack,
        recoverable: false,
      });

      context.status = 'failed';
      context.endTime = endTime;

      const result: WorkflowExecutionResult = {
        executionId,
        workflowId: workflow.id,
        status: 'failed',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        stepResults: Array.from(context.stepResults.values()),
        finalOutput: undefined,
        errors: context.errors,
        logs: context.logs,
      };

      this.logger.error(`Workflow execution failed: ${executionId}`, errorObj);
      return result;
    } finally {
      // Keep execution record for a limited time
      setTimeout(() => {
        this.executions.delete(executionId);
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<StepExecutionResult> {
    const startTime = new Date();
    let retries = 0;
    const maxRetries = step.retryPolicy?.maxAttempts || 1;
    let lastError: Error | null = null;

    const result: StepExecutionResult = {
      stepId: step.id,
      stepName: step.name,
      status: 'running',
      startTime,
      retries: 0,
    };

    // Execute with retry logic
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.addLog(context, 'info', `Executing step: ${step.name}`, { stepId: step.id });

        let stepOutput: any;

        switch (step.type) {
          case 'extension':
            stepOutput = await this.executeExtensionStep(step, context);
            break;

          case 'conditional':
            stepOutput = await this.executeConditionalStep(
              step,
              context,
              workflow
            );
            break;

          case 'parallel':
            stepOutput = await this.executeParallelStep(step, context, workflow);
            break;

          case 'loop':
            stepOutput = await this.executeLoopStep(step, context, workflow);
            break;

          case 'delay':
            stepOutput = await this.executeDelayStep(step);
            break;

          case 'script':
            stepOutput = await this.executeScriptStep(step, context);
            break;

          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        const endTime = new Date();
        result.status = 'completed';
        result.output = stepOutput;
        result.endTime = endTime;
        result.duration = endTime.getTime() - startTime.getTime();

        this.addLog(context, 'info', `Step completed: ${step.name}`, {
          stepId: step.id,
          duration: result.duration,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries = attempt + 1;

        const isRetryable =
          !step.retryPolicy?.retryableErrors ||
          step.retryPolicy.retryableErrors.includes(lastError.message);

        if (attempt < maxRetries - 1 && isRetryable) {
          const delay = step.retryPolicy?.delayMs || 1000;
          const backoff = step.retryPolicy?.backoffMultiplier || 1;
          const waitTime = delay * Math.pow(backoff, attempt);

          this.addLog(context, 'warn', `Step failed, retrying in ${waitTime}ms`, {
            stepId: step.id,
            attempt,
            error: lastError.message,
          });

          await this.delay(waitTime);
        } else {
          break;
        }
      }
    }

    const endTime = new Date();
    result.status = 'failed';
    result.retries = retries;
    result.endTime = endTime;
    result.duration = endTime.getTime() - startTime.getTime();

    if (lastError) {
      result.error = {
        stepId: step.id,
        code: 'STEP_EXECUTION_FAILED',
        message: lastError.message,
        timestamp: new Date(),
        stack: lastError.stack,
        recoverable: true,
      };
    }

    this.addLog(context, 'error', `Step failed: ${step.name}`, {
      stepId: step.id,
      retries,
      error: lastError?.message,
    });

    return result;
  }

  /**
   * Execute extension step
   */
  private async executeExtensionStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<any> {
    // In real implementation, would call extension service
    // For now, return mock data
    return {
      extensionId: step.config.extensionId,
      taskId: uuidv4(),
      result: step.config.defaultOutput || {},
    };
  }

  /**
   * Execute conditional step
   */
  private async executeConditionalStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const branches = step.config.branches || {};

    for (const condition of step.config.conditions || []) {
      const value = context.variables.get(condition.field);
      if (this.evaluateCondition(value, condition)) {
        return { branch: 'matched', condition };
      }
    }

    return { branch: 'default' };
  }

  /**
   * Execute parallel step
   */
  private async executeParallelStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const stepIds = step.config.steps || [];
    const joinType = step.config.joinType || 'all';

    const results = await Promise.allSettled(
      stepIds.map((stepId: string) => {
        const s = workflow.steps.find((ws) => ws.id === stepId);
        if (!s) throw new Error(`Step not found: ${stepId}`);
        return this.executeStep(s, context, workflow);
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (joinType === 'all' && failed > 0) {
      throw new Error(`Parallel execution failed: ${failed} steps failed`);
    }

    return { parallelResults: results, successful, failed };
  }

  /**
   * Execute loop step
   */
  private async executeLoopStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const items = context.variables.get(step.config.items) || [];
    const itemVariable = step.config.itemVariable;
    const bodyStepId = step.config.body;
    const maxIterations = step.config.maxIterations || 1000;

    const results = [];
    let iterations = 0;

    for (const item of items) {
      if (iterations >= maxIterations) {
        throw new Error(`Max iterations (${maxIterations}) exceeded`);
      }

      context.variables.set(itemVariable, item);

      const bodyStep = workflow.steps.find((s) => s.id === bodyStepId);
      if (!bodyStep) {
        throw new Error(`Loop body step not found: ${bodyStepId}`);
      }

      const result = await this.executeStep(bodyStep, context, workflow);
      results.push(result);
      iterations++;
    }

    return { loopResults: results, iterations };
  }

  /**
   * Execute delay step
   */
  private async executeDelayStep(step: WorkflowStep): Promise<any> {
    const delayMs = step.config.delayMs || 1000;
    await this.delay(delayMs);
    return { delayMs };
  }

  /**
   * Execute script step
   */
  private async executeScriptStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<any> {
    // In real implementation, would safely evaluate script
    // For now, return mock data
    return { scriptOutput: step.config.output || {} };
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: any, condition: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'greaterThan':
        return value > condition.value;
      case 'lessThan':
        return value < condition.value;
      case 'in':
        return (condition.value as any[]).includes(value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'isEmpty':
        return !value;
      case 'isNotEmpty':
        return !!value;
      default:
        return false;
    }
  }

  /**
   * Get final output from last step
   */
  private getFinalOutput(context: WorkflowExecutionContext): any {
    const results = Array.from(context.stepResults.values());
    if (results.length === 0) {
      return undefined;
    }

    const lastResult = results[results.length - 1];
    return lastResult.output;
  }

  /**
   * Add log entry
   */
  private addLog(
    context: WorkflowExecutionContext,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context_data?: Record<string, any>
  ): void {
    context.logs.push({
      timestamp: new Date(),
      level,
      message,
      context: context_data,
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (context) {
      context.status = 'cancelled';
      this.logger.log(`Execution cancelled: ${executionId}`);
    }
  }
}
