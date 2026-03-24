/**
 * 浏览器执行环境（Sidecar 模式）
 *
 * Playwright 运行在独立的子进程（browser-sidecar.ts）中，
 * 主进程通过 stdin/stdout NDJSON 与其通信。
 *
 * 启动策略：
 *   1. 编译模式：用 process.execPath --sidecar browser 自举运行
 *   2. 开发模式：bun 直接运行 .ts，回退 node --import tsx
 */

import { spawn, type ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createLogger } from '../logger';
import type { Computer, EnvState } from './types';

const logger = createLogger('ComputerUse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BrowserEnvConfig {
  screenWidth: number;
  screenHeight: number;
  headless?: boolean;
  initialUrl?: string;
  searchEngineUrl?: string;
  highlightMouse?: boolean;
}

export class BrowserEnvironment implements Computer {
  private _config: BrowserEnvConfig;
  private _screenSize: [number, number];
  screenDescription: string;
  private _child: ChildProcess | null = null;
  private _rl: readline.Interface | null = null;
  private _nextId = 1;
  private _pending = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor(config: BrowserEnvConfig) {
    this._config = config;
    this._screenSize = [config.screenWidth, config.screenHeight];
    this.screenDescription = `浏览器 (${config.screenWidth}×${config.screenHeight})`;
  }

  screenSize(): [number, number] {
    return this._screenSize;
  }

  async initialize(): Promise<void> {
    logger.info('正在启动 browser sidecar 子进程...');

    const { cmd, args } = resolveSidecarCommand('browser', 'browser-sidecar.ts');

    this._child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      env: { ...process.env },
    });

    // 监听 stdout 上的 NDJSON 响应
    this._rl = readline.createInterface({ input: this._child.stdout! });
    this._rl.on('line', (line) => {
      let msg: any;
      try { msg = JSON.parse(line); } catch { return; }
      const pending = this._pending.get(msg.id);
      if (!pending) return;
      this._pending.delete(msg.id);
      if (msg.error) {
        pending.reject(new Error(msg.error));
      } else {
        pending.resolve(msg.result);
      }
    });

    // 收集 stderr 用于诊断，不直接输出到主进程
    let stderrBuf = '';
    this._child.stderr?.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    // 子进程异常退出时拒绝所有待处理的请求
    this._child.on('exit', (code) => {
      for (const [, { reject }] of this._pending) {
        reject(new Error(`browser sidecar 进程退出 (code=${code})${stderrBuf ? '\n' + stderrBuf : ''}`));
      }
      this._pending.clear();
    });

    // 发送 initialize 指令
    try {
      const result = await this._call('initialize', {
        screenWidth: this._config.screenWidth,
        screenHeight: this._config.screenHeight,
        headless: this._config.headless,
        initialUrl: this._config.initialUrl,
        searchEngineUrl: this._config.searchEngineUrl,
        highlightMouse: this._config.highlightMouse,
      });

      if (result.screenSize) {
        this._screenSize = result.screenSize;
      }
    } catch (err) {
      // 初始化失败时清理已 spawn 的子进程，防止 orphan
      await this.dispose();
      throw err;
    }
  }

  async dispose(): Promise<void> {
    // 1. 请求 sidecar 优雅退出（短超时，不阻塞后续 kill）
    try {
      await this._call('dispose', undefined, 3000);
    } catch { /* 超时或 sidecar 已退出 */ }

    // 2. 强制清理子进程
    const child = this._child;
    if (!child) return;
    this._child = null;
    this._rl?.close();
    this._rl = null;

    child.stdin?.end();

    // 如果已经退出，直接返回
    if (child.exitCode !== null) return;

    await new Promise<void>(resolve => {
      const timer = setTimeout(() => { forceKillTree(child); resolve(); }, 3000);
      child.on('exit', () => { clearTimeout(timer); resolve(); });
    });
  }

  // ============ Computer 接口 ============

  async currentState(): Promise<EnvState> {
    return this._callEnv('currentState');
  }

  async openWebBrowser(): Promise<EnvState> {
    return this._callEnv('openWebBrowser');
  }

  async goBack(): Promise<EnvState> {
    return this._callEnv('goBack');
  }

  async goForward(): Promise<EnvState> {
    return this._callEnv('goForward');
  }

  async search(): Promise<EnvState> {
    return this._callEnv('search', { searchEngineUrl: this._config.searchEngineUrl });
  }

  async navigate(url: string): Promise<EnvState> {
    return this._callEnv('navigate', { url });
  }

  async clickAt(x: number, y: number): Promise<EnvState> {
    return this._callEnv('clickAt', { x, y });
  }

  async hoverAt(x: number, y: number): Promise<EnvState> {
    return this._callEnv('hoverAt', { x, y });
  }

  async dragAndDrop(x: number, y: number, destX: number, destY: number): Promise<EnvState> {
    return this._callEnv('dragAndDrop', { x, y, destX, destY });
  }

  async typeTextAt(x: number, y: number, text: string, pressEnter: boolean, clearBeforeTyping: boolean): Promise<EnvState> {
    return this._callEnv('typeTextAt', { x, y, text, pressEnter, clearBeforeTyping });
  }

  async keyCombination(keys: string[]): Promise<EnvState> {
    return this._callEnv('keyCombination', { keys });
  }

  async scrollDocument(direction: 'up' | 'down' | 'left' | 'right'): Promise<EnvState> {
    return this._callEnv('scrollDocument', { direction });
  }

  async scrollAt(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right', magnitude: number): Promise<EnvState> {
    return this._callEnv('scrollAt', { x, y, direction, magnitude });
  }

  async wait5Seconds(): Promise<EnvState> {
    return this._callEnv('wait5Seconds');
  }

  // ============ 内部 IPC ============

  /** 调用 sidecar 方法并将结果转为 EnvState */
  private async _callEnv(method: string, params?: Record<string, unknown>): Promise<EnvState> {
    const result = await this._call(method, params);
    return {
      screenshot: Buffer.from(result.screenshot as string, 'base64'),
      url: result.url as string,
    };
  }

  /** 发送 IPC 请求并等待响应（带超时保护） */
  private _call(method: string, params?: Record<string, unknown>, timeoutMs = 30000): Promise<any> {
    if (!this._child?.stdin) {
      return Promise.reject(new Error('browser sidecar 未启动'));
    }
    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`browser sidecar RPC '${method}' 超时 (${timeoutMs}ms)`));
      }, timeoutMs);
      this._pending.set(id, {
        resolve: (val: any) => { clearTimeout(timer); resolve(val); },
        reject: (err: Error) => { clearTimeout(timer); reject(err); },
      });
      this._child!.stdin!.write(JSON.stringify({ id, method, params: params ?? {} }) + '\n');
    });
  }
}

