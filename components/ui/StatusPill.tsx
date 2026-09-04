import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

type Tone = 'primary' | 'tertiary' | 'error' | 'neutral' | 'success';

type Props = {
  label: string;
  tone?: Tone;
  withDot?: boolean;
};

const toneStyle: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: 'rgba(53, 37, 205, 0.1)', fg: palette.primary },
  tertiary: { bg: 'rgba(164, 65, 0, 0.12)', fg: palette.tertiary },
  error: { bg: palette.errorContainer, fg: palette.onErrorContainer },
  neutral: { bg: palette.surfaceContainerHighest, fg: palette.onSurfaceVariant },
  success: { bg: palette.successContainer, fg: palette.success },
};

/** Small rounded status pill (Awaiting / Confirmed / Overtime / etc.). */
export function StatusPill({ label, tone = 'neutral', withDot = false }: Props) {
  const colors = toneStyle[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      {withDot && <View style={[styles.dot, { backgroundColor: colors.fg }]} />}
      <AppText variant="metadata" color={colors.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.base,
    borderRadius: radii.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
});
