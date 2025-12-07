/**
 * Phase 6.1 - Task Progress Service
 * Task progress tracking and visualization
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TaskProgress,
  StepExecution,
  TaskVisualization,
  TaskDiagnostics,
  TaskStatus,
} from '../interfaces/ui-task-management.interface';

@Injectable()
export class TaskProgressService {
  private readonly logger = new Logger(TaskProgressService.name);

  private progress = new Map<string, TaskProgress>();
  private executions = new Map<string, StepExecution[]>();
  private visualizations = new Map<string, TaskVisualization>();
  private diagnostics = new Map<string, TaskDiagnostics>();

  async getTaskProgress(taskId: string): Promise<TaskProgress> {
    this.logger.debug(`Getting progress for task: ${taskId}`);

    let progress = this.progress.get(taskId);
    if (!progress) {
      progress = {
        taskId,
        currentStep: 0,
        totalSteps: 0,
        percentComplete: 0,
        status: TaskStatus.PENDING,
        startTime: new Date(),
        elapsedTime: 0,
      };
      this.progress.set(taskId, progress);
    }

    return progress;
  }

  async getStepExecutions(taskId: string): Promise<StepExecution[]> {
    this.logger.debug(`Getting step executions for task: ${taskId}`);

    return this.executions.get(taskId) || [];
  }

  async getTaskVisualization(taskId: string, type: string = 'timeline'): Promise<TaskVisualization> {
    this.logger.debug(`Generating ${type} visualization for task: ${taskId}`);

    let viz = this.visualizations.get(taskId);
    if (!viz) {
      viz = {
        visualizationId: `viz_${Date.now()}`,
        taskId,
        type: type as any,
        data: {
          steps: [],
        },
        generated: new Date(),
      };
      this.visualizations.set(taskId, viz);
    }

    return viz;
  }

  async getTaskDiagnostics(taskId: string): Promise<TaskDiagnostics> {
    this.logger.debug(`Generating diagnostics for task: ${taskId}`);

    let diag = this.diagnostics.get(taskId);
    if (!diag) {
      const executions = this.executions.get(taskId) || [];
      const totalDuration = executions.reduce((sum, e) => sum + e.duration, 0);

      diag = {
        diagnosticsId: `diag_${Date.now()}`,
        taskId,
        status: TaskStatus.PENDING,
        logs: [],
        errors: [],
        performance: {
          totalDuration,
          averageStepDuration: executions.length > 0 ? totalDuration / executions.length : 0,
        },
        recommendations: [],
      };
      this.diagnostics.set(taskId, diag);
    }

    return diag;
  }

  recordStepExecution(taskId: string, execution: StepExecution): void {
    this.logger.debug(`Recording step execution for task: ${taskId}`);

    if (!this.executions.has(taskId)) {
      this.executions.set(taskId, []);
    }

    const execs = this.executions.get(taskId)!;
    execs.push(execution);

    if (execs.length > 1000) {
      execs.shift();
    }

    // Update progress
    const progress = this.progress.get(taskId);
    if (progress) {
      progress.currentStep++;
      if (progress.totalSteps > 0) {
        progress.percentComplete = (progress.currentStep / progress.totalSteps) * 100;
      }
      progress.elapsedTime = Date.now() - progress.startTime.getTime();
    }
  }

  updateTaskStatus(taskId: string, status: TaskStatus): void {
    const progress = this.progress.get(taskId);
    if (progress) {
      progress.status = status;
      if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
        progress.actualEndTime = new Date();
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Task Progress Service');
    this.progress.clear();
    this.executions.clear();
    this.visualizations.clear();
    this.diagnostics.clear();
  }
}
