import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── ENV ── Replace with your actual Supabase project values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'your-anon-key';

// True when real credentials are configured (not placeholder values)
const isSupabaseConfigured =
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key');

// SSR-safe storage adapter: Expo web SSR runs in Node.js where `window` is
// undefined, so AsyncStorage.getItem() crashes. Guard each method.
const ssrSafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── AUTH HELPERS ────────────────────────────────────────────────────────

/**
 * Send a 6-digit OTP to the given email address via Supabase Auth.
 * Free, built-in — no third-party SMS gateway required.
 */
export async function sendEmailOTP(emailAddress: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('[DEV] Supabase not configured — skipping email OTP send. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: emailAddress,
    options: { shouldCreateUser: true },
  });

  if (error) throw error;
}

/**
 * Verify the 6-digit OTP received via email.
 */
export async function verifyEmailOTP(emailAddress: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: emailAddress,
    token,
    type: 'email',
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out and clear session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session (useful for app boot check).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
