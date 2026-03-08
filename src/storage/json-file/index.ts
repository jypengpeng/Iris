/**
 * JSON 文件存储提供商
 *
 * 每个 session 对应一个 JSON 文件，内容为 Content[] 数组。
 * 数据存储为原始 Gemini 格式，可直接人工阅读、编辑、调试。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageProvider } from '../base';
import { Content } from '../../types';

export class JsonFileStorage extends StorageProvider {
  private dir: string;

  constructor(dir: string = './data/sessions') {
    super();
    this.dir = dir;
  }

  async getHistory(sessionId: string): Promise<Content[]> {
    try {
      const data = await fs.readFile(this.filePath(sessionId), 'utf-8');
      return JSON.parse(data) as Content[];
    } catch {
      return [];
    }
  }

  async addMessage(sessionId: string, content: Content): Promise<void> {
    const history = await this.getHistory(sessionId);
    history.push(this.normalize(content));
    await this.ensureDir();
    await fs.writeFile(this.filePath(sessionId), JSON.stringify(history, null, 2), 'utf-8');
  }

  /** 统一 Content 的字段顺序：role → parts → usageMetadata → 其余 */
  private normalize(content: Content): Content {
    const known = new Set(['role', 'parts', 'usageMetadata']);
    const normalized: Content = {
      role: content.role,
      parts: content.parts,
    };
    if (content.usageMetadata) {
      normalized.usageMetadata = content.usageMetadata;
    }
    // 保留 Gemini API 可能附加的其他未知字段
    for (const [k, v] of Object.entries(content)) {
      if (!known.has(k)) {
        (normalized as unknown as Record<string, unknown>)[k] = v;
      }
    }
    return normalized;
  }

  async clearHistory(sessionId: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(sessionId));
    } catch {
      // 文件不存在则忽略
    }
  }

  async listSessions(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace(/\.json$/, ''));
    } catch {
      return [];
    }
  }

  // ============ 内部方法 ============

  private filePath(sessionId: string): string {
    // 对 sessionId 做简单安全处理，防止路径穿越
    const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.dir, `${safe}.json`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }
}
