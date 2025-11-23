'use client';

import { Container, Title, Text, Button, Group, Stack, ThemeIcon, SimpleGrid, Card, rem } from '@mantine/core';
import { IconWand, IconRobot, IconCode, IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl" align="center" py={80}>
        <Group justify="center">
          <ThemeIcon size={60} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconRobot style={{ width: rem(32), height: rem(32) }} stroke={1.5} />
          </ThemeIcon>
        </Group>

        <Title order={1} style={{ fontSize: rem(48), fontWeight: 900, textAlign: 'center' }}>
          Automate Your Gherkin <Text span inherit variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Specs</Text>
        </Title>

        <Text c="dimmed" size="xl" maw={600} ta="center">
          Turn any website into a comprehensive suite of Gherkin scenarios instantly.
          Powered by Agentic AI to understand your application's behavior.
        </Text>

        <Group>
          <Button component={Link} href="/login" size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} rightSection={<IconArrowRight size={18} />}>
            Get Started
          </Button>
          <Button component={Link} href="#features" size="xl" radius="md" variant="default">
            Learn more
          </Button>
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" py={50} id="features">
        <FeatureCard
          icon={IconWand}
          title="Instant Generation"
          description="Just provide a URL. Our agent browses your site and generates Gherkin syntax automatically."
        />
        <FeatureCard
          icon={IconCode}
          title="Standard Compliant"
          description="Generates valid Gherkin syntax compatible with Cucumber, Behave, and other BDD frameworks."
        />
        <FeatureCard
          icon={IconRobot}
          title="Agentic Exploration"
          description="Our AI agent intelligently navigates through your application to discover edge cases and user flows."
        />
      </SimpleGrid>
    </Container>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        {/* Image or visual could go here */}
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <ThemeIcon size={40} radius="md" variant="light" color="blue">
          <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
        </ThemeIcon>
      </Group>

      <Text fw={500} size="lg" mt="md">{title}</Text>

      <Text size="sm" c="dimmed" mt="sm">
        {description}
      </Text>
    </Card>
  );
}
