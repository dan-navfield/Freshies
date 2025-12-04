import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CustomTabBar } from '../../components/CustomTabBar';

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
          name="index"
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
            title: 'Routine',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
          }}
        />
      </Tabs>
    </>
  );
}
