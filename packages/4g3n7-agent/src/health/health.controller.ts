import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startTime = Date.now();

    // Check database connection
    const dbHealth = await this.prisma.healthCheck();

    const responseTime = Date.now() - startTime;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      memory: process.memoryUsage(),
      database: dbHealth,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ready')
  async ready() {
    // Detailed readiness check
    const dbHealth = await this.prisma.healthCheck();

    const isReady = dbHealth.status === 'healthy';

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
      },
    };
  }

  @Get('live')
  async live() {
    // Basic liveness check
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}