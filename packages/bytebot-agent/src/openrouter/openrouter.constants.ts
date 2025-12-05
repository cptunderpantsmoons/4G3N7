import { BytebotAgentModel } from '../agent/agent.types';

export const OPENROUTER_DEFAULT_MODEL: BytebotAgentModel = {
  provider: 'openrouter',
  name: 'openai/gpt-4.1',
  title: 'OpenRouter GPT-4.1',
  contextWindow: 128000,
};

export const DEFAULT_MODEL = OPENROUTER_DEFAULT_MODEL;
