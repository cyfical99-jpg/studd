import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h, isoDateInDays, todayIso } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as shiftsRepo from '@/services/repositories/shiftsRepo';
import * as timeOffRepo from '@/services/repositories/timeOffRepo';
import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import { useManagerWorkplace } from '@/services/useManagerWorkplace';
import type { Shift, ShiftReleaseRequest, TimeOffRequest } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatCard } from '@/components/home/StatCard';
import { StatusPill } from '@/components/ui/StatusPill';

type ReleaseRow = ShiftReleaseRequest & { shift: Shift };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The manager-side "at a glance" home tab — high-level counts and anything
 * that needs a decision, with quick links into the detailed Roster/Requests
 * tabs rather than duplicating their full lists here. */
export default function ManagerOverviewScreen() {
  const { user } = useAuth();
  const { workplace, loading: loadingWorkplace } = useManagerWorkplace(user?.id);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  async function load() {
    if (!workplace) return;
    const [s, r, t, employments] = await Promise.all([
      shiftsRepo.getForWorkplace(workplace.id),
      shiftsRepo.getReleaseRequestsForWorkplace(workplace.id),
      timeOffRepo.getForWorkplace(workplace.id),
      workplacesRepo.getEmploymentsForWorkplace(workplace.id),
    ]);
    setShifts(s);
    setReleases(r);
    setTimeOff(t);
    setTeamCount(employments.length);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workplace]);

  if (loadingWorkplace || !workplace || !user) return null;

  const weekShifts = shifts.filter(
    (s) => s.date >= todayIso() && s.date < isoDateInDays(7) && s.status !== 'cancelled'
  );
  const needsAttention = shifts
    .filter((s) => s.status === 'requires_attention')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const pendingReleases = releases.filter((r) => r.status === 'pending_manager_review');
  const openForClaims = releases.filter((r) => r.status === 'approved_open_for_claims');
  const pendingTimeOff = timeOff.filter((t) => t.status === 'pending');
  const pendingRequestsCount = pendingReleases.length + openForClaims.length + pendingTimeOff.length;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Overview" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingBlock}>
          <AppText variant="sectionSm" color={palette.onBackground}>
            {greeting()}, {user.name}
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            {workplace.name} — here&apos;s where things stand.
          </AppText>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="calendar_month"
            label="This Week"
            value={`${weekShifts.length}`}
            caption="shifts scheduled"
          />
          <StatCard
            icon="group"
            label="Team"
            value={`${teamCount}`}
            caption={teamCount === 1 ? 'team member' : 'team members'}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="error"
            label="Needs Attention"
            value={`${needsAttention.length}`}
            caption={needsAttention.length > 0 ? 'unconfirmed past due' : 'all clear'}
            captionColor={needsAttention.length > 0 ? palette.error : palette.success}
          />
          <StatCard
            icon="pending_actions"
            label="Pending"
            value={`${pendingRequestsCount}`}
            caption="requests waiting"
            captionColor={pendingRequestsCount > 0 ? palette.tertiary : undefined}
          />
        </View>

        {needsAttention.length > 0 && (
          <View style={styles.section}>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Needs Attention
            </AppText>
            {needsAttention.slice(0, 3).map((shift) => (
              <Card key={shift.id} style={styles.alertRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.rowBetween}>
                    <AppText variant="caption" color={palette.onSurface}>
                      {shift.roleTitle}
                    </AppText>
                    <StatusPill label="Unconfirmed" tone="error" withDot />
                  </View>
                  <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                    {shift.date} · {formatTime12h(shift.startTime)}–{formatTime12h(shift.endTime)}
                  </AppText>
                </View>
              </Card>
            ))}
            <Button
              label="Review in Roster"
              size="md"
              variant="secondary"
              onPress={() => router.push('/(manager)/(tabs)/roster')}
            />
          </View>
        )}

        {pendingRequestsCount > 0 && (
          <View style={styles.section}>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Pending Requests
            </AppText>
            <Card style={{ gap: spacing.xs }}>
              <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                {pendingTimeOff.length > 0 && `${pendingTimeOff.length} time-off request${pendingTimeOff.length === 1 ? '' : 's'}`}
                {pendingTimeOff.length > 0 && pendingReleases.length + openForClaims.length > 0 && ' · '}
                {pendingReleases.length + openForClaims.length > 0 &&
                  `${pendingReleases.length + openForClaims.length} shift release${pendingReleases.length + openForClaims.length === 1 ? '' : 's'}`}
              </AppText>
              <Button
                label="Review Requests"
                size="md"
                onPress={() => router.push('/(manager)/(tabs)/requests')}
              />
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            Quick Actions
          </AppText>
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="Generate with AI"
                icon="auto_awesome"
                variant="secondary"
                size="md"
                onPress={() => router.push({ pathname: '/roster-generate', params: { workplaceId: workplace.id } })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Open Roster"
                icon="calendar_month"
                size="md"
                onPress={() => router.push('/(manager)/(tabs)/roster')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
  greetingBlock: { gap: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  alertRow: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
});
