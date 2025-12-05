import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { WorkflowService, WorkflowConfig } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  async createWorkflow(@Body() config: WorkflowConfig) {
    const workflowId = await this.workflowService.createWorkflow(config);
    return { workflowId };
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    return this.workflowService.getWorkflowStatus(id);
  }

  @Get(':id/steps')
  async getWorkflowSteps(@Param('id') id: string) {
    return this.workflowService.getWorkflowSteps(id);
  }

  @Post('batch')
  async batchProcess(
    @Body() body: { documentIds: string[]; processingType: string; config: any }
  ) {
    const workflowId = await this.workflowService.batchProcess(
      body.documentIds,
      body.processingType,
      body.config
    );
    return { workflowId };
  }

  @Delete(':id')
  async cancelWorkflow(@Param('id') id: string) {
    await this.workflowService.cancelWorkflow(id);
    return { message: 'Workflow cancelled' };
  }
}
