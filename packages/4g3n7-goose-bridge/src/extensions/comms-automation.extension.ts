import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { CommsAutomationService } from '../services/comms-automation.service';
import { CommsType, EmailMessage, ChatMessage } from '../interfaces/application-integration.interface';

/**
 * Communications Automation Extension
 * Provides email and chat automation capabilities
 */
@Injectable()
export class CommsAutomationExtension extends BaseExtension {
  private readonly logger = new Logger(CommsAutomationExtension.name);

  constructor(private readonly commsService: CommsAutomationService) {
    super();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'comms-automation',
      name: 'Communications Automation',
      version: '1.0.0',
      description: 'Email and chat automation for communication workflows',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/comms-automation.extension.ts',
      permissions: ['email:read', 'email:write', 'chat:read', 'chat:write', 'network:access'],
      capabilities: [
        {
          id: 'send-email',
          name: 'Send Email',
          description: 'Send an email message',
          operations: ['send_email'],
          requiredPermissions: ['email:write', 'network:access'],
        },
        {
          id: 'read-email',
          name: 'Read Email',
          description: 'Read email messages',
          operations: ['read_email', 'get_emails', 'search_emails'],
          requiredPermissions: ['email:read'],
        },
        {
          id: 'manage-email-folders',
          name: 'Manage Email Folders',
          description: 'Create and manage email folders',
          operations: ['create_folder', 'delete_folder', 'move_email'],
          requiredPermissions: ['email:write'],
        },
        {
          id: 'send-chat-message',
          name: 'Send Chat Message',
          description: 'Send a chat message',
          operations: ['send_chat_message'],
          requiredPermissions: ['chat:write', 'network:access'],
        },
        {
          id: 'read-chat-messages',
          name: 'Read Chat Messages',
          description: 'Read chat messages from channels',
          operations: ['read_chat_messages', 'get_chat_history'],
          requiredPermissions: ['chat:read'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`Communications Automation executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'send_email':
          result = await this.commsService.sendEmail(payload.message as EmailMessage);
          break;
        case 'read_email':
          result = await this.commsService.readEmails('inbox', 1);
          break;
        case 'get_emails':
          result = await this.commsService.readEmails(payload.folder || 'inbox', payload.limit || 50);
          break;
        case 'search_emails':
          result = await this.commsService.readEmails(payload.folder || 'inbox', 100);
          break;
        case 'create_folder':
          // Folder management not implemented in service yet
          result = { success: true, message: 'Folder creation not yet implemented' };
          break;
        case 'delete_folder':
          // Folder management not implemented in service yet
          result = { success: true, message: 'Folder deletion not yet implemented' };
          break;
        case 'move_email':
          // Email movement not implemented in service yet
          result = { success: true, message: 'Email movement not yet implemented' };
          break;
        case 'send_chat_message':
          result = await this.commsService.sendChatMessage(payload.channelId, payload.text);
          break;
        case 'read_chat_messages':
          result = await this.commsService.getChannelMessages(payload.channelId, payload.limit || 50);
          break;
        case 'get_chat_history':
          result = await this.commsService.getChannelMessages(payload.channelId, 100);
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

      this.context.logger.error(`Communications Automation task failed: ${type}`, errorObj, {
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
          code: 'COMMS_AUTOMATION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  async onUnload(): Promise<void> {
    // Clean up any active connections or sessions
    this.logger.log('Communications Automation extension unloaded');
  }
}
