import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class PrismaOptimizedService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private logger: LoggerService;

  constructor() {
    super({
      log: ['warn', 'error'],
      // Configure connection limits
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Initialize logger for database operations
    this.logger = new LoggerService(null as any) as any;
  }

  async onModuleInit() {
    await this.$connect();

    // Optimize connection pool
    (this.$on as any)('beforeExit', async () => {
      this.logger.info('Prisma client is disconnecting...', {
        component: 'PrismaOptimizedService',
        tags: ['database', 'lifecycle'],
      });
    });

    // Monitor slow queries
    (this.$on as any)('query', (e: any) => {
      if (e.duration > 1000) {
        // Log queries taking longer than 1 second
        this.logger.warn(`Slow Query detected`, {
          component: 'PrismaOptimizedService',
          duration: e.duration,
          metadata: {
            query: e.query.substring(0, 200), // Limit query length in logs
            duration: e.duration,
            target: e.target,
          },
          tags: ['database', 'slow-query', 'performance'],
        });
      } else {
        this.logger.debug(`Database query executed`, {
          component: 'PrismaOptimizedService',
          duration: e.duration,
          metadata: {
            query: e.query.substring(0, 100), // Limit query length in debug logs
            duration: e.duration,
            target: e.target,
          },
          tags: ['database', 'query'],
        });
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Batch operations for better performance
  async createManyWithTransaction<T>(
    createData: T[],
    model: any,
  ): Promise<T[]> {
    if (createData.length === 0) return [];

    return this.$transaction(async (tx: any) => {
      // Create in batches to avoid memory issues
      const batchSize = 100;
      const results: T[] = [];

      for (let i = 0; i < createData.length; i += batchSize) {
        const batch = createData.slice(i, i + batchSize);
        const batchResults = await (tx[model] as any).createMany({
          data: batch,
          skipDuplicates: true,
        });
        results.push(...(batchResults as any));
      }

      return results;
    });
  }

  // Optimized pagination using cursor
  async paginateWithCursor<T>(
    model: any,
    options: {
      where?: any;
      orderBy?: any;
      select?: any;
      cursor?: string;
      take?: number;
      skip?: number;
    },
  ): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
    const { cursor, take = 50, ...rest } = options;

    const data = await (this[model] as any).findMany({
      ...rest,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      take: take + 1, // Take one extra to determine if there's more data
    });

    const hasMore = data.length > take;
    if (hasMore) {
      data.pop(); // Remove the extra item
    }

    const nextCursor =
      hasMore && data.length > 0
        ? (data[data.length - 1] as any).id
        : undefined;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  // Health check with connection pool monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    connectionPool: any;
    databaseStats: any;
  }> {
    try {
      // Test basic connectivity
      await this.$queryRaw`SELECT 1`;

      // Get connection pool stats (PostgreSQL specific)
      const connectionStats = await this.$queryRaw`
        SELECT
          state,
          COUNT(*) as connections
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
      `;

      // Get database size stats
      const dbStats = await this.$queryRaw`
        SELECT
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT COUNT(*) FROM "Task") as task_count,
          (SELECT COUNT(*) FROM "Message") as message_count,
          (SELECT COUNT(*) FROM "File") as file_count
      `;

      // Determine health status
      const activeConnections = (connectionStats as any).find(
        (s: any) => s.state === 'active',
      );
      const isHealthy =
        !activeConnections || activeConnections.connections < 100;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        connectionPool: connectionStats,
        databaseStats: (dbStats as any)[0],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Database health check failed:', {
        component: 'PrismaOptimizedService',
        metadata: { errorMessage },
        tags: ['database', 'error'],
      });
      return {
        status: 'unhealthy',
        connectionPool: null,
        databaseStats: null,
      };
    }
  }

  // Bulk delete with soft delete support
  async softDeleteMany<T>(
    model: string,
    where: any,
  ): Promise<{ count: number }> {
    return this.$transaction(async (tx: any) => {
      // Mark as deleted instead of actually deleting
      const result = await tx[model].updateMany({
        where,
        data: {
          deletedAt: new Date(),
        },
      });

      return { count: result.count };
    });
  }

  // Performance monitoring
  async getQueryStats(): Promise<any> {
    try {
      const stats = await this.$queryRaw`
        SELECT
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          rows
        FROM pg_stat_statements
        WHERE calls > 10
        ORDER BY total_exec_time DESC
        LIMIT 20
      `;

      return stats;
    } catch (error) {
      this.logger.warn(
        'Query stats not available (pg_stat_statements extension may need to be enabled)',
      );
      return [];
    }
  }

  // Cleanup old data
  async cleanupOldData(
    options: {
      taskRetentionDays?: number;
      messageRetentionDays?: number;
      fileRetentionDays?: number;
    } = {},
  ): Promise<{ deleted: { tasks: number; messages: number; files: number } }> {
    const {
      taskRetentionDays = 90,
      messageRetentionDays = 60,
      fileRetentionDays = 30,
    } = options;

    return this.$transaction(async (tx: any) => {
      // Delete old completed tasks
      const tasksDeleted = await (tx as any).task.deleteMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            lt: new Date(Date.now() - taskRetentionDays * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Delete old messages (only from completed/archived tasks)
      const messagesDeleted = await tx.message.deleteMany({
        where: {
          task: {
            status: 'COMPLETED',
            completedAt: {
              lt: new Date(
                Date.now() - messageRetentionDays * 24 * 60 * 60 * 1000,
              ),
            },
          },
        },
      });

      // Delete old files (only from completed/archived tasks)
      const filesDeleted = await tx.file.deleteMany({
        where: {
          task: {
            status: 'COMPLETED',
            completedAt: {
              lt: new Date(
                Date.now() - fileRetentionDays * 24 * 60 * 60 * 1000,
              ),
            },
          },
        },
      });

      return {
        deleted: {
          tasks: tasksDeleted.count,
          messages: messagesDeleted.count,
          files: filesDeleted.count,
        },
      };
    });
  }
}
