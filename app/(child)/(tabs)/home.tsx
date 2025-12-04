import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Scan, Heart, Clock, Star, TrendingUp, Smile, CheckCircle, 
  Sun, Moon, Sunrise, ChevronRight, AlertCircle, BookOpen,
  Droplets, Sparkles, Shield, Trophy, Zap
} from 'lucide-react-native';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { globalStyles } from '../../../src/theme/styles';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import FloatingAIButton from '../../../components/FloatingAIButton';
import { childHomeStyles } from './home-styles';

/**
 * Child Home Screen
 * Mirrors parent app layout with child-appropriate content
 */
export default function ChildHomeScreen() {
  const styles = childHomeStyles;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [skinProfile, setSkinProfile] = useState<any>(null);
  const [mainGoal, setMainGoal] = useState<string | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<any>(null);
  const [routineProgress, setRoutineProgress] = useState({ completed: 0, total: 0 });
  const [childProfileId, setChildProfileId] = useState<string | null>(null);

  const fetchChildProfile = useCallback(async () => {
      if (user?.id) {
        // First try to get from child_profiles
        const { data: childProfile } = await supabase
          .from('child_profiles')
          .select('display_name, avatar_config, avatar_url, id, skin_type, sensitivity_level')
          .eq('user_id', user.id)
          .single();

        if (childProfile?.display_name) {
          setUserName(childProfile.display_name);
        } else {
          // Fallback to profiles.first_name
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', user.id)
            .single();
          
          if (profile?.first_name) {
            setUserName(profile.first_name);
          }
        }

        // Get avatar - check for uploaded image first, then emoji
        if (childProfile?.avatar_url) {
          setUserAvatarUrl(childProfile.avatar_url);
        } else if (childProfile?.avatar_config?.emoji) {
          setUserAvatar(childProfile.avatar_config.emoji);
        }

        // Set skin profile
        if (childProfile) {
          setSkinProfile(childProfile);
          setChildProfileId(childProfile.id);
          
          // Get main goal
          const { data: goals } = await supabase
            .from('child_goals')
            .select('goal_type')
            .eq('child_profile_id', childProfile.id)
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .limit(1);
          
          if (goals && goals.length > 0) {
            setMainGoal(goals[0].goal_type);
          }
          
          // Load current routine
          await loadCurrentRoutine(childProfile.id);
        }
      }
  }, [user]);

  useEffect(() => {
    fetchChildProfile().finally(() => setLoading(false));
  }, [fetchChildProfile]);

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChildProfile();
      if (childProfileId) {
        loadCurrentRoutine(childProfileId);
      }
    }, [fetchChildProfile, childProfileId])
  );
  
  const loadCurrentRoutine = async (profileId: string) => {
    try {
      const currentHour = new Date().getHours();
      let segment: 'morning' | 'afternoon' | 'evening';
      
      if (currentHour < 12) {
        segment = 'morning';
      } else if (currentHour < 17) {
        segment = 'afternoon';
      } else {
        segment = 'evening';
      }
      
      // Get active routine for current segment
      const { data: routine } = await supabase
        .from('custom_routines')
        .select('*')
        .eq('child_profile_id', profileId)
        .eq('segment', segment)
        .eq('is_active', true)
        .single();
      
      if (routine) {
        setCurrentRoutine(routine);
        
        // Get today's completion status
        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from('routine_step_completions')
          .select('routine_step_id')
          .eq('child_profile_id', profileId)
          .eq('routine_id', routine.id)
          .eq('completion_date', today);
        
        const completedStepIds = new Set(completions?.map(c => c.routine_step_id) || []);
        const totalSteps = routine.steps?.length || 0;
        const completedSteps = routine.steps?.filter((step: any) => 
          completedStepIds.has(step.id)
        ).length || 0;
        
        setRoutineProgress({
          completed: completedSteps,
          total: totalSteps
        });
      } else {
        setCurrentRoutine(null);
        setRoutineProgress({ completed: 0, total: 0 });
      }
    } catch (error) {
      console.error('Error loading current routine:', error);
    }
  };

  // Helper functions for skin profile display
  const getSkinTypeLabel = (skinType?: string) => {
    const labels: Record<string, string> = {
      oily: 'Oily',
      dry: 'Dry',
      combination: 'Combination',
      normal: 'Normal',
      sensitive: 'Sensitive',
    };
    return labels[skinType || ''] || 'Normal';
  };

  const getGoalLabel = (goalType?: string) => {
    const labels: Record<string, string> = {
      reduce_breakouts: 'Clear skin',
      reduce_shine: 'Less shine',
      improve_hydration: 'Better hydration',
      reduce_redness: 'Calm redness',
      simple_routine: 'Simple routine',
      improve_after_sport: 'Post-sport care',
      feel_confident: 'Feel confident',
    };
    return labels[goalType || ''] || 'Healthy skin';
  };

  const getSkinTip = () => {
    if (!skinProfile?.skin_type) return 'Keep your skin clean and moisturized';
    
    const tips: Record<string, string> = {
      oily: 'Use oil-free, lightweight products',
      dry: 'Look for gentle, fragrance-free moisturizers',
      combination: 'Balance with different products for different areas',
      normal: 'Keep it simple with gentle products',
      sensitive: 'Avoid fragrances and harsh ingredients',
    };
    
    return tips[skinProfile.skin_type] || 'Keep your skin clean and moisturized';
  };

  const getSkinTypeDisplay = () => {
    let display = getSkinTypeLabel(skinProfile?.skin_type);
    if (skinProfile?.sensitivity_level && skinProfile.sensitivity_level > 3) {
      display += ' + Sensitive';
    }
    return display;
  };

  if (loading) {
    return (
      <View style={globalStyles.scrollContainer}>
        <PageHeader
          title="Hi there 👋"
          subtitle="Let's take care of your skin today"
          showAvatar={false}
          showSearch={false}
        />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.scrollContainer}>
      {/* Page Header with Child's Avatar */}
      <PageHeader
        title={`Hi ${userName || 'there'} 👋`}
        subtitle="Let's take care of your skin today"
        showAvatar={true}
        avatarEmoji={userAvatar || undefined}
        avatarUrl={userAvatarUrl}
        showSearch={true}
        searchPlaceholder="Search products, brands, ingredients..."
        compact={false}
      />

      {/* 1. Today's Routine Snapshot */}
      {currentRoutine && (
        <View style={styles.section}>
          <Pressable style={styles.routineCard} onPress={() => router.push('/(child)/(tabs)/routine')}>
            <View style={styles.routineHeader}>
              <View style={styles.routineTimeIndicator}>
                {currentRoutine.segment === 'morning' && <Sunrise size={20} color={colors.white} />}
                {currentRoutine.segment === 'afternoon' && <Sun size={20} color={colors.white} />}
                {currentRoutine.segment === 'evening' && <Moon size={20} color={colors.white} />}
                <Text style={styles.routineTimeText}>
                  {currentRoutine.segment.charAt(0).toUpperCase() + currentRoutine.segment.slice(1)} Routine
                </Text>
              </View>
              <ChevronRight size={20} color={colors.white} />
            </View>
            
            <View style={styles.routineProgress}>
              <View style={styles.progressRing}>
                <Text style={styles.progressRingText}>
                  {routineProgress.completed}/{routineProgress.total}
                </Text>
              </View>
              <View style={styles.routineProgressText}>
                {routineProgress.completed === routineProgress.total ? (
                  <>
                    <Text style={styles.routineProgressTitle}>All done! 🎉</Text>
                    <Text style={styles.routineProgressSubtitle}>You completed your routine</Text>
                  </>
                ) : routineProgress.completed > 0 ? (
                  <>
                    <Text style={styles.routineProgressTitle}>Nice work so far! ✨</Text>
                    <Text style={styles.routineProgressSubtitle}>Keep going with your routine</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.routineProgressTitle}>Ready to start? 🚀</Text>
                    <Text style={styles.routineProgressSubtitle}>Begin your routine</Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {/* 2. Skin Profile Highlight */}
      <View style={styles.section}>
        <Pressable 
          style={styles.skinProfileCard} 
          onPress={() => {
            console.log('Navigating to skin profile...');
            router.push('/skin-profile');
          }}>
          <View style={styles.skinProfileHeader}>
            <Droplets size={20} color={colors.purple} />
            <Text style={styles.skinProfileTitle}>Your Skin Profile</Text>
            <ChevronRight size={16} color={colors.charcoal} style={{ marginLeft: 'auto' }} />
          </View>
          
          <View style={styles.skinProfileContent}>
            <View style={styles.skinProfileRow}>
              <Text style={styles.skinProfileLabel}>Skin Type:</Text>
              <Text style={styles.skinProfileValue}>{getSkinTypeDisplay()}</Text>
            </View>
            <View style={styles.skinProfileRow}>
              <Text style={styles.skinProfileLabel}>Main Goal:</Text>
              <Text style={styles.skinProfileValue}>{getGoalLabel(mainGoal || undefined)}</Text>
            </View>
          </View>
          
          <View style={styles.skinProfileInsight}>
            <Sparkles size={14} color={colors.purple} />
            <Text style={styles.skinProfileInsightText}>
              Tip: {getSkinTip()}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* 3. Recommended for You */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Best for Your Skin Right Now ✨</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productCarousel}>
          {[1, 2, 3].map((item) => (
            <Pressable key={item} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/180' }}
                  style={styles.productImage}
                />
                <View style={styles.freshBadge}>
                  <Text style={styles.freshScore}>9.2</Text>
                </View>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>CeraVe</Text>
                <Text style={styles.productName}>Gentle Cleanser</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 4. Recently Scanned */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleLight}>Recently Scanned</Text>
          <Pressable>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.recentlyScannedRow}>
          {[1, 2, 3, 4].map((item) => (
            <Pressable key={item} style={styles.recentItem}>
              <View style={styles.recentItemImage}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/60' }}
                  style={styles.recentImage}
                />
              </View>
              <View style={styles.recentItemScore}>
                <Text style={styles.recentScoreText}>8.5</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 5. Alerts & Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Alerts & Reminders 🔔</Text>
        <View style={styles.alertsContainer}>
          <Pressable style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <AlertCircle size={16} color={colors.orange} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Cleanser expires soon</Text>
              <Text style={styles.alertSubtitle}>Check your bathroom cabinet</Text>
            </View>
            <ChevronRight size={16} color={colors.charcoal} />
          </Pressable>
          
          <Pressable style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <CheckCircle size={16} color={colors.mint} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Parent approved new item</Text>
              <Text style={styles.alertSubtitle}>Ready to add to your routine</Text>
            </View>
            <ChevronRight size={16} color={colors.charcoal} />
          </Pressable>
        </View>
      </View>

      {/* 6. Learning Highlight */}
      <View style={styles.section}>
        <Pressable style={styles.learningCard} onPress={() => router.push('/(child)/(tabs)/favorites')}>
          <View style={styles.learningIcon}>
            <BookOpen size={24} color={colors.purple} />
          </View>
          <View style={styles.learningContent}>
            <Text style={styles.learningTitle}>New lesson: What causes dryness</Text>
            <Text style={styles.learningSubtitle}>3 min read • Perfect for your skin type</Text>
          </View>
          <ChevronRight size={20} color={colors.purple} />
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Quick Actions ⚡</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable 
            style={[styles.learningCard, { flex: 1, backgroundColor: colors.purple + '10' }]} 
            onPress={() => router.push('/(child)/routines')}
          >
            <Zap size={20} color={colors.purple} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.purple, marginLeft: 8 }}>
              My Routines
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.learningCard, { flex: 1, backgroundColor: colors.mint + '10' }]} 
            onPress={() => router.push('/(child)/achievements-enhanced')}
          >
            <Trophy size={20} color={colors.mint} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.mint, marginLeft: 8 }}>
              Achievements
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Your Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitleLight}>Your Progress 🌟</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <TrendingUp size={16} color={colors.mint} />
            <Text style={styles.progressText}>You scanned 3 products this week</Text>
          </View>
          <View style={styles.progressRow}>
            <CheckCircle size={16} color={colors.mint} />
            <Text style={styles.progressText}>2 products added to favorites</Text>
          </View>
          <View style={styles.progressRow}>
            <Star size={16} color={colors.mint} />
            <Text style={styles.progressText}>7 day streak! Keep it up!</Text>
          </View>
        </View>
      </View>

      {/* My Stats */}
      <View style={styles.section}>
        <Pressable style={styles.statsCard}>
          <Text style={styles.statsTitle}>My Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Scanned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.mint }]}>5</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.purple }]}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* Ask FreshiesAI */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Pressable style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconContainer}>
              <Text style={styles.aiIcon}>🤖</Text>
            </View>
            <View style={styles.aiHeaderText}>
              <Text style={styles.aiTitle}>Ask FreshiesAI</Text>
              <Text style={styles.aiSubtitle}>Get help with your skincare</Text>
            </View>
          </View>
          <View style={styles.aiSuggestions}>
            <Text style={styles.aiSuggestionTitle}>Try asking:</Text>
            <Text style={styles.aiSuggestion}>• "Is this product safe for me?"</Text>
            <Text style={styles.aiSuggestion}>• "What should I use for my skin?"</Text>
            <Text style={styles.aiSuggestion}>• "How do I use this product?"</Text>
          </View>
          <View style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Start Conversation</Text>
          </View>
        </Pressable>
      </View>

      <FloatingAIButton />
    </ScrollView>
  );
}
