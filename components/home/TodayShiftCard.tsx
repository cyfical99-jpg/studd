import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import type { TodayShift } from '@/data/mock/types';

type Props = {
  shift: TodayShift;
  onConfirm: () => void;
  onViewDetails: () => void;
};

export function TodayShiftCard({ shift, onConfirm, onViewDetails }: Props) {
  const isAwaiting = shift.status === 'awaiting_confirmation';

  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={{ gap: 2 }}>
          <AppText variant="metadata" color={palette.primary} style={styles.eyebrow}>
            Today&apos;s Shift
          </AppText>
          <AppText variant="sectionSm" color={palette.onSurface}>
            {shift.workplaceName}
          </AppText>
        </View>
        <StatusPill
          label={isAwaiting ? 'Awaiting' : 'Confirmed'}
          tone={isAwaiting ? 'tertiary' : 'success'}
          withDot
        />
      </View>

      <View style={styles.metaRow}>
        <Icon name="schedule" size={20} color={palette.onSurfaceVariant} />
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          {shift.startTime} – {shift.endTime}
        </AppText>
      </View>
      <View style={styles.metaRow}>
        <Icon name="badge" size={20} color={palette.onSurfaceVariant} />
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          {shift.roleTitle}
        </AppText>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="Confirm Shift" size="md" onPress={onConfirm} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="View Details" variant="secondary" size="md" onPress={onViewDetails} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
