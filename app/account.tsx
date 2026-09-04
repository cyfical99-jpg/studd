import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <View style={styles.flex}>
      <BackHeader title="Account" />
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Icon name="person" size={40} color={palette.primary} />
        </View>
        <AppText variant="headlineLgMobile" color={palette.onSurface}>
          {user.name}
        </AppText>
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          {user.email}
        </AppText>
        <AppText variant="caption" color={palette.primary} style={styles.roleBadge}>
          {user.role === 'manager' ? 'Manager' : 'Student / Employee'}
        </AppText>

        <View style={styles.actions}>
          <Button
            label="Notifications"
            icon="notifications"
            variant="secondary"
            onPress={() => router.push('/notifications')}
          />
          <Button label="Log Out" icon="logout" onPress={signOut} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.marginMobile,
    gap: spacing.base,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  roleBadge: {
    marginTop: spacing.base,
    textTransform: 'uppercase',
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
