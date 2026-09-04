import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as availabilityRepo from '@/services/repositories/availabilityRepo';
import type { AvailabilityEntry, TimeRange, Weekday } from '@/services/types';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AvailabilitySummaryCard } from '@/components/availability/AvailabilitySummaryCard';
import { DayAvailabilityCard } from '@/components/availability/DayAvailabilityCard';

const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LABEL: Record<Weekday, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

function rangeHours(range: TimeRange): number {
  const [sh, sm] = range.start.split(':').map(Number);
  const [eh, em] = range.end.split(':').map(Number);
  return Math.max(0, eh + em / 60 - (sh + sm / 60));
}

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const [days, setDays] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    availabilityRepo.getForUser(user.id).then((entries) => {
      const byDay = new Map(entries.map((e) => [e.day, e]));
      setDays(WEEKDAYS.map((day) => byDay.get(day) ?? { userId: user.id, day, available: false, ranges: [] }));
      setLoading(false);
    });
  }, [user]);

  function toggleAvailable(index: number) {
    setSaved(false);
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, available: !d.available } : d)));
  }

  function addRange(index: number) {
    setSaved(false);
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ranges: [...d.ranges, { start: '09:00', end: '17:00' }] } : d))
    );
  }

  function removeRange(index: number, rangeIndex: number) {
    setSaved(false);
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ranges: d.ranges.filter((_, ri) => ri !== rangeIndex) } : d))
    );
  }

  function changeRange(index: number, rangeIndex: number, patch: Partial<TimeRange>) {
    setSaved(false);
    setDays((prev) =>
      prev.map((d, i) =>
        i === index
          ? { ...d, ranges: d.ranges.map((r, ri) => (ri === rangeIndex ? { ...r, ...patch } : r)) }
          : d
      )
    );
  }

  async function handleSave() {
    if (!user) return;
    await availabilityRepo.setForUser(user.id, days);
    setSaved(true);
  }

  if (!user || loading) return null;

  const totalHours = days.reduce(
    (sum, d) => sum + (d.available ? d.ranges.reduce((s, range) => s + rangeHours(range), 0) : 0),
    0
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Availability" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBlock}>
          <AppText variant="headlineLgMobile" color={palette.onSurface}>
            Weekly Availability
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            Set your recurring schedule to receive matching shift requests.
          </AppText>
        </View>

        <AvailabilitySummaryCard
          prefs={{
            totalAvailableHoursPerWeek: totalHours,
            targetMinHours: 20,
            targetMaxHours: 30,
            maxHoursPerShift: 8,
            minBreakBetweenShiftsHours: 12,
          }}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="sectionSm" color={palette.onSurface}>
              Standard Week
            </AppText>
          </View>
          <View style={styles.daysList}>
            {days.map((day, index) => (
              <DayAvailabilityCard
                key={day.day}
                day={{ ...day, label: WEEKDAY_LABEL[day.day] }}
                onToggleAvailable={() => toggleAvailable(index)}
                onAddRange={() => addRange(index)}
                onRemoveRange={(rangeIndex) => removeRange(index, rangeIndex)}
                onChangeRange={(rangeIndex, patch) => changeRange(index, rangeIndex, patch)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            Preferences
          </AppText>
          <Card style={styles.prefsCard}>
            <View style={styles.smartRow}>
              <Icon name="auto_awesome" size={18} color={palette.primary} />
              <AppText variant="caption" color={palette.primary}>
                Smart Scheduling
              </AppText>
            </View>
            <AppText variant="metadata" color={palette.onSurfaceVariant}>
              Max hours/shift and minimum break preferences are coming in a later pass — for now these
              are shown as defaults (8 hrs / 12 hrs).
            </AppText>
          </Card>
        </View>

        <Button label={saved ? 'Saved ✓' : 'Save Changes'} onPress={handleSave} />
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
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  daysList: { gap: spacing.sm },
  prefsCard: { gap: spacing.sm },
  smartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.base,
  },
});
