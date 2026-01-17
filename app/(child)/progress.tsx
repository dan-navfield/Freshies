import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, TrendingUp, Award, Sparkles } from 'lucide-react-native';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');
const COMPARISON_WIDTH = (width - spacing[6] * 3) / 2;

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  created_at: string;
  tags?: string[];
  mood_emoji?: string;
  mood_word?: string;
}

interface ProgressStats {
  totalFreshies: number;
  thisWeek: number;
  thisMonth: number;
  currentStreak: number;
  longestStreak: number;
  beforePhotos: number;
  afterPhotos: number;
}

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProgressStats>({
    totalFreshies: 0,
    thisWeek: 0,
    thisMonth: 0,
    currentStreak: 0,
    longestStreak: 0,
    beforePhotos: 0,
    afterPhotos: 0,
  });
  const [beforePhotos, setBeforePhotos] = useState<FreshieItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<FreshieItem[]>([]);
  const [recentFreshies, setRecentFreshies] = useState<FreshieItem[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all freshies
      const { data: allFreshies, error } = await supabase
        .from('freshies')
        .select('*')
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!allFreshies) {
        setLoading(false);
        return;
      }

      // Calculate stats
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeekCount = allFreshies.filter(f => new Date(f.created_at) >= weekAgo).length;
      const thisMonthCount = allFreshies.filter(f => new Date(f.created_at) >= monthAgo).length;

      // Count before/after photos
      const beforeCount = allFreshies.filter(f => f.tags?.includes('before')).length;
      const afterCount = allFreshies.filter(f => f.tags?.includes('after')).length;

      // Calculate streak
      const { currentStreak, longestStreak } = calculateStreaks(allFreshies);

      setStats({
        totalFreshies: allFreshies.length,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        currentStreak,
        longestStreak,
        beforePhotos: beforeCount,
        afterPhotos: afterCount,
      });

      // Get before/after photos for comparison
      const befores = allFreshies.filter(f => f.tags?.includes('before')).slice(0, 10);
      const afters = allFreshies.filter(f => f.tags?.includes('after')).slice(0, 10);
      
      setBeforePhotos(befores);
      setAfterPhotos(afters);
      setRecentFreshies(allFreshies.slice(0, 6));
    } catch (error) {
      console.error('Error loading progress data:', error);
      Alert.alert('Error', 'Could not load progress data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (freshies: FreshieItem[]) => {
    if (freshies.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Group by date
    const dateMap = new Map<string, boolean>();
    freshies.forEach(f => {
      const date = new Date(f.created_at).toDateString();
      dateMap.set(date, true);
    });

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);
    
    while (dateMap.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  };

  const getStreakMessage = () => {
    if (stats.currentStreak === 0) {
      return "Start your journey today! 🌟";
    } else if (stats.currentStreak === 1) {
      return "Great start! Keep it up! 💪";
    } else if (stats.currentStreak < 7) {
      return `${stats.currentStreak} days strong! 🔥`;
    } else if (stats.currentStreak < 30) {
      return `Amazing ${stats.currentStreak} day streak! 🌟`;
    } else {
      return `Incredible ${stats.currentStreak} days! You're a star! ⭐`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="My Progress"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="My Progress"
        subtitle="See how far you've come"
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.purple + '20' }]}>
            <Sparkles size={32} color={colors.purple} />
            <Text style={styles.statNumber}>{stats.totalFreshies}</Text>
            <Text style={styles.statLabel}>Total Freshies</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.mint + '20' }]}>
            <Calendar size={32} color={colors.mint} />
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.yellow + '20' }]}>
            <TrendingUp size={32} color={colors.yellow} />
            <Text style={styles.statNumber}>{stats.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.peach + '20' }]}>
            <Award size={32} color={colors.peach} />
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Streak Message */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
          {stats.longestStreak > stats.currentStreak && (
            <Text style={styles.streakSubtext}>
              Your best: {stats.longestStreak} days
            </Text>
          )}
        </View>

        {/* Before & After Section */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Before & After</Text>
            <Text style={styles.sectionSubtitle}>
              {stats.beforePhotos} before • {stats.afterPhotos} after photos
            </Text>
            
            <TouchableOpacity
              style={styles.comparisonButton}
              onPress={() => router.push('/(child)/before-after')}
            >
              <View style={styles.comparisonPreview}>
                {beforePhotos[0] && (
                  <View style={styles.comparisonHalf}>
                    <Image
                      source={{ uri: beforePhotos[0].photo_url }}
                      style={styles.comparisonImage}
                      resizeMode="cover"
                    />
                    <View style={styles.comparisonLabel}>
                      <Text style={styles.comparisonLabelText}>Before</Text>
                    </View>
                  </View>
                )}
                {afterPhotos[0] && (
                  <View style={styles.comparisonHalf}>
                    <Image
                      source={{ uri: afterPhotos[0].photo_url }}
                      style={styles.comparisonImage}
                      resizeMode="cover"
                    />
                    <View style={styles.comparisonLabel}>
                      <Text style={styles.comparisonLabelText}>After</Text>
                    </View>
                  </View>
                )}
              </View>
              <Text style={styles.comparisonButtonText}>View All Comparisons →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Journey */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Journey</Text>
          <View style={styles.timelineGrid}>
            {recentFreshies.map((freshie, index) => (
              <TouchableOpacity
                key={freshie.id}
                style={styles.timelineItem}
                onPress={() => {
                  // Navigate to photo detail
                  Alert.alert('Photo', freshie.title);
                }}
              >
                <Image
                  source={{ uri: freshie.photo_url }}
                  style={styles.timelineImage}
                  resizeMode="cover"
                />
                {freshie.mood_emoji && (
                  <View style={styles.timelineMood}>
                    <Text style={styles.timelineMoodEmoji}>{freshie.mood_emoji}</Text>
                  </View>
                )}
                <Text style={styles.timelineDate}>
                  {new Date(freshie.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Encouragement */}
        <View style={styles.encouragementCard}>
          <Text style={styles.encouragementEmoji}>✨</Text>
          <Text style={styles.encouragementTitle}>You're doing amazing!</Text>
          <Text style={styles.encouragementText}>
            Every photo is a step in your skincare journey. Keep taking care of yourself!
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.charcoal,
    marginTop: spacing[8],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    padding: spacing[6],
  },
  statCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: spacing[2],
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
  },
  streakCard: {
    margin: spacing[6],
    marginTop: 0,
    padding: spacing[6],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  streakMessage: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  streakSubtext: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  section: {
    padding: spacing[6],
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    marginBottom: spacing[4],
  },
  comparisonButton: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  comparisonPreview: {
    flexDirection: 'row',
    height: 200,
  },
  comparisonHalf: {
    flex: 1,
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  comparisonLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  comparisonButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
    textAlign: 'center',
    padding: spacing[4],
  },
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  timelineItem: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  timelineImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
  },
  timelineMood: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineMoodEmoji: {
    fontSize: 16,
  },
  timelineDate: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  encouragementCard: {
    margin: spacing[6],
    marginTop: 0,
    padding: spacing[6],
    backgroundColor: colors.purple + '20',
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  encouragementEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  encouragementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  encouragementText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
