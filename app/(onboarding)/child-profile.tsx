import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { User, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, radii } from '../../src/theme/tokens';

export default function ChildProfileScreen() {
  const { user, refreshSession } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name');
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving child profile:', {
        userId: user?.id,
        firstName: firstName.trim()
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)
        .select();

      if (error) throw error;

      console.log('✅ Child profile saved successfully:', data);

      await refreshSession();
      router.push('/(onboarding)/child-dob' as any);
    } catch (error: any) {
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
        <Text style={styles.progress}>Step 1 of 4</Text>
      </View>

      <ScrollView>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          About you
        </Text>
        <Text style={styles.subtitle}>
          Just your name so your family knows it's you.
        </Text>
      </View>

      {/* First Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>
          First Name *
        </Text>
        <View style={styles.input}>
          <User color="#9CA3AF" size={20} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your first name"
            placeholderTextColor="#9CA3AF"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    fontSize: 14,
    color: colors.charcoal,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  inputSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
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
  },
  textInput: {
    flex: 1,
    marginLeft: spacing[3],
    fontSize: 16,
    color: colors.black,
  },
  avatarSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[8],
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
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
  buttonDisabled: {
    opacity: 0.5,
  },
  backSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  backText: {
    color: colors.charcoal,
    textAlign: 'center',
    fontSize: 16,
  },
});
