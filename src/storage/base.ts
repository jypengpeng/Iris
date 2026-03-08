/**
 * 聊天记录存储层 —— 存储提供商基类
 *
 * 所有存储实现（JSON 文件、数据库等）均需继承此基类。
 * 存储层负责：
 *   1. 按 sessionId 管理聊天记录
 *   2. 以 Gemini Content 格式存取消息
 *   3. 存储包括用户消息、模型回复、工具调用及结果
 */

import { Content } from '../types';

export abstract class StorageProvider {
  /** 获取指定会话的全部历史消息 */
  abstract getHistory(sessionId: string): Promise<Content[]>;

  /** 向指定会话追加一条消息 */
  abstract addMessage(sessionId: string, content: Content): Promise<void>;

  /** 清空指定会话的历史 */
  abstract clearHistory(sessionId: string): Promise<void>;

  /** 列出所有会话 ID */
  abstract listSessions(): Promise<string[]>;

  /** 存储提供商名称 */
  get name(): string {
    return this.constructor.name;
  }
}
