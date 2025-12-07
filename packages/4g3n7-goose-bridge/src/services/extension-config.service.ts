/**
 * Phase 6.2 - Extension Configuration Service
 * Extension configuration and settings management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ExtensionConfig,
  ExtensionSetting,
  ExtensionPermission,
} from '../interfaces/ui-extension-management.interface';

@Injectable()
export class ExtensionConfigService {
  private readonly logger = new Logger(ExtensionConfigService.name);

  private configs = new Map<string, ExtensionConfig>();
  private settings = new Map<string, ExtensionSetting[]>();
  private permissions = new Map<string, ExtensionPermission[]>();

  async getExtensionConfig(extensionId: string): Promise<ExtensionConfig> {
    this.logger.debug(`Getting config for extension: ${extensionId}`);

    let config = this.configs.get(extensionId);
    if (!config) {
      config = {
        configId: `config_${extensionId}`,
        extensionId,
        enabled: true,
        autoUpdate: true,
        autoLaunch: false,
        settings: {},
        permissions: { granted: [], requested: [], denied: [] },
        dataPath: `/data/${extensionId}`,
        logLevel: 'info',
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      this.configs.set(extensionId, config);
    }

    return config;
  }

  async updateExtensionConfig(extensionId: string, updates: Partial<ExtensionConfig>): Promise<void> {
    const config = await this.getExtensionConfig(extensionId);
    Object.assign(config, updates);
    config.modifiedAt = new Date();
    this.logger.log(`Updated config for extension: ${extensionId}`);
  }

  async getExtensionSettings(extensionId: string): Promise<ExtensionSetting[]> {
    this.logger.debug(`Getting settings for extension: ${extensionId}`);

    let settings = this.settings.get(extensionId);
    if (!settings) {
      settings = [];
      this.settings.set(extensionId, settings);
    }

    return settings;
  }

  async updateExtensionSetting(extensionId: string, settingId: string, value: any): Promise<void> {
    const settings = await this.getExtensionSettings(extensionId);
    const setting = settings.find(s => s.settingId === settingId);
    
    if (!setting) {
      throw new Error(`Setting not found: ${settingId}`);
    }

    setting.value = value;
    this.logger.log(`Updated setting ${settingId} for extension: ${extensionId}`);
  }

  async getExtensionPermissions(extensionId: string): Promise<ExtensionPermission[]> {
    this.logger.debug(`Getting permissions for extension: ${extensionId}`);

    let perms = this.permissions.get(extensionId);
    if (!perms) {
      perms = [
        {
          permissionId: 'perm_1',
          name: 'File Access',
          description: 'Read and write files',
          category: 'file',
          level: 'read',
          riskLevel: 'medium',
        },
        {
          permissionId: 'perm_2',
          name: 'Network Access',
          description: 'Access network resources',
          category: 'network',
          level: 'execute',
          riskLevel: 'high',
        },
      ];
      this.permissions.set(extensionId, perms);
    }

    return perms;
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Extension Configuration Service');
    this.configs.clear();
    this.settings.clear();
    this.permissions.clear();
  }
}
