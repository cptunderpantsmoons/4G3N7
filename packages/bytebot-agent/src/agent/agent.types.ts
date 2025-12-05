import { Message } from '@prisma/client';
import { MessageContentBlock } from '@4g3n7/shared';

export interface BytebotAgentResponse {
  contentBlocks: MessageContentBlock[];
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface BytebotAgentService {
  generateMessage(
    systemPrompt: string,
    messages: Message[],
    model: string,
    useTools: boolean,
    signal?: AbortSignal,
  ): Promise<BytebotAgentResponse>;
}

export interface BytebotAgentModel {
  provider: 'anthropic' | 'openai' | 'google' | 'proxy' | 'openrouter' | 'qwen';
  name: string;
  title: string;
  contextWindow?: number;
}

export class BytebotAgentInterrupt extends Error {
  constructor() {
    super('BytebotAgentInterrupt');
    this.name = 'BytebotAgentInterrupt';
  }
}
