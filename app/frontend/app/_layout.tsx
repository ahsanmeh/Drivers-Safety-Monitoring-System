import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth-context';
import { AlertsProvider } from '../lib/AlertsContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AlertsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* index -> Redirects to /face-login */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          {/* face-login -> camera-based auth */}
          <Stack.Screen name="face-login" options={{ headerShown: false }} />
          {/* main tabs after successful auth */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AlertsProvider>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
