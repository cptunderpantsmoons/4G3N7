import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { MessagesModule } from '../messages/messages.module';
import { AnthropicModule } from '../anthropic/anthropic.module';
import { AgentProcessor } from './agent.processor';
import { ConfigModule } from '@nestjs/config';
import { AgentScheduler } from './agent.scheduler';
import { InputCaptureService } from './input-capture.service';
import { OpenAIModule } from '../openai/openai.module';
import { GoogleModule } from '../google/google.module';
import { SummariesModule } from 'src/summaries/summaries.module';
import { AgentAnalyticsService } from './agent.analytics';
import { ProxyModule } from 'src/proxy/proxy.module';
import { OpenRouterModule } from 'src/openrouter/openrouter.module';
import { QwenModule } from 'src/qwen/qwen.module';

@Module({
  imports: [
    ConfigModule,
    TasksModule,
    MessagesModule,
    SummariesModule,
    AnthropicModule,
    OpenAIModule,
    GoogleModule,
    ProxyModule,
    OpenRouterModule,
    QwenModule,
  ],
  providers: [
    AgentProcessor,
    AgentScheduler,
    InputCaptureService,
    AgentAnalyticsService,
  ],
  exports: [AgentProcessor],
})
export class AgentModule {}
