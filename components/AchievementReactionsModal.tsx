import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';
import { getAchievementReactions, REACTION_TYPES } from '../src/services/familyCircleService';

interface Reaction {
  id: string;
  reaction_type: string;
  created_at: string;
  family_circle_id: string;
  member: {
    display_name?: string;
    family_member_name?: string;
    relationship: string;
    avatar?: any;
  } | null;
}

interface AchievementReactionsModalProps {
  visible: boolean;
  onClose: () => void;
  achievementTitle: string;
  achievementId: string;
  childProfileId: string;
}

export default function AchievementReactionsModal({
  visible,
  onClose,
  achievementTitle,
  achievementId,
  childProfileId
}: AchievementReactionsModalProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && achievementId && childProfileId) {
      loadReactions();
    }
  }, [visible, achievementId, childProfileId]);

  const loadReactions = async () => {
    setLoading(true);
    try {
      const data = await getAchievementReactions(childProfileId, achievementId);
      setReactions(data);
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReactionEmoji = (reactionType: string) => {
    const reaction = REACTION_TYPES[reactionType as keyof typeof REACTION_TYPES];
    return reaction?.emoji || '❤️';
  };

  const getReactionLabel = (reactionType: string) => {
    const reaction = REACTION_TYPES[reactionType as keyof typeof REACTION_TYPES];
    return reaction?.label || 'Reacted';
  };

  const getRelationshipEmoji = (relationship: string) => {
    const emojis: Record<string, string> = {
      parent: '👨‍👩',
      mother: '👩',
      father: '👨',
      sibling: '👧',
      grandparent: '👴',
      guardian: '🤝',
    };
    return emojis[relationship.toLowerCase()] || '👤';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Family Reactions</Text>
              <Text style={styles.subtitle}>{achievementTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Reactions List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={styles.loadingText}>Loading reactions...</Text>
            ) : (
              <>
                {reactions.map((reaction, index) => {
                  const memberName = reaction.member?.display_name || reaction.member?.family_member_name || 'Family Member';
                  const relationship = reaction.member?.relationship || 'parent';
                  
                  return (
                    <View key={index} style={styles.reactionItem}>
                      {/* Avatar */}
                      <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarEmoji}>
                            {getRelationshipEmoji(relationship)}
                          </Text>
                        </View>
                        {/* Reaction emoji badge */}
                        <View style={styles.reactionBadge}>
                          <Text style={styles.reactionEmoji}>
                            {getReactionEmoji(reaction.reaction_type)}
                          </Text>
                        </View>
                      </View>

                      {/* Member Info */}
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {memberName}
                        </Text>
                        <Text style={styles.reactionText}>
                          {getReactionLabel(reaction.reaction_type)}
                        </Text>
                        <Text style={styles.timeText}>
                          {new Date(reaction.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
            {reactions.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>No reactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Your family will see this achievement and can react to celebrate with you!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: '50%',
    paddingBottom: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  loadingText: {
    textAlign: 'center',
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[8],
  },
  reactionsList: {
    gap: spacing[4],
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    gap: spacing[4],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  reactionText: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  timeText: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: spacing[8],
  },
  footer: {
    padding: spacing[6],
    paddingTop: spacing[4],
  },
  doneButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  debugText: {
    fontSize: 12,
    color: colors.purple,
    marginBottom: spacing[2],
  },
});
