import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, FileText, Shield } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import TermsOfService from './terms-of-service';
import PrivacyPolicy from './privacy-policy';

export default function TermsAcceptance() {
  const router = useRouter();
  const { user } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      Alert.alert(
        'Please Review',
        'You must read and accept both the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    setLoading(true);
    try {
      // Update user profile to mark terms as accepted
      const { error } = await supabase
        .from('profiles')
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Navigate to the appropriate next screen based on user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', user?.id)
        .single();

      if (profile?.role === 'child' && profile?.onboarding_completed) {
        router.replace('/(child)/welcome-splash');
      } else if (profile?.role === 'parent' && profile?.onboarding_completed) {
        router.replace('/(parent)/(tabs)');
      } else if (profile?.role === 'child' && !profile?.onboarding_completed) {
        router.replace('/(onboarding)/child-welcome');
      } else if (profile?.role === 'parent' && !profile?.onboarding_completed) {
        router.replace('/(onboarding)/parent-welcome');
      } else {
        router.replace('/(onboarding)/role-select');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
      console.error('Error accepting terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const CheckBox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
    <TouchableOpacity style={styles.checkbox} onPress={onPress}>
      <View style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
        {checked && <Check size={16} color={colors.white} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={40} color={colors.purple} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Welcome to Freshies!</Text>
          <Text style={styles.subtitle}>
            Before we begin, please review and accept our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Terms Cards */}
        <View style={styles.cardsContainer}>
          {/* Terms of Service Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FileText size={24} color={colors.purple} />
              <Text style={styles.cardTitle}>Terms of Service</Text>
            </View>
            <Text style={styles.cardDescription}>
              Our terms explain how you can use Freshies, what we provide, and your responsibilities as a user.
            </Text>
            <TouchableOpacity
              style={styles.readButton}
              onPress={() => setShowTerms(true)}
            >
              <Text style={styles.readButtonText}>Read Terms</Text>
            </TouchableOpacity>
            <View style={styles.acceptRow}>
              <CheckBox
                checked={termsAccepted}
                onPress={() => setTermsAccepted(!termsAccepted)}
              />
              <Text style={styles.acceptText}>
                I have read and accept the Terms of Service
              </Text>
            </View>
          </View>

          {/* Privacy Policy Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Shield size={24} color={colors.mint} />
              <Text style={styles.cardTitle}>Privacy Policy</Text>
            </View>
            <Text style={styles.cardDescription}>
              Learn how we collect, use, and protect your personal information, especially for children's accounts.
            </Text>
            <TouchableOpacity
              style={[styles.readButton, styles.readButtonPrivacy]}
              onPress={() => setShowPrivacy(true)}
            >
              <Text style={styles.readButtonText}>Read Privacy Policy</Text>
            </TouchableOpacity>
            <View style={styles.acceptRow}>
              <CheckBox
                checked={privacyAccepted}
                onPress={() => setPrivacyAccepted(!privacyAccepted)}
              />
              <Text style={styles.acceptText}>
                I have read and accept the Privacy Policy
              </Text>
            </View>
          </View>
        </View>


      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Footer Messages */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            🔒 Your data is protected under Australian privacy laws
          </Text>
          <Text style={styles.footerText}>
            👨‍👩‍👧‍👦 Parent consent required for users under 13
          </Text>
          <Text style={styles.footerText}>
            ⚕️ Not medical advice - consult healthcare professionals
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!termsAccepted || !privacyAccepted) && styles.continueButtonDisabled,
            loading && styles.continueButtonLoading,
          ]}
          onPress={handleAccept}
          disabled={!termsAccepted || !privacyAccepted || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Processing...' : 'Continue to Freshies'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <TermsOfService onClose={() => {
          setShowTerms(false);
          setTermsAccepted(true);
        }} />
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <PrivacyPolicy onClose={() => {
          setShowPrivacy(false);
          setPrivacyAccepted(true);
        }} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[3],
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginLeft: spacing[2],
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: spacing[3],
  },
  readButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    paddingVertical: spacing[2] + 4,
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  readButtonPrivacy: {
    backgroundColor: colors.mint,
  },
  readButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: spacing[2],
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  acceptText: {
    flex: 1,
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
  bottomSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],  // Nice space from bottom
    paddingTop: spacing[2],
  },
  continueButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[4],  // Space between messages and button
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonLoading: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],  // Small space after messages
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
    textAlign: 'center',
  },
});
