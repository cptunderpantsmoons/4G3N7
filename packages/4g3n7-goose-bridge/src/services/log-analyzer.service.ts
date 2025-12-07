/**
 * Phase 5.4 - Log Analyzer Service
 * Log analysis, troubleshooting, and diagnostics
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  LogEntry,
  LogLevel,
  LogAnalysisResult,
  DiagnosticReport,
  TroubleshootingGuide,
  SystemHealthStatus,
  ThreatLevel,
} from '../interfaces/system-administration.interface';

@Injectable()
export class LogAnalyzerService {
  private readonly logger = new Logger(LogAnalyzerService.name);

  private logs = new Map<string, LogEntry>();
  private analysisCache = new Map<string, LogAnalysisResult>();
  private guides = new Map<string, TroubleshootingGuide>();

  constructor() {
    this.initializeGuides();
  }

  async analyzeLogRange(startTime: Date, endTime: Date): Promise<LogAnalysisResult> {
    const analysisId = `analysis_${Date.now()}`;

    this.logger.log(`Analyzing logs from ${startTime} to ${endTime}`);

    const relevantLogs = Array.from(this.logs.values())
      .filter(l => l.timestamp >= startTime && l.timestamp <= endTime);

    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    };

    const byService: Record<string, number> = {};
    let errorCount = 0;

    for (const log of relevantLogs) {
      byLevel[log.level]++;
      byService[log.service] = (byService[log.service] || 0) + 1;
      if (log.level === 'error' || log.level === 'critical') {
        errorCount++;
      }
    }

    const result: LogAnalysisResult = {
      analysisId,
      timestamp: new Date(),
      timeRange: { start: startTime, end: endTime },
      statistics: {
        totalLogs: relevantLogs.length,
        byLevel,
        byService,
        errorRate: relevantLogs.length > 0 ? (errorCount / relevantLogs.length) * 100 : 0,
        averageResponseTime: 0,
      },
      patterns: [],
      anomalies: [],
      recommendations: [],
    };

    this.analysisCache.set(analysisId, result);
    return result;
  }

  async searchLogs(query: string, limit: number = 100): Promise<LogEntry[]> {
    this.logger.debug(`Searching logs for: ${query}`);

    const results = Array.from(this.logs.values())
      .filter(l => 
        l.message.includes(query) || 
        l.service.includes(query) || 
        l.module.includes(query)
      )
      .slice(0, limit);

    return results;
  }

  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    this.logger.log('Generating diagnostic report');

    const reportId = `diag_${Date.now()}`;

    const report: DiagnosticReport = {
      reportId,
      timestamp: new Date(),
      title: 'System Diagnostic Report',
      systemSnapshot: {
        timestamp: new Date(),
        cpuUsage: 45,
        memoryUsage: 65,
        diskUsage: {},
        networkIO: { bytesIn: 0, bytesOut: 0, packetsIn: 0, packetsOut: 0 },
        loadAverage: [0.5, 0.4, 0.3],
        uptime: 86400,
      },
      processSnapshot: [],
      diskSnapshot: [],
      networkSnapshot: [],
      recentLogs: Array.from(this.logs.values()).slice(-20),
      recentErrors: [],
      systemHealth: {
        checkId: reportId,
        timestamp: new Date(),
        status: SystemHealthStatus.HEALTHY,
        checks: [],
        overallHealth: 85,
        criticalIssues: [],
        recommendations: [],
      },
      analysis: {
        rootCauses: [],
        affectedSystems: [],
        recommendations: [],
      },
    };

    return report;
  }

  async getTroubleshootingGuides(category?: string): Promise<TroubleshootingGuide[]> {
    let guides = Array.from(this.guides.values());

    if (category) {
      guides = guides.filter(g => g.category === category);
    }

    return guides;
  }

  async getRecentErrors(limit: number = 50): Promise<Array<{ timestamp: Date; error: string }>> {
    const errors = Array.from(this.logs.values())
      .filter(l => l.level === 'error' || l.level === 'critical')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(l => ({
        timestamp: l.timestamp,
        error: l.message,
      }));

    return errors;
  }

  addLogEntry(entry: LogEntry): void {
    this.logs.set(entry.logId, entry);

    if (this.logs.size > 10000) {
      const oldestKey = Array.from(this.logs.keys())[0];
      this.logs.delete(oldestKey);
    }
  }

  private initializeGuides(): void {
    const guides: TroubleshootingGuide[] = [
      {
        guideId: 'guide_1',
        title: 'High CPU Usage',
        symptom: 'System is running slowly with high CPU usage',
        category: 'cpu',
        severity: ThreatLevel.HIGH,
        steps: [
          {
            step: 1,
            description: 'Check currently running processes',
            commands: ['top', 'ps aux'],
          },
          {
            step: 2,
            description: 'Identify the process consuming most CPU',
            expectedOutput: 'Process list with CPU percentages',
          },
        ],
        relatedIssues: [],
      },
      {
        guideId: 'guide_2',
        title: 'High Memory Usage',
        symptom: 'System memory is nearly full',
        category: 'memory',
        severity: ThreatLevel.HIGH,
        steps: [
          {
            step: 1,
            description: 'Check memory usage',
            commands: ['free -h', 'vmstat'],
          },
        ],
        relatedIssues: [],
      },
    ];

    for (const guide of guides) {
      this.guides.set(guide.guideId, guide);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Log Analyzer Service');
    this.logs.clear();
    this.analysisCache.clear();
    this.guides.clear();
  }
}
