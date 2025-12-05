/**
 * Extension Registry Service Tests
 */

import { ExtensionRegistry } from '../registry.service';
import { ExtensionManifest } from '../../interfaces/types';

describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;

  beforeEach(() => {
    registry = new ExtensionRegistry();
  });

  describe('registerExtension', () => {
    it('should register a valid extension', async () => {
      const manifest: ExtensionManifest = {
        id: 'test-extension',
        name: 'Test Extension',
        version: '1.0.0',
        description: 'Test extension',
        author: 'Test Author',
        capabilities: [{
          id: 'test-cap',
          name: 'Test Capability',
          description: 'Test',
          operations: ['test'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      await registry.registerExtension(manifest, '/test/path', 'custom');

      expect(registry.hasExtension('test-extension')).toBe(true);
      expect(registry.getExtensionCount()).toBe(1);
    });

    it('should reject invalid extension manifest', async () => {
      const invalidManifest = {
        id: 'test',
        // Missing required fields
      } as any;

      await expect(
        registry.registerExtension(invalidManifest, '/test/path', 'custom')
      ).rejects.toThrow();
    });

    it('should reject invalid version format', async () => {
      const manifest: ExtensionManifest = {
        id: 'test-extension',
        name: 'Test Extension',
        version: 'invalid-version',
        description: 'Test extension',
        author: 'Test Author',
        capabilities: [{
          id: 'test-cap',
          name: 'Test Capability',
          description: 'Test',
          operations: ['test'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      await expect(
        registry.registerExtension(manifest, '/test/path', 'custom')
      ).rejects.toThrow('Invalid version format');
    });
  });

  describe('searchExtensions', () => {
    beforeEach(async () => {
      const manifest1: ExtensionManifest = {
        id: 'doc-processor',
        name: 'Document Processor',
        version: '1.0.0',
        description: 'Process documents',
        author: 'Test',
        capabilities: [{
          id: 'extract',
          name: 'Extract Text',
          description: 'Extract text from documents',
          operations: ['extract_text'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      const manifest2: ExtensionManifest = {
        id: 'web-scraper',
        name: 'Web Scraper',
        version: '1.0.0',
        description: 'Scrape websites',
        author: 'Test',
        capabilities: [{
          id: 'scrape',
          name: 'Scrape Web',
          description: 'Scrape web pages',
          operations: ['scrape'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      await registry.registerExtension(manifest1, '/test/path1', 'builtin');
      await registry.registerExtension(manifest2, '/test/path2', 'custom');
    });

    it('should find extensions by name', () => {
      const results = registry.searchExtensions('document');
      expect(results).toHaveLength(1);
      expect(results[0].manifest.id).toBe('doc-processor');
    });

    it('should find extensions by description', () => {
      const results = registry.searchExtensions('scrape');
      expect(results).toHaveLength(1);
      expect(results[0].manifest.id).toBe('web-scraper');
    });

    it('should return empty array for no matches', () => {
      const results = registry.searchExtensions('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('getExtensionsByCapability', () => {
    beforeEach(async () => {
      const manifest: ExtensionManifest = {
        id: 'test-extension',
        name: 'Test Extension',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        capabilities: [{
          id: 'test-cap',
          name: 'Test Capability',
          description: 'Test',
          operations: ['operation1', 'operation2'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      await registry.registerExtension(manifest, '/test/path', 'custom');
    });

    it('should find extensions by capability ID', () => {
      const results = registry.getExtensionsByCapability('test-cap');
      expect(results).toHaveLength(1);
      expect(results[0].manifest.id).toBe('test-extension');
    });

    it('should find extensions by operation', () => {
      const results = registry.getExtensionsByCapability('operation1');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for unknown capability', () => {
      const results = registry.getExtensionsByCapability('unknown');
      expect(results).toHaveLength(0);
    });
  });

  describe('unregisterExtension', () => {
    it('should unregister an extension', async () => {
      const manifest: ExtensionManifest = {
        id: 'test-extension',
        name: 'Test Extension',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        capabilities: [{
          id: 'test-cap',
          name: 'Test',
          description: 'Test',
          operations: ['test'],
          requiredPermissions: [],
        }],
        permissions: [],
        entryPoint: './index.js',
      };

      await registry.registerExtension(manifest, '/test/path', 'custom');
      expect(registry.hasExtension('test-extension')).toBe(true);

      await registry.unregisterExtension('test-extension');
      expect(registry.hasExtension('test-extension')).toBe(false);
    });

    it('should throw error for non-existent extension', async () => {
      await expect(
        registry.unregisterExtension('nonexistent')
      ).rejects.toThrow('Extension not found');
    });
  });
});
