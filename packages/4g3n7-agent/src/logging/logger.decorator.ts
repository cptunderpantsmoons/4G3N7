import { LoggerService } from './logger.service';

export interface LogOptions {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'critical';
  includeArgs?: boolean;
  includeResult?: boolean;
  logPerformance?: boolean;
  logErrors?: boolean;
  component?: string;
  tags?: string[];
}

const defaultOptions: LogOptions = {
  level: 'debug',
  includeArgs: false,
  includeResult: false,
  logPerformance: true,
  logErrors: true,
  tags: ['decorator'],
};

export function LogMethod(options: LogOptions = {}) {
  const finalOptions = { ...defaultOptions, ...options };

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as LoggerService;
      if (!logger) {
        console.warn('Logger not found in class, decorator will not work');
        return originalMethod.apply(this, args);
      }

      const methodName = `${className}.${propertyKey}`;
      const context = {
        method: propertyKey,
        component: finalOptions.component || className,
        tags: finalOptions.tags,
      };

      try {
        // Log method entry
        if (finalOptions.level) {
          logger.logMethodEntry(
            methodName,
            finalOptions.includeArgs ? args : undefined,
            context,
          );
        }

        const startTime = Date.now();
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Log performance
        if (finalOptions.logPerformance) {
          logger.logPerformance(methodName, duration, context);
        }

        // Log method exit
        if (finalOptions.level) {
          logger.logMethodExit(
            methodName,
            finalOptions.includeResult ? result : undefined,
            context,
          );
        }

        return result;
      } catch (error) {
        // Log errors
        if (finalOptions.logErrors && error instanceof Error) {
          logger.logError(error, {
            ...context,
            method: propertyKey,
            metadata: { args: finalOptions.includeArgs ? args : undefined },
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

export function LogPerformance(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as LoggerService;
      if (!logger) {
        console.warn(
          'Logger not found in class, LogPerformance decorator will not work',
        );
        return originalMethod.apply(this, args);
      }

      const operationName = operation || `${className}.${propertyKey}`;
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.logPerformance(operationName, duration, {
          method: propertyKey,
          component: className,
          tags: ['performance', 'method'],
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.logPerformance(operationName, duration, {
          method: propertyKey,
          component: className,
          metadata: { error: error instanceof Error ? error.message : String(error) },
          tags: ['performance', 'method', 'error'],
        });

        throw error;
      }
    };

    return descriptor;
  };
}

export function LogErrors(component?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const logger = (this as any).logger as LoggerService;
      if (!logger) {
        console.warn(
          'Logger not found in class, LogErrors decorator will not work',
        );
        return originalMethod.apply(this, args);
      }

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof Error) {
          logger.logError(error, {
            method: propertyKey,
            component: component || className,
            metadata: { args },
            tags: ['error', 'method'],
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}
