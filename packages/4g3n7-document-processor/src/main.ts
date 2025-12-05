import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { webcrypto } from 'crypto';
import { json, urlencoded } from 'express';
import * as compression from 'compression';

// Polyfill for crypto global
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting 4g3n7-document-processor...');

  try {
    const app = await NestFactory.create(AppModule);

    // Configure body parser with larger limits for document uploads
    app.use(json({
      limit: '100mb',
      type: 'application/json'
    }));

    app.use(urlencoded({
      limit: '100mb',
      extended: true
    }));

    // Add compression middleware
    app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }));

    // Enable CORS
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    app.enableCors({
      origin: corsOrigin.split(',').map(origin => origin.trim()),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      maxAge: 86400,
    });

    const port = process.env.PORT ?? 9993;
    await app.listen(port);

    logger.log(`🚀 4g3n7-document-processor is running on port ${port}`);
    logger.log(`📊 Health check: http://localhost:${port}/health`);
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    logger.error('Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
