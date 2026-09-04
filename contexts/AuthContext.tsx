import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import * as authService from '@/services/auth';
import type { PublicUser } from '@/services/auth';
import { checkAndEscalateOverdueShifts } from '@/services/repositories/shiftsRepo';
import { ensureNotificationPermission, registerForPushTokenAsync } from '@/services/notifications';
import type { Role } from '@/services/types';

/** Client-side stand-in for a server cron (see services/notifications.ts) —
 * run the overdue-confirmation sweep once per session start rather than on
 * every render. */
function runEscalationSweep() {
  checkAndEscalateOverdueShifts().catch(() => {});
}

/** Best-effort: ask for notification permission and grab a push token for
 * this device. There's no backend yet to hand the token to (see
 * services/notifications.ts), so it's just logged — wire it up to your
 * server once Phase 4 is live. */
function primeNotifications() {
  ensureNotificationPermission()
    .then((granted) => (granted ? registerForPushTokenAsync() : null))
    .then((token) => {
      if (token && __DEV__) console.log('Expo push token (send this to your backend once one exists):', token);
    })
    .catch(() => {});
}

type AuthState = {
  user: PublicUser | null;
  /** True until the initial session check finishes — gates the router so
   * we never flash a login screen for an already-signed-in user. */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; name: string; role: Role }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the current session's user (e.g. after an avatar/profile edit
   * elsewhere) so screens reading `user` from context pick up the change. */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // A tiny minimum delay so the animated splash (app/splash.tsx) doesn't
    // just flash for a frame when the session check resolves instantly.
    const minDelay = new Promise((resolve) => setTimeout(resolve, 900));
    Promise.all([authService.getSession(), minDelay]).then(([session]) => {
      setUser(session);
      setInitializing(false);
      if (session) {
        runEscalationSweep();
        primeNotifications();
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authService.signIn(email, password);
    setUser(session);
    runEscalationSweep();
    primeNotifications();
  }, []);

  const signUp = useCallback(
    async (params: { email: string; password: string; name: string; role: Role }) => {
      const session = await authService.signUp(params);
      setUser(session);
    },
    []
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const session = await authService.getSession();
    setUser(session);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
