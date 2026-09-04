import { StyleSheet, View, ViewProps } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';

type Surface = 'container' | 'containerLow' | 'containerHigh' | 'lowest';

type Props = ViewProps & {
  surface?: Surface;
  padded?: boolean;
  shadow?: boolean;
};

const surfaceColor: Record<Surface, string> = {
  container: palette.surfaceContainer,
  containerLow: palette.surfaceContainerLow,
  containerHigh: palette.surfaceContainerHigh,
  lowest: palette.surfaceContainerLowest,
};

/** Generic rounded surface container used throughout the Stitch mockups. */
export function Card({ surface = 'container', padded = true, shadow = true, style, ...rest }: Props) {
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: surfaceColor[surface] },
        padded && styles.padded,
        shadow && styles.shadow,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.md,
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
});
