import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon, IconName } from '@/components/Icon';

type Props = {
  title: string;
  description: string;
  icon: IconName;
  iconBackgroundColor: string;
  iconColor: string;
  selected: boolean;
  onPress: () => void;
};

/** Role/option picker card with a selection ring + checkmark badge. */
export function SelectableCard({
  title,
  description,
  icon,
  iconBackgroundColor,
  iconColor,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && { opacity: 0.9 },
      ]}>
      <View
        style={[
          styles.badge,
          selected ? styles.badgeSelected : styles.badgeUnselected,
        ]}>
        {selected && <Icon name="check" size={16} color={palette.onPrimary} />}
      </View>

      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: iconBackgroundColor }]}>
          <Icon name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.textColumn}>
          <AppText variant="sectionSm" color={palette.onSurface}>
            {title}
          </AppText>
          <AppText variant="bodyMd" color={palette.onSurfaceVariant} style={styles.description}>
            {description}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: palette.surfaceContainer,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: palette.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeSelected: {
    backgroundColor: palette.primary,
  },
  badgeUnselected: {
    borderWidth: 2,
    borderColor: palette.outlineVariant,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingRight: spacing.lg, // keep text clear of the badge
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: spacing.base,
  },
  description: {
    opacity: 0.9,
  },
});