// ============ Sidecar 启动策略 ============

/**
 * 根据运行环境确定 sidecar 启动命令。
 *
 * 编译模式（.ts 源文件不存在）：用当前二进制自身 + --sidecar 参数
 * 开发模式：优先 bun，回退 node --import tsx
 */
function resolveSidecarCommand(type: string, sidecarFile: string): { cmd: string; args: string[] } {
  const sidecarTs = path.resolve(__dirname, sidecarFile);

  if (!fs.existsSync(sidecarTs)) {
    // 编译模式：源文件不存在，用自身二进制启动 sidecar
    return { cmd: process.execPath, args: ['--sidecar', type] };
  }

  // 开发模式：优先用 bun（原生支持 TS）
  if ((globalThis as any).Bun) {
    return { cmd: 'bun', args: [sidecarTs] };
  }

  // 回退 node + tsx
  return { cmd: 'node', args: ['--import', 'tsx', sidecarTs] };
}

/** 强制杀死子进程树（Windows 下 taskkill /T 杀整棵进程树，避免孤儿 Chromium） */
function forceKillTree(child: ChildProcess): void {
  try {
    if (process.platform === 'win32' && child.pid) {
      const tk = spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' });
      tk.on('error', () => {}); // 忽略 taskkill 自身的错误
    } else {
      child.kill('SIGKILL');
    }
  } catch { /* 进程可能已退出 */ }
}
