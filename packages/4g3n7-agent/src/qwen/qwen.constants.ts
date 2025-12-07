import { BytebotAgentModel } from '../agent/agent.types';

export const QWEN_MODELS: BytebotAgentModel[] = [
  // Latest Qwen Models - December 2025
  {
    provider: 'qwen',
    name: 'qwen/qwen3.0-72b-instruct',
    title: 'Qwen 3.0 72B (Latest)',
    contextWindow: 327680,
  },
  {
    provider: 'qwen',
    name: 'qwen/qwen3.0-vl-72b',
    title: 'Qwen 3.0 VL 72B (Latest Vision)',
    contextWindow: 327680,
  },

  // Established Models - Reliable & Cost-Effective
  {
    provider: 'qwen',
    name: 'qwen/qwen2.5-vl-72b-instruct',
    title: 'Qwen2.5 VL 72B',
    contextWindow: 128000,
  },
  {
    provider: 'qwen',
    name: 'qwen/qwen2.5-72b-instruct',
    title: 'Qwen2.5 72B',
    contextWindow: 131072,
  },

  // Cost-Effective Options
  {
    provider: 'qwen',
    name: 'qwen/qwen2.5-32b-instruct',
    title: 'Qwen2.5 32B',
    contextWindow: 131072,
  },
  {
    provider: 'qwen',
    name: 'qwen/qwen2.5-14b-instruct',
    title: 'Qwen2.5 14B',
    contextWindow: 131072,
  },
];

export const DEFAULT_MODEL = QWEN_MODELS[0];
