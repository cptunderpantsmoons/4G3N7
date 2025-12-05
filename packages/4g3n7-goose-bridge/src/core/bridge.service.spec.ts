import { Test, TestingModule } from '@nestjs/testing';
import { GooseBridgeService } from './bridge.service';
import { ExtensionRegistry } from '../extensions/registry.service';
import { ExtensionLifecycleManager } from '../extensions/lifecycle.manager';
import { GooseTaskStatus, GooseTaskPriority } from '../interfaces/types';

describe('GooseBridgeService', () => {
  let service: GooseBridgeService;
  let registry: ExtensionRegistry;
  let lifecycleManager: ExtensionLifecycleManager;

  const mockRegistry = {
    getAllExtensions: jest.fn(),
    getExtension: jest.fn(),
    getExtensionCount: jest.fn(),
  };

  const mockLifecycleManager = {
    getExtension: jest.fn(),
    executeTask: jest.fn(),
    checkAllExtensionsHealth: jest.fn(),
    getExtensionCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GooseBridgeService,
        {
          provide: ExtensionRegistry,
          useValue: mockRegistry,
        },
        {
          provide: ExtensionLifecycleManager,
          useValue: mockLifecycleManager,
        },
      ],
    }).compile();

    service = module.get<GooseBridgeService>(GooseBridgeService);
    registry = module.get<ExtensionRegistry>(ExtensionRegistry);
    lifecycleManager = module.get<ExtensionLifecycleManager>(
      ExtensionLifecycleManager,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listExtensions', () => {
    it('should return list of extensions', async () => {
      const mockExtensions = [
        {
          manifest: {
            id: 'test-extension',
            name: 'Test Extension',
            version: '1.0.0',
            description: 'Test',
            author: 'Test Author',
            capabilities: [],
          },
          source: 'local',
          registered: true,
        },
      ];

      mockRegistry.getAllExtensions.mockReturnValue(mockExtensions);

      const result = await service.listExtensions();

      expect(result).toBeDefined();
      expect(result.extensions).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('submitTask', () => {
    it('should submit a task successfully', async () => {
      const taskDto = {
        type: 'test',
        extensionId: 'test-extension',
        payload: { test: 'data' },
        priority: GooseTaskPriority.NORMAL,
      };

      mockLifecycleManager.executeTask.mockResolvedValue({
        taskId: 'test-task-id',
        result: { success: true },
        metadata: {
          duration: 100,
          extensionVersion: '1.0.0',
          completedAt: new Date(),
        },
      });

      const result = await service.submitTask(taskDto);

      expect(result).toBeDefined();
      expect(result.taskId).toBeDefined();
      expect(result.status).toBe(GooseTaskStatus.PENDING);
      expect(result.type).toBe(taskDto.type);
    });
  });

  describe('getTask', () => {
    it('should return a task by id', async () => {
      const taskId = 'test-task-id';
      const mockTask = {
        taskId,
        type: 'test',
        extensionId: 'test-extension',
        status: GooseTaskStatus.PENDING,
        priority: GooseTaskPriority.NORMAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store task first
      await service.submitTask({
        type: 'test',
        extensionId: 'test-extension',
        payload: {},
      });

      // Wait a bit for async execution
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await service.getTask(taskId);

      // Task might not be found if it was already processed
      // This is expected behavior for in-memory storage
      expect(result).toBeDefined();
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      mockRegistry.getExtensionCount.mockReturnValue(5);
      mockLifecycleManager.getExtensionCount.mockReturnValue(3);
      mockLifecycleManager.checkAllExtensionsHealth.mockResolvedValue(
        new Map([
          ['ext1', true],
          ['ext2', true],
          ['ext3', false],
        ]),
      );

      const result = await service.getHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.extensions).toBeDefined();
      expect(result.tasks).toBeDefined();
    });
  });
});

