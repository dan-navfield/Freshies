import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ScrollView, Dimensions } from 'react-native';
import { X, Check, Sparkles, Sun, Moon, Droplets, Smile } from 'lucide-react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { colors, spacing, radii } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

interface FreshieEditorProps {
  visible: boolean;
  photoUri: string;
  onClose: () => void;
  onSave: (editedUri: string) => void;
}

type FilterType = 'none' | 'bright' | 'warm' | 'cool' | 'vivid';
type StickerType = '✨' | '💧' | '☀️' | '🌙' | '💜' | '🧴' | '😊' | '🌟' | '💖' | '🎀';

interface Sticker {
  emoji: StickerType;
  x: number;
  y: number;
  size: number;
}

const FILTERS = [
  { id: 'none', name: 'Original', icon: Sparkles },
  { id: 'bright', name: 'Bright', icon: Sun },
  { id: 'warm', name: 'Warm', icon: Sun },
  { id: 'cool', name: 'Cool', icon: Moon },
  { id: 'vivid', name: 'Vivid', icon: Droplets },
];

const STICKERS: StickerType[] = ['✨', '💧', '☀️', '🌙', '💜', '🧴', '😊', '🌟', '💖', '🎀'];

/**
 * Freshie Editor Component
 * Allows kids to add filters and stickers to their Freshies
 */
export default function FreshieEditor({ visible, photoUri, onClose, onSave }: FreshieEditorProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [editedUri, setEditedUri] = useState<string>(photoUri);
  const [processing, setProcessing] = useState(false);

  const applyFilter = async (filter: FilterType) => {
    setProcessing(true);
    try {
      let manipulations: any[] = [];

      switch (filter) {
        case 'bright':
          manipulations = [
            { brightness: 0.1 },
            { contrast: 0.05 },
          ];
          break;
        case 'warm':
          manipulations = [
            { brightness: 0.05 },
            { contrast: -0.05 },
          ];
          break;
        case 'cool':
          manipulations = [
            { brightness: -0.05 },
            { contrast: 0.1 },
          ];
          break;
        case 'vivid':
          manipulations = [
            { contrast: 0.15 },
            { brightness: 0.05 },
          ];
          break;
        default:
          manipulations = [];
      }

      if (manipulations.length > 0) {
        const result = await manipulateAsync(
          photoUri,
          manipulations,
          { format: SaveFormat.JPEG, compress: 0.9 }
        );
        setEditedUri(result.uri);
      } else {
        setEditedUri(photoUri);
      }

      setSelectedFilter(filter);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setProcessing(false);
    }
  };

  const addSticker = (emoji: StickerType) => {
    const newSticker: Sticker = {
      emoji,
      x: width / 2 - 30,
      y: height / 2 - 30,
      size: 60,
    };
    setStickers([...stickers, newSticker]);
  };

  const removeSticker = (index: number) => {
    setStickers(stickers.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // For now, just save the filtered image
    // In a full implementation, we'd render stickers onto the image
    onSave(editedUri);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Freshie</Text>
          <TouchableOpacity 
            style={[styles.headerButton, styles.saveButton]} 
            onPress={handleSave}
            disabled={processing}
          >
            <Check size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: editedUri }} 
            style={styles.preview}
            resizeMode="contain"
          />
          
          {/* Stickers Overlay */}
          {stickers.map((sticker, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.stickerOverlay,
                {
                  left: sticker.x,
                  top: sticker.y,
                },
              ]}
              onLongPress={() => removeSticker(index)}
            >
              <Text style={[styles.stickerEmoji, { fontSize: sticker.size }]}>
                {sticker.emoji}
              </Text>
            </TouchableOpacity>
          ))}

          {processing && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Applying filter...</Text>
            </View>
          )}
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filters</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterButton, isSelected && styles.filterButtonActive]}
                  onPress={() => applyFilter(filter.id as FilterType)}
                  disabled={processing}
                >
                  <View style={[styles.filterIcon, isSelected && styles.filterIconActive]}>
                    <Icon size={20} color={isSelected ? colors.white : colors.purple} />
                  </View>
                  <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Stickers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stickers</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickersScroll}
          >
            {STICKERS.map((sticker, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stickerButton}
                onPress={() => addSticker(sticker)}
              >
                <Text style={styles.stickerButtonEmoji}>{sticker}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {stickers.length > 0 && (
            <Text style={styles.stickerHint}>Long press stickers to remove</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: 50,
    paddingBottom: spacing[4],
    backgroundColor: colors.purple,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.mint,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  stickerOverlay: {
    position: 'absolute',
  },
  stickerEmoji: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing[4],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filtersScroll: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  filterButton: {
    alignItems: 'center',
    gap: spacing[2],
  },
  filterButtonActive: {
    opacity: 1,
  },
  filterIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterIconActive: {
    backgroundColor: colors.purple,
    borderColor: colors.mint,
  },
  filterText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.mint,
  },
  stickersScroll: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  stickerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stickerButtonEmoji: {
    fontSize: 32,
  },
  stickerHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
});
