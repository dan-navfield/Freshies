import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Mail, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// Brand Icons
const AppleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </Svg>
);

const MetaIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 36 36">
    <Path fill="#0866FF" d="M20.04 36C9.01 36 0 27.99 0 16.96S9 0 20.04 0c1.46 0 2.88.16 4.24.46 8.42 1.85 14.72 9.21 14.72 17.99 0 .46-.02.91-.05 1.36C38.3 28.96 30.07 36 20.04 36z" />
    <Path fill="#FFF" d="M27.54 23.35l.86-5.63h-5.4v-3.66c0-1.54.75-3.04 3.17-3.04h2.45V6.24s-2.23-.38-4.35-.38c-4.44 0-7.34 2.69-7.34 7.56v4.28h-4.93v5.63h4.93V36c.99.16 2 .24 3.04.24s2.05-.08 3.04-.24V23.35h4.53z" />
  </Svg>
);

export default function LoginScreen() {
  // Pre-fill with test credentials in development
  const [email, setEmail] = useState(__DEV__ ? 'childtest@test.com' : '');
  const [password, setPassword] = useState(__DEV__ ? 'TestPassword123!' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshSession } = useAuth();

  const handleEmailLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    let mounted = true;
    setLoading(true);

    // Timeout safety
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        Alert.alert('Connection Timeout', 'The server is taking too long to respond. Please check your internet connection.');
      }
    }, 10000);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) throw error;
      if (!mounted) return;

      console.log('Login successful:', data);

      // Refresh session to get user profile
      await refreshSession();

      // Get user profile to determine routing
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, terms_accepted, privacy_accepted')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile during login:', profileError);
        // Fallback or retry? For now, let's treat it as non-fatal if we can route to home,
        // but strictly logic depends on role. If profile missing, maybe onboarding?
      }

      clearTimeout(timeoutId);
      if (!mounted) return;

      // Check if terms need to be accepted first
      if (!profile?.terms_accepted || !profile?.privacy_accepted) {
        router.replace('/(auth)/terms-acceptance');
      } else if (profile?.role === 'child' && profile?.onboarding_completed) {
        router.replace('/(child)/welcome-splash');
      } else if (profile?.role === 'parent' && profile?.onboarding_completed) {
        router.replace('/(tabs)');
      } else if (profile?.role === 'child' && !profile?.onboarding_completed) {
        router.replace('/(onboarding)/child-welcome');
      } else if (profile?.role === 'parent' && !profile?.onboarding_completed) {
        router.replace('/(onboarding)/parent-welcome');
      } else {
        router.replace('/(onboarding)/role-select');
      }
    } catch (error: any) {
      if (mounted) Alert.alert('Error', error.message);
    } finally {
      if (mounted) setLoading(false);
      clearTimeout(timeoutId);
      mounted = false; // Cleanup effectively
    }
  };

  const handleAppleLogin = async () => {
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

        // Refresh session and handle navigation
        await refreshSession();

        // Get user profile to determine routing
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed, terms_accepted, privacy_accepted')
          .eq('id', data.user.id)
          .single();

        // Check if terms need to be accepted first
        if (!profile?.terms_accepted || !profile?.privacy_accepted) {
          router.replace('/(auth)/terms-acceptance');
        } else if (profile?.role === 'child' && profile?.onboarding_completed) {
          router.replace('/(child)/welcome-splash');
        } else if (profile?.role === 'parent' && profile?.onboarding_completed) {
          router.replace('/(tabs)');
        } else if (profile?.role === 'child' && !profile?.onboarding_completed) {
          router.replace('/(onboarding)/child-welcome');
        } else if (profile?.role === 'parent' && !profile?.onboarding_completed) {
          router.replace('/(onboarding)/parent-welcome');
        } else {
          router.replace('/(onboarding)/role-select');
        }
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

  const handleGoogleLogin = async () => {
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

  const handleMetaLogin = async () => {
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
          Welcome back
        </Text>
        <Text style={styles.subtitle}>
          Sign in to continue your skincare journey.
        </Text>
      </View>

      {/* Social Sign In */}
      <View style={styles.socialSection}>
        <TouchableOpacity
          onPress={handleAppleLogin}
          disabled={loading}
          style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
        >
          <AppleIcon />
          <Text style={styles.socialButtonText}>
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled]}
        >
          <GoogleIcon />
          <Text style={[styles.socialButtonText, styles.googleButtonText]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMetaLogin}
          disabled={loading}
          style={[styles.socialButton, styles.googleButton, loading && styles.buttonDisabled, { marginBottom: 0 }]}
        >
          <MetaIcon />
          <Text style={[styles.socialButtonText, styles.googleButtonText]}>
            Continue with Meta
          </Text>
        </TouchableOpacity>
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
          Email Address
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
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        <Text style={[styles.label, { marginTop: spacing[4] }]}>
          Password
        </Text>
        <View style={styles.input}>
          <TextInput
            style={[styles.textInput, { flex: 1 }]}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: spacing[2] }}>
            {showPassword ? (
              <EyeOff color="#6B7280" size={20} />
            ) : (
              <Eye color="#6B7280" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          onPress={handleEmailLogin}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/(auth)/signup" asChild>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Link>
        </Text>
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
  backButton: {
    marginBottom: spacing[8],
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
    marginBottom: spacing[8],
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
    marginBottom: spacing[8],
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
    marginBottom: spacing[8],
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
  buttonSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
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
});

