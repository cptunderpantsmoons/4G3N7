import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { webcrypto } from 'crypto';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

// Polyfill for crypto global (required by @nestjs/schedule)
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting 4g3n7-agent application...');

  try {
    const app = await NestFactory.create(AppModule);

    // Configure body parser with reasonable payload size limits (reduced from 50MB)
    app.use(json({
      limit: '10mb', // Reduced for security
      type: 'application/json'
    }));

    app.use(urlencoded({
      limit: '10mb', // Reduced for security
      extended: true
    }));

    // Add compression middleware for response optimization
    app.use(compression({
      level: 6,
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Global validation pipe with security settings
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    // Enable CORS with restricted origins for security
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    app.enableCors({
      origin: corsOrigin.split(',').map(origin => origin.trim()),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      maxAge: 86400, // 24 hours
    });

    // Add request timeout
    app.use((req, res, next) => {
      res.setTimeout(30000, () => {
        logger.warn(`Request timeout for ${req.method} ${req.url}`);
        if (!res.headersSent) {
          res.status(408).json({ error: 'Request timeout' });
        }
      });
      next();
    });

    const port = process.env.PORT ?? 9991;
    await app.listen(port);

    logger.log(`🚀 4g3n7-agent is running on port ${port}`);
    logger.log(`📊 Health check: http://localhost:${port}/health`);
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    logger.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
