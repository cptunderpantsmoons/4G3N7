/**
 * Configuration Service
 * Manages extension configuration with JSON Schema validation
 */

import { Injectable, Logger, Optional } from '@nestjs/common';
import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { ExtensionConfig } from '../interfaces/types';

export interface ConfigStore {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  private ajv: Ajv;
  private validators: Map<string, ValidateFunction> = new Map();
  private configCache: Map<string, any> = new Map();

  constructor(@Optional() private readonly store?: ConfigStore) {
    this.ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
      coerceTypes: false,
    });
  }

  /**
   * Register a configuration schema for an extension
   */
  registerSchema(extensionId: string, schema: Record<string, any>): void {
    try {
      const validator = this.ajv.compile(schema);
      this.validators.set(extensionId, validator);
      
      this.logger.log(`Schema registered for extension: ${extensionId}`);
    } catch (error) {
      this.logger.error(`Failed to register schema for ${extensionId}`, error);
      throw error;
    }
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(extensionId: string, config: Record<string, any>): {
    valid: boolean;
    errors?: any[];
  } {
    const validator = this.validators.get(extensionId);
    
    if (!validator) {
      this.logger.warn(`No schema registered for extension: ${extensionId}`);
      return { valid: true }; // No schema means no validation
    }
    
    const valid = validator(config);
    
    if (!valid) {
      return {
        valid: false,
        errors: validator.errors || [],
      };
    }
    
    return { valid: true };
  }

  /**
   * Get extension configuration
   */
  async getConfig(extensionId: string): Promise<ExtensionConfig | null> {
    // Check cache
    if (this.configCache.has(extensionId)) {
      return this.configCache.get(extensionId);
    }
    
    // Load from store
    if (this.store) {
      try {
        const config = await this.store.get(`extension:config:${extensionId}`);
        if (config) {
          this.configCache.set(extensionId, config);
          return config;
        }
      } catch (error) {
        this.logger.error(`Failed to load config for ${extensionId}`, error);
      }
    }
    
    return null;
  }

  /**
   * Set extension configuration
   */
  async setConfig(extensionId: string, config: ExtensionConfig): Promise<void> {
    // Validate configuration
    const validation = this.validateConfig(extensionId, config.config);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration for ${extensionId}: ${JSON.stringify(validation.errors)}`);
    }
    
    // Save to store
    if (this.store) {
      try {
        await this.store.set(`extension:config:${extensionId}`, config);
      } catch (error) {
        this.logger.error(`Failed to save config for ${extensionId}`, error);
        throw error;
      }
    }
    
    // Update cache
    this.configCache.set(extensionId, config);
    
    this.logger.log(`Configuration updated for extension: ${extensionId}`);
  }

  /**
   * Delete extension configuration
   */
  async deleteConfig(extensionId: string): Promise<void> {
    // Remove from store
    if (this.store) {
      try {
        await this.store.delete(`extension:config:${extensionId}`);
      } catch (error) {
        this.logger.error(`Failed to delete config for ${extensionId}`, error);
        throw error;
      }
    }
    
    // Remove from cache
    this.configCache.delete(extensionId);
    
    this.logger.log(`Configuration deleted for extension: ${extensionId}`);
  }

  /**
   * Get default configuration for extension
   */
  getDefaultConfig(extensionId: string, schema: Record<string, any>): Record<string, any> {
    const defaultConfig: Record<string, any> = {};
    
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
        if (prop.default !== undefined) {
          defaultConfig[key] = prop.default;
        }
      }
    }
    
    return defaultConfig;
  }

  /**
   * Merge configurations
   */
  mergeConfigs(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
    return {
      ...base,
      ...override,
    };
  }

  /**
   * Clear configuration cache
   */
  clearCache(extensionId?: string): void {
    if (extensionId) {
      this.configCache.delete(extensionId);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<Map<string, ExtensionConfig>> {
    const configs = new Map<string, ExtensionConfig>();
    
    // Return cached configs if no store
    if (!this.store) {
      for (const [id, config] of this.configCache) {
        configs.set(id, config);
      }
      return configs;
    }
    
    // Load all from store (implementation depends on store type)
    // This is a simplified version
    for (const [id] of this.configCache) {
      const config = await this.getConfig(id);
      if (config) {
        configs.set(id, config);
      }
    }
    
    return configs;
  }

  /**
   * Export configuration as JSON
   */
  async exportConfig(extensionId: string): Promise<string> {
    const config = await this.getConfig(extensionId);
    if (!config) {
      throw new Error(`Configuration not found for extension: ${extensionId}`);
    }
    
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(extensionId: string, json: string): Promise<void> {
    try {
      const config: ExtensionConfig = JSON.parse(json);
      
      if (config.extensionId !== extensionId) {
        throw new Error('Extension ID mismatch');
      }
      
      await this.setConfig(extensionId, config);
    } catch (error) {
      this.logger.error(`Failed to import config for ${extensionId}`, error);
      throw error;
    }
  }
}