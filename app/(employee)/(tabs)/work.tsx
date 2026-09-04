import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as payrollRepo from '@/services/repositories/payrollRepo';
import type { PayrollSummary } from '@/services/repositories/payrollRepo';
import * as timeOffRepo from '@/services/repositories/timeOffRepo';
import { useEmployeeWorkplaces } from '@/services/useEmployeeWorkplaces';
import type { TimeEntry, TimeOffRequest } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';

export default function WorkScreen() {
  const { user } = useAuth();
  const { employments, workplaceName, loading: loadingWorkplaces } = useEmployeeWorkplaces(user?.id);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [openEntry, setOpenEntry] = useState<TimeEntry | null>(null);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!user) return;
    const [s, entry, offs] = await Promise.all([
      payrollRepo.getPayrollSummary(user.id),
      payrollRepo.getOpenEntryForUser(user.id),
      timeOffRepo.getForUser(user.id),
    ]);
    setSummary(s);
    setOpenEntry(entry ?? null);
    setTimeOff(offs);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleClockToggle(workplaceId: string) {
    if (!user) return;
    setBusy(true);
    try {
      if (openEntry) {
        await payrollRepo.clockOut(openEntry.id, 0);
      } else {
        await payrollRepo.clockIn({ userId: user.id, workplaceId });
      }
      await reload();
    } finally {
      setBusy(false);
    }
  }

  if (!user || loadingWorkplaces || !summary) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Work" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            Work & Payroll
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Hours and earnings across every workplace, in one place.
          </AppText>
        </View>

        <Card style={{ backgroundColor: palette.primary, gap: spacing.xs }}>
          <AppText variant="metadata" color="rgba(255,255,255,0.8)" style={styles.eyebrow}>
            {openEntry ? 'Currently clocked in' : 'Not clocked in'}
          </AppText>
          <View style={styles.clockRow}>
            <AppText variant="headlineLgMobile" color={palette.onPrimary}>
              {openEntry ? workplaceName(openEntry.workplaceId) : 'Ready to start a shift?'}
            </AppText>
          </View>
          {employments.length > 0 && (
            <Button
              label={openEntry ? 'Clock Out' : `Clock In — ${workplaceName(employments[0].workplaceId)}`}
              variant="secondary"
              style={styles.clockButton}
              onPress={() => handleClockToggle(openEntry?.workplaceId ?? employments[0].workplaceId)}
              disabled={busy}
            />
          )}
        </Card>

        <View style={styles.statsGrid}>
          <MiniStat label="This Week" value={`$${summary.weeklyEarnings.toFixed(2)}`} />
          <MiniStat label="This Month" value={`$${summary.monthlyEarnings.toFixed(2)}`} />
          <MiniStat label="Pending" value={`$${summary.pendingAmount.toFixed(2)}`} />
          <MiniStat label="Paid" value={`$${summary.paidAmount.toFixed(2)}`} />
        </View>

        <Card surface="containerLow" style={{ gap: spacing.base }}>
          <View style={styles.rowBetween}>
            <AppText variant="caption" color={palette.onSurface}>
              Estimated upcoming
            </AppText>
            <AppText variant="sectionSm" color={palette.primary}>
              ${summary.estimatedUpcoming.toFixed(2)}
            </AppText>
          </View>
          <AppText variant="metadata" color={palette.onSurfaceVariant}>
            From your confirmed shifts not yet worked.
          </AppText>
        </Card>

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            My Workplaces
          </AppText>
          {employments.map((e) => (
            <Card key={e.id} style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={palette.onSurface}>
                  {workplaceName(e.workplaceId)}
                </AppText>
                <AppText variant="metadata" color={palette.onSurfaceVariant}>
                  {e.roleTitle} · ${e.hourlyRate}/hr
                </AppText>
              </View>
              <Icon name="storefront" size={20} color={palette.primary} />
            </Card>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Time Off
            </AppText>
            <Button
              label="Request"
              size="md"
              variant="secondary"
              onPress={() => router.push('/time-off-request')}
              style={styles.requestButton}
            />
          </View>
          {timeOff.length === 0 && (
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              No time-off requests yet.
            </AppText>
          )}
          {timeOff.map((t) => (
            <Card key={t.id} style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={palette.onSurface}>
                  {t.reasonType}
                </AppText>
                <AppText variant="metadata" color={palette.onSurfaceVariant}>
                  {t.startDate} – {t.endDate}
                </AppText>
              </View>
              <StatusPill
                label={t.status[0].toUpperCase() + t.status.slice(1)}
                tone={t.status === 'approved' ? 'success' : t.status === 'declined' ? 'error' : 'tertiary'}
              />
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.miniStat}>
      <AppText variant="metadata" color={palette.onSurfaceVariant} style={styles.eyebrow}>
        {label}
      </AppText>
      <AppText variant="sectionSm" color={palette.onSurface}>
        {value}
      </AppText>
    </Card>
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
  eyebrow: { textTransform: 'uppercase' },
  clockRow: { marginTop: 2 },
  clockButton: { marginTop: spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  miniStat: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { gap: spacing.sm },
  requestButton: { width: 110 },
});
