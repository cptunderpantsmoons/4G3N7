/**
 * API Key Management Service
 * Manages API keys for accessing Goose capabilities
 */

import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

export interface ApiKey {
  id: string;
  key: string; // Hashed
  name: string;
  userId: string;
  scopes: string[]; // Allowed extension IDs or capabilities
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  revoked: boolean;
}

export interface ApiKeyValidation {
  valid: boolean;
  key?: ApiKey;
  reason?: string;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private keys: Map<string, ApiKey> = new Map(); // keyId -> ApiKey
  private keyHashes: Map<string, string> = new Map(); // hash -> keyId

  /**
   * Generate a new API key
   */
  generateKey(
    userId: string,
    name: string,
    scopes: string[],
    expiresAt?: Date
  ): { id: string; key: string } {
    const id = this.generateId();
    const rawKey = this.generateRawKey();
    const hashedKey = this.hashKey(rawKey);

    const apiKey: ApiKey = {
      id,
      key: hashedKey,
      name,
      userId,
      scopes,
      createdAt: new Date(),
      expiresAt,
      revoked: false,
    };

    this.keys.set(id, apiKey);
    this.keyHashes.set(hashedKey, id);

    this.logger.log(`API key generated for user ${userId}: ${name}`);

    // Return the raw key (only time it's visible)
    return { id, key: rawKey };
  }

  /**
   * Validate an API key
   */
  validateKey(rawKey: string): ApiKeyValidation {
    const hashedKey = this.hashKey(rawKey);
    const keyId = this.keyHashes.get(hashedKey);

    if (!keyId) {
      return { valid: false, reason: 'Invalid API key' };
    }

    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      return { valid: false, reason: 'API key not found' };
    }

    if (apiKey.revoked) {
      return { valid: false, reason: 'API key has been revoked' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, reason: 'API key has expired' };
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    this.keys.set(keyId, apiKey);

    return { valid: true, key: apiKey };
  }

  /**
   * Revoke an API key
   */
  revokeKey(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      return false;
    }

    apiKey.revoked = true;
    this.keys.set(keyId, apiKey);

    this.logger.log(`API key revoked: ${keyId}`);

    return true;
  }

  /**
   * Delete an API key
   */
  deleteKey(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      return false;
    }

    this.keys.delete(keyId);
    this.keyHashes.delete(apiKey.key);

    this.logger.log(`API key deleted: ${keyId}`);

    return true;
  }

  /**
   * Get API key by ID
   */
  getKey(keyId: string): ApiKey | null {
    return this.keys.get(keyId) || null;
  }

  /**
   * List user's API keys
   */
  getUserKeys(userId: string): ApiKey[] {
    return Array.from(this.keys.values())
      .filter(key => key.userId === userId)
      .map(key => ({
        ...key,
        key: '***', // Never expose the hashed key
      }));
  }

  /**
   * Check if key has scope
   */
  hasScope(apiKey: ApiKey, scope: string): boolean {
    // '*' means all scopes
    if (apiKey.scopes.includes('*')) {
      return true;
    }

    return apiKey.scopes.includes(scope);
  }

  /**
   * Rotate API key
   */
  rotateKey(keyId: string): { id: string; key: string } | null {
    const oldKey = this.keys.get(keyId);

    if (!oldKey) {
      return null;
    }

    // Revoke old key
    this.revokeKey(keyId);

    // Generate new key with same settings
    return this.generateKey(
      oldKey.userId,
      oldKey.name,
      oldKey.scopes,
      oldKey.expiresAt
    );
  }

  /**
   * Clean up expired keys
   */
  cleanupExpiredKeys(): number {
    let removed = 0;
    const now = new Date();

    for (const [keyId, apiKey] of this.keys.entries()) {
      if (apiKey.expiresAt && apiKey.expiresAt < now) {
        this.deleteKey(keyId);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} expired API keys`);
    }

    return removed;
  }

  /**
   * Get API key statistics
   */
  getStats() {
    const total = this.keys.size;
    let active = 0;
    let revoked = 0;
    let expired = 0;
    const now = new Date();

    for (const apiKey of this.keys.values()) {
      if (apiKey.revoked) {
        revoked++;
      } else if (apiKey.expiresAt && apiKey.expiresAt < now) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total,
      active,
      revoked,
      expired,
    };
  }

  /**
   * Generate random key ID
   */
  private generateId(): string {
    return `gk_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate raw API key
   */
  private generateRawKey(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }

  /**
   * Hash API key
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
