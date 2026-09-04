import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { AvailabilityPrefs } from '@/data/mock/types';

type Props = { prefs: AvailabilityPrefs };

export function AvailabilitySummaryCard({ prefs }: Props) {
  const onTrack =
    prefs.totalAvailableHoursPerWeek >= prefs.targetMinHours &&
    prefs.totalAvailableHoursPerWeek <= prefs.targetMaxHours;
  const progress = prefs.totalAvailableHoursPerWeek / prefs.targetMaxHours;

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <AppText variant="metadata" color="rgba(255,255,255,0.8)" style={styles.eyebrow}>
          Total Available
        </AppText>
        <View style={styles.valueRow}>
          <AppText variant="displayXl" color={palette.onPrimary}>
            {prefs.totalAvailableHoursPerWeek}
          </AppText>
          <AppText variant="bodyMd" color="rgba(255,255,255,0.8)">
            hrs/wk
          </AppText>
        </View>
      </View>
      <View style={styles.right}>
        <AppText variant="metadata" color="rgba(255,255,255,0.8)">
          Target: {prefs.targetMinHours}-{prefs.targetMaxHours} hrs
        </AppText>
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} color="#ffffff" trackColor="rgba(0,0,0,0.2)" height={8} />
        </View>
        <AppText variant="caption" color={palette.onPrimary}>
          {onTrack ? 'On Track' : 'Adjust hours'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  left: { gap: spacing.base },
  eyebrow: { textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.base },
  right: { alignItems: 'flex-end', gap: spacing.base, minWidth: 110 },
  progressWrap: { width: 96 },
});
