import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ChildProfileProvider } from '../src/contexts/ChildProfileContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ChildProfileProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ChildProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
