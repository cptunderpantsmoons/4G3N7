import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { MessagesService } from '../messages/messages.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addMessage: jest.fn(),
  };

  const mockMessagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto = {
        description: 'Test task',
        type: 'GENERAL' as const,
      };

      const mockTask = {
        id: '1',
        ...createTaskDto,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(mockTask);
      expect(mockTasksService.create).toHaveBeenCalledWith(createTaskDto);
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
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll({});

      expect(result).toEqual(mockTasks);
      expect(mockTasksService.findAll).toHaveBeenCalled();
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

      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockTask);
      expect(mockTasksService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException('Task not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

