'use client';

import { Container, Title, Text, Button, Group, Card, Badge, SimpleGrid } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteScan } from '../actions';

interface Scan {
  id: string;
  url: string;
  status: string;
  created_at: string;
}

export default function DashboardClient({ scans }: { scans: Scan[] | null }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (loadingId) return;

    setLoadingId(id);
    try {
      await deleteScan(id);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete scan: ' + (error as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Your Scans</Title>
        <Button component={Link} href="/dashboard/new" leftSection={<IconPlus size={18} />}>
          New Scan
        </Button>
      </Group>

      {scans && scans.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {scans.map((scan) => (
            <Card key={scan.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} truncate>{scan.url}</Text>
                <Badge color={scan.status === 'completed' ? 'green' : scan.status === 'failed' ? 'red' : 'blue'}>
                  {scan.status}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md">
                Scanned on {new Date(scan.created_at).toLocaleDateString()}
              </Text>

              <Group gap="xs">
                <Button component={Link} href={`/dashboard/scan/${scan.id}`} variant="light" color="blue" radius="md" style={{ flex: 1 }}>
                  View Results
                </Button>
                <Button
                  variant="light"
                  color="red"
                  radius="md"
                  onClick={(e) => handleDelete(e, scan.id)}
                  loading={loadingId === scan.id}
                  disabled={loadingId !== null}
                >
                  <IconTrash size={18} />
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Card withBorder padding="xl" radius="md" style={{ textAlign: 'center' }}>
          <Text size="lg" fw={500} mb="md">No scans yet</Text>
          <Text c="dimmed" mb="xl">Start by creating your first scan to generate Gherkin features.</Text>
          <Button component={Link} href="/dashboard/new" leftSection={<IconPlus size={18} />}>
            Create Scan
          </Button>
        </Card>
      )}
    </Container>
  );
}
