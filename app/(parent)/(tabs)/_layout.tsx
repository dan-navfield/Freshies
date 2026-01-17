import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomTabBar } from '../../../src/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: 'Learn',
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
          }}
        />
        <Tabs.Screen
          name="routine"
          options={{
            title: 'Routines',
          }}
        />
        <Tabs.Screen
          name="shelf"
          options={{
            title: 'My Shelf',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            href: null, // Hide History from tab bar if we want to replace it, or keep it if we want to try to fit it.
            // For now, let's keep it but I'll hide it IN THE CUSTOM TAB BAR logic if needed, or just let it exist.
            // Actually, setting href: null hides it from the tab bar automatically in expo-router usually, 
            // but my CustomTabBar filters by href !== null.
            // I will set href: null to "History" to "archive" it from the main bar for now in favor of Shelf.
          }}
        />
      </Tabs>
    </>
  );
}
