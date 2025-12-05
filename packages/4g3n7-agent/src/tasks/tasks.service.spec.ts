import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../logging/logger.service';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockTasksGateway = {
    emitTaskUpdate: jest.fn(),
    emitNewMessage: jest.fn(),
    emitTaskCreated: jest.fn(),
    emitTaskDeleted: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TasksGateway,
          useValue: mockTasksGateway,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto = {
        description: 'Test task',
        type: 'GENERAL' as const,
      };

      const mockTask = {
        id: '1',
        description: 'Test task',
        status: 'PENDING' as const,
        type: 'GENERAL' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto);

      expect(result).toBeDefined();
      expect(result.description).toBe(createTaskDto.description);
      expect(mockPrismaService.task.create).toHaveBeenCalled();
    });

    it('should throw error if task creation fails', async () => {
      const createTaskDto = {
        description: 'Test task',
        type: 'GENERAL' as const,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.task.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createTaskDto)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const mockTasks = [
        {
          id: '1',
          description: 'Task 1',
          status: 'PENDING' as const,
          type: 'GENERAL' as const,
        },
        {
          id: '2',
          description: 'Task 2',
          status: 'COMPLETED' as const,
          type: 'GENERAL' as const,
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll({});

      expect(result).toEqual(mockTasks);
      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        id: '1',
        description: 'Test task',
        status: 'PENDING' as const,
        type: 'GENERAL' as const,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne('1');

      expect(result).toEqual(mockTask);
      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow();
    });
  });
});

