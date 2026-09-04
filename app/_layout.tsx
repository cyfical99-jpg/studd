import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the native splash image from auto-hiding before fonts load.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    MaterialSymbolsOutlined: require('../assets/fonts/MaterialSymbolsOutlined.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, initializing } = useAuth();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Owns "/" unconditionally — see app/index.tsx's header comment
            for why this can't be Protected like everything else. It shows
            the brand-intro animation itself while `initializing` is true. */}
        <Stack.Screen name="index" />
        {/* Standalone preview of that same animation — not part of the
            auth-loading flow (see app/splash.tsx). */}
        <Stack.Screen name="splash" />

        <Stack.Protected guard={!initializing && !user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={!initializing && !!user}>
          <Stack.Screen name="notifications" />
          <Stack.Screen name="account" />
        </Stack.Protected>

        <Stack.Protected guard={!initializing && user?.role === 'employee'}>
          <Stack.Screen name="(employee)" />
          <Stack.Screen name="profile-edit" />
          <Stack.Screen name="shift-detail" />
          <Stack.Screen name="time-off-request" />
        </Stack.Protected>

        <Stack.Protected guard={!initializing && user?.role === 'manager'}>
          <Stack.Screen name="(manager)" />
          <Stack.Screen name="roster-generate" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
