import { Tabs } from 'expo-router';

import { palette } from '@/constants/Colors';
import { Icon, IconName } from '@/components/Icon';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'overview', title: 'Overview', icon: 'dashboard' },
  { name: 'roster', title: 'Roster', icon: 'calendar_month' },
  { name: 'requests', title: 'Requests', icon: 'pending_actions' },
  { name: 'team', title: 'Team', icon: 'group' },
  { name: 'payroll', title: 'Payroll', icon: 'payments' },
];

export default function ManagerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.surfaceContainerHighest,
        },
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
      }}>
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <Icon name={icon} size={22} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
