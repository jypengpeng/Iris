# 用户交互层

## 职责

接收用户消息，转换为内部格式；将 AI 回复发送给用户。
每个平台一个文件夹。

## 文件结构

```
src/platforms/
├── base.ts            PlatformAdapter 抽象基类
├── console/index.ts   控制台平台（开发调试用）
├── discord/index.ts   Discord Bot（骨架）
└── telegram/index.ts  Telegram Bot
```

## 基类接口：PlatformAdapter

```typescript
abstract class PlatformAdapter {
  // 由 Orchestrator 调用，注册消息处理回调
  onMessage(handler: MessageHandler): void;

  // 启动平台（连接服务、开始监听）
  abstract start(): Promise<void>;

  // 停止平台
  abstract stop(): Promise<void>;

  // 发送文本消息给用户
  abstract sendMessage(sessionId: string, text: string): Promise<void>;
}
```

## MessageHandler 回调格式

```typescript
type MessageHandler = (message: IncomingMessage) => Promise<void>;

interface IncomingMessage {
  sessionId: string;       // 会话标识，由平台生成
  parts: Part[];           // 用户消息内容（Gemini Part 格式）
  platformContext?: any;   // 平台特有上下文
}
```

## 新增平台步骤

1. 创建 `src/platforms/新平台名/index.ts`
2. 继承 `PlatformAdapter`
3. 实现 `start()`、`stop()`、`sendMessage()`
4. 在 `start()` 中监听用户消息，收到时调用 `this.messageHandler()`
5. `sessionId` 的生成规则：建议为 `"平台名-唯一标识"`，如 `"discord-123456"`、`"telegram-789"`
6. 在 `src/index.ts` 中添加对应的 import 和 switch case

## 注意事项

- `sendMessage` 的 sessionId 与 `messageHandler` 回调中的 sessionId 对应
- 平台层不应包含任何 AI/LLM 逻辑
- 平台层可自由处理平台特有的逻辑（如消息长度截断、富文本格式转换等）
