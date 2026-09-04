import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h, isFuture, isToday } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import { useCollection } from '@/services/useCollection';
import { useEmployeeWorkplaces } from '@/services/useEmployeeWorkplaces';
import { seedShifts } from '@/services/seedData';
import type { Shift, ShiftReleaseRequest } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';

type ClaimableRequest = ShiftReleaseRequest & { shift: Shift };

export default function ScheduleScreen() {
  const { user } = useAuth();
  const { workplaceIds, workplaceName } = useEmployeeWorkplaces(user?.id);
  const { data: shifts, reload } = useCollection<Shift>('shifts', seedShifts);
  const [claimable, setClaimable] = useState<ClaimableRequest[]>([]);

  async function loadClaimable() {
    if (!user || workplaceIds.length === 0) return;
    const all = await Promise.all(workplaceIds.map((id) => shiftsRepo.getReleaseRequestsForWorkplace(id)));
    setClaimable(
      all.flat().filter((r) => r.status === 'approved_open_for_claims' && r.requestedByUserId !== user.id)
    );
  }

  useEffect(() => {
    loadClaimable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workplaceIds.join(','), shifts]);

  const myShifts = useMemo(
    () =>
      shifts
        .filter(
          (s) =>
            s.assignedUserId === user?.id &&
            (isToday(s.date) || isFuture(s.date)) &&
            s.status !== 'cancelled'
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [shifts, user]
  );

  if (!user) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Schedule" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            Your Schedule
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Upcoming shifts across all your workplaces.
          </AppText>
        </View>

        <View style={styles.section}>
          {myShifts.length === 0 && (
            <Card>
              <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                Nothing scheduled yet.
              </AppText>
            </Card>
          )}
          {myShifts.map((shift) => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              workplaceName={workplaceName(shift.workplaceId)}
              onPress={() => router.push({ pathname: '/shift-detail', params: { shiftId: shift.id } })}
            />
          ))}
        </View>

        {claimable.length > 0 && (
          <View style={styles.section}>
            <View style={styles.marketHeader}>
              <Icon name="storefront" size={20} color={palette.primary} />
              <AppText variant="sectionSm" color={palette.onSurface}>
                Marketplace — shifts a teammate released
              </AppText>
            </View>
            {claimable.map((request) => {
              const interested = request.interestedUserIds.includes(user.id);
              return (
                <Card key={request.id} style={{ gap: spacing.xs }}>
                  <View style={styles.rowBetween}>
                    <AppText variant="caption" color={palette.onSurface}>
                      {workplaceName(request.shift.workplaceId)} · {request.shift.roleTitle}
                    </AppText>
                    <AppText variant="metadata" color={palette.onSurfaceVariant}>
                      {request.shift.date}
                    </AppText>
                  </View>
                  <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                    {formatTime12h(request.shift.startTime)} – {formatTime12h(request.shift.endTime)}
                  </AppText>
                  <Button
                    label={interested ? 'Interest sent' : "I'm interested"}
                    size="md"
                    variant={interested ? 'secondary' : 'primary'}
                    disabled={interested}
                    onPress={() => shiftsRepo.expressInterest(request.id, user.id).then(loadClaimable)}
                  />
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ShiftRow({ shift, workplaceName, onPress }: { shift: Shift; workplaceName: string; onPress: () => void }) {
  const tone = shift.status === 'confirmed' ? 'success' : shift.status === 'requires_attention' ? 'error' : 'tertiary';
  const label =
    shift.status === 'confirmed'
      ? 'Confirmed'
      : shift.status === 'requires_attention'
        ? 'Needs attention'
        : 'Awaiting confirmation';

  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: spacing.xs }}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={palette.onSurface}>
            {workplaceName} · {shift.roleTitle}
          </AppText>
          <StatusPill label={label} tone={tone} withDot />
        </View>
        <View style={styles.metaRow}>
          <Icon name="calendar_today" size={16} color={palette.onSurfaceVariant} />
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            {shift.date} · {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerBlock: { gap: spacing.base },
  section: { gap: spacing.sm },
  marketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
