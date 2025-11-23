'use client';

import { Container, Title, TextInput, Button, Paper, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconWorld } from '@tabler/icons-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function NewScan() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      url: '',
    },

    validate: {
      url: (value) => (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value) ? null : 'Invalid URL'),
    },
  });

  const handleSubmit = async (values: { url: string }) => {
    setLoading(true);

    // 1. Create scan record in Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        router.push('/login');
        return;
    }

    const { data: scan, error } = await supabase
        .from('scans')
        .insert({
            url: values.url,
            user_id: user.id,
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating scan:', error);
        setLoading(false);
        return;
    }

    // 2. Trigger the API route to start the agent
    fetch('/api/scan', {
        method: 'POST',
        body: JSON.stringify({ scanId: scan.id, url: values.url }),
    });

    // 3. Redirect to the scan results page (which will show loading state)
    router.push(`/dashboard/scan/${scan.id}`);
  };

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xl">New Scan</Title>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <Text size="lg" mb="md">Enter the URL you want to scan</Text>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label="Website URL"
            placeholder="https://example.com"
            leftSection={<IconWorld size={16} />}
            {...form.getInputProps('url')}
          />

          <Button type="submit" fullWidth mt="xl" loading={loading}>
            Start Scan
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
