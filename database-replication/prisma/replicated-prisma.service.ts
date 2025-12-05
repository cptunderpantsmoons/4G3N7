import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaReplicationService } from './replication.service';
import { QueryType, QueryMetadata } from './replication.types';

/**
 * Enhanced Prisma service with automatic read/write splitting
 * This service provides a Prisma-like interface that automatically routes
 * read queries to replicas and write queries to the primary database.
 */
@Injectable()
export class ReplicatedPrismaService {
  private readonly logger = new Logger(ReplicatedPrismaService.name);
  private queryCount = 0;
  private errorCount = 0;
  private readonly queryMetadata: QueryMetadata[] = [];
  private readonly maxMetadataEntries = 1000;

  constructor(private readonly replicationService: PrismaReplicationService) {}

  /**
   * Helper method to get appropriate Prisma client
   */
  private getClient(queryType: QueryType): PrismaClient {
    return this.replicationService.getClient(queryType);
  }

  /**
   * Record query metadata
   */
  private recordQuery(
    type: QueryType,
    model: string,
    operation: string,
    startTime: number,
    success: boolean = true,
    error?: string
  ): void {
    const duration = Date.now() - startTime;
    const metadata: QueryMetadata = {
      type,
      model,
      operation,
      timestamp: new Date(),
      duration,
      success,
      error,
    };

    // Add to metadata array (with limit)
    this.queryMetadata.push(metadata);
    if (this.queryMetadata.length > this.maxMetadataEntries) {
      this.queryMetadata.shift();
    }

    // Update counters
    this.queryCount++;
    if (!success) {
      this.errorCount++;
    }

    // Log slow queries
    if (duration > 5000) { // 5 seconds
      this.logger.warn(
        `Slow query detected: ${model}.${operation} took ${duration}ms (${type})`
      );
    }

    // Log errors
    if (!success) {
      this.logger.error(
        `Query failed: ${model}.${operation} (${type}) - ${error}`
      );
    }
  }

  // READ OPERATIONS - Route to replicas

