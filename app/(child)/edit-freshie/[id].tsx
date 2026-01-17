import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save, Smile, Tag, Type, Sparkles, X } from 'lucide-react-native';
import DetailPageHeader from '../../../src/components/DetailPageHeader';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width - spacing[6] * 2;

const MOOD_OPTIONS = [
  { id: 'happy', emoji: '😊', word: 'Happy', color: colors.yellow },
  { id: 'confident', emoji: '😎', word: 'Confident', color: colors.purple },
  { id: 'fresh', emoji: '✨', word: 'Fresh', color: colors.mint },
  { id: 'relaxed', emoji: '😌', word: 'Relaxed', color: colors.peach },
  { id: 'excited', emoji: '🤩', word: 'Excited', color: colors.lemon },
  { id: 'calm', emoji: '😇', word: 'Calm', color: colors.lavender },
  { id: 'proud', emoji: '🥰', word: 'Proud', color: colors.peach },
  { id: 'glowing', emoji: '🌟', word: 'Glowing', color: colors.yellow },
];

const TAG_OPTIONS = [
  { id: 'before', label: 'Before', emoji: '📸' },
  { id: 'after', label: 'After', emoji: '✨' },
  { id: 'progress', label: 'Progress', emoji: '📈' },
  { id: 'routine', label: 'Routine', emoji: '🌟' },
];

