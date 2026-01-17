import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PartyPopper, Sparkles } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ParentSuccessScreen() {
  const { user, refreshSession } = useAuth();
  const [completing, setCompleting] = useState(false);

  // Mark onboarding as complete
  useEffect(() => {
    const completeOnboarding = async () => {
      if (!user) return;
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        if (error) throw error;
        await refreshSession();
      } catch (error) {
        console.error('Error completing onboarding:', error);
      }
    };

    completeOnboarding();
  }, [user]);

  const handleContinue = async () => {
    setCompleting(true);
    // Small delay for UX
    setTimeout(() => {
      router.replace('/(parent)/(tabs)');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <PartyPopper color="#8B7AB8" size={64} />
        </View>

        {/* Headline */}
        <Text style={styles.title}>
          You're All Set!
        </Text>

        {/* Subtext */}
        <Text style={styles.subtitle}>
          Your family space is ready. Invite your kids or start exploring.
        </Text>

        {/* Features Preview */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.purpleIcon]}>
              <Sparkles color="#8B7AB8" size={20} />
            </View>
            <Text style={styles.featureText}>
              Scan your first product
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.mintIcon]}>
              <Sparkles color="#B8E6D5" size={20} />
            </View>
            <Text style={styles.featureText}>
              Create a routine
            </Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.yellowIcon]}>
              <Sparkles color="#FFD93D" size={20} />
            </View>
            <Text style={styles.featureText}>
              Invite family members
            </Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={completing}
          style={[styles.button, completing && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {completing ? 'Loading...' : 'Go to Dashboard'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.pill,
    padding: spacing[8],
    marginBottom: spacing[6],
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  subtitle: {
    fontSize: 18,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing[12],
    paddingHorizontal: spacing[4],
  },
  features: {
    width: '100%',
    gap: spacing[3],
    marginBottom: spacing[12],
  },
  featureItem: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    borderRadius: radii.md,
    padding: spacing[2],
    marginRight: spacing[3],
  },
  purpleIcon: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
  },
  mintIcon: {
    backgroundColor: 'rgba(184, 230, 213, 0.2)',
  },
  yellowIcon: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  buttonContainer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  button: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
