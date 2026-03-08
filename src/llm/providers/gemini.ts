/**
 * Gemini Provider
 */

import { LLMProvider } from './base';
import { GeminiFormat } from '../formats/gemini';

export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export function createGeminiProvider(config: GeminiProviderConfig): LLMProvider {
  const model = config.model ?? 'gemini-2.0-flash';
  const baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com';
  const key = config.apiKey;

  return new LLMProvider(
    new GeminiFormat(),
    {
      url: `${baseUrl}/v1beta/models/${model}:generateContent?key=${key}`,
      streamUrl: `${baseUrl}/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`,
      headers: {},
    },
    'Gemini',
  );
}
