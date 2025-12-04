import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight, Star, Calendar, Image as ImageIcon } from 'lucide-react-native';
import DetailPageHeader from '../../components/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[6] * 2 - spacing[4]) / 2;

interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_system: boolean;
  collection_type?: string;
  photo_count?: number;
  preview_images?: string[];
}

export default function CollectionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [systemCollections, setSystemCollections] = useState<Collection[]>([]);
  const [customCollections, setCustomCollections] = useState<Collection[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all collections
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('*')
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!collectionsData) {
        setLoading(false);
        return;
      }

      // Get photo counts and preview images for each collection
      const collectionsWithData = await Promise.all(
        collectionsData.map(async (collection) => {
          // Get photo count
          const { count } = await supabase
            .from('freshie_collections')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);

          // Get preview images (up to 4)
          const { data: freshies } = await supabase
            .from('freshie_collections')
            .select('freshie_id, freshies(photo_url)')
            .eq('collection_id', collection.id)
            .limit(4);

          const previewImages = freshies?.map((f: any) => f.freshies?.photo_url).filter(Boolean) || [];

          return {
            ...collection,
            photo_count: count || 0,
            preview_images: previewImages,
          };
        })
      );

      setCollections(collectionsWithData);
      
      // Separate system and custom collections
      const system = collectionsWithData.filter(c => c.is_system);
      const custom = collectionsWithData.filter(c => !c.is_system);
      
      setSystemCollections(system);
      setCustomCollections(custom);
    } catch (error) {
      console.error('Error loading collections:', error);
      Alert.alert('Error', 'Could not load collections');
    } finally {
      setLoading(false);
    }
  };

  const renderCollectionCard = (collection: Collection) => {
    const hasPhotos = collection.photo_count && collection.photo_count > 0;
    
    return (
      <TouchableOpacity
        key={collection.id}
        style={styles.collectionCard}
        onPress={() => router.push(`/(child)/collection/${collection.id}`)}
      >
        {/* Preview Grid or Empty State */}
        <View style={styles.previewContainer}>
          {hasPhotos && collection.preview_images && collection.preview_images.length > 0 ? (
            <View style={styles.previewGrid}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.previewCell,
                    !collection.preview_images![index] && { backgroundColor: collection.color + '40' }
                  ]}
                >
                  {collection.preview_images![index] && (
                    <Image
                      source={{ uri: collection.preview_images[index] }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}
              {/* Icon Overlay */}
              <View style={[styles.iconOverlay, { backgroundColor: collection.color }]}>
                <Text style={styles.iconOverlayText}>{collection.icon}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.emptyPreview, { backgroundColor: collection.color + '40' }]}>
              <Text style={styles.emptyPreviewIcon}>{collection.icon}</Text>
            </View>
          )}
        </View>

        {/* Collection Info */}
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName} numberOfLines={1}>
            {collection.name}
          </Text>
          <View style={styles.collectionMeta}>
            <ImageIcon size={12} color={colors.charcoal} opacity={0.6} />
            <Text style={styles.collectionCount}>
              {collection.photo_count || 0} {collection.photo_count === 1 ? 'photo' : 'photos'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Collections"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading your collections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Collections"
        subtitle="Organize your Freshies"
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{collections.length}</Text>
            <Text style={styles.statLabel}>Total Collections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {collections.reduce((sum, c) => sum + (c.photo_count || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Photos</Text>
          </View>
        </View>

        {/* Create New Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(child)/create-collection')}
        >
          <View style={styles.createButtonIcon}>
            <Plus size={24} color={colors.white} />
          </View>
          <View style={styles.createButtonText}>
            <Text style={styles.createButtonTitle}>Create New Collection</Text>
            <Text style={styles.createButtonSubtitle}>Make a custom album</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} opacity={0.4} />
        </TouchableOpacity>

        {/* System Collections */}
        {systemCollections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Collections</Text>
            <View style={styles.grid}>
              {systemCollections.map(renderCollectionCard)}
            </View>
          </View>
        )}

        {/* Custom Collections */}
        {customCollections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Collections</Text>
            <View style={styles.grid}>
              {customCollections.map(renderCollectionCard)}
            </View>
          </View>
        )}

        {/* Empty State for Custom Collections */}
        {customCollections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📁</Text>
            <Text style={styles.emptyTitle}>No custom collections yet</Text>
            <Text style={styles.emptyText}>
              Create your first collection to organize your Freshies!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(child)/create-collection')}
            >
              <Plus size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>Create Collection</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    gap: spacing[4],
    padding: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    padding: spacing[4],
    borderRadius: radii.xl,
    gap: spacing[3],
  },
  createButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    flex: 1,
  },
  createButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
  createButtonSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  collectionCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
  },
  previewGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewCell: {
    width: '50%',
    height: '50%',
    borderWidth: 1,
    borderColor: colors.white,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  iconOverlayText: {
    fontSize: 18,
  },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPreviewIcon: {
    fontSize: 48,
  },
  collectionInfo: {
    padding: spacing[3],
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  collectionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  collectionCount: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
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
    marginBottom: spacing[6],
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
