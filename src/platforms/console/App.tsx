/**
 * TUI 根组件 - 极简极客风格
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import Divider from 'ink-divider';
import { ToolInvocation } from '../../types';
import { MessageItem, ChatMessage } from './components/MessageItem';
import { InputBar } from './components/InputBar';
import { ToolCall } from './components/ToolCall';
import { StatusLine } from './components/StatusLine';

export interface AppHandle {
  addMessage(role: 'user' | 'assistant', content: string): void;
  startStream(): void;
  pushStreamChunk(chunk: string): void;
  endStream(): void;
  setToolInvocations(invocations: ToolInvocation[]): void;
  setGenerating(generating: boolean): void;
  clearMessages(): void;
}

interface AppProps {
  onReady: (handle: AppHandle) => void;
  onSubmit: (text: string) => void;
  onExit: () => void;
}

export function App({ onReady, onSubmit, onExit }: AppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const streamRef = useRef('');

  useEffect(() => {
    const handle: AppHandle = {
      addMessage(role, content) {
        setMessages(prev => [...prev, { role, content }]);
      },
      startStream() {
        setIsStreaming(true);
        streamRef.current = '';
        setStreamingText('');
      },
      pushStreamChunk(chunk) {
        streamRef.current += chunk;
        setStreamingText(streamRef.current);
      },
      endStream() {
        setIsStreaming(false);
        const text = streamRef.current;
        if (text) {
          setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        }
        streamRef.current = '';
        setStreamingText('');
      },
      setToolInvocations(invocations) {
        setToolInvocations([...invocations]);
      },
      setGenerating(generating) {
        setIsGenerating(generating);
      },
      clearMessages() {
        setMessages([]);
        setToolInvocations([]);
        setStreamingText('');
        streamRef.current = '';
      },
    };
    onReady(handle);
  }, []);

  const handleSubmit = useCallback((text: string) => {
    if (text === '/quit' || text === '/exit') {
      onExit();
      return;
    }
    if (text === '/clear') {
      setMessages([]);
      setToolInvocations([]);
      return;
    }
    onSubmit(text);
  }, [onSubmit, onExit]);

  const activeToolCount = toolInvocations.filter(
    i => !(['success', 'warning', 'error'] as string[]).includes(i.status),
  ).length;

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Gradient name="atlas">
          <Text bold>IRIS TERMINAL CONTROL CENTER v1.0</Text>
        </Gradient>
      </Box>

      {/* History */}
      <Box flexDirection="column">
        {messages.map((msg, i) => (
          <MessageItem key={i} role={msg.role} content={msg.content} />
        ))}
      </Box>

      {/* Current Stream */}
      {isStreaming && (
        <MessageItem role="assistant" content={streamingText} isStreaming />
      )}

      {/* Tools */}
      {toolInvocations.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Divider title="SYSTEM LOG" dividerColor="gray" />
          <Box flexDirection="column" marginTop={1}>
            {toolInvocations.map(inv => (
              <ToolCall key={inv.id} invocation={inv} />
            ))}
          </Box>
        </Box>
      )}

      {/* Status */}
      <Box marginTop={1}>
        <StatusLine
          isGenerating={isGenerating}
          isStreaming={isStreaming}
          activeTools={activeToolCount}
          totalTools={toolInvocations.length}
        />
      </Box>

      {/* Input Section - Using a horizontal line to separate */}
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">────────────────────────────────────────────────────────────────</Text>
<InputBar
          disabled={isGenerating}
          onSubmit={handleSubmit}
        />
      </Box>

      {/* Key Hints */}
      {!isGenerating && (
        <Box marginTop={0}>
          <Text color="gray">Commands: /quit, /clear | Status: Ready</Text>
        </Box>
      )}
    </Box>
  );
}
