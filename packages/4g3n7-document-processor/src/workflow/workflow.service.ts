import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkflowConfig {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  documentIds?: string[];
}

export interface WorkflowStep {
  name: string;
  type: 'extract' | 'convert' | 'analyze' | 'validate' | 'ocr' | 'compare';
  config: any;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectQueue('document-workflow') private workflowQueue: Queue,
    private prisma: PrismaService,
  ) {}

  /**
   * Create and execute a workflow
   */
  async createWorkflow(config: WorkflowConfig): Promise<string> {
    try {
      this.logger.log(`Creating workflow: ${config.name}`);

      // Create workflow in database
      const workflow = await this.prisma.documentWorkflow.create({
        data: {
          name: config.name,
          description: config.description,
          config: config as any,
          status: 'PENDING',
        },
      });

      // Create workflow steps
      for (let i = 0; i < config.steps.length; i++) {
        await this.prisma.documentWorkflowStep.create({
          data: {
            workflowId: workflow.id,
            stepNumber: i + 1,
            name: config.steps[i].name,
            type: config.steps[i].type,
            config: config.steps[i].config as any,
            status: 'PENDING',
          },
        });
      }

      // Add job to queue
      const job = await this.workflowQueue.add('process-workflow', {
        workflowId: workflow.id,
      });

      // Update workflow with job ID
      await this.prisma.documentWorkflow.update({
        where: { id: workflow.id },
        data: { jobId: job.id.toString() },
      });

      return workflow.id;
    } catch (error) {
      this.logger.error(`Error creating workflow: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<any> {
    const workflow = await this.prisma.documentWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    return workflow;
  }

  /**
   * Get workflow steps
   */
  async getWorkflowSteps(workflowId: string): Promise<any[]> {
    const steps = await this.prisma.documentWorkflowStep.findMany({
      where: { workflowId },
      orderBy: { stepNumber: 'asc' },
    });

    return steps;
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflowId: string, status: string, result?: any, error?: string): Promise<void> {
    await this.prisma.documentWorkflow.update({
      where: { id: workflowId },
      data: {
        status: status as any,
        results: result,
        error,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Update workflow step status
   */
  async updateStepStatus(stepId: string, status: string, result?: any, error?: string): Promise<void> {
    await this.prisma.documentWorkflowStep.update({
      where: { id: stepId },
      data: {
        status: status as any,
        result: result,
        error,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
        startedAt: status === 'PROCESSING' ? new Date() : undefined,
      },
    });
  }

  /**
   * Batch process documents
   */
  async batchProcess(documentIds: string[], processingType: string, config: any): Promise<string> {
    const workflowConfig: WorkflowConfig = {
      name: `Batch ${processingType}`,
      description: `Batch processing ${documentIds.length} documents`,
      steps: [
        {
          name: processingType,
          type: processingType as any,
          config: { ...config, documentIds },
        },
      ],
      documentIds,
    };

    return this.createWorkflow(workflowConfig);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.prisma.documentWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (workflow?.jobId) {
      const job = await this.workflowQueue.getJob(workflow.jobId);
      if (job) {
        await job.remove();
      }
    }

    await this.prisma.documentWorkflow.update({
      where: { id: workflowId },
      data: {
        status: 'FAILED',
        error: 'Cancelled by user',
        completedAt: new Date(),
      },
    });
  }
}
