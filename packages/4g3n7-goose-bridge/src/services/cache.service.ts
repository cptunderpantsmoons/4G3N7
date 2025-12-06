import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // time to live in milliseconds
  namespace?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Cache Service - Redis-backed caching with TTL and pattern-based invalidation
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };
  private readonly namespace: string = 'cache:';

  constructor(private readonly redisUrl: string = 'redis://localhost:6379') {}

  async onModuleInit(): Promise<void> {
    try {
      this.redisClient = new Redis(this.redisUrl);
      await this.redisClient.ping();
      this.logger.log('Cache Service initialized with IORedis');
    } catch (error) {
      this.logger.error('Failed to initialize Cache Service', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return null;
      }
      const fullKey = this.buildKey(key, options);
      const value = await this.redisClient.get(fullKey);

      if (value) {
        this.stats.hits++;
        this.updateHitRate();
        return JSON.parse(value) as T;
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return;
      }
      const fullKey = this.buildKey(key, options);
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.redisClient.setex(
          fullKey,
          Math.ceil(options.ttl / 1000), // convert ms to seconds
          serialized
        );
      } else {
        await this.redisClient.set(fullKey, serialized);
      }

      this.stats.sets++;
    } catch (error) {
      this.logger.error(`Error setting cache key: ${key}`, error);
    }
  }

  /**
   * Delete a cache entry
   */
  async delete(key: string, options?: CacheOptions): Promise<number> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return 0;
      }
      const fullKey = this.buildKey(key, options);
      const result = await this.redisClient.del(fullKey);
      if (result > 0) {
        this.stats.deletes += result;
      }
      return result;
    } catch (error) {
      this.logger.error(`Error deleting cache key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Clear cache by pattern
   */
  async clear(pattern: string, options?: CacheOptions): Promise<number> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return 0;
      }
      const fullPattern = this.buildKey(pattern, options);
      const keys = await this.redisClient.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redisClient.del(...keys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      this.logger.error(`Error clearing cache pattern: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return;
      }
      const pattern = `${this.namespace}*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        this.stats.deletes += keys.length;
      }
      this.logger.log('All cache cleared');
    } catch (error) {
      this.logger.error('Error clearing all cache', error);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return false;
      }
      const fullKey = this.buildKey(key, options);
      const result = await this.redisClient.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key existence: ${key}`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Get TTL of a key
   */
  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return -1;
      }
      const fullKey = this.buildKey(key, options);
      return await this.redisClient.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Error getting TTL for key: ${key}`, error);
      return -1;
    }
  }

  /**
   * Set TTL for existing key
   */
  async setTTL(
    key: string,
    ttl: number,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      if (!this.redisClient) {
        this.logger.warn('Redis client not initialized');
        return false;
      }
      const fullKey = this.buildKey(key, options);
      const result = await this.redisClient.expire(
        fullKey,
        Math.ceil(ttl / 1000)
      );
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting TTL for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Build full key with namespace
   */
  private buildKey(key: string, options?: CacheOptions): string {
    const namespace = options?.namespace || this.namespace;
    return `${namespace}${key}`;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Cleanup on application shutdown
   */
  async onApplicationShutdown(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Cache Service disconnected from Redis');
    }
  }
}
