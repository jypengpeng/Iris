/**
 * 提示词组装器
 *
 * 负责将系统提示词、聊天历史、工具声明、生成配置组装为完整的 LLMRequest。
 * 支持动态插入提示词片段（Part），可用于注入时间、用户信息等上下文。
 */

import { Content, Part, LLMRequest, FunctionDeclaration } from '../types';

export class PromptAssembler {
  private systemParts: Part[] = [];
  private generationConfig?: LLMRequest['generationConfig'];

  /** 设置系统提示词（替换当前全部） */
  setSystemPrompt(text: string): void {
    this.systemParts = [{ text }];
  }

  /** 追加系统提示词片段 */
  addSystemPart(part: Part): void {
    this.systemParts.push(part);
  }

  /** 清空系统提示词 */
  clearSystemParts(): void {
    this.systemParts = [];
  }

  /** 设置默认生成配置 */
  setGenerationConfig(config: LLMRequest['generationConfig']): void {
    this.generationConfig = config;
  }

  /**
   * 组装完整的 LLM 请求
   *
   * @param history    聊天历史（Content[]）
   * @param toolDecls  工具声明列表（可选）
   * @param overrides生成配置覆盖（可选）
   */
  assemble(
    history: Content[],
    toolDecls?: FunctionDeclaration[],
    overrides?: LLMRequest['generationConfig'],
  ): LLMRequest {
    const request: LLMRequest = {
      // 剥离 usageMetadata（仅存储用，不发送给 LLM）
      contents: history.map(({ role, parts }) => ({ role, parts })),
    };

    // 系统提示词
    if (this.systemParts.length > 0) {
      request.systemInstruction = { parts: [...this.systemParts] };
    }

    // 工具声明
    if (toolDecls && toolDecls.length > 0) {
      request.tools = [{ functionDeclarations: toolDecls }];
    }

    // 生成配置
    const config = overrides ?? this.generationConfig;
    if (config) {
      request.generationConfig = config;
    }

    return request;
  }
}
