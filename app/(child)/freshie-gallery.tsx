import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash2, Share2, Calendar, Plus, Camera, Image as ImageIcon, Filter, Search, X, Edit2, Star, Download, Tag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width } = Dimensions.get('window');

// Predefined tag categories
const TAG_CATEGORIES = [
  { id: 'before', label: 'Before', emoji: '📸', color: colors.purple },
  { id: 'after', label: 'After', emoji: '✨', color: colors.mint },
  { id: 'progress', label: 'Progress', emoji: '📈', color: colors.yellow },
  { id: 'favorite', label: 'Favorite', emoji: '⭐', color: colors.peach },
  { id: 'routine', label: 'Routine', emoji: '🌟', color: colors.purple },
];

interface MoodOption {
  id: string;
  emoji: string;
  word: string;
  color: string;
}

interface UserProfile {
  id: string;
  user_id: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_system: boolean;
  collection_type: string;
  preview_images?: string[];
}

interface FreshieItem {
  id: string;
  photo_url: string;
  title: string;
  segment: string;
  notes?: string;
  tags?: string[];
  mood_emoji?: string;
  mood_word?: string;
  is_favorite: boolean;
  decorations?: any[];
  routine_id?: string;
  created_at: string;
  collections?: Collection[];
}

/**
 * Freshie Gallery Screen
 * Displays all Freshies taken by the child user
 */
