import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Child-only routes layout
 * Uses a single Stack navigator for all child routes
 * Tab navigation is handled by the (tabs) group within this stack
 */
export default function ChildLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: '#000' }
        }}
      >
        {/* Main tab navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Nested route groups - these have their own _layout.tsx */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="learn" options={{ headerShown: false }} />
        
        {/* Standalone screens */}
        <Stack.Screen name="welcome-splash" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
        <Stack.Screen name="skin-profile" options={{ headerShown: false }} />
        <Stack.Screen name="avatar-selector" options={{ headerShown: false }} />
        <Stack.Screen name="achievements-enhanced" options={{ headerShown: false }} />
        <Stack.Screen name="freshie-gallery" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="safety" options={{ headerShown: false }} />
        <Stack.Screen name="routine-builder-enhanced" options={{ headerShown: false }} />
        <Stack.Screen name="routines" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
