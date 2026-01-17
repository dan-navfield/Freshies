import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import DetailPageHeader from '../../../src/components/navigation/DetailPageHeader';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

const COLLECTION_ICONS = [
  '📸', '✨', '🌟', '⭐', '💫', '🎨', '🎭', '🎪',
  '🌈', '🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🌼',
  '🦋', '🐝', '🐞', '🦄', '🎀', '💝', '💖', '💕',
  '🎉', '🎊', '🎈', '🎁', '🏆', '👑', '💎', '🔮',
];

const COLLECTION_COLORS = [
  { name: 'Purple', value: '#A78BFA' },
  { name: 'Mint', value: '#A7F3D0' },
  { name: 'Yellow', value: '#FCD34D' },
  { name: 'Peach', value: '#FBCFE8' },
  { name: 'Lavender', value: '#DDD6FE' },
  { name: 'Coral', value: '#FCA5A5' },
  { name: 'Sky', value: '#BAE6FD' },
  { name: 'Lime', value: '#BEF264' },
];

export default function EditCollectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[0].value);
  const [isSystem, setIsSystem] = useState(false);

  useEffect(() => {
    loadCollection();
  }, [id]);

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

      if (data.is_system) {
        Alert.alert('Cannot Edit', 'System collections cannot be edited', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setName(data.name);
      setDescription(data.description || '');
      setSelectedIcon(data.icon);
      setSelectedColor(data.color);
      setIsSystem(data.is_system);
    } catch (error) {
      console.error('Error loading collection:', error);
      Alert.alert('Error', 'Could not load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your collection');
      return;
    }

    if (!user?.id || !id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('collections')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          icon: selectedIcon,
          color: selectedColor,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert('✨ Saved!', 'Collection has been updated', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating collection:', error);
      Alert.alert('Error', 'Could not update collection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DetailPageHeader
          title="Edit Collection"
          subtitle="Loading..."
          showAvatar={true}
        />
        <Text style={styles.loadingText}>Loading collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="Edit Collection"
        subtitle="Customize your collection"
        showAvatar={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: selectedColor + '20' }]}>
          <Text style={styles.previewIcon}>{selectedIcon}</Text>
          <Text style={styles.previewName}>{name || 'Collection Name'}</Text>
          {description && (
            <Text style={styles.previewDescription}>{description}</Text>
          )}
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Spa Days"
            placeholderTextColor={colors.charcoal + '80'}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's this collection about?"
            placeholderTextColor={colors.charcoal + '80'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an Icon</Text>
          <View style={styles.iconGrid}>
            {COLLECTION_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  selectedIcon === icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Text style={styles.iconOptionText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Color</Text>
          <View style={styles.colorGrid}>
            {COLLECTION_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorOption,
                  { backgroundColor: color.value },
                  selectedColor === color.value && styles.colorOptionSelected,
                ]}
                onPress={() => setSelectedColor(color.value)}
              >
                {selectedColor === color.value && (
                  <Text style={styles.colorCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

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
  preview: {
    margin: spacing[6],
    padding: spacing[6],
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  previewIcon: {
    fontSize: 64,
    marginBottom: spacing[3],
  },
  previewName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  previewDescription: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing[6],
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  iconOptionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '20',
  },
  iconOptionText: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  colorOption: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.charcoal,
  },
  colorCheckmark: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '700',
  },
  saveButton: {
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    paddingVertical: spacing[4],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
