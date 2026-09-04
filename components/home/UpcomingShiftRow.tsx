import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import type { UpcomingShift } from '@/data/mock/types';

type Props = {
  shift: UpcomingShift;
  onPress: () => void;
};

export function UpcomingShiftRow({ shift, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.dateBlock}>
          <AppText variant="metadata" color={palette.onSurfaceVariant} style={styles.weekday}>
            {shift.weekdayShort}
          </AppText>
          <AppText variant="sectionSm" color={palette.onSurface}>
            {shift.dayOfMonth}
          </AppText>
        </View>
        <View style={styles.textColumn}>
          <AppText variant="caption" color={palette.onSurface}>
            {shift.workplaceName}
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
            {shift.startTime} – {shift.endTime}
          </AppText>
        </View>
        <Icon name="chevron_right" size={20} color={palette.primary} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary,
  },
  dateBlock: {
    alignItems: 'center',
    minWidth: 40,
  },
  weekday: {
    textTransform: 'uppercase',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
});
