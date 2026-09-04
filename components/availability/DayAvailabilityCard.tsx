import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { TimeField } from '@/components/ui/TimeField';
import type { DayAvailability, TimeRange } from '@/data/mock/types';

type Props = {
  day: DayAvailability;
  onToggleAvailable: () => void;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onChangeRange: (index: number, patch: Partial<TimeRange>) => void;
};

export function DayAvailabilityCard({
  day,
  onToggleAvailable,
  onAddRange,
  onRemoveRange,
  onChangeRange,
}: Props) {
  return (
    <Card style={!day.available && styles.dimmed}>
      <View style={styles.headerRow}>
        <View style={styles.dayLabelRow}>
          <View style={styles.initialCircle}>
            <AppText variant="sectionSm" color={palette.primary}>
              {day.day[0]}
            </AppText>
          </View>
          <AppText variant="bodyMd" color={day.available ? palette.onSurface : palette.onSurfaceVariant}>
            {day.label}
          </AppText>
        </View>
        <ThemedSwitch value={day.available} onValueChange={onToggleAvailable} />
      </View>

      {day.available ? (
        <View style={styles.rangesList}>
          {day.ranges.length === 0 && (
            <AppText variant="metadata" color={palette.onSurfaceVariant} style={styles.italic}>
              No hours set yet — add a time range below.
            </AppText>
          )}
          {day.ranges.map((range, index) => {
            const invalid = range.end <= range.start;
            return (
              <View key={index} style={styles.rangeRow}>
                <TimeField style={styles.timeField} value={range.start} onChange={(v) => onChangeRange(index, { start: v })} />
                <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
                  –
                </AppText>
                <TimeField style={styles.timeField} value={range.end} onChange={(v) => onChangeRange(index, { end: v })} />
                <Pressable
                  onPress={() => onRemoveRange(index)}
                  hitSlop={8}
                  style={styles.removeButton}
                  accessibilityLabel={`Remove ${day.label} time range`}>
                  <Icon name="close" size={18} color={palette.onSurfaceVariant} />
                </Pressable>
                {invalid && (
                  <AppText variant="metadata" color={palette.error} style={styles.errorText}>
                    End time must be after start time — this range won&apos;t count toward your hours.
                  </AppText>
                )}
              </View>
            );
          })}
          <Pressable onPress={onAddRange} style={styles.addRow} hitSlop={8}>
            <Icon name="add" size={16} color={palette.primary} />
            <AppText variant="caption" color={palette.primary}>
              Add time range
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.unavailableRow}>
          <AppText variant="caption" color={palette.onSurfaceVariant} style={styles.italic}>
            Unavailable all day
          </AppText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  dimmed: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  initialCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangesList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  timeField: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.xs,
  },
  errorText: {
    width: '100%',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  unavailableRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  italic: {
    fontStyle: 'italic',
  },
});
