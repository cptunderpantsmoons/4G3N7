/**
 * Configuration Service Tests
 */

import { ConfigurationService } from '../configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  beforeEach(() => {
    service = new ConfigurationService();
  });

  describe('registerSchema', () => {
    it('should register a valid schema', () => {
      const schema = {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          maxRetries: { type: 'number', default: 3 },
        },
        required: ['apiKey'],
      };

      expect(() => {
        service.registerSchema('test-extension', schema);
      }).not.toThrow();
    });

    it('should throw error for invalid schema', () => {
      const invalidSchema = {
        type: 'invalid-type',
      };

      expect(() => {
        service.registerSchema('test-extension', invalidSchema);
      }).toThrow();
    });
  });

  describe('validateConfig', () => {
    beforeEach(() => {
      const schema = {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          maxRetries: { type: 'number', default: 3 },
          enabled: { type: 'boolean' },
        },
        required: ['apiKey'],
      };

      service.registerSchema('test-extension', schema);
    });

    it('should validate correct configuration', () => {
      const config = {
        apiKey: 'test-key',
        maxRetries: 5,
        enabled: true,
      };

      const result = service.validateConfig('test-extension', config);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject configuration missing required fields', () => {
      const config = {
        maxRetries: 5,
      };

      const result = service.validateConfig('test-extension', config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });

    it('should reject configuration with wrong types', () => {
      const config = {
        apiKey: 123, // Should be string
      };

      const result = service.validateConfig('test-extension', config);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should apply default values', () => {
      const config = {
        apiKey: 'test-key',
      };

      const result = service.validateConfig('test-extension', config);
      expect(result.valid).toBe(true);
      // maxRetries should have default value of 3
    });
  });

  describe('getDefaultConfig', () => {
    it('should extract default values from schema', () => {
      const schema = {
        type: 'object',
        properties: {
          timeout: { type: 'number', default: 5000 },
          retries: { type: 'number', default: 3 },
          enabled: { type: 'boolean', default: true },
          apiKey: { type: 'string' },
        },
      };

      const defaults = service.getDefaultConfig('test-extension', schema);
      
      expect(defaults.timeout).toBe(5000);
      expect(defaults.retries).toBe(3);
      expect(defaults.enabled).toBe(true);
      expect(defaults.apiKey).toBeUndefined();
    });
  });

  describe('mergeConfigs', () => {
    it('should merge base and override configs', () => {
      const base = {
        timeout: 5000,
        retries: 3,
        enabled: true,
      };

      const override = {
        timeout: 10000,
        debug: true,
      };

      const merged = service.mergeConfigs(base, override);
      
      expect(merged.timeout).toBe(10000); // Overridden
      expect(merged.retries).toBe(3); // From base
      expect(merged.enabled).toBe(true); // From base
      expect(merged.debug).toBe(true); // From override
    });
  });
});
