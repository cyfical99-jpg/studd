import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Reads from EXPO_PUBLIC_* env vars — that prefix is required for Expo to
 * inline them into the client bundle (see .env.example). Both are unset by
 * default, which is how services/config.ts decides whether to run against
 * this or the local-only store.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

/**
 * Only ever call this after checking `isSupabaseConfigured` — it throws if
 * the env vars aren't set, rather than silently building a client that will
 * fail every request.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : (null as unknown as ReturnType<typeof createClient>);
