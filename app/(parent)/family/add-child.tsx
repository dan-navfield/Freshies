import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ChevronLeft, Calendar, Shield } from 'lucide-react-native';
import { addChild } from '../../../src/modules/parent-controls';
import { SafetyTier, SAFETY_TIERS, INDEPENDENCE_LEVELS } from '../../../src/types/family';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddChildScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [safetyTier, setSafetyTier] = useState<SafetyTier>('moderate');
  const [independenceLevel, setIndependenceLevel] = useState(2);
  const [loading, setLoading] = useState(false);

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async () => {
    if (!firstName || !user?.id) return;

    setLoading(true);
    const child = await addChild(user.id, {
      first_name: firstName,
      last_name: lastName || undefined,
      nickname: nickname || undefined,
      date_of_birth: dateOfBirth.toISOString().split('T')[0],
      safety_tier: safetyTier,
      independence_level: independenceLevel,
    });

    setLoading(false);

    if (child) {
      router.back();
    }
  };

  const age = calculateAge(dateOfBirth);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Add a Child</Text>
        <View style={styles.backButton} />
      </View>

      {/* Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor={colors.charcoal}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name (optional)"
            placeholderTextColor={colors.charcoal}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="What do you call them? (optional)"
            placeholderTextColor={colors.charcoal}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth *</Text>
          <Pressable 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={colors.purple} />
            <Text style={styles.dateText}>
              {dateOfBirth.toLocaleDateString()} ({age} years old)
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
              maximumDate={new Date()}
              minimumDate={new Date(2005, 0, 1)}
            />
          )}
        </View>
      </View>

      {/* Safety Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Settings</Text>
        <Text style={styles.sectionDescription}>
          Choose how strictly you want to monitor their product choices
        </Text>

        {(Object.keys(SAFETY_TIERS) as SafetyTier[]).map((tier) => {
          const settings = SAFETY_TIERS[tier];
          return (
            <Pressable
              key={tier}
              style={[
                styles.optionCard,
                safetyTier === tier && styles.optionCardSelected
              ]}
              onPress={() => setSafetyTier(tier)}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.radio, safetyTier === tier && styles.radioSelected]}>
                  {safetyTier === tier && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{settings.label}</Text>
                  <Text style={styles.optionDescription}>{settings.description}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Independence Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Independence Level</Text>
        <Text style={styles.sectionDescription}>
          How much can they do without your approval?
        </Text>

        {INDEPENDENCE_LEVELS.map((level) => (
          <Pressable
            key={level.level}
            style={[
              styles.optionCard,
              independenceLevel === level.level && styles.optionCardSelected
            ]}
            onPress={() => setIndependenceLevel(level.level)}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.radio, independenceLevel === level.level && styles.radioSelected]}>
                {independenceLevel === level.level && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionContent}>
                <View style={styles.levelHeader}>
                  <Text style={styles.optionTitle}>{level.label}</Text>
                  <Text style={styles.ageRange}>{level.typical_age_range}</Text>
                </View>
                <Text style={styles.optionDescription}>{level.description}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Submit Button */}
      <View style={styles.section}>
        <Pressable
          style={[styles.submitButton, (!firstName || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!firstName || loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Child'}
          </Text>
        </Pressable>
        
        <Text style={styles.helpText}>
          You can adjust these settings anytime from their profile
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing[4],
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
    gap: spacing[3],
  },
  dateText: {
    fontSize: 16,
    color: colors.black,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.mist,
  },
  optionCardSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  optionHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.purple,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.purple,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.charcoal,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ageRange: {
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    padding: spacing[5],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  helpText: {
    fontSize: 13,
    color: colors.charcoal,
    textAlign: 'center',
  },
});
