import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Optimized connection pooling for AI workloads
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');

      // Test connection with a simple query
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connection test passed');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Database health check failed');
      return {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Bulk operations with transaction support
  async bulkTransaction<T>(operations: (() => Promise<T>)[]) {
    return await this.$transaction((ops: any) => {
      return Promise.all(ops.map((op: any) => op()));
    });
  }

  // Optimized query for large datasets
  async findManyWithCursor<T>(
    model: any,
    where: any = {},
    orderBy: any = { createdAt: 'desc' },
    take: number = 50,
    cursor?: string,
  ) {
    const query: any = {
      where,
      orderBy,
      take,
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1; // Skip the cursor item
    }

    return await (this[model] as any).findMany(query);
  }
}
