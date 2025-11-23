'use client';

import { AppShell, Burger, Group, Skeleton, Text, NavLink, Button, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconHome, IconPlus, IconLogout } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                <Title order={3}>
                    <Text span inherit variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Gherkin Builder</Text>
                </Title>
            </Group>
            <Button variant="subtle" color="red" leftSection={<IconLogout size={18} />} onClick={handleLogout}>
                Logout
            </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
            component={Link}
            href="/dashboard"
            label="Dashboard"
            leftSection={<IconHome size={20} />}
            active={pathname === '/dashboard'}
            variant="light"
        />
        <NavLink
            component={Link}
            href="/dashboard/new"
            label="New Scan"
            leftSection={<IconPlus size={20} />}
            active={pathname === '/dashboard/new'}
            variant="light"
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
