import { Tabs } from 'expo-router';

import { palette } from '@/constants/Colors';
import { Icon, IconName } from '@/components/Icon';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'schedule', title: 'Schedule', icon: 'calendar_today' },
  { name: 'availability', title: 'Availability', icon: 'event_available' },
  { name: 'work', title: 'Work', icon: 'work' },
  { name: 'profile', title: 'Profile', icon: 'person' },
];

export default function TabLayout() {
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
