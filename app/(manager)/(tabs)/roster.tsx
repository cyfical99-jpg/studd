import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { formatTime12h, isoDateInDays, todayIso } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import * as workplacesRepo from '@/services/repositories/workplacesRepo';
import { useCollection } from '@/services/useCollection';
import { useManagerWorkplace } from '@/services/useManagerWorkplace';
import { seedShifts } from '@/services/seedData';
import type { Shift } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { AddShiftForm } from '@/components/manager/AddShiftForm';

export default function ManagerRosterScreen() {
  const { user } = useAuth();
  const { workplace, loading: loadingWorkplace } = useManagerWorkplace(user?.id);
  const { data: shifts, reload } = useCollection<Shift>('shifts', seedShifts);
  const [names, setNames] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!workplace) return;
    workplacesRepo.getEmploymentsForWorkplace(workplace.id).then(async (employments) => {
      const entries = await Promise.all(
        employments.map(async (e) => [e.userId, (await workplacesRepo.getUserById(e.userId))?.name ?? 'Unknown'] as const)
      );
      setNames(Object.fromEntries(entries));
    });
  }, [workplace]);

  const weekShifts = useMemo(() => {
    if (!workplace) return [];
    const start = todayIso();
    const end = isoDateInDays(7);
    return shifts
      .filter((s) => s.workplaceId === workplace.id && s.date >= start && s.date < end && s.status !== 'cancelled')
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }, [shifts, workplace]);

  if (loadingWorkplace || !workplace) return null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Roster" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            {workplace.name} — This Week
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            {weekShifts.length} shifts scheduled.
          </AppText>
        </View>

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
            <Button label="Add Shift" icon="add" size="md" onPress={() => setShowAddForm((v) => !v)} />
          </View>
        </View>

        {showAddForm && (
          <AddShiftForm
            workplaceId={workplace.id}
            onCreated={() => {
              setShowAddForm(false);
              reload();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <View style={styles.section}>
          {weekShifts.length === 0 && (
            <Card>
              <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                No shifts scheduled this week yet.
              </AppText>
            </Card>
          )}
          {weekShifts.map((shift) => (
            <Card key={shift.id} style={styles.shiftRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.rowBetween}>
                  <AppText variant="caption" color={palette.onSurface}>
                    {shift.roleTitle}
                  </AppText>
                  <StatusPill
                    label={
                      shift.status === 'requires_attention'
                        ? 'Needs attention'
                        : shift.status === 'confirmed'
                          ? 'Confirmed'
                          : shift.status === 'published'
                            ? 'Open'
                            : 'Awaiting'
                    }
                    tone={
                      shift.status === 'requires_attention'
                        ? 'error'
                        : shift.status === 'confirmed'
                          ? 'success'
                          : shift.status === 'published'
                            ? 'neutral'
                            : 'tertiary'
                    }
                    withDot
                  />
                </View>
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  {shift.date} · {formatTime12h(shift.startTime)}–{formatTime12h(shift.endTime)}
                </AppText>
                <View style={styles.metaRow}>
                  <Icon name="person" size={14} color={palette.onSurfaceVariant} />
                  <AppText variant="metadata" color={palette.onSurfaceVariant}>
                    {shift.assignedUserId ? (names[shift.assignedUserId] ?? '…') : 'Unassigned'}
                  </AppText>
                </View>
              </View>
            </Card>
          ))}
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
  headerBlock: { gap: spacing.base },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  shiftRow: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
});
