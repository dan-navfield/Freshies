import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Sun, Moon, Sunrise, Calendar, Sparkles } from 'lucide-react-native';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (width - spacing[6] * 2 - spacing[3] * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type Segment = 'morning' | 'afternoon' | 'evening';

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  segment: string;
  created_at: string;
  mood_emoji?: string;
  mood_word?: string;
  routine_id?: string;
  routine_name?: string;
}

export default function RoutineFreshiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<Segment | 'all'>('all');
  const [freshies, setFreshies] = useState<FreshieItem[]>([]);
  const [stats, setStats] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
    total: 0,
  });

  useEffect(() => {
    loadRoutineFreshies();
  }, [selectedSegment]);

  const loadRoutineFreshies = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Build query
      let query = supabase
        .from('freshies')
        .select('*')
        .eq('child_profile_id', profile.id)
        .not('routine_id', 'is', null)
        .order('created_at', { ascending: false });

      // Filter by segment if not 'all'
      if (selectedSegment !== 'all') {
        query = query.eq('segment', selectedSegment);
      }

      const { data: freshiesData, error } = await query;

      if (error) throw error;

      setFreshies(freshiesData || []);

      // Calculate stats
      const morningCount = freshiesData?.filter(f => f.segment === 'morning').length || 0;
      const afternoonCount = freshiesData?.filter(f => f.segment === 'afternoon').length || 0;
      const eveningCount = freshiesData?.filter(f => f.segment === 'evening').length || 0;

      setStats({
        morning: morningCount,
        afternoon: afternoonCount,
        evening: eveningCount,
        total: freshiesData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading routine freshies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'morning': return '#F59E0B';
      case 'afternoon': return '#EC4899';
      case 'evening': return '#8B7AB8';
      default: return colors.purple;
    }
  };

  const getSegmentIcon = (segment: Segment) => {
    switch (segment) {
      case 'morning': return Sun;
      case 'afternoon': return Sunrise;
      case 'evening': return Moon;
    }
  };

  const getSegmentEmoji = (segment: string) => {
    switch (segment) {
      case 'morning': return '☀️';
      case 'afternoon': return '🌤️';
      case 'evening': return '🌙';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Routine Photos"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading your routine photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Routine Photos"
        subtitle="Photos from your routines"
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Sparkles size={24} color={colors.purple} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Photos</Text>
          </View>
        </View>

        {/* Segment Filter */}
        <View style={styles.segmentFilter}>
          <TouchableOpacity
            style={[styles.segmentButton, selectedSegment === 'all' && styles.segmentButtonActive]}
            onPress={() => setSelectedSegment('all')}
          >
            <Text style={[styles.segmentButtonText, selectedSegment === 'all' && styles.segmentButtonTextActive]}>
              All ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === 'morning' && styles.segmentButtonActive,
              selectedSegment === 'morning' && { backgroundColor: getSegmentColor('morning') }
            ]}
            onPress={() => setSelectedSegment('morning')}
          >
            <Sun size={16} color={selectedSegment === 'morning' ? colors.white : colors.charcoal} />
            <Text style={[styles.segmentButtonText, selectedSegment === 'morning' && styles.segmentButtonTextActive]}>
              Morning ({stats.morning})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === 'afternoon' && styles.segmentButtonActive,
              selectedSegment === 'afternoon' && { backgroundColor: getSegmentColor('afternoon') }
            ]}
            onPress={() => setSelectedSegment('afternoon')}
          >
            <Sunrise size={16} color={selectedSegment === 'afternoon' ? colors.white : colors.charcoal} />
            <Text style={[styles.segmentButtonText, selectedSegment === 'afternoon' && styles.segmentButtonTextActive]}>
              Afternoon ({stats.afternoon})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === 'evening' && styles.segmentButtonActive,
              selectedSegment === 'evening' && { backgroundColor: getSegmentColor('evening') }
            ]}
            onPress={() => setSelectedSegment('evening')}
          >
            <Moon size={16} color={selectedSegment === 'evening' ? colors.white : colors.charcoal} />
            <Text style={[styles.segmentButtonText, selectedSegment === 'evening' && styles.segmentButtonTextActive]}>
              Evening ({stats.evening})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        {freshies.length > 0 ? (
          <View style={styles.grid}>
            {freshies.map((freshie) => (
              <TouchableOpacity
                key={freshie.id}
                style={styles.gridItem}
                onPress={() => {
                  // Navigate to photo detail or open modal
                }}
              >
                <Image
                  source={{ uri: freshie.photo_url }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
                
                {/* Segment Badge */}
                <View style={[styles.segmentBadge, { backgroundColor: getSegmentColor(freshie.segment) }]}>
                  <Text style={styles.segmentBadgeText}>{getSegmentEmoji(freshie.segment)}</Text>
                </View>
                
                {/* Mood Badge */}
                {freshie.mood_emoji && (
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodBadgeEmoji}>{freshie.mood_emoji}</Text>
                  </View>
                )}
                
                {/* Date */}
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>
                    {new Date(freshie.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No routine photos yet</Text>
            <Text style={styles.emptyText}>
              Take photos during your routines to see them here!
            </Text>
          </View>
        )}

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
  statsContainer: {
    padding: spacing[6],
    backgroundColor: colors.cream,
  },
  statCard: {
    backgroundColor: colors.purple + '20',
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
  },
  segmentFilter: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.mist,
  },
  segmentButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  segmentButtonTextActive: {
    color: colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    padding: spacing[6],
    paddingTop: 0,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  segmentBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
  },
  segmentBadgeText: {
    fontSize: 12,
  },
  moodBadge: {
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
  moodBadgeEmoji: {
    fontSize: 16,
  },
  dateBadge: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
