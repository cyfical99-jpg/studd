import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii } from '@/constants/theme';

type Props = {
  /** 0-1. Values above 1 are clamped (visually shows a full bar). */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
};

export function ProgressBar({ progress, color = palette.primary, trackColor = palette.surfaceContainerHighest, height = 8 }: Props) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.full,
  },
  fill: {
    height: '100%',
  },
});
