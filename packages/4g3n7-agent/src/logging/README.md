# 4G3N7 Structured Logging System

A comprehensive, production-ready logging solution for the 4G3N7 AI Desktop Agent that replaces basic console.log statements with structured, searchable, and analyzable logs.

## Features

### 🚀 **Core Capabilities**
- **Structured Logging**: JSON-formatted logs with consistent schema
- **Multiple Log Levels**: trace, debug, info, warn, error, critical
- **Context Tracking**: Request IDs, user IDs, task IDs, component tracing
- **Performance Monitoring**: Automatic timing and slow query detection
- **Correlation IDs**: Track requests across services and components
- **Tagging System**: Flexible tagging for easy log filtering and analysis

### 🛡️ **Production Features**
- **Memory Management**: Configurable log retention and rotation
- **Security**: Sensitive data filtering and safe error logging
- **Health Monitoring**: Log system health checks and metrics
- **Export Capabilities**: JSON and CSV export with filtering
- **HTTP Request Logging**: Automatic request/response tracing
- **WebSocket Event Logging**: Real-time connection monitoring

### 🔧 **Integration Points**
- **Database Logging**: Prisma query performance monitoring
- **AI Provider Logging**: API interaction tracking with error handling
- **File Storage Operations**: Upload/download logging with performance metrics
- **Error Handling**: Structured error logging with stack traces
- **Console Interception**: Automatic replacement of console.log statements

## Quick Start

### Basic Usage

```typescript
import { LoggerService } from './logging/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  async processData(data: any) {
    this.logger.info('Starting data processing', {
      component: 'MyService',
      method: 'processData',
      metadata: { dataSize: data.length },
      tags: ['processing', 'data'],
    });

    try {
      const result = await this.processDataInternal(data);

      this.logger.info('Data processing completed', {
        component: 'MyService',
        method: 'processData',
        metadata: { resultSize: result.length },
        tags: ['processing', 'completed'],
      });

      return result;
    } catch (error) {
      this.logger.logError(error, {
        component: 'MyService',
        method: 'processData',
        metadata: { inputData: data.length },
        tags: ['processing', 'error'],
      });
      throw error;
    }
  }
}
```

### Using Decorators

```typescript
import { LogMethod, LogPerformance } from './logging/logger.decorator';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  @LogMethod({ level: 'debug', includeArgs: true, logPerformance: true })
  async processData(data: any) {
    // Method entry/exit and performance automatically logged
    return await this.expensiveOperation(data);
  }

  @LogPerformance('expensive-operation')
  async expensiveOperation(data: any) {
    // Performance automatically logged
  }
}
```

### Specialized Logging Methods

```typescript
// Performance logging
this.logger.logPerformance('database-query', duration, {
  component: 'DatabaseService',
  query: 'SELECT * FROM users',
});

// API request logging
this.logger.logApiRequest('POST', '/api/tasks', 200, duration, {
  component: 'TaskController',
  userId: 'user-123',
});

// Database query logging
this.logger.logDatabaseQuery('SELECT * FROM tasks', duration, {
  component: 'TaskService',
  taskId: 'task-456',
});

// WebSocket events
this.logger.logWebSocketEvent('client_connected', 'socket-123', {
  component: 'TasksGateway',
  userAgent: 'Mozilla/5.0...',
});

// AI provider interactions
this.logger.logAIInteraction('anthropic', 'claude-4.5-sonnet', 'generate', {
  component: 'AgentService',
  taskId: 'task-789',
});

// Error logging with full context
this.logger.logError(error, {
  component: 'PaymentService',
  method: 'processPayment',
  userId: 'user-123',
  metadata: { amount: 99.99, currency: 'USD' },
});
```

## Configuration

### Environment Variables

