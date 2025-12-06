/**
 * Workflow Definition and Execution Interfaces
 * Supports multi-step workflows with conditional logic, parallel execution, and error handling
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  errorHandling: ErrorHandler;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'extension' | 'conditional' | 'parallel' | 'loop' | 'delay' | 'script';
  name: string;
  description?: string;
  config: Record<string, any>;
  inputs?: StepInput[];
  outputs?: StepOutput[];
  nextStepId?: string;
  errorStepId?: string;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  enabled?: boolean;
}

export interface StepInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'variable';
  value?: any;
  source?: string; // step or variable reference
  required?: boolean;
  validation?: ValidationRule;
}

export interface StepOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  mapping?: string; // how to map output
  store?: boolean; // store in context
}

export interface ConditionalStep extends WorkflowStep {
  type: 'conditional';
  config: {
    conditions: Condition[];
    branches: {
      [key: string]: string; // branch name -> next step id
    };
  };
}

export interface ParallelStep extends WorkflowStep {
  type: 'parallel';
  config: {
    steps: string[]; // step ids to execute in parallel
    joinType: 'all' | 'any'; // wait for all or any
    timeout?: number;
  };
}

export interface LoopStep extends WorkflowStep {
  type: 'loop';
  config: {
    items: string; // source of items to iterate
    itemVariable: string;
    body: string; // step id to loop
    maxIterations?: number;
  };
}

export interface Condition {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'in' | 'contains' | 'matches';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RetryPolicy {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'url' | 'regex' | 'custom';
  rule: string | RegExp;
  errorMessage?: string;
}

export interface ErrorHandler {
  strategy: 'stop' | 'continue' | 'fallback';
  fallbackStepId?: string;
  notifyUsers?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
}

// Execution Context and Results

export interface WorkflowExecutionContext {
  executionId: string;
  workflowId: string;
  workflowVersion: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  currentStepId?: string;
  variables: Map<string, any>;
  stepResults: Map<string, StepExecutionResult>;
  errors: ExecutionError[];
  logs: ExecutionLog[];
  userId?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  duration: number;
  stepResults: StepExecutionResult[];
  finalOutput: any;
  errors: ExecutionError[];
  logs: ExecutionLog[];
}

export interface StepExecutionResult {
  stepId: string;
  stepName: string;
  status: 'completed' | 'failed' | 'skipped' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  output?: any;
  error?: ExecutionError;
  retries: number;
  inputs?: Record<string, any>;
}

export interface ExecutionError {
  stepId?: string;
  code: string;
  message: string;
  timestamp: Date;
  stack?: string;
  recoverable: boolean;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  stepId?: string;
  context?: Record<string, any>;
}

// Workflow Management

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
  examples?: WorkflowExample[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExample {
  name: string;
  description: string;
  inputs: Record<string, any>;
  expectedOutput: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  userId: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  errors?: ExecutionError[];
}
