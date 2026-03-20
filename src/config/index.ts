/**
 * 配置模块统一入口
 *
 * 从 ~/.iris/configs/ 目录加载分文件配置。
 *
 * 配置文件：
 *   llm.yaml        - LLM 配置
 *   ocr.yaml      - OCR 配置（可选）
 *   platform.yaml - 平台配置
 *   storage.yaml  - 存储配置
 *   tools.yaml    - 工具执行配置
 *   system.yaml   - 系统配置
 *   memory.yaml   - 记忆配置（可选）
 *   mcp.yaml      - MCP 配置（可选）
 *   modes.yaml    - 模式配置（可选）
 *   sub_agents.yaml - 子代理配置（可选）
 */

import * as fs from 'fs';
import * as path from 'path';
import { configDir as globalConfigDir, projectRoot } from '../paths';
import { AppConfig } from './types';
import { parseLLMConfig } from './llm';
import { parseOCRConfig } from './ocr';
import { parsePlatformConfig } from './platform';
import { parseStorageConfig } from './storage';
import { parseToolsConfig } from './tools';
import { parseSystemConfig } from './system';
import { parseMemoryConfig } from './memory';
import { parseMCPConfig } from './mcp';
import { parseModeConfig } from './mode';
import { parseSubAgentsConfig } from './sub_agents';
import { parseComputerUseConfig } from './computer-use';
import { loadRawConfigDir } from './raw';

export type {
  AppConfig,
  LLMConfig,
  LLMModelDef,
  LLMRegistryConfig,
  PlatformConfig,
  StorageConfig,
  ToolPolicyConfig,
  ToolsConfig,
  SystemConfig,
  MemoryConfig,
  MCPConfig,
  MCPServerConfig,
  SubAgentsConfig,
  SubAgentTypeDef,
} from './types';
export type { OCRConfig } from './ocr';
export type { ComputerUseConfig } from './types';

/**
 * 返回配置目录的绝对路径。查找顺序：
 *   1. ~/.iris/configs/（或 IRIS_DATA_DIR/configs/）
 *   2. 自动从项目的 data/configs.example/ 初始化到全局目录
 */
export function findConfigFile(): string {
  // 1. 全局数据目录
  if (fs.existsSync(globalConfigDir) && fs.statSync(globalConfigDir).isDirectory()) {
    return globalConfigDir;
  }

  // 2. 首次运行：从项目模板自动初始化
  const exampleDir = path.join(projectRoot, 'data/configs.example');
  if (fs.existsSync(exampleDir) && fs.statSync(exampleDir).isDirectory()) {
    fs.cpSync(exampleDir, globalConfigDir, { recursive: true });
    console.log(`[Iris] 已初始化配置目录: ${globalConfigDir}`);
    console.log('[Iris] 请编辑配置文件（至少填写 LLM API Key）后重新启动。');
    return globalConfigDir;
  }

  throw new Error(
    `未找到配置目录。请将配置文件放置到 ${globalConfigDir}/ 目录。\n`
    + '可从项目的 data/configs.example/ 复制模板。',
  );
}

/** 加载配置 */
export function loadConfig(): AppConfig {
  const configsDir = findConfigFile();
  const data = loadRawConfigDir(configsDir);

  return {
    llm: parseLLMConfig(data.llm),
    ocr: parseOCRConfig(data.ocr),
    platform: parsePlatformConfig(data.platform),
    storage: parseStorageConfig(data.storage),
    tools: parseToolsConfig(data.tools),
    system: parseSystemConfig(data.system),
    memory: parseMemoryConfig(data.memory),
    mcp: parseMCPConfig(data.mcp),
    modes: parseModeConfig(data.modes),
    subAgents: parseSubAgentsConfig(data.sub_agents),
    computerUse: parseComputerUseConfig(data.computer_use),
  };
}


/**
 * 将配置目录重置为默认值。
 * 从 data/configs.example/ 递归复制覆盖 ~/.iris/configs/ 中的所有文件。
 */
export function resetConfigToDefaults(): { success: boolean; message: string } {
  const exampleDir = path.join(projectRoot, 'data/configs.example');
  if (!fs.existsSync(exampleDir) || !fs.statSync(exampleDir).isDirectory()) {
    return { success: false, message: '未找到默认配置模板目录。' };
  }

  // 确保目标目录存在
  if (!fs.existsSync(globalConfigDir)) {
    fs.mkdirSync(globalConfigDir, { recursive: true });
  }

  fs.cpSync(exampleDir, globalConfigDir, { recursive: true });
  return { success: true, message: `配置已重置为默认值: ${globalConfigDir}` };
}
