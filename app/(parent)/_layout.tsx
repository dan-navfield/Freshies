import { Stack } from 'expo-router';

/**
 * Parent-only routes layout
 * These screens are only accessible to users with 'parent' role
 */
export default function ParentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
