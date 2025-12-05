import { BytebotAgentModel } from '../agent/agent.types';

export const OPENROUTER_DEFAULT_MODEL: BytebotAgentModel = {
  provider: 'openrouter',
  name: 'anthropic/claude-4.5-sonnet',
  title: 'OpenRouter Claude 4.5 Sonnet',
  contextWindow: 200000,
};

export const DEFAULT_MODEL = OPENROUTER_DEFAULT_MODEL;
