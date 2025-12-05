import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  DatabaseConfig,
  ReplicationConfig,
  DatabaseHealth,
  ReplicationStatus,
  QueryType
} from './replication.types';

@Injectable()
export class PrismaReplicationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaReplicationService.name);

  // Database clients
  private primaryClient: PrismaClient;
  private replicaClients: PrismaClient[] = [];

  // Configuration
  private config: ReplicationConfig;

  // Health monitoring
  private healthCheckInterval: NodeJS.Timeout;
  private currentPrimaryIndex = 0;
  private healthyReplicas: Set<number> = new Set();

  constructor() {
    this.config = this.loadConfiguration();
  }

  async onModuleInit() {
    await this.initializeClients();
    this.startHealthMonitoring();
    this.logger.log('Prisma replication service initialized');
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    await this.disconnectAllClients();
    this.logger.log('Prisma replication service destroyed');
  }

  /**
   * Get a database client based on query type
   */
  getClient(queryType: QueryType = QueryType.READ): PrismaClient {
    switch (queryType) {
      case QueryType.WRITE:
      case QueryType.TRANSACTION:
        return this.getPrimaryClient();

      case QueryType.READ:
        return this.getReplicaClient() || this.getPrimaryClient();

      default:
        return this.getPrimaryClient();
    }
  }

  /**
   * Get primary database client for write operations
   */
  private getPrimaryClient(): PrismaClient {
    return this.primaryClient;
  }

  /**
   * Get a healthy replica client for read operations
   */
  private getReplicaClient(): PrismaClient | null {
    if (this.healthyReplicas.size === 0) {
      this.logger.warn('No healthy replicas available, falling back to primary');
      return null;
    }

    // Simple round-robin load balancing
    const healthyIndices = Array.from(this.healthyReplicas);
    const index = healthyIndices[this.currentPrimaryIndex % healthyIndices.length];
    this.currentPrimaryIndex++;

    return this.replicaClients[index];
  }

  /**
   * Initialize database clients
   */
  private async initializeClients(): Promise<void> {
    try {
      // Initialize primary client
      this.primaryClient = this.createClient(this.config.primary);
      await this.primaryClient.$connect();
      this.logger.log(`Connected to primary database: ${this.config.primary.host}:${this.config.primary.port}`);

      // Initialize replica clients
      for (let i = 0; i < this.config.replicas.length; i++) {
        const replica = this.config.replicas[i];
        const client = this.createClient(replica);

        try {
          await client.$connect();
          this.replicaClients.push(client);
          this.healthyReplicas.add(i);
          this.logger.log(`Connected to replica database ${i}: ${replica.host}:${replica.port}`);
        } catch (error) {
          this.logger.error(`Failed to connect to replica ${i}: ${error.message}`);
          // Add client anyway for retry attempts
          this.replicaClients.push(client);
        }
      }

      this.logger.log(`Initialized ${this.replicaClients.length} replica clients`);
    } catch (error) {
      this.logger.error('Failed to initialize database clients', error.stack);
      throw error;
    }
  }

  /**
   * Create Prisma client with configuration
   */
  private createClient(config: DatabaseConfig): PrismaClient {
    const databaseUrl = this.buildDatabaseUrl(config);

    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error', 'warn'],
      // Enable query batching for better performance
      __internal: {
        engine: {
          // Connection pool settings
          connectionLimit: config.connectionLimit || 20,
          // Enable prepared statements
          usePreparedStatements: true,
        },
      },
    });
  }

  /**
   * Build database URL from configuration
   */
  private buildDatabaseUrl(config: DatabaseConfig): string {
    const {
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionTimeout,
      poolTimeout,
    } = config;

    const sslParam = ssl ? `&sslmode=${ssl}` : '';
    const timeoutParams = [
      connectionTimeout ? `&connect_timeout=${connectionTimeout}` : '',
      poolTimeout ? `&pool_timeout=${poolTimeout}` : '',
    ].join('');

    return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public${sslParam}${timeoutParams}`;
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    const interval = this.config.healthCheck?.interval || 30000; // 30 seconds default

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, interval);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform health check on all database instances
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check primary health
      const primaryHealth = await this.checkDatabaseHealth(this.primaryClient, 'primary');

      if (!primaryHealth.isHealthy) {
        this.logger.error(`Primary database unhealthy: ${primaryHealth.error}`);
        // Trigger failover if needed
        await this.handlePrimaryFailure();
      }

      // Check replica health
      for (let i = 0; i < this.replicaClients.length; i++) {
        const replicaHealth = await this.checkDatabaseHealth(
          this.replicaClients[i],
          `replica-${i}`
        );

        if (replicaHealth.isHealthy) {
          if (!this.healthyReplicas.has(i)) {
            this.healthyReplicas.add(i);
            this.logger.log(`Replica ${i} is now healthy`);
          }
        } else {
          if (this.healthyReplicas.has(i)) {
            this.healthyReplicas.delete(i);
            this.logger.warn(`Replica ${i} is unhealthy: ${replicaHealth.error}`);
          }

          // Try to reconnect to unhealthy replica
          await this.reconnectReplica(i);
        }
      }

      // Log current status
      this.logger.debug(
        `Health status: Primary=${primaryHealth.isHealthy}, ` +
        `Healthy replicas=${this.healthyReplicas.size}/${this.replicaClients.length}`
      );
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
    }
  }

  /**
   * Check health of a specific database instance
   */
  private async checkDatabaseHealth(
    client: PrismaClient,
    instanceName: string
  ): Promise<DatabaseHealth> {
    try {
      const startTime = Date.now();

      // Simple query to test connectivity
      await client.$queryRaw`SELECT 1 as health_check`;

      const responseTime = Date.now() - startTime;
      const maxResponseTime = this.config.healthCheck?.maxResponseTime || 5000; // 5 seconds default

      if (responseTime > maxResponseTime) {
        return {
          isHealthy: false,
          responseTime,
          error: `Response time ${responseTime}ms exceeds threshold ${maxResponseTime}ms`,
          timestamp: new Date(),
        };
      }

      return {
        isHealthy: true,
        responseTime,
        error: null,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: null,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Reconnect to a replica
   */
  private async reconnectReplica(index: number): Promise<void> {
    try {
      const config = this.config.replicas[index];
      const oldClient = this.replicaClients[index];

      // Disconnect old client
      try {
        await oldClient.$disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }

      // Create and connect new client
      const newClient = this.createClient(config);
      await newClient.$connect();

      this.replicaClients[index] = newClient;
      this.logger.log(`Successfully reconnected to replica ${index}`);
    } catch (error) {
      this.logger.error(`Failed to reconnect to replica ${index}: ${error.message}`);
    }
  }

  /**
   * Handle primary database failure
   */
  private async handlePrimaryFailure(): Promise<void> {
    if (!this.config.failover?.enabled) {
      this.logger.warn('Failover is disabled, cannot handle primary failure');
      return;
    }

    this.logger.warn('Primary database failure detected, initiating failover');

    // Find best replica for promotion
    const bestReplicaIndex = this.findBestReplicaForPromotion();

    if (bestReplicaIndex === -1) {
      this.logger.error('No healthy replicas available for failover');
      return;
    }

    try {
      // Promote replica to primary
      await this.promoteReplicaToPrimary(bestReplicaIndex);

      // Update configuration
      await this.updateConfigurationAfterFailover(bestReplicaIndex);

      this.logger.log(`Failover completed: replica ${bestReplicaIndex} promoted to primary`);

      // Send notification if configured
      if (this.config.failover?.notification) {
        await this.sendFailoverNotification(bestReplicaIndex);
      }
    } catch (error) {
      this.logger.error(`Failover failed: ${error.message}`);
    }
  }

  /**
   * Find the best replica for promotion
   */
  private findBestReplicaForPromotion(): number {
    let bestIndex = -1;
    let minLag = Infinity;

    for (const index of this.healthyReplicas) {
      // Check replication lag (this is a simplified approach)
      // In a real implementation, you'd query actual replication lag
      const lag = Math.random() * 1000; // Placeholder

      if (lag < minLag) {
        minLag = lag;
        bestIndex = index;
      }
    }

    return bestIndex;
  }

  /**
   * Promote a replica to primary (simplified implementation)
   */
  private async promoteReplicaToPrimary(replicaIndex: number): Promise<void> {
    // This is a simplified implementation
    // In a real setup, you'd need to:
    // 1. Stop replication on the chosen replica
    // 2. Promote it to primary
    // 3. Update other replicas to follow the new primary
    // 4. Update connection strings and routing

    this.logger.log(`Promoting replica ${replicaIndex} to primary`);

    // Update primary client to point to promoted replica
    const oldPrimaryClient = this.primaryClient;
    this.primaryClient = this.replicaClients[replicaIndex];

    // Remove promoted replica from pool
    this.replicaClients[replicaIndex] = null;
    this.healthyReplicas.delete(replicaIndex);

    // Disconnect old primary
    try {
      await oldPrimaryClient.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  }

  /**
   * Update configuration after failover
   */
  private async updateConfigurationAfterFailover(promotedReplicaIndex: number): Promise<void> {
    // Update the configuration to reflect the new primary
    const promotedConfig = this.config.replicas[promotedReplicaIndex];
    this.config.primary = { ...promotedConfig };

    // Remove promoted replica from replica list
    this.config.replicas.splice(promotedReplicaIndex, 1);

    // Note: In a real implementation, you'd persist this change
    // and potentially trigger a recreation of the failed primary as a replica
  }

  /**
   * Send failover notification
   */
  private async sendFailoverNotification(replicaIndex: number): Promise<void> {
    const notification = this.config.failover?.notification;

    if (notification?.webhook) {
      try {
        await fetch(notification.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'failover',
            timestamp: new Date().toISOString(),
            promotedReplica: replicaIndex,
            message: `Database failover: replica ${replicaIndex} promoted to primary`,
          }),
        });
      } catch (error) {
        this.logger.error(`Failed to send failover notification: ${error.message}`);
      }
    }
  }

  /**
   * Get current replication status
   */
  async getReplicationStatus(): Promise<ReplicationStatus> {
    const primaryHealth = await this.checkDatabaseHealth(this.primaryClient, 'primary');

    const replicaStatuses = [];
    for (let i = 0; i < this.replicaClients.length; i++) {
      const health = await this.checkDatabaseHealth(this.replicaClients[i], `replica-${i}`);
      replicaStatuses.push({
        index: i,
        isHealthy: health.isHealthy,
        responseTime: health.responseTime,
        error: health.error,
        isInPool: this.healthyReplicas.has(i),
      });
    }

    return {
      primary: {
        isHealthy: primaryHealth.isHealthy,
        responseTime: primaryHealth.responseTime,
        error: primaryHealth.error,
      },
      replicas: replicaStatuses,
      healthyReplicaCount: this.healthyReplicas.size,
      totalReplicaCount: this.replicaClients.length,
      timestamp: new Date(),
    };
  }

  /**
   * Disconnect all database clients
   */
  private async disconnectAllClients(): Promise<void> {
    const disconnectPromises = [
      this.primaryClient?.$disconnect(),
      ...this.replicaClients.map(client => client?.$disconnect()),
    ].filter(Boolean);

    await Promise.allSettled(disconnectPromises);
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): ReplicationConfig {
    // Primary database configuration
    const primary: DatabaseConfig = {
      host: process.env.DATABASE_PRIMARY_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PRIMARY_PORT || '5432'),
      database: process.env.DATABASE_NAME || '4g3n7db',
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      ssl: process.env.DATABASE_SSL || 'prefer',
      connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
      poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '30000'),
    };

    // Replica configurations
    const replicaConfigs = process.env.DATABASE_REPLICAS?.split(',') || [];
    const replicas: DatabaseConfig[] = replicaConfigs.map((config, index) => {
      const [host, port] = config.split(':');
      return {
        host: host || 'localhost',
        port: parseInt(port || (5433 + index).toString()),
        database: primary.database,
        username: primary.username,
        password: primary.password,
        ssl: primary.ssl,
        connectionLimit: primary.connectionLimit,
        connectionTimeout: primary.connectionTimeout,
        poolTimeout: primary.poolTimeout,
      };
    });

    return {
      primary,
      replicas: replicas.length > 0 ? replicas : [
        // Default replica configuration
        {
          host: 'localhost',
          port: 5433,
          database: primary.database,
          username: primary.username,
          password: primary.password,
          ssl: primary.ssl,
          connectionLimit: primary.connectionLimit,
          connectionTimeout: primary.connectionTimeout,
          poolTimeout: primary.poolTimeout,
        }
      ],
      healthCheck: {
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
        maxResponseTime: parseInt(process.env.HEALTH_CHECK_MAX_RESPONSE_TIME || '5000'),
      },
      failover: {
        enabled: process.env.FAILOVER_ENABLED !== 'false',
        notification: {
          webhook: process.env.FAILOVER_WEBHOOK_URL,
        },
      },
    };
  }
}