import { Redirect } from 'expo-router';

/**
 * Root index — immediately redirects to the auth flow.
 * The RootLayout (_layout.tsx) then decides: login vs dashboard.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
