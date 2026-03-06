import '../src/i18n';
import { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { initialRouteName: '(tabs)' };

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Tracks whether we've already done the initial navigation decision.
  // Prevents background Supabase token-refreshes from re-triggering the
  // auth guard and redirecting away from screens like /welcome mid-animation.
  const hasNavigated = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (fontError) throw fontError; }, [fontError]);
  useEffect(() => { if (loaded && session !== undefined) SplashScreen.hideAsync(); }, [loaded, session]);

  useEffect(() => {
    if (session === undefined) return;

    // Only run the routing decision once per app session.
    // Subsequent auth state changes (token refreshes, etc.) are ignored so
    // they don't interrupt screens like /welcome that appear mid-flow.
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // No session → go to login
    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    // Session exists — dev mode: skip Supabase check, go to dashboard
    if (!isSupabaseConfigured) {
      router.replace('/(tabs)');
      return;
    }

    // Session exists — check whether onboarding is complete
    (async () => {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        // Network / table missing — fail open to dashboard so users aren't locked out
        router.replace('/(tabs)');
      }
    })();
  }, [session]);

  if (!loaded || session === undefined) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="child-profile"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="welcome"
          options={{ presentation: 'card', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
    </>
  );
}
