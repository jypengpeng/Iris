/**
 * 日志模块
 *
 * 各模块通过 createLogger('模块名') 创建带前缀的 logger 实例。
 * 全局统一控制日志级别，避免散落的 console.log。
 *
 * 用法：
 *   import { createLogger } from '../logger';
 *   const logger = createLogger('MyModule');
 *   logger.info('已启动');
 *   logger.error('出错', err);
 */

export enum LogLevel {
 DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/** 全局日志级别，所有 logger 实例共享 */
let globalLevel: LogLevel = LogLevel.INFO;

export function setGlobalLogLevel(level: LogLevel): void {
  globalLevel = level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLevel;
}

export class Logger {
  constructor(private prefix: string) {}

  debug(...args: unknown[]): void {
    if (globalLevel <= LogLevel.DEBUG) {
      console.debug(`[${this.prefix}]`, ...args);
    }
  }

  info(...args: unknown[]): void {
    if (globalLevel <= LogLevel.INFO) {
      console.log(`[${this.prefix}]`, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (globalLevel <= LogLevel.WARN) {
      console.warn(`[${this.prefix}]`, ...args);
    }
  }

  error(...args: unknown[]): void {
    if (globalLevel <= LogLevel.ERROR) {
      console.error(`[${this.prefix}]`, ...args);
    }
  }
}

/** 创建一个带模块前缀的 logger */
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}
