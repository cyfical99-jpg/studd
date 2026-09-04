import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon, IconName } from '@/components/Icon';

type Props = {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export function MenuRow({ icon, iconBackground, iconColor, title, subtitle, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ gap: 2 }}>
          <AppText variant="bodyMd" color={palette.onSurface}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color={palette.onSurfaceVariant}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
      <Icon name="chevron_right" size={20} color={palette.outlineVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.xl,
  },
  pressed: {
    backgroundColor: palette.surfaceContainerLow,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
