import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, Trash2, Check, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/PageHeader';
import {
  uploadAvatar,
  pickImageFromCamera,
  pickImageFromGallery,
  deleteAvatar,
} from '../../src/utils/avatarStorage';

// Predefined emoji avatars for kids - organized by category
const EMOJI_CATEGORIES = {
  'Animals': ['🦄', '🐸', '🦋', '🐢', '🦁', '🐯', '🐨', '🐼', '🐵', '🦊', '🐰', '🐻', '🐷', '🐙', '🦀', '🐠', '🐧', '🦜'],
  'Nature': ['🌈', '🌟', '⭐', '🌙', '☀️', '🌺', '🌸', '🌼', '🌻', '🍄', '🌵', '🌴'],
  'Fun': ['🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', '🎤', '🎧', '🎮', '🚀', '✨'],
  'Food': ['🍓', '🍉', '🍊', '🍋', '🍌', '🍇', '🍑', '🍒', '🍕', '🍰', '🍦', '🍩'],
};

// Avatar background colors
const AVATAR_COLORS = [
  { name: 'Purple', value: colors.purple },
  { name: 'Mint', value: colors.mint },
  { name: 'Peach', value: colors.peach },
  { name: 'Lilac', value: colors.lilac },
  { name: 'Yellow', value: colors.yellow },
  { name: 'Orange', value: colors.orange },
];

export default function AvatarSelectorScreen() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(colors.purple);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasUserSelection, setHasUserSelection] = useState(false);
  const isChild = userRole === 'child';

  useEffect(() => {
    loadCurrentAvatar();
  }, []);

  const loadCurrentAvatar = async () => {
    try {
      setLoading(true);
      const table = isChild ? 'child_profiles' : 'profiles';
      const idField = isChild ? 'user_id' : 'id';
      
      const { data, error } = await supabase
        .from(table)
        .select('avatar_url, avatar_config')
        .eq(idField, user?.id)
        .single();
      
      if (data) {
        setCurrentAvatar(data.avatar_url);
        if (isChild && data.avatar_config?.emoji) {
          setCurrentEmoji(data.avatar_config.emoji);
        }
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const imageUri = await pickImageFromCamera();
    if (imageUri) {
      setPreviewImage(imageUri);
      setSelectedEmoji(null);
      setHasUserSelection(true);
    }
  };

  const handleChooseFromGallery = async () => {
    const imageUri = await pickImageFromGallery();
    if (imageUri) {
      setPreviewImage(imageUri);
      setSelectedEmoji(null);
      setHasUserSelection(true);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setPreviewImage(null);
    setHasUserSelection(true);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setUploading(true);
    try {
      if (previewImage) {
        // Upload custom image
        const result = await uploadAvatar(user.id, previewImage, isChild);
        
        if (result.success) {
          Alert.alert('Success', 'Your avatar has been updated!');
          router.replace('/(child)/account');
        } else {
          Alert.alert('Error', result.error || 'Failed to upload avatar');
        }
      } else if (selectedEmoji && isChild) {
        // Save emoji avatar for children with background color
        const { error } = await supabase
          .from('child_profiles')
          .update({
            avatar_config: { emoji: selectedEmoji, backgroundColor: selectedColor },
            avatar_url: null, // Clear image URL when using emoji
          })
          .eq('user_id', user.id);
        
        if (error) {
          Alert.alert('Error', 'Failed to save emoji avatar');
        } else {
          Alert.alert('Success', 'Your avatar has been updated!');
          router.replace('/(child)/account');
        }
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your avatar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            const success = await deleteAvatar(user?.id || '', isChild);
            
            if (success) {
              // Also clear emoji if child
              if (isChild) {
                await supabase
                  .from('child_profiles')
                  .update({ avatar_config: null })
                  .eq('user_id', user?.id);
              }
              
              Alert.alert('Success', 'Avatar removed');
              router.back();
            } else {
              Alert.alert('Error', 'Failed to remove avatar');
            }
            setUploading(false);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Choose Avatar"
        subtitle="Pick your profile picture"
        showAvatar={false}
        showSearch={false}
        showBackButton={true}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Current Avatar Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : selectedEmoji ? (
              <View style={[styles.emojiPreview, { backgroundColor: selectedColor }]}>
                <Text style={styles.emojiPreviewText}>{selectedEmoji}</Text>
              </View>
            ) : currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.previewImage} />
            ) : currentEmoji ? (
              <View style={styles.emojiPreview}>
                <Text style={styles.emojiPreviewText}>{currentEmoji}</Text>
              </View>
            ) : (
              <View style={styles.placeholderPreview}>
                <ImageIcon size={40} color={colors.charcoal} />
              </View>
            )}
          </View>
        </View>

        {/* Upload Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Photo</Text>
          <View style={styles.uploadOptions}>
            <Pressable style={styles.uploadButton} onPress={handleTakePhoto}>
              <Camera size={24} color={colors.purple} />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </Pressable>
            
            <Pressable style={styles.uploadButton} onPress={handleChooseFromGallery}>
              <ImageIcon size={24} color={colors.purple} />
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </Pressable>
          </View>
        </View>

        {/* Action Buttons - Only show when user makes a new selection */}
        {hasUserSelection && (
          <View style={styles.actionButtons}>
            <View style={styles.bottomButtons}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setPreviewImage(null);
                  setSelectedEmoji(null);
                  setHasUserSelection(false);
                }}
                disabled={uploading}
              >
                <X size={20} color={colors.charcoal} />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Check size={20} color={colors.white} />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Emoji Avatars for Children */}
        {isChild && (
          <>
            {/* Background Color Picker */}
            {selectedEmoji && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Background Color</Text>
                <View style={styles.colorGrid}>
                  {AVATAR_COLORS.map((color) => (
                    <Pressable
                      key={color.name}
                      style={[
                        styles.colorButton,
                        { backgroundColor: color.value },
                        selectedColor === color.value && styles.colorButtonSelected,
                      ]}
                      onPress={() => setSelectedColor(color.value)}
                    >
                      {selectedColor === color.value && (
                        <Check size={20} color={colors.white} strokeWidth={3} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Emoji Categories */}
            <View style={[styles.section, { marginTop: spacing[4] }]}>
              <Text style={styles.sectionTitle}>Or Choose an Emoji</Text>
              {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.emojiGrid}>
                    {emojis.map((emoji: string, index: number) => (
                      <Pressable
                        key={index}
                        style={[
                          styles.emojiButton,
                          selectedEmoji === emoji && styles.emojiButtonSelected,
                        ]}
                        onPress={() => handleEmojiSelect(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                        {selectedEmoji === emoji && (
                          <View style={styles.emojiCheckmark}>
                            <Check size={16} color={colors.white} strokeWidth={3} />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[10], // Extra padding to ensure buttons are visible
  },
  previewSection: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },
  previewContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emojiPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.purple,
  },
  emojiPreviewText: {
    fontSize: 60,
  },
  placeholderPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.mist,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2], // Further reduced spacing between sections
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing[3], // Reduced padding
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.purple,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  emojiButton: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emojiButtonSelected: {
    backgroundColor: colors.purple,
  },
  emojiText: {
    fontSize: 28,
  },
  emojiCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    marginTop: spacing[2], // Reduced top margin
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: 0, // Removed extra top margin
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3], // Reduced padding
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  deleteButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.red,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.charcoal,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.purple,
  },
  saveButtonDisabled: {
    backgroundColor: colors.mist,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  colorButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categorySection: {
    marginBottom: spacing[6],
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.deepPurple,
    marginBottom: spacing[3],
    marginTop: spacing[2],
    letterSpacing: 0.3,
  },
});
