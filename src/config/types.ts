/**
 * 配置类型定义
 */

export interface LLMConfig {
  provider: 'gemini' | 'openai-compatible';
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface PlatformConfig {
  type: 'console' | 'discord' | 'telegram';
  discord: { token: string };
  telegram: { token: string };
}

export interface StorageConfig {
  type: 'json-file';
  dir: string;
}

export interface SystemConfig {
  systemPrompt: string;
  maxToolRounds: number;
  stream: boolean;
}

export interface AppConfig {
  llm: LLMConfig;
  platform: PlatformConfig;
  storage: StorageConfig;
  system: SystemConfig;
}
