import { Stack } from 'expo-router';

/**
 * Shared routes layout
 * These screens are accessible to both parent and child users
 */
export default function SharedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
