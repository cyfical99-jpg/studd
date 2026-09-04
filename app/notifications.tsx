import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as notificationsRepo from '@/services/repositories/notificationsRepo';
import type { NotificationKind, NotificationRecord } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { Icon, IconName } from '@/components/Icon';

const KIND_ICON: Record<NotificationKind, IconName> = {
  shift_assigned: 'event',
  shift_reminder: 'schedule',
  shift_escalation: 'warning',
  release_request: 'sync_alt',
  release_approved: 'check_circle',
  replacement_approved: 'how_to_reg',
  time_off_decision: 'event_busy',
  roster_published: 'calendar_month',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRecord[]>([]);

  async function load() {
    if (!user) return;
    setItems(await notificationsRepo.getForUser(user.id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handlePress(item: NotificationRecord) {
    if (!item.read) {
      await notificationsRepo.markRead(item.id);
      load();
    }
  }

  return (
    <View style={styles.flex}>
      <BackHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 && (
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            You&apos;re all caught up!
          </AppText>
        )}
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => handlePress(item)}>
            <Card style={[styles.row, !item.read && styles.unread]}>
              <View style={styles.iconCircle}>
                <Icon name={KIND_ICON[item.kind] ?? 'notifications'} size={18} color={palette.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="caption" color={palette.onSurface}>
                  {item.title}
                </AppText>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  {item.body}
                </AppText>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
