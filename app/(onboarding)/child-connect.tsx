import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserPlus, Key, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildConnectScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const inviteCode = params.invite as string;
  const parentName = params.parentName as string;

  const [joinCode, setJoinCode] = useState(inviteCode || '');
  const [loading, setLoading] = useState(false);

  // If arriving via invite link
  const isInviteLink = !!inviteCode && !!parentName;

  const handleSendRequest = async () => {
    if (!joinCode.trim() && !isInviteLink) {
      Alert.alert('Required', 'Please enter a join code from your parent');
      return;
    }

    setLoading(true);
    try {
      const code = (joinCode || inviteCode).trim().toUpperCase();
      
      console.log('🔗 Looking up invitation code:', code);

      // Look up the invitation by code (allow both pending and accepted)
      const { data: invitation, error: inviteError } = await supabase
        .from('child_invitations')
        .select('*')
        .eq('invite_code', code)
        .in('status', ['pending', 'accepted'])
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invitation) {
        Alert.alert('Invalid Code', 'This invitation code is invalid or has expired.');
        return;
      }

      console.log('✅ Found invitation:', invitation);

      // Find or create household for this parent
      let householdId;
      const { data: existingHousehold } = await supabase
        .from('households')
        .select('id')
        .eq('primary_parent_id', invitation.parent_id)
        .single();

      if (existingHousehold) {
        householdId = existingHousehold.id;
      } else {
        // Create household for parent
        const { data: newHousehold, error: householdError } = await supabase
          .from('households')
          .insert({
            name: 'Family',
            primary_parent_id: invitation.parent_id,
          })
          .select('id')
          .single();

        if (householdError) throw householdError;
        householdId = newHousehold.id;
      }

      // Check if child is already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', householdId)
        .eq('user_id', user?.id)
        .single();

      // Only add if not already a member
      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('household_members')
          .insert({
            household_id: householdId,
            user_id: user?.id,
            role: 'child',
            status: 'active',
            joined_at: new Date().toISOString(),
          });

        if (memberError) throw memberError;
      }

      // Update invitation status
      await supabase
        .from('child_invitations')
        .update({
          status: 'accepted',
          child_id: user?.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      console.log('✅ Connection successful! Proceeding to onboarding...');

      // Since the connection is accepted, go to the tween onboarding
      router.push('/(child)/onboarding/tween/welcome' as any);
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={colors.charcoal} size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 3 of 4</Text>
      </View>

      <ScrollView>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          Connect with your parent
        </Text>
        {isInviteLink ? (
          <Text style={styles.subtitle}>
            You're joining {parentName}'s family.
          </Text>
        ) : (
          <Text style={styles.subtitle}>
            Ask your parent or guardian for a join code.
          </Text>
        )}
      </View>

      {isInviteLink ? (
        /* Invite Link Flow */
        <View style={styles.inviteSection}>
          <View style={styles.inviteCard}>
            <View style={styles.inviteIcon}>
              <UserPlus color="#B8E6D5" size={32} />
            </View>
            <Text style={styles.inviteTitle}>
              You're Joining {parentName}'s Family
            </Text>
            <Text style={styles.inviteText}>
              Your parent will approve your account. It usually takes a moment.
            </Text>
          </View>
        </View>
      ) : (
        /* Manual Join Flow */
        <>
          <View style={styles.inputSection}>
            <Text style={styles.label}>
              Join Code
            </Text>
            <View style={styles.codeInputContainer}>
              <Key color="#40E0D0" size={28} />
              <TextInput
                style={styles.codeInput}
                placeholder="XXXXXX"
                placeholderTextColor="#CBD5E1"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Don't have a code? Ask your parent to send you a join link from their Freshies app.
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        {/* Submit Code Button - only show if they entered a code */}
        {joinCode.trim() && (
          <TouchableOpacity
            onPress={handleSendRequest}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connecting...' : 'Connect with Code'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Request Code Button - only show if no code entered */}
        {!joinCode.trim() && (
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Request Code',
              'Ask your parent to send you an invitation link from their Freshies app.',
              [{ text: 'OK' }]
            )}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
              Request Code from Parent
            </Text>
          </TouchableOpacity>
        )}

        {/* Skip Button */}
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/child-pending' as any)}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[2] },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  progress: { fontSize: 14, color: colors.charcoal, fontWeight: '600' },
  titleSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  title: { fontSize: 36, fontWeight: '700', color: colors.black, marginBottom: spacing[3] },
  subtitle: { fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  inviteSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  inviteCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing[6] },
  inviteIcon: { backgroundColor: 'rgba(184, 230, 213, 0.2)', borderRadius: radii.pill, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4] },
  inviteTitle: { fontSize: 20, fontWeight: '700', color: colors.black, marginBottom: spacing[2] },
  inviteText: { fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  inputSection: { paddingHorizontal: spacing[6], marginBottom: spacing[6] },
  label: { fontSize: 16, fontWeight: '700', color: colors.black, marginBottom: spacing[3], letterSpacing: 0.5 },
  codeInputContainer: { 
    backgroundColor: colors.white, 
    borderRadius: radii.xl, 
    paddingHorizontal: spacing[5], 
    paddingVertical: spacing[5], 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#40E0D0',
    shadowColor: '#40E0D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  codeInput: { 
    flex: 1, 
    marginLeft: spacing[4], 
    fontSize: 32, 
    fontWeight: '700',
    color: colors.black,
    letterSpacing: 4,
  },
  input: { backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[4], flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, marginLeft: spacing[3], fontSize: 16, color: colors.black },
  infoSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  infoBox: { backgroundColor: 'rgba(255, 217, 61, 0.2)', borderRadius: radii.lg, padding: spacing[4] },
  infoText: { fontSize: 14, color: colors.charcoal, lineHeight: 22 },
  buttonSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[6], gap: spacing[3] },
  button: { backgroundColor: '#40E0D0', borderRadius: radii.pill, paddingVertical: spacing[4] },
  buttonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  buttonSecondary: { backgroundColor: '#40E0D0', borderWidth: 2, borderColor: '#40E0D0' },
  buttonSecondaryText: { color: colors.black },
  skipButton: { paddingVertical: spacing[3] },
  skipButtonText: { color: colors.charcoal, textAlign: 'center', fontSize: 16 },
  backSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
  backText: { color: colors.charcoal, textAlign: 'center', fontSize: 16 },
});
