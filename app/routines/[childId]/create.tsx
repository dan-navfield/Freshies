import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Sun, Moon, Sparkles, Clock } from 'lucide-react-native';
import { supabase } from '../../../src/lib/supabase';

type RoutineType = 'morning' | 'evening' | 'custom';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routineType, setRoutineType] = useState<RoutineType>('custom');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!childId || typeof childId !== 'string') return;
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a routine name');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('child_routines')
        .insert({
          child_id: childId,
          name: name.trim(),
          description: description.trim() || null,
          routine_type: routineType,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? `${reminderTime}:00` : null,
          enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success!', 'Routine created successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine');
    }
    setCreating(false);
  }

  const getTypeIcon = (type: RoutineType) => {
    switch (type) {
      case 'morning':
        return <Sun size={24} color={routineType === type ? colors.white : colors.orange} />;
      case 'evening':
        return <Moon size={24} color={routineType === type ? colors.white : colors.purple} />;
      case 'custom':
        return <Sparkles size={24} color={routineType === type ? colors.white : colors.mint} />;
    }
  };

  const getTypeColor = (type: RoutineType) => {
    switch (type) {
      case 'morning':
        return colors.orange;
      case 'evening':
        return colors.purple;
      case 'custom':
        return colors.mint;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>New Routine</Text>
          <Text style={styles.heroSubtitle}>
            Create a custom routine to help stay organized
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Routine Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Routine Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Bedtime Routine"
              placeholderTextColor={colors.charcoal + '80'}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description..."
              placeholderTextColor={colors.charcoal + '80'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {/* Routine Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Routine Type</Text>
            <View style={styles.typeOptions}>
              <Pressable
                style={[
                  styles.typeOption,
                  routineType === 'morning' && {
                    backgroundColor: colors.orange,
                    borderColor: colors.orange,
                  },
                ]}
                onPress={() => setRoutineType('morning')}
              >
                {getTypeIcon('morning')}
                <Text
                  style={[
                    styles.typeOptionText,
                    routineType === 'morning' && { color: colors.white },
                  ]}
                >
                  Morning
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeOption,
                  routineType === 'evening' && {
                    backgroundColor: colors.purple,
                    borderColor: colors.purple,
                  },
                ]}
                onPress={() => setRoutineType('evening')}
              >
                {getTypeIcon('evening')}
                <Text
                  style={[
                    styles.typeOptionText,
                    routineType === 'evening' && { color: colors.white },
                  ]}
                >
                  Evening
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeOption,
                  routineType === 'custom' && {
                    backgroundColor: colors.mint,
                    borderColor: colors.mint,
                  },
                ]}
                onPress={() => setRoutineType('custom')}
              >
                {getTypeIcon('custom')}
                <Text
                  style={[
                    styles.typeOptionText,
                    routineType === 'custom' && { color: colors.white },
                  ]}
                >
                  Custom
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Reminder */}
          <View style={styles.field}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Text style={styles.label}>Daily Reminder</Text>
                <Text style={styles.reminderSubtext}>
                  Get notified at a specific time
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.mist, true: getTypeColor(routineType) + '40' }}
                thumbColor={reminderEnabled ? getTypeColor(routineType) : colors.white}
              />
            </View>

            {reminderEnabled && (
              <View style={styles.timePickerCard}>
                <Clock size={20} color={getTypeColor(routineType)} />
                <TextInput
                  style={styles.timeInput}
                  placeholder="08:00"
                  placeholderTextColor={colors.charcoal + '80'}
                  value={reminderTime}
                  onChangeText={setReminderTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            )}
          </View>
        </View>

        {/* Create Button */}
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.createButton,
              { backgroundColor: getTypeColor(routineType) },
              creating && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={creating}
          >
            <Text style={styles.createButtonText}>
              {creating ? 'Creating...' : 'Create Routine'}
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
  scrollView: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.cream,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: spacing[6],
    gap: spacing[6],
  },
  field: {
    gap: spacing[3],
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    fontSize: 16,
    color: colors.black,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeOptions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderSubtext: {
    fontSize: 13,
    color: colors.charcoal,
    marginTop: 4,
  },
  timePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  timeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  createButton: {
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  cancelButton: {
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
});
