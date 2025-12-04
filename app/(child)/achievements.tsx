import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trophy, Star, Lock, TrendingUp } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { StyleSheet } from 'react-native';
import {
  getAchievementsWithProgress,
  getChildPoints,
  getTierColor,
  type Achievement,
} from '../../src/utils/achievementHelpers';
import { supabase } from '../../lib/supabase';

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [points, setPoints] = useState({
    total_points: 0,
    current_level: 1,
    points_to_next_level: 100,
    lifetime_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const [achievementsData, pointsData] = await Promise.all([
        getAchievementsWithProgress(profile.id),
        getChildPoints(profile.id),
      ]);

      setAchievements(achievementsData);
      if (pointsData) setPoints(pointsData);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All', emoji: '🏆' },
    { id: 'streak', label: 'Streaks', emoji: '🔥' },
    { id: 'completion', label: 'Completions', emoji: '✅' },
    { id: 'consistency', label: 'Consistency', emoji: '📅' },
    { id: 'special', label: 'Special', emoji: '⭐' },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const progressPercentage = (points.total_points / points.points_to_next_level) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Level & Points Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{points.current_level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {points.current_level}</Text>
              <Text style={styles.levelSubtitle}>
                {points.total_points} / {points.points_to_next_level} XP
              </Text>
            </View>
            <View style={styles.totalPoints}>
              <Star size={20} color="#FFD700" fill="#FFD700" />
              <Text style={styles.totalPointsText}>{points.lifetime_points}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{points.lifetime_points}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                selectedCategory === cat.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievements List */}
        <View style={styles.achievementsList}>
          {TIER_ORDER.map((tier) => {
            const tierAchievements = filteredAchievements.filter(a => a.tier === tier);
            if (tierAchievements.length === 0) return null;

            return (
              <View key={tier} style={styles.tierSection}>
                <View style={styles.tierHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(tier) }]}>
                    <Trophy size={16} color={colors.white} />
                  </View>
                  <Text style={styles.tierTitle}>{tier.toUpperCase()}</Text>
                </View>

                {tierAchievements.map((achievement) => {
                  const progress = achievement.progress || 0;
                  const progressPercent = (progress / achievement.requirement_value) * 100;

                  return (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        achievement.is_unlocked && styles.achievementCardUnlocked,
                      ]}
                    >
                      <View style={styles.achievementContent}>
                        <View
                          style={[
                            styles.achievementIcon,
                            achievement.is_unlocked && {
                              backgroundColor: getTierColor(achievement.tier),
                            },
                          ]}
                        >
                          {achievement.is_unlocked ? (
                            <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                          ) : (
                            <Lock size={24} color={colors.charcoal} />
                          )}
                        </View>

                        <View style={styles.achievementInfo}>
                          <Text
                            style={[
                              styles.achievementName,
                              achievement.is_unlocked && styles.achievementNameUnlocked,
                            ]}
                          >
                            {achievement.name}
                          </Text>
                          <Text style={styles.achievementDescription}>
                            {achievement.description}
                          </Text>

                          {!achievement.is_unlocked && (
                            <>
                              <View style={styles.achievementProgress}>
                                <View style={styles.achievementProgressBar}>
                                  <View
                                    style={[
                                      styles.achievementProgressFill,
                                      { width: `${progressPercent}%` },
                                    ]}
                                  />
                                </View>
                                <Text style={styles.achievementProgressText}>
                                  {progress}/{achievement.requirement_value}
                                </Text>
                              </View>
                            </>
                          )}

                          {achievement.is_unlocked && achievement.unlocked_at && (
                            <Text style={styles.unlockedDate}>
                              Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                            </Text>
                          )}
                        </View>

                        <View style={styles.achievementPoints}>
                          <Star size={16} color="#FFD700" fill="#FFD700" />
                          <Text style={styles.pointsText}>{achievement.points}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <TrendingUp size={24} color={colors.purple} />
          <Text style={styles.motivationText}>
            {unlockedCount === 0
              ? 'Start completing your routine to unlock achievements! 🌟'
              : unlockedCount === achievements.length
              ? 'Amazing! You\'ve unlocked everything! You\'re a superstar! 👑'
              : `Keep going! ${achievements.length - unlockedCount} more to unlock! 💪`}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Level Card
  levelCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  levelSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  totalPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  totalPointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radii.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },

  // Categories
  categoryScroll: {
    marginBottom: spacing[4],
  },
  categoryContent: {
    gap: spacing[2],
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  categoryButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  categoryLabelActive: {
    color: colors.white,
  },

  // Achievements
  achievementsList: {
    gap: spacing[4],
  },
  tierSection: {
    marginBottom: spacing[2],
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tierBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    letterSpacing: 1,
  },
  achievementCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
    opacity: 0.6,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.purple,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  achievementNameUnlocked: {
    color: colors.black,
  },
  achievementDescription: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    marginBottom: spacing[2],
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  achievementProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radii.sm,
  },
  achievementProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  unlockedDate: {
    fontSize: 11,
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  achievementPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginLeft: spacing[2],
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },

  // Motivation
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.lg,
    padding: spacing[5],
    marginTop: spacing[4],
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
});
