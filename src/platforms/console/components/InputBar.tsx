/**
 * 底部输入栏 - IRIS 系统终端风格
 */

import { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface InputBarProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function InputBar({ disabled, onSubmit }: InputBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  return (
    <Box marginTop={1} flexDirection="column">
      <Box>
        <Text bold color={disabled ? 'gray' : 'cyan'}>
          IRIS@LOCAL:~ $
        </Text>
        {!disabled && (
          <Box marginLeft={1}>
            <TextInput
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              placeholder="..."
            />
          </Box>
        )}
        {disabled && <Text color="gray"> [BUSY]</Text>}
      </Box>
    </Box>
  );
}
