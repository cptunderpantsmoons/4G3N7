import { Injectable, LogLevel, ModuleRef, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export enum LogLevels {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  taskId?: string;
  sessionId?: string;
  provider?: string;
  model?: string;
  duration?: number;
  error?: Error;
  errorCode?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  component?: string;
  method?: string;
  file?: string;
  line?: number;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevels;
  message: string;
  context?: LogContext;
  service: string;
  version: string;
  environment: string;
  correlationId: string;
  stackTrace?: string;
}

export interface LogFilter {
  level?: LogLevels;
  component?: string;
  requestId?: string;
  userId?: string;
  taskId?: string;
  tags?: string[];
}

export interface LogMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevels, number>;
  errorRate: number;
  averageLogLevel: LogLevels;
  topComponents: Array<{ component: string; count: number }>;
}

@Injectable()
export class LoggerService implements OnModuleInit {
  private serviceName = '4g3n7-agent';
  private version = process.env.npm_package_version || '1.0.0';
  private environment: string;
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 10000;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;
  private correlationId: string;

  constructor(
    private configService: ConfigService,
    private moduleRef: ModuleRef,
  ) {
    this.environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );
    this.isProduction = this.environment === 'production';
    this.isDevelopment = this.environment === 'development';
    this.correlationId = randomUUID();
  }

  async onModuleInit() {
    // Log initialization
    this.info('Logger service initialized', {
      component: 'LoggerService',
      metadata: {
        serviceName: this.serviceName,
        version: this.version,
        environment: this.environment,
        maxLogsInMemory: this.maxLogsInMemory,
      },
    });

    // Process any existing console.log/console.warn calls
    this.interceptConsoleLogging();
  }

  private interceptConsoleLogging() {
    if (this.isDevelopment) {
      // Only intercept in development to avoid infinite loops in production
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
      };

      console.log = (...args: any[]) => {
        this.info(args.join(' '), {
          component: 'Console',
          tags: ['console-log'],
        });
        originalConsole.log(...args);
      };

      console.warn = (...args: any[]) => {
        this.warn(args.join(' '), {
          component: 'Console',
          tags: ['console-warn'],
        });
        originalConsole.warn(...args);
      };

      console.error = (...args: any[]) => {
        this.error(args.join(' '), {
          component: 'Console',
          tags: ['console-error'],
        });
        originalConsole.error(...args);
      };

      console.info = (...args: any[]) => {
        this.info(args.join(' '), {
          component: 'Console',
          tags: ['console-info'],
        });
        originalConsole.info(...args);
      };

      console.debug = (...args: any[]) => {
        this.debug(args.join(' '), {
          component: 'Console',
          tags: ['console-debug'],
        });
        originalConsole.debug(...args);
      };
    }
  }

  private createLogEntry(
    level: LogLevels,
    message: string,
    context?: LogContext,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      correlationId: context?.requestId || this.correlationId,
    };

    if (context) {
      entry.context = {
        ...context,
        // Generate correlation ID if not provided
        correlationId: context?.requestId || randomUUID(),
      };
    }

    // Add stack trace for errors
    if (level === LogLevels.ERROR || level === LogLevels.CRITICAL) {
      if (context?.error) {
        entry.stackTrace = context.error.stack;
      } else if (new Error().stack) {
        entry.stackTrace = new Error().stack;
      }
    }

    return entry;
  }

  private shouldLog(level: LogLevels): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }

    const logLevelOrder = [
      LogLevels.TRACE,
      LogLevels.DEBUG,
      LogLevels.INFO,
      LogLevels.WARN,
      LogLevels.ERROR,
      LogLevels.CRITICAL,
    ];

    const currentLevelIndex = logLevelOrder.indexOf(
      this.getLogLevelFromConfig(),
    );
    const messageLevelIndex = logLevelOrder.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private getLogLevelFromConfig(): LogLevels {
    const configLevel = this.configService
      .get<string>('LOG_LEVEL', 'info')
      .toUpperCase();
    return (configLevel as LogLevels) || LogLevels.INFO;
  }

  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the last N logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // In production, you might want to send logs to external services
    if (this.isProduction) {
      this.sendToExternalLogging(entry);
    }
  }

  private sendToExternalLogging(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // Could be sent to Elasticsearch, Loggly, Datadog, etc.
    // For now, we'll use console output with structured formatting
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const logOutput = {
      '@timestamp': entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      service: entry.service,
      version: entry.version,
      environment: entry.environment,
      correlation_id: entry.correlationId,
      ...entry.context,
    };

    if (entry.stackTrace) {
      (logOutput as any).stack_trace = entry.stackTrace;
    }

    const output = JSON.stringify(logOutput);

    switch (entry.level) {
      case LogLevels.CRITICAL:
      case LogLevels.ERROR:
        console.error(output);
        break;
      case LogLevels.WARN:
        console.warn(output);
        break;
      case LogLevels.INFO:
        console.info(output);
        break;
      case LogLevels.DEBUG:
      case LogLevels.TRACE:
        if (this.isDevelopment) {
          console.debug(output);
        }
        break;
    }
  }

  // Public logging methods
  critical(message: string, context?: LogContext): void {
    this.log(LogLevels.CRITICAL, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevels.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevels.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevels.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevels.DEBUG, message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log(LogLevels.TRACE, message, context);
  }

  private log(level: LogLevels, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createLogEntry(level, message, context);
    this.storeLog(entry);
  }

  // Utility methods for common logging patterns
  logMethodEntry(
    method: string,
    args?: any,
    context?: Partial<LogContext>,
  ): void {
    this.debug(`Entering ${method}`, {
      ...context,
      method,
      metadata: { args },
      tags: ['method-entry'],
    });
  }

  logMethodExit(
    method: string,
    result?: any,
    context?: Partial<LogContext>,
  ): void {
    this.debug(`Exiting ${method}`, {
      ...context,
      method,
      metadata: { result },
      tags: ['method-exit'],
    });
  }

  logPerformance(
    operation: string,
    duration: number,
    context?: Partial<LogContext>,
  ): void {
    const level =
      duration > 5000
        ? LogLevels.WARN
        : duration > 1000
          ? LogLevels.INFO
          : LogLevels.DEBUG;

    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      duration,
      component: 'Performance',
      tags: ['performance', operation],
    });
  }

  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>,
  ): void {
    const level =
      statusCode >= 500
        ? LogLevels.ERROR
        : statusCode >= 400
          ? LogLevels.WARN
          : LogLevels.INFO;

    this.log(level, `${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      metadata: { method, url, statusCode },
      duration,
      component: 'API',
      tags: ['api-request', method.toLowerCase(), statusCode.toString()],
    });
  }

  logDatabaseQuery(
    query: string,
    duration: number,
    context?: Partial<LogContext>,
  ): void {
    const level = duration > 1000 ? LogLevels.WARN : LogLevels.DEBUG;

    this.log(
      level,
      `Database query (${duration}ms): ${query.substring(0, 200)}...`,
      {
        ...context,
        duration,
        component: 'Database',
        tags: ['database', 'query'],
      },
    );
  }

  logError(error: Error, context?: Partial<LogContext>): void {
    this.error(error.message, {
      ...context,
      error,
      errorCode: error.name,
      component: 'ErrorHandler',
      tags: ['error'],
    });
  }

  logWebSocketEvent(
    event: string,
    clientId: string,
    context?: Partial<LogContext>,
  ): void {
    this.debug(`WebSocket event: ${event} from client ${clientId}`, {
      ...context,
      sessionId: clientId,
      component: 'WebSocket',
      tags: ['websocket', event],
    });
  }

  logAIInteraction(
    provider: string,
    model: string,
    operation: string,
    context?: Partial<LogContext>,
  ): void {
    this.info(`AI ${operation}: ${provider}/${model}`, {
      ...context,
      provider,
      model,
      component: 'AI',
      tags: [
        'ai',
        provider.toLowerCase(),
        model.toLowerCase(),
        operation.toLowerCase(),
      ],
    });
  }

  // Query and analysis methods
  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter((log) => log.level === filter.level);
      }
      if (filter.component) {
        filteredLogs = filteredLogs.filter(
          (log) => log.context?.component === filter.component,
        );
      }
      if (filter.requestId) {
        filteredLogs = filteredLogs.filter(
          (log) => log.context?.requestId === filter.requestId,
        );
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(
          (log) => log.context?.userId === filter.userId,
        );
      }
      if (filter.taskId) {
        filteredLogs = filteredLogs.filter(
          (log) => log.context?.taskId === filter.taskId,
        );
      }
      if (filter.tags && filter.tags.length > 0) {
        filteredLogs = filteredLogs.filter((log) =>
          filter.tags!.some((tag) => log.context?.tags?.includes(tag)),
        );
      }
    }

    return filteredLogs;
  }

  getMetrics(): LogMetrics {
    const logsByLevel = this.logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevels, number>,
    );

    const totalLogs = this.logs.length;
    const errorLogs =
      (logsByLevel[LogLevels.ERROR] || 0) +
      (logsByLevel[LogLevels.CRITICAL] || 0);
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

    const componentCounts = this.logs.reduce(
      (acc, log) => {
        const component = log.context?.component || 'Unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topComponents = Object.entries(componentCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([component, count]) => ({ component, count }));

    const averageLogLevel = this.calculateAverageLogLevel();

    return {
      totalLogs,
      logsByLevel,
      errorRate,
      averageLogLevel,
      topComponents,
    };
  }

  private calculateAverageLogLevel(): LogLevels {
    if (this.logs.length === 0) return LogLevels.INFO;

    const levelValues = {
      [LogLevels.TRACE]: 0,
      [LogLevels.DEBUG]: 1,
      [LogLevels.INFO]: 2,
      [LogLevels.WARN]: 3,
      [LogLevels.ERROR]: 4,
      [LogLevels.CRITICAL]: 5,
    };

    const totalValue = this.logs.reduce(
      (sum, log) => sum + levelValues[log.level],
      0,
    );
    const averageValue = totalValue / this.logs.length;

    const levels = Object.values(LogLevels);
    return levels[Math.round(averageValue)] || LogLevels.INFO;
  }

  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', { component: 'LoggerService' });
  }

  exportLogs(filter?: LogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  // Health check method
  getLoggerHealth(): { status: string; metrics: LogMetrics } {
    const metrics = this.getMetrics();
    const status = metrics.errorRate > 10 ? 'degraded' : 'healthy';

    return {
      status,
      metrics,
    };
  }
}
