/**
 * 平台交互类型定义
 *
 * 定义用户交互层的消息格式和回调类型。
 */

import { Part } from './message';

/** 平台收到的用户消息 */
export interface IncomingMessage {
  /** 会话 ID（用于区分不同对话，由平台层生成） */
  sessionId: string;
  /** 用户消息内容（Gemini Part 格式） */
  parts: Part[];
  /** 平台特有的上下文信息（如 Discord 的 channel 对象、Telegram 的 chat 对象等） */
  platformContext?: unknown;
}

/** 消息处理回调 */
export type MessageHandler = (message: IncomingMessage) => Promise<void>;
