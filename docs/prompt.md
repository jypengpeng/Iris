# 提示词组装层

## 职责

将系统提示词、聊天历史、工具声明、生成配置组装为完整的 LLMRequest。
支持动态插入提示词片段。

## 文件结构

```
src/prompt/
├── assembler.ts          PromptAssembler 组装器
└── templates/
    └── default.ts        默认提示词模板
```

## PromptAssembler 接口

```typescript
class PromptAssembler {
  // 设置系统提示词（替换全部）
  setSystemPrompt(text: string): void;

  // 追加系统提示词片段（可用于注入时间、用户信息等动态内容）
  addSystemPart(part: Part): void;

  // 清空系统提示词
  clearSystemParts(): void;

  // 设置默认生成配置
  setGenerationConfig(config: LLMRequest['generationConfig']): void;

  // 组装完整的 LLMRequest
  assemble(
    history: Content[],
    toolDecls?: FunctionDeclaration[],
    overrides?: LLMRequest['generationConfig'],
  ): LLMRequest;
}
```

## 组装结果示例

```json
{
  "systemInstruction": {
    "parts": [{ "text": "你是一个有用的 AI 助手..." }]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "你好" }] },
    { "role": "model", "parts": [{ "text": "你好！" }] }
  ],
  "tools": [{
    "functionDeclarations": [
      { "name": "get_current_time", "description": "..." }
    ]
  }],
  "generationConfig": {
    "temperature": 0.7
  }
}
```

## 扩展指南

- 添加新模板：在 `src/prompt/templates/` 目录下创建新文件，导出字符串或函数
- 动态提示词：用 `addSystemPart()` 在运行时添加上下文信息
- 如需更复杂的提示词逻辑（如根据工具数量动态调整），可继承 PromptAssembler 覆写 assemble 方法
