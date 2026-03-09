/**
 * terminal 工具渲染器 - 极简控制台风格
 */

import { Box, Text } from 'ink';
import { ToolRendererProps } from './default';

const MAX_OUTPUT_LINES = 10;

interface TerminalResult {
  command?: string;
  exitCode?: number;
  killed?: boolean;
  stdout?: string;
  stderr?: string;
}

function truncateText(text: string, max: number): { display: string; truncated: boolean } {
  if (!text) return { display: '', truncated: false };
  const lines = text.split('\n');
  if (lines.length <= max) return { display: text, truncated: false };
  return { display: lines.slice(0, max).join('\n'), truncated: true };
}

export function TerminalRenderer({ result }: ToolRendererProps) {
  const r = (result || {}) as TerminalResult;
  const exitCode = r.exitCode ?? 0;
  const exitColor = exitCode === 0 ? 'green' : 'red';

  const stdout = truncateText(r.stdout || '', MAX_OUTPUT_LINES);
  const stderr = truncateText(r.stderr || '', MAX_OUTPUT_LINES);

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Text color={exitColor}>
        [EXIT CODE: {exitCode}] {r.killed ? ' (KILLED)' : ''}
      </Text>

      {stdout.display && (
        <Box flexDirection="column" marginTop={0}>
          <Text color="gray">{stdout.display}</Text>
          {stdout.truncated && <Text color="gray">  ... (OUTPUT TRUNCATED)</Text>}
        </Box>
      )}

      {stderr.display && (
        <Box flexDirection="column" marginTop={0}>
          <Text color="yellow">[STDERR]</Text>
          <Text color="yellow">{stderr.display}</Text>
          {stderr.truncated && <Text color="yellow">  ... (OUTPUT TRUNCATED)</Text>}
        </Box>
      )}
    </Box>
  );
}
