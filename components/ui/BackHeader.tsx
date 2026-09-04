import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/Colors';
import { radii, spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/Icon';

type Props = { title: string };

/** Back-button + title header used by screens pushed on top of the tabs
 * (e.g. Edit Profile, shift details) rather than tab roots. */
export function BackHeader({ title }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}>
          <Icon name="arrow_back" size={24} color={palette.onSurface} />
        </Pressable>
        <AppText variant="sectionSm" color={palette.onSurface} numberOfLines={1}>
          {title}
        </AppText>
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
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
