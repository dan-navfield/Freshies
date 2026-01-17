import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme/tokens';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Check if we have a token in the URL params (from magic link)
      const token = params.token as string;
      const type = params.type as string;

      if (token && type) {
        // Verify the OTP token from magic link
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any,
        });

        if (error) throw error;
      }

      // Get the session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        // Check for pending invitation code
        const pendingCode = await AsyncStorage.getItem('pendingInvitationCode');
        
        if (pendingCode) {
          // Process invitation code
          try {
            const { data: invitation } = await supabase
              .from('child_invitations')
              .select('*, children(*)')
              .eq('invitation_code', pendingCode)
              .eq('status', 'pending')
              .single();

            if (invitation) {
              const expiresAt = new Date(invitation.expires_at);
              if (expiresAt > new Date()) {
                // Valid code - link device
                const { data: child } = await supabase
                  .from('managed_children')
                  .select('*')
                  .eq('parent_id', invitation.parent_id)
                  .single();

                if (child) {
                  // Update child with user_id
                  await supabase
                    .from('managed_children')
                    .update({ user_id: session.user.id })
                    .eq('id', child.id);

                  // Create device record
                  await supabase
                    .from('child_devices')
                    .insert({
                      child_id: child.id,
                      device_name: Platform.OS === 'ios' ? 'iPhone' : 'Android Phone',
                      device_type: Platform.OS === 'ios' ? 'ios' : 'android',
                      device_id: `device_${Date.now()}`,
                      status: 'linked',
                      last_active: new Date().toISOString(),
                      linked_at: new Date().toISOString(),
                    });

                  // Mark invitation as accepted
                  await supabase
                    .from('child_invitations')
                    .update({ status: 'accepted' })
                    .eq('id', invitation.id);

                  // Clear stored code
                  await AsyncStorage.removeItem('pendingInvitationCode');

                  // Go to main app
                  router.replace('/(tabs)');
                  return;
                }
              }
            }
            // Invalid or expired code - clear it
            await AsyncStorage.removeItem('pendingInvitationCode');
          } catch (error) {
            console.error('Error processing invitation code:', error);
            await AsyncStorage.removeItem('pendingInvitationCode');
          }
        }

        // Check if user is linked to a child profile (either system)
        const { data: managedChild } = await supabase
          .from('managed_children')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const { data: selfRegisteredChild } = await supabase
          .from('child_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (managedChild || selfRegisteredChild) {
          // User is a child with linked device - go to main app
          router.replace('/(tabs)');
          return;
        }

        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.role) {
          // New user - go to role selection
          router.replace('/(onboarding)/role-select' as any);
        } else if (!profile.onboarding_completed) {
          // User has role but hasn't completed onboarding
          if (profile.role === 'parent') {
            router.replace('/(onboarding)/parent-welcome');
          } else {
            router.replace('/(onboarding)/child-welcome');
          }
        } else {
          // User has completed onboarding - go to main app
          router.replace('/(tabs)');
        }
      } else {
        // No session - go back to welcome
        router.replace('/(auth)/welcome');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B7AB8" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.charcoal,
    marginTop: spacing[4],
  },
});