```bash
# Basic configuration
LOG_LEVEL=info                    # trace, debug, info, warn, error, critical
MAX_LOGS_IN_MEMORY=50000          # Maximum logs in memory
ENABLE_CONSOLE_INTERCEPTION=true  # Replace console.log statements
ENABLE_EXTERNAL_LOGGING=false    # Send to external services
SERVICE_NAME=4g3n7-agent          # Service name in logs
LOG_FORMAT=json                  # json or pretty

# Performance settings
ENABLE_HTTP_LOGGING=true          # Log HTTP requests/responses
SLOW_QUERY_THRESHOLD=1000         # Database slow query threshold (ms)
ENABLE_PERFORMANCE_LOGGING=true   # Enable performance logging
PERFORMANCE_THRESHOLD=1000        # Performance logging threshold (ms)

# Retention settings
LOG_RETENTION_DAYS=30             # Log retention period
ENABLE_LOG_ROTATION=true          # Enable log rotation
```

### Module Configuration

```typescript
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    LoggingModule.forRoot({
      maxLogsInMemory: 50000,
      customServiceName: '4g3n7-agent',
      enableConsoleInterception: true,
      externalLogging: true,
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

## API Endpoints

### Get Logs
```http
GET /logs?level=error&component=TaskService&requestId=req-123
```

### Get Metrics
```http
GET /logs/metrics
```

### Export Logs
```http
GET /logs/export?format=json&level=warn
```

### Health Check
```http
GET /logs/health
```

### Generate Test Logs
```http
GET /logs/test
```

### Clear Logs
```http
DELETE /logs
```

## Log Structure

### Standard Log Entry
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "message": "User authentication successful",
  "service": "4g3n7-agent",
  "version": "1.0.0",
  "environment": "production",
  "correlationId": "req_1705314645123_abc123",
  "context": {
    "component": "AuthService",
    "method": "authenticateUser",
    "requestId": "req_1705314645123_abc123",
    "userId": "user-123",
    "metadata": {
      "username": "john.doe",
      "authMethod": "jwt"
    },
    "tags": ["auth", "success", "jwt"]
  }
}
```

### Error Log Entry
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "4g3n7-agent",
  "version": "1.0.0",
  "environment": "production",
  "correlationId": "req_1705314645123_def456",
  "context": {
    "component": "DatabaseService",
    "method": "connect",
    "error": "ConnectionTimeoutError",
    "errorCode": "DB_CONNECTION_TIMEOUT",
    "metadata": {
      "host": "db.example.com",
      "port": 5432,
      "timeout": 30000
    },
    "tags": ["database", "error", "timeout"]
  },
  "stackTrace": "Error: Database connection failed\n    at DatabaseService.connect..."
}
```

## Performance Monitoring

### Automatic Performance Tracking
- Method execution time
- Database query duration
- HTTP request/response time
- API call latency
- File operation duration

### Slow Query Detection
```typescript
// Automatic slow query logging
this.logger.logDatabaseQuery(query, duration, context);
// Logs warn level if duration > SLOW_QUERY_THRESHOLD
```

### Performance Thresholds
```typescript
// Custom performance logging
this.logger.logPerformance('user-registration', duration, {
  component: 'UserService',
  threshold: 2000, // Log as warn if > 2 seconds
});
```

## Integration Examples

### Database Service
```typescript
@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async findTasks(userId: string): Promise<Task[]> {
    const startTime = Date.now();

    try {
      const tasks = await this.prisma.task.findMany({
        where: { userId },
      });

      this.logger.logDatabaseQuery(
        `SELECT * FROM tasks WHERE userId = ${userId}`,
        Date.now() - startTime,
        {
          component: 'TaskService',
          method: 'findTasks',
          userId,
        }
      );

      return tasks;
    } catch (error) {
      this.logger.logError(error, {
        component: 'TaskService',
        method: 'findTasks',
        userId,
        tags: ['database', 'error'],
      });
      throw error;
    }
  }
}
```

### HTTP Controller
```typescript
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateTaskDto, @Req() req: Request) {
    const requestId = req.headers['x-request-id'];

    this.logger.info('Creating new task', {
      component: 'TaskController',
      method: 'createTask',
      requestId,
      userId: req.user?.id,
      metadata: { taskTitle: createTaskDto.title },
      tags: ['tasks', 'creation'],
    });

    try {
      const task = await this.taskService.create(createTaskDto, req.user.id);

      this.logger.info('Task created successfully', {
        component: 'TaskController',
        method: 'createTask',
        requestId,
        taskId: task.id,
        tags: ['tasks', 'success'],
      });

      return task;
    } catch (error) {
      this.logger.logError(error, {
        component: 'TaskController',
        method: 'createTask',
        requestId,
        metadata: { taskData: createTaskDto },
        tags: ['tasks', 'error'],
      });
      throw error;
    }
  }
}
```

## Best Practices

### 1. Consistent Context
```typescript
// Good - Include component, method, and relevant IDs
this.logger.info('Operation completed', {
  component: 'UserService',
  method: 'updateProfile',
  userId: user.id,
  tags: ['users', 'profile', 'update'],
});

