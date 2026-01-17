import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react-native';
import DetailPageHeader from '../../../src/components/DetailPageHeader';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

const { width } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (width - spacing[6] * 2 - spacing[3] * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_system: boolean;
  collection_type: string;
  created_at: string;
}

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  segment: string;
  notes?: string;
  mood_emoji?: string;
  mood_word?: string;
  is_favorite: boolean;
  created_at: string;
}

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [freshies, setFreshies] = useState<FreshieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFreshie, setSelectedFreshie] = useState<FreshieItem | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadCollection();
    loadFreshies();
  }, [id]);

  // Reload freshies when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadFreshies();
    }, [id])
  );

  const loadCollection = async () => {
    if (!user?.id || !id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .eq('child_profile_id', profile.id)
        .single();

      if (error) throw error;
      setCollection(data);
    } catch (error) {
      console.error('Error loading collection:', error);
      Alert.alert('Error', 'Could not load collection');
    }
  };

  const loadFreshies = async () => {
    if (!user?.id || !id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get freshies in this collection
      const { data: freshieCollections, error: fcError } = await supabase
        .from('freshie_collections')
        .select('freshie_id')
        .eq('collection_id', id);

      if (fcError) throw fcError;

      if (!freshieCollections || freshieCollections.length === 0) {
        setFreshies([]);
        setLoading(false);
        return;
      }

      const freshieIds = freshieCollections.map(fc => fc.freshie_id);

      const { data: freshiesData, error: freshiesError } = await supabase
        .from('freshies')
        .select('*')
        .in('id', freshieIds)
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (freshiesError) throw freshiesError;

      setFreshies(freshiesData || []);
    } catch (error) {
      console.error('Error loading freshies:', error);
      Alert.alert('Error', 'Could not load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollection = () => {
    if (collection?.is_system) {
      Alert.alert('Cannot Delete', 'System collections cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection?.name}"? Photos will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('collections')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert('Deleted', 'Collection has been deleted');
              router.back();
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Could not delete collection');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFreshie = (freshieId: string) => {
    Alert.alert(
      'Remove Photo',
      'Remove this photo from the collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('freshie_collections')
                .delete()
                .eq('freshie_id', freshieId)
                .eq('collection_id', id);

              if (error) throw error;

              setFreshies(prev => prev.filter(f => f.id !== freshieId));
              setSelectedFreshie(null);
              Alert.alert('Removed', 'Photo removed from collection');
            } catch (error) {
              console.error('Error removing freshie:', error);
              Alert.alert('Error', 'Could not remove photo');
            }
          },
        },
      ]
    );
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'morning': return '#F59E0B';
      case 'afternoon': return '#EC4899';
      case 'evening': return '#8B7AB8';
      default: return colors.purple;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Loading..."
          subtitle=""
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading collection...</Text>
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Not Found"
          subtitle=""
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Collection not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title={collection.name}
        subtitle={collection.description || `${freshies.length} photos`}
        showAvatar={true}
      />

      {/* Collection Header */}
      <View style={[styles.collectionHeader, { backgroundColor: collection.color + '20' }]}>
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionIcon}>{collection.icon}</Text>
          <View style={styles.collectionDetails}>
            <Text style={styles.collectionName}>{collection.name}</Text>
            {collection.description && (
              <Text style={styles.collectionDescription}>{collection.description}</Text>
            )}
            <Text style={styles.collectionCount}>
              {freshies.length} {freshies.length === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
        </View>
        
        {!collection.is_system && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={24} color={colors.charcoal} />
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Options */}
      {showMenu && !collection.is_system && (
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => {
              setShowMenu(false);
              router.push(`/(child)/edit-collection/${id}`);
            }}
          >
            <Edit2 size={20} color={colors.charcoal} />
            <Text style={styles.menuOptionText}>Edit Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuOption, styles.menuOptionDanger]}
            onPress={() => {
              setShowMenu(false);
              handleDeleteCollection();
            }}
          >
            <Trash2 size={20} color={colors.red} />
            <Text style={[styles.menuOptionText, styles.menuOptionTextDanger]}>Delete Collection</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollContent}>
        {freshies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptyText}>
              Add photos to this collection from the gallery
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {freshies.map((freshie) => (
              <TouchableOpacity
                key={freshie.id}
                style={styles.gridItem}
                onPress={() => setSelectedFreshie(freshie)}
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
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Photos Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/(child)/add-to-collection?collectionId=${id}`)}
      >
        <Plus size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Full Screen Freshie Modal */}
      {selectedFreshie && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedFreshie.photo_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedFreshie(null)}
              >
                <ChevronLeft size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <View style={styles.freshieInfo}>
                <Text style={styles.freshieTitle}>{selectedFreshie.title}</Text>
                {selectedFreshie.mood_emoji && selectedFreshie.mood_word && (
                  <View style={styles.moodDisplay}>
                    <Text style={styles.moodDisplayEmoji}>{selectedFreshie.mood_emoji}</Text>
                    <Text style={styles.moodDisplayText}>{selectedFreshie.mood_word}</Text>
                  </View>
                )}
                {selectedFreshie.notes && (
                  <Text style={styles.freshieNotes}>{selectedFreshie.notes}</Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveFreshie(selectedFreshie.id)}
                >
                  <Trash2 size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.charcoal,
    marginTop: spacing[8],
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[6],
    backgroundColor: colors.cream,
  },
  collectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    flex: 1,
  },
  collectionIcon: {
    fontSize: 48,
  },
  collectionDetails: {
    flex: 1,
  },
  collectionName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  collectionDescription: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[1],
  },
  collectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  menuButton: {
    padding: spacing[2],
  },
  menuContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginTop: spacing[2],
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  menuOptionDanger: {
    borderBottomWidth: 0,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  menuOptionTextDanger: {
    color: colors.red,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: colors.cream,
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
  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[6],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContent: {
    flex: 1,
  },
  fullImage: {
    flex: 1,
    width: '100%',
  },
  modalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    paddingBottom: spacing[8],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  freshieInfo: {
    flex: 1,
  },
  freshieTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  moodDisplayEmoji: {
    fontSize: 20,
  },
  moodDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  freshieNotes: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
