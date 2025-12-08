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
      permissions: [],
      entryPoint: 'test.ts',
      capabilities: [
        {
          id: 'test-capability',
          name: 'Test Capability',
          description: 'Test capability',
          operations: ['test'],
          requiredPermissions: [],
        },
      ],
    };
  }

  async execute(task: any): Promise<any> {
    return { success: true, taskId: task.taskId, data: {} };
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

      service.registerExtension(manifest, 'local', 'custom');

      const registered = service.getExtension('test-extension');
      expect(registered).toBeDefined();
      expect(registered?.manifest.id).toBe('test-extension');
    });

    it('should update extension when registering duplicate', () => {
      const extension = new TestExtension();
      const manifest = extension.getManifest();

      service.registerExtension(manifest, 'local', 'custom');
      service.registerExtension(manifest, 'local', 'custom');

      const registered = service.getExtension('test-extension');
      expect(registered).toBeDefined();
      expect(registered?.manifest.id).toBe('test-extension');
    });
  });

  describe('getExtension', () => {
    it('should return registered extension', () => {
      const extension = new TestExtension();
      const manifest = extension.getManifest();

      service.registerExtension(manifest, 'local', 'custom');

      const result = service.getExtension('test-extension');
      expect(result).toBeDefined();
      expect(result?.manifest.id).toBe('test-extension');
    });

    it('should return undefined for non-existent extension', () => {
      const result = service.getExtension('non-existent');
      expect(result).toBeUndefined();
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
            permissions: [],
            entryPoint: 'test2.ts',
            capabilities: [
              {
                id: 'test-capability-2',
                name: 'Test Capability 2',
                description: 'Test capability 2',
                operations: ['test2'],
                requiredPermissions: [],
              },
            ],
          };
        }

        async execute(task: any): Promise<any> {
          return { success: true, taskId: task.taskId, data: {} };
        }
      }

      const extension2 = new TestExtension2();
      const manifest2 = extension2.getManifest();

      service.registerExtension(manifest1, 'local', 'custom');
      service.registerExtension(manifest2, 'local', 'custom');

      const all = service.getAllExtensions();
      expect(all).toHaveLength(2);
    });
  });

  describe('getExtensionCount', () => {
    it('should return correct count of extensions', () => {
      expect(service.getExtensionCount()).toBe(0);

      const extension = new TestExtension();
      const manifest = extension.getManifest();
      service.registerExtension(manifest, 'local', 'custom');

      expect(service.getExtensionCount()).toBe(1);
    });
  });
});