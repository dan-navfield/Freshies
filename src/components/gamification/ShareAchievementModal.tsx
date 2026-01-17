import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X, Users, Heart, Sparkles } from 'lucide-react-native';
import { colors, radii, spacing } from '../../theme/tokens';
import { shareAchievement } from '../../services/familyCircleService';
import { CELEBRATION_MESSAGES } from '../../services/familyCircleService';
import BadgeIcon from '../badges/BadgeIcon';
import { getAchievementRarity } from '../../utils/achievementIcons';

interface ShareAchievementModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
  } | null;
  childProfileId: string;
  onSuccess: () => void;
}

export default function ShareAchievementModal({
  visible,
  onClose,
  achievement,
  childProfileId,
  onSuccess
}: ShareAchievementModalProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!achievement || !selectedMessage) return;

    setSharing(true);
    try {
      const success = await shareAchievement(
        childProfileId,
        achievement.id,
        selectedMessage
      );

      if (success) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to share achievement. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing achievement:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSharing(false);
      setSelectedMessage(null);
    }
  };

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share with Family</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Achievement Preview */}
            <View style={styles.achievementPreview}>
              <View style={styles.achievementIcon}>
                <BadgeIcon
                  type={achievement.icon as any}
                  size={80}
                  primaryColor={getAchievementRarity(achievement.points) === 'legendary' ? '#FCD34D' : 
                               getAchievementRarity(achievement.points) === 'epic' ? '#F472B6' :
                               getAchievementRarity(achievement.points) === 'rare' ? '#60A5FA' : '#FFD700'}
                  secondaryColor={getAchievementRarity(achievement.points) === 'legendary' ? '#F59E0B' :
                                 getAchievementRarity(achievement.points) === 'epic' ? '#EC4899' :
                                 getAchievementRarity(achievement.points) === 'rare' ? '#3B82F6' : '#FFA500'}
                  backgroundColor={getAchievementRarity(achievement.points) === 'legendary' ? '#D97706' :
                                  getAchievementRarity(achievement.points) === 'epic' ? '#DB2777' :
                                  getAchievementRarity(achievement.points) === 'rare' ? '#2563EB' : '#4A90E2'}
                />
              </View>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
              <View style={styles.pointsBadge}>
                <Sparkles size={16} color={colors.yellow} fill={colors.yellow} />
                <Text style={styles.pointsText}>+{achievement.points} points</Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Users size={20} color={colors.purple} />
              <Text style={styles.infoText}>
                Your family circle will see this achievement and can send you encouragement!
              </Text>
            </View>

            {/* Message Selection */}
            <Text style={styles.sectionTitle}>Pick a message:</Text>
            <View style={styles.messagesContainer}>
              {CELEBRATION_MESSAGES.achievement.map((message, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.messageOption,
                    selectedMessage === message && styles.messageOptionSelected
                  ]}
                  onPress={() => setSelectedMessage(message)}
                >
                  <Text style={[
                    styles.messageText,
                    selectedMessage === message && styles.messageTextSelected
                  ]}>
                    {message}
                  </Text>
                  {selectedMessage === message && (
                    <View style={styles.selectedCheck}>
                      <Heart size={16} color={colors.white} fill={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Share Button */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              (!selectedMessage || sharing) && styles.shareButtonDisabled
            ]}
            onPress={handleShare}
            disabled={!selectedMessage || sharing}
          >
            <Text style={styles.shareButtonText}>
              {sharing ? 'Sharing...' : 'Share with Family'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
  },
  closeButton: {
    padding: spacing[2],
  },
  achievementPreview: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
  },
  achievementIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  achievementEmoji: {
    fontSize: 40,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.yellow + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.deepPurple,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.purple + '10',
    padding: spacing[4],
    marginHorizontal: spacing[6],
    marginBottom: spacing[5],
    borderRadius: radii.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.deepPurple,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginHorizontal: spacing[6],
    marginBottom: spacing[3],
  },
  messagesContainer: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  messageOption: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.mist,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageOptionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  messageText: {
    fontSize: 15,
    color: colors.charcoal,
    flex: 1,
  },
  messageTextSelected: {
    color: colors.deepPurple,
    fontWeight: '600',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: colors.purple,
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: colors.mist,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
