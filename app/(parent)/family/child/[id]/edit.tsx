import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../../../src/theme/tokens';
import { ChevronLeft, Save, Shield, TrendingUp } from 'lucide-react-native';
import { getChildById, updateChild } from '../../../src/modules/parent-controls';
import { ChildProfile, SafetyTier, SAFETY_TIERS, INDEPENDENCE_LEVELS } from '../../../../../src/types/family';

export default function EditChildScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [safetyTier, setSafetyTier] = useState<SafetyTier>('moderate');
  const [independenceLevel, setIndependenceLevel] = useState(2);

  useEffect(() => {
    loadChild();
  }, [id]);

  async function loadChild() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    const data = await getChildById(id);
    if (data) {
      setChild(data);
      setFirstName(data.first_name);
      setLastName(data.last_name || '');
      setNickname(data.nickname || '');
      setSafetyTier(data.safety_tier);
      setIndependenceLevel(data.independence_level);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!child) return;
    if (!firstName.trim()) {
      Alert.alert('Name Required', 'Please enter a first name');
      return;
    }

    setSaving(true);
    const success = await updateChild(child.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      nickname: nickname.trim() || undefined,
      safety_tier: safetyTier,
      independence_level: independenceLevel,
    });

    if (success) {
      Alert.alert('Saved!', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
    setSaving(false);
  }

  if (loading || !child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const currentTier = SAFETY_TIERS[safetyTier];
  const currentLevel = INDEPENDENCE_LEVELS.find(l => l.level === independenceLevel);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Save size={20} color={saving ? colors.charcoal : colors.mint} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor={colors.charcoal + '80'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name (optional)"
              placeholderTextColor={colors.charcoal + '80'}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nickname</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter nickname (optional)"
              placeholderTextColor={colors.charcoal + '80'}
            />
          </View>
        </View>

        {/* Safety Tier */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.purple} />
            <Text style={styles.sectionTitle}>Safety Tier</Text>
          </View>
          <Text style={styles.sectionSubtitle}>{currentTier.description}</Text>

          <View style={styles.tierOptions}>
            {(Object.keys(SAFETY_TIERS) as SafetyTier[]).map((tier) => {
              const tierInfo = SAFETY_TIERS[tier];
              const isSelected = safetyTier === tier;
              
              return (
                <Pressable
                  key={tier}
                  style={[
                    styles.tierOption,
                    isSelected && {
                      backgroundColor: tierInfo.color + '20',
                      borderColor: tierInfo.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSafetyTier(tier)}
                >
                  <View style={[styles.tierDot, { backgroundColor: tierInfo.color }]} />
                  <View style={styles.tierInfo}>
                    <Text style={[styles.tierLabel, isSelected && { fontWeight: '700' }]}>
                      {tierInfo.label}
                    </Text>
                    <Text style={styles.tierDescription}>{tierInfo.description}</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.tierCheck, { backgroundColor: tierInfo.color }]}>
                      <Text style={styles.tierCheckText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Independence Level */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.mint} />
            <Text style={styles.sectionTitle}>Independence Level</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Level {independenceLevel} - {currentLevel?.label}
          </Text>
          <Text style={styles.levelDescription}>{currentLevel?.description}</Text>

          <View style={styles.levelSlider}>
            {INDEPENDENCE_LEVELS.map((level) => (
              <Pressable
                key={level.level}
                style={[
                  styles.levelOption,
                  independenceLevel === level.level && styles.levelOptionActive,
                ]}
                onPress={() => setIndependenceLevel(level.level)}
              >
                <Text
                  style={[
                    styles.levelNumber,
                    independenceLevel === level.level && styles.levelNumberActive,
                  ]}
                >
                  {level.level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveButtonLarge, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
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
  saveButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  field: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    fontSize: 16,
    color: colors.black,
  },
  tierOptions: {
    gap: spacing[3],
  },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 16,
    color: colors.black,
    marginBottom: 2,
  },
  tierDescription: {
    fontSize: 13,
    color: colors.charcoal,
  },
  tierCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierCheckText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  levelDescription: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  levelSlider: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  levelOption: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelOptionActive: {
    backgroundColor: colors.mint + '20',
    borderColor: colors.mint,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  levelNumberActive: {
    color: colors.mint,
  },
  actions: {
    padding: spacing[6],
    gap: spacing[3],
  },
  saveButtonLarge: {
    backgroundColor: colors.purple,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
});
