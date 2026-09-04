import { isSupabaseConfigured } from '@/services/supabaseClient';

/**
 * Auto-detected, not hand-toggled: as soon as EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY are set (see .env.example), the app starts
 * talking to your real Supabase project instead of the on-device local
 * store — no other code changes needed. See supabase/README.md.
 *
 * Currently only services/auth.ts reads this. The data repositories
 * (services/repositories/*) still run local-only regardless — that's the
 * next pass, once auth against a real project is confirmed working.
 */
export const USE_SUPABASE = isSupabaseConfigured;
