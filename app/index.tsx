import { View, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useEffect } from 'react';
import { colors } from '../src/theme/tokens';
import { LoadingAnimation } from '../src/components/ui/LoadingAnimation';

export default function Index() {
  const { session, loading, userRole, onboardingCompleted } = useAuth();
  const router = useRouter();

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingAnimation size={200} />
      </View>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (session && userRole) {
    if (userRole === 'child') {
      return <Redirect href="/(child)/(tabs)/home" />;
    } else if (userRole === 'parent') {
      return <Redirect href="/(parent)/(tabs)" />;
    }
  }

  // If not authenticated, go to welcome screen
  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
