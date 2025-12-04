import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

const AVATAR_SIZE = 400; // Size in pixels for avatar images
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Compress and resize image for avatar use
 */
async function processImage(uri: string): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * Upload avatar to Supabase storage
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string,
  isChild: boolean = false
): Promise<AvatarUploadResult> {
  try {
    // Process the image (resize and compress)
    const processedUri = await processImage(imageUri);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/avatar-${timestamp}.jpg`;
    
    // Delete old avatars first (optional - keeps storage clean)
    await deleteOldAvatars(userId);
    
    // For React Native, we need to handle the file differently
    const response = await fetch(processedUri);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase storage using the array buffer
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update profile with new avatar URL
    const table = isChild ? 'child_profiles' : 'profiles';
    const idField = isChild ? 'user_id' : 'id';
    
    const { error: updateError } = await supabase
      .from(table)
      .update({ avatar_url: publicUrl })
      .eq(idField, userId);
    
    if (updateError) {
      console.error('Profile update error:', updateError);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }
    
    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload avatar',
    };
  }
}

/**
 * Delete old avatars for a user (keeps storage clean)
 */
async function deleteOldAvatars(userId: string): Promise<void> {
  try {
    // List all avatars for the user
    const { data: files, error } = await supabase.storage
      .from('avatars')
      .list(userId, {
        limit: 100,
        offset: 0,
      });
    
    if (error || !files) return;
    
    // Delete all old avatars
    const filesToDelete = files.map(file => `${userId}/${file.name}`);
    
    if (filesToDelete.length > 0) {
      await supabase.storage
        .from('avatars')
        .remove(filesToDelete);
    }
  } catch (error) {
    console.error('Error deleting old avatars:', error);
    // Non-critical error, continue
  }
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick image from camera
 */
export async function pickImageFromCamera(): Promise<string | null> {
  try {
    const hasPermission = await requestCameraPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take a photo for your avatar.'
      );
      return null;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image from camera:', error);
    return null;
  }
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<string | null> {
  try {
    const hasPermission = await requestMediaLibraryPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to choose an avatar.'
      );
      return null;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image from gallery:', error);
    return null;
  }
}

/**
 * Delete avatar for a user
 */
export async function deleteAvatar(
  userId: string,
  isChild: boolean = false
): Promise<boolean> {
  try {
    // Delete from storage
    await deleteOldAvatars(userId);
    
    // Update profile to remove avatar URL
    const table = isChild ? 'child_profiles' : 'profiles';
    const idField = isChild ? 'user_id' : 'id';
    
    const { error } = await supabase
      .from(table)
      .update({ avatar_url: null })
      .eq(idField, userId);
    
    if (error) {
      console.error('Error removing avatar URL:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}
