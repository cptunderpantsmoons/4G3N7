import {
  Controller,
  Get,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LoggerService, LogFilter, LogLevels } from './logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Logging')
@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  @ApiOperation({ summary: 'Get logs with optional filtering' })
  @ApiQuery({ name: 'level', required: false, enum: LogLevels })
  @ApiQuery({ name: 'component', required: false })
  @ApiQuery({ name: 'requestId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  getLogs(
    @Query('level') level?: LogLevels,
    @Query('component') component?: string,
    @Query('requestId') requestId?: string,
    @Query('userId') userId?: string,
    @Query('taskId') taskId?: string,
    @Query('tags') tags?: string[],
  ) {
    const filter: LogFilter = {
      level,
      component,
      requestId,
      userId,
      taskId,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    };

    const logs = this.loggerService.getLogs(filter);
    return {
      success: true,
      data: logs,
      count: logs.length,
      filter,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get logging metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  getMetrics() {
    this.loggerService.info('Log metrics accessed', {
      component: 'LoggerController',
      tags: ['metrics', 'api-access'],
    });

    const metrics = this.loggerService.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get logger health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  getHealth() {
    const health = this.loggerService.getLoggerHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export logs as JSON' })
  @ApiQuery({ name: 'level', required: false, enum: LogLevels })
  @ApiQuery({ name: 'component', required: false })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs exported successfully',
    headers: {
      'Content-Type': {
        description: 'Content type based on format parameter',
        schema: { type: 'string' },
      },
      'Content-Disposition': {
        description: 'File download header',
        schema: { type: 'string' },
      },
    },
  })
  exportLogs(
    @Query('level') level?: LogLevels,
    @Query('component') component?: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    const filter: LogFilter = { level, component };
    const logs = this.loggerService.getLogs(filter);

    this.loggerService.info('Logs exported', {
      component: 'LoggerController',
      metadata: { format, logCount: logs.length, filter },
      tags: ['export', 'api-access'],
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeader =
        'timestamp,level,message,service,version,environment,correlationId,component,requestId,userId,taskId,tags\n';
      const csvRows = logs.map((log) =>
        [
          log.timestamp,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
          log.service,
          log.version,
          log.environment,
          log.correlationId,
          log.context?.component || '',
          log.context?.requestId || '',
          log.context?.userId || '',
          log.context?.taskId || '',
          `"${(log.context?.tags || []).join(';')}"`,
        ].join(','),
      );

      return csvHeader + csvRows.join('\n');
    }

    return this.loggerService.exportLogs(filter);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all logs from memory' })
  @ApiResponse({ status: 200, description: 'Logs cleared successfully' })
  clearLogs() {
    const metricsBefore = this.loggerService.getMetrics();

    this.loggerService.clearLogs();

    this.loggerService.info('Logs cleared via API', {
      component: 'LoggerController',
      metadata: { previousLogCount: metricsBefore.totalLogs },
      tags: ['admin', 'cleanup', 'api-access'],
    });

    return {
      success: true,
      message: 'Logs cleared successfully',
      previousCount: metricsBefore.totalLogs,
    };
  }

  @Get('test')
  @ApiOperation({ summary: 'Generate test logs for debugging' })
  @ApiResponse({ status: 200, description: 'Test logs generated successfully' })
  generateTestLogs() {
    this.loggerService.trace('This is a trace level test log', {
      component: 'TestController',
      tags: ['test', 'trace'],
    });

    this.loggerService.debug('This is a debug level test log', {
      component: 'TestController',
      tags: ['test', 'debug'],
    });

    this.loggerService.info('This is an info level test log', {
      component: 'TestController',
      tags: ['test', 'info'],
    });

    this.loggerService.warn('This is a warning level test log', {
      component: 'TestController',
      tags: ['test', 'warn'],
    });

    this.loggerService.error(
      'This is an error level test log',
      new Error('Test error'),
      {
        component: 'TestController',
        tags: ['test', 'error'],
      },
    );

    this.loggerService.critical('This is a critical level test log', {
      component: 'TestController',
      tags: ['test', 'critical'],
    });

    return {
      success: true,
      message: 'Test logs generated successfully',
      levels: ['trace', 'debug', 'info', 'warn', 'error', 'critical'],
    };
  }
}
