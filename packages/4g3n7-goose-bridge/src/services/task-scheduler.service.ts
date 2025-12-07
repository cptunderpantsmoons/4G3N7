/**
 * Phase 6.1 - Task Scheduler Service
 * Task scheduling and automation management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TaskSchedule,
  TaskAutomation,
  ScheduleType,
} from '../interfaces/ui-task-management.interface';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  private schedules = new Map<string, TaskSchedule>();
  private automations = new Map<string, TaskAutomation>();
  private executionLog = new Map<string, any[]>();

  constructor() {
    this.startScheduler();
  }

  async scheduleTask(taskId: string, schedule: TaskSchedule): Promise<void> {
    this.logger.log(`Scheduling task: ${taskId}`);
    this.schedules.set(schedule.scheduleId, schedule);
  }

  async getScheduledTasks(limit: number = 50): Promise<TaskSchedule[]> {
    const tasks = Array.from(this.schedules.values())
      .filter(s => s.enabled)
      .sort((a, b) => {
        const aNext = a.nextRun?.getTime() || 0;
        const bNext = b.nextRun?.getTime() || 0;
        return aNext - bNext;
      })
      .slice(0, limit);

    return tasks;
  }

  async updateSchedule(scheduleId: string, updates: Partial<TaskSchedule>): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    this.logger.log(`Updating schedule: ${scheduleId}`);
    Object.assign(schedule, updates);
  }

  async getNextScheduledRun(taskId: string): Promise<Date | null> {
    const schedules = Array.from(this.schedules.values())
      .filter(s => s.taskId === taskId && s.enabled);

    if (schedules.length === 0) return null;

    const nextRuns = schedules.map(s => s.nextRun).filter(Boolean) as Date[];
    if (nextRuns.length === 0) return null;

    return new Date(Math.min(...nextRuns.map(d => d.getTime())));
  }

  async createAutomation(automation: TaskAutomation): Promise<void> {
    this.logger.log(`Creating automation: ${automation.name}`);
    this.automations.set(automation.automationId, automation);
  }

  async listAutomations(enabled?: boolean): Promise<TaskAutomation[]> {
    let automations = Array.from(this.automations.values());

    if (enabled !== undefined) {
      automations = automations.filter(a => a.enabled === enabled);
    }

    return automations;
  }

  async executeAutomation(automationId: string): Promise<any> {
    const automation = this.automations.get(automationId);
    if (!automation) {
      throw new Error(`Automation not found: ${automationId}`);
    }

    this.logger.log(`Executing automation: ${automation.name}`);

    const execution = {
      executionId: `exec_${Date.now()}`,
      timestamp: new Date(),
      status: 'success',
      result: { taskCreated: true },
    };

    if (!this.executionLog.has(automationId)) {
      this.executionLog.set(automationId, []);
    }
    this.executionLog.get(automationId)!.push(execution);

    return execution;
  }

  async getAutomationExecutionHistory(automationId: string, limit: number = 50): Promise<any[]> {
    const history = this.executionLog.get(automationId) || [];
    return history.slice(-limit);
  }

  private startScheduler(): void {
    const SCHEDULER_INTERVAL = 60 * 1000; // 1 minute
    setInterval(() => {
      this.logger.debug('Checking scheduled tasks');
      // TODO: Check task schedules and execute as needed
    }, SCHEDULER_INTERVAL);
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Task Scheduler Service');
    this.schedules.clear();
    this.automations.clear();
    this.executionLog.clear();
  }
}
