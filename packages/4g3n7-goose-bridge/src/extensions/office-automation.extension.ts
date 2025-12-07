import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { OfficeAutomationService } from '../services/office-automation.service';
import { OfficeDocumentType, OfficeCommand } from '../interfaces/application-integration.interface';

/**
 * Office Automation Extension
 * Provides office suite automation capabilities
 */
@Injectable()
export class OfficeAutomationExtension extends BaseExtension {
  private readonly logger = new Logger(OfficeAutomationExtension.name);

  constructor(private readonly officeService: OfficeAutomationService) {
    super();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'office-automation',
      name: 'Office Automation',
      version: '1.0.0',
      description: 'Office suite automation for documents, spreadsheets, and presentations',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/office-automation.extension.ts',
      permissions: ['office:read', 'office:write', 'file:access'],
      capabilities: [
        {
          id: 'open-document',
          name: 'Open Document',
          description: 'Open an office document',
          operations: ['open_document'],
          requiredPermissions: ['office:read', 'file:access'],
        },
        {
          id: 'create-document',
          name: 'Create Document',
          description: 'Create a new office document',
          operations: ['create_document'],
          requiredPermissions: ['office:write', 'file:access'],
        },
        {
          id: 'edit-document',
          name: 'Edit Document',
          description: 'Edit an office document',
          operations: ['edit_document', 'insert_content', 'format_content'],
          requiredPermissions: ['office:write'],
        },
        {
          id: 'save-document',
          name: 'Save Document',
          description: 'Save an office document',
          operations: ['save_document'],
          requiredPermissions: ['office:write', 'file:access'],
        },
        {
          id: 'close-document',
          name: 'Close Document',
          description: 'Close an office document',
          operations: ['close_document'],
          requiredPermissions: ['office:read'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`Office Automation executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'open_document':
          result = await this.officeService.openOfficeDocument(payload.path);
          break;
        case 'create_document':
          result = await this.officeService.openOfficeDocument(payload.path);
          break;
        case 'edit_document':
          result = await this.officeService.executeOfficeCommand(
            payload.docId,
            payload.command as OfficeCommand
          );
          break;
        case 'insert_content':
          result = await this.officeService.executeOfficeCommand(
            payload.docId,
            { action: 'insert', content: payload.content, position: payload.position }
          );
          break;
        case 'format_content':
          result = await this.officeService.executeOfficeCommand(
            payload.docId,
            { action: 'format', formatting: payload.format, position: payload.range }
          );
          break;
        case 'save_document':
          result = await this.officeService.executeOfficeCommand(
            payload.docId,
            { action: 'save', path: payload.path }
          );
          break;
        case 'close_document':
          result = await this.officeService.closeOfficeDocument(payload.docId);
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

      this.context.logger.error(`Office Automation task failed: ${type}`, errorObj, {
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
          code: 'OFFICE_AUTOMATION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  async onUnload(): Promise<void> {
    // Close all open documents
    const documents = this.officeService.listDocuments();
    for (const doc of documents) {
      try {
        await this.officeService.closeOfficeDocument(doc.docId);
      } catch (error) {
        this.logger.error(`Failed to close document ${doc.docId}`, error);
      }
    }
  }
}
