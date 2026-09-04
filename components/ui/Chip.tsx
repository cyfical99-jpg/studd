import { Pressable, StyleSheet } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon, IconName } from '@/components/Icon';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
};

/** Toggleable pill chip (role preferences, morning/afternoon/evening, etc.). */
export function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: selected ? 'rgba(79, 70, 229, 0.12)' : palette.surfaceContainer },
        pressed && { opacity: 0.85 },
      ]}>
      <Icon name={icon ?? (selected ? 'check' : 'add')} size={18} color={selected ? palette.primary : palette.onSurfaceVariant} />
      <AppText variant="caption" color={selected ? palette.primary : palette.onSurface}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
});
