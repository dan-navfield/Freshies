import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';
import { User, MessageSquare, Save, X, Camera } from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user?.id) return;
      
      const { data: profileData } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setOriginalName(profileData.display_name || '');
        setOriginalBio(profileData.bio || '');
        setAvatarUrl(profileData.avatar_url);
        setAvatarConfig(profileData.avatar_config);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter a display name');
      return;
    }

    if (displayName.length > 50) {
      Alert.alert('Name Too Long', 'Display name must be 50 characters or less');
      return;
    }

    if (bio.length > 200) {
      Alert.alert('Bio Too Long', 'Bio must be 200 characters or less');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('child_profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      Alert.alert('Success!', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = displayName !== originalName || bio !== originalBio;
    
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <DetailPageHeader
        title="Edit Profile"
        subtitle="Update your info"
        showAvatar={false}
      />

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <Pressable 
          style={styles.avatarSection}
          onPress={() => router.push('/(child)/avatar-selector')}
        >
          <View style={styles.avatarDisplay}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : avatarConfig?.emoji ? (
              <View style={[
                styles.avatarEmoji,
                { backgroundColor: avatarConfig.backgroundColor || colors.purple }
              ]}>
                <Text style={styles.avatarEmojiText}>{avatarConfig.emoji}</Text>
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarCameraButton}>
              <Camera size={16} color={colors.white} strokeWidth={2.5} />
            </View>
          </View>
          <Text style={styles.avatarChangeText}>Tap to change avatar</Text>
        </Pressable>

        {/* Display Name */}
        <View style={styles.section}>
          <View style={styles.labelContainer}>
            <User size={20} color={colors.purple} />
            <Text style={styles.label}>Display Name</Text>
          </View>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.charcoal + '60'}
            maxLength={50}
            autoCapitalize="words"
          />
          <Text style={styles.characterCount}>{displayName.length}/50</Text>
          <Text style={styles.hint}>
            This is how you'll appear in the app. Choose something fun!
          </Text>
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <View style={styles.labelContainer}>
            <MessageSquare size={20} color={colors.mint} />
            <Text style={styles.label}>About Me</Text>
          </View>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself... (optional)"
            placeholderTextColor={colors.charcoal + '60'}
            maxLength={200}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{bio.length}/200</Text>
          <Text style={styles.hint}>
            Share your skincare goals, favorite products, or anything you'd like!
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Profile Tips</Text>
          <Text style={styles.tipItem}>• Use your real first name or a fun nickname</Text>
          <Text style={styles.tipItem}>• Keep your bio positive and friendly</Text>
          <Text style={styles.tipItem}>• Don't share personal info like your address or phone</Text>
          <Text style={styles.tipItem}>• Your parent can see your profile</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={saving}
        >
          <X size={20} color={colors.charcoal} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[4],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  avatarDisplay: {
    position: 'relative',
    marginBottom: spacing[2],
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarEmoji: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmojiText: {
    fontSize: 48,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
  },
  avatarCameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    fontSize: 16,
    color: colors.deepPurple,
    borderWidth: 1,
    borderColor: colors.mist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bioInput: {
    minHeight: 120,
    paddingTop: spacing[4],
  },
  characterCount: {
    fontSize: 12,
    color: colors.charcoal,
    textAlign: 'right',
    marginTop: spacing[1],
  },
  hint: {
    fontSize: 14,
    color: colors.charcoal + 'AA',
    marginTop: spacing[2],
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: colors.purple + '08',
    marginHorizontal: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.purple + '20',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[3],
  },
  tipItem: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: spacing[1],
  },
  bottomSpacer: {
    height: 120,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.mist,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.purple,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
