/**
 * Undo/Redo 状态管理
 *
 * 只负责 redo 栈管理和 undo 范围解析，
 * 不直接操作 Storage —— 持久化由 Backend 负责编排。
 */

import type { Content } from '../../types';
import { extractText, isFunctionResponsePart } from '../../types';
import type { UndoScope } from './types';
import { MAX_REDO_HISTORY_GROUPS } from './types';

export class UndoRedoManager {
  private redoHistory = new Map<string, Content[][]>();

  /** 清空指定会话的 redo 栈 */
  clearRedo(sessionId: string): void {
    this.redoHistory.delete(sessionId);
  }

  /** 将一组被撤销的历史压入 redo 栈，并限制最大长度 */
  pushRedoGroup(sessionId: string, removed: Content[]): void {
    const stack = this.redoHistory.get(sessionId) ?? [];
    stack.push(removed.map(content => JSON.parse(JSON.stringify(content)) as Content));
    if (stack.length > MAX_REDO_HISTORY_GROUPS) {
      stack.splice(0, stack.length - MAX_REDO_HISTORY_GROUPS);
    }
    this.redoHistory.set(sessionId, stack);
  }

  /** 从 redo 栈弹出最近一组（供恢复） */
  popRedoGroup(sessionId: string): Content[] | null {
    const stack = this.redoHistory.get(sessionId);
    if (!stack || stack.length === 0) return null;
    return stack.pop()!;
  }

  /**
   * 根据历史和 scope 计算本次 undo 应从哪条消息开始截断。
   * 返回 null 表示无法 undo。
   */
  resolveUndoRange(history: Content[], scope: UndoScope): { removeStart: number } | null {
    if (history.length === 0) return null;

    const removeStart = this.resolveUndoStartIndex(history, scope);
    if (removeStart < 0 || removeStart >= history.length) return null;

    const removed = history.slice(removeStart);
    if (removed.length === 0) return null;

    return { removeStart };
  }

  /** 从一组历史中提取用户文本和 assistant 可见文本摘要 */
  summarizeGroup(group: Content[]): { userText: string; assistantText: string } {
    const userContent = group.find(content => content.role === 'user' && !this.isToolResponseContent(content));
    const userText = userContent ? extractText(userContent.parts) : '';

    for (let i = group.length - 1; i >= 0; i--) {
      if (group[i].role === 'model') {
        return { userText, assistantText: extractText(group[i].parts) };
      }
    }

    return { userText, assistantText: '' };
  }

  // ============ 内部辅助 ============

  /** 判断一条 user 消息是否纯粹是工具响应 */
  private isToolResponseContent(content: Content): boolean {
    return content.role === 'user'
      && content.parts.length > 0
      && content.parts.every(part => isFunctionResponsePart(part));
  }

  /** 获取历史末尾 assistant 回复段的起始位置；若末尾不是 assistant 回复则返回 null */
  private getAssistantResponseStartIndex(history: Content[]): number | null {
    let startIndex: number | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.role === 'model' || this.isToolResponseContent(entry)) {
        startIndex = i;
        continue;
      }
      break;
    }
    return startIndex;
  }

  /** 解析本次 undo 应该从哪一条消息开始截断 */
  private resolveUndoStartIndex(history: Content[], scope: UndoScope): number {
    const assistantStart = this.getAssistantResponseStartIndex(history);

    if (scope === 'last-visible-message') {
      return assistantStart ?? (history.length - 1);
    }

    // last-turn
    if (assistantStart != null) {
      const prevIndex = assistantStart - 1;
      if (prevIndex >= 0) {
        const previous = history[prevIndex];
        if (previous.role === 'user' && !this.isToolResponseContent(previous)) {
          return prevIndex;
        }
      }
      return assistantStart;
    }

    return history.length - 1;
  }
}
