/**
 * Audit Logging Service
 * Tracks all security-relevant events
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditLogEntry } from '../interfaces/types';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogQuery {
  eventType?: string;
  actor?: string;
  target?: string;
  status?: 'success' | 'failure' | 'denied';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs = 10000; // Keep last 10k logs in memory

  /**
   * Log an audit event
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      ...entry,
    };

    this.logs.push(auditEntry);

    // Trim old logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to standard logger for persistence
    const logLevel = entry.status === 'failure' || entry.status === 'denied' ? 'warn' : 'log';
    this.logger[logLevel]('Audit event', {
      eventType: entry.eventType,
      actor: entry.actor,
      target: entry.target,
      action: entry.action,
      status: entry.status,
    });
  }

  /**
   * Log task submission
   */
  logTaskSubmission(
    userId: string,
    taskId: string,
    extensionId: string,
    taskType: string,
    source: string,
    status: 'success' | 'failure' | 'denied',
    error?: string
  ): void {
    this.log({
      eventType: 'task_submit',
      actor: userId,
      target: taskId,
      action: `submit_task:${taskType}`,
      details: {
        extensionId,
        taskType,
      },
      source,
      status,
      error,
    });
  }

  /**
   * Log extension load
   */
  logExtensionLoad(
    userId: string,
    extensionId: string,
    version: string,
    source: string,
    status: 'success' | 'failure',
    error?: string
  ): void {
    this.log({
      eventType: 'extension_load',
      actor: userId,
      target: extensionId,
      action: 'load_extension',
      details: {
        version,
      },
      source,
      status,
      error,
    });
  }

  /**
   * Log permission denial
   */
  logPermissionDenied(
    userId: string,
    resource: string,
    requestedPermission: string,
    source: string,
    reason: string
  ): void {
    this.log({
      eventType: 'permission_denied',
      actor: userId,
      target: resource,
      action: `request:${requestedPermission}`,
      details: {
        requestedPermission,
        reason,
      },
      source,
      status: 'denied',
    });
  }

  /**
   * Log data access
   */
  logDataAccess(
    userId: string,
    filePath: string,
    operation: 'read' | 'write' | 'delete',
    source: string,
    status: 'success' | 'failure' | 'denied',
    error?: string
  ): void {
    this.log({
      eventType: 'data_access',
      actor: userId,
      target: filePath,
      action: operation,
      details: {
        operation,
      },
      source,
      status,
      error,
    });
  }

  /**
   * Log configuration change
   */
  logConfigChange(
    userId: string,
    extensionId: string,
    changes: Record<string, any>,
    source: string,
    status: 'success' | 'failure',
    error?: string
  ): void {
    this.log({
      eventType: 'config_change',
      actor: userId,
      target: extensionId,
      action: 'update_config',
      details: {
        changes,
      },
      source,
      status,
      error,
    });
  }

  /**
   * Query audit logs
   */
  query(query: AuditLogQuery): AuditLogEntry[] {
    let filtered = [...this.logs];

    // Filter by event type
    if (query.eventType) {
      filtered = filtered.filter(log => log.eventType === query.eventType);
    }

    // Filter by actor
    if (query.actor) {
      filtered = filtered.filter(log => log.actor === query.actor);
    }

    // Filter by target
    if (query.target) {
      filtered = filtered.filter(log => log.target === query.target);
    }

    // Filter by status
    if (query.status) {
      filtered = filtered.filter(log => log.status === query.status);
    }

    // Filter by date range
    if (query.startDate) {
      filtered = filtered.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filtered = filtered.filter(log => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get audit statistics
   */
  getStats() {
    const total = this.logs.length;
    const byEventType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const recentDenials: AuditLogEntry[] = [];

    for (const log of this.logs) {
      byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;

      if (log.status === 'denied') {
        recentDenials.push(log);
      }
    }

    // Get last 10 denials
    recentDenials.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topDenials = recentDenials.slice(0, 10);

    return {
      total,
      byEventType,
      byStatus,
      recentDenials: topDenials,
    };
  }

  /**
   * Export audit logs to JSON
   */
  export(query?: AuditLogQuery): string {
    const logs = query ? this.query(query) : this.logs;
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      total: logs.length,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    }, null, 2);
  }

  /**
   * Clear old logs (older than specified days)
   */
  clearOldLogs(olderThanDays: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const before = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    const removed = before - this.logs.length;

    if (removed > 0) {
      this.logger.log(`Cleared ${removed} audit logs older than ${olderThanDays} days`);
    }

    return removed;
  }
}
