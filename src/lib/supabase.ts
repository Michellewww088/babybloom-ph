import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── ENV ── Replace with your actual Supabase project values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── AUTH HELPERS ────────────────────────────────────────────────────────

/**
 * Send OTP to a Philippine mobile number.
 * Formats the number as +63XXXXXXXXXX before sending.
 */
export async function sendPhoneOTP(localNumber: string) {
  // Strip spaces/dashes, ensure starts with 9
  const cleaned = localNumber.replace(/\D/g, '');
  const e164 = `+63${cleaned}`;

  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
  });

  if (error) throw error;
  return e164;
}

/**
 * Verify the OTP received via SMS.
 */
export async function verifyPhoneOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
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
