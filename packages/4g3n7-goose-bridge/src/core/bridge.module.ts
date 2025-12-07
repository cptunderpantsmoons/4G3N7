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
import { DataProcessingController } from './data-processing.controller';
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
import { ExtensionLoaderService } from '../services/extension-loader.service';
import { DataTransformerService } from '../services/data-transformer.service';
import { DataValidatorService } from '../services/data-validator.service';
import { CacheService } from '../services/cache.service';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { DataStorageService } from '../services/data-storage.service';
import { DataIndexService } from '../services/data-index.service';
import { WebAutomationService } from '../services/web-automation.service';
import { DesktopControlService } from '../services/desktop-control.service';
import { MacroEngineService } from '../services/macro-engine.service';
import { ScreenRecorderService } from '../services/screen-recorder.service';
import { WindowManagerService } from '../services/window-manager.service';
import { SystemMonitorService } from '../services/system-monitor.service';
import { ImageAnalyzerService } from '../services/image-analyzer.service';
import { OCRService } from '../services/ocr.service';
import { ElementDetectorService } from '../services/element-detector.service';
import { LayoutAnalyzerService } from '../services/layout-analyzer.service';
import { ChangeDetectorService } from '../services/change-detector.service';
import { BrowserAutomationService } from '../services/browser-automation.service';
import { OfficeAutomationService } from '../services/office-automation.service';
import { IDEAutomationService } from '../services/ide-automation.service';
import { CommsAutomationService } from '../services/comms-automation.service';
import { AppWorkflowService } from '../services/app-workflow.service';

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
    DataProcessingController,
  ],
  providers: [
    GooseBridgeService,
    AuthService,
    ConfigurationService,
    ExtensionRegistry,
    ExtensionLifecycleManager,
    ExtensionLoaderService,
    CacheService,
    DataTransformerService,
    DataValidatorService,
    WorkflowEngineService,
    {
      provide: DataStorageService,
      useFactory: () => new DataStorageService({ type: 'memory', database: '4g3n7' }),
    },
    DataIndexService,
    WebAutomationService,
    DesktopControlService,
    MacroEngineService,
    ScreenRecorderService,
    WindowManagerService,
    SystemMonitorService,
    ImageAnalyzerService,
    OCRService,
    ElementDetectorService,
    LayoutAnalyzerService,
    ChangeDetectorService,
    BrowserAutomationService,
    OfficeAutomationService,
    IDEAutomationService,
    CommsAutomationService,
    AppWorkflowService,
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
