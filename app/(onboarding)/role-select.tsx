import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Users, Baby } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function RoleSelectScreen() {
  const [loading, setLoading] = useState(false);
  const { user, userRole, onboardingCompleted, refreshSession } = useAuth();

  // No auto-redirect - login screen handles routing directly

  const handleRoleSelect = async (role: 'parent' | 'child') => {
    if (!user) return;

    setLoading(true);
    try {
      // Create or update profile with role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: role,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Refresh session to get updated role
      await refreshSession();

      // Navigate to appropriate onboarding
      if (role === 'parent') {
        router.replace('/(onboarding)/parent-welcome');
      } else {
        router.replace('/(onboarding)/child-welcome');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Welcome!
        </Text>
        <Text style={styles.subtitle}>
          Let's personalize your experience. Are you setting up Freshies for yourself or your child?
        </Text>
      </View>

      {/* Role Cards */}
      <View style={styles.cardsContainer}>
        {/* Parent Option */}
        <TouchableOpacity
          onPress={() => handleRoleSelect('parent')}
          disabled={loading}
          style={[styles.card, styles.parentCard]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.parentIconContainer}>
              <Users color="#8B7AB8" size={32} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>
                I'm a Parent
              </Text>
              <Text style={[styles.cardBadge, styles.parentBadge]}>
                Recommended for adults
              </Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Create and manage your family's skincare routines, scan products, and track everyone's progress together.
          </Text>
        </TouchableOpacity>

        {/* Child Option */}
        <TouchableOpacity
          onPress={() => handleRoleSelect('child')}
          disabled={loading}
          style={[styles.card, styles.childCard]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.childIconContainer}>
              <Baby color="#B8E6D5" size={32} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>
                I'm a Child
              </Text>
              <Text style={[styles.cardBadge, styles.childBadge]}>
                For younger users
              </Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Join your family's skincare journey with a safe, guided experience designed just for you.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>Note:</Text> If you're under 13, you'll need a parent or guardian to approve your account before you can start using Freshies.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: 64,
    paddingBottom: spacing[8],
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: 18,
    color: colors.charcoal,
    lineHeight: 28,
  },
  cardsContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[6],
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing[4],
  },
  parentCard: {
    borderColor: colors.purple,
  },
  childCard: {
    borderColor: colors.mint,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  parentIconContainer: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[3],
    marginRight: spacing[4],
  },
  childIconContainer: {
    backgroundColor: 'rgba(184, 230, 213, 0.2)',
    borderRadius: radii.lg,
    padding: spacing[3],
    marginRight: spacing[4],
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  cardBadge: {
    fontSize: 14,
    fontWeight: '600',
  },
  parentBadge: {
    color: colors.purple,
  },
  childBadge: {
    color: colors.mint,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  infoBox: {
    backgroundColor: 'rgba(255, 223, 185, 0.2)',
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  infoText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  infoTextBold: {
    fontWeight: '600',
  },
});
