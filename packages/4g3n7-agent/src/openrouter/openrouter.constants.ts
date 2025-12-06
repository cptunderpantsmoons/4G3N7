import { BytebotAgentModel } from '../agent/agent.types';

export const OPENROUTER_MODELS: BytebotAgentModel[] = [
  // Premium Models - Latest December 2025
  {
    provider: 'openrouter',
    name: 'anthropic/claude-4.5-sonnet',
    title: 'Claude 4.5 Sonnet (Latest)',
    contextWindow: 200000,
    tier: 'premium',
  },
  {
    provider: 'openrouter',
    name: 'openai/gpt-5.1',
    title: 'GPT-5.1 (Latest)',
    contextWindow: 256000,
    tier: 'premium',
  },
  {
    provider: 'openrouter',
    name: 'google/gemini-2.0-pro',
    title: 'Gemini 2.0 Pro',
    contextWindow: 1000000,
    tier: 'premium',
  },

  // Standard Models - Reliable & Cost-Effective
  {
    provider: 'openrouter',
    name: 'anthropic/claude-3.5-sonnet',
    title: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    tier: 'standard',
  },
  {
    provider: 'openrouter',
    name: 'openai/gpt-4o',
    title: 'GPT-4o',
    contextWindow: 128000,
    tier: 'standard',
  },
  {
    provider: 'openrouter',
    name: 'meta-llama/llama-4-405b-instruct',
    title: 'Llama 4 405B',
    contextWindow: 131072,
    tier: 'standard',
  },
];

export const OPENROUTER_DEFAULT_MODEL = OPENROUTER_MODELS[0];
export const DEFAULT_MODEL = OPENROUTER_DEFAULT_MODEL;