  async findUnique(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].findUnique(args);
      this.recordQuery(QueryType.READ, model, 'findUnique', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'findUnique', startTime, false, error.message);
      throw error;
    }
  }

  async findMany(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].findMany(args);
      this.recordQuery(QueryType.READ, model, 'findMany', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'findMany', startTime, false, error.message);
      throw error;
    }
  }

  async findFirst(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].findFirst(args);
      this.recordQuery(QueryType.READ, model, 'findFirst', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'findFirst', startTime, false, error.message);
      throw error;
    }
  }

  async count(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].count(args);
      this.recordQuery(QueryType.READ, model, 'count', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'count', startTime, false, error.message);
      throw error;
    }
  }

  async aggregate(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].aggregate(args);
      this.recordQuery(QueryType.READ, model, 'aggregate', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'aggregate', startTime, false, error.message);
      throw error;
    }
  }

  async groupBy(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ);

    try {
      const result = await (client as any)[model].groupBy(args);
      this.recordQuery(QueryType.READ, model, 'groupBy', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, model, 'groupBy', startTime, false, error.message);
      throw error;
    }
  }

  // WRITE OPERATIONS - Route to primary

  async create(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].create(args);
      this.recordQuery(QueryType.WRITE, model, 'create', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'create', startTime, false, error.message);
      throw error;
    }
  }

  async update(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].update(args);
      this.recordQuery(QueryType.WRITE, model, 'update', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'update', startTime, false, error.message);
      throw error;
    }
  }

  async updateMany(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].updateMany(args);
      this.recordQuery(QueryType.WRITE, model, 'updateMany', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'updateMany', startTime, false, error.message);
      throw error;
    }
  }

  async delete(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].delete(args);
      this.recordQuery(QueryType.WRITE, model, 'delete', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'delete', startTime, false, error.message);
      throw error;
    }
  }

  async deleteMany(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].deleteMany(args);
      this.recordQuery(QueryType.WRITE, model, 'deleteMany', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'deleteMany', startTime, false, error.message);
      throw error;
    }
  }

  async upsert(args: any, model: string) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE);

    try {
      const result = await (client as any)[model].upsert(args);
      this.recordQuery(QueryType.WRITE, model, 'upsert', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, model, 'upsert', startTime, false, error.message);
      throw error;
    }
  }

  // TRANSACTION OPERATIONS - Route to primary

  async $transaction(fn: any, options?: any) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.TRANSACTION);

    try {
      const result = await client.$transaction(fn, options);
      this.recordQuery(QueryType.TRANSACTION, 'transaction', '$transaction', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.TRANSACTION, 'transaction', '$transaction', startTime, false, error.message);
      throw error;
    }
  }

  async $executeRaw(query: any, ...values: any[]) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.WRITE); // Assume write for raw queries

    try {
      const result = await client.$executeRaw(query, ...values);
      this.recordQuery(QueryType.WRITE, 'raw', '$executeRaw', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.WRITE, 'raw', '$executeRaw', startTime, false, error.message);
      throw error;
    }
  }

  async $queryRaw(query: any, ...values: any[]) {
    const startTime = Date.now();
    const client = this.getClient(QueryType.READ); // Assume read for raw queries

    try {
      const result = await client.$queryRaw(query, ...values);
      this.recordQuery(QueryType.READ, 'raw', '$queryRaw', startTime);
      return result;
    } catch (error) {
      this.recordQuery(QueryType.READ, 'raw', '$queryRaw', startTime, false, error.message);
      throw error;
    }
  }

  // HEALTH AND METRICS

  async getReplicationStatus() {
    return this.replicationService.getReplicationStatus();
  }

  getQueryMetrics() {
    const recentQueries = this.queryMetadata.slice(-100); // Last 100 queries
    const recentReadQueries = recentQueries.filter(q => q.type === QueryType.READ);
    const recentWriteQueries = recentQueries.filter(q => q.type === QueryType.WRITE);

    return {
      totalQueries: this.queryCount,
      totalErrors: this.errorCount,
      errorRate: this.queryCount > 0 ? (this.errorCount / this.queryCount) * 100 : 0,
      recentQueries: {
        total: recentQueries.length,
        read: recentReadQueries.length,
        write: recentWriteQueries.length,
        averageResponseTime: this.calculateAverageResponseTime(recentQueries),
      },
      successRate: this.queryCount > 0 ? ((this.queryCount - this.errorCount) / this.queryCount) * 100 : 0,
    };
  }

  private calculateAverageResponseTime(queries: QueryMetadata[]): number {
    if (queries.length === 0) return 0;

    const totalTime = queries.reduce((sum, query) => sum + (query.duration || 0), 0);
    return Math.round(totalTime / queries.length);
  }

  // CONVENIENCE METHODS FOR 4G3N7 MODELS

  // Task operations
  async findTask(args: any) {
    return this.findUnique(args, 'task');
  }

  async findTasks(args: any) {
    return this.findMany(args, 'task');
  }

  async createTask(args: any) {
    return this.create(args, 'task');
  }

  async updateTask(args: any) {
    return this.update(args, 'task');
  }

  async deleteTask(args: any) {
    return this.delete(args, 'task');
  }

  // Message operations
  async findMessage(args: any) {
    return this.findUnique(args, 'message');
  }

  async findMessages(args: any) {
    return this.findMany(args, 'message');
  }

  async createMessage(args: any) {
    return this.create(args, 'message');
  }

  // Summary operations
  async findSummary(args: any) {
    return this.findUnique(args, 'summary');
  }

  async findSummaries(args: any) {
    return this.findMany(args, 'summary');
  }

  async createSummary(args: any) {
    return this.create(args, 'summary');
  }

  // File operations
  async findFile(args: any) {
    return this.findUnique(args, 'file');
  }

  async findFiles(args: any) {
    return this.findMany(args, 'file');
  }

  async createFile(args: any) {
    return this.create(args, 'file');
  }

  async deleteFile(args: any) {
    return this.delete(args, 'file');
  }
}