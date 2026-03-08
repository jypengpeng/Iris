/**
 * 示例工具 —— 获取当前时间
 *
 * 这是一个最简单的工具示例，展示如何定义 ToolDefinition。
 * 添加新工具时，参照此文件的结构即可。
 */

import { ToolDefinition } from '../../types';

/** 获取当前时间 */
export const getCurrentTime: ToolDefinition = {
  declaration: {
    name: 'get_current_time',
    description: '获取当前的日期和时间',
  },
  handler: async () => {
    const now = new Date();
    return {
      iso: now.toISOString(),
      local: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      timestamp: now.getTime(),
    };
  },
};

/** 简单计算器 */
export const calculator: ToolDefinition = {
  declaration: {
    name: 'calculator',
    description: '计算一个数学表达式的结果',
    parameters: {
  type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: '数学表达式，例如 "2 + 3 * 4"',
        },
      },
      required: ['expression'],
    },
  },
  handler: async (args) => {
    const expr = args.expression as string;
    // 简单安全检查：只允许数字和基本运算符
    if(!/^[\d\s+\-*/().]+$/.test(expr)) {
      throw new Error(`不安全的表达式: ${expr}`);
    }
    // eslint-disable-next-line no-eval
    const result = Function(`"use strict"; return (${expr})`)();
    return { expression: expr, result };
  },
};
