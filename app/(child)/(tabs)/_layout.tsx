import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../../src/components/CustomTabBar';

/**
 * Tab Navigator for main app screens
 * Wrapped by Stack navigator in parent (child)/_layout.tsx
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Learn' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="routine" options={{ title: 'Routines' }} />
      <Tabs.Screen name="shelf" options={{ title: 'My Shelf' }} />
      <Tabs.Screen
        name="learn"
        options={{
          href: null, // Hide from tabs - accessed via favorites
        }}
      />
    </Tabs>
  );
}
