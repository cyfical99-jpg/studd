import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { SplashContent } from '@/components/SplashContent';

/**
 * The one file that owns the bare "/" path. Every other screen lives under
 * a named segment ((auth)/login, (employee)/(tabs)/home, etc.) specifically
 * so this is the ONLY thing "/" can structurally resolve to — without it,
 * a cold launch (or a browser hitting "/" directly) resolves "/" against
 * the raw file tree before `Stack.Protected`'s guards ever get a say, which
 * can land on a hidden/guarded screen instead of falling through correctly.
 * (That's a real bug this file fixes, not just a web quirk — a native cold
 * launch goes through this exact same initial resolution.)
 */
export default function RootIndexRedirect() {
  const { user, initializing } = useAuth();

  if (initializing) return <SplashContent />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'manager') return <Redirect href="/(manager)/(tabs)/roster" />;
  return <Redirect href="/(employee)/(tabs)/home" />;
}
