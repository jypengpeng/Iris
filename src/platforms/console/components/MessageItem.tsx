/**
 * 单条消息渲染 - 极简分界线风格
 */

import { Box, Text } from 'ink';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageItemProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function MessageItem({ role, content, isStreaming }: MessageItemProps) {
  const isUser = role === 'user';
  const labelColor = isUser ? 'cyan' : 'green';
  const labelText = isUser ? ' USER ' : ' IRIS ';

  return (
    <Box marginBottom={1} flexDirection="column">
      <Box marginBottom={0}>
        <Text bold color="black" backgroundColor={labelColor}>
          {labelText}
        </Text>
      </Box>
      <Box paddingLeft={1}>
        <Text color={labelColor}>│ </Text>
        <Box flexGrow={1}>
          <Text wrap="wrap" color={isUser ? 'white' : 'green'}>
            {content}
            {isStreaming && <Text backgroundColor="gray"> </Text>}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
