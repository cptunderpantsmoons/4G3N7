import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { webcrypto } from 'crypto';
import { json, urlencoded } from 'express';

// Polyfill for crypto global (required by @nestjs/schedule)
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting 4g3n7-agent-cc application...');

  try {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Configure body parser with reasonable payload size limits
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ limit: '10mb', extended: true }));

    // Set global prefix for all routes
    app.setGlobalPrefix('api');

    // Enable CORS with security defaults
    const corsOrigin = process.env.CORS_ORIGIN;
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && !corsOrigin) {
      throw new Error('CORS_ORIGIN environment variable is required in production');
    }

    const allowedOrigins = corsOrigin
      ? corsOrigin.split(',').map(origin => origin.trim())
      : ['http://localhost:9992', 'http://localhost:3000'];

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true,
      maxAge: 86400, // 24 hours
    });

    const port = process.env.PORT ?? 9991;
    await app.listen(port);

    logger.log(`🚀 4g3n7-agent-cc is running on port ${port}`);
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap();
