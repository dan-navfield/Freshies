import 'react-native-gesture-handler';
import '../src/lib/notifications-polyfill';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ChildProfileProvider } from '../src/contexts/ChildProfileContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Configure expo-router to ignore style files and API routes
export const unstable_settings = {
  initialRouteName: '(auth)',
  ignore: [
    '**/*-styles.tsx',
    '**/api/**/*.ts',
    '**/api/**/*.tsx'
  ]
};

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
