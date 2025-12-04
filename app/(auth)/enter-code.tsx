import { View, Text, TextInput, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { Link as LinkIcon, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';

export default function EnterCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!code.trim()) {
      Alert.alert('Code Required', 'Please enter your 6-digit invitation code');
      return;
    }

    if (code.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Invitation code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      // Find invitation by code
      const { data: invitation, error: inviteError } = await supabase
        .from('child_invitations')
        .select('*')
        .eq('invitation_code', code.trim())
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        Alert.alert('Invalid Code', 'This invitation code is not valid or has expired');
        setLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt < new Date()) {
        Alert.alert('Code Expired', 'This invitation code has expired. Please ask your parent for a new one.');
        setLoading(false);
        return;
      }

      // Get the child info
      const { data: child } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', invitation.parent_id)
        .single();

      if (!child) {
        Alert.alert('Error', 'Could not find child profile');
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please sign in first');
        setLoading(false);
        return;
      }

      // Update child with user_id
      await supabase
        .from('children')
        .update({ user_id: user.id })
        .eq('id', child.id);

      // Create device record
      const { error: deviceError } = await supabase
        .from('child_devices')
        .insert({
          child_id: child.id,
          device_name: Platform.OS === 'ios' ? 'iPhone' : 'Android Phone',
          device_type: Platform.OS === 'ios' ? 'ios' : 'android',
          device_id: `device_${Date.now()}`, // In production, use actual device ID
          status: 'linked',
          last_active: new Date().toISOString(),
          linked_at: new Date().toISOString(),
        });

      if (deviceError) throw deviceError;

      // Mark invitation as accepted
      await supabase
        .from('child_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      // Success! Navigate to main app
      Alert.alert(
        'Device Linked!',
        `Welcome ${child.first_name}! Your device is now connected.`,
        [
          {
            text: 'Get Started',
            onPress: () => {
              // Navigate to main app (tabs)
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error linking device:', error);
      Alert.alert('Error', 'Failed to link device. Please try again.');
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={colors.black} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LinkIcon size={40} color={colors.purple} />
          </View>
          <Text style={styles.title}>Enter Invitation Code</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code your parent shared with you to link your device
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            placeholderTextColor={colors.charcoal + '60'}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textAlign="center"
          />
          <Text style={styles.helperText}>
            Ask your parent to generate a code in their Freshies app
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Linking Device...' : 'Link Device'}
          </Text>
        </Pressable>

        {/* Help */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpText}>
            • Make sure you're using the latest code{'\n'}
            • Codes expire after 7 days{'\n'}
            • Ask your parent to generate a new code if needed
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
  },
  backButton: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: spacing[6],
  },
  codeInput: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[6],
    fontSize: 48,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 16,
    borderWidth: 3,
    borderColor: colors.purple + '40',
    borderStyle: 'dashed',
  },
  helperText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[3],
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    padding: spacing[5],
    marginBottom: spacing[8],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  helpSection: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  helpText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
});
