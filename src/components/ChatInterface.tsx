"use client";

import { useChat } from "@ai-sdk/react";
import {
  UIToolInvocation,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import {
  Paper,
  Textarea,
  Button,
  ScrollArea,
  Stack,
  Group,
  Text,
  Loader,
  Box,
  Avatar,
  useMantineColorScheme,
} from "@mantine/core";
import { IconSend, IconRobot, IconUser } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { ToolApprovalView } from "./ToolApprovalView";

interface Feature {
  id: string;
  title: string;
  description: string;
  file_path: string;
  content: string;
}

interface ChatInterfaceProps {
  scanId: string;
  onToolExecuted?: () => void;
  existingFeatures?: Feature[];
}

export function ChatInterface({
  scanId,
  onToolExecuted,
  existingFeatures = [],
}: ChatInterfaceProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const lastActionWasDeny = useRef(false);
  const denialSent = useRef(false);

  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { scanId },
    }),
    sendAutomaticallyWhen: (message) => {
      // If last action was deny and we haven't sent the denial yet, allow send (to communicate denial to OpenAI)
      if (lastActionWasDeny.current && !denialSent.current) {
        denialSent.current = true;
        return lastAssistantMessageIsCompleteWithApprovalResponses(message);
      }
      // If last action was deny and denial was already sent, block further auto-sends
      if (lastActionWasDeny.current && denialSent.current) {
        return false;
      }
      // Normal flow - allow auto-send
      return lastAssistantMessageIsCompleteWithApprovalResponses(message);
    },
  });

  const handleToolApprovalResponse = (response: any) => {
    if (response.approved === false) {
      lastActionWasDeny.current = true;
      denialSent.current = false; // Reset to allow the denial to be sent
    } else {
      lastActionWasDeny.current = false;
      denialSent.current = false;
    }
    addToolApprovalResponse(response);
  };

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";
  const scrollViewport = useRef<HTMLDivElement>(null);

  // Watch for tool executions and trigger refresh
  useEffect(() => {
    if (status !== "ready") return; // don't remove this line
    console.log("messages", messages);
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage?.role === "assistant" &&
      !isLoading &&
      lastMessage.parts?.some(
        (p: any) =>
          p.type?.startsWith("tool-") && p.state === "output-available"
      )
    ) {
      onToolExecuted?.();
    }
    // dont add onToolExecuted to the deps
  }, [messages, isLoading, status]);

  useEffect(() => {
    if (status !== "ready") return; // don't remove this line
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({
        top: scrollViewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    lastActionWasDeny.current = false; // Reset on new user message
    denialSent.current = false; // Reset denial sent flag
    const message = input;
    setInput("");
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text: message }],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      shadow="sm"
      p="md"
      withBorder
      style={{
        position: "sticky",
        top: 92,
        height: "calc(100vh - 124px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        p="md"
        style={{
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <Text fw={500}>Chat Assistant</Text>
      </Box>

      <ScrollArea
        viewportRef={scrollViewport}
        style={{ flex: 1, "--scrollarea-scrollbar-size": 0 }}
        p="md"
      >
        <Stack gap="md">
          {messages.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" mt="xl">
              Start a conversation to modify features...
            </Text>
          )}

          {messages.map((m) => {
            // Group parts into "bubble" content and "full-width" content
            const groups: { type: "bubble" | "full-width"; parts: any[] }[] =
              [];
            let currentBubbleParts: any[] = [];

            m.parts.forEach((part) => {
              const isApproval =
                part.type?.startsWith("tool-") &&
                (part as any).state === "approval-requested";

              if (isApproval) {
                // Flush current bubble if exists
                if (currentBubbleParts.length > 0) {
                  groups.push({
                    type: "bubble",
                    parts: [...currentBubbleParts],
                  });
                  currentBubbleParts = [];
                }
                // Add approval as full-width group
                groups.push({ type: "full-width", parts: [part] });
              } else {
                // Add to current bubble
                currentBubbleParts.push(part);
              }
            });

            // Flush remaining bubble parts
            if (currentBubbleParts.length > 0) {
              groups.push({ type: "bubble", parts: [...currentBubbleParts] });
            }

            return (
              <Box key={m.id} mb="md">
                <Stack gap="xs">
                  {groups.map((group, groupIndex) => {
                    if (group.type === "full-width") {
                      return group.parts.map((part: any) => (
                        <Box key={part.toolCallId} style={{ width: "100%" }}>
                          <Group gap="sm" mb="xs">
                            <Avatar
                              radius="xl"
                              color={m.role === "user" ? "blue" : "green"}
                            >
                              {m.role === "user" ? (
                                <IconUser size={16} />
                              ) : (
                                <IconRobot size={16} />
                              )}
                            </Avatar>
                          </Group>
                          <ToolApprovalView
                            invocation={part}
                            addToolApprovalResponse={handleToolApprovalResponse}
                            existingFeatures={existingFeatures}
                          />
                        </Box>
                      ));
                    }

                    // Filter out parts that shouldn't be rendered or are empty
                    const renderableParts = group.parts.filter((part) => {
                      if (part.type === "text")
                        return part.text?.trim().length > 0;
                      if (
                        part.type?.startsWith("tool-") &&
                        ((part as any).state === "output-available" ||
                          (part as any).state === "approval-responded" ||
                          (part as any).state === "output-denied")
                      )
                        return true;
                      return false;
                    });

                    if (renderableParts.length === 0) return null;

                    return (
                      <Group
                        key={groupIndex}
                        align="flex-start"
                        gap="sm"
                        style={{
                          flexDirection:
                            m.role === "user" ? "row-reverse" : "row",
                        }}
                      >
                        <Avatar
                          radius="xl"
                          color={m.role === "user" ? "blue" : "green"}
                          style={{
                            opacity: groupIndex === 0 ? 1 : 0, // Only show avatar for first group, but keep space
                          }}
                        >
                          {m.role === "user" ? (
                            <IconUser size={16} />
                          ) : (
                            <IconRobot size={16} />
                          )}
                        </Avatar>

                        <Paper
                          p="xs"
                          bg={
                            m.role === "user"
                              ? isDark
                                ? "blue.8"
                                : "blue.1"
                              : isDark
                              ? "dark.5"
                              : "gray.1"
                          }
                          style={{
                            borderRadius: "md",
                            maxWidth: "85%",
                          }}
                        >
                          {renderableParts.map((part, index) => {
                            if (part.type === "text") {
                              return (
                                <Text
                                  key={index}
                                  size="sm"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {part.text}
                                </Text>
                              );
                            }
                            if (
                              part.type?.startsWith("tool-") &&
                              ((part as any).state === "output-available" ||
                                (part as any).state === "approval-responded" ||
                                (part as any).state === "output-denied")
                            ) {
                              const toolInvocation = part as any;
                              // Check if this was denied
                              const wasDenied =
                                (toolInvocation.state ===
                                  "approval-responded" &&
                                  toolInvocation.approval?.approved ===
                                    false) ||
                                toolInvocation.state === "output-denied";

                              console.log("Tool invocation:", toolInvocation);
                              console.log("Was denied:", wasDenied);

                              if (wasDenied) {
                                return (
                                  <Box
                                    key={toolInvocation.toolCallId}
                                    mt="xs"
                                    mb="xs"
                                    p="xs"
                                    w="100%"
                                    bg={isDark ? "dark.7" : "white"}
                                    style={{
                                      borderRadius: "sm",
                                      border:
                                        "1px solid var(--mantine-color-red-3)",
                                    }}
                                  >
                                    <Text size="xs" c="dimmed" fw={500}>
                                      🛠️{" "}
                                      {toolInvocation.type?.replace(
                                        "tool-",
                                        ""
                                      )}
                                    </Text>
                                    <Text size="xs" c="red" fw={600}>
                                      Request Denied
                                    </Text>
                                  </Box>
                                );
                              }

                              return (
                                <Box
                                  key={toolInvocation.toolCallId}
                                  mt="xs"
                                  mb="xs"
                                  p="xs"
                                  bg={isDark ? "dark.7" : "white"}
                                  style={{
                                    borderRadius: "sm",
                                    border: isDark
                                      ? "1px solid var(--mantine-color-dark-4)"
                                      : "1px solid #eee",
                                  }}
                                >
                                  <Text size="xs" c="dimmed" fw={500}>
                                    🛠️{" "}
                                    {toolInvocation.type?.replace("tool-", "")}
                                  </Text>
                                  <Text size="xs" c="green">
                                    {toolInvocation.output?.message || "Done"}
                                  </Text>
                                </Box>
                              );
                            }
                            return null;
                          })}
                        </Paper>
                      </Group>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <Group align="center" gap="xs">
              <Avatar color="green" radius="xl" size="sm">
                <IconRobot size={16} />
              </Avatar>
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
          <Button
            type="submit"
            loading={isLoading}
            disabled={!input.trim()}
            fullWidth
          >
            <IconSend size={18} />
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
