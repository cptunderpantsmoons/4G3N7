import { Test, TestingModule } from '@nestjs/testing';
import { GooseBridgeController } from './bridge.controller';
import { GooseBridgeService } from './bridge.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import {
  ExtensionNotFoundException,
  TaskNotFoundException,
} from '../common/exceptions/custom.exceptions';
import { GooseTaskStatus, GooseTaskPriority } from '../interfaces/types';

describe('GooseBridgeController', () => {
  let controller: GooseBridgeController;
  let service: GooseBridgeService;

  const mockBridgeService = {
    listExtensions: jest.fn(),
    getExtension: jest.fn(),
    getExtensionCapabilities: jest.fn(),
    submitTask: jest.fn(),
    getTask: jest.fn(),
    getTaskResult: jest.fn(),
    listTasks: jest.fn(),
    cancelTask: jest.fn(),
    getHealth: jest.fn(),
    getMetrics: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GooseBridgeController],
      providers: [
        {
          provide: GooseBridgeService,
          useValue: mockBridgeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<GooseBridgeController>(GooseBridgeController);
    service = module.get<GooseBridgeService>(GooseBridgeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listExtensions', () => {
    it('should return list of extensions', async () => {
      const mockExtensions = {
        extensions: [
          {
            id: 'test-extension',
            name: 'Test Extension',
            version: '1.0.0',
          },
        ],
        total: 1,
      };

      mockBridgeService.listExtensions.mockResolvedValue(mockExtensions);

      const result = await controller.listExtensions();

      expect(result).toEqual(mockExtensions);
      expect(mockBridgeService.listExtensions).toHaveBeenCalled();
    });
  });

  describe('getExtension', () => {
    it('should return extension details', async () => {
      const mockExtension = {
        manifest: {
          id: 'test-extension',
          name: 'Test Extension',
        },
        registered: true,
      };

      mockBridgeService.getExtension.mockResolvedValue(mockExtension);

      const result = await controller.getExtension('test-extension');

      expect(result).toEqual(mockExtension);
    });

    it('should throw ExtensionNotFoundException when extension not found', async () => {
      mockBridgeService.getExtension.mockResolvedValue(null);

      await expect(
        controller.getExtension('non-existent'),
      ).rejects.toThrow(ExtensionNotFoundException);
    });
  });

  describe('submitTask', () => {
    it('should submit a task successfully', async () => {
      const taskDto = {
        type: 'test',
        extensionId: 'test-extension',
        payload: { test: 'data' },
      };

      const mockTask = {
        taskId: 'task-1',
        status: GooseTaskStatus.PENDING,
        type: 'test',
        extensionId: 'test-extension',
      };

      mockBridgeService.submitTask.mockResolvedValue(mockTask);

      const result = await controller.submitTask(taskDto);

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(mockBridgeService.submitTask).toHaveBeenCalledWith(taskDto);
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status', async () => {
      const mockTask = {
        taskId: 'task-1',
        status: GooseTaskStatus.RUNNING,
        type: 'test',
        extensionId: 'test-extension',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBridgeService.getTask.mockResolvedValue(mockTask);

      const result = await controller.getTaskStatus('task-1');

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(result.status).toBe(GooseTaskStatus.RUNNING);
    });

    it('should throw TaskNotFoundException when task not found', async () => {
      mockBridgeService.getTask.mockResolvedValue(null);

      await expect(controller.getTaskStatus('non-existent')).rejects.toThrow(
        TaskNotFoundException,
      );
    });
  });
});

