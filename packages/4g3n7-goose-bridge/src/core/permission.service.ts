/**
 * Permission Service
 * Manages capability-based access control for extensions
 */

import { Injectable, Logger } from '@nestjs/common';
import { Permission } from '../interfaces/types';

export interface PermissionGrant {
  userId: string;
  extensionId: string;
  permissions: string[];
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ResourceLimit {
  extensionId: string;
  maxConcurrentTasks?: number;
  maxMemory?: number; // in bytes
  maxCpu?: number; // percentage
  timeout?: number; // in milliseconds
  maxFileSize?: number; // in bytes
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private grants: Map<string, PermissionGrant[]> = new Map(); // userId -> grants
  private limits: Map<string, ResourceLimit> = new Map(); // extensionId -> limits

  /**
   * Grant permissions to a user for an extension
   */
  grantPermissions(
    userId: string,
    extensionId: string,
    permissions: string[],
    expiresAt?: Date
  ): void {
    const grant: PermissionGrant = {
      userId,
      extensionId,
      permissions,
      grantedAt: new Date(),
      expiresAt,
    };

    const userGrants = this.grants.get(userId) || [];
    
    // Remove existing grant for this extension
    const filtered = userGrants.filter(g => g.extensionId !== extensionId);
    filtered.push(grant);
    
    this.grants.set(userId, filtered);

    this.logger.log(`Permissions granted to user ${userId} for extension ${extensionId}`, {
      permissions,
    });
  }

  /**
   * Revoke permissions from a user for an extension
   */
  revokePermissions(userId: string, extensionId: string): void {
    const userGrants = this.grants.get(userId) || [];
    const filtered = userGrants.filter(g => g.extensionId !== extensionId);
    
    this.grants.set(userId, filtered);

    this.logger.log(`Permissions revoked from user ${userId} for extension ${extensionId}`);
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, extensionId: string, permission: string): boolean {
    const userGrants = this.grants.get(userId) || [];
    const grant = userGrants.find(g => g.extensionId === extensionId);

    if (!grant) {
      return false;
    }

    // Check if grant expired
    if (grant.expiresAt && grant.expiresAt < new Date()) {
      this.logger.warn(`Permission expired for user ${userId} on extension ${extensionId}`);
      return false;
    }

    return grant.permissions.includes(permission);
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(userId: string, extensionId: string, permissions: string[]): boolean {
    return permissions.every(permission => 
      this.hasPermission(userId, extensionId, permission)
    );
  }

  /**
   * Get user permissions for extension
   */
  getUserPermissions(userId: string, extensionId: string): string[] {
    const userGrants = this.grants.get(userId) || [];
    const grant = userGrants.find(g => g.extensionId === extensionId);

    if (!grant || (grant.expiresAt && grant.expiresAt < new Date())) {
      return [];
    }

    return grant.permissions;
  }

  /**
   * Get all user grants
   */
  getUserGrants(userId: string): PermissionGrant[] {
    return this.grants.get(userId) || [];
  }

  /**
   * Set resource limits for extension
   */
  setResourceLimits(extensionId: string, limits: Omit<ResourceLimit, 'extensionId'>): void {
    this.limits.set(extensionId, {
      extensionId,
      ...limits,
    });

    this.logger.log(`Resource limits set for extension ${extensionId}`, limits);
  }

  /**
   * Get resource limits for extension
   */
  getResourceLimits(extensionId: string): ResourceLimit | null {
    return this.limits.get(extensionId) || null;
  }

  /**
   * Check if resource usage is within limits
   */
  checkResourceUsage(
    extensionId: string,
    usage: {
      concurrentTasks?: number;
      memory?: number;
      cpu?: number;
      fileSize?: number;
    }
  ): { allowed: boolean; violations: string[] } {
    const limits = this.limits.get(extensionId);

    if (!limits) {
      return { allowed: true, violations: [] };
    }

    const violations: string[] = [];

    if (limits.maxConcurrentTasks && usage.concurrentTasks && usage.concurrentTasks > limits.maxConcurrentTasks) {
      violations.push(`Concurrent tasks limit exceeded: ${usage.concurrentTasks} > ${limits.maxConcurrentTasks}`);
    }

    if (limits.maxMemory && usage.memory && usage.memory > limits.maxMemory) {
      violations.push(`Memory limit exceeded: ${usage.memory} > ${limits.maxMemory}`);
    }

    if (limits.maxCpu && usage.cpu && usage.cpu > limits.maxCpu) {
      violations.push(`CPU limit exceeded: ${usage.cpu}% > ${limits.maxCpu}%`);
    }

    if (limits.maxFileSize && usage.fileSize && usage.fileSize > limits.maxFileSize) {
      violations.push(`File size limit exceeded: ${usage.fileSize} > ${limits.maxFileSize}`);
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * Remove expired grants
   */
  cleanupExpiredGrants(): number {
    let removed = 0;
    const now = new Date();

    for (const [userId, grants] of this.grants.entries()) {
      const validGrants = grants.filter(g => !g.expiresAt || g.expiresAt > now);
      
      removed += grants.length - validGrants.length;
      
      if (validGrants.length === 0) {
        this.grants.delete(userId);
      } else {
        this.grants.set(userId, validGrants);
      }
    }

    if (removed > 0) {
      this.logger.log(`Cleaned up ${removed} expired permission grants`);
    }

    return removed;
  }

  /**
   * Get permission statistics
   */
  getStats() {
    const totalUsers = this.grants.size;
    let totalGrants = 0;
    const extensionUsage = new Map<string, number>();

    for (const grants of this.grants.values()) {
      totalGrants += grants.length;
      
      for (const grant of grants) {
        extensionUsage.set(
          grant.extensionId,
          (extensionUsage.get(grant.extensionId) || 0) + 1
        );
      }
    }

    return {
      totalUsers,
      totalGrants,
      totalLimits: this.limits.size,
      extensionUsage: Object.fromEntries(extensionUsage),
    };
  }
}
