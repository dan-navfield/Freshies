import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Mail, Link as LinkIcon } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { colors, spacing, radii } from '../../src/theme/tokens';
import TermsOfService from './terms-of-service';
import PrivacyPolicy from './privacy-policy';

WebBrowser.maybeCompleteAuthSession();

// Brand Icons
const AppleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </Svg>
);

const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </Svg>
);

const MetaIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 36 36">
    <Path fill="#0866FF" d="M20.04 36C9.01 36 0 27.99 0 16.96S9 0 20.04 0c1.46 0 2.88.16 4.24.46 8.42 1.85 14.72 9.21 14.72 17.99 0 .46-.02.91-.05 1.36C38.3 28.96 30.07 36 20.04 36z"/>
    <Path fill="#FFF" d="M27.54 23.35l.86-5.63h-5.4v-3.66c0-1.54.75-3.04 3.17-3.04h2.45V6.24s-2.23-.38-4.35-.38c-4.44 0-7.34 2.69-7.34 7.56v4.28h-4.93v5.63h4.93V36c.99.16 2 .24 3.04.24s2.05-.08 3.04-.24V23.35h4.53z"/>
  </Svg>
);

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [showSocialLogins, setShowSocialLogins] = useState(true);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleEmailSignup = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Store invitation code if provided
      if (invitationCode.trim()) {
        await AsyncStorage.setItem('pendingInvitationCode', invitationCode.trim());
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: 'freshies://auth/callback',
        },
      });

      if (error) throw error;

      Alert.alert(
        'Check your email',
        'We\'ve sent you a magic link to continue. Tap the link in your email to sign in.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setLoading(true);
    try {
      // Use native Apple Sign-In on iOS
      if (Platform.OS === 'ios') {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        // Sign in with Supabase using the Apple credential
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken!,
        });

        if (error) throw error;

        console.log('Apple Sign-In successful:', data);
        // Navigation will be handled by auth state listener
      } else {
        // Fallback to web OAuth for non-iOS platforms
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: 'freshies://auth/callback',
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;
        
        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            'freshies://auth/callback'
          );
          
          if (result.type === 'success') {
            console.log('OAuth success');
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in
        console.log('Apple Sign-In canceled');
      } else {
        Alert.alert('Error', error.message || 'Failed to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'freshies://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'freshies://auth/callback'
        );
        
        if (result.type === 'success') {
          console.log('OAuth success');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSignup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'freshies://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'freshies://auth/callback'
        );
        
        if (result.type === 'success') {
          console.log('OAuth success');
        }
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#1A1A1A" size={28} />
        </TouchableOpacity>

        <Text style={styles.title}>
          Create Account
        </Text>
        <Text style={styles.subtitle}>
          Join Freshies and start your skincare journey
        </Text>
      </View>

      {/* Invitation Code Button */}
      <View style={styles.inviteButtonSection}>
        {!showCodeInput ? (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowCodeInput(true)}
          >
            <LinkIcon size={18} color={colors.black} />
            <Text style={styles.inviteButtonText}>Have an invitation code?</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>Enter Invitation Code</Text>
            <View style={styles.inviteInputContainer}>
              <TextInput
                style={styles.inviteInput}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                value={invitationCode}
                onChangeText={(text) => setInvitationCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>
            <Text style={styles.inviteHelper}>
              For children linking their device to a parent account
            </Text>
            <TouchableOpacity
              style={styles.inviteCloseButton}
              onPress={() => {
                setShowCodeInput(false);
                setInvitationCode('');
              }}
            >
              <Text style={styles.inviteCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Social Sign In - Collapsible */}
      <View style={styles.socialSection}>
        <TouchableOpacity 
          style={styles.socialToggle}
          onPress={() => setShowSocialLogins(!showSocialLogins)}
        >
          <Text style={styles.socialToggleText}>Sign up with social accounts</Text>
          <Text style={styles.socialToggleArrow}>{showSocialLogins ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {showSocialLogins && (
          <>
        <TouchableOpacity
          onPress={handleAppleSignup}
          disabled={loading}
          style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
        >
          <AppleIcon />
          <Text style={styles.socialButtonText}>
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoogleSignup}
          disabled={loading}
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
        >
          <GoogleIcon />
          <Text style={[styles.socialButtonText, styles.googleButtonText]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMetaSignup}
          disabled={loading}
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled, { marginBottom: 0 }]}
        >
          <MetaIcon />
          <Text style={[styles.socialButtonText, styles.googleButtonText]}>
            Continue with Meta
          </Text>
        </TouchableOpacity>
          </>
        )}
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email Sign In */}
      <View style={styles.formSection}>
        <Text style={styles.label}>
          Sign up with Email Address
        </Text>
        <View style={styles.input}>
          <Mail color="#6B7280" size={20} />
          <TextInput
            style={styles.textInput}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={styles.helperText}>
          We'll send you a magic link to sign in securely
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          onPress={handleEmailSignup}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Sending...' : 'Continue with Email'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink}>Sign In</Text>
          </Link>
        </Text>

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.footerLink} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
        </Text>
      </View>
      
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
    paddingBottom: spacing[4],
  },
  backButton: {
    marginBottom: spacing[8],
  },
  inviteSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  inviteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  inviteInputContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.purple + '40',
    borderStyle: 'dashed',
  },
  inviteInput: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    fontSize: 24,
    fontWeight: '700',
    color: colors.purple,
    textAlign: 'center',
  },
  inviteHelper: {
    fontSize: 12,
    color: colors.charcoal,
    marginTop: spacing[2],
    lineHeight: 18,
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
  },
  socialSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  socialToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginBottom: spacing[3],
  },
  socialToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  socialToggleArrow: {
    fontSize: 12,
    color: colors.charcoal,
  },
  inviteButtonSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: '#91CBD4',
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  inviteCloseButton: {
    marginTop: spacing[3],
    alignItems: 'center',
  },
  inviteCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  socialButton: {
    borderRadius: radii.pill,
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  appleButton: {
    backgroundColor: colors.black,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  socialButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  googleButtonText: {
    color: colors.black,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dividerContainer: {
    paddingHorizontal: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: spacing[4],
    color: colors.charcoal,
    fontSize: 14,
  },
  formSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    marginLeft: spacing[3],
    fontSize: 16,
    color: colors.black,
  },
  helperText: {
    fontSize: 12,
    color: colors.charcoal,
    marginTop: spacing[2],
    lineHeight: 18,
  },
  buttonSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
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
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  footerText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.purple,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[3],
    lineHeight: 18,
  },
});
