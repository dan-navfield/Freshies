import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Heart, Star, Sparkles, Shield } from 'lucide-react-native';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import DetailPageHeader from '../../components/DetailPageHeader';

interface FamilyMember {
  id: string;
  family_member_name: string;
  family_member_email: string;
  relationship: string;
  approved_at: string;
}

export default function FamilyCircleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [childProfileId, setChildProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyCircle();
  }, []);

  const loadFamilyCircle = async () => {
    try {
      if (!user?.id) return;

      // Get child profile
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setChildProfileId(profile.id);

      // Get approved family members
      const { data: members, error } = await supabase
        .from('family_circle')
        .select('*')
        .eq('child_profile_id', profile.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFamilyMembers(members || []);
    } catch (error) {
      console.error('Error loading family circle:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipEmoji = (relationship: string) => {
    const emojis: Record<string, string> = {
      parent: '👨‍👩',
      grandparent: '👴👵',
      sibling: '👧👦',
      aunt_uncle: '👨‍👩',
      other: '👤',
    };
    return emojis[relationship] || '👤';
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      parent: 'Parent',
      grandparent: 'Grandparent',
      sibling: 'Sibling',
      aunt_uncle: 'Aunt/Uncle',
      other: 'Family',
    };
    return labels[relationship] || 'Family';
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="My Family Circle"
        subtitle="People who cheer you on"
        showAvatar={false}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Shield size={32} color={colors.mint} />
          <Text style={styles.infoTitle}>Your Safe Circle</Text>
          <Text style={styles.infoText}>
            These are family members approved by your parent. They can see your achievements and cheer you on!
          </Text>
        </View>

        {/* Family Members */}
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>No family members yet</Text>
            <Text style={styles.emptyText}>
              Ask your parent to add family members who can celebrate your achievements with you!
            </Text>
          </View>
        ) : (
          <View style={styles.membersGrid}>
            {familyMembers.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberEmoji}>
                    {getRelationshipEmoji(member.relationship)}
                  </Text>
                </View>
                <Text style={styles.memberName}>{member.family_member_name}</Text>
                <View style={styles.relationshipBadge}>
                  <Text style={styles.relationshipText}>
                    {getRelationshipLabel(member.relationship)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* What They Can See */}
        {familyMembers.length > 0 && (
          <View style={styles.permissionsCard}>
            <Text style={styles.permissionsTitle}>What they can see:</Text>
            <View style={styles.permissionsList}>
              <View style={styles.permissionItem}>
                <Sparkles size={16} color={colors.purple} />
                <Text style={styles.permissionText}>Your achievements & badges</Text>
              </View>
              <View style={styles.permissionItem}>
                <Star size={16} color={colors.yellow} />
                <Text style={styles.permissionText}>Your routine streaks</Text>
              </View>
              <View style={styles.permissionItem}>
                <Heart size={16} color={colors.peach} />
                <Text style={styles.permissionText}>Your progress milestones</Text>
              </View>
            </View>
            <Text style={styles.permissionsNote}>
              They can send you encouragement and celebrate with you!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  infoCard: {
    backgroundColor: colors.mint + '10',
    padding: spacing[5],
    borderRadius: radii.xl,
    alignItems: 'center',
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.mint + '30',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[6],
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  memberCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  memberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  memberEmoji: {
    fontSize: 40,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  relationshipBadge: {
    backgroundColor: colors.purple + '20',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  permissionsCard: {
    backgroundColor: colors.cream,
    padding: spacing[5],
    borderRadius: radii.xl,
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[3],
  },
  permissionsList: {
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  permissionText: {
    fontSize: 14,
    color: colors.charcoal,
  },
  permissionsNote: {
    fontSize: 13,
    color: colors.charcoal,
    fontStyle: 'italic',
    marginTop: spacing[2],
  },
  bottomSpacer: {
    height: spacing[8],
  },
});
