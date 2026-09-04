import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { isoDateInDays, todayIso } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as payrollRepo from '@/services/repositories/payrollRepo';
import { getUserById } from '@/services/repositories/workplacesRepo';
import { useManagerWorkplace } from '@/services/useManagerWorkplace';
import { getAll } from '@/services/localStore';
import type { PayrollLine } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ManagerPayrollScreen() {
  const { user } = useAuth();
  const { workplace, loading: loadingWorkplace } = useManagerWorkplace(user?.id);
  const [lines, setLines] = useState<(PayrollLine & { name: string })[]>([]);
  const [running, setRunning] = useState(false);

  async function load() {
    if (!workplace) return;
    const all = await getAll<PayrollLine>('payroll_lines', []);
    const mine = all.filter((l) => l.workplaceId === workplace.id);
    const withNames = await Promise.all(
      mine.map(async (l) => ({ ...l, name: (await getUserById(l.userId))?.name ?? 'Unknown' }))
    );
    setLines(withNames.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workplace]);

  async function handleRunPayroll() {
    if (!workplace) return;
    setRunning(true);
    try {
      await payrollRepo.runPayroll({
        workplaceId: workplace.id,
        periodStart: isoDateInDays(-14),
        periodEnd: todayIso(),
      });
      await load();
    } finally {
      setRunning(false);
    }
  }

  if (loadingWorkplace || !workplace) return null;

  const pending = lines.filter((l) => l.status === 'pending_payment');
  const paid = lines.filter((l) => l.status === 'paid');
  const totalPending = pending.reduce((s, l) => s + l.amount, 0);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Payroll" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            {workplace.name} Payroll
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Turns clocked hours from the last 14 days into pay lines ready to send.
          </AppText>
        </View>

        <Card style={{ backgroundColor: palette.primary, gap: spacing.xs }}>
          <AppText variant="metadata" color="rgba(255,255,255,0.8)" style={styles.eyebrow}>
            Pending Payout
          </AppText>
          <AppText variant="displayXl" color={palette.onPrimary}>
            ${totalPending.toFixed(2)}
          </AppText>
          <Button
            label={running ? 'Running…' : 'Run Payroll (last 14 days)'}
            variant="secondary"
            style={styles.runButton}
            onPress={handleRunPayroll}
            disabled={running}
          />
        </Card>

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            Pending
          </AppText>
          {pending.length === 0 && (
            <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
              Nothing pending — run payroll to generate lines from clocked hours.
            </AppText>
          )}
          {pending.map((line) => (
            <Card key={line.id} style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={palette.onSurface}>
                  {line.name}
                </AppText>
                <AppText variant="metadata" color={palette.onSurfaceVariant}>
                  {line.hours.toFixed(1)}h · {line.periodStart} – {line.periodEnd}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                <AppText variant="sectionSm" color={palette.onSurface}>
                  ${line.amount.toFixed(2)}
                </AppText>
                <Button label="Mark Paid" size="md" style={styles.markPaid} onPress={() => payrollRepo.markPaid(line.id).then(load)} />
              </View>
            </Card>
          ))}
        </View>

        {paid.length > 0 && (
          <View style={styles.section}>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Paid
            </AppText>
            {paid.map((line) => (
              <Card key={line.id} style={styles.rowBetween}>
                <View>
                  <AppText variant="caption" color={palette.onSurface}>
                    {line.name}
                  </AppText>
                  <AppText variant="metadata" color={palette.onSurfaceVariant}>
                    {line.periodStart} – {line.periodEnd}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="sectionSm" color={palette.onSurface}>
                    ${line.amount.toFixed(2)}
                  </AppText>
                  <StatusPill label="Paid" tone="success" />
                </View>
              </Card>
            ))}
          </View>
        )}
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
  headerBlock: { gap: spacing.base },
  eyebrow: { textTransform: 'uppercase' },
  runButton: { marginTop: spacing.sm },
  section: { gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markPaid: { width: 110 },
});
