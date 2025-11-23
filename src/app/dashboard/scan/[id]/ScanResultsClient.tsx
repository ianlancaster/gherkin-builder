'use client';

import { Container, Title, Text, Badge, Group, Card, Stack, Code, Accordion, Alert, Loader } from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Feature {
  id: string;
  title: string;
  description: string;
  file_path: string;
  content: string;
}

interface Scan {
  id: string;
  url: string;
  status: string;
  features: Feature[];
}

export default function ScanResultsClient({ scan }: { scan: Scan }) {
  const router = useRouter();

  useEffect(() => {
    // Only poll if the status is pending or processing
    if (scan.status === 'pending' || scan.status === 'processing') {
      const interval = setInterval(() => {
        router.refresh();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
    // If status is completed or failed, we don't need to do anything (interval is cleared on cleanup or not started)
  }, [scan.status, router]);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={0}>
            <Title order={2}>Scan Results</Title>
            <Text c="dimmed">{scan.url}</Text>
        </Stack>
        <Badge
            size="xl"
            color={scan.status === 'completed' ? 'green' : scan.status === 'failed' ? 'red' : 'blue'}
            leftSection={
                scan.status === 'completed' ? <IconCheck size={16} /> :
                scan.status === 'failed' ? <IconX size={16} /> :
                <Loader size={16} color="white" />
            }
        >
          {scan.status}
        </Badge>
      </Group>

      {scan.status === 'failed' && (
        <Alert icon={<IconAlertCircle size={16} />} title="Scan Failed" color="red" mb="xl">
          Something went wrong while scanning the website. Please try again.
        </Alert>
      )}

      {scan.features && scan.features.length > 0 ? (
        <Stack>
            <Title order={3}>Generated Features</Title>
            <Accordion variant="separated">
                {scan.features.map((feature) => (
                    <Accordion.Item key={feature.id} value={feature.id}>
                        <Accordion.Control icon={<IconCheck size={16} color="green" />}>
                            <Text fw={500}>{feature.title}</Text>
                            <Text size="xs" c="dimmed">{feature.file_path}</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Text size="sm" mb="xs">{feature.description}</Text>
                            <Code block>{feature.content}</Code>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </Stack>
      ) : (
        <Card withBorder padding="xl" radius="md" style={{ textAlign: 'center' }}>
            {scan.status === 'completed' ? (
                <Text>No features were generated for this scan.</Text>
            ) : (
                <Stack align="center">
                    <Loader size="lg" />
                    <Text>Scanning in progress... This may take a few minutes.</Text>
                    <Text size="sm" c="dimmed">We are browsing the website and generating Gherkin scenarios.</Text>
                </Stack>
            )}
        </Card>
      )}
    </Container>
  );
}
