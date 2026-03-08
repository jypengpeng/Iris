# 工具注册层

## 职责

管理 LLM 可调用的工具。提供注册、执行、查询接口。

## 文件结构

```
src/tools/
├── registry.ts          ToolRegistry 工具注册中心
└── builtin/
    └── example.ts       内置示例工具
```

## ToolRegistry 接口

```typescript
class ToolRegistry {
  register(tool: ToolDefinition): void;        // 注册单个工具
  registerAll(tools: ToolDefinition[]): void;   // 批量注册
  unregister(name: string): boolean;            // 注销
  get(name: string): ToolDefinition | undefined;// 获取
  execute(name: string, args: Record<string, unknown>): Promise<unknown>; // 执行
  getDeclarations(): FunctionDeclaration[];     // 获取所有声明（供 LLM）
  listTools(): string[];                        // 列出工具名
  size: number;                                 // 工具数量
}
```

## ToolDefinition 格式

```typescript
interface ToolDefinition {
  declaration: FunctionDeclaration;  // 工具声明（供 LLM 识别）
  handler: ToolHandler;             // 执行器函数
}

interface FunctionDeclaration {
  name: string;
  description: string;
  parameters?: {                    // JSON Schema 格式
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;
```

## 新增工具步骤

1. 创建 `src/tools/builtin/工具名.ts`（或在其他目录）
2. 导出一个或多个 `ToolDefinition` 对象
3. 在 `src/index.ts` 中 import 并调用 `tools.register()` 或 `tools.registerAll()`

## 示例：创建一个新工具

```typescript
// src/tools/builtin/my_tool.ts
import { ToolDefinition } from '../../types';

export const myTool: ToolDefinition = {
  declaration: {
    name: 'my_tool',
    description: '这个工具做什么',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '参数说明' },
      },
      required: ['param1'],
    },
  },
  handler: async (args) => {
    const param1 = args.param1 as string;
    // 执行逻辑
    return { result: '...' };
  },
};
```

## 注意事项

- `handler` 必须是 async 函数
- `handler` 抛出的错误会被 Orchestrator 捕获，转为错误消息回传给 LLM
- 工具的返回值会被包装为 `{ result: 返回值 }` 放入 functionResponse.response
