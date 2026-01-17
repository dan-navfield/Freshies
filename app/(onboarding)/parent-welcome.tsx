import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Sparkles, Users, Camera, BookOpen } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ParentWelcomeScreen() {
  const { user, refreshSession } = useAuth();

  const handleContinue = () => {
    router.replace('/(onboarding)/parent-profile');
  };

  const handleSkip = async () => {
    // Mark onboarding as complete and go straight to app
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      await refreshSession();
      router.replace('/(parent)/(tabs)');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Step 1 of 3
        </Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.title}>
          Great Choice!
        </Text>
        <Text style={styles.subtitle}>
          As a parent, you'll have full control over your family's skincare journey. Here's what you can do:
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.purpleIcon]}>
            <Users color="#8B7AB8" size={24} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Create Your Family Community
            </Text>
            <Text style={styles.featureDescription}>
              Invite family members and manage everyone's profiles in one place
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.mintIcon]}>
            <Camera color="#B8E6D5" size={24} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Scan & Approve Products
            </Text>
            <Text style={styles.featureDescription}>
              Check ingredients instantly and decide what's safe for your family
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.yellowIcon]}>
            <Sparkles color="#FFD93D" size={24} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Build Custom Routines
            </Text>
            <Text style={styles.featureDescription}>
              Create personalized skincare routines for each family member
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.lilacIcon]}>
            <BookOpen color="#C8B8DB" size={24} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Learn Together
            </Text>
            <Text style={styles.featureDescription}>
              Access expert guides and educational content for the whole family
            </Text>
          </View>
        </View>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacySection}>
        <View style={styles.privacyBox}>
          <Text style={styles.privacyText}>
            <Text style={styles.privacyTextBold}>Your Privacy Matters:</Text> You'll have full control over what information is shared and can manage permissions for child accounts at any time.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Continue Setup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>
            Skip for now - Start scanning
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  progress: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
  },
  progressText: {
    fontSize: 14,
    color: colors.charcoal,
  },
  hero: {
    paddingHorizontal: spacing[6],
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
  features: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
    gap: spacing[4],
  },
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  iconContainer: {
    borderRadius: radii.md,
    padding: spacing[3],
    marginRight: spacing[4],
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
  lilacIcon: {
    backgroundColor: 'rgba(200, 184, 219, 0.2)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  featureDescription: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  privacySection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  privacyBox: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  privacyText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  privacyTextBold: {
    fontWeight: '600',
  },
  buttons: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
  },
  primaryButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: spacing[3],
  },
  skipButtonText: {
    color: colors.charcoal,
    textAlign: 'center',
    fontSize: 16,
  },
});
