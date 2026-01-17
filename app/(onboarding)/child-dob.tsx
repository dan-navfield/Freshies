import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, radii } from '../../src/theme/tokens';

const PARENT_AGE_THRESHOLD = 18; // Years

export default function ChildDOBScreen() {
  const { user, refreshSession } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleContinue = async () => {
    const age = calculateAge(dateOfBirth);

    // Check if they're actually a parent age
    if (age >= PARENT_AGE_THRESHOLD) {
      Alert.alert(
        'Oops!',
        'It looks like you might be a parent or guardian. Let\'s set you up with a parent account instead.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(onboarding)/parent-welcome' as any),
          },
        ]
      );
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving date of birth:', {
        userId: user?.id,
        dob: dateOfBirth.toISOString().split('T')[0],
        age
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)
        .select();

      if (error) throw error;

      console.log('✅ Date of birth saved successfully:', data);

      await refreshSession();
      router.push('/(onboarding)/child-connect' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={colors.charcoal} size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 2 of 4</Text>
      </View>

      <ScrollView>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          When's your birthday?
        </Text>
        <Text style={styles.subtitle}>
          We use this to keep your account safe and make sure a parent approves it.
        </Text>
      </View>

      {/* Date Picker */}
      <View style={styles.dateSection}>
        <Text style={styles.label}>
          Date of Birth *
        </Text>
        
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={styles.datePicker}
        >
          <View style={styles.dateContent}>
            <Calendar color="#9CA3AF" size={20} />
            <Text style={styles.dateText}>
              {formatDate(dateOfBirth)}
            </Text>
          </View>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDateOfBirth(selectedDate);
              }
            }}
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
          />
        )}
      </View>

      {/* Info Box */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Don't worry - we keep your birthday private. Only your parent or guardian can see it.
          </Text>
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
  container: { flex: 1, backgroundColor: colors.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[6], paddingTop: spacing[4], paddingBottom: spacing[2] },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  progress: { fontSize: 14, color: colors.charcoal, fontWeight: '600' },
  titleSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  title: { fontSize: 36, fontWeight: '700', color: colors.black, marginBottom: spacing[3] },
  subtitle: { fontSize: 16, color: colors.charcoal, lineHeight: 24 },
  dateSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  label: { fontSize: 14, fontWeight: '600', color: colors.black, marginBottom: spacing[2] },
  datePicker: { backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateText: { marginLeft: spacing[3], fontSize: 16, color: colors.black },
  infoSection: { paddingHorizontal: spacing[6], marginBottom: spacing[8] },
  infoBox: { backgroundColor: 'rgba(184, 230, 213, 0.3)', borderRadius: radii.lg, padding: spacing[4] },
  infoText: { fontSize: 14, color: colors.charcoal, lineHeight: 22 },
  buttonSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  button: { backgroundColor: colors.mint, borderRadius: radii.pill, paddingVertical: spacing[4] },
  buttonText: { color: colors.black, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  backSection: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
  backText: { color: colors.charcoal, textAlign: 'center', fontSize: 16 },
});
