import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: {
    type: 'basic' | 'bearer' | 'apikey' | 'custom';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    customHeaderName?: string;
    customHeaderValue?: string;
  };
  proxy?: {
    protocol: string;
    host: string;
    port: number;
  };
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  path: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiCallResult {
  status: number;
  statusText: string;
  headers: Record<string, any>;
  data: any;
  duration: number;
  url: string;
}

/**
 * API Client Extension
 * Provides RESTful API integration capabilities
 */
@Injectable()
export class ApiClientExtension extends BaseExtension {
  private readonly logger = new Logger(ApiClientExtension.name);
  private clients: Map<string, AxiosInstance> = new Map();

  getManifest(): ExtensionManifest {
    return {
      id: 'api-client',
      name: 'API Client',
      version: '1.0.0',
      description: 'RESTful API integration extension with multi-auth support',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/api-client.extension.ts',
      permissions: ['api:read', 'api:write', 'network:access'],
      capabilities: [
        {
          id: 'make-request',
          name: 'Make API Request',
          description: 'Make HTTP requests to APIs',
          operations: ['make_request'],
          requiredPermissions: ['api:read', 'network:access'],
        },
        {
          id: 'create-client',
          name: 'Create API Client',
          description: 'Create a configured API client',
          operations: ['create_client'],
          requiredPermissions: ['api:read'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`API Client executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'make_request':
          result = await this.makeRequest(
            payload.clientId || 'default',
            payload.request,
            payload.config
          );
          break;
        case 'create_client':
          result = await this.createClient(payload.config);
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

      this.context.logger.error(`API Client task failed: ${type}`, errorObj, {
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
          code: 'API_CLIENT_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  /**
   * Create a new API client
   */
  async createClient(config: ApiClientConfig): Promise<{ clientId: string }> {
    try {
      const clientId = uuidv4();

      this.context.logger.info(`Creating API client: ${clientId}`, {
        baseUrl: config.baseUrl,
      });

      const axiosConfig: AxiosRequestConfig = {
        baseURL: config.baseUrl,
        timeout: config.timeout || 30000,
        headers: config.headers || {},
      };

      // Configure authentication
      if (config.auth) {
        switch (config.auth.type) {
          case 'basic':
            if (config.auth.username && config.auth.password) {
              axiosConfig.auth = {
                username: config.auth.username,
                password: config.auth.password,
              };
            }
            break;
          case 'bearer':
            if (config.auth.token) {
              axiosConfig.headers = {
                ...axiosConfig.headers,
                Authorization: `Bearer ${config.auth.token}`,
              };
            }
            break;
          case 'apikey':
            if (config.auth.apiKey) {
              axiosConfig.headers = {
                ...axiosConfig.headers,
                'X-API-Key': config.auth.apiKey,
              };
            }
            break;
          case 'custom':
            if (config.auth.customHeaderName && config.auth.customHeaderValue) {
              axiosConfig.headers = {
                ...axiosConfig.headers,
                [config.auth.customHeaderName]: config.auth.customHeaderValue,
              };
            }
            break;
        }
      }

      // Configure proxy
      if (config.proxy) {
        axiosConfig.proxy = {
          protocol: config.proxy.protocol,
          host: config.proxy.host,
          port: config.proxy.port,
        } as any;
      }

      const client = axios.create(axiosConfig);
      this.clients.set(clientId, client);

      this.context.logger.info(`API client created: ${clientId}`);
      return { clientId };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error creating API client', errorObj);
      throw error;
    }
  }

  /**
   * Make an API request
   */
  async makeRequest(
    clientId: string,
    request: ApiRequest,
    config?: { retries?: number; retryDelay?: number }
  ): Promise<ApiCallResult> {
    try {
      let client = this.clients.get(clientId);

      if (!client) {
        throw new Error(`API client not found: ${clientId}`);
      }

      const startTime = Date.now();
      const url = this.buildUrl(request.path, request.query);

      const axiosConfig: AxiosRequestConfig = {
        method: request.method,
        url,
        headers: request.headers,
        timeout: request.timeout,
        validateStatus: () => true, // Don't throw on any status code
      };

      if (request.body) {
        axiosConfig.data = request.body;
      }

      let response: AxiosResponse | null = null;
      let lastError: Error | null = null;
      const maxRetries = config?.retries || 1;
      const retryDelay = config?.retryDelay || 1000;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          response = await client(axiosConfig);
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt < maxRetries - 1) {
            this.context.logger.warn(
              `API request failed, retrying... (${attempt + 1}/${maxRetries})`,
              lastError
            );
            await this.delay(retryDelay);
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Unknown API error');
      }

      const duration = Date.now() - startTime;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        duration,
        url: response.config.url || url,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error(`Error making API request`, errorObj);
      throw error;
    }
  }

  /**
   * Get a client by ID
   */
  getClient(clientId: string): AxiosInstance | undefined {
    return this.clients.get(clientId);
  }

  /**
   * List all clients
   */
  listClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): boolean {
    return this.clients.delete(clientId);
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, query?: Record<string, any>): string {
    let url = path;

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            params.append(key, String(v));
          }
        } else {
          params.set(key, String(value));
        }
      }
      url = `${path}?${params.toString()}`;
    }

    return url;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async onUnload(): Promise<void> {
    try {
      this.clients.clear();
      this.context.logger.info('API Client Extension unloaded');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error unloading API Client Extension', errorObj);
    }
  }
}
