/**
 * HTTP 请求模块
 *
 * 通用的 HTTP 发送逻辑，不含任何格式转换。
 * 支持流式和非流式请求，通过 streamUrl 字段区分 URL。
 */

export interface EndpointConfig {
  /** 非流式请求 URL */
  url: string;
  /**流式请求 URL（与非流式不同时使用，如 Gemini），默认同 url */
  streamUrl?: string;
  /** 请求头（不含 Content-Type，内部自动加） */
  headers: Record<string, string>;
}

/** 发送 HTTP 请求，返回原始 Response */
export async function sendRequest(
  endpoint: EndpointConfig,
  body: unknown,
  stream: boolean,
): Promise<Response> {
  const url = stream ? (endpoint.streamUrl ?? endpoint.url) : endpoint.url;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...endpoint.headers,
    },
    body: JSON.stringify(body),
  });
}
