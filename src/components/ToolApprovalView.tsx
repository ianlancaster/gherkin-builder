"use client";

import { useState, useMemo } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  Box,
  ScrollArea,
  useMantineColorScheme,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  file_path: string;
  content: string;
}

interface ToolApprovalViewProps {
  invocation: any;
  addToolApprovalResponse: (response: {
    id: string;
    approved: boolean;
  }) => void;
  existingFeatures: Feature[];
}

export function ToolApprovalView({
  invocation,
  addToolApprovalResponse,
  existingFeatures,
}: ToolApprovalViewProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(false);

  const handleApprove = () => {
    setLoading(true);
    addToolApprovalResponse({
      id: invocation.approval.id,
      approved: true,
    });
  };

  const handleDeny = () => {
    setLoading(true);
    addToolApprovalResponse({
      id: invocation.approval.id,
      approved: false,
    });
  };

  // Determine tool type from invocation
  const toolType = invocation.type?.replace("tool-", "");

  // Get diff content based on tool type
  const { oldValue, newValue, title } = useMemo(() => {
    const input = invocation.input;

    if (toolType === "addFeature") {
      return {
        title: `Add Feature: ${input.title}`,
        oldValue: "",
        newValue: input.content,
      };
    }

    if (toolType === "updateFeature") {
      // Find existing feature
      const existingFeature = existingFeatures?.find(
        (f) => f.title === input.old_title
      );
      return {
        title: `Update Feature: ${input.old_title}`,
        oldValue: existingFeature?.content || "",
        newValue: input.new_content || "",
      };
    }

    if (toolType === "deleteFeature") {
      // Find existing feature
      const existingFeature = existingFeatures?.find(
        (f) => f.title === input.title
      );
      return {
        title: `Delete Feature: ${input.title}`,
        oldValue: existingFeature?.content || "",
        newValue: "",
      };
    }

    return { title: "Unknown Tool", oldValue: "", newValue: "" };
  }, [toolType, invocation.input, existingFeatures]);

  return (
    <Paper
      withBorder
      p="md"
      mt="xs"
      bg={isDark ? "dark.6" : "gray.0"}
      style={{ borderColor: isDark ? "#4a5568" : "#e2e8f0" }}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Text size="sm" fw={600}>
              Approval Required
            </Text>
            <Badge
              color={
                toolType === "addFeature"
                  ? "green"
                  : toolType === "deleteFeature"
                  ? "red"
                  : "blue"
              }
              size="sm"
            >
              {toolType}
            </Badge>
          </Group>
        </Group>

        <Box>
          <Text size="sm" fw={500} mb="xs">
            {title}
          </Text>
          <Box
            style={{
              border: isDark ? "1px solid #4a5568" : "1px solid #e2e8f0",
              borderRadius: "4px",
              overflowX: "auto", // Enable horizontal scrolling
            }}
          >
            <ScrollArea w={800}>
              <ReactDiffViewer
                oldValue={oldValue}
                newValue={newValue}
                splitView={false}
                useDarkTheme={isDark}
                hideLineNumbers={false}
                showDiffOnly={false}
                styles={{
                  variables: {
                    dark: {
                      diffViewerBackground: isDark ? "#2d3748" : "#ffffff",
                      addedBackground: "rgba(34, 197, 94, 0.15)",
                      removedBackground: "rgba(239, 68, 68, 0.15)",
                    },
                    light: {
                      diffViewerBackground: "#ffffff",
                      addedBackground: "rgba(34, 197, 94, 0.1)",
                      removedBackground: "rgba(239, 68, 68, 0.1)",
                    },
                  },
                  line: {
                    fontSize: "12px",
                    padding: "1px 4px",
                  },
                  contentText: {
                    fontSize: "12px",
                    lineHeight: "1.4",
                    wordBreak: "keep-all", // Prevent wrapping
                    whiteSpace: "pre", // Force single line
                  },
                  gutter: {
                    minWidth: "20px",
                    fontSize: "11px",
                    padding: "0 4px",
                  },
                }}
              />
            </ScrollArea>
          </Box>
        </Box>

        <Group gap="xs">
          <Button
            leftSection={<IconCheck size={14} />}
            color="green"
            size="xs" // Smaller buttons
            onClick={handleApprove}
            loading={loading}
            disabled={loading}
          >
            Approve
          </Button>
          <Button
            leftSection={<IconX size={14} />}
            color="red"
            size="xs" // Smaller buttons
            variant="outline"
            onClick={handleDeny}
            loading={loading}
            disabled={loading}
          >
            Deny
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
