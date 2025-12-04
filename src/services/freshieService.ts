import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const FRESHIE_BUCKET = 'freshies';
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const COMPRESSION_QUALITY = 0.8;

/**
 * Service for managing Freshie photos
 */

/**
 * Compress and resize image before upload
 */
async function compressImage(uri: string): Promise<string> {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT } }],
      { compress: COMPRESSION_QUALITY, format: SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original if compression fails
    return uri;
  }
}

/**
 * Upload a Freshie photo to Supabase Storage
 */
export async function uploadFreshie(
  photoUri: string,
  userId: string,
  stepId: string
): Promise<string> {
  try {
    // Compress image first
    const compressedUri = await compressImage(photoUri);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${stepId}_${timestamp}.jpg`;

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: 'base64',
    });

    // Convert base64 to blob for upload
    const response = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(FRESHIE_BUCKET)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(FRESHIE_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading Freshie:', error);
    throw error;
  }
}

/**
 * Delete a Freshie photo from Supabase Storage
 */
export async function deleteFreshie(photoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = photoUrl.split(`${FRESHIE_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid photo URL');
    }
    const filePath = urlParts[1];

    // Delete from storage
    const { error } = await supabase.storage
      .from(FRESHIE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting Freshie:', error);
    throw error;
  }
}

/**
 * Save Freshie photo URL to routine step
 */
export async function saveFreshieToStep(
  stepId: string,
  photoUrl: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('routine_steps')
      .update({ freshie_photo_url: photoUrl })
      .eq('id', stepId);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving Freshie to step:', error);
    throw error;
  }
}

/**
 * Remove Freshie photo from routine step
 */
export async function removeFreshieFromStep(stepId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routine_steps')
      .update({ freshie_photo_url: null })
      .eq('id', stepId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing Freshie from step:', error);
    throw error;
  }
}

/**
 * Replace a Freshie photo (delete old, upload new)
 */
export async function replaceFreshie(
  oldPhotoUrl: string | null,
  newPhotoUri: string,
  userId: string,
  stepId: string
): Promise<string> {
  try {
    // Delete old photo if exists
    if (oldPhotoUrl) {
      try {
        await deleteFreshie(oldPhotoUrl);
      } catch (error) {
        console.warn('Could not delete old Freshie:', error);
        // Continue anyway
      }
    }

    // Upload new photo
    const newPhotoUrl = await uploadFreshie(newPhotoUri, userId, stepId);

    // Save to step
    await saveFreshieToStep(stepId, newPhotoUrl);

    return newPhotoUrl;
  } catch (error) {
    console.error('Error replacing Freshie:', error);
    throw error;
  }
}
