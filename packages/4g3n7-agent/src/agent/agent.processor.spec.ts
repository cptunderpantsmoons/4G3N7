import { Test, TestingModule } from '@nestjs/testing';
import { AgentProcessor } from './agent.processor';
import { TasksService } from '../tasks/tasks.service';
import { MessagesService } from '../messages/messages.service';
import { InputCaptureService } from './input-capture.service';
import { Logger } from '@nestjs/common';

describe('AgentProcessor', () => {
  let service: AgentProcessor;
  let tasksService: TasksService;
  let messagesService: MessagesService;

  const mockTasksService = {
    findOne: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  const mockMessagesService = {
    create: jest.fn(),
    findAll: jest.fn(),
  };

  const mockInputCaptureService = {
    startCapture: jest.fn(),
    stopCapture: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentProcessor,
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
        {
          provide: InputCaptureService,
          useValue: mockInputCaptureService,
        },
      ],
    }).compile();

    service = module.get<AgentProcessor>(AgentProcessor);
    tasksService = module.get<TasksService>(TasksService);
    messagesService = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isRunning', () => {
    it('should return false when not processing', () => {
      expect(service.isRunning()).toBe(false);
    });
  });

  describe('getCurrentTaskId', () => {
    it('should return null when no task is being processed', () => {
      expect(service.getCurrentTaskId()).toBeNull();
    });
  });
});
