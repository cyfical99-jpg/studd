import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon, IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

type Props = {
  icon: IconName;
  label: string;
  value: string;
  /** e.g. "/ 24" or "+12% vs last wk" */
  caption: string;
  captionColor?: string;
  progress?: number;
};

export function StatCard({ icon, label, value, caption, captionColor, progress }: Props) {
  return (
    <Card style={styles.card}>
      <View>
        <Icon name={icon} size={22} color={palette.primary} style={styles.icon} />
        <AppText variant="metadata" color={palette.onSurfaceVariant} style={styles.label}>
          {label}
        </AppText>
        <AppText variant="sectionSm" color={palette.onSurface}>
          {value}
        </AppText>
      </View>
      {progress !== undefined ? (
        <View style={styles.progressBlock}>
          <ProgressBar progress={progress} />
          <AppText variant="metadata" color={captionColor ?? palette.primary} style={styles.captionSpacing}>
            {caption}
          </AppText>
        </View>
      ) : (
        <View style={styles.trendRow}>
          <AppText variant="metadata" color={captionColor ?? palette.primary}>
            {caption}
          </AppText>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  progressBlock: {
    marginTop: spacing.sm,
    gap: spacing.base,
  },
  captionSpacing: {
    marginTop: 2,
  },
  trendRow: {
    marginTop: spacing.sm,
  },
});
