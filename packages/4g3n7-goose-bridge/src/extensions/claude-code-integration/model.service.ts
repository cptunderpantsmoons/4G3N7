/**
 * Claude Code Model Service for Goose Bridge
 * 
 * This service manages Claude Code models and provides an interface for
 * generating responses using Claude's agent capabilities within Goose.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Anthropic from '@anthropic-ai/sdk';
import { 
  ClaudeAgentModel, 
  ClaudeModelService as ClaudeModelServiceContract, 
  ClaudeToolDefinition,
  MessageContentBlock,
  MessageContentType,
  ToolUseContentBlock,
  ThinkingContentBlock,
  TextContentBlock
} from './skills.interface';

@Injectable()
export class ClaudeModelService implements ClaudeModelServiceContract {
  private readonly logger = new Logger(ClaudeModelService.name);
  private anthropic: any;
  private availableModels: ClaudeAgentModel[];

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.initializeModels();
    this.initializeAnthropic();
  }

  /**
   * Initialize available models
   */
  private initializeModels(): void {
    this.availableModels = [
      {
        name: 'sonnet-4',
        provider: 'anthropic',
        capabilities: ['text', 'code', 'tools'],
        maxTokens: 200000,
        temperature: 0.7,
      },
      {
        name: 'opus-4',
        provider: 'anthropic',
        capabilities: ['text', 'code', 'tools', 'vision'],
        maxTokens: 200000,
        temperature: 0.7,
      },
      {
        name: 'haiku-4',
        provider: 'anthropic',
        capabilities: ['text', 'code'],
        maxTokens: 200000,
        temperature: 0.7,
      },
    ];
  }

  /**
   * Initialize Anthropic client
   */
  private initializeAnthropic(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not found. Claude model service will not work.');
      return;
    }

    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Get a specific model by name
   */
  async getModel(modelName: string): Promise<ClaudeAgentModel> {
    const model = this.availableModels.find(m => m.name === modelName);
    
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    return model;
  }

  /**
   * List all available models
   */
  async listAvailableModels(): Promise<ClaudeAgentModel[]> {
    return this.availableModels;
  }

  /**
   * Generate a response using Claude
   */
  async generateResponse(
    systemPrompt: string,
    messages: MessageContentBlock[],
    model: ClaudeAgentModel,
    tools?: ClaudeToolDefinition[]
  ): Promise<MessageContentBlock[]> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
    }

    try {
      // Convert message content blocks to Anthropic format
      const anthropicMessages = this.convertToAnthropicMessages(messages);
      
      // Convert tools to Anthropic format
      const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;

      this.logger.log(`Generating response with model ${model.name}`);

      // Make API call
      const response = await this.anthropic.messages.create({
        model: model.name,
        max_tokens: model.maxTokens,
        temperature: model.temperature,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      // Convert response back to our format
      const result = this.convertFromAnthropicResponse(response.content);
      
      this.logger.log(`Response generated successfully (${response.content.length} content blocks)`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to generate response', error);
      throw error;
    }
  }

  /**
   * Private conversion methods
   */

  private convertToAnthropicMessages(messages: MessageContentBlock[]): any[] {
    return messages.map(message => {
      switch (message.type) {
        case MessageContentType.Text:
          return {
            role: 'user',
            content: [{ type: 'text', text: message.text }],
          };

        case MessageContentType.ToolUse:
          const toolUse = message as ToolUseContentBlock;
          return {
            role: 'assistant',
            content: [{
              type: 'tool_use',
              id: toolUse.id,
              name: toolUse.name,
              input: toolUse.input,
            }],
          };

        case MessageContentType.Thinking:
          const thinking = message as ThinkingContentBlock;
          return {
            role: 'assistant',
            content: [{
              type: 'thinking',
              thinking: thinking.thinking,
              signature: thinking.signature,
            }],
          };

        default:
          return {
            role: 'user',
            content: [{ type: 'text', text: 'Unknown message type' }],
          };
      }
    });
  }

  private convertToAnthropicTools(tools: ClaudeToolDefinition[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  private convertFromAnthropicResponse(
    content: any[]
  ): MessageContentBlock[] {
    return content.map(block => {
      switch (block.type) {
        case 'text':
          return {
            type: MessageContentType.Text,
            text: block.text,
          } as TextContentBlock;

        case 'tool_use':
          return {
            type: MessageContentType.ToolUse,
            id: block.id,
            name: block.name,
            input: block.input,
          } as ToolUseContentBlock;

        case 'thinking':
          return {
            type: MessageContentType.Thinking,
            thinking: block.thinking,
            signature: block.signature,
          } as ThinkingContentBlock;

        default:
          return {
            type: MessageContentType.Text,
            text: 'Unknown content type',
          } as TextContentBlock;
      }
    });
  }

  /**
   * Advanced features
   */

  /**
   * Generate with streaming support
   */
  async generateResponseStream(
    systemPrompt: string,
    messages: MessageContentBlock[],
    model: ClaudeAgentModel,
    tools?: ClaudeToolDefinition[],
    onChunk?: (chunk: MessageContentBlock) => void
  ): Promise<MessageContentBlock[]> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
    }

    try {
      const anthropicMessages = this.convertToAnthropicMessages(messages);
      const anthropicTools = tools ? this.convertToAnthropicTools(tools) : undefined;

      const stream = await this.anthropic.messages.create({
        model: model.name,
        max_tokens: model.maxTokens,
        temperature: model.temperature,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools,
        stream: true,
      });

      const result: MessageContentBlock[] = [];
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          const textBlock: TextContentBlock = {
            type: MessageContentType.Text,
            text: chunk.delta.text || '',
          };
          
          if (onChunk) {
            onChunk(textBlock);
          }
          
          result.push(textBlock);
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to generate streaming response', error);
      throw error;
    }
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(modelName: string): string[] {
    const model = this.availableModels.find(m => m.name === modelName);
    return model ? model.capabilities : [];
  }

  /**
   * Check if model supports tools
   */
  modelSupportsTools(modelName: string): boolean {
    const model = this.availableModels.find(m => m.name === modelName);
    return model ? model.capabilities.includes('tools') : false;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return Boolean(this.anthropic);
  }
}
