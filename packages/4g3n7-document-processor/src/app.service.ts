import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: '4g3n7-document-processor',
      timestamp: new Date().toISOString(),
    };
  }

  getStatus() {
    return {
      service: '4g3n7-document-processor',
      version: '0.0.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
