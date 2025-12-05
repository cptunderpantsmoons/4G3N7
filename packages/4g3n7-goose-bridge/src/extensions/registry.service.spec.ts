import { Test, TestingModule } from '@nestjs/testing';
import { ExtensionRegistry } from './registry.service';
import { BaseExtension } from './base.extension';
import { ExtensionManifest, ExtensionCapability } from '../interfaces/types';

class TestExtension extends BaseExtension {
  getManifest(): ExtensionManifest {
    return {
      id: 'test-extension',
      name: 'Test Extension',
      version: '1.0.0',
      description: 'Test extension for unit tests',
      author: 'Test Author',
      capabilities: [
        {
          id: 'test-capability',
          name: 'Test Capability',
          description: 'Test capability',
        },
      ],
    };
  }

  async executeTask(task: any): Promise<any> {
    return { success: true };
  }
}

describe('ExtensionRegistry', () => {
  let service: ExtensionRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExtensionRegistry],
    }).compile();

    service = module.get<ExtensionRegistry>(ExtensionRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerExtension', () => {
    it('should register an extension', () => {
      const extension = new TestExtension();
      const manifest = extension.getManifest();

      service.registerExtension(manifest, 'local', extension);

      const registered = service.getExtension('test-extension');
      expect(registered).toBeDefined();
      expect(registered?.manifest.id).toBe('test-extension');
    });

    it('should throw error when registering duplicate extension', () => {
      const extension = new TestExtension();
      const manifest = extension.getManifest();

      service.registerExtension(manifest, 'local', extension);

      expect(() => {
        service.registerExtension(manifest, 'local', extension);
      }).toThrow();
    });
  });

  describe('getExtension', () => {
    it('should return registered extension', () => {
      const extension = new TestExtension();
      const manifest = extension.getManifest();

      service.registerExtension(manifest, 'local', extension);

      const result = service.getExtension('test-extension');
      expect(result).toBeDefined();
      expect(result?.manifest.id).toBe('test-extension');
    });

    it('should return null for non-existent extension', () => {
      const result = service.getExtension('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAllExtensions', () => {
    it('should return all registered extensions', () => {
      const extension1 = new TestExtension();
      const manifest1 = extension1.getManifest();

      class TestExtension2 extends BaseExtension {
        getManifest(): ExtensionManifest {
          return {
            id: 'test-extension-2',
            name: 'Test Extension 2',
            version: '1.0.0',
            description: 'Test extension 2',
            author: 'Test Author',
            capabilities: [],
          };
        }

        async executeTask(task: any): Promise<any> {
          return { success: true };
        }
      }

      const extension2 = new TestExtension2();
      const manifest2 = extension2.getManifest();

      service.registerExtension(manifest1, 'local', extension1);
      service.registerExtension(manifest2, 'local', extension2);

      const all = service.getAllExtensions();
      expect(all).toHaveLength(2);
    });
  });

  describe('getExtensionCount', () => {
    it('should return correct count of extensions', () => {
      expect(service.getExtensionCount()).toBe(0);

      const extension = new TestExtension();
      const manifest = extension.getManifest();
      service.registerExtension(manifest, 'local', extension);

      expect(service.getExtensionCount()).toBe(1);
    });
  });
});

