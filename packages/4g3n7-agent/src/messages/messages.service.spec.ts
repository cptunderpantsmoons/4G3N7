import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a message', async () => {
      const createMessageDto = {
        taskId: 'task-1',
        role: 'user' as const,
        content: 'Test message',
      };

      const mockMessage = {
        id: 'msg-1',
        ...createMessageDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.message.create.mockResolvedValue(mockMessage);

      const result = await service.create(createMessageDto);

      expect(result).toEqual(mockMessage);
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: createMessageDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all messages for a task', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          taskId: 'task-1',
          role: 'user' as const,
          content: 'Message 1',
        },
        {
          id: 'msg-2',
          taskId: 'task-1',
          role: 'assistant' as const,
          content: 'Message 2',
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.findAll('task-1');

      expect(result).toEqual(mockMessages);
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a message by id', async () => {
      const mockMessage = {
        id: 'msg-1',
        taskId: 'task-1',
        role: 'user' as const,
        content: 'Test message',
      };

      mockPrismaService.message.findUnique.mockResolvedValue(mockMessage);

      const result = await service.findOne('msg-1');

      expect(result).toEqual(mockMessage);
      expect(mockPrismaService.message.findUnique).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
