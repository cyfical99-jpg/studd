import RNSlider from '@react-native-community/slider';
import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

type Props = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  /** Formats the value shown top-right, e.g. `(v) => `${v}h`` */
  formatValue: (value: number) => string;
  minLabel: string;
  maxLabel: string;
};

/** Slider with a label/value header and min/max captions, matching the
 * "Maximum Weekly Hours" / "Maximum Commute" mockups. */
export function LabeledSlider({
  label,
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step = 1,
  formatValue,
  minLabel,
  maxLabel,
}: Props) {
  return (
    <View>
      <View style={styles.header}>
        <AppText variant="sectionSm" color={palette.onSurface}>
          {label}
        </AppText>
        <AppText variant="headlineLgMobile" color={palette.primary}>
          {formatValue(value)}
        </AppText>
      </View>
      <RNSlider
        style={styles.slider}
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor={palette.primary}
        maximumTrackTintColor={palette.surfaceContainerHighest}
        thumbTintColor={palette.primary}
      />
      <View style={styles.captions}>
        <AppText variant="metadata" color={palette.onSurfaceVariant}>
          {minLabel}
        </AppText>
        <AppText variant="metadata" color={palette.onSurfaceVariant}>
          {maxLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: spacing.xs,
  },
  captions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
});
