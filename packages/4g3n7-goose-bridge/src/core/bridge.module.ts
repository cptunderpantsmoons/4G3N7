/**
 * Goose Bridge Module
 * Main NestJS module for Goose integration
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GooseBridgeController } from './bridge.controller';
import { AuthController } from './auth.controller';
import { GooseBridgeService } from './bridge.service';
import { AuthService } from './auth.service';
import { ConfigurationService } from './configuration.service';
import { ExtensionRegistry } from '../extensions/registry.service';
import { ExtensionLifecycleManager } from '../extensions/lifecycle.manager';
import { PermissionService } from './permission.service';
import { ApiKeyService } from './apikey.service';
import { AuditService } from './audit.service';
import { HealthService } from './health.service';
import { MetricsService } from './metrics.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        
        if (!jwtSecret) {
          if (isProduction) {
            throw new Error('JWT_SECRET environment variable is required in production');
          }
          // Development fallback with warning
          console.warn('⚠️  WARNING: JWT_SECRET not set. Using default secret. This should NEVER be used in production!');
          return {
            secret: 'default-secret-change-in-production-DEVELOPMENT-ONLY',
            signOptions: { expiresIn: '1h' },
          };
        }
        
        // Validate secret strength in production
        if (isProduction && jwtSecret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long in production');
        }
        
        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '1h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [
    GooseBridgeController,
    AuthController,
  ],
  providers: [
    GooseBridgeService,
    AuthService,
    ConfigurationService,
    ExtensionRegistry,
    ExtensionLifecycleManager,
    PermissionService,
    ApiKeyService,
    AuditService,
    HealthService,
    MetricsService,
    JwtStrategy,
  ],
  exports: [
    GooseBridgeService,
    AuthService,
    ConfigurationService,
    ExtensionRegistry,
    ExtensionLifecycleManager,
    PermissionService,
    AuditService,
  ],
})
export class GooseBridgeModule {}
