/**
 * LLM 配置解析
 */

import { LLMConfig, LLMModelDef, LLMRegistryConfig } from './types';

export const DEFAULT_MODEL_NAME = 'default';

export const DEFAULTS: Record<string, Partial<LLMConfig> & { contextWindow?: number }> = {
  'gemini': {
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    contextWindow: 1048576,
  },
  'openai-compatible': {
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    contextWindow: 128000,
  },
  'claude': {
    model: 'claude-sonnet-4-6',
    baseUrl: 'https://api.anthropic.com/v1',
    contextWindow: 200000,
  },
  'openai-responses': {
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    contextWindow: 128000,
  },
};

/** 解析单个 LLM 提供商配置 */
export function parseSingleLLMConfig(raw: any = {}): LLMConfig {
  const provider = (raw.provider ?? 'gemini') as LLMConfig['provider'];
  const defaults = DEFAULTS[provider] ?? {};

  return {
    provider,
    apiKey: raw.apiKey ?? '',
    model: raw.model || defaults.model || '',
    baseUrl: raw.baseUrl || defaults.baseUrl || '',
    contextWindow: typeof raw.contextWindow === 'number' ? raw.contextWindow : defaults.contextWindow,
    supportsVision: typeof raw.supportsVision === 'boolean' ? raw.supportsVision : undefined,
    headers: raw.headers && typeof raw.headers === 'object' && !Array.isArray(raw.headers) ? raw.headers : undefined,
    requestBody: raw.requestBody && typeof raw.requestBody === 'object' && !Array.isArray(raw.requestBody) ? raw.requestBody : undefined,
  };
}

function normalizeModelName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toModelDef(modelName: string, raw: any): LLMModelDef {
  return {
    modelName,
    ...parseSingleLLMConfig(raw),
  };
}

function hasObjectModels(raw: any): boolean {
  return !!raw?.models && typeof raw.models === 'object' && !Array.isArray(raw.models);
}

function hasLegacyLLMShape(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return !!(
    raw.primary
    || raw.secondary
    || raw.light
    || raw.provider
    || raw.apiKey
    || raw.model
    || raw.baseUrl
  );
}

/** 解析模型池配置 */
export function parseLLMConfig(raw: any = {}): LLMRegistryConfig {
  if (hasObjectModels(raw)) {
    const models = Object.entries(raw.models)
      .map(([modelName, value]) => ({ modelName: normalizeModelName(modelName), value }))
      .filter(({ modelName, value }) => !!modelName && value && typeof value === 'object' && !Array.isArray(value))
      .map(({ modelName, value }) => toModelDef(modelName!, value));

    if (models.length > 0) {
      const modelNames = new Set(models.map(model => model.modelName));
      const requestedDefault = normalizeModelName(raw.defaultModel);
      return {
        defaultModelName: requestedDefault && modelNames.has(requestedDefault) ? requestedDefault : models[0].modelName,
        models,
      };
    }
  }

  if (hasLegacyLLMShape(raw)) {
    throw new Error('llm.yaml 已不再支持旧格式。请改用 defaultModel + models.<modelName>。');
  }

  return {
    defaultModelName: DEFAULT_MODEL_NAME,
    models: [toModelDef(DEFAULT_MODEL_NAME, {})],
  };
}
