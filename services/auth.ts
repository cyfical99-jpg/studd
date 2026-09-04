import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { demoHash } from '@/services/demoHash';
import { getAll, newId, upsert } from '@/services/localStore';
import { seedUsers } from '@/services/seedData';
import { USE_SUPABASE } from '@/services/config';
import { supabase } from '@/services/supabaseClient';
import type { Role, UserAccount } from '@/services/types';

/**
 * Two implementations behind one interface (`signIn`/`signUp`/`signOut`/
 * `getSession` — the whole surface every screen touches via useAuth()):
 *
 *  - Local (default): sessions and (hashed, non-production-grade — see
 *    demoHash.ts) credentials live in this device's AsyncStorage/SecureStore.
 *    Works immediately, no backend required.
 *  - Supabase (once EXPO_PUBLIC_SUPABASE_URL/ANON_KEY are set — see
 *    services/config.ts and supabase/README.md): real accounts, real
 *    sessions, shared across devices.
 *
 * Which one runs is decided once, automatically, by `USE_SUPABASE`.
 */

const SESSION_KEY = 'stud_session_v1';
const USERS_COLLECTION = 'users';

export type PublicUser = Omit<UserAccount, 'passwordHash'>;

function toPublic(user: UserAccount): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

// ---- Local implementation ------------------------------------------

// expo-secure-store has no web implementation at all (throws at runtime) —
// the app targets Android/iOS only, but this keeps `expo start --web` from
// hard-crashing during development. AsyncStorage's web storage isn't
// encrypted the way SecureStore is on-device, which is moot here anyway
// since demoHash.ts isn't a real password hash either.
const localSession = {
  set: (value: string) => (Platform.OS === 'web' ? setWeb(value) : SecureStore.setItemAsync(SESSION_KEY, value)),
  get: (): Promise<string | null> => (Platform.OS === 'web' ? getWeb() : SecureStore.getItemAsync(SESSION_KEY)),
  clear: () => (Platform.OS === 'web' ? setWeb(null) : SecureStore.deleteItemAsync(SESSION_KEY)),
};

function setWeb(value: string | null): Promise<void> {
  try {
    if (value === null) globalThis.localStorage?.removeItem(SESSION_KEY);
    else globalThis.localStorage?.setItem(SESSION_KEY, value);
  } catch {
    // ignore (e.g. SSR)
  }
  return Promise.resolve();
}
function getWeb(): Promise<string | null> {
  try {
    return Promise.resolve(globalThis.localStorage?.getItem(SESSION_KEY) ?? null);
  } catch {
    return Promise.resolve(null);
  }
}

async function getLocalUsers(): Promise<UserAccount[]> {
  return getAll<UserAccount>(USERS_COLLECTION, seedUsers);
}

async function localSignIn(email: string, password: string): Promise<PublicUser> {
  const users = await getLocalUsers();
  const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!match || match.passwordHash !== demoHash(password)) {
    throw new Error('Incorrect email or password.');
  }
  await localSession.set(match.id);
  return toPublic(match);
}

async function localSignUp(params: { email: string; password: string; name: string; role: Role }): Promise<PublicUser> {
  const email = params.email.trim().toLowerCase();
  if (!email || !params.password || !params.name.trim()) {
    throw new Error('Please fill in every field.');
  }
  const users = await getLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    throw new Error('An account with that email already exists.');
  }
  const user: UserAccount = {
    id: newId('user'),
    email,
    passwordHash: demoHash(params.password),
    name: params.name.trim(),
    role: params.role,
    createdAt: new Date().toISOString(),
  };
  await upsert<UserAccount>(USERS_COLLECTION, seedUsers, user);
  await localSession.set(user.id);
  return toPublic(user);
}

async function localSignOut(): Promise<void> {
  await localSession.clear();
}

async function localGetSession(): Promise<PublicUser | null> {
  const userId = await localSession.get();
  if (!userId) return null;
  const users = await getLocalUsers();
  const match = users.find((u) => u.id === userId);
  return match ? toPublic(match) : null;
}

// ---- Supabase implementation ------------------------------------------

type ProfileRow = { id: string; email: string; name: string; role: Role; created_at: string };

function profileToPublic(row: ProfileRow): PublicUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.created_at };
}

async function fetchProfile(userId: string): Promise<PublicUser> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new Error(error?.message ?? 'Could not load profile.');
  return profileToPublic(data as ProfileRow);
}

async function supabaseSignIn(email: string, password: string): Promise<PublicUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) throw new Error(error?.message ?? 'Incorrect email or password.');
  return fetchProfile(data.user.id);
}

async function supabaseSignUp(params: { email: string; password: string; name: string; role: Role }): Promise<PublicUser> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: { data: { name: params.name.trim(), role: params.role } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Check your email to confirm your account, then log in.');
  // The `handle_new_user` trigger (see supabase/migrations/0001_init.sql)
  // inserts the profiles row synchronously within the signUp transaction.
  return fetchProfile(data.user.id);
}

async function supabaseSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function supabaseGetSession(): Promise<PublicUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return fetchProfile(data.session.user.id);
}

// ---- Public surface — picks one implementation, once -------------------

export const signIn = USE_SUPABASE ? supabaseSignIn : localSignIn;
export const signUp = USE_SUPABASE ? supabaseSignUp : localSignUp;
export const signOut = USE_SUPABASE ? supabaseSignOut : localSignOut;
export const getSession = USE_SUPABASE ? supabaseGetSession : localGetSession;
