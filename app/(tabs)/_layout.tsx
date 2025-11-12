import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const screenOptions = {
  headerShown: false as const,
};

export default function TabsLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="routine" options={{ title: 'Routine' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}
