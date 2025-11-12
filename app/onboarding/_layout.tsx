import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="parent-setup" />
      <Stack.Screen name="child-setup" />
    </Stack>
  );
}
