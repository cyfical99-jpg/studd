import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h } from '@/lib/date';
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

type ReleaseRow = ShiftReleaseRequest & { shift: Shift };

export default function ManagerRequestsScreen() {
  const { user } = useAuth();
  const { workplace, loading: loadingWorkplace } = useManagerWorkplace(user?.id);
  const [tab, setTab] = useState<'timeoff' | 'releases'>('timeoff');
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  async function load() {
    if (!workplace) return;
    const [offs, rel, employments] = await Promise.all([
      timeOffRepo.getForWorkplace(workplace.id),
      shiftsRepo.getReleaseRequestsForWorkplace(workplace.id),
      workplacesRepo.getEmploymentsForWorkplace(workplace.id),
    ]);
    setTimeOff(offs);
    setReleases(rel);
    const entries = await Promise.all(
      employments.map(async (e) => [e.userId, (await workplacesRepo.getUserById(e.userId))?.name ?? 'Unknown'] as const)
    );
    setNames(Object.fromEntries(entries));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workplace]);

  if (loadingWorkplace || !workplace || !user) return null;

  const pendingReleases = releases.filter((r) => r.status === 'pending_manager_review');
  const openForClaims = releases.filter((r) => r.status === 'approved_open_for_claims');

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Requests" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabsRow}>
          <TabButton label={`Time Off (${timeOff.filter((t) => t.status === 'pending').length})`} active={tab === 'timeoff'} onPress={() => setTab('timeoff')} />
          <TabButton label={`Shift Releases (${pendingReleases.length + openForClaims.length})`} active={tab === 'releases'} onPress={() => setTab('releases')} />
        </View>

        {tab === 'timeoff' && (
          <View style={styles.section}>
            {timeOff.length === 0 && (
              <Card>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  No time-off requests.
                </AppText>
              </Card>
            )}
            {timeOff.map((t) => (
              <Card key={t.id} style={{ gap: spacing.xs }}>
                <View style={styles.rowBetween}>
                  <AppText variant="caption" color={palette.onSurface}>
                    {names[t.userId] ?? 'Employee'} · {t.reasonType}
                  </AppText>
                  <AppText variant="metadata" color={palette.onSurfaceVariant}>
                    {t.status}
                  </AppText>
                </View>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  {t.startDate} – {t.endDate}
                </AppText>
                {t.note && (
                  <AppText variant="caption" color={palette.onSurfaceVariant} style={styles.note}>
                    &quot;{t.note}&quot;
                  </AppText>
                )}
                {t.status === 'pending' && (
                  <View style={styles.actionsRow}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Decline"
                        size="md"
                        variant="secondary"
                        onPress={() => timeOffRepo.decide(t.id, 'declined').then(load)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Approve"
                        size="md"
                        onPress={() => timeOffRepo.decide(t.id, 'approved').then(load)}
                      />
                    </View>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {tab === 'releases' && (
          <View style={styles.section}>
            {pendingReleases.length === 0 && openForClaims.length === 0 && (
              <Card>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  No shift release requests.
                </AppText>
              </Card>
            )}

            {pendingReleases.map((r) => (
              <Card key={r.id} style={{ gap: spacing.xs }}>
                <AppText variant="caption" color={palette.onSurface}>
                  {names[r.requestedByUserId] ?? 'Employee'} wants to release {r.shift.roleTitle}
                </AppText>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  {r.shift.date} · {formatTime12h(r.shift.startTime)}–{formatTime12h(r.shift.endTime)}
                </AppText>
                <AppText variant="caption" color={palette.onSurfaceVariant} style={styles.note}>
                  &quot;{r.reason}&quot;
                </AppText>
                <View style={styles.actionsRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Decline"
                      size="md"
                      variant="secondary"
                      onPress={() => shiftsRepo.declineRelease(r.id, user.id).then(load)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Approve — open it up"
                      size="md"
                      onPress={() => shiftsRepo.approveRelease(r.id, user.id).then(load)}
                    />
                  </View>
                </View>
              </Card>
            ))}

            {openForClaims.map((r) => (
              <Card key={r.id} style={{ gap: spacing.sm }}>
                <AppText variant="caption" color={palette.onSurface}>
                  Open: {r.shift.roleTitle} on {r.shift.date}
                </AppText>
                <AppText variant="metadata" color={palette.onSurfaceVariant}>
                  Released by {names[r.requestedByUserId] ?? 'Employee'}
                </AppText>
                {r.interestedUserIds.length === 0 ? (
                  <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                    Waiting for someone to express interest.
                  </AppText>
                ) : (
                  r.interestedUserIds.map((uid) => (
                    <View key={uid} style={styles.rowBetween}>
                      <AppText variant="bodyMd" color={palette.onSurface}>
                        {names[uid] ?? 'Employee'}
                      </AppText>
                      <Button
                        label="Approve"
                        size="md"
                        style={styles.smallApprove}
                        onPress={() => shiftsRepo.approveReplacement({ requestId: r.id, chosenUserId: uid, managerId: user.id }).then(load)}
                      />
                    </View>
                  ))
                )}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      label={label}
      size="md"
      variant={active ? 'primary' : 'secondary'}
      onPress={onPress}
      style={styles.tabButton}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  tabsRow: { flexDirection: 'row', gap: spacing.sm },
  tabButton: { flex: 1 },
  section: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  note: { fontStyle: 'italic' },
  smallApprove: { width: 110 },
});
