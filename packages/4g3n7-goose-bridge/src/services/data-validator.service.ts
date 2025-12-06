import { Injectable, Logger } from '@nestjs/common';
import * as Joi from 'joi';

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'pattern' | 'range' | 'custom' | 'email' | 'url';
  config: Record<string, any>;
  message?: string;
}

export interface DataSchema {
  id: string;
  name: string;
  version: string;
  fields: ValidationRule[];
  strict?: boolean; // reject unknown fields
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  data?: any;
  coercedData?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * Data Validator Service
 * Validates data against schemas using Joi and custom rules
 */
@Injectable()
export class DataValidatorService {
  private readonly logger = new Logger(DataValidatorService.name);
  private schemas: Map<string, Joi.ObjectSchema> = new Map();

  /**
   * Validate data against a schema
   */
  async validate(
    data: any,
    schema: DataSchema,
    options?: { coerce?: boolean; strict?: boolean }
  ): Promise<ValidationResult> {
    try {
      this.logger.debug(`Validating data against schema: ${schema.id}`, {
        schemaVersion: schema.version,
      });

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      let coercedData = { ...data };

      // Validate each field
      for (const rule of schema.fields) {
        const fieldErrors = this.validateField(
          rule,
          data[rule.field],
          coercedData
        );
        errors.push(...fieldErrors);

        // Check for type coercion
        if (options?.coerce) {
          const coercedValue = this.coerceValue(
            data[rule.field],
            rule.type,
            rule.config
          );
          if (coercedValue !== undefined) {
            coercedData[rule.field] = coercedValue;
          }
        }
      }

      // Check for unknown fields if strict mode
      const strict = options?.strict ?? schema.strict ?? false;
      if (strict) {
        const allowedFields = new Set(schema.fields.map((f) => f.field));
        for (const key of Object.keys(data)) {
          if (!allowedFields.has(key)) {
            warnings.push({
              field: key,
              message: `Unknown field: ${key} (strict mode enabled)`,
            });
          }
        }
      }

      const isValid = errors.length === 0;

      return {
        valid: isValid,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
        data,
        coercedData: options?.coerce ? coercedData : undefined,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Validation failed: ${msg}`, error);

      return {
        valid: false,
        errors: [
          {
            field: '_root',
            code: 'VALIDATION_ERROR',
            message: msg,
            severity: 'error',
          },
        ],
        data,
      };
    }
  }

  /**
   * Validate a single field
   */
  private validateField(
    rule: ValidationRule,
    value: any,
    coercedData: any
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (rule.type === 'required' && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        code: 'REQUIRED',
        message: rule.message || `Field ${rule.field} is required`,
        severity: 'error',
        value,
      });
      return errors;
    }

    if (value === undefined || value === null) {
      return errors; // Skip other validations if not required
    }

    switch (rule.type) {
      case 'type':
        if (!this.validateType(value, rule.config.expectedType)) {
          errors.push({
            field: rule.field,
            code: 'TYPE_MISMATCH',
            message:
              rule.message ||
              `Field ${rule.field} must be ${rule.config.expectedType}`,
            severity: 'error',
            value,
          });
        }
        break;

      case 'pattern':
        if (!this.validatePattern(value, rule.config.regex)) {
          errors.push({
            field: rule.field,
            code: 'PATTERN_MISMATCH',
            message:
              rule.message || `Field ${rule.field} does not match pattern`,
            severity: 'error',
            value,
          });
        }
        break;

      case 'range':
        if (!this.validateRange(value, rule.config)) {
          errors.push({
            field: rule.field,
            code: 'OUT_OF_RANGE',
            message:
              rule.message || `Field ${rule.field} is out of range`,
            severity: 'error',
            value,
          });
        }
        break;

      case 'email':
        if (!this.validateEmail(value)) {
          errors.push({
            field: rule.field,
            code: 'INVALID_EMAIL',
            message: rule.message || `Field ${rule.field} must be a valid email`,
            severity: 'error',
            value,
          });
        }
        break;

      case 'url':
        if (!this.validateUrl(value)) {
          errors.push({
            field: rule.field,
            code: 'INVALID_URL',
            message: rule.message || `Field ${rule.field} must be a valid URL`,
            severity: 'error',
            value,
          });
        }
        break;

      case 'custom':
        if (rule.config.validator && typeof rule.config.validator === 'function') {
          const isValid = rule.config.validator(value);
          if (!isValid) {
            errors.push({
              field: rule.field,
              code: 'CUSTOM_VALIDATION_FAILED',
              message: rule.message || `Field ${rule.field} failed custom validation`,
              severity: 'error',
              value,
            });
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Validate type
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  /**
   * Validate pattern
   */
  private validatePattern(value: string, pattern: string | RegExp): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    return regex.test(value);
  }

  /**
   * Validate range
   */
  private validateRange(
    value: any,
    config: { min?: number; max?: number; length?: number }
  ): boolean {
    if (typeof value === 'number') {
      if (config.min !== undefined && value < config.min) {
        return false;
      }
      if (config.max !== undefined && value > config.max) {
        return false;
      }
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      if (config.length !== undefined && value.length !== config.length) {
        return false;
      }
      if (config.min !== undefined && value.length < config.min) {
        return false;
      }
      if (config.max !== undefined && value.length > config.max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate email
   */
  private validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate URL
   */
  private validateUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Coerce value to expected type
   */
  private coerceValue(value: any, type: string, config: any): any {
    if (value === undefined || value === null) {
      return undefined;
    }

    switch (type) {
      case 'type':
        switch (config.expectedType.toLowerCase()) {
          case 'string':
            return String(value);
          case 'number':
          case 'integer':
            return Number(value);
          case 'boolean':
            return value === 'true' || value === 1 || value === true;
          default:
            return value;
        }

      case 'range':
        // Clamp numeric values to range
        if (typeof value === 'number') {
          if (config.min !== undefined && value < config.min) {
            return config.min;
          }
          if (config.max !== undefined && value > config.max) {
            return config.max;
          }
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Create or get Joi schema
   */
  getJoiSchema(schema: DataSchema): Joi.ObjectSchema {
    const cached = this.schemas.get(schema.id);
    if (cached) {
      return cached;
    }

    const joiSchema = this.buildJoiSchema(schema);
    this.schemas.set(schema.id, joiSchema);
    return joiSchema;
  }

  /**
   * Build Joi schema from rules
   */
  private buildJoiSchema(schema: DataSchema): Joi.ObjectSchema {
    const fields: Record<string, any> = {};

    for (const rule of schema.fields) {
      let joiField = Joi.any();

      switch (rule.type) {
        case 'required':
          joiField = Joi.string().required();
          break;
        case 'type':
          joiField = this.getJoiType(rule.config.expectedType);
          break;
        case 'email':
          joiField = Joi.string().email();
          break;
        case 'url':
          joiField = Joi.string().uri();
          break;
        case 'pattern':
          joiField = Joi.string().pattern(new RegExp(rule.config.regex));
          break;
        case 'range':
          joiField = this.getJoiRangeType(rule.config);
          break;
        default:
          joiField = Joi.any();
      }

      if (rule.message) {
        joiField = joiField.messages({ 'any.required': rule.message });
      }

      fields[rule.field] = joiField;
    }

    const options = schema.strict ? { stripUnknown: true } : {};
    return Joi.object(fields).options(options);
  }

  /**
   * Get Joi type schema
   */
  private getJoiType(type: string): Joi.AnySchema {
    switch (type.toLowerCase()) {
      case 'string':
        return Joi.string();
      case 'number':
        return Joi.number();
      case 'integer':
        return Joi.number().integer();
      case 'boolean':
        return Joi.boolean();
      case 'array':
        return Joi.array();
      case 'object':
        return Joi.object();
      case 'date':
        return Joi.date();
      default:
        return Joi.any();
    }
  }

  /**
   * Get Joi range type
   */
  private getJoiRangeType(config: any): Joi.AnySchema {
    let schema = Joi.any();

    if (typeof config.min === 'number' || typeof config.max === 'number') {
      schema = Joi.number();
      if (config.min !== undefined) {
        schema = (schema as Joi.NumberSchema).min(config.min);
      }
      if (config.max !== undefined) {
        schema = (schema as Joi.NumberSchema).max(config.max);
      }
    } else {
      schema = Joi.string();
      if (config.min !== undefined) {
        schema = (schema as Joi.StringSchema).min(config.min);
      }
      if (config.max !== undefined) {
        schema = (schema as Joi.StringSchema).max(config.max);
      }
    }

    return schema;
  }

  /**
   * Validate using Joi
   */
  async validateWithJoi(data: any, schema: DataSchema): Promise<ValidationResult> {
    try {
      const joiSchema = this.getJoiSchema(schema);
      const { error, value } = joiSchema.validate(data, { abortEarly: false });

      if (!error) {
        return {
          valid: true,
          errors: [],
          data,
          coercedData: value,
        };
      }

      const errors: ValidationError[] = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        code: detail.type || 'VALIDATION_ERROR',
        message: detail.message,
        severity: 'error',
        value: detail.context?.value,
      }));

      return {
        valid: false,
        errors,
        data,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Joi validation failed: ${msg}`, error);

      return {
        valid: false,
        errors: [
          {
            field: '_root',
            code: 'VALIDATION_ERROR',
            message: msg,
            severity: 'error',
          },
        ],
        data,
      };
    }
  }

  /**
   * Clear cached schemas
   */
  clearCache(): void {
    this.schemas.clear();
    this.logger.debug('Schema cache cleared');
  }
}
