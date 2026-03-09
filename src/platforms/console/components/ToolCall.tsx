/**
 * 工具调用卡片 - 终端控制台风格
 */

import { Box, Text } from 'ink';
import { Spinner } from './Spinner';
import { ToolInvocation, ToolStatus } from '../../../types';
import { getToolRenderer } from '../tool-renderers';

interface ToolCallProps {
  invocation: ToolInvocation;
}

interface StatusConfig {
  tag: string;
  color: string;
  useSpinner?: boolean;
}

const STATUS_MAP: Record<ToolStatus, StatusConfig> = {
  streaming:         { tag: 'STREAM',  color: 'yellow' },
  queued:            { tag: 'QUEUED',  color: 'gray'   },
  awaiting_approval: { tag: 'CONFIRM', color: 'yellow' },
  executing:         { tag: 'EXEC',    color: 'cyan',   useSpinner: true },
  awaiting_apply:    { tag: 'APPLY',   color: 'yellow' },
  success:           { tag: 'OK',      color: 'green'  },
  warning:           { tag: 'WARN',    color: 'yellow' },
  error:             { tag: 'FAIL',    color: 'red'},
};

const TERMINAL_STATUSES = new Set<ToolStatus>(['success', 'warning', 'error']);

function getArgsSummary(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'terminal': {
      const cmd = String(args.command || '');
      return cmd.length > 50 ? `$ ${cmd.slice(0, 50)}…` : `$ ${cmd}`;
    }
    case 'read_file':
      return String(args.path || '');
    case 'apply_diff':
      return String(args.path || '');
    case 'search_replace':
      return String(args.path || '');
    default:
      return '';
  }
}

export function ToolCall({ invocation }: ToolCallProps) {
  const { toolName, status, args, result, error, createdAt, updatedAt } = invocation;
  const cfg = STATUS_MAP[status];

  const argsSummary = getArgsSummary(toolName, args);
  const isTerminal = TERMINAL_STATUSES.has(status);
  const Renderer = isTerminal && result != null ? getToolRenderer(toolName) : null;
  const duration = isTerminal ? ((updatedAt - createdAt) / 1000).toFixed(1) + 's' : '';

  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      <Text>
        <Text color="gray">└─ </Text>
        <Text bold color={cfg.color}>[{cfg.tag}]</Text>
        <Text> </Text>
        <Text color="white">{toolName}</Text>
        {argsSummary && <Text color="gray"> {argsSummary}</Text>}
        {cfg.useSpinner && <Spinner />}
        {duration && <Text color="gray"> [{duration}]</Text>}
        {status === 'error' && error && <Text color="red"> ERR: {error}</Text>}
      </Text>

      {Renderer && result != null && (
        <Box marginLeft={3} paddingLeft={1}>
          <Text color="gray">│ </Text>
          <Box flexGrow={1}>
            <Renderer toolName={toolName} args={args} result={result} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
