/**
 * LLM Provider 组合器
 *
 * 将格式转换、HTTP 传输、响应处理组装为统一的 Provider 接口。
 * 上层（Orchestrator）只依赖此接口的 chat() 和 chatStream()。
 */

import { LLMRequest, LLMResponse, LLMStreamChunk } from '../../types';
import { FormatAdapter } from '../formats/types';
import { EndpointConfig, sendRequest } from '../transport';
import { processResponse, processStreamResponse } from '../response';

export class LLMProvider {
  private providerName: string;

 constructor(
    private format: FormatAdapter,
    private endpoint: EndpointConfig,
    providerName?: string,
  ) {
    this.providerName = providerName ?? 'LLMProvider';
  }

  /** 非流式调用 */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const body = this.format.encodeRequest(request, false);
    const res = await sendRequest(this.endpoint, body, false);
    return processResponse(res, this.format);
  }

  /** 流式调用 */
  async *chatStream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    const body = this.format.encodeRequest(request, true);
    const res = await sendRequest(this.endpoint, body, true);
    yield* processStreamResponse(res, this.format);
  }

  get name(): string {
    return this.providerName;
  }
}
