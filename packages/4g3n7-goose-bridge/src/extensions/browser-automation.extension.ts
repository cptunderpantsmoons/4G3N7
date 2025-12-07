import { Injectable, Logger } from '@nestjs/common';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { BrowserAutomationService } from '../services/browser-automation.service';
import { BrowserType, BrowserCommand, NavigationAction } from '../interfaces/application-integration.interface';

/**
 * Browser Automation Extension
 * Provides web browser automation capabilities
 */
@Injectable()
export class BrowserAutomationExtension extends BaseExtension {
  private readonly logger = new Logger(BrowserAutomationExtension.name);

  constructor(private readonly browserService: BrowserAutomationService) {
    super();
  }

  getManifest(): ExtensionManifest {
    return {
      id: 'browser-automation',
      name: 'Browser Automation',
      version: '1.0.0',
      description: 'Web browser automation with multi-browser support',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/browser-automation.extension.ts',
      permissions: ['browser:control', 'network:access', 'storage:read'],
      capabilities: [
        {
          id: 'open-browser',
          name: 'Open Browser',
          description: 'Open a web browser session',
          operations: ['open_browser'],
          requiredPermissions: ['browser:control'],
        },
        {
          id: 'navigate',
          name: 'Navigate',
          description: 'Navigate to a URL or perform browser navigation',
          operations: ['navigate', 'navigate_back', 'navigate_forward', 'reload'],
          requiredPermissions: ['browser:control', 'network:access'],
        },
        {
          id: 'execute-command',
          name: 'Execute Browser Command',
          description: 'Execute commands in the browser',
          operations: ['execute_command'],
          requiredPermissions: ['browser:control'],
        },
        {
          id: 'get-session-info',
          name: 'Get Session Info',
          description: 'Get information about browser sessions and tabs',
          operations: ['get_sessions', 'get_tabs', 'get_current_tab'],
          requiredPermissions: ['browser:control'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`Browser Automation executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'open_browser':
          result = await this.browserService.openBrowser(payload.browserType || BrowserType.CHROME);
          break;
        case 'navigate':
          result = await this.browserService.navigateToUrl(payload.sessionId, payload.url);
          break;
        case 'navigate_back':
          result = await this.browserService.navigateToUrl(payload.sessionId, 'back');
          break;
        case 'navigate_forward':
          result = await this.browserService.navigateToUrl(payload.sessionId, 'forward');
          break;
        case 'reload':
          result = await this.browserService.navigateToUrl(payload.sessionId, 'reload');
          break;
        case 'execute_command':
          result = await this.browserService.executeBrowserCommand(
            payload.sessionId,
            payload.command as BrowserCommand
          );
          break;
        case 'get_sessions':
          result = this.browserService.listSessions();
          break;
        case 'get_tabs':
          result = await this.browserService.getPageElements(payload.sessionId);
          break;
        case 'get_current_tab':
          const elements = await this.browserService.getPageElements(payload.sessionId);
          result = elements[0] || null;
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

      this.context.logger.error(`Browser Automation task failed: ${type}`, errorObj, {
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
          code: 'BROWSER_AUTOMATION_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  async onUnload(): Promise<void> {
    // Close all browser sessions
    const sessions = this.browserService.listSessions();
    for (const session of sessions) {
      try {
        await this.browserService.closeBrowser(session.sessionId);
      } catch (error) {
        this.logger.error(`Failed to close browser session ${session.sessionId}`, error);
      }
    }
  }
}
