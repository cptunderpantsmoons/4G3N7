import { BytebotAgentModel } from '../agent/agent.types';

export const QWEN_MODELS: BytebotAgentModel[] = [
  {
    provider: 'qwen',
    name: 'qwen/qwen2.5-vl-72b-instruct',
    title: 'Qwen2.5 VL 72B',
    contextWindow: 128000,
  },
];

export const DEFAULT_MODEL = QWEN_MODELS[0];
