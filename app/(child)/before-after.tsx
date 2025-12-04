import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ArrowRight } from 'lucide-react-native';
import DetailPageHeader from '../../components/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = (width - spacing[6] * 3) / 2;

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  created_at: string;
  tags?: string[];
  mood_emoji?: string;
}

interface Comparison {
  before: FreshieItem;
  after: FreshieItem;
  daysBetween: number;
}

export default function BeforeAfterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<FreshieItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<FreshieItem[]>([]);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all freshies with before/after tags
      const { data: allFreshies, error } = await supabase
        .from('freshies')
        .select('*')
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!allFreshies) {
        setLoading(false);
        return;
      }

      const befores = allFreshies.filter(f => f.tags?.includes('before'));
      const afters = allFreshies.filter(f => f.tags?.includes('after'));

      setBeforePhotos(befores);
      setAfterPhotos(afters);

      // Create smart comparisons (pair closest before/after by date)
      const pairs: Comparison[] = [];
      const usedAfters = new Set<string>();

      befores.forEach(before => {
        // Find the closest after photo (taken after this before photo)
        const beforeDate = new Date(before.created_at);
        let closestAfter: FreshieItem | null = null;
        let minDiff = Infinity;

        afters.forEach(after => {
          if (usedAfters.has(after.id)) return;
          
          const afterDate = new Date(after.created_at);
          const diff = afterDate.getTime() - beforeDate.getTime();
          
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            closestAfter = after;
          }
        });

        if (closestAfter) {
          const daysBetween = Math.floor(minDiff / (1000 * 60 * 60 * 24));
          pairs.push({
            before,
            after: closestAfter,
            daysBetween,
          });
          usedAfters.add(closestAfter.id);
        }
      });

      setComparisons(pairs);
    } catch (error) {
      console.error('Error loading comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Before & After"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading comparisons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Before & After"
        subtitle="See your transformation"
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{beforePhotos.length}</Text>
            <Text style={styles.statLabel}>Before Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{afterPhotos.length}</Text>
            <Text style={styles.statLabel}>After Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{comparisons.length}</Text>
            <Text style={styles.statLabel}>Comparisons</Text>
          </View>
        </View>

        {/* Comparisons */}
        {comparisons.length > 0 ? (
          <View style={styles.comparisonsSection}>
            {comparisons.map((comparison, index) => (
              <View key={index} style={styles.comparisonCard}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonTitle}>
                    {comparison.daysBetween} {comparison.daysBetween === 1 ? 'day' : 'days'} of progress
                  </Text>
                  <Text style={styles.comparisonDate}>
                    {new Date(comparison.before.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(comparison.after.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                
                <View style={styles.comparisonImages}>
                  <View style={styles.comparisonSide}>
                    <Image
                      source={{ uri: comparison.before.photo_url }}
                      style={styles.comparisonImage}
                      resizeMode="cover"
                    />
                    <View style={styles.comparisonLabel}>
                      <Text style={styles.comparisonLabelText}>Before</Text>
                    </View>
                    {comparison.before.mood_emoji && (
                      <View style={styles.moodBadge}>
                        <Text style={styles.moodEmoji}>{comparison.before.mood_emoji}</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.arrowContainer}>
                    <ArrowRight size={24} color={colors.purple} />
                  </View>
                  
                  <View style={styles.comparisonSide}>
                    <Image
                      source={{ uri: comparison.after.photo_url }}
                      style={styles.comparisonImage}
                      resizeMode="cover"
                    />
                    <View style={styles.comparisonLabel}>
                      <Text style={styles.comparisonLabelText}>After</Text>
                    </View>
                    {comparison.after.mood_emoji && (
                      <View style={styles.moodBadge}>
                        <Text style={styles.moodEmoji}>{comparison.after.mood_emoji}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No comparisons yet</Text>
            <Text style={styles.emptyText}>
              Tag your photos with "Before" and "After" to see your progress!
            </Text>
          </View>
        )}

        {/* All Before Photos */}
        {beforePhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Before Photos</Text>
            <View style={styles.photoGrid}>
              {beforePhotos.map((photo) => (
                <View key={photo.id} style={styles.gridItem}>
                  <Image
                    source={{ uri: photo.photo_url }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.gridDate}>
                    {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All After Photos */}
        {afterPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All After Photos</Text>
            <View style={styles.photoGrid}>
              {afterPhotos.map((photo) => (
                <View key={photo.id} style={styles.gridItem}>
                  <Image
                    source={{ uri: photo.photo_url }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.gridDate}>
                    {new Date(photo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
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
  statsBar: {
    flexDirection: 'row',
    padding: spacing[6],
    backgroundColor: colors.white,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.purple,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
  },
  comparisonsSection: {
    padding: spacing[6],
  },
  comparisonCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  comparisonHeader: {
    marginBottom: spacing[4],
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  comparisonDate: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  comparisonImages: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonSide: {
    flex: 1,
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
  },
  comparisonLabel: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  comparisonLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
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
  moodEmoji: {
    fontSize: 16,
  },
  arrowContainer: {
    paddingHorizontal: spacing[3],
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
  section: {
    padding: spacing[6],
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  gridItem: {
    width: '31%',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.lg,
  },
  gridDate: {
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
  bottomSpacer: {
    height: spacing[8],
  },
});
