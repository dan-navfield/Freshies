import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { 
  Droplets, 
  Sun, 
  Sparkles, 
  Shield, 
  Target,
  Edit3,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react-native';

// Type definitions
type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive';
type SkinConcern = 'acne' | 'redness' | 'dryness' | 'oiliness' | 'sensitivity' | 'dark_spots' | 'texture';
type GoalType = 'reduce_breakouts' | 'reduce_shine' | 'improve_hydration' | 'reduce_redness' | 'simple_routine' | 'improve_after_sport' | 'feel_confident';

interface SkinProfile {
  skin_type?: SkinType;
  skin_type_source?: string;
  concerns?: SkinConcern[];
  sensitivity_level?: number;
}

interface Goal {
  goal_type: GoalType;
  priority: number;
}

export default function SkinProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadSkinProfile();
  }, [user]);

  const loadSkinProfile = async () => {
    if (!user?.id) return;

    try {
      // Get child profile
      const { data: childProfile, error: profileError } = await supabase
        .from('child_profiles')
        .select('id, skin_type, skin_type_source, concerns, sensitivity_level')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (childProfile) {
        setProfile(childProfile);
        setProfileId(childProfile.id);

        // Get goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('child_goals')
          .select('goal_type, priority')
          .eq('child_profile_id', childProfile.id)
          .eq('is_active', true)
          .order('priority', { ascending: false });

        if (!goalsError && goalsData) {
          setGoals(goalsData);
        }
      }
    } catch (error) {
      console.error('Error loading skin profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkinTypeInfo = (type?: SkinType) => {
    const info = {
      oily: { emoji: '✨', label: 'Oily', color: colors.yellow },
      dry: { emoji: '🌵', label: 'Dry', color: colors.mint },
      combination: { emoji: '🌤️', label: 'Combination', color: colors.purple },
      normal: { emoji: '😊', label: 'Normal', color: colors.mint },
      sensitive: { emoji: '🌸', label: 'Sensitive', color: colors.peach },
    };
    return info[type || 'normal'] || info.normal;
  };

  const getConcernInfo = (concern: SkinConcern) => {
    const info = {
      acne: { emoji: '✨', label: 'Breakouts' },
      redness: { emoji: '🌸', label: 'Redness' },
      dryness: { emoji: '💧', label: 'Dryness' },
      oiliness: { emoji: '🌟', label: 'Oiliness' },
      sensitivity: { emoji: '🛡️', label: 'Sensitivity' },
      dark_spots: { emoji: '🎯', label: 'Dark Spots' },
      texture: { emoji: '🌊', label: 'Texture' },
    };
    return info[concern] || { emoji: '❓', label: concern };
  };

  const getGoalInfo = (goal: GoalType) => {
    const info = {
      reduce_breakouts: { emoji: '✨', label: 'Clear Skin' },
      reduce_shine: { emoji: '🌟', label: 'Less Shine' },
      improve_hydration: { emoji: '💧', label: 'Better Hydration' },
      reduce_redness: { emoji: '🌸', label: 'Calm Redness' },
      simple_routine: { emoji: '⚡', label: 'Simple Routine' },
      improve_after_sport: { emoji: '🏃', label: 'Post-Sport Care' },
      feel_confident: { emoji: '😊', label: 'Feel Confident' },
    };
    return info[goal] || { emoji: '🎯', label: 'Goal' };
  };

  const getPersonalizedTip = () => {
    if (!profile?.skin_type) return null;

    const tips = {
      oily: "Look for oil-free, non-comedogenic products that won't clog pores",
      dry: "Look for gentle, fragrance-free moisturizers with ceramides",
      combination: "Use lighter products on oily areas, richer ones on dry spots",
      normal: "Keep it simple! A gentle cleanser and moisturizer work great",
      sensitive: "Avoid fragrances and harsh ingredients, patch test new products",
    };

    return tips[profile.skin_type];
  };

  const handleRetakeQuiz = () => {
    Alert.alert(
      'Retake Quiz',
      'This will update your skin profile. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Retake', 
          onPress: () => router.push('/(child)/onboarding/tween/skin-type')
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Your Skin Profile"
          subtitle="Understanding your skin"
          showAvatar={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      </View>
    );
  }

  const skinTypeInfo = getSkinTypeInfo(profile?.skin_type);
  const mainGoal = goals[0]; // Highest priority goal

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Your Skin Profile"
        subtitle="Understanding your skin"
        showAvatar={true}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Profile Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.skinTypeContainer}>
              <Text style={styles.skinTypeEmoji}>{skinTypeInfo.emoji}</Text>
              <View>
                <Text style={styles.skinTypeLabel}>Skin Type:</Text>
                <Text style={styles.skinTypeValue}>
                  {skinTypeInfo.label}
                  {profile?.sensitivity_level && profile.sensitivity_level > 3 && ' + Sensitive'}
                </Text>
              </View>
            </View>
            <Pressable style={styles.editButton} onPress={handleRetakeQuiz}>
              <Edit3 size={16} color={colors.purple} />
            </Pressable>
          </View>

          {mainGoal && (
            <View style={styles.mainGoalContainer}>
              <Text style={styles.mainGoalLabel}>Main Goal:</Text>
              <Text style={styles.mainGoalValue}>
                {getGoalInfo(mainGoal.goal_type).label}
              </Text>
            </View>
          )}

          {/* Personalized Tip */}
          {getPersonalizedTip() && (
            <View style={styles.tipContainer}>
              <View style={styles.tipIcon}>
                <Sparkles size={16} color={colors.purple} />
              </View>
              <Text style={styles.tipText}>
                <Text style={styles.tipLabel}>Tip: </Text>
                {getPersonalizedTip()}
              </Text>
            </View>
          )}
        </View>

        {/* Concerns Section */}
        {profile?.concerns && profile.concerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Concerns</Text>
            <View style={styles.concernsGrid}>
              {profile.concerns.map((concern) => {
                const concernInfo = getConcernInfo(concern);
                return (
                  <View key={concern} style={styles.concernChip}>
                    <Text style={styles.concernEmoji}>{concernInfo.emoji}</Text>
                    <Text style={styles.concernLabel}>{concernInfo.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Goals Section */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            {goals.map((goal, index) => {
              const goalInfo = getGoalInfo(goal.goal_type);
              return (
                <View key={`${goal.goal_type}-${index}`} style={styles.goalItem}>
                  <View style={styles.goalLeft}>
                    <Text style={styles.goalEmoji}>{goalInfo.emoji}</Text>
                    <Text style={styles.goalText}>{goalInfo.label}</Text>
                  </View>
                  {goal.priority > 1 && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>Priority</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Recommended Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          
          <Pressable 
            style={styles.actionCard}
            onPress={() => router.push('/(child)/learn')}
          >
            <View style={styles.actionIcon}>
              <Info size={20} color={colors.purple} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Learn About Your Skin</Text>
              <Text style={styles.actionSubtitle}>
                Tips and tricks for {skinTypeInfo.label.toLowerCase()} skin
              </Text>
            </View>
            <ChevronRight size={20} color={colors.charcoal} />
          </Pressable>

          <Pressable 
            style={styles.actionCard}
            onPress={() => router.push('/(child)/routine-builder-enhanced')}
          >
            <View style={styles.actionIcon}>
              <RefreshCw size={20} color={colors.purple} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Build a Routine</Text>
              <Text style={styles.actionSubtitle}>
                Personalized for your skin type
              </Text>
            </View>
            <ChevronRight size={20} color={colors.charcoal} />
          </Pressable>
        </View>

        {/* Update Profile Button */}
        <Pressable style={styles.updateButton} onPress={handleRetakeQuiz}>
          <Text style={styles.updateButtonText}>Update Skin Profile</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    borderRadius: radii.xl,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skinTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  skinTypeEmoji: {
    fontSize: 40,
  },
  skinTypeLabel: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: 2,
  },
  skinTypeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
  },
  editButton: {
    padding: spacing[2],
    backgroundColor: colors.cream,
    borderRadius: radii.md,
  },
  mainGoalContainer: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  mainGoalLabel: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: 4,
  },
  mainGoalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lavender,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginTop: spacing[3],
    gap: spacing[2],
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.deepPurple,
    lineHeight: 20,
  },
  tipLabel: {
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  concernChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  concernEmoji: {
    fontSize: 16,
  },
  concernLabel: {
    fontSize: 14,
    color: colors.black,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
  priorityBadge: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  updateButton: {
    backgroundColor: colors.purple,
    marginHorizontal: spacing[4],
    marginVertical: spacing[6],
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
