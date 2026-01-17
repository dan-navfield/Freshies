import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Heart, Shield, Sparkles } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ChildWelcomeScreen() {
  const { signOut } = useAuth();
  
  const handleContinue = () => {
    router.push('/(onboarding)/child-profile');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.title}>
          Hi there! 👋
        </Text>
        <Text style={styles.subtitle}>
          We'll help you get set up with your family.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.mintIcon]}>
            <Heart color="#B8E6D5" size={28} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Learn About Your Skin
            </Text>
            <Text style={styles.featureDescription}>
              Discover fun facts and tips about keeping your skin healthy and happy
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.yellowIcon]}>
            <Sparkles color="#FFD93D" size={28} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Build Your Routine
            </Text>
            <Text style={styles.featureDescription}>
              Create your own skincare routine with help from your family
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, styles.purpleIcon]}>
            <Shield color="#8B7AB8" size={28} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Stay Safe
            </Text>
            <Text style={styles.featureDescription}>
              Your parent or guardian will help keep your information private and safe
            </Text>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Let's Start
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            ← Back to Login
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
  hero: {
    paddingHorizontal: spacing[6],
    paddingTop: 80,
    paddingBottom: spacing[8],
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  subtitle: {
    fontSize: 20,
    color: colors.charcoal,
    lineHeight: 30,
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
  mintIcon: {
    backgroundColor: 'rgba(184, 230, 213, 0.2)',
  },
  yellowIcon: {
    backgroundColor: 'rgba(255, 217, 61, 0.2)',
  },
  purpleIcon: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  featureDescription: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  button: {
    backgroundColor: colors.mint,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
  },
  buttonText: {
    color: colors.black,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: spacing[3],
    marginTop: spacing[3],
  },
  backButtonText: {
    color: colors.mint,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
