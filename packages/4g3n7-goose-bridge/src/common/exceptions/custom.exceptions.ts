import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base custom exception class
 */
export class CustomException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly code?: string,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

/**
 * Extension not found exception
 */
export class ExtensionNotFoundException extends CustomException {
  constructor(extensionId: string) {
    super(
      `Extension not found: ${extensionId}`,
      HttpStatus.NOT_FOUND,
      'EXTENSION_NOT_FOUND',
      { extensionId },
    );
  }
}

/**
 * Task not found exception
 */
export class TaskNotFoundException extends CustomException {
  constructor(taskId: string) {
    super(
      `Task not found: ${taskId}`,
      HttpStatus.NOT_FOUND,
      'TASK_NOT_FOUND',
      { taskId },
    );
  }
}

/**
 * Task execution failed exception
 */
export class TaskExecutionException extends CustomException {
  constructor(taskId: string, reason: string, details?: Record<string, any>) {
    super(
      `Task execution failed: ${reason}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'TASK_EXECUTION_FAILED',
      { taskId, reason, ...details },
    );
  }
}

/**
 * Invalid task state exception
 */
export class InvalidTaskStateException extends CustomException {
  constructor(taskId: string, currentState: string, expectedState: string) {
    super(
      `Invalid task state: expected ${expectedState}, got ${currentState}`,
      HttpStatus.BAD_REQUEST,
      'INVALID_TASK_STATE',
      { taskId, currentState, expectedState },
    );
  }
}

/**
 * Configuration validation exception
 */
export class ConfigurationException extends CustomException {
  constructor(message: string, field?: string) {
    super(
      `Configuration error: ${message}`,
      HttpStatus.BAD_REQUEST,
      'CONFIGURATION_ERROR',
      field ? { field } : undefined,
    );
  }
}

