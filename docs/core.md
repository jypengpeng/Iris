# 核心协调器模块

## 职责

串联所有模块，编排完整的消息处理流程。本身不包含业务逻辑。

## 文件结构

```
src/core/
└── orchestrator.ts   Orchestrator 类
```

## Orchestrator 接口

### 构造参数

```typescript
new Orchestrator(
  platform: PlatformAdapter,    // 用户交互层
  llm: LLMProvider,             // LLM 调用层
  storage: StorageProvider,      // 存储层
  tools: ToolRegistry,          // 工具注册中心
  prompt: PromptAssembler,      // 提示词组装器
  config?: OrchestratorConfig,  // { maxToolRounds?: number, stream?: boolean }
  memory?: MemoryProvider,      // 记忆层（可选）
)
```

### 方法

| 方法 | 说明 |
|------|------|
| `start()` | 注册 `onMessage` + `onClear` 回调并启动平台 |
| `stop()` | 停止平台 |

### 内部流程（handleMessage）

```
1. 收到用户消息 (sessionId + Part[])
2. 存储用户消息 → storage.addMessage()
3. 查询相关记忆 → memory.buildContext(userText) → extraParts（可选）
4. 进入循环（最多 maxToolRounds 轮）：
   a. storage.getHistory() 获取历史
   b. prompt.assemble(history, toolDecls, undefined, extraParts) 组装请求
   c. 调用 LLM：
      - 流式：callLLMStream() → 边接收边输出文本 + 累积完整 Content
      - 非流式：llm.chat() → 获取完整响应
   d. storage.addMessage() 存储模型回复
   e. 检查 functionCall：
      - 有：执行工具 → 存储结果（role:'user'）→ 继续循环
      - 无：发送文本给用户 → 结束
```

### 流式调用（callLLMStream）

```
llm.chatStream(request) → AsyncGenerator<LLMStreamChunk>
  │
  ├─→ 提取 textDelta → 包装为 AsyncIterable<string> → platform.sendMessageStream()
  ├─→ 收集 functionCalls
  ├─→ 收集 usageMetadata
  ├─→ 收集 thoughtSignature（Gemini 思考签名）
  │
  ▼
累积为完整 Content { role:'model', parts }
  - thoughtSignature 附加到 text part 和 function call parts 上
```

### onClear 回调

平台触发清空会话时（如用户发送 `/clear`），Orchestrator 调用 `storage.clearHistory(sessionId)` 清空历史。

## 修改指南

- 如需增加消息预处理/后处理钩子，可在循环前后插入
- 如需支持多模型切换，可将 LLMProvider 改为动态选择
