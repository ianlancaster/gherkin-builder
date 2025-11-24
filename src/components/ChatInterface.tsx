'use client';

import { useChat } from '@ai-sdk/react';
import { UIToolInvocation, DefaultChatTransport } from 'ai';
import { Paper, Textarea, Button, ScrollArea, Stack, Group, Text, Loader, Box, Avatar } from '@mantine/core';
import { IconSend, IconRobot, IconUser } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInterfaceProps {
  scanId: string;
}

export function ChatInterface({ scanId }: ChatInterfaceProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { scanId },
    }),
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';
  const scrollViewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({ top: scrollViewport.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input;
    setInput('');
    await sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: message }]
    });
  };

  return (
    <Paper shadow="sm" p="md" withBorder style={{ position: 'sticky', top: 92, height: 'calc(100vh - 124px)', display: 'flex', flexDirection: 'column' }}>
      <Text fw={500} >Chat Assistant</Text>

      <ScrollArea viewportRef={scrollViewport} style={{ flex: 1 }} mb="md">
        <Stack gap="md">
          {messages.length === 0 && (
            <Text c="dimmed" size="sm">
              Ask me to add, update, or delete Gherkin scenarios for this scan.
            </Text>
          )}

          {messages.map((m) => (
            <Box key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <Group align="flex-start" gap="xs" style={{ flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <Avatar
                    color={m.role === 'user' ? 'blue' : 'green'}
                    radius="xl"
                    size="sm"
                >
                    {m.role === 'user' ? <IconUser size={16} /> : <IconRobot size={16} />}
                </Avatar>

                <Paper
                    p="xs"
                    bg={m.role === 'user' ? 'blue.1' : 'gray.1'}
                    style={{ borderRadius: 'lg' }}
                >
                  {m.parts.map((part, index) => {
                    if (part.type === 'text') {
                      return <Text key={index} size="sm" style={{ whiteSpace: 'pre-wrap' }}>{part.text}</Text>;
                    }
                    if (part.type === 'tool-invocation') {
                      const toolInvocation = part as any; // Cast to access properties safely
                      const toolCallId = toolInvocation.toolCallId;
                      const addResult = 'result' in toolInvocation;

                      return (
                        <Box key={toolCallId} mt="xs" p="xs" bg="white" style={{ borderRadius: 'sm', border: '1px solid #eee' }}>
                            <Text size="xs" c="dimmed" fw={500}>
                                🛠️ {toolInvocation.toolName}
                            </Text>
                            {addResult && (
                                <Text size="xs" c="green">
                                    {toolInvocation.result?.message || 'Done'}
                                </Text>
                            )}
                        </Box>
                      );
                    }
                    return null;
                  })}
                </Paper>
              </Group>
            </Box>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <Group align="center" gap="xs">
                <Avatar color="green" radius="xl" size="sm"><IconRobot size={16} /></Avatar>
                <Loader size="xs" type="dots" />
             </Group>
          )}
        </Stack>
      </ScrollArea>

      <form onSubmit={handleSubmit}>
        <Stack gap="xs">
          <Textarea
            placeholder="Add a scenario for..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={isLoading}
            minRows={2}
            maxRows={6}
            autosize
          />
          <Button type="submit" loading={isLoading} disabled={!input.trim()} fullWidth>
            <IconSend size={18} />
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
