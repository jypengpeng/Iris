# 聊天记录存储层

## 职责

按会话（sessionId）存取聊天记录。数据格式为 Gemini Content[] 数组。
存储内容包括用户消息、模型回复、工具调用记录、工具执行结果。

## 文件结构

```
src/storage/
├── base.ts              StorageProvider 抽象基类
└── json-file/index.ts   JSON 文件存储实现
```

## 基类接口：StorageProvider

```typescript
abstract class StorageProvider {
  // 获取全部历史
  abstract getHistory(sessionId: string): Promise<Content[]>;

  // 追加一条消息
  abstract addMessage(sessionId: string, content: Content): Promise<void>;

  // 清空历史
  abstract clearHistory(sessionId: string): Promise<void>;

  // 列出所有会话
  abstract listSessions(): Promise<string[]>;
}
```

## 存储的数据结构

每个 session 存储为一个 `Content[]` 数组，例如：

```json
[
  { "role": "user",  "parts": [{ "text": "你好" }] },
  { "role": "model", "parts": [{ "text": "你好！有什么可以帮你的？" }] },
  { "role": "user",  "parts": [{ "text": "2+3等于多少？" }] },
  { "role": "model", "parts": [{ "functionCall": { "name": "calculator", "args": { "expression": "2+3" } } }] },
  { "role": "user",  "parts": [{ "functionResponse": { "name": "calculator", "response": { "result": { "expression": "2+3", "result": 5 } } } }] },
  { "role": "model", "parts": [{ "text": "2+3 等于 5。" }] }
]
```

## 新增存储实现步骤

1. 创建 `src/storage/实现名/index.ts`
2. 继承 `StorageProvider`
3. 实现四个抽象方法
4. 在 `src/index.ts` 中添加对应的 import 和初始化

## 可考虑的其他实现

- `memory/` — 内存存储，重启后清空，适合测试
- `sqlite/` — SQLite 数据库存储
- `redis/` — Redis 存储，适合分布式部署
