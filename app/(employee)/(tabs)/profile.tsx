import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeWorkplaces } from '@/services/useEmployeeWorkplaces';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { MenuRow } from '@/components/profile/MenuRow';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { workplaces } = useEmployeeWorkplaces(user?.id);

  if (!user) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AvatarPicker uri={user.avatarUri} size={96} />
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            {user.name}
          </AppText>
          <AppText variant="bodyLg" color={palette.onSurfaceVariant}>
            Student Employee
          </AppText>
          <View style={styles.editButton}>
            <Button label="Edit Profile" icon="edit" onPress={() => router.push('/profile-edit')} />
          </View>
        </View>

        <Section title="Work & Workplace">
          <Card style={styles.sectionCard}>
            <MenuRow
              icon="storefront"
              iconBackground="rgba(53, 37, 205, 0.1)"
              iconColor={palette.primary}
              title="My Workplaces"
              subtitle={workplaces.map((w) => w.name).join(', ') || 'None yet'}
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="event_available"
              iconBackground={palette.secondaryContainer}
              iconColor={palette.onSecondaryContainer}
              title="Availability Preferences"
              onPress={() => router.push('/(employee)/(tabs)/availability')}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="tune"
              iconBackground={palette.secondaryContainer}
              iconColor={palette.onSecondaryContainer}
              title="Work Preferences"
              subtitle="Weekly hour limit, roles, commute"
              onPress={() => router.push('/profile-edit')}
            />
          </Card>
        </Section>

        <Section title="App Settings">
          <Card style={styles.sectionCard}>
            <MenuRow
              icon="notifications"
              iconBackground={palette.surfaceContainer}
              iconColor={palette.onSurfaceVariant}
              title="Notifications"
              onPress={() => router.push('/notifications')}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="lock"
              iconBackground={palette.surfaceContainer}
              iconColor={palette.onSurfaceVariant}
              title="Privacy & Security"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="help"
              iconBackground={palette.surfaceContainer}
              iconColor={palette.onSurfaceVariant}
              title="Help & Support"
              onPress={() => {}}
            />
          </Card>
        </Section>

        <Button label="Log Out" icon="logout" variant="secondary" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="metadata" color={palette.outline} style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.base,
  },
  editButton: {
    marginTop: spacing.sm,
    width: '100%',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    textTransform: 'uppercase',
    paddingLeft: spacing.xs,
  },
  sectionCard: {
    padding: spacing.xs,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.surfaceVariant,
    marginLeft: 56,
  },
});