// Bad - No context
this.logger.info('Done');
```

### 2. Appropriate Log Levels
```typescript
// TRACE - Very detailed debugging
this.logger.trace('Entering function', context);

// DEBUG - Development information
this.logger.debug('Cache miss', context);

// INFO - Normal operations
this.logger.info('User logged in', context);

// WARN - Potential issues
this.logger.warn('Slow database query detected', context);

// ERROR - Actual errors with exceptions
this.logger.logError(error, context);

// CRITICAL - System-level failures
this.logger.critical('Database connection lost', context);
```

### 3. Sensitive Data Protection
```typescript
// Bad - Logging sensitive data
this.logger.info('User login', {
  metadata: {
    password: 'secret123', // NEVER log passwords
    creditCard: '1234-5678-9012-3456', // NEVER log financial data
  }
});

// Good - Only log non-sensitive identifiers
this.logger.info('User login', {
  userId: user.id,
  metadata: {
    emailHash: hashEmail(user.email), // Hash sensitive data
    lastLoginAt: user.lastLoginAt,
  }
});
```

### 4. Performance Considerations
```typescript
// Use appropriate log levels in production
if (process.env.NODE_ENV === 'development') {
  this.logger.debug('Detailed debugging info', context);
}

// Avoid logging in tight loops
for (const item of largeArray) {
  // Bad - Will create thousands of logs
  this.logger.debug(`Processing ${item.id}`, context);
}

// Good - Log summary instead
this.logger.info(`Processing batch of ${largeArray.length} items`, context);
```

## Monitoring and Alerting

### Log Metrics
- Error rate percentage
- Logs by level distribution
- Top components by log count
- Average log level
- Log generation rate

### Health Monitoring
```typescript
// Check log system health
const health = this.logger.getLoggerHealth();
// Returns: { status: 'healthy' | 'degraded' | 'critical', metrics }
```

### Alerting Triggers
- Error rate > 10%
- Critical level logs detected
- Log system memory usage > 80%
- No logs generated in last 5 minutes

## Troubleshooting

### Common Issues

1. **Missing logs**: Check LOG_LEVEL configuration
2. **No context in logs**: Ensure logger service is injected properly
3. **Performance issues**: Check LOG_LEVEL isn't set to 'trace' in production
4. **Memory usage**: Adjust MAX_LOGS_IN_MEMORY or reduce log retention

### Debug Mode
```bash
# Enable trace logging for debugging
LOG_LEVEL=trace npm start

# Generate test logs
curl http://localhost:9991/logs/test

# Check log system health
curl http://localhost:9991/logs/health
```

## Migration Guide

### Replacing console.log
```typescript
// Before
console.log('User logged in:', userId);
console.warn('Slow query detected:', query);
console.error('Database error:', error);

// After
this.logger.info('User logged in', {
  component: 'AuthService',
  userId,
  tags: ['auth', 'login'],
});

this.logger.warn('Slow query detected', {
  component: 'DatabaseService',
  metadata: { query, duration },
  tags: ['database', 'performance'],
});

this.logger.logError(error, {
  component: 'DatabaseService',
  metadata: { query },
  tags: ['database', 'error'],
});
```

This structured logging system provides comprehensive observability for the 4G3N7 application while maintaining performance and security standards required for production deployments.