import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { TasksModule } from './tasks/tasks.module';
import { MessagesModule } from './messages/messages.module';
import { AnthropicModule } from './anthropic/anthropic.module';
import { OpenAIModule } from './openai/openai.module';
import { GoogleModule } from './google/google.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SummariesModule } from './summaries/summaries.module';
import { ProxyModule } from './proxy/proxy.module';
import { OpenRouterModule } from './openrouter/openrouter.module';
import { QwenModule } from './qwen/qwen.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { LoggingModule } from './logging/logging.module';
import { LoggerController } from './logging/logger.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggingModule.forRoot({
      maxLogsInMemory: 50000,
      customServiceName: '4g3n7-agent',
      enableConsoleInterception: true,
      externalLogging: true,
    }),
    AgentModule,
    TasksModule,
    MessagesModule,
    SummariesModule,
    AnthropicModule,
    OpenAIModule,
    GoogleModule,
    ProxyModule,
    OpenRouterModule,
    QwenModule,
    FileStorageModule,
    PrismaModule,
  ],
  controllers: [AppController, LoggerController],
  providers: [AppService],
})
export class AppModule {}
