import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon, IconName } from '@/components/Icon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

type Props = {
  title: string;
  icon: IconName;
  note: string;
};

/** Placeholder for tabs not yet built in this pass (Schedule, Work) — keeps
 * the 5-tab nav complete and navigable without faking finished screens. */
export function ComingSoonScreen({ title, icon, note }: Props) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title={title} />
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Icon name={icon} size={32} color={palette.primary} />
        </View>
        <AppText variant="sectionSm" color={palette.onSurface}>
          {title}
        </AppText>
        <AppText variant="bodyMd" color={palette.onSurfaceVariant} style={styles.note}>
          {note}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.marginMobile,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  note: {
    textAlign: 'center',
  },
});
