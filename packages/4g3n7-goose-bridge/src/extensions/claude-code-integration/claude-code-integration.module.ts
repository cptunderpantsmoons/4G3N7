/**
 * Claude Code Integration Module for Goose Bridge
 * 
 * This module provides comprehensive integration of Claude Code capabilities
 * into the Goose AI Agent system, including skills registry, agent execution,
 * and model management.
 */

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClaudeSkillsRegistryService } from './skills-registry.service';
import { ClaudeAgentExecutorService } from './agent-executor.service';
import { ClaudeModelService } from './model.service';
import { ClaudeCodeController } from './claude-code-integration.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],
  providers: [
    ClaudeSkillsRegistryService,
    ClaudeAgentExecutorService,
    ClaudeModelService,
  ],
  controllers: [
    ClaudeCodeController,
  ],
  exports: [
    ClaudeSkillsRegistryService,
    ClaudeAgentExecutorService,
    ClaudeModelService,
  ],
})
export class ClaudeCodeIntegrationModule {}
