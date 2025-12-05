import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
  HttpException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Message, Task } from '@prisma/client';
import { AddTaskMessageDto } from './dto/add-task-message.dto';
import { MessagesService } from '../messages/messages.service';
import { ANTHROPIC_MODELS } from '../anthropic/anthropic.constants';
import { OPENAI_MODELS } from '../openai/openai.constants';
import { GOOGLE_MODELS } from '../google/google.constants';
import { BytebotAgentModel } from 'src/agent/agent.types';
import { OPENROUTER_DEFAULT_MODEL } from '../openrouter/openrouter.constants';
import { QWEN_MODELS } from '../qwen/qwen.constants';

const geminiApiKey = process.env.GEMINI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const openrouterBaseUrl =
  process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';
const openrouterSiteUrl = process.env.OPENROUTER_SITE_URL;
const openrouterAppName = process.env.OPENROUTER_APP_NAME;
const qwenApiKey = process.env.QWEN_API_KEY;

const proxyUrl = process.env.G3N7_LLM_PROXY_URL;

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly messagesService: MessagesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('statuses') statuses?: string,
  ): Promise<{ tasks: Task[]; total: number; totalPages: number }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Handle both single status and multiple statuses
    let statusFilter: string[] | undefined;
    if (statuses) {
      statusFilter = statuses.split(',');
    } else if (status) {
      statusFilter = [status];
    }

    return this.tasksService.findAll(pageNum, limitNum, statusFilter);
  }

  @Get('models')
  async getModels() {
    if (proxyUrl) {
      try {
        const response = await fetch(`${proxyUrl}/model/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new HttpException(
            `Failed to fetch models from proxy: ${response.statusText}`,
            HttpStatus.BAD_GATEWAY,
          );
        }

        const proxyModels = await response.json();

        // Map proxy response to BytebotAgentModel format
        const models: BytebotAgentModel[] = proxyModels.data.map(
          (model: any) => ({
            provider: 'proxy',
            name: model.litellm_params.model,
            title: model.model_name,
            contextWindow: 128000,
          }),
        );

        return models;
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          `Error fetching models: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    const models: BytebotAgentModel[] = [
      ...(anthropicApiKey ? ANTHROPIC_MODELS : []),
      ...(openaiApiKey ? OPENAI_MODELS : []),
      ...(geminiApiKey ? GOOGLE_MODELS : []),
      ...(qwenApiKey ? QWEN_MODELS : []),
    ];

    if (openrouterApiKey) {
      const openRouterModels = await this.fetchOpenRouterModels();
      models.push(...openRouterModels);
    }

    return models;
  }

  private async fetchOpenRouterModels(): Promise<BytebotAgentModel[]> {
    try {
      const response = await fetch(`${openrouterBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          ...(openrouterSiteUrl && { 'HTTP-Referer': openrouterSiteUrl }),
          ...(openrouterAppName && { 'X-Title': openrouterAppName }),
        },
      });

      if (!response.ok) {
        throw new HttpException(
          `Failed to fetch models from OpenRouter: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const { data } = await response.json();

      if (!Array.isArray(data)) {
        throw new HttpException(
          'Invalid response from OpenRouter: missing data array',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const multimodalModels = data.filter((model: any) =>
        this.modelSupportsImages(model),
      );

      if (multimodalModels.length === 0) {
        return [OPENROUTER_DEFAULT_MODEL];
      }

      return multimodalModels.map(
        (model: any): BytebotAgentModel => ({
          provider: 'openrouter',
          name: model.id,
          title: model.name || model.id,
          contextWindow:
            model.context_length ||
            model.context_length_tokens ||
            model.architecture?.context_length ||
            128000,
        }),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Error fetching OpenRouter models: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private modelSupportsImages(model: any): boolean {
    const modality = model.architecture?.modality;
    const capabilities = model.capabilities || {};

    const explicitMultimodal =
      capabilities.multimodal === true ||
      capabilities.vision === true ||
      capabilities.image === true;
    const modalityIndicatesImages =
      modality === 'multimodal' ||
      modality === 'vision' ||
      modality === 'image';

    const pricingSupportsImages =
      model.pricing?.image !== undefined && model.pricing.image !== null;

    return Boolean(
      explicitMultimodal || modalityIndicatesImages || pricingSupportsImages,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findById(id);
  }

  @Get(':id/messages')
  async taskMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<Message[]> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    const messages = await this.messagesService.findAll(taskId, options);
    return messages;
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addTaskMessage(
    @Param('id') taskId: string,
    @Body() guideTaskDto: AddTaskMessageDto,
  ): Promise<Task> {
    return this.tasksService.addTaskMessage(taskId, guideTaskDto);
  }

  @Get(':id/messages/raw')
  async taskRawMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<Message[]> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    return this.messagesService.findRawMessages(taskId, options);
  }

  @Get(':id/messages/processed')
  async taskProcessedMessages(
    @Param('id') taskId: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    };

    return this.messagesService.findProcessedMessages(taskId, options);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.tasksService.delete(id);
  }

  @Post(':id/takeover')
  @HttpCode(HttpStatus.OK)
  async takeOver(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.takeOver(taskId);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.resume(taskId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') taskId: string): Promise<Task> {
    return this.tasksService.cancel(taskId);
  }
}
