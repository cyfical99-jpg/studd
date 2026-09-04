import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/Icon';

const BAR_TRACK_WIDTH = 200;
const BAR_FILL_WIDTH = 80;

/**
 * Animated brand intro, shown by app/index.tsx for exactly as long as the
 * session check in AuthContext takes (also directly previewable at
 * app/splash.tsx, standalone — see that file).
 */
export function SplashContent() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(300, [
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(barSlide, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barTranslate = barSlide.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_TRACK_WIDTH, BAR_TRACK_WIDTH],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoCircle, { opacity: logoOpacity }]}>
        <Icon name="work" size={40} color={palette.primary} />
      </Animated.View>

      <Animated.View style={{ opacity: titleOpacity }}>
        <AppText variant="headlineLgMobile" color={palette.onSurface}>
          Stud
        </AppText>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity }}>
        <AppText variant="bodyMd" color={palette.onSurfaceVariant}>
          Work around your life.
        </AppText>
      </Animated.View>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { transform: [{ translateX: barTranslate }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(53, 37, 205, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  barTrack: {
    width: BAR_TRACK_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.surfaceContainerHighest,
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  barFill: {
    width: BAR_FILL_WIDTH,
    height: '100%',
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
});
