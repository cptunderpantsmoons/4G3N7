import { BytebotAgentModel } from '../agent/agent.types';

export const ANTHROPIC_MODELS: BytebotAgentModel[] = [
  {
    provider: 'anthropic',
    name: 'claude-4-5-sonnet-20241022',
    title: 'Claude 4.5 Sonnet (Latest)',
    contextWindow: 200000,
  },
  {
    provider: 'anthropic',
    name: 'claude-opus-4-1-20250805',
    title: 'Claude Opus 4.1',
    contextWindow: 200000,
  },
];

export const DEFAULT_MODEL = ANTHROPIC_MODELS[0];
