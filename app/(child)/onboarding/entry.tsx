import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';

/**
 * Child Onboarding Entry Point
 * Determines which onboarding flow to show based on:
 * 1. Parent invitation (age known)
 * 2. Direct signup (need to ask age)
 */
export default function OnboardingEntry() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    determineFlow();
  }, []);

  const determineFlow = async () => {
    // Check if coming from parent invitation
    const invitationToken = params.invitation as string;
    const ageBand = params.age as string;

    if (invitationToken && ageBand) {
      // Parent invitation - age is known
      routeToAgeAppropriateFlow(ageBand);
    } else {
      // Direct signup - need to ask age
      router.replace('/(child)/onboarding/age-select');
    }
  };

  const routeToAgeAppropriateFlow = (ageBand: string) => {
    switch (ageBand) {
      case '0-4':
      case '5-9':
        // Parent-only mode - redirect to parent app
        router.replace('/(parent)/(tabs)/');
        break;
      case '10-12':
        router.replace('/(child)/onboarding/tween/welcome');
        break;
      case '13-15':
        router.replace('/(child)/onboarding/teen/welcome');
        break;
      case '16-18':
        router.replace('/(child)/onboarding/older-teen/welcome');
        break;
      default:
        router.replace('/(child)/onboarding/age-select');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
});
