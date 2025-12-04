import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useChildProfile } from '../../../../src/contexts/ChildProfileContext';

/**
 * Tween Goals Selection
 * Simple 2-3 goals for what they want
 */
export default function TweenGoals() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { refreshProfile } = useChildProfile();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const goals = [
    { id: 'clear_skin', emoji: '✨', title: 'Clear Skin', description: 'No more pimples!' },
    { id: 'soft_skin', emoji: '💧', title: 'Soft Skin', description: 'Nice and smooth' },
    { id: 'feel_good', emoji: '😊', title: 'Feel Good', description: 'Happy with my skin!' },
  ];

  const toggleGoal = (id: string) => {
    if (selectedGoals.includes(id)) {
      setSelectedGoals(selectedGoals.filter(g => g !== id));
    } else {
      if (selectedGoals.length < 2) {
        setSelectedGoals([...selectedGoals, id]);
      }
    }
  };

  const handleComplete = async () => {
    if (!user || selectedGoals.length === 0) return;

    setLoading(true);
    try {
      const skinType = params.skinType as string;
      const problems = params.problems ? JSON.parse(params.problems as string) : [];
      const ageBand = params.age as string;
      const avatar = params.avatar as string || '🌟';

      // Get user's first name from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      const displayName = profileData?.first_name || user.email?.split('@')[0] || 'Child';

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let profile;
      if (existingProfile) {
        // Update existing profile
        const { data: updated, error: updateError } = await supabase
          .from('child_profiles')
          .update({
            display_name: displayName,
            age_band: ageBand,
            avatar_config: { emoji: avatar },
            skin_type: skinType,
            skin_type_source: 'self_reported',
            concerns: problems,
            concern_source: 'self_reported',
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (updateError) throw updateError;
        profile = updated;
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('child_profiles')
          .insert({
            user_id: user.id,
            parent_id: user.id, // TODO: Get actual parent_id from invitation
            display_name: displayName,
            age_band: ageBand,
            avatar_config: { emoji: avatar },
            skin_type: skinType,
            skin_type_source: 'self_reported',
            concerns: problems,
            concern_source: 'self_reported',
          })
          .select()
          .single();

        if (profileError) throw profileError;
        profile = newProfile;
      }

      // Map simple goals to database goal types
      const goalMapping: Record<string, string> = {
        clear_skin: 'reduce_breakouts',
        soft_skin: 'improve_hydration',
        feel_good: 'feel_confident',
      };

      // Delete existing goals for this profile
      await supabase
        .from('child_goals')
        .delete()
        .eq('child_profile_id', profile.id);

      // Add new goals
      const goalsData = selectedGoals.map((goalId, index) => ({
        child_profile_id: profile.id,
        goal_type: goalMapping[goalId],
        priority: selectedGoals.length - index,
      }));

      const { error: goalsError } = await supabase
        .from('child_goals')
        .insert(goalsData);

      if (goalsError) throw goalsError;

      // Refresh profile context
      await refreshProfile();

      // Navigate to avatar builder
      router.push('/(child)/onboarding/tween/avatar');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert('Oops! Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button and Progress */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1a1a1a" size={24} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 4 of 4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionSection}>
          <Text style={styles.question}>What do you want?</Text>
          <Text style={styles.hint}>Pick up to 2 things!</Text>
        </View>

        {/* Goals Cards */}
        <View style={styles.goalsContainer}>
          {goals.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            const isDisabled = !isSelected && selectedGoals.length >= 2;
            
            return (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected,
                  isDisabled && styles.goalCardDisabled,
                ]}
                onPress={() => toggleGoal(goal.id)}
                disabled={isDisabled}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={36} color="#EC4899" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Counter */}
        {selectedGoals.length > 0 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {selectedGoals.length} / 2 picked! 🎯
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.completeButton, (selectedGoals.length === 0 || loading) && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={selectedGoals.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Next! →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  questionSection: {
    marginBottom: 32,
  },
  question: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 40,
  },
  hint: {
    fontSize: 18,
    color: '#666',
    lineHeight: 26,
  },
  goalsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 4,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: '#EC4899',
    backgroundColor: '#FFF1F2',
  },
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalEmoji: {
    fontSize: 48,
  },
  goalTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalDescription: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  counterBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
  },
  completeButton: {
    backgroundColor: '#EC4899',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  completeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
