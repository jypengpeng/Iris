/**
 * read_file 工具渲染器 - 极简代码风格
 */

import { Box, Text } from 'ink';
import { ToolRendererProps } from './default';

const MAX_LINES = 15;

interface ReadFileResult {
  path?: string;
  totalLines?: number;
  startLine?: number;
  endLine?: number;
  content?: string;
}

export function ReadFileRenderer({ result }: ToolRendererProps) {
  const r = (result || {}) as ReadFileResult;

  const lines = (r.content || '').split('\n');
  const truncated = lines.length > MAX_LINES;
  const display = truncated ? lines.slice(0, MAX_LINES).join('\n') : (r.content || '');

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Text color="gray" italic>
        # {r.path} ({r.totalLines} lines total, showing {r.startLine}-{r.endLine})
      </Text>
      <Box marginTop={0}>
        <Text color="gray">{display}</Text>
      </Box>
      {truncated && (
        <Text color="gray">  ... ({lines.length - MAX_LINES} lines omitted)</Text>
      )}
    </Box>
  );
}
