import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  Task,
  Role,
  Prisma,
  TaskStatus,
  TaskType,
  TaskPriority,
  File,
} from '@prisma/client';
import { AddTaskMessageDto } from './dto/add-task-message.dto';
import { TasksGateway } from './tasks.gateway';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TasksOptimizedService {
  private readonly logger = new Logger(TasksOptimizedService.name);

  constructor(
    readonly prisma: PrismaService,
    @Inject(forwardRef(() => TasksGateway))
    private readonly tasksGateway: TasksGateway,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('TasksOptimizedService initialized');
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(
      `Creating new task with description: ${createTaskDto.description}`,
    );

    const task = await this.prisma.$transaction(async (prisma) => {
      // Create the task first
      this.logger.debug('Creating task record in database');
      const task = await prisma.task.create({
        data: {
          description: createTaskDto.description,
          type: createTaskDto.type || TaskType.IMMEDIATE,
          priority: createTaskDto.priority || TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
          createdBy: createTaskDto.createdBy || Role.USER,
          model: createTaskDto.model,
          ...(createTaskDto.scheduledFor
            ? { scheduledFor: createTaskDto.scheduledFor }
            : {}),
        },
        // Include commonly accessed data to avoid extra queries
        include: {
          files: false, // Don't include files by default
        },
      });
      this.logger.log(`Task created successfully with ID: ${task.id}`);

      let filesDescription = '';

      // Save files if provided - optimized batch insert
      if (createTaskDto.files && createTaskDto.files.length > 0) {
        this.logger.debug(
          `Saving ${createTaskDto.files.length} file(s) for task ID: ${task.id}`,
        );
        filesDescription += `\n`;

        // Prepare file data for batch insert
        const fileData = createTaskDto.files.map((file) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: file.base64.includes('base64,')
            ? file.base64.split('base64,')[1]
            : file.base64,
          taskId: task.id,
        }));

        filesDescription += createTaskDto.files
          .map((file) => `\nFile ${file.name} written to desktop.`)
          .join('');

        // Batch insert files for better performance
        await prisma.file.createMany({
          data: fileData,
        });
        this.logger.debug(`Files saved successfully for task ID: ${task.id}`);
      }

      // Create the initial system message
      this.logger.debug(`Creating initial message for task ID: ${task.id}`);
      await prisma.message.create({
        data: {
          content: [
            {
              type: 'text',
              text: `${createTaskDto.description} ${filesDescription}`,
            },
          ] as Prisma.InputJsonValue,
          role: Role.USER,
          taskId: task.id,
        },
      });
      this.logger.debug(`Initial message created for task ID: ${task.id}`);

      return task;
    });

    this.tasksGateway.emitTaskCreated(task);
    return task;
  }

  async findScheduledTasks(): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        scheduledFor: {
          not: null,
        },
        queuedAt: null,
      },
      orderBy: [{ scheduledFor: 'asc' }],
      // Use select for better performance - only return needed fields
      select: {
        id: true,
        description: true,
        priority: true,
        scheduledFor: true,
        status: true,
        model: true,
        type: true,
        control: true,
        createdAt: true,
        updatedAt: true,
        executedAt: true,
        completedAt: true,
        error: true,
        createdBy: true,
        queuedAt: true,
        result: true,
      },
    }) as Promise<Task[]>;
  }

  async findNextTask(): Promise<(Task & { files: File[] }) | null> {
    // Use raw SQL for optimal performance with complex ordering
    const task = await this.prisma.$queryRaw`
      SELECT
        t.*,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', f.id,
            'name', f.name,
            'type', f.type,
            'size', f.size
          ) ORDER BY f.createdAt
        ) as files
      FROM "Task" t
      LEFT JOIN "File" f ON t.id = f."taskId"
      WHERE t.status IN ('RUNNING', 'PENDING')
      GROUP BY t.id
      ORDER BY
        t."executedAt" ASC NULLS FIRST,
        t.priority DESC,
        t."queuedAt" ASC NULLS FIRST,
        t.createdAt ASC
      LIMIT 1
    `;

    if (task && Array.isArray(task) && task.length > 0) {
      const taskRecord = task[0];
      this.logger.log(
        `Found existing task with ID: ${taskRecord.id}, and status ${taskRecord.status}. Resuming.`,
      );
      return taskRecord;
    }

    return null;
  }

  async findAll(
    page = 1,
    limit = 10,
    statuses?: string[],
  ): Promise<{ tasks: Task[]; total: number; totalPages: number }> {
    this.logger.log(
      `Retrieving tasks - page: ${page}, limit: ${limit}, statuses: ${statuses?.join(',')}`,
    );

    const skip = (page - 1) * limit;

    const whereClause: Prisma.TaskWhereInput =
      statuses && statuses.length > 0
        ? { status: { in: statuses as TaskStatus[] } }
        : {};

    // Use cursor-based pagination for better performance on large datasets
    if (page > 1) {
      const previousPageLastTask = await this.prisma.task.findFirst({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit - 1,
      });

      if (previousPageLastTask) {
        whereClause.createdAt = { lt: previousPageLastTask.createdAt };
      }
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        // Use select for better performance
        select: {
          id: true,
          description: true,
          status: true,
          priority: true,
          type: true,
          control: true,
          createdAt: true,
          updatedAt: true,
          executedAt: true,
          completedAt: true,
          scheduledFor: true,
          model: true,
          error: true,
          createdBy: true,
          queuedAt: true,
          result: true,
        },
      }),
      this.prisma.task.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);
    this.logger.debug(`Retrieved ${tasks.length} tasks out of ${total} total`);

    return { tasks, total, totalPages };
  }

  async findByIdOptimized(id: string): Promise<Task> {
    this.logger.log(`Retrieving task by ID: ${id}`);

    // Use raw query with only needed columns for better performance
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        control: true,
        createdAt: true,
        updatedAt: true,
        executedAt: true,
        completedAt: true,
        scheduledFor: true,
        model: true,
        error: true,
        createdBy: true,
        queuedAt: true,
        result: true,
      },
    });

    if (!task) {
      this.logger.warn(`Task with ID: ${id} not found`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    this.logger.debug(`Retrieved task with ID: ${id}`);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    this.logger.log(`Updating task with ID: ${id}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateTaskDto)}`);

    // Optimized update - only check existence if needed
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, status: true, control: true },
    });

    if (!existingTask) {
      this.logger.warn(`Task with ID: ${id} not found for update`);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    let updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      // Select only updated fields for performance
      select: {
        id: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        control: true,
        createdAt: true,
        updatedAt: true,
        executedAt: true,
        completedAt: true,
        scheduledFor: true,
        model: true,
        error: true,
        createdBy: true,
        queuedAt: true,
        result: true,
      },
    }) as unknown as Task;

    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      this.eventEmitter.emit('task.completed', { taskId: id });
    } else if (updateTaskDto.status === TaskStatus.NEEDS_HELP) {
      updatedTask = await this.takeOver(id);
    } else if (updateTaskDto.status === TaskStatus.FAILED) {
      this.eventEmitter.emit('task.failed', { taskId: id });
    }

    this.logger.log(`Successfully updated task ID: ${id}`);
    this.tasksGateway.emitTaskUpdate(id, updatedTask);

    return updatedTask;
  }

  // Optimized file retrieval with pagination
  async findTaskFiles(
    taskId: string,
    page = 1,
    limit = 20,
  ): Promise<{ files: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { taskId },
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          createdAt: true,
          updatedAt: true,
          taskId: true,
          data: true,
          objectStorageKey: true,
          objectStorageSize: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.file.count({ where: { taskId } }),
    ]);

    return { files, total };
  }

  // Optimized message retrieval with cursor pagination
  async findTaskMessagesCursor(
    taskId: string,
    cursor?: string,
    limit = 50,
  ): Promise<{ messages: any[]; nextCursor?: string }> {
    const messages = await this.prisma.message.findMany({
      where: {
        taskId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        summaryId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to determine if there's a next page
    });

    const hasNextPage = messages.length > limit;
    if (hasNextPage) {
      messages.pop(); // Remove the extra item
    }

    const nextCursor = hasNextPage
      ? messages[messages.length - 1].id
      : undefined;

    return {
      messages: messages.reverse(), // Reverse to get chronological order
      nextCursor,
    };
  }

  // Reuse existing methods for consistency
  async delete(id: string): Promise<Task> {
    this.logger.log(`Deleting task with ID: ${id}`);

    const deletedTask = await this.prisma.task.delete({
      where: { id },
    });

    this.logger.log(`Successfully deleted task ID: ${id}`);
    this.tasksGateway.emitTaskDeleted(id);

    return deletedTask;
  }

  async addTaskMessage(taskId: string, addTaskMessageDto: AddTaskMessageDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });

    if (!task) {
      this.logger.warn(`Task with ID: ${taskId} not found for guiding`);
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const message = await this.prisma.message.create({
      data: {
        content: [{ type: 'text', text: addTaskMessageDto.message }],
        role: Role.USER,
        taskId,
      },
    });

    this.tasksGateway.emitNewMessage(taskId, message);
    return task;
  }

  async resume(taskId: string): Promise<Task> {
    this.logger.log(`Resuming task ID: ${taskId}`);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, control: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (task.control !== Role.USER) {
      throw new BadRequestException(`Task ${taskId} is not under user control`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        control: Role.ASSISTANT,
        status: TaskStatus.RUNNING,
      },
    });

    try {
      await fetch(
        `${this.configService.get<string>('G3N7_DESKTOP_BASE_URL')}/input-tracking/stop`,
        { method: 'POST' },
      );
    } catch (error) {
      this.logger.error('Failed to stop input tracking', error);
    }

    this.eventEmitter.emit('task.resume', { taskId });
    this.logger.log(`Task ${taskId} resumed`);
    this.tasksGateway.emitTaskUpdate(taskId, updatedTask);

    return updatedTask;
  }

  async takeOver(taskId: string): Promise<Task> {
    this.logger.log(`Taking over control for task ID: ${taskId}`);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, control: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (task.control !== Role.ASSISTANT) {
      throw new BadRequestException(
        `Task ${taskId} is not under agent control`,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        control: Role.USER,
      },
    });

    try {
      await fetch(
        `${this.configService.get<string>('G3N7_DESKTOP_BASE_URL')}/input-tracking/start`,
        { method: 'POST' },
      );
    } catch (error) {
      this.logger.error('Failed to start input tracking', error);
    }

    this.eventEmitter.emit('task.takeover', { taskId });
    this.logger.log(`Task ${taskId} takeover initiated`);
    this.tasksGateway.emitTaskUpdate(taskId, updatedTask);

    return updatedTask;
  }

  async cancel(taskId: string): Promise<Task> {
    this.logger.log(`Cancelling task ID: ${taskId}`);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.FAILED ||
      task.status === TaskStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Task ${taskId} is already completed, failed, or cancelled`,
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
      },
    });

    this.eventEmitter.emit('task.cancel', { taskId });
    this.logger.log(`Task ${taskId} cancelled and marked as failed`);
    this.tasksGateway.emitTaskUpdate(taskId, updatedTask);

    return updatedTask;
  }
}
