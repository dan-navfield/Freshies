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
import {
  uploadAvatar,
  pickImageFromCamera,
  pickImageFromGallery,
  deleteAvatar,
} from '../../src/utils/avatarStorage';

export default function ParentAvatarSelectorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentAvatar();
  }, []);

  const loadCurrentAvatar = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .single();
      
      if (data) {
        setCurrentAvatar(data.avatar_url);
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
    }
  };

  const handleChooseFromGallery = async () => {
    const imageUri = await pickImageFromGallery();
    if (imageUri) {
      setPreviewImage(imageUri);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !previewImage) return;
    
    setUploading(true);
    try {
      const result = await uploadAvatar(user.id, previewImage, false);
      
      if (result.success) {
        Alert.alert('Success', 'Your profile photo has been updated!');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'Failed to upload photo');
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
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            const success = await deleteAvatar(user?.id || '', false);
            
            if (success) {
              Alert.alert('Success', 'Profile photo removed');
              router.back();
            } else {
              Alert.alert('Error', 'Failed to remove photo');
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile Photo</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Avatar Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : currentAvatar ? (
              <Image source={{ uri: currentAvatar }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderPreview}>
                <ImageIcon size={40} color={colors.charcoal} />
              </View>
            )}
          </View>
          <Text style={styles.previewHint}>
            Your photo will be visible to your family members
          </Text>
        </View>

        {/* Upload Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Photo</Text>
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {currentAvatar && (
            <Pressable
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              disabled={uploading}
            >
              <Trash2 size={20} color={colors.red} />
              <Text style={styles.deleteButtonText}>Remove Photo</Text>
            </Pressable>
          )}
          
          <View style={styles.bottomButtons}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.actionButton,
                styles.saveButton,
                !previewImage && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={uploading || !previewImage}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Photo</Text>
              )}
            </Pressable>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
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
    marginBottom: spacing[3],
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.mist,
  },
  previewHint: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing[4],
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
  actionButtons: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
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
});
