'use client';

import { Badge, Card, Container, Group, Stack, Text, Title, Code, Grid, Accordion, Alert, Loader } from '@mantine/core';
import { IconCheck, IconX, IconLoader, IconAlertCircle } from '@tabler/icons-react';
import { ChatInterface } from '@/components/ChatInterface';
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
    if (scan.status === 'pending' || scan.status === 'processing') {
      const interval = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [scan.status, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'processing': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <IconCheck size={14} />;
      case 'failed': return <IconX size={14} />;
      case 'processing': return <IconLoader size={14} />;
      default: return null;
    }
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
                <Stack gap="xs">
                    <Title order={2}>Scan Results</Title>
                  <Text c="dimmed">{scan.url}</Text>
                    <Badge size="lg" color={getStatusColor(scan.status)} leftSection={getStatusIcon(scan.status)}>
                      {scan.status}
                    </Badge>
                </Stack>

                {scan.status === 'failed' && (
                    <Alert icon={<IconAlertCircle size={16} />} title="Scan Failed" color="red">
                    Something went wrong while scanning the website. Please try again.
                    </Alert>
                )}

                <Title order={3} mb="md" mt="md">Generated Features</Title>
                {scan.features?.length > 0 && (
                  <Accordion variant="separated">
                    {scan.features.map((feature) => (
                      <Accordion.Item key={feature.id} value={feature.id}>
                        <Accordion.Control>
                          <Group justify="space-between">
                            <Text fw={600}>{feature.title}</Text>
                            <Code>{feature.file_path}</Code>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Text size="sm" c="dimmed" mb="md">{feature.description}</Text>
                          <Code block style={{ whiteSpace: 'pre-wrap' }}>
                            {feature.content}
                          </Code>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                )}
                {scan.features?.length === 0 && scan.status === 'completed' && (
                    <Text c="dimmed">No features generated.</Text>
                )}
                {scan.status === 'processing' && (
                    <Card withBorder padding="xl" radius="md" style={{ textAlign: 'center' }}>
                        <Stack align="center">
                            <Loader size="lg" />
                            <Text>Scanning in progress...</Text>
                        </Stack>
                    </Card>
                )}
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
                <ChatInterface scanId={scan.id} />
            </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
