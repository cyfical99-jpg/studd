import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/Icon';
import type { OpenShift } from '@/data/mock/types';

type Props = {
  shift: OpenShift;
  onRequest: () => void;
};

export function OpenShiftCard({ shift, onRequest }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="caption" color={palette.onSurface}>
          {shift.workplaceName}
        </AppText>
        <AppText variant="metadata" color={palette.onSurfaceVariant}>
          {shift.dayLabel}
        </AppText>
      </View>
      <View style={styles.metaRow}>
        <Icon name="schedule" size={18} color={palette.onSurfaceVariant} />
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          {shift.startTime} – {shift.endTime}
        </AppText>
      </View>
      <View style={styles.buttonSpacing}>
        <Button label="Request Shift" variant="secondary" size="md" onPress={onRequest} style={styles.requestButton} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  buttonSpacing: {
    marginTop: spacing.xs,
  },
  requestButton: {
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceContainerHighest,
  },
});
