import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ParentProfileScreen() {
  const { user, refreshSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving profile:', {
        userId: user?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          updated_at: new Date().toISOString(),
          // Don't mark as complete yet - tour comes next
        })
        .eq('id', user?.id)
        .select();

      if (error) throw error;

      console.log('✅ Profile saved successfully:', data);

      await refreshSession();
      router.push('/(onboarding)/parent-tour');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Step 2 of 3
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Tell Us About You
        </Text>
        <Text style={styles.subtitle}>
          Just a few details to personalize your experience
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* First Name */}
        <View>
          <Text style={styles.label}>
            First Name *
          </Text>
          <View style={styles.input}>
            <User color="#6B7280" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your first name"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Last Name */}
        <View style={{ marginTop: spacing[4] }}>
          <Text style={styles.label}>
            Last Name (Optional)
          </Text>
          <View style={styles.input}>
            <User color="#6B7280" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your last name"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✨ <Text style={styles.infoTextBold}>What's Next:</Text> After this, you can create your family community, invite members, and start building skincare routines together.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={handleComplete}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          disabled={loading}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            Go Back
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
  header: {
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
  form: {
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
  infoSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  infoBox: {
    backgroundColor: 'rgba(184, 230, 213, 0.2)',
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  infoText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  infoTextBold: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    paddingVertical: spacing[3],
  },
  backButtonText: {
    color: colors.charcoal,
    textAlign: 'center',
    fontSize: 16,
  },
});
