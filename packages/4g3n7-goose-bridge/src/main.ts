/**
 * Main entry point for 4G3N7 Goose Bridge
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GooseBridgeModule } from './core/bridge.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting 4G3N7 Goose Bridge application...');

  try {
    const app = await NestFactory.create(GooseBridgeModule);

    // Global exception filter for consistent error responses
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Apply rate limiting middleware
    app.use(new RateLimitMiddleware().use.bind(new RateLimitMiddleware()));

    // CORS configuration with security defaults
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && !allowedOriginsEnv) {
      throw new Error('ALLOWED_ORIGINS environment variable is required in production');
    }
    
    // Default to localhost for development, require explicit config for production
    const allowedOrigins = allowedOriginsEnv
      ? allowedOriginsEnv.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:9992']; // Default UI ports
    
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      maxAge: 86400, // 24 hours
    });

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('4G3N7 Goose Bridge API')
      .setDescription('Goose AI Agent integration bridge for 4G3N7 platform')
      .setVersion('1.0.0')
      .addTag('goose')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 9992;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen(port, host);

    logger.log(`🚀 Goose Bridge API is running on http://${host}:${port}`);
    logger.log(`📚 Swagger documentation available at http://${host}:${port}/api/docs`);
    logger.log(`🏥 Health check available at http://${host}:${port}/api/v1/goose/health`);
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error('Failed to start Goose Bridge:', error);
    process.exit(1);
  }
}

bootstrap();
