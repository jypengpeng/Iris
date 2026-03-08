/**
 * 工具类型定义
 *
 * 定义 LLM 可调用的工具（函数）的声明和处理器。
 * 声明格式遵循 Gemini FunctionDeclaration 规范。
 */

/** JSON Schema 参数描述 */
export interface ParameterSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: ParameterSchema;
  properties?: Record<string, ParameterSchema>;
  required?: string[];
}

/** 函数声明（供 LLM 识别的工具描述） */
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

/** 工具执行器类型 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/** 完整的工具定义 = 声明 + 执行器 */
export interface ToolDefinition {
  declaration: FunctionDeclaration;
  handler: ToolHandler;
}