const STICKER_PACKS = {
  sparkles: {
    name: '✨ Sparkles',
    stickers: ['✨', '⭐', '🌟', '💫', '🌠', '💥', '🎆', '🎇'],
  },
  hearts: {
    name: '💖 Hearts',
    stickers: ['💖', '💕', '💗', '💓', '💝', '💘', '❤️', '🧡', '💛', '💚', '💙', '💜'],
  },
  flowers: {
    name: '🌸 Flowers',
    stickers: ['🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🌼', '🏵️'],
  },
  skincare: {
    name: '🧴 Skincare',
    stickers: ['🧴', '🧼', '🧽', '🧖‍♀️', '💆‍♀️', '🛁', '🚿', '💧'],
  },
  celebration: {
    name: '🎉 Celebration',
    stickers: ['🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '👑', '💎'],
  },
  nature: {
    name: '🦋 Nature',
    stickers: ['🦋', '🐝', '🐞', '🌈', '☀️', '🌙', '⭐', '🌟'],
  },
};

const FRAME_OPTIONS = [
  { id: 'none', name: 'None', color: 'transparent', width: 0 },
  { id: 'purple', name: 'Purple', color: colors.purple, width: 8 },
  { id: 'mint', name: 'Mint', color: colors.mint, width: 8 },
  { id: 'yellow', name: 'Yellow', color: colors.yellow, width: 8 },
  { id: 'peach', name: 'Peach', color: colors.peach, width: 8 },
  { id: 'white', name: 'White', color: colors.white, width: 12 },
  { id: 'rainbow', name: 'Rainbow', gradient: true, width: 10 },
];

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface FreshieData {
  id: string;
  photo_url: string;
  title: string;
  notes?: string;
  mood_emoji?: string;
  mood_word?: string;
  tags?: string[];
  decorations?: any;
}

export default function EditFreshieScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freshie, setFreshie] = useState<FreshieData | null>(null);
  
  // Editing state
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMood, setSelectedMood] = useState<typeof MOOD_OPTIONS[0] | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedFrame, setSelectedFrame] = useState('none');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'info' | 'mood' | 'tags' | 'stickers' | 'frame'>('info');

  useEffect(() => {
    loadFreshie();
  }, [id]);

  const loadFreshie = async () => {
    if (!user?.id || !id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('freshies')
        .select('*')
        .eq('id', id)
        .eq('child_profile_id', profile.id)
        .single();

      if (error) throw error;

      setFreshie(data);
      setTitle(data.title || '');
      setNotes(data.notes || '');
      
      // Set mood
      if (data.mood_emoji && data.mood_word) {
        const mood = MOOD_OPTIONS.find(m => m.emoji === data.mood_emoji);
        setSelectedMood(mood || null);
      }
      
      // Set tags
      setSelectedTags(data.tags || []);
      
      // Load decorations
      if (data.decorations) {
        setStickers(data.decorations.stickers || []);
        setSelectedFrame(data.decorations.frame || 'none');
      }
    } catch (error) {
      console.error('Error loading freshie:', error);
      Alert.alert('Error', 'Could not load photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);

    try {
      const decorations = {
        stickers,
        frame: selectedFrame,
      };

      const { error } = await supabase
        .from('freshies')
        .update({
          title: title.trim() || 'My Freshie',
          notes: notes.trim() || null,
          mood_emoji: selectedMood?.emoji || null,
          mood_word: selectedMood?.word || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
          decorations,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('✨ Saved!', 'Your changes have been saved', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving freshie:', error);
      Alert.alert('Error', 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Date.now().toString(),
      emoji,
      x: IMAGE_WIDTH / 2 - 30,
      y: IMAGE_WIDTH / 2 - 30,
      size: 60,
      rotation: 0,
    };
    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (stickerId: string) => {
    setStickers(stickers.filter(s => s.id !== stickerId));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  if (loading || !freshie) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Edit Photo"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Edit Photo"
        subtitle="Customize your Freshie"
        showAvatar={true}
      />

      <ScrollView style={styles.content}>
        {/* Photo Preview with Decorations */}
        <View style={styles.previewContainer}>
          <View style={[
            styles.photoFrame,
            selectedFrame !== 'none' && {
              borderWidth: FRAME_OPTIONS.find(f => f.id === selectedFrame)?.width,
              borderColor: FRAME_OPTIONS.find(f => f.id === selectedFrame)?.color,
            }
          ]}>
            <Image
              source={{ uri: freshie.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
            
            {/* Stickers Overlay */}
            {stickers.map((sticker) => (
              <View
                key={sticker.id}
                style={[
                  styles.stickerContainer,
                  {
                    left: sticker.x,
                    top: sticker.y,
                    transform: [{ rotate: `${sticker.rotation}deg` }],
                  },
                ]}
              >
                <Text style={[styles.sticker, { fontSize: sticker.size }]}>
                  {sticker.emoji}
                </Text>
                <TouchableOpacity
                  style={styles.stickerRemove}
                  onPress={() => removeSticker(sticker.id)}
                >
                  <X size={12} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Edit Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Type size={20} color={activeTab === 'info' ? colors.white : colors.charcoal} />
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mood' && styles.tabActive]}
            onPress={() => setActiveTab('mood')}
          >
            <Smile size={20} color={activeTab === 'mood' ? colors.white : colors.charcoal} />
            <Text style={[styles.tabText, activeTab === 'mood' && styles.tabTextActive]}>Mood</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tags' && styles.tabActive]}
            onPress={() => setActiveTab('tags')}
          >
            <Tag size={20} color={activeTab === 'tags' ? colors.white : colors.charcoal} />
            <Text style={[styles.tabText, activeTab === 'tags' && styles.tabTextActive]}>Tags</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stickers' && styles.tabActive]}
            onPress={() => setActiveTab('stickers')}
          >
            <Sparkles size={20} color={activeTab === 'stickers' ? colors.white : colors.charcoal} />
            <Text style={[styles.tabText, activeTab === 'stickers' && styles.tabTextActive]}>Stickers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'frame' && styles.tabActive]}
            onPress={() => setActiveTab('frame')}
          >
            <Text style={[styles.tabEmoji, activeTab === 'frame' && styles.tabTextActive]}>🖼️</Text>
            <Text style={[styles.tabText, activeTab === 'frame' && styles.tabTextActive]}>Frame</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="My Freshie"
                placeholderTextColor={colors.charcoal + '80'}
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
              
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note about this photo..."
                placeholderTextColor={colors.charcoal + '80'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
          )}

          {activeTab === 'mood' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How were you feeling?</Text>
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood?.id === mood.id;
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodOption,
                        isSelected && { backgroundColor: mood.color, borderColor: mood.color }
                      ]}
                      onPress={() => setSelectedMood(isSelected ? null : mood)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                        {mood.word}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'tags' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Tags</Text>
              <View style={styles.tagGrid}>
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagOption,
                        isSelected && styles.tagOptionSelected
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                      <Text style={[styles.tagLabel, isSelected && styles.tagLabelSelected]}>
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'stickers' && (
            <View style={styles.section}>
              {Object.entries(STICKER_PACKS).map(([key, pack]) => (
                <View key={key} style={styles.stickerPack}>
                  <Text style={styles.stickerPackTitle}>{pack.name}</Text>
                  <View style={styles.stickerGrid}>
                    {pack.stickers.map((sticker, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.stickerButton}
                        onPress={() => addSticker(sticker)}
                      >
                        <Text style={styles.stickerEmoji}>{sticker}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'frame' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Frame</Text>
              <View style={styles.frameGrid}>
                {FRAME_OPTIONS.map((frame) => {
                  const isSelected = selectedFrame === frame.id;
                  return (
                    <TouchableOpacity
                      key={frame.id}
                      style={[
                        styles.frameOption,
                        isSelected && styles.frameOptionSelected
                      ]}
                      onPress={() => setSelectedFrame(frame.id)}
                    >
                      <View style={[
                        styles.framePreview,
                        frame.id !== 'none' && {
                          borderWidth: 4,
                          borderColor: frame.color,
                        }
                      ]}>
                        <View style={styles.framePreviewInner} />
                      </View>
                      <Text style={styles.frameLabel}>{frame.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Save size={20} color={colors.white} />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
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
  previewContainer: {
    padding: spacing[6],
    alignItems: 'center',
  },
  photoFrame: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  stickerContainer: {
    position: 'absolute',
  },
  sticker: {
    fontSize: 60,
  },
  stickerRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.mist,
  },
  tabActive: {
    backgroundColor: colors.purple,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  tabTextActive: {
    color: colors.white,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabContent: {
    padding: spacing[6],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    fontSize: 16,
    color: colors.charcoal,
    borderWidth: 2,
    borderColor: colors.mist,
    marginBottom: spacing[4],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  moodOption: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  moodLabelSelected: {
    color: colors.white,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.mist,
  },
  tagOptionSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  tagEmoji: {
    fontSize: 20,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  tagLabelSelected: {
    color: colors.white,
  },
  stickerPack: {
    marginBottom: spacing[6],
  },
  stickerPackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stickerButton: {
    width: 60,
    height: 60,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  frameOption: {
    width: '30%',
    alignItems: 'center',
  },
  frameOptionSelected: {
    opacity: 1,
  },
  framePreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[2],
    marginBottom: spacing[2],
  },
  framePreviewInner: {
    flex: 1,
    backgroundColor: colors.mist,
    borderRadius: radii.md,
  },
  frameLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  saveBar: {
    padding: spacing[6],
    paddingBottom: spacing[8],
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});