export default function FreshieGalleryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [freshies, setFreshies] = useState<FreshieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFreshie, setSelectedFreshie] = useState<FreshieItem | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [groupBy, setGroupBy] = useState<'date' | 'segment' | 'tags'>('date');

  // Upload flow state
  const [uploadStep, setUploadStep] = useState<'mood' | 'collections' | 'note' | null>(null);
  const [pendingUploadUri, setPendingUploadUri] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [uploadNote, setUploadNote] = useState('');

  // Data from database
  const [moods, setMoods] = useState<MoodOption[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Multi-select mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFreshieIds, setSelectedFreshieIds] = useState<string[]>([]);

  // Filter and search state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filterMoods, setFilterMoods] = useState<string[]>([]);
  const [filterCollections, setFilterCollections] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'mood' | 'favorites'>('date');

  // New filter menu states
  const [sortByRecent, setSortByRecent] = useState(true);
  const [showFilterSubmenu, setShowFilterSubmenu] = useState(false);
  const [showViewOptionsSubmenu, setShowViewOptionsSubmenu] = useState(false);
  const [showMoodSubmenu, setShowMoodSubmenu] = useState(false);
  const [filterShowAll, setFilterShowAll] = useState(true);
  const [filterShowFavorites, setFilterShowFavorites] = useState(false);
  const [filterShowEdited, setFilterShowEdited] = useState(false);
  const [filterShowWithNotes, setFilterShowWithNotes] = useState(false);

  // View options states
  const [gridColumns, setGridColumns] = useState(3); // 3 or 4 columns
  const [showMoodBadges, setShowMoodBadges] = useState(true);
  const [showFavoriteStars, setShowFavoriteStars] = useState(true);
  const [showTimeBadges, setShowTimeBadges] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate image size based on grid columns
  const IMAGE_SIZE = (width - spacing[6] * 2 - spacing[3] * (gridColumns - 1)) / gridColumns;

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  // Load data
  useEffect(() => {
    loadFreshies();
    loadCollections();
    loadMoods();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    savePreferences();
  }, [gridColumns, showMoodBadges, showFavoriteStars, showTimeBadges]);

  // Reload collections when screen comes into focus (to update thumbnails)
  // Note: Using useEffect with router events instead of useFocusEffect
  useEffect(() => {
    // This will run on mount and when dependencies change
    // Collections will reload when navigating back
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem('gallery_preferences');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        setGridColumns(parsed.gridColumns ?? 3);
        setShowMoodBadges(parsed.showMoodBadges ?? true);
        setShowFavoriteStars(parsed.showFavoriteStars ?? true);
        setShowTimeBadges(parsed.showTimeBadges ?? true);
      }

      // Load recent searches
      const searches = await AsyncStorage.getItem('recent_searches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      const prefs = {
        gridColumns,
        showMoodBadges,
        showFavoriteStars,
        showTimeBadges,
      };
      await AsyncStorage.setItem('gallery_preferences', JSON.stringify(prefs));
    } catch (error) {
      console.log('Error saving preferences:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFreshies(),
      loadCollections(),
      loadMoods(),
    ]);
    setRefreshing(false);
  };

  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recent_searches');
    } catch (error) {
      console.log('Error clearing recent searches:', error);
    }
  };

  const getSearchSuggestions = () => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const suggestions: Array<{ type: string, value: string, emoji: string }> = [];

    // Check if user is typing a prefix search
    const prefixMatch = query.match(/^(\w+):(.*)$/);

    if (prefixMatch) {
      // User is typing prefix search - show relevant suggestions
      const [, prefix, value] = prefixMatch;
      const searchValue = value.trim().toLowerCase();

      // Get all tags with this prefix
      const allTags = new Set<string>();
      freshies.forEach(f => f.tags?.forEach(tag => {
        if (tag.toLowerCase().startsWith(`${prefix}:`)) {
          allTags.add(tag);
        }
      }));

      Array.from(allTags).forEach(tag => {
        if (!searchValue || tag.toLowerCase().includes(searchValue)) {
          const emoji = prefix === 'brand' ? '🏷️' :
            prefix === 'product' ? '🧴' :
              prefix === 'color' ? '🎨' :
                prefix === 'category' ? '📦' :
                  prefix === 'mood' ? '😊' :
                    prefix === 'time' || prefix === 'segment' ? '🕐' : '🏷️';
          suggestions.push({ type: prefix, value: tag, emoji });
        }
      });

      // If it's a mood prefix, also suggest mood options
      if (prefix === 'mood') {
        moods.forEach(mood => {
          if (!searchValue || mood.word.toLowerCase().includes(searchValue)) {
            suggestions.push({ type: 'mood', value: `mood:${mood.word}`, emoji: mood.emoji });
          }
        });
      }

      // If it's a segment/time prefix, suggest segments
      if (prefix === 'time' || prefix === 'segment') {
        ['morning', 'afternoon', 'evening'].forEach(seg => {
          if (!searchValue || seg.includes(searchValue)) {
            suggestions.push({ type: 'segment', value: `${prefix}:${seg}`, emoji: '🕐' });
          }
        });
      }
    } else {
      // Standard search - show all types of suggestions

      // Mood suggestions
      moods.forEach(mood => {
        if (mood.word.toLowerCase().includes(query) || mood.emoji.includes(query)) {
          suggestions.push({ type: 'mood', value: mood.word, emoji: mood.emoji });
        }
      });

      // Collection suggestions
      collections.forEach(collection => {
        if (collection.name.toLowerCase().includes(query)) {
          suggestions.push({ type: 'collection', value: collection.name, emoji: '📁' });
        }
      });

      // Tag suggestions from existing freshies
      const allTags = new Set<string>();
      freshies.forEach(f => f.tags?.forEach(tag => allTags.add(tag)));
      Array.from(allTags).forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          const isPrefixTag = tag.includes(':');
          const emoji = isPrefixTag ?
            (tag.startsWith('brand:') ? '🏷️' :
              tag.startsWith('product:') ? '🧴' :
                tag.startsWith('color:') ? '🎨' :
                  tag.startsWith('category:') ? '📦' : '🏷️') : '🏷️';
          suggestions.push({ type: 'tag', value: tag, emoji });
        }
      });

      // Show search prefix hints if no specific results
      if (suggestions.length === 0 && query.length >= 2) {
        const prefixHints = [
          { type: 'hint', value: `brand:${query}`, emoji: '🏷️' },
          { type: 'hint', value: `product:${query}`, emoji: '🧴' },
          { type: 'hint', value: `color:${query}`, emoji: '🎨' },
        ];
        suggestions.push(...prefixHints);
      }
    }

    return suggestions.slice(0, 8);
  };

  const loadMoods = () => {
    // Load predefined moods for filtering
    const predefinedMoods: MoodOption[] = [
      { id: 'happy', emoji: '😊', word: 'Happy', color: colors.yellow },
      { id: 'confident', emoji: '😎', word: 'Confident', color: colors.purple },
      { id: 'fresh', emoji: '✨', word: 'Fresh', color: colors.mint },
      { id: 'relaxed', emoji: '😌', word: 'Relaxed', color: colors.peach },
      { id: 'excited', emoji: '🤩', word: 'Excited', color: colors.lemon },
      { id: 'calm', emoji: '😇', word: 'Calm', color: colors.lavender },
    ];
    setMoods(predefinedMoods);
  };

  const loadCollections = async () => {
    if (!user?.id) return;

    try {
      // Get child profile
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Get all collections for this child (system collections only for now)
      const { data: collectionsData, error } = await supabase
        .from('collections')
        .select('*')
        .eq('child_profile_id', profile.id)
        .eq('is_system', true)
        .order('collection_type');

      if (error) throw error;

      // Load preview images for each collection
      if (collectionsData) {
        const collectionsWithPreviews = await Promise.all(
          collectionsData.map(async (collection) => {
            // Get up to 4 photos from this collection
            const { data: freshieLinks } = await supabase
              .from('freshie_collections')
              .select('freshie_id')
              .eq('collection_id', collection.id)
              .limit(4);

            if (freshieLinks && freshieLinks.length > 0) {
              const freshieIds = freshieLinks.map(link => link.freshie_id);
              const { data: freshies } = await supabase
                .from('freshies')
                .select('photo_url')
                .in('id', freshieIds)
                .limit(4);

              return {
                ...collection,
                preview_images: freshies?.map(f => f.photo_url) || [],
              };
            }

            return { ...collection, preview_images: [] };
          })
        );

        setCollections(collectionsWithPreviews);
      } else {
        setCollections([]);
      }

      // Debug: Log available collections
      console.log('Loaded collections:', collectionsData?.map(c => ({ id: c.id, name: c.name })));

      // Clear any selected collections that no longer exist
      if (collectionsData) {
        const validIds = collectionsData.map(c => c.id);
        setSelectedCollections(prev => prev.filter(id => validIds.includes(id)));
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const loadFreshies = async () => {
    if (!user?.id) return;

    try {
      // Get child profile
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get all freshies for this child
      const { data: freshiesData, error } = await supabase
        .from('freshies')
        .select('*')
        .eq('child_profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFreshies(freshiesData || []);
    } catch (error) {
      console.error('Error loading Freshies:', error);
      Alert.alert('Error', 'Could not load your Freshies');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreshie = async (freshie: FreshieItem) => {
    Alert.alert(
      'Delete Freshie?',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage
              const path = freshie.photo_url.split('/').slice(-2).join('/');
              await supabase.storage.from('freshies').remove([path]);

              // Delete from database
              const { error } = await supabase
                .from('freshies')
                .delete()
                .eq('id', freshie.id);

              if (error) throw error;

              // Remove from local state
              setFreshies(prev => prev.filter(f => f.id !== freshie.id));
              setSelectedFreshie(null);

              Alert.alert('✨ Freshie Deleted', 'Your photo has been removed');
            } catch (error) {
              console.error('Error deleting Freshie:', error);
              Alert.alert('Error', 'Could not delete your Freshie');
            }
          },
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    setShowUploadMenu(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Refresh collections to ensure they're up to date
      await loadCollections();

      setPendingUploadUri(result.assets[0].uri);
      setSelectedMood(null);
      setSelectedCollections([]);
      setUploadNote('');
      setUploadStep('mood');
    }
  };

  const handleUploadFromLibrary = async () => {
    setShowUploadMenu(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Refresh collections to ensure they're up to date
      await loadCollections();

      setPendingUploadUri(result.assets[0].uri);
      setSelectedMood(null);
      setSelectedCollections([]);
      setUploadNote('');
      setUploadStep('mood');
    }
  };

  const uploadFreshie = async (uri: string, tags: string[] = []) => {
    if (!user?.id) return;

    try {
      // Get child profile
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        Alert.alert('Error', 'Could not find your profile');
        return;
      }

      // Upload image to storage
      const fileName = `freshie_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      // For React Native, read the file as ArrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('freshies')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('freshies')
        .getPublicUrl(uploadData.path);

      console.log('📸 Uploaded freshie URL:', publicUrl);
      console.log('📸 Upload path:', uploadData.path);

      // Determine segment based on current time
      const hour = new Date().getHours();
      let segment = 'morning';
      if (hour >= 12 && hour < 17) segment = 'afternoon';
      else if (hour >= 17) segment = 'evening';

      // Create freshie record
      const { data: newFreshie, error: freshieError } = await supabase
        .from('freshies')
        .insert({
          child_profile_id: profile.id,
          photo_url: publicUrl,
          title: 'My Freshie',
          segment,
          tags: tags.length > 0 ? tags : null,
          mood_emoji: selectedMood?.emoji || null,
          mood_word: selectedMood?.word || null,
          is_favorite: false,
        })
        .select()
        .single();

      if (freshieError) throw freshieError;

      // Add to selected collections
      if (selectedCollections.length > 0) {
        console.log('Attempting to add to collections:', selectedCollections);

        // First, verify all collection IDs exist in the database
        const { data: validCollections, error: validateError } = await supabase
          .from('collections')
          .select('id')
          .in('id', selectedCollections);

        console.log('Valid collections found:', validCollections);

        if (validateError) {
          console.error('Error validating collections:', validateError);
        } else if (validCollections) {
          const validCollectionIds = validCollections.map(c => c.id);
          const invalidIds = selectedCollections.filter(id => !validCollectionIds.includes(id));

          if (invalidIds.length > 0) {
            console.warn('Some collections no longer exist:', invalidIds);
            // Refresh collections to update UI
            await loadCollections();
          }

          // Only insert valid collection IDs
          if (validCollectionIds.length > 0) {
            const collectionInserts = validCollectionIds.map(collectionId => ({
              freshie_id: newFreshie.id,
              collection_id: collectionId,
            }));

            const { error: collectionError } = await supabase
              .from('freshie_collections')
              .insert(collectionInserts);

            if (collectionError) {
              console.error('Error adding to collections:', collectionError);
            }
          }
        }
      }

      // Add to local state
      setFreshies(prev => [newFreshie, ...prev]);

      // Refresh collections to ensure they're up to date
      await loadCollections();

      Alert.alert('✨ Freshie Added!', 'Your photo has been added to the gallery');
    } catch (error) {
      console.error('Error uploading Freshie:', error);
      Alert.alert('Error', 'Could not upload your photo');
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

  const getSegmentEmoji = (segment: string) => {
    switch (segment) {
      case 'morning': return '☀️';
      case 'afternoon': return '🌤️';
      case 'evening': return '🌙';
      default: return '✨';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return 'This Week';
    if (diffDays < 30) return 'This Month';

    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter and search freshies
  const getFilteredFreshies = () => {
    let filtered = [...freshies];

    // Unified global search with prefix support
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      // Check if using prefix search (e.g., "brand:cerave", "color:purple")
      const prefixMatch = query.match(/^(\w+):(.+)$/);

      if (prefixMatch) {
        // Prefix-based search
        const [, prefix, value] = prefixMatch;
        const searchValue = value.trim();

        filtered = filtered.filter(freshie => {
          // Search in tags with prefix format
          const hasMatchingTag = freshie.tags?.some(tag => {
            const tagLower = tag.toLowerCase();
            return tagLower === `${prefix}:${searchValue}` ||
              tagLower.startsWith(`${prefix}:`) && tagLower.includes(searchValue);
          });

          // Also support natural language matching for common prefixes
          switch (prefix) {
            case 'brand':
            case 'product':
            case 'color':
            case 'category':
              return hasMatchingTag ||
                freshie.title?.toLowerCase().includes(searchValue) ||
                freshie.notes?.toLowerCase().includes(searchValue);

            case 'mood':
              return freshie.mood_word?.toLowerCase().includes(searchValue) ||
                freshie.mood_emoji?.includes(searchValue) ||
                hasMatchingTag;

            case 'time':
            case 'segment':
              return freshie.segment?.toLowerCase().includes(searchValue) || hasMatchingTag;

            case 'tag':
              return hasMatchingTag;

            default:
              return hasMatchingTag;
          }
        });
      } else {
        // Standard search - match across all fields
        filtered = filtered.filter(freshie => {
          // Match title, notes
          const matchesText =
            freshie.title?.toLowerCase().includes(query) ||
            freshie.notes?.toLowerCase().includes(query);

          // Match tags (including prefix tags)
          const matchesTags = freshie.tags?.some(tag => {
            const tagLower = tag.toLowerCase();
            // Match full tag or the value part of prefix tags
            return tagLower.includes(query) ||
              tagLower.split(':')[1]?.includes(query);
          });

          // Match mood
          const matchesMood =
            freshie.mood_word?.toLowerCase().includes(query) ||
            freshie.mood_emoji?.includes(query);

          // Match segment
          const matchesSegment = freshie.segment?.toLowerCase().includes(query);

          return matchesText || matchesTags || matchesMood || matchesSegment;
        });
      }
    }

    // Favorites filter
    if (showFavoritesOnly || filterShowFavorites) {
      filtered = filtered.filter(freshie => freshie.is_favorite);
    }

    // Edited filter - show only freshies with decorations
    if (filterShowEdited) {
      filtered = filtered.filter(freshie =>
        freshie.decorations && Object.keys(freshie.decorations).length > 0
      );
    }

    // With Notes filter - show only freshies with notes/captions
    if (filterShowWithNotes) {
      filtered = filtered.filter(freshie =>
        freshie.notes && freshie.notes.trim().length > 0
      );
    }

    // Mood filter
    if (filterMoods.length > 0) {
      filtered = filtered.filter(freshie =>
        freshie.mood_emoji && filterMoods.includes(freshie.mood_emoji)
      );
    }

    // Tags filter
    if (filterTags.length > 0) {
      filtered = filtered.filter(freshie =>
        freshie.tags && freshie.tags.some(tag => filterTags.includes(tag))
      );
    }

    // Sort
    if (sortBy === 'favorites') {
      filtered.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
    } else if (sortBy === 'mood') {
      filtered.sort((a, b) => {
        if (!a.mood_word && !b.mood_word) return 0;
        if (!a.mood_word) return 1;
        if (!b.mood_word) return -1;
        return a.mood_word.localeCompare(b.mood_word);
      });
    }
    // date sorting is default (already sorted from query)

    return filtered;
  };

  const groupFreshies = () => {
    const filtered = getFilteredFreshies();

    if (groupBy === 'segment') {
      const grouped: { [key: string]: FreshieItem[] } = {
        morning: [],
        afternoon: [],
        evening: [],
      };

      filtered.forEach(freshie => {
        if (grouped[freshie.segment]) {
          grouped[freshie.segment].push(freshie);
        }
      });

      return Object.entries(grouped)
        .filter(([_, items]) => items.length > 0)
        .map(([segment, items]) => ({ title: segment, data: items }));
    } else {
      const grouped: { [key: string]: FreshieItem[] } = {};

      filtered.forEach(freshie => {
        const group = getDateGroup(freshie.created_at);
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(freshie);
      });

      const order = ['Today', 'Yesterday', 'This Week', 'This Month'];
      return Object.entries(grouped)
        .sort(([a], [b]) => {
          const aIndex = order.indexOf(a);
          const bIndex = order.indexOf(b);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          return b.localeCompare(a);
        })
        .map(([title, data]) => ({ title, data }));
    }
  };

  const groupedFreshies = groupFreshies();
  const filteredCount = getFilteredFreshies().length;
  const hasActiveFilters = searchQuery || showFavoritesOnly || filterMoods.length > 0 || filterTags.length > 0 || filterCollections.length > 0;

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Freshie Gallery"
        subtitle="Your skincare photos"
        showAvatar={true}
      />

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={{ flex: 1 }} />

        <View style={styles.rightControls}>
          {freshies.length > 0 && !isSelectMode && (
            <TouchableOpacity
              style={styles.filterIconButton}
              onPress={() => {
                console.log('Filter menu button pressed');
                setShowFilterMenu(true);
              }}
            >
              <Filter size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          {freshies.length > 0 && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedFreshieIds([]);
              }}
            >
              <Text style={styles.selectButtonText}>
                {isSelectMode ? 'Done' : 'Select'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Collections Section */}
      {collections.length > 0 && !isSelectMode && (
        <View style={styles.collectionsSection}>
          <View style={styles.collectionsSectionHeader}>
            <Text style={styles.collectionsSectionTitle}>Collections</Text>
            <View style={styles.collectionsHeaderButtons}>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/(child)/collections')}
              >
                <Text style={styles.viewAllText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createCollectionButton}
                onPress={() => router.push('/(child)/create-collection')}
              >
                <Plus size={16} color={colors.purple} />
                <Text style={styles.createCollectionText}>New</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsScroll}>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={styles.collectionCard}
                onPress={() => router.push(`/(child)/collection/${collection.id}`)}
              >
                {collection.preview_images && collection.preview_images?.length > 0 ? (
                  <View style={styles.collectionPreviewGrid}>
                    {[0, 1, 2, 3].map((index) => (
                      <View key={index} style={styles.collectionPreviewCell}>
                        {collection.preview_images?.[index] ? (
                          <Image
                            source={{ uri: collection.preview_images[index] }}
                            style={styles.collectionPreviewImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.collectionPreviewEmpty, { backgroundColor: collection.color + '40' }]} />
                        )}
                      </View>
                    ))}
                    <View style={styles.collectionOverlay}>
                      <Text style={styles.collectionOverlayIcon}>{collection.icon}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.collectionEmptyPreview, { backgroundColor: collection.color + '20' }]}>
                    <Text style={styles.collectionCardIcon}>{collection.icon}</Text>
                  </View>
                )}
                <Text style={styles.collectionCardName}>{collection.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      {freshies.length > 0 && !isSelectMode && (
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.charcoal} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Freshies..."
              placeholderTextColor={colors.charcoal + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  saveRecentSearch(searchQuery);
                  setShowSearchSuggestions(false);
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.charcoal} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Suggestions Dropdown */}
          {showSearchSuggestions && (searchQuery.trim() || recentSearches.length > 0) && (
            <View style={styles.searchSuggestionsContainer}>
              {searchQuery.trim() ? (
                // Show smart suggestions based on query
                <>
                  {getSearchSuggestions().length > 0 ? (
                    <>
                      <Text style={styles.suggestionsSectionTitle}>Suggestions</Text>
                      {getSearchSuggestions().map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => {
                            setSearchQuery(suggestion.value);
                            saveRecentSearch(suggestion.value);
                            setShowSearchSuggestions(false);
                          }}
                        >
                          <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                          <Text style={styles.suggestionText}>{suggestion.value}</Text>
                          <Text style={styles.suggestionType}>{suggestion.type}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : null}
                </>
              ) : (
                // Show recent searches when no query
                <>
                  <View style={styles.suggestionsHeader}>
                    <Text style={styles.suggestionsSectionTitle}>Recent</Text>
                    {recentSearches.length > 0 && (
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text style={styles.clearRecentsText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setSearchQuery(search);
                        setShowSearchSuggestions(false);
                      }}
                    >
                      <Search size={16} color={colors.charcoal} />
                      <Text style={styles.suggestionText}>{search}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Search Examples/Hints */}
                  {recentSearches.length === 0 && (
                    <>
                      <Text style={[styles.suggestionsSectionTitle, { marginTop: spacing[3] }]}>Search Examples</Text>
                      <View style={styles.searchHintsContainer}>
                        <Text style={styles.searchHintItem}>🏷️ brand:cerave</Text>
                        <Text style={styles.searchHintItem}>🧴 product:cleanser</Text>
                        <Text style={styles.searchHintItem}>🎨 color:purple</Text>
                        <Text style={styles.searchHintItem}>📦 category:serum</Text>
                        <Text style={styles.searchHintItem}>😊 mood:happy</Text>
                        <Text style={styles.searchHintItem}>🕐 time:morning</Text>
                      </View>
                      <Text style={styles.searchHintNote}>
                        Tip: Use tags like "brand:cerave" when uploading to enable advanced search!
                      </Text>
                    </>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      )}

      {/* Active Filters Display */}
      {(showFavoritesOnly || filterMoods.length > 0 || filterTags.length > 0 || filterCollections.length > 0) && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {showFavoritesOnly && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => setShowFavoritesOnly(false)}
              >
                <Text style={styles.filterChipText}>⭐ Favorites</Text>
                <X size={14} color={colors.white} />
              </TouchableOpacity>
            )}
            {filterMoods.map(mood => (
              <TouchableOpacity
                key={mood}
                style={styles.filterChip}
                onPress={() => setFilterMoods(prev => prev.filter(m => m !== mood))}
              >
                <Text style={styles.filterChipText}>{mood}</Text>
                <X size={14} color={colors.white} />
              </TouchableOpacity>
            ))}
            {filterTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.filterChip}
                onPress={() => setFilterTags(prev => prev.filter(t => t !== tag))}
              >
                <Text style={styles.filterChipText}>{tag}</Text>
                <X size={14} color={colors.white} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setShowFavoritesOnly(false);
                setFilterMoods([]);
                setFilterTags([]);
                setFilterCollections([]);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purple}
            colors={[colors.purple]}
          />
        }
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading your Freshies...</Text>
        ) : freshies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>No Freshies yet!</Text>
            <Text style={styles.emptyText}>
              Take photos during your routine to see them here
            </Text>
          </View>
        ) : filteredCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search
            </Text>
          </View>
        ) : (
          <View>
            {groupedFreshies.map((group) => (
              <View key={group.title} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>
                    {groupBy === 'segment' ? getSegmentEmoji(group.title) : ''} {group.title.charAt(0).toUpperCase() + group.title.slice(1)}
                  </Text>
                  <Text style={styles.groupCount}>{group.data.length}</Text>
                </View>
                <View style={styles.grid}>
                  {group.data.map((freshie) => {
                    const isSelected = selectedFreshieIds.includes(freshie.id);
                    return (
                      <TouchableOpacity
                        key={freshie.id}
                        style={[
                          styles.gridItem,
                          { width: IMAGE_SIZE, height: IMAGE_SIZE },
                          isSelectMode && isSelected && styles.gridItemSelected
                        ]}
                        onPress={() => {
                          if (isSelectMode) {
                            // Toggle selection
                            setSelectedFreshieIds(prev =>
                              prev.includes(freshie.id)
                                ? prev.filter(id => id !== freshie.id)
                                : [...prev, freshie.id]
                            );
                          } else {
                            setSelectedFreshie(freshie);
                          }
                        }}
                        onLongPress={() => {
                          if (!isSelectMode) {
                            setIsSelectMode(true);
                            setSelectedFreshieIds([freshie.id]);
                          }
                        }}
                      >
                        <Image
                          source={{ uri: freshie.photo_url }}
                          style={styles.gridImage}
                          onError={(error) => console.log('Image load error:', error.nativeEvent.error, 'URL:', freshie.photo_url)}
                          onLoad={() => console.log('Image loaded successfully:', freshie.photo_url)}
                        />

                        {/* Mood badge - top left */}
                        {showMoodBadges && freshie.mood_emoji && (
                          <View style={styles.moodBadge}>
                            <Text style={styles.moodBadgeEmoji}>{freshie.mood_emoji}</Text>
                          </View>
                        )}

                        {/* Favorite star - top right */}
                        {showFavoriteStars && freshie.is_favorite && (
                          <View style={styles.favoriteBadge}>
                            <Text style={styles.favoriteBadgeEmoji}>⭐</Text>
                          </View>
                        )}

                        {/* Segment badge - bottom right (only when grouped by date) */}
                        {showTimeBadges && groupBy === 'date' && (
                          <View style={[styles.segmentBadge, { backgroundColor: getSegmentColor(freshie.segment) }]}>
                            <Text style={styles.segmentEmoji}>{getSegmentEmoji(freshie.segment)}</Text>
                          </View>
                        )}

                        {/* Selection checkbox */}
                        {isSelectMode && (
                          <View style={styles.selectionCheckbox}>
                            <View style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected
                            ]}>
                              {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Batch Actions Bar */}
      {isSelectMode && selectedFreshieIds.length > 0 && (
        <View style={styles.batchActionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.batchActionsScroll}>
            {/* Favorite Toggle */}
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={async () => {
                try {
                  // Check if any selected photos are not favorited
                  const selectedFreshies = freshies.filter(f => selectedFreshieIds.includes(f.id));
                  const anyNotFavorited = selectedFreshies.some(f => !f.is_favorite);
                  const newFavoriteState = anyNotFavorited;

                  const { error } = await supabase
                    .from('freshies')
                    .update({ is_favorite: newFavoriteState })
                    .in('id', selectedFreshieIds);

                  if (error) throw error;

                  setFreshies(prev => prev.map(f =>
                    selectedFreshieIds.includes(f.id) ? { ...f, is_favorite: newFavoriteState } : f
                  ));

                  Alert.alert('✨ Updated!', `${selectedFreshieIds.length} photos ${newFavoriteState ? 'added to' : 'removed from'} favorites`);
                  setIsSelectMode(false);
                  setSelectedFreshieIds([]);
                } catch (error) {
                  console.error('Error updating favorites:', error);
                  Alert.alert('Error', 'Could not update favorites');
                }
              }}
            >
              <Star size={20} color={colors.white} />
              <Text style={styles.batchActionText}>Favorite</Text>
            </TouchableOpacity>

            {/* Add to Collection */}
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => {
                Alert.alert(
                  'Add to Collection',
                  'Choose a collection',
                  [
                    ...collections.map(collection => ({
                      text: `${collection.icon} ${collection.name}`,
                      onPress: async () => {
                        try {
                          const inserts = selectedFreshieIds.map(freshieId => ({
                            freshie_id: freshieId,
                            collection_id: collection.id,
                          }));

                          const { error } = await supabase
                            .from('freshie_collections')
                            .insert(inserts)
                            .select();

                          if (error) throw error;

                          Alert.alert('✨ Added!', `${selectedFreshieIds.length} photos added to ${collection.name}`);
                          setIsSelectMode(false);
                          setSelectedFreshieIds([]);
                        } catch (error) {
                          console.error('Error adding to collection:', error);
                          Alert.alert('Error', 'Could not add photos to collection');
                        }
                      },
                    })),
                    { text: 'Cancel', style: 'cancel' },
                  ],
                  { cancelable: true }
                );
              }}
            >
              <Plus size={20} color={colors.white} />
              <Text style={styles.batchActionText}>Collection</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => {
                Alert.alert(
                  'Share with Parents',
                  `Share ${selectedFreshieIds.length} ${selectedFreshieIds.length === 1 ? 'photo' : 'photos'} with your parents?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Share',
                      onPress: () => {
                        // TODO: Implement actual sharing logic
                        Alert.alert('✨ Shared!', 'Your photos have been shared with your parents');
                        setIsSelectMode(false);
                        setSelectedFreshieIds([]);
                      },
                    },
                  ]
                );
              }}
            >
              <Share2 size={20} color={colors.white} />
              <Text style={styles.batchActionText}>Share</Text>
            </TouchableOpacity>

            {/* Export */}
            <TouchableOpacity
              style={styles.batchActionButton}
              onPress={() => {
                Alert.alert(
                  'Export Photos',
                  `Export ${selectedFreshieIds.length} ${selectedFreshieIds.length === 1 ? 'photo' : 'photos'}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Export',
                      onPress: () => {
                        // TODO: Implement actual export logic
                        Alert.alert('✨ Exported!', 'Your photos have been saved to your device');
                        setIsSelectMode(false);
                        setSelectedFreshieIds([]);
                      },
                    },
                  ]
                );
              }}
            >
              <Download size={20} color={colors.white} />
              <Text style={styles.batchActionText}>Export</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.batchActionButton, styles.batchActionButtonDanger]}
              onPress={() => {
                Alert.alert(
                  'Delete Photos',
                  `Delete ${selectedFreshieIds.length} ${selectedFreshieIds.length === 1 ? 'photo' : 'photos'}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { error } = await supabase
                            .from('freshies')
                            .delete()
                            .in('id', selectedFreshieIds);

                          if (error) throw error;

                          setFreshies(prev => prev.filter(f => !selectedFreshieIds.includes(f.id)));
                          setIsSelectMode(false);
                          setSelectedFreshieIds([]);
                          Alert.alert('Deleted', 'Photos have been deleted');
                        } catch (error) {
                          console.error('Error deleting freshies:', error);
                          Alert.alert('Error', 'Could not delete photos');
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Trash2 size={20} color={colors.white} />
              <Text style={styles.batchActionText}>Delete</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Full Screen Freshie Modal */}
      {selectedFreshie && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedFreshie.photo_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedFreshie(null)}
              >
                <ChevronLeft size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.freshieInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.freshieTitle}>{selectedFreshie.title}</Text>
                  {selectedFreshie.is_favorite && (
                    <Text style={styles.favoriteIcon}>⭐</Text>
                  )}
                </View>

                {/* Mood display */}
                {selectedFreshie.mood_emoji && selectedFreshie.mood_word && (
                  <View style={styles.moodDisplay}>
                    <Text style={styles.moodDisplayEmoji}>{selectedFreshie.mood_emoji}</Text>
                    <Text style={styles.moodDisplayText}>Feeling {selectedFreshie.mood_word}</Text>
                  </View>
                )}

                <View style={styles.freshieMeta}>
                  <View style={[styles.segmentTag, { backgroundColor: getSegmentColor(selectedFreshie.segment) }]}>
                    <Text style={styles.segmentTagText}>
                      {getSegmentEmoji(selectedFreshie.segment)} {selectedFreshie.segment}
                    </Text>
                  </View>
                  <View style={styles.dateTag}>
                    <Calendar size={12} color={colors.charcoal} />
                    <Text style={styles.dateText}>{formatDate(selectedFreshie.created_at)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    const freshieId = selectedFreshie.id;
                    setSelectedFreshie(null);
                    router.push(`/(child)/edit-freshie/${freshieId}`);
                  }}
                >
                  <Edit2 size={20} color={colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // TODO: Implement share functionality
                    Alert.alert('Coming Soon!', 'Share with parents feature coming soon');
                  }}
                >
                  <Share2 size={20} color={colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteFreshie(selectedFreshie)}
                >
                  <Trash2 size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowUploadMenu(!showUploadMenu)}
      >
        <Plus size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Upload Menu */}
      {showUploadMenu && (
        <View style={styles.uploadMenu}>
          <TouchableOpacity
            style={[styles.uploadOption, styles.cameraOption]}
            onPress={handleTakePhoto}
          >
            <Camera size={24} color={colors.white} />
            <Text style={styles.uploadOptionText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadOption, styles.libraryOption]}
            onPress={handleUploadFromLibrary}
          >
            <ImageIcon size={24} color={colors.white} />
            <Text style={styles.uploadOptionText}>Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Flow Modal - Step 1: Mood */}
      {uploadStep === 'mood' && pendingUploadUri && (
        <View style={styles.uploadModal}>
          <View style={styles.uploadModalContent}>
            <Text style={styles.uploadModalTitle}>How are you feeling? 💭</Text>
            <Text style={styles.uploadModalSubtitle}>Pick a mood for this Freshie</Text>

            <ScrollView style={styles.moodList} showsVerticalScrollIndicator={false}>
              <View style={styles.moodGrid}>
                {[
                  { id: 'happy', emoji: '😊', word: 'Happy', color: '#FCD34D' },
                  { id: 'proud', emoji: '🌟', word: 'Proud', color: '#A78BFA' },
                  { id: 'calm', emoji: '😌', word: 'Calm', color: '#A7F3D0' },
                  { id: 'silly', emoji: '😜', word: 'Silly', color: '#FBCFE8' },
                  { id: 'tired', emoji: '😴', word: 'Tired', color: '#94A3B8' },
                  { id: 'confident', emoji: '💪', word: 'Confident', color: '#FCD34D' },
                ].map((mood) => {
                  const isSelected = selectedMood?.id === mood.id;
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodOption,
                        isSelected && { backgroundColor: mood.color, borderColor: mood.color }
                      ]}
                      onPress={() => setSelectedMood(mood)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                        {mood.word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.uploadModalActions}>
              <TouchableOpacity
                style={[styles.uploadActionButton, styles.uploadCancelButton]}
                onPress={() => {
                  setUploadStep(null);
                  setPendingUploadUri(null);
                  setSelectedMood(null);
                }}
              >
                <Text style={styles.uploadCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadActionButton, styles.uploadNextButton]}
                onPress={() => setUploadStep('collections')}
              >
                <Text style={styles.uploadNextText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Upload Flow Modal - Step 2: Collections */}
      {uploadStep === 'collections' && pendingUploadUri && (
        <View style={styles.uploadModal}>
          <View style={styles.uploadModalContent}>
            <Text style={styles.uploadModalTitle}>Add to Collection 📁</Text>
            <Text style={styles.uploadModalSubtitle}>Pick collections for this Freshie (optional)</Text>

            <ScrollView style={styles.collectionList} showsVerticalScrollIndicator={false}>
              {collections.length === 0 ? (
                <Text style={styles.noCollectionsText}>Loading collections...</Text>
              ) : (
                <View style={styles.collectionGrid}>
                  {collections.map((collection) => {
                    const isSelected = selectedCollections.includes(collection.id);
                    return (
                      <TouchableOpacity
                        key={collection.id}
                        style={[
                          styles.collectionOption,
                          isSelected && {
                            backgroundColor: collection.color,
                            borderColor: collection.color
                          }
                        ]}
                        onPress={() => {
                          setSelectedCollections(prev =>
                            prev.includes(collection.id)
                              ? prev.filter(id => id !== collection.id)
                              : [...prev, collection.id]
                          );
                        }}
                      >
                        <Text style={styles.collectionIcon}>{collection.icon}</Text>
                        <View style={styles.collectionInfo}>
                          <Text style={[
                            styles.collectionName,
                            isSelected && styles.collectionNameSelected
                          ]}>
                            {collection.name}
                          </Text>
                          {collection.description && (
                            <Text style={[
                              styles.collectionDesc,
                              isSelected && styles.collectionDescSelected
                            ]}>
                              {collection.description}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.uploadModalActions}>
              <TouchableOpacity
                style={[styles.uploadActionButton, styles.uploadBackButton]}
                onPress={() => setUploadStep('mood')}
              >
                <Text style={styles.uploadBackText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadActionButton, styles.uploadSaveButton]}
                onPress={async () => {
                  setUploadStep(null);
                  if (pendingUploadUri) {
                    await uploadFreshie(pendingUploadUri, []);
                    setPendingUploadUri(null);
                    setSelectedMood(null);
                    setSelectedCollections([]);
                  }
                }}
              >
                <Text style={styles.uploadSaveText}>Save Freshie ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Filter Menu Modal - iOS Photos Style */}
      <Modal
        visible={showFilterMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowFilterMenu(false);
          setShowFilterSubmenu(false);
          setShowViewOptionsSubmenu(false);
          setShowMoodSubmenu(false);
        }}
      >
        <TouchableOpacity
          style={styles.filterMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowFilterMenu(false);
            setShowFilterSubmenu(false);
            setShowViewOptionsSubmenu(false);
            setShowMoodSubmenu(false);
          }}
        >
          <View style={styles.filterMenuContent}>
            {/* Main Menu */}
            {!showFilterSubmenu && !showViewOptionsSubmenu && !showMoodSubmenu && (
              <>
                {/* Sort by Recently Added */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setSortByRecent(true);
                    setGroupBy('date');
                    setShowFilterMenu(false);
                  }}
                >
                  <Calendar size={20} color={colors.charcoal} />
                  <Text style={styles.filterMenuItemText}>Sort by Recently Added</Text>
                  {sortByRecent && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                {/* Sort by Date Captured */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setSortByRecent(false);
                    setGroupBy('date');
                    setShowFilterMenu(false);
                  }}
                >
                  <Calendar size={20} color={colors.charcoal} />
                  <Text style={styles.filterMenuItemText}>Sort by Date Captured</Text>
                  {!sortByRecent && groupBy === 'date' && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* Filter Submenu */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => setShowFilterSubmenu(true)}
                >
                  <Filter size={20} color={colors.charcoal} />
                  <Text style={styles.filterMenuItemText}>Filter</Text>
                  <ChevronRight size={20} color={colors.charcoal} style={styles.filterMenuChevron} />
                </TouchableOpacity>

                {/* View Options Submenu */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => setShowViewOptionsSubmenu(true)}
                >
                  <Text style={styles.filterMenuItemEmoji}>👁️</Text>
                  <Text style={styles.filterMenuItemText}>View Options</Text>
                  <ChevronRight size={20} color={colors.charcoal} style={styles.filterMenuChevron} />
                </TouchableOpacity>
              </>
            )}

            {/* Filter Submenu */}
            {showFilterSubmenu && (
              <>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.filterMenuHeader}
                  onPress={() => setShowFilterSubmenu(false)}
                >
                  <ChevronLeft size={20} color={colors.purple} />
                  <Text style={styles.filterMenuHeaderText}>Filter</Text>
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* All Items */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterShowAll(true);
                    setFilterShowFavorites(false);
                    setFilterShowEdited(false);
                    setFilterShowWithNotes(false);
                    setShowFavoritesOnly(false);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>📸</Text>
                  <Text style={styles.filterMenuItemText}>All Items</Text>
                  {filterShowAll && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                {/* Favorites */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterShowAll(false);
                    setFilterShowFavorites(true);
                    setFilterShowEdited(false);
                    setFilterShowWithNotes(false);
                    setShowFavoritesOnly(true);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>⭐</Text>
                  <Text style={styles.filterMenuItemText}>Favorites</Text>
                  {filterShowFavorites && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                {/* Edited */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterShowAll(false);
                    setFilterShowFavorites(false);
                    setFilterShowEdited(true);
                    setFilterShowWithNotes(false);
                  }}
                >
                  <Edit2 size={20} color={colors.charcoal} />
                  <Text style={styles.filterMenuItemText}>Edited</Text>
                  {filterShowEdited && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                {/* With Notes */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterShowAll(false);
                    setFilterShowFavorites(false);
                    setFilterShowEdited(false);
                    setFilterShowWithNotes(true);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>📝</Text>
                  <Text style={styles.filterMenuItemText}>With Notes</Text>
                  {filterShowWithNotes && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* By Mood */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => setShowMoodSubmenu(true)}
                >
                  <Text style={styles.filterMenuItemEmoji}>😊</Text>
                  <Text style={styles.filterMenuItemText}>By Mood</Text>
                  <ChevronRight size={20} color={colors.charcoal} style={styles.filterMenuChevron} />
                </TouchableOpacity>

                {/* By Time of Day */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setGroupBy('segment');
                    setShowFilterSubmenu(false);
                    setShowFilterMenu(false);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>☀️</Text>
                  <Text style={styles.filterMenuItemText}>By Time of Day</Text>
                  {groupBy === 'segment' && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                {/* In Collections */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    // Navigate to collections view
                    router.push('/(child)/collections');
                    setShowFilterMenu(false);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>📁</Text>
                  <Text style={styles.filterMenuItemText}>In Collections</Text>
                </TouchableOpacity>
              </>
            )}

            {/* View Options Submenu */}
            {showViewOptionsSubmenu && (
              <>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.filterMenuHeader}
                  onPress={() => setShowViewOptionsSubmenu(false)}
                >
                  <ChevronLeft size={20} color={colors.purple} />
                  <Text style={styles.filterMenuHeaderText}>View Options</Text>
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* Grid Size Options */}
                <View style={styles.filterMenuSection}>
                  <Text style={styles.filterMenuSectionTitle}>Grid Size</Text>

                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => setGridColumns(4)}
                  >
                    <Text style={styles.filterMenuItemEmoji}>🔍</Text>
                    <Text style={styles.filterMenuItemText}>Zoom In (Smaller Grid)</Text>
                    {gridColumns === 4 && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => setGridColumns(3)}
                  >
                    <Text style={styles.filterMenuItemEmoji}>🔎</Text>
                    <Text style={styles.filterMenuItemText}>Zoom Out (Larger Grid)</Text>
                    {gridColumns === 3 && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>
                </View>

                <View style={styles.filterMenuDivider} />

                {/* Show Options */}
                <View style={styles.filterMenuSection}>
                  <Text style={styles.filterMenuSectionTitle}>Show:</Text>

                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => setShowMoodBadges(!showMoodBadges)}
                  >
                    <Text style={styles.filterMenuItemEmoji}>😊</Text>
                    <Text style={styles.filterMenuItemText}>Mood Badges</Text>
                    {showMoodBadges && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => setShowFavoriteStars(!showFavoriteStars)}
                  >
                    <Text style={styles.filterMenuItemEmoji}>⭐</Text>
                    <Text style={styles.filterMenuItemText}>Favorite Stars</Text>
                    {showFavoriteStars && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterMenuItem}
                    onPress={() => setShowTimeBadges(!showTimeBadges)}
                  >
                    <Text style={styles.filterMenuItemEmoji}>☀️</Text>
                    <Text style={styles.filterMenuItemText}>Time Badges</Text>
                    {showTimeBadges && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* By Mood Submenu */}
            {showMoodSubmenu && (
              <>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.filterMenuHeader}
                  onPress={() => setShowMoodSubmenu(false)}
                >
                  <ChevronLeft size={20} color={colors.purple} />
                  <Text style={styles.filterMenuHeaderText}>Filter by Mood</Text>
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* All Moods */}
                <TouchableOpacity
                  style={styles.filterMenuItem}
                  onPress={() => {
                    setFilterMoods([]);
                    setShowMoodSubmenu(false);
                    setShowFilterSubmenu(false);
                    setShowFilterMenu(false);
                  }}
                >
                  <Text style={styles.filterMenuItemEmoji}>✨</Text>
                  <Text style={styles.filterMenuItemText}>All Moods</Text>
                  {filterMoods.length === 0 && <Text style={styles.filterMenuCheck}>✓</Text>}
                </TouchableOpacity>

                <View style={styles.filterMenuDivider} />

                {/* Individual Moods */}
                {moods.map(mood => (
                  <TouchableOpacity
                    key={mood.id}
                    style={styles.filterMenuItem}
                    onPress={() => {
                      setFilterMoods([mood.emoji]);
                      setShowMoodSubmenu(false);
                      setShowFilterSubmenu(false);
                      setShowFilterMenu(false);
                    }}
                  >
                    <Text style={styles.filterMenuItemEmoji}>{mood.emoji}</Text>
                    <Text style={styles.filterMenuItemText}>{mood.word}</Text>
                    {filterMoods.includes(mood.emoji) && <Text style={styles.filterMenuCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.cream,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  filterIconButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: spacing[6],
  },
  filterMenuContent: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  filterMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.charcoal,
  },
  filterMenuItemEmoji: {
    fontSize: 20,
  },
  filterMenuCheck: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.purple,
  },
  filterMenuChevron: {
    marginLeft: 'auto',
  },
  filterMenuDivider: {
    height: 1,
    backgroundColor: colors.mist,
    marginVertical: spacing[2],
  },
  filterMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  filterMenuHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  filterMenuSection: {
    paddingVertical: spacing[2],
  },
  filterMenuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    opacity: 0.6,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  groupButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  groupButtonTextActive: {
    color: colors.white,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.purple,
  },
  statLabel: {
    fontSize: 14,
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  scrollContent: {
    flex: 1,
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
    color: colors.white,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  groupSection: {
    marginBottom: spacing[6],
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.mist,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  groupCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  gridItem: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
  },
  segmentBadge: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentEmoji: {
    fontSize: 16,
  },
  moodBadge: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodBadgeEmoji: {
    fontSize: 18,
  },
  favoriteBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteBadgeEmoji: {
    fontSize: 16,
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
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
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
  },
  freshieInfo: {
    marginBottom: spacing[4],
  },
  freshieTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  freshieMeta: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  segmentTag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
  },
  segmentTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.pill,
  },
  dateText: {
    fontSize: 12,
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
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
  uploadMenu: {
    position: 'absolute',
    bottom: spacing[8] + 80,
    right: spacing[6],
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: radii.lg,
    padding: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    marginVertical: spacing[1],
    gap: spacing[3],
  },
  cameraOption: {
    backgroundColor: colors.purple,
  },
  libraryOption: {
    backgroundColor: colors.mint,
  },
  uploadOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  uploadModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  uploadModalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  uploadModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  uploadModalSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  moodList: {
    maxHeight: 300,
    marginBottom: spacing[4],
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.mist,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.mist,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  moodLabelSelected: {
    color: colors.white,
  },
  uploadModalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  uploadActionButton: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  uploadCancelButton: {
    backgroundColor: colors.mist,
  },
  uploadNextButton: {
    backgroundColor: colors.purple,
  },
  uploadBackButton: {
    backgroundColor: colors.mist,
  },
  uploadSaveButton: {
    backgroundColor: colors.purple,
  },
  uploadCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  uploadNextText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  uploadBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  uploadSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    paddingVertical: spacing[8],
    opacity: 0.5,
  },
  collectionList: {
    maxHeight: 300,
    marginBottom: spacing[4],
  },
  collectionGrid: {
    gap: spacing[3],
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.mist,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.mist,
    marginBottom: spacing[3],
  },
  collectionIcon: {
    fontSize: 32,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  freshieInfoDuplicate: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  freshieTitleDuplicate: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.charcoal,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.mist,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  moodDisplayEmoji: {
    fontSize: 20,
  },
  moodDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  collectionNameSelected: {
    color: colors.white,
  },
  collectionDesc: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
  },
  collectionDescSelected: {
    color: colors.white,
    opacity: 0.9,
  },
  noCollectionsText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    paddingVertical: spacing[6],
    opacity: 0.5,
  },
  selectButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    backgroundColor: colors.purple,
    borderRadius: radii.pill,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  gridItemSelected: {
    opacity: 0.7,
    borderWidth: 3,
    borderColor: colors.purple,
  },
  selectionCheckbox: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  collectionPreviewGrid: {
    width: 90,
    height: 90,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  },
  collectionPreviewCell: {
    width: '50%',
    height: '50%',
  },
  collectionPreviewImage: {
    width: '100%',
    height: '100%',
  },
  collectionPreviewEmpty: {
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: spacing[1],
    right: spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  collectionOverlayIcon: {
    fontSize: 14,
  },
  collectionEmptyPreview: {
    width: 90,
    height: 90,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionCardIcon: {
    fontSize: 36,
  },
  collectionCardName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[1],
  },
  collectionsSection: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: colors.cream,
  },
  collectionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  collectionsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
  },
  collectionsHeaderButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.purple + '40',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  createCollectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.purple + '20',
    borderRadius: radii.pill,
  },
  createCollectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  collectionsScroll: {
    paddingHorizontal: spacing[6],
  },
  collectionCard: {
    width: 90,
    marginRight: spacing[3],
  },
  searchFilterContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    backgroundColor: colors.cream,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchIcon: {
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.charcoal,
    paddingVertical: 0,
  },
  searchSuggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
    zIndex: 1000,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  suggestionsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearRecentsText: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  suggestionEmoji: {
    fontSize: 20,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: colors.charcoal,
  },
  suggestionType: {
    fontSize: 12,
    color: colors.charcoal + '60',
    textTransform: 'capitalize',
    backgroundColor: colors.mist,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  searchHintsContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchHintItem: {
    fontSize: 14,
    color: colors.charcoal,
    paddingVertical: spacing[1],
    fontFamily: 'monospace',
  },
  searchHintNote: {
    fontSize: 12,
    color: colors.charcoal + '80',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    fontStyle: 'italic',
    lineHeight: 18,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.purple,
  },
  activeFiltersContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    backgroundColor: colors.cream,
  },
  activeFiltersContent: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.purple,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.purple + '20',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  batchActionsBar: {
    padding: spacing[6],
    paddingBottom: spacing[8],
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  batchActionsScroll: {
    gap: spacing[3],
  },
  batchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    minWidth: 120,
  },
  batchActionButtonDanger: {
    backgroundColor: colors.red,
  },
  batchActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
