import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Camera, Sparkles, BookOpen } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import FreshiesLogo from '../../assets/logo/freshies-logo-main-colours-responsive.svg';
import { useAuth } from '../../src/contexts/AuthContext';
import TermsOfService from './terms-of-service';
import PrivacyPolicy from './privacy-policy';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, user, userRole, onboardingCompleted, loading } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // No auto-redirect - login screen handles routing directly
  // This screen is only for non-authenticated users

  // Show welcome screen for non-authenticated users
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full Screen Image Background */}
      <ImageBackground
        source={require('../../assets/images/welcome-skincare.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Gradient overlay for better text readability */}
        <View style={styles.overlay} />

        {/* Content Container */}
        <View style={styles.content}>
          {/* Hero Text */}
          <View style={styles.heroSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <FreshiesLogo
                width={180}
                height={60}
              />
            </View>
            <Text style={styles.tagline}>
              SKINCARE MADE FOR YOU
            </Text>
            <Text style={styles.heroText}>
              Your family's journey to healthier, glowing skin starts here
            </Text>
          </View>

          {/* Feature List */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Camera color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.featureText}>
                Scan products instantly to check ingredients
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Sparkles color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.featureText}>
                Build personalized skincare routines
              </Text>
            </View>

            <View style={[styles.featureItem, { marginBottom: 0 }]}>
              <BookOpen color="#FFFFFF" size={20} strokeWidth={2.5} />
              <Text style={styles.featureText}>
                Learn about ingredients and skin health
              </Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  Get Started
                </Text>
              </TouchableOpacity>
            </Link>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  I Already Have an Account
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Terms Footer */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink} onPress={() => setShowTerms(true)}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.termsLink} onPress={() => setShowPrivacy(true)}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ImageBackground>

      {/* Terms Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <TermsOfService onClose={() => setShowTerms(false)} />
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[6],
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: spacing[6],
  },
  tagline: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing[3],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  featureList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  featureText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: spacing[3],
    flex: 1,
  },
  buttonContainer: {
    marginBottom: spacing[6],
  },
  primaryButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  primaryButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
  },
  secondaryButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing[4],
  },
  termsLink: {
    color: colors.white,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
