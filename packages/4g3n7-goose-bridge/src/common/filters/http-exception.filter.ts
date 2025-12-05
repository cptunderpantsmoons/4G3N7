import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomException } from '../exceptions/custom.exceptions';

/**
 * Global exception filter for consistent error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: string | undefined;
    let details: Record<string, any> | undefined;

    if (exception instanceof CustomException) {
      // Handle custom exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as {
          message: string;
          code?: string;
          details?: Record<string, any>;
        };
        message = responseObj.message;
        code = responseObj.code;
        details = responseObj.details;
      }
    } else if (exception instanceof HttpException) {
      // Handle NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = Array.isArray(responseObj.message)
          ? responseObj.message.join(', ')
          : responseObj.message || responseObj.error || message;
      }
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    }

    // Log error details
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    // Build response
    const errorResponse: {
      statusCode: number;
      message: string;
      code?: string;
      details?: Record<string, any>;
      timestamp: string;
      path: string;
      method: string;
      stack?: string;
    } = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (code) {
      errorResponse.code = code;
    }

    if (details) {
      errorResponse.details = details;
    }

    // Only include stack trace in development
    if (!isProduction && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

