import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

export interface LoggerModuleOptions {
  maxLogsInMemory?: number;
  enableConsoleInterception?: boolean;
  externalLogging?: boolean;
  customServiceName?: string;
}

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggingModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    return {
      module: LoggingModule,
      providers: [
        {
          provide: LoggerService,
          useFactory: (configService: ConfigService) => {
            const logger = new LoggerService(configService, null as any);

            // Apply custom options
            if (options.maxLogsInMemory) {
              (logger as any).maxLogsInMemory = options.maxLogsInMemory;
            }

            if (options.customServiceName) {
              (logger as any).serviceName = options.customServiceName;
            }

            return logger;
          },
          inject: [ConfigService],
        },
      ],
      exports: [LoggerService],
    };
  }

  static forAsync(options: {
    useFactory: (...args: any[]) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: LoggingModule,
      providers: [
        {
          provide: LoggerService,
          useFactory: async (...args: any[]) => {
            const configService = args[0] as ConfigService;
            const loggerOptions = await options.useFactory(...args);
            const logger = new LoggerService(configService, null as any);

            // Apply custom options
            if (loggerOptions.maxLogsInMemory) {
              (logger as any).maxLogsInMemory = loggerOptions.maxLogsInMemory;
            }

            if (loggerOptions.customServiceName) {
              (logger as any).serviceName = loggerOptions.customServiceName;
            }

            return logger;
          },
          inject: options.inject || [ConfigService],
        },
      ],
      exports: [LoggerService],
    };
  }
}