import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, url, ip, headers } = req;

    // Generate a unique request ID
    const requestId = this.generateRequestId();

    // Add request ID to response headers for tracing
    res.setHeader('X-Request-ID', requestId);
    req.headers['x-request-id'] = requestId;

    // Log incoming request
    this.logger.info(`${method} ${url}`, {
      component: 'HTTPMiddleware',
      method,
      requestId,
      metadata: {
        method,
        url,
        userAgent: headers['user-agent'],
        ip,
        contentLength: headers['content-length'],
        contentType: headers['content-type'],
      },
      tags: ['http', 'request', method.toLowerCase()],
    });

    // Override res.end to log response
    const originalEnd = res.end.bind(res);
    res.end = (chunk?: any, encoding?: any) => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Determine log level based on status code
      const logLevel = this.getLogLevelForStatus(statusCode);

      // Log response with appropriate level
      if (statusCode >= 500) {
        this.logger.error(`${method} ${url} - ${statusCode} (${duration}ms)`, {
          component: 'HTTPMiddleware',
          method,
          requestId,
          duration,
          metadata: {
            method,
            url,
            statusCode,
            duration,
            contentLength: res.get('content-length'),
            responseTime: `${duration}ms`,
          },
          tags: [
            'http',
            'response',
            method.toLowerCase(),
            `status-${statusCode}`,
          ],
        });
      } else if (statusCode >= 400) {
        this.logger.warn(`${method} ${url} - ${statusCode} (${duration}ms)`, {
          component: 'HTTPMiddleware',
          method,
          requestId,
          duration,
          metadata: {
            method,
            url,
            statusCode,
            duration,
            contentLength: res.get('content-length'),
            responseTime: `${duration}ms`,
          },
          tags: [
            'http',
            'response',
            method.toLowerCase(),
            `status-${statusCode}`,
          ],
        });
      } else {
        this.logger.info(`${method} ${url} - ${statusCode} (${duration}ms)`, {
          component: 'HTTPMiddleware',
          method,
          requestId,
          duration,
          metadata: {
            method,
            url,
            statusCode,
            duration,
            contentLength: res.get('content-length'),
            responseTime: `${duration}ms`,
          },
          tags: [
            'http',
            'response',
            method.toLowerCase(),
            `status-${statusCode}`,
          ],
        });
      }

      return originalEnd(chunk, encoding);
    };

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLogLevelForStatus(statusCode: number): string {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'info';
  }
}

export function LoggingMiddlewareFactory(logger: LoggerService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const middleware = new LoggingMiddleware(logger);
    middleware.use(req, res, next);
  };
}
