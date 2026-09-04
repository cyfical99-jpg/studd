import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getWeeklyScheduledHoursForWorkplace } from '@/services/repositories/payrollRepo';
import { getUserById } from '@/services/repositories/workplacesRepo';
import { useManagerWorkplace } from '@/services/useManagerWorkplace';
import type { Employment } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';

type Row = { employment: Employment; name: string; scheduledHours: number; wouldExceedLimit: boolean };

export default function ManagerTeamScreen() {
  const { user } = useAuth();
  const { workplace, loading: loadingWorkplace } = useManagerWorkplace(user?.id);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!workplace) return;
    getWeeklyScheduledHoursForWorkplace(workplace.id).then(async (results) => {
      const withNames = await Promise.all(
        results.map(async (r) => ({
          ...r,
          name: (await getUserById(r.employment.userId))?.name ?? 'Unknown',
        }))
      );
      setRows(withNames);
    });
  }, [workplace]);

  if (loadingWorkplace || !workplace) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Team" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            {workplace.name} Team
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Hours scheduled this week vs. each person&apos;s own configured limit.
          </AppText>
        </View>

        {rows.map((row) => (
          <Card key={row.employment.id} style={{ gap: spacing.xs }}>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={palette.onSurface}>
                  {row.name}
                </AppText>
                <AppText variant="metadata" color={palette.onSurfaceVariant}>
                  {row.employment.roleTitle}
                </AppText>
              </View>
              {row.wouldExceedLimit && <StatusPill label="Over limit" tone="error" withDot />}
            </View>
            <ProgressBar
              progress={row.employment.maxWeeklyHours > 0 ? row.scheduledHours / row.employment.maxWeeklyHours : 0}
              color={row.wouldExceedLimit ? palette.error : palette.primary}
            />
            <AppText variant="metadata" color={palette.onSurfaceVariant}>
              {row.scheduledHours.toFixed(0)}h / {row.employment.maxWeeklyHours}h configured limit
            </AppText>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.marginMobile,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerBlock: { gap: spacing.base, marginBottom: spacing.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
});
