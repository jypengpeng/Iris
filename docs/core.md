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
  storage: StorageProvider,     // 存储层
  tools: ToolRegistry,          // 工具注册中心
  prompt: PromptAssembler,      // 提示词组装器
  config?: { maxToolRounds?: number }
)
```

### 方法

| 方法 | 说明 |
|------|------|
| `start()` | 注册消息回调并启动平台 |
| `stop()` | 停止平台 |

### 内部流程（handleMessage）

```
1. 收到用户消息 (sessionId + Part[])
2. 存储用户消息 → storage.addMessage()
3. 进入循环（最多 maxToolRounds 轮）：
   a. storage.getHistory() 获取历史
   b. prompt.assemble() 组装请求
   c. llm.chat() 调用 LLM
   d. storage.addMessage() 存储模型回复
   e. 检查 functionCall：
      - 有：执行工具 → 存储结果 → 继续循环
      - 无：提取文本 → 发送给用户 → 结束
```

## 修改指南

- 如需增加流式输出支持，修改 `handleMessage` 中的 LLM 调用和平台发送逻辑
- 如需增加消息预处理/后处理钩子，可在循环前后插入
- 如需支持多模型切换，可将 LLMProvider 改为动态选择
