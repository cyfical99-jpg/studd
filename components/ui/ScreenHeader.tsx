import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/Icon';

type Props = {
  title: string;
  rightSlot?: React.ReactNode;
};

/** Shared translucent top bar ("Stud" wordmark + screen title + avatar)
 * reused across every tab-root screen in the mockups. The avatar opens the
 * shared account screen (sign out, etc.) — neither the employee nor manager
 * tab bar has room for a dedicated settings tab. */
export function ScreenHeader({ title, rightSlot }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* The mockups show this screen title only at tablet+ widths ("hidden
          sm:block") — on a phone the wordmark + bottom-tab label already
          say where you are, so we keep it for screen readers only. */}
      <View style={styles.row} accessibilityRole="header" accessibilityLabel={title}>
        <AppText variant="headlineLgMobile" color={palette.primary}>
          Stud
        </AppText>
        {rightSlot ?? (
          <Pressable onPress={() => router.push('/account')} hitSlop={8}>
            <View style={styles.avatar}>
              <Icon name="person" size={18} color={palette.onPrimary} />
            </View>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.surfaceContainerHighest,
  },
  row: {
    height: 56,
    paddingHorizontal: spacing.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
