import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('monitoring')
export class PerformanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  async getMetrics() {
    const startTime = Date.now();

    try {
      // Database metrics
      const dbHealth = await this.prisma.healthCheck();

      // Task statistics
      const totalTasks = await this.prisma.task.count();
      const pendingTasks = await this.prisma.task.count({ where: { status: 'PENDING' } });
      const runningTasks = await this.prisma.task.count({ where: { status: 'RUNNING' } });
      const completedTasks = await this.prisma.task.count({ where: { status: 'COMPLETED' } });
      const failedTasks = await this.prisma.task.count({ where: { status: 'FAILED' } });

      // Recent task performance (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentTasks = await this.prisma.task.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo
          }
        },
        select: {
          status: true,
          createdAt: true,
          executedAt: true,
          completedAt: true,
        }
      });

      // Calculate average processing time
      const completedRecentTasks = recentTasks.filter(task =>
        task.status === 'COMPLETED' && task.executedAt && task.completedAt
      );

      const avgProcessingTime = completedRecentTasks.length > 0
        ? completedRecentTasks.reduce((sum, task) => {
            return sum + (task.completedAt!.getTime() - task.executedAt!.getTime());
          }, 0) / completedRecentTasks.length
        : 0;

      // Memory usage
      const memoryUsage = process.memoryUsage();

      // System metrics
      const responseTime = Date.now() - startTime;

      return {
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: {
          ...dbHealth,
          totalTasks,
          pendingTasks,
          runningTasks,
          completedTasks,
          failedTasks,
        },
        performance: {
          avgProcessingTime: `${Math.round(avgProcessingTime / 1000)}s`,
          tasksLast24Hours: recentTasks.length,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        system: {
          uptime: process.uptime(),
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          },
          nodeVersion: process.version,
          platform: process.platform,
        },
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
      };
    }
  }

  @Get('health')
  async getHealthStatus() {
    const dbHealth = await this.prisma.healthCheck();
    const memoryUsage = process.memoryUsage();

    const isHealthy = dbHealth.status === 'healthy' &&
                     memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      memory: {
        usage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      uptime: process.uptime(),
    };
  }

  @Get('tasks/analytics')
  async getTaskAnalytics(
    @Query('days') days: string = '7',
    @Query('status') status?: string,
  ) {
    const daysNum = parseInt(days) || 7;
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    try {
      const whereClause: any = {
        createdAt: {
          gte: startDate,
        },
      };

      if (status) {
        whereClause.status = status;
      }

      const tasks = await this.prisma.task.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          priority: true,
          createdAt: true,
          executedAt: true,
          completedAt: true,
          type: true,
          control: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate analytics
      const analytics = {
        total: tasks.length,
        byStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: tasks.reduce((acc, task) => {
          acc[task.type] = (acc[task.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byControl: tasks.reduce((acc, task) => {
          acc[task.control] = (acc[task.control] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        dailyStats: this.calculateDailyStats(tasks, daysNum),
        avgProcessingTime: this.calculateAvgProcessingTime(tasks),
      };

      return {
        period: `Last ${daysNum} days`,
        timestamp: new Date().toISOString(),
        analytics,
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private calculateDailyStats(tasks: any[], days: number) {
    const stats = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(task =>
        task.createdAt.toISOString().split('T')[0] === dateStr
      );

      stats.push({
        date: dateStr,
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'COMPLETED').length,
        failed: dayTasks.filter(t => t.status === 'FAILED').length,
        pending: dayTasks.filter(t => t.status === 'PENDING').length,
      });
    }

    return stats;
  }

  private calculateAvgProcessingTime(tasks: any[]) {
    const completedTasks = tasks.filter(task =>
      task.status === 'COMPLETED' && task.executedAt && task.completedAt
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt.getTime() - task.executedAt.getTime());
    }, 0);

    return Math.round(totalTime / completedTasks.length / 1000); // Return in seconds
  }
}