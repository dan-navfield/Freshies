import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (width - spacing[6] * 2 - spacing[3] * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  segment: string;
  mood_emoji?: string;
  is_favorite: boolean;
  created_at: string;
}

export default function AddToCollectionScreen() {
  const router = useRouter();
  const { collectionId } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [freshies, setFreshies] = useState<FreshieItem[]>([]);
  const [existingFreshieIds, setExistingFreshieIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadFreshies();
  }, [collectionId]);

  const loadFreshies = async () => {
    if (!user?.id || !collectionId) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all freshies
      const { data: allFreshies, error: freshiesError } = await supabase
        .from('freshies')
        .select('*')
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (freshiesError) throw freshiesError;

      // Get freshies already in this collection
      const { data: existingLinks, error: linksError } = await supabase
        .from('freshie_collections')
        .select('freshie_id')
        .eq('collection_id', collectionId);

      if (linksError) throw linksError;

      const existingIds = existingLinks?.map(link => link.freshie_id) || [];
      setExistingFreshieIds(existingIds);

      // Filter out freshies already in collection
      const availableFreshies = allFreshies?.filter(f => !existingIds.includes(f.id)) || [];
      setFreshies(availableFreshies);
    } catch (error) {
      console.error('Error loading freshies:', error);
      Alert.alert('Error', 'Could not load photos');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (freshieId: string) => {
    setSelectedIds(prev =>
      prev.includes(freshieId)
        ? prev.filter(id => id !== freshieId)
        : [...prev, freshieId]
    );
  };

  const handleAddToCollection = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('No Photos Selected', 'Please select at least one photo to add');
      return;
    }

    setAdding(true);

    try {
      const inserts = selectedIds.map(freshieId => ({
        freshie_id: freshieId,
        collection_id: collectionId,
      }));

      const { error } = await supabase
        .from('freshie_collections')
        .insert(inserts);

      if (error) throw error;

      Alert.alert(
        '✨ Added!',
        `${selectedIds.length} ${selectedIds.length === 1 ? 'photo' : 'photos'} added to collection`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to collection:', error);
      Alert.alert('Error', 'Could not add photos to collection');
    } finally {
      setAdding(false);
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

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Add Photos"
        subtitle={`${selectedIds.length} selected`}
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading photos...</Text>
        ) : freshies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>All photos added!</Text>
            <Text style={styles.emptyText}>
              All your photos are already in this collection
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {freshies.map((freshie) => {
              const isSelected = selectedIds.includes(freshie.id);
              return (
                <TouchableOpacity
                  key={freshie.id}
                  style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                  onPress={() => toggleSelection(freshie.id)}
                >
                  <Image
                    source={{ uri: freshie.photo_url }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  
                  {freshie.mood_emoji && (
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodBadgeEmoji}>{freshie.mood_emoji}</Text>
                    </View>
                  )}
                  
                  {freshie.is_favorite && (
                    <View style={styles.favoriteBadge}>
                      <Text style={styles.favoriteBadgeEmoji}>⭐</Text>
                    </View>
                  )}
                  
                  <View style={[styles.segmentBadge, { backgroundColor: getSegmentColor(freshie.segment) }]}>
                    <Text style={styles.segmentBadgeText}>
                      {freshie.segment === 'morning' ? '☀️' : freshie.segment === 'afternoon' ? '🌤️' : '🌙'}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={styles.selectionOverlay}>
                      <View style={styles.checkmark}>
                        <Check size={20} color={colors.white} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {freshies.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, (adding || selectedIds.length === 0) && styles.addButtonDisabled]}
            onPress={handleAddToCollection}
            disabled={adding || selectedIds.length === 0}
          >
            <Text style={styles.addButtonText}>
              {adding ? 'Adding...' : `Add ${selectedIds.length || ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    padding: spacing[6],
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: colors.purple,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
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
  favoriteBadge: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeEmoji: {
    fontSize: 14,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[6],
    paddingBottom: spacing[8],
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  addButton: {
    flex: 2,
    paddingVertical: spacing[4],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
