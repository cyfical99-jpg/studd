import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { isFuture, isToday, relativeDayLabel } from '@/lib/date';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import { getPayrollSummary, getWeeklyScheduledHours } from '@/services/repositories/payrollRepo';
import { useCollection } from '@/services/useCollection';
import { useEmployeeWorkplaces } from '@/services/useEmployeeWorkplaces';
import { seedShifts } from '@/services/seedData';
import type { Shift } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TodayShiftCard } from '@/components/home/TodayShiftCard';
import { StatCard } from '@/components/home/StatCard';
import { OpenShiftCard } from '@/components/home/OpenShiftCard';
import { UpcomingShiftRow } from '@/components/home/UpcomingShiftRow';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { workplaceIds, workplaceName } = useEmployeeWorkplaces(user?.id);
  const { data: shifts, reload } = useCollection<Shift>('shifts', seedShifts);
  const [weekly, setWeekly] = useState<{ scheduledHours: number; limit: number; remainingHours: number } | null>(null);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    getWeeklyScheduledHours(user.id).then(setWeekly);
    getPayrollSummary(user.id).then((s) => setWeeklyEarnings(s.weeklyEarnings));
  }, [user, shifts]);

  const myShifts = useMemo(() => shifts.filter((s) => s.assignedUserId === user?.id), [shifts, user]);
  const todayShift = myShifts.find(
    (s) => isToday(s.date) && (s.status === 'awaiting_confirmation' || s.status === 'confirmed')
  );
  const upcomingShifts = myShifts
    .filter((s) => isFuture(s.date) && (s.status === 'confirmed' || s.status === 'awaiting_confirmation'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const openShifts = shifts.filter(
    (s) => s.status === 'published' && !s.assignedUserId && workplaceIds.includes(s.workplaceId)
  );

  if (!user) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Home" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingBlock}>
          <AppText variant="sectionSm" color={palette.onBackground}>
            {greeting()}, {user.name}
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Here&apos;s what&apos;s happening today.
          </AppText>
        </View>

        {todayShift && (
          <TodayShiftCard
            shift={{
              id: todayShift.id,
              workplaceName: workplaceName(todayShift.workplaceId),
              roleTitle: todayShift.roleTitle,
              startTime: todayShift.startTime,
              endTime: todayShift.endTime,
              status: todayShift.status === 'confirmed' ? 'confirmed' : 'awaiting_confirmation',
            }}
            onConfirm={() => shiftsRepo.confirmShift(todayShift.id, user.id).then(reload)}
            onViewDetails={() => router.push({ pathname: '/shift-detail', params: { shiftId: todayShift.id } })}
          />
        )}

        {weekly && (
          <View style={styles.statsRow}>
            <StatCard
              icon="schedule"
              label="Weekly Hours"
              value={`${weekly.scheduledHours.toFixed(0)} / ${weekly.limit}`}
              caption={`${weekly.remainingHours.toFixed(0)} hours remaining`}
              progress={weekly.limit > 0 ? weekly.scheduledHours / weekly.limit : 0}
            />
            <StatCard
              icon="payments"
              label="Earnings"
              value={`$${weeklyEarnings.toFixed(2)}`}
              caption="This week so far"
            />
          </View>
        )}

        {openShifts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="sectionSm" color={palette.onBackground}>
                Open Shifts
              </AppText>
              <AppText variant="caption" color={palette.primary}>
                {openShifts.length} available
              </AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.openShiftsRow}>
              {openShifts.map((shift) => (
                <OpenShiftCard
                  key={shift.id}
                  shift={{
                    id: shift.id,
                    workplaceName: workplaceName(shift.workplaceId),
                    dayLabel: relativeDayLabel(shift.date),
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                  }}
                  onRequest={() => shiftsRepo.requestOpenShift(shift.id, user.id).then(reload)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onBackground} style={styles.sectionTitleOnly}>
            Upcoming
          </AppText>
          <View style={styles.upcomingList}>
            {upcomingShifts.length === 0 && (
              <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                No upcoming shifts scheduled yet.
              </AppText>
            )}
            {upcomingShifts.map((shift) => (
              <UpcomingShiftRow
                key={shift.id}
                shift={{
                  id: shift.id,
                  workplaceName: workplaceName(shift.workplaceId),
                  weekdayShort: new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                  dayOfMonth: new Date(shift.date).getDate(),
                  startTime: shift.startTime,
                  endTime: shift.endTime,
                }}
                onPress={() => router.push({ pathname: '/shift-detail', params: { shiftId: shift.id } })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greetingBlock: {
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleOnly: {
    marginBottom: 0,
  },
  openShiftsRow: {
    gap: spacing.sm,
  },
  upcomingList: {
    gap: spacing.sm,
  },
});
