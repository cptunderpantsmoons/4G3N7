import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { IDEAutomationService } from '../services/ide-automation.service';
import { IDEType, IDECommand, TerminalCommand } from '../interfaces/application-integration.interface';

/**
 * IDE Automation Extension
 * Provides IDE and terminal automation capabilities
 */
@Injectable()
export class IDEAutomationExtension extends BaseExtension {
  private readonly logger = new Logger(IDEAutomationExtension.name);

  constructor(private readonly ideService: IDEAutomationService) {
    super();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'ide-automation',
      name: 'IDE Automation',
      version: '1.0.0',
      description: 'IDE and terminal automation for development workflows',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/ide-automation.extension.ts',
      permissions: ['ide:control', 'terminal:execute', 'file:access'],
      capabilities: [
        {
          id: 'open-project',
          name: 'Open Project',
          description: 'Open a project in an IDE',
          operations: ['open_project'],
          requiredPermissions: ['ide:control', 'file:access'],
        },
        {
          id: 'edit-code',
          name: 'Edit Code',
          description: 'Edit code files in the IDE',
          operations: ['edit_file', 'search_replace', 'navigate_to'],
          requiredPermissions: ['ide:control', 'file:access'],
        },
        {
          id: 'execute-terminal',
          name: 'Execute Terminal Command',
          description: 'Execute commands in the terminal',
          operations: ['run_terminal_command'],
          requiredPermissions: ['terminal:execute'],
        },
        {
          id: 'manage-terminals',
          name: 'Manage Terminals',
          description: 'Create and manage terminal sessions',
          operations: ['create_terminal', 'close_terminal', 'get_terminal_output'],
          requiredPermissions: ['terminal:execute'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`IDE Automation executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'open_project':
          result = await this.ideService.openIDEProject(
            payload.path,
            payload.ideType as IDEType
          );
          break;
        case 'edit_file':
          result = await this.ideService.executeIDECommand(
            payload.editorId,
            {
              action: 'edit',
              target: payload.filePath,
              content: payload.content,
              position: payload.position
            }
          );
          break;
        case 'search_replace':
          result = await this.ideService.searchInCode(payload.editorId, payload.searchText);
          break;
        case 'navigate_to':
          result = await this.ideService.executeIDECommand(
            payload.editorId,
            {
              action: 'navigate',
              target: payload.filePath,
              position: { line: payload.line, column: payload.column }
            }
          );
          break;
        case 'run_terminal_command':
          result = await this.ideService.executeTerminalCommand(payload.command as TerminalCommand);
          break;
        case 'create_terminal':
          // Terminal creation not implemented in service yet
          result = { terminalId: `term_${Date.now()}`, message: 'Terminal creation not yet implemented' };
          break;
        case 'close_terminal':
          // Terminal closing not implemented in service yet
          result = { success: true, message: 'Terminal closing not yet implemented' };
          break;
        case 'get_terminal_output':
          // Terminal history not implemented in service yet
          result = { history: [], message: 'Terminal history not yet implemented' };
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

      this.context.logger.error(`IDE Automation task failed: ${type}`, errorObj, {
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
          code: 'IDE_AUTOMATION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  async onUnload(): Promise<void> {
    // Note: IDE project closing and terminal management not yet implemented in service
    this.logger.log('IDE Automation extension unloaded');
  }
}
