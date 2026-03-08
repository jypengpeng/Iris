# LLM API 调用层

## 职责

调用各 LLM 提供商的 API。自己发 HTTP 请求，不使用官方 SDK。
内部统一使用 Gemini 格式，通过格式适配器做双向转换。

## 模块结构

```
src/llm/
├── formats/                # 格式转换模块
│   ├── types.ts  # FormatAdapter 接口定义
│   ├── gemini.ts           # Gemini 格式（请求直通，响应提取）
│   └── openai.ts           # OpenAI 格式（完整双向转换）
├── transport.ts            # HTTP 请求模块（通用 fetch 发送）
├── response.ts       # 响应后处理（流式 / 非流式统一处理）
├── provider.ts             # LLMProvider 组合器（组装 format + transport + response）
└── presets/                # 预设配置（每个渠道的连接参数 + 工厂函数）
    ├── gemini.ts           # createGeminiProvider()
    └── openai-compatible.ts# createOpenAICompatibleProvider()
```

## 核心接口

### FormatAdapter（格式转换）

每个渠道格式实现此接口，负责 Gemini ↔ 渠道 API 格式的双向转换：

```typescript
interface FormatAdapter {
  encodeRequest(request: LLMRequest, stream?: boolean): unknown;
  decodeResponse(raw: unknown): LLMResponse;
  decodeStreamChunk(raw: unknown, state: StreamDecodeState): LLMStreamChunk;
  createStreamState(): StreamDecodeState;
}
```

### EndpointConfig（HTTP 传输）

```typescript
interface EndpointConfig {
  url: string;           // 非流式 URL
  streamUrl?: string;    // 流式 URL（默认同 url）
  headers:Record<string, string>;
}
```

### LLMProvider（组合器）

```typescript
class LLMProvider {
  constructor(format: FormatAdapter, endpoint: EndpointConfig, name?: string);
  chat(request: LLMRequest): Promise<LLMResponse>;
  chatStream(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
}
```

## 数据流向

```
LLMRequest (Gemini 格式)
  │
  ▼
[FormatAdapter.encodeRequest]  → 渠道请求体
  │
  ▼
[transport.sendRequest]        → HTTP 发送，获取 Response
  │
  ├─ 非流式 → [response.processResponse]       → FormatAdapter.decodeResponse       → LLMResponse
  └─ 流式   → [response.processStreamResponse]  → SSE 解析 + FormatAdapter.decodeStreamChunk → LLMStreamChunk…
```

## 新增渠道步骤

1. 在 `formats/` 下新建文件，实现 `FormatAdapter` 接口
2. 在 `presets/` 下新建文件，写工厂函数（配置 URL + headers + 选哪个 format）
3. 在 `src/config/` 和 `src/index.ts` 中加一个 case

不需要碰 transport.ts 和 response.ts。

## 格式转换对照表（OpenAI 为例）

| Gemini 格式 | OpenAI 格式 |
|---|---|
| `systemInstruction.parts[].text` | `messages[0] = {role:"system", content:"..."}` |
| `Content{role:"user", parts:[{text}]}` | `{role:"user", content:"..."}` |
| `Content{role:"model", parts:[{text}]}` | `{role:"assistant", content:"..."}` |
| `Content{role:"model", parts:[{functionCall}]}` | `{role:"assistant", tool_calls:[...]}` |
| `Content{role:"user", parts:[{functionResponse}]}` | `{role:"tool", tool_call_id:"...", content:"..."}` |
| `tools[].functionDeclarations[]` | `tools[].{type:"function", function:{...}}` |

## 注意事项

- OpenAI 的 tool_call 有 ID，Gemini 没有。转换时需生成/匹配 ID。
- Gemini 格式请求直通，无需转换。
- Gemini 流式使用不同 URL (`streamGenerateContent?alt=sse`)，OpenAI 用同一 URL 加 `stream:true` 参数。
- OpenAI 流式中工具调用参数分片到达，OpenAIFormat 内部通过 StreamDecodeState 累积。
