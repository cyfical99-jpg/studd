import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon, IconName } from '@/components/Icon';

type Variant = 'primary' | 'secondary';
/** 'lg' = full-width primary CTAs (Continue, Save…), 'md' = paired
 * half-width buttons (Confirm Shift / View Details) — mirrors the mockups'
 * own `text-section-sm` vs `text-caption` button label sizing. */
type Size = 'lg' | 'md';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  fullWidth?: boolean;
};

/** Primary/secondary pill button matching the Stitch mockups' CTA style. */
export function Button({ label, variant = 'primary', size = 'lg', icon, fullWidth = true, style, ...rest }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        size === 'md' && styles.baseMd,
        isPrimary ? styles.primary : styles.secondary,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}>
      <View style={styles.content}>
        <AppText
          variant={size === 'lg' ? 'sectionSm' : 'caption'}
          color={isPrimary ? palette.onPrimary : palette.primary}
          numberOfLines={1}>
          {label}
        </AppText>
        {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} color={isPrimary ? palette.onPrimary : palette.primary} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  baseMd: {
    height: 44,
    paddingHorizontal: 12,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: palette.primary,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  secondary: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
