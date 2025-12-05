import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIUserAbortError } from 'openai';
import {
  MessageContentBlock,
  MessageContentType,
  TextContentBlock,
  ToolUseContentBlock,
  ThinkingContentBlock,
  isUserActionContentBlock,
  isComputerToolUseContentBlock,
  isImageContentBlock,
} from '@4g3n7/shared';
import { DEFAULT_MODEL } from './openrouter.constants';
import { Message, Role } from '@prisma/client';
import { openaiTools } from '../openai/openai.tools';
import {
  BytebotAgentService,
  BytebotAgentInterrupt,
  BytebotAgentResponse,
} from '../agent/agent.types';

@Injectable()
export class OpenRouterService implements BytebotAgentService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenRouterService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const baseURL =
      this.configService.get<string>('OPENROUTER_API_BASE') ||
      'https://openrouter.ai/api/v1';
    const referer = this.configService.get<string>('OPENROUTER_SITE_URL');
    const appName = this.configService.get<string>('OPENROUTER_APP_NAME');

    if (!apiKey) {
      this.logger.warn(
        'OPENROUTER_API_KEY is not set. OpenRouterService will not work properly.',
      );
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key-for-initialization',
      baseURL,
      defaultHeaders: {
        ...(referer && { 'HTTP-Referer': referer }),
        ...(appName && { 'X-Title': appName }),
      },
    });
  }

  async generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string = DEFAULT_MODEL.name,
    useTools: boolean = true,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse> {
    const normalizedModel = model.split('/').pop() || model;
    const isReasoning = normalizedModel.startsWith('o');
    try {
      const openaiMessages = this.formatMessagesForOpenRouter(messages);

      const maxTokens = 8192;
      const response = await this.openai.responses.create(
        {
          model,
          max_output_tokens: maxTokens,
          input: openaiMessages,
          instructions: systemPrompt,
          tools: useTools ? openaiTools : [],
          reasoning: isReasoning ? { effort: 'medium' } : null,
          store: false,
          include: isReasoning ? ['reasoning.encrypted_content'] : [],
        },
        { signal },
      );

      return {
        contentBlocks: this.formatOpenRouterResponse(response.output),
        tokenUsage: {
          inputTokens: response.usage?.input_tokens || 0,
          outputTokens: response.usage?.output_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      if (error instanceof APIUserAbortError) {
        this.logger.log('OpenRouter API call aborted');
        throw new BytebotAgentInterrupt();
      }
      this.logger.error(
        `Error sending message to OpenRouter: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private formatMessagesForOpenRouter(
    messages: Message[],
  ): OpenAI.Responses.ResponseInputItem[] {
    const openaiMessages: OpenAI.Responses.ResponseInputItem[] = [];

    for (const message of messages) {
      const messageContentBlocks = message.content as MessageContentBlock[];

      if (
        messageContentBlocks.every((block) => isUserActionContentBlock(block))
      ) {
        const userActionContentBlocks = messageContentBlocks.flatMap(
          (block) => block.content,
        );
        for (const block of userActionContentBlocks) {
          if (isComputerToolUseContentBlock(block)) {
            openaiMessages.push({
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: `User performed action: ${block.name}\n${JSON.stringify(block.input, null, 2)}`,
                },
              ],
            });
          } else if (isImageContentBlock(block)) {
            openaiMessages.push({
              role: 'user',
              type: 'message',
              content: [
                {
                  type: 'input_image',
                  detail: 'high',
                  image_url: `data:${block.source.media_type};base64,${block.source.data}`,
                },
              ],
            } as OpenAI.Responses.ResponseInputItem.Message);
          }
        }
      } else {
        // Convert content blocks to OpenRouter/OpenAI format
        for (const block of messageContentBlocks) {
          switch (block.type) {
            case MessageContentType.Text: {
              if (message.role === Role.USER) {
                openaiMessages.push({
                  type: 'message',
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: block.text,
                    },
                  ],
                } as OpenAI.Responses.ResponseInputItem.Message);
              } else {
                openaiMessages.push({
                  type: 'message',
                  role: 'assistant',
                  content: [
                    {
                      type: 'output_text',
                      text: block.text,
                    },
                  ],
                } as OpenAI.Responses.ResponseOutputMessage);
              }
              break;
            }
            case MessageContentType.ToolUse:
              // For assistant messages with tool use, convert to function call
              if (message.role === Role.ASSISTANT) {
                const toolBlock = block as ToolUseContentBlock;
                openaiMessages.push({
                  type: 'function_call',
                  call_id: toolBlock.id,
                  name: toolBlock.name,
                  arguments: JSON.stringify(toolBlock.input),
                } as OpenAI.Responses.ResponseFunctionToolCall);
              }
              break;

            case MessageContentType.Thinking: {
              const thinkingBlock = block;
              openaiMessages.push({
                type: 'reasoning',
                id: thinkingBlock.signature,
                encrypted_content: thinkingBlock.thinking,
                summary: [],
              } as OpenAI.Responses.ResponseReasoningItem);
              break;
            }
            case MessageContentType.ToolResult: {
              // Handle tool results as function call outputs
              const toolResult = block;

              toolResult.content.forEach((content) => {
                if (content.type === MessageContentType.Text) {
                  openaiMessages.push({
                    type: 'function_call_output',
                    call_id: toolResult.tool_use_id,
                    output: content.text,
                  } as OpenAI.Responses.ResponseInputItem.FunctionCallOutput);
                }

                if (content.type === MessageContentType.Image) {
                  openaiMessages.push({
                    type: 'function_call_output',
                    call_id: toolResult.tool_use_id,
                    output: 'screenshot',
                  } as OpenAI.Responses.ResponseInputItem.FunctionCallOutput);
                  openaiMessages.push({
                    role: 'user',
                    type: 'message',
                    content: [
                      {
                        type: 'input_image',
                        detail: 'high',
                        image_url: `data:${content.source.media_type};base64,${content.source.data}`,
                      },
                    ],
                  } as OpenAI.Responses.ResponseInputItem.Message);
                }
              });
              break;
            }

            default:
              // Handle unknown content types as text
              openaiMessages.push({
                role: 'user',
                type: 'message',
                content: [
                  {
                    type: 'input_text',
                    text: JSON.stringify(block),
                  },
                ],
              } as OpenAI.Responses.ResponseInputItem.Message);
          }
        }
      }
    }

    return openaiMessages;
  }

  private formatOpenRouterResponse(
    response: OpenAI.Responses.ResponseOutputItem[],
  ): MessageContentBlock[] {
    const contentBlocks: MessageContentBlock[] = [];

    for (const item of response) {
      switch (item.type) {
        case 'message': {
          const message = item;
          for (const content of message.content) {
            if ('text' in content) {
              contentBlocks.push({
                type: MessageContentType.Text,
                text: content.text,
              } as TextContentBlock);
            } else if ('refusal' in content) {
              contentBlocks.push({
                type: MessageContentType.Text,
                text: `Refusal: ${content.refusal}`,
              } as TextContentBlock);
            }
          }
          break;
        }

        case 'function_call': {
          const toolCall = item;
          contentBlocks.push({
            type: MessageContentType.ToolUse,
            id: toolCall.call_id,
            name: toolCall.name,
            input: JSON.parse(toolCall.arguments),
          } as ToolUseContentBlock);
          break;
        }

        case 'file_search_call':
        case 'web_search_call':
        case 'computer_call':
        case 'reasoning': {
          const reasoning = item as OpenAI.Responses.ResponseReasoningItem;
          if (reasoning.encrypted_content) {
            contentBlocks.push({
              type: MessageContentType.Thinking,
              thinking: reasoning.encrypted_content,
              signature: reasoning.id,
            } as ThinkingContentBlock);
          }
          break;
        }
        case 'image_generation_call':
        case 'code_interpreter_call':
        case 'local_shell_call':
        case 'mcp_call':
        case 'mcp_list_tools':
        case 'mcp_approval_request':
          this.logger.warn(
            `Unsupported response output item type: ${item.type}`,
          );
          contentBlocks.push({
            type: MessageContentType.Text,
            text: JSON.stringify(item),
          } as TextContentBlock);
          break;

        default:
          this.logger.warn(
            `Unknown response output item type: ${JSON.stringify(item)}`,
          );
          contentBlocks.push({
            type: MessageContentType.Text,
            text: JSON.stringify(item),
          } as TextContentBlock);
      }
    }

    return contentBlocks;
  }
}
