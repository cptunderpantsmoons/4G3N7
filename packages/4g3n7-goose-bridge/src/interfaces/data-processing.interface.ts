/**
 * Data Processing and Transformation Interfaces
 * Supports data validation, transformation, and API integration
 */

export interface DataSchema {
  id: string;
  name: string;
  version: string;
  description?: string;
  type: 'json-schema' | 'joi' | 'zod' | 'custom';
  schema: Record<string, any> | string;
  examples?: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  coercedData?: any;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'critical';
  suggestedFix?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning';
}

// Data Transformation

export interface DataTransformationConfig {
  id: string;
  name: string;
  description?: string;
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  mappings: FieldMapping[];
  transformRules?: TransformRule[];
  validation?: {
    sourceSchema: string;
    targetSchema: string;
  };
  metadata?: Record<string, any>;
}

export type DataFormat =
  | 'json'
  | 'xml'
  | 'csv'
  | 'yaml'
  | 'markdown'
  | 'html'
  | 'plaintext'
  | 'binary';

export interface FieldMapping {
  sourcePath: string; // dot-notation path
  targetPath: string; // dot-notation path
  type?: DataType;
  transform?: string; // transformation function
  condition?: MappingCondition;
  required?: boolean;
  default?: any;
}

export type DataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'array'
  | 'object'
  | 'null';

export interface MappingCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'isEmpty' | 'isNotEmpty';
  value?: any;
}

export interface TransformRule {
  id: string;
  name: string;
  condition?: MappingCondition;
  operations: TransformOperation[];
  order?: number;
}

export interface TransformOperation {
  type:
    | 'uppercase'
    | 'lowercase'
    | 'trim'
    | 'split'
    | 'join'
    | 'replace'
    | 'substring'
    | 'concatenate'
    | 'arithmetic'
    | 'dateFormat'
    | 'custom';
  config: Record<string, any>;
}

export interface TransformationResult {
  success: boolean;
  data?: any;
  errors?: TransformError[];
  statistics?: {
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    duration: number;
  };
}

export interface TransformError {
  recordIndex?: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

// API Integration

export interface ApiClientConfig {
  id: string;
  name: string;
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  interceptors?: RequestInterceptor[];
  retryPolicy?: ApiRetryPolicy;
}

export type AuthType = 'none' | 'basic' | 'bearer' | 'oauth2' | 'apikey' | 'custom';

export interface AuthConfig {
  type: AuthType;
  credentials: {
    username?: string;
    password?: string;
    token?: string;
    clientId?: string;
    clientSecret?: string;
    customHeader?: string;
    customValue?: string;
  };
}

export interface RequestInterceptor {
  name: string;
  type: 'request' | 'response' | 'error';
  handler: string; // function name or code
}

export interface ApiRetryPolicy {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  path: string;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  response?: any;
  originalError?: Error;
}

// Web Scraping

export interface WebScrapingConfig {
  id: string;
  url: string;
  method: 'css' | 'xpath' | 'regex' | 'ai';
  selectors: ScrapingSelector[];
  options?: ScrapingOptions;
  postProcessing?: PostProcessingRule[];
  validation?: DataValidationRule[];
}

export interface DataValidationRule {
  field: string;
  type: 'required' | 'type' | 'pattern' | 'range' | 'custom';
  config: Record<string, any>;
}

export interface ScrapingSelector {
  name: string;
  selector: string;
  type: 'text' | 'attribute' | 'html' | 'array';
  attribute?: string;
  multiple?: boolean;
  transform?: string;
}

export interface ScrapingOptions {
  timeout?: number;
  headless?: boolean;
  javascript?: boolean;
  cookies?: Record<string, string>;
  userAgent?: string;
  proxy?: string;
  waitFor?: string; // selector or timeout
  screenshots?: boolean;
  scrollAmount?: number;
}

export interface PostProcessingRule {
  field: string;
  operation: 'trim' | 'replace' | 'split' | 'join' | 'custom';
  config: Record<string, any>;
}

export interface ScrapingResult {
  url: string;
  timestamp: Date;
  data: Record<string, any>[];
  errors?: ScrapingError[];
  metadata?: {
    pageTitle?: string;
    pageUrl?: string;
    redirectUrl?: string;
    duration: number;
  };
}

export interface ScrapingError {
  selector: string;
  message: string;
  severity: 'error' | 'warning';
}

// Data Processing Pipeline

export interface DataProcessingPipeline {
  id: string;
  name: string;
  description?: string;
  steps: PipelineStep[];
  errorHandling?: {
    strategy: 'stop' | 'continue' | 'retry';
    maxRetries?: number;
  };
  metadata?: Record<string, any>;
}

export interface PipelineStep {
  id: string;
  name: string;
  type:
    | 'extract'
    | 'validate'
    | 'transform'
    | 'enrich'
    | 'filter'
    | 'aggregate'
    | 'load';
  config: Record<string, any>;
  inputs?: string[]; // step ids
  outputs?: string[];
  enabled?: boolean;
}

export interface PipelineExecutionResult {
  pipelineId: string;
  executionId: string;
  status: 'completed' | 'failed' | 'partial';
  startTime: Date;
  endTime: Date;
  stepResults: {
    [stepId: string]: {
      status: 'completed' | 'failed' | 'skipped';
      recordsProcessed: number;
      recordsSucceeded: number;
      duration: number;
      errors?: any[];
    };
  };
  totalRecordsProcessed: number;
  totalRecordsFailed: number;
  errors: any[];
}
