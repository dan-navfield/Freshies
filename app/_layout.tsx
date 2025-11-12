import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    // Add any root-level initialisation here later (Sentry, PostHog, etc.)
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
