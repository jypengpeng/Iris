/**
 * OpenAI Responses 格式适配器
 * 
 * 专门处理 /v1/responses 接口。
 * 支持 reasoning summary 存储为 thought parts，
 * 支持 encrypted_content 存储为 thoughtSignatures.openai 并回传。
 */

import {
  LLMRequest, LLMResponse, LLMStreamChunk, Part,
  isVisibleTextPart, isFunctionCallPart, isFunctionResponsePart, isTextPart,
} from '../../types';
import { FormatAdapter, StreamDecodeState } from './types';

export class OpenAIResponsesFormat implements FormatAdapter {
  constructor(private model: string) {}

  // ============ 编码请求：Gemini (Internal) → OpenAI Responses ============

  encodeRequest(request: LLMRequest, stream?: boolean): unknown {
    const body: Record<string, any> = {
      model: this.model,
      store: false, // 强制 stateless 以支持 encrypted_content 回传
    };

    // 1. systemInstruction -> instructions
    if (request.systemInstruction?.parts) {
      body.instructions = request.systemInstruction.parts
        .filter(isVisibleTextPart)
        .map(p => p.text)
        .join('\n');
    }

    // 2. contents -> input
    const inputItems: any[] = [];
    let toolUseIdCounter = 0;

    for (const content of request.contents) {
      if (content.role === 'model') {
        const item: Record<string, any> = {
          role: 'assistant',
          content: []
        };

        // 提取思考签名 (encrypted_content)
        // 注意：OpenAI Responses API 中，签名是独立的 item 或者是 message 之前的上下文
        const signaturePart = content.parts.find(p => (p as any).thoughtSignatures?.openai);
        if (signaturePart && (signaturePart as any).thoughtSignatures.openai) {
          inputItems.push({
            type: 'reasoning',
            encrypted_content: (signaturePart as any).thoughtSignatures.openai
          });
        }

        // 提取思考文本 (summary)
        const thoughtParts = content.parts.filter(p => (p as any).thought === true);
        if (thoughtParts.length > 0) {
          inputItems.push({
            type: 'reasoning',
            summary: thoughtParts.map(p => ({
              type: 'summary_text',
              text: (p as any).text
            }))
          });
        }

        // 提取普通文本和工具调用
        for (const part of content.parts) {
          if (isVisibleTextPart(part) && part.text) {
            item.content.push({ type: 'output_text', text: part.text });
          }
          if (isFunctionCallPart(part)) {
            // 注意：Responses API 中 function_call 是独立的 item
            inputItems.push({
              id: `call_${toolUseIdCounter++}`,
              type: 'function_call',
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args)
            });
          }
        }

        if (item.content.length > 0) {
          inputItems.push({
            type: 'message',
            role: 'assistant',
            content: item.content
          });
        }
      } else {
        // user role
        const funcRespParts = content.parts.filter(isFunctionResponsePart);
        if (funcRespParts.length > 0) {
          for (const part of funcRespParts) {
            if (!isFunctionResponsePart(part)) continue;
            inputItems.push({
              type: 'function_call_output',
              // 这里的 ID 匹配比较复杂，通常由 Backend 维护，简单起见我们按序匹配
              call_id: `call_${toolUseIdCounter - funcRespParts.length + inputItems.filter(i => i.type === 'function_call_output').length}`,
              output: JSON.stringify(part.functionResponse.response)
            });
          }
        } else {
          const text = content.parts.filter(isTextPart).map(p => p.text).join('');
          inputItems.push({
            role: 'user',
            content: [{ type: 'input_text', text }]
          });
        }
      }
    }

    body.input = inputItems;

    // 3. tools
    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.flatMap(t => t.functionDeclarations).map(decl => ({
        type: 'function',
        name: decl.name,
        description: decl.description,
        parameters: decl.parameters
      }));
    }

    // 4. generationConfig
    if (request.generationConfig) {
      const gc = request.generationConfig;
      if (gc.maxOutputTokens !== undefined) body.max_output_tokens = gc.maxOutputTokens;
      if (gc.temperature !== undefined) body.temperature = gc.temperature;
      if (gc.topP !== undefined) body.top_p = gc.topP;
      // 启用推理签名回传声明
      body.contains = ["reasoning.encrypted_content"];
    }

    if (stream) body.stream = true;

    return body;
  }

  // ============ 解码响应：OpenAI Responses → Gemini (Internal) ============

  decodeResponse(raw: unknown): LLMResponse {
    const data = raw as any;
    if (!data.output) {
      throw new Error(`OpenAI Responses API 未返回有效内容: ${JSON.stringify(data)}`);
    }

    const parts: Part[] = [];
    for (const item of data.output) {
      if (item.type === 'reasoning') {
        const part: any = { thought: true };
        // 提取摘要文本
        if (item.summary) {
          part.text = item.summary.map((s: any) => s.text).join('\n');
        }
        // 提取加密签名
        if (item.encrypted_content) {
          part.thoughtSignatures = { openai: item.encrypted_content };
        }
        parts.push(part);
      } else if (item.type === 'message') {
        for (const block of item.content) {
          if (block.type === 'output_text') {
            parts.push({ text: block.text });
          }
        }
      } else if (item.type === 'function_call') {
        parts.push({
          functionCall: { 
            name: item.name, 
            args: typeof item.arguments === 'string' ? JSON.parse(item.arguments) : item.arguments 
          }
        });
      }
    }

    if (parts.length === 0) parts.push({ text: '' });

    return {
      content: { role: 'model', parts },
      usageMetadata: data.usage ? {
        promptTokenCount: data.usage.input_tokens,
        candidatesTokenCount: data.usage.output_tokens,
        totalTokenCount: data.usage.total_tokens,
      } : undefined,
    };
  }

  // ============ 流式解码 ============

  decodeStreamChunk(raw: unknown, state: StreamDecodeState): LLMStreamChunk {
    const data = raw as any;
    const chunk: LLMStreamChunk = {};

    // OpenAI Responses SSE 包含多种事件：response.output_text.delta, response.output_item.added 等
    // 这里的 data.type 是 SSE 的事件名，但在 JSON parse 之后通常是 chunk 内容
    // 假设传输层已经将 SSE 事件分发为 JSON 块
    
    const event = data.event || data.type; // 取决于 transport 层如何透传

    if (event === 'response.output_text.delta') {
      chunk.textDelta = data.delta;
      chunk.partsDelta = [{ text: data.delta }];
    } else if (event === 'response.output_item.added') {
      const item = data.item;
      if (item.type === 'reasoning') {
        const part: any = { thought: true };
        if (item.summary) part.text = item.summary.map((s: any) => s.text).join('\n');
        if (item.encrypted_content) {
          part.thoughtSignatures = { openai: item.encrypted_content };
          chunk.thoughtSignatures = { openai: item.encrypted_content };
        }
        chunk.partsDelta = [part];
      }
    } else if (event === 'response.output_item.done') {
        // Item 完成时的最终数据
        const item = data.item;
        if (item.type === 'reasoning' && item.encrypted_content) {
            chunk.thoughtSignatures = { openai: item.encrypted_content };
        }
    } else if (event === 'response.completed') {
      if (data.usage) {
        chunk.usageMetadata = {
          promptTokenCount: data.usage.input_tokens,
          candidatesTokenCount: data.usage.output_tokens,
          totalTokenCount: data.usage.total_tokens,
        };
      }
    }

    return chunk;
  }

  createStreamState(): StreamDecodeState {
    return {};
  }
}
