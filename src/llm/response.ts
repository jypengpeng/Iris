/**
 * 响应后处理模块
 *
 * 统一处理流式和非流式响应。
 * 内部使用 FormatAdapter 做格式解码，内置 SSE 解析处理流式数据。
 */

import { LLMResponse, LLMStreamChunk } from '../types';
import { FormatAdapter } from './formats/types';

// ============ 非流式 ============

/** 处理非流式响应 */
export async function processResponse(
  res: Response,
  format: FormatAdapter,
): Promise<LLMResponse> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API 错误 (${res.status}): ${text}`);
  }
  const data = await res.json();
  return format.decodeResponse(data);
}

// ============ 流式 ============

/** 处理流式响应（SSE 解析 + 逐块解码） */
export async function* processStreamResponse(
  res: Response,
  format: FormatAdapter,
): AsyncGenerator<LLMStreamChunk> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API 流式错误 (${res.status}): ${text}`);
  }
 const state = format.createStreamState();
  for await (const data of parseSSE(res)) {
    yield format.decodeStreamChunk(JSON.parse(data), state);
  }
}

// ============ SSE 解析 ============

/**
 * 从 fetch Response 中解析 SSE 流，逐条 yield data 字段的原始字符串。
 * 遇到 `data: [DONE]` 时自动结束。
 */
async function* parseSSE(response: Response): AsyncGenerator<string> {
  const body = response.body;
  if (!body) throw new Error('Response body is null');

  const reader = (body as any).getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          if (data) yield data;
        }
      }
    }

    // 处理剩余 buffer
    const trimmed = buffer.trim();
    if (trimmed.startsWith('data: ')) {
      const data = trimmed.slice(6);
      if (data && data !== '[DONE]') yield data;
    }
  } finally {
    reader.releaseLock();
  }
}
