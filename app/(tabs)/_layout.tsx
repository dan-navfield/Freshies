import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
