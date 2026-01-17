import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import BadgeIcon from './badges/BadgeIcon';

interface AchievementBadgeProps {
  iconType: 'star' | 'trophy' | 'medal' | 'shield' | 'crown' | 'target' | 'book' | 'lightbulb' | 'heart' | 'fire' | 'sparkle' | 'rocket' | 'flag' | 'gem' | 'wand';
  title: string;
  date?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  onShare?: () => void;
  size?: 'small' | 'medium' | 'large';
  isShared?: boolean;
  reactionCount?: number;
  onViewReactions?: () => void;
}

const rarityColors = {
  common: {
    primary: '#FFD700',
    secondary: '#FFA500',
    background: '#4A90E2'
  },
  rare: {
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#2563EB'
  },
  epic: {
    primary: '#F472B6',
    secondary: '#EC4899',
    background: '#DB2777'
  },
  legendary: {
    primary: '#FCD34D',
    secondary: '#F59E0B',
    background: '#D97706'
  }
};

export default function AchievementBadge({
  iconType,
  title,
  date,
  rarity = 'common',
  onShare,
  size = 'medium',
  isShared = false,
  reactionCount = 0,
  onViewReactions
}: AchievementBadgeProps) {
  const sizeStyles = {
    small: { width: 70, iconSize: 48, fontSize: 11 },
    medium: { width: 90, iconSize: 64, fontSize: 12 },
    large: { width: 110, iconSize: 80, fontSize: 14 }
  };

  const currentSize = sizeStyles[size];
  const colorScheme = rarityColors[rarity];

  return (
    <View style={[styles.container, { width: currentSize.width }]}>
      <View style={styles.iconContainer}>
        <BadgeIcon
          type={iconType}
          size={currentSize.iconSize}
          primaryColor={colorScheme.primary}
          secondaryColor={colorScheme.secondary}
          backgroundColor={colorScheme.background}
        />
        
        {/* Rarity indicator */}
        {rarity !== 'common' && (
          <View style={[styles.rarityDot, { backgroundColor: colorScheme.background }]} />
        )}

        {/* Shine effect for legendary */}
        {rarity === 'legendary' && (
          <View style={styles.shineEffect}>
            <Text style={styles.shineText}>✨</Text>
          </View>
        )}
      </View>

      <Text 
        style={[styles.badgeName, { fontSize: currentSize.fontSize }]} 
        numberOfLines={2}
      >
        {title}
      </Text>

      {date && (
        <Text style={styles.badgeDate}>
          {new Date(date).toLocaleDateString()}
        </Text>
      )}

      {/* Shared status indicator */}
      {isShared && (
        <TouchableOpacity 
          style={styles.sharedBadge}
          onPress={onViewReactions}
          disabled={!onViewReactions}
        >
          <Text style={styles.sharedText}>Shared with Family</Text>
          {reactionCount > 0 && (
            <View style={styles.reactionBadge}>
              <Text style={styles.reactionText}>❤️ {reactionCount}</Text>
            </View>
          )}
          {reactionCount > 0 && onViewReactions && (
            <Text style={styles.tapHint}>Tap to see reactions</Text>
          )}
        </TouchableOpacity>
      )}

      {onShare && (
        <TouchableOpacity
          style={styles.shareButton}
          onPress={onShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={14} color={colors.purple} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing[3],
    position: 'relative',
  },
  iconContainer: {
    marginBottom: spacing[2],
    position: 'relative',
  },
  shineEffect: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  shineText: {
    fontSize: 16,
  },
  badgeName: {
    fontWeight: '700',
    color: colors.deepPurple,
    textAlign: 'center',
    marginBottom: spacing[1],
    paddingHorizontal: spacing[1],
  },
  badgeDate: {
    fontSize: 10,
    color: colors.charcoal,
    opacity: 0.6,
    textAlign: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rarityDot: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  sharedBadge: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.mint + '20',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.mint,
    alignItems: 'center',
  },
  sharedText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.deepPurple,
    textAlign: 'center',
  },
  reactionBadge: {
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.purple + '40',
  },
  reactionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
  },
  tapHint: {
    fontSize: 8,
    color: colors.deepPurple,
    opacity: 0.6,
    marginTop: 2,
    textAlign: 'center',
  },
});
