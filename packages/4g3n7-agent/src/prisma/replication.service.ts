import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  primary: {
    url: string;
    maxConnections?: number;
  };
  replicas?: Array<{
    url: string;
    maxConnections?: number;
    weight?: number;
  }>;
  healthCheckInterval?: number;
  failoverTimeout?: number;
}

export interface ReplicationStats {
  totalQueries: number;
  readQueries: number;
  writeQueries: number;
  replicaQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  lastFailover?: Date;
}

@Injectable()
export class PrismaReplicationService implements OnModuleInit {
  private readonly logger = new Logger(PrismaReplicationService.name);
  private primaryClient!: PrismaClient;
  private replicaClients: PrismaClient[] = [];
  private currentReplicaIndex = 0;
  private config: DatabaseConfig;
  private stats: ReplicationStats = {
    totalQueries: 0,
    readQueries: 0,
    writeQueries: 0,
    replicaQueries: 0,
    failedQueries: 0,
    averageResponseTime: 0,
  };
  private lastHealthCheck = new Date();

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
  }

  private loadConfig(): DatabaseConfig {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    const config: DatabaseConfig = {
      primary: {
        url: databaseUrl,
        maxConnections: this.configService.get<number>(
          'DATABASE_MAX_CONNECTIONS',
          20,
        ),
      },
      replicas: [],
      healthCheckInterval: this.configService.get<number>(
        'DATABASE_HEALTH_CHECK_INTERVAL',
        30000,
      ),
      failoverTimeout: this.configService.get<number>(
        'DATABASE_FAILOVER_TIMEOUT',
        5000,
      ),
    };

    // Load replica configurations
    const replicaUrls = this.configService.get<string>(
      'DATABASE_REPLICA_URLS',
      '',
    );
    if (replicaUrls) {
      const urls = replicaUrls.split(',').map((url) => url.trim());
      config.replicas = urls.map((url, index) => ({
        url,
        maxConnections: this.configService.get<number>(
          `DATABASE_REPLICA_${index}_MAX_CONNECTIONS`,
          10,
        ),
        weight: this.configService.get<number>(
          `DATABASE_REPLICA_${index}_WEIGHT`,
          1,
        ),
      }));
    }

    return config;
  }

  async onModuleInit() {
    await this.initializeClients();
    this.startHealthChecks();
    this.logger.log(
      `Prisma replication initialized with ${this.replicaClients.length} replicas`,
    );
  }

  private async initializeClients(): Promise<void> {
    // Initialize primary client
    this.primaryClient = new PrismaClient({
      datasources: {
        db: {
          url: this.config.primary.url,
        },
      },
    });

    // Initialize replica clients
    if (this.config.replicas) {
      for (const replica of this.config.replicas) {
        try {
          const client = new PrismaClient({
            datasources: {
              db: {
                url: replica.url,
              },
            },
          });

          // Test connection
          await client.$connect();
          this.replicaClients.push(client);
          this.logger.log(`Replica connected: ${replica.url}`);
        } catch (error) {
          this.logger.error(
            `Failed to connect to replica ${replica.url}:`,
            error,
          );
        }
      }
    }

    // Ensure we have at least the primary connection
    try {
      await this.primaryClient.$connect();
      this.logger.log('Primary database connected');
    } catch (error) {
      this.logger.error('Failed to connect to primary database:', error);
      throw error;
    }
  }

  private startHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const now = new Date();
    this.lastHealthCheck = now;

    // Check primary health
    try {
      await this.primaryClient.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error('Primary database health check failed:', error);
    }

    // Check replica health
    for (let i = 0; i < this.replicaClients.length; i++) {
      try {
        await this.replicaClients[i].$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.warn(`Replica ${i} health check failed:`, error);
        // Optionally remove unhealthy replica
        // this.replicaClients.splice(i, 1);
      }
    }
  }

  getReadClient(): PrismaClient {
    if (this.replicaClients.length === 0) {
      return this.primaryClient;
    }

    // Simple round-robin selection
    const client = this.replicaClients[this.currentReplicaIndex];
    this.currentReplicaIndex =
      (this.currentReplicaIndex + 1) % this.replicaClients.length;

    this.stats.readQueries++;
    this.stats.replicaQueries++;

    return client;
  }

  getWriteClient(): PrismaClient {
    this.stats.writeQueries++;
    return this.primaryClient;
  }

  getClient(readOnly: boolean = false): PrismaClient {
    this.stats.totalQueries++;

    if (readOnly && this.replicaClients.length > 0) {
      return this.getReadClient();
    }

    return this.getWriteClient();
  }

  async query<T = any>(
    callback: (prisma: PrismaClient) => Promise<T>,
    readOnly: boolean = false,
  ): Promise<T> {
    const startTime = Date.now();
    const client = this.getClient(readOnly);

    try {
      const result = await callback(client);
      this.updateResponseTime(Date.now() - startTime);
      return result;
    } catch (error) {
      this.stats.failedQueries++;
      this.logger.error('Database query failed:', error);

      // If replica query fails, fallback to primary for read queries
      if (readOnly && this.replicaClients.length > 0) {
        this.logger.warn('Replica query failed, falling back to primary');
        return await callback(this.primaryClient);
      }

      throw error;
    }
  }

  async transaction<T = any>(
    callback: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    // Always use primary for transactions
    return (await this.primaryClient.$transaction((tx) => callback(tx as PrismaClient))) as T;
  }

  private updateResponseTime(responseTime: number): void {
    const totalResponseTime =
      this.stats.averageResponseTime * (this.stats.totalQueries - 1) +
      responseTime;
    this.stats.averageResponseTime =
      totalResponseTime / this.stats.totalQueries;
  }

  getStats(): ReplicationStats {
    return { ...this.stats };
  }

  async disconnect(): Promise<void> {
    await this.primaryClient.$disconnect();

    for (const client of this.replicaClients) {
      await client.$disconnect();
    }

    this.logger.log('All database connections closed');
  }

  async addReplica(url: string, maxConnections?: number): Promise<void> {
    try {
      const client = new PrismaClient({
        datasources: {
          db: { url },
        },
      });

      await client.$connect();

      this.replicaClients.push(client);
      this.logger.log(`New replica added: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to add replica ${url}:`, error);
      throw error;
    }
  }

  async removeReplica(index: number): Promise<void> {
    if (index >= 0 && index < this.replicaClients.length) {
      await this.replicaClients[index].$disconnect();
      this.replicaClients.splice(index, 1);
      this.logger.log(`Replica ${index} removed`);
    }
  }

  getReplicaCount(): number {
    return this.replicaClients.length;
  }

  async testReplicationLag(): Promise<number | null> {
    if (this.replicaClients.length === 0) {
      return null;
    }

    try {
      // Write test data to primary
      const testId = `test_${Date.now()}`;
      await this.primaryClient
        .$executeRaw`INSERT INTO __test_replication (id, created_at) VALUES (${testId}, NOW())`;

      // Wait a moment for replication
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read from replica
      const replicaClient = this.getReadClient();
      const result = await replicaClient.$queryRaw<Array<{ created_at: Date }>>`
        SELECT created_at FROM __test_replication WHERE id = ${testId}
      `;

      // Clean up test data
      await this.primaryClient
        .$executeRaw`DELETE FROM __test_replication WHERE id = ${testId}`;

      if (result.length > 0) {
        const replicaTime = new Date(result[0].created_at).getTime();
        const primaryTime = Date.now();
        return primaryTime - replicaTime;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to test replication lag:', error);
      return null;
    }
  }
}
