import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { DocumentWorkflowProcessor } from './processors/document-workflow.processor';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-workflow',
    }),
    ProcessingModule,
  ],
  controllers: [WorkflowController],
  providers: [WorkflowService, DocumentWorkflowProcessor],
  exports: [WorkflowService],
})
export class WorkflowModule {}
