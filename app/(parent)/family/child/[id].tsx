import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { colors, radii, spacing } from '../../../../src/theme/tokens';
import { ChevronLeft, Edit, Trash2, Link as LinkIcon, Settings, Activity, Shield, AlertCircle, CheckCircle } from 'lucide-react-native';
import { getChildById, deleteChild, generateChildInvitation } from '../../../../src/services/familyService';
import { ChildProfile, SAFETY_TIERS, INDEPENDENCE_LEVELS } from '../../../../src/types/family';
import { supabase } from '../../../../src/lib/supabase';

interface ChildStats {
  needs_approval: number;
  recent_scans: number;
  flagged: number;
}

export default function ChildProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [stats, setStats] = useState<ChildStats>({ needs_approval: 0, recent_scans: 0, flagged: 0 });
  const [loading, setLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChild();
      loadStats();
    }, [id])
  );

  useEffect(() => {
    loadChild();
    loadStats();
  }, [id]);

  async function loadChild() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    const data = await getChildById(id);
    setChild(data);
    setLoading(false);
  }

  async function loadStats() {
    if (!id || typeof id !== 'string') return;

    try {
      // Get pending approvals count
      const { count: approvalsCount } = await supabase
        .from('product_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', id)
        .eq('status', 'pending');

      // Get recent scans (last 7 days)
      const { count: scansCount } = await supabase
        .from('child_activities')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', id)
        .eq('activity_type', 'product_scan')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Get flagged products count
      const { data: flaggedData } = await supabase
        .from('product_approvals')
        .select('id, product_flags(id)')
        .eq('child_id', id)
        .eq('status', 'pending');

      const flaggedCount = (flaggedData || []).filter((approval: any) => 
        approval.product_flags && approval.product_flags.length > 0
      ).length;

      setStats({
        needs_approval: approvalsCount || 0,
        recent_scans: scansCount || 0,
        flagged: flaggedCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleDelete() {
    if (!child) return;

    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child.display_name} from your family? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteChild(child.id);
            if (success) {
              router.back();
            }
          },
        },
      ]
    );
  }

  function handleGenerateInvite() {
    if (!child) return;
    router.push(`/family/child/${child.id}/link-device` as any);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Child not found</Text>
      </View>
    );
  }

  const safetySettings = SAFETY_TIERS[child.safety_tier];
  const independenceLevel = INDEPENDENCE_LEVELS.find(l => l.level === child.independence_level);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{child.display_name}</Text>
        <Pressable 
          onPress={() => router.push(`/family/child/${child.id}/edit` as any)}
          style={styles.editButton}
        >
          <Edit size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Card */}
        <View style={styles.profileHero}>
          <Image 
            source={{ 
              uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {child.first_name} {child.last_name}
          </Text>
          {child.nickname && (
            <Text style={styles.nickname}>"{child.nickname}"</Text>
          )}
          <Text style={styles.age}>{child.age} years old</Text>
          
          {child.status === 'active' ? (
            <View style={styles.statusBadge}>
              <CheckCircle size={16} color={colors.black} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.orange }]}>
              <AlertCircle size={16} color={colors.white} />
              <Text style={[styles.statusText, { color: colors.white }]}>
                {child.status}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.needs_approval}</Text>
              <Text style={styles.statLabel}>Needs Approval</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.recent_scans}</Text>
              <Text style={styles.statLabel}>Recent Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.flagged}</Text>
              <Text style={styles.statLabel}>Flagged</Text>
            </View>
          </View>
        </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable 
          style={styles.quickActionButton}
          onPress={() => router.push(`/activity/${child.id}` as any)}
        >
          <Activity size={20} color={colors.mint} />
          <Text style={styles.quickActionText}>View Activity</Text>
        </Pressable>
        
        {stats.needs_approval > 0 && (
          <Pressable 
            style={[styles.quickActionButton, styles.quickActionHighlight]}
            onPress={() => router.push(`/approvals?child=${child.id}` as any)}
          >
            <AlertCircle size={20} color={colors.white} />
            <Text style={[styles.quickActionText, { color: colors.white }]}>
              Review {stats.needs_approval} Item{stats.needs_approval > 1 ? 's' : ''}
            </Text>
          </Pressable>
        )}
        
        <Pressable 
          style={styles.quickActionButton}
          onPress={() => router.push(`/routines/${child.id}` as any)}
        >
          <Text style={{ fontSize: 20 }}>✨</Text>
          <Text style={styles.quickActionText}>Manage Routines</Text>
        </Pressable>
      </View>

      {/* Safety Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety & Permissions</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Shield size={20} color={colors.purple} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Safety Tier</Text>
            <Text style={styles.settingValue}>{safetySettings.label}</Text>
            <Text style={styles.settingDescription}>{safetySettings.description}</Text>
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon}>
            <Activity size={20} color={colors.mint} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Independence Level</Text>
            <Text style={styles.settingValue}>
              Level {child.independence_level} - {independenceLevel?.label}
            </Text>
            <Text style={styles.settingDescription}>{independenceLevel?.description}</Text>
          </View>
        </View>
      </View>

      {/* Device Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Connection</Text>

        {child.device_status === 'linked' ? (
          <View style={styles.deviceCard}>
            <View style={styles.deviceIcon}>
              <CheckCircle size={24} color={colors.mint} />
            </View>
            <View style={styles.deviceContent}>
              <Text style={styles.deviceTitle}>Device Linked</Text>
              <Text style={styles.deviceDescription}>
                {child.display_name}'s device is connected and active
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.deviceCard}>
            <View style={styles.deviceIcon}>
              <AlertCircle size={24} color={colors.orange} />
            </View>
            <View style={styles.deviceContent}>
              <Text style={styles.deviceTitle}>No Device Linked</Text>
              <Text style={styles.deviceDescription}>
                Generate an invitation code to link their device
              </Text>
            </View>
            <Pressable 
              style={styles.linkButton}
              onPress={handleGenerateInvite}
            >
              <LinkIcon size={16} color={colors.white} />
              <Text style={styles.linkButtonText}>Generate Code</Text>
            </Pressable>
          </View>
        )}

        {invitationCode && (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Invitation Code</Text>
            <Text style={styles.codeText}>{invitationCode}</Text>
            <Text style={styles.codeExpiry}>Expires in 7 days</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push(`/family/child/${child.id}/activity` as any)}
        >
          <Activity size={20} color={colors.purple} />
          <Text style={styles.actionButtonText}>View Activity</Text>
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push(`/family/child/${child.id}/permissions` as any)}
        >
          <Settings size={20} color={colors.purple} />
          <Text style={styles.actionButtonText}>Edit Permissions</Text>
        </Pressable>

        {child.needs_approval_count > 0 && (
          <Pressable 
            style={[styles.actionButton, styles.actionButtonHighlight]}
            onPress={() => router.push(`/family/child/${child.id}/approvals` as any)}
          >
            <AlertCircle size={20} color={colors.orange} />
            <Text style={[styles.actionButtonText, { color: colors.orange }]}>
              Review {child.needs_approval_count} Pending Items
            </Text>
          </Pressable>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.red }]}>Danger Zone</Text>

        <Pressable 
          style={styles.dangerButton}
          onPress={handleDelete}
        >
          <Trash2 size={20} color={colors.red} />
          <Text style={styles.dangerButtonText}>Remove Child</Text>
        </Pressable>
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
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[3],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  editButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.black,
    marginBottom: spacing[4],
  },
  profileCard: {
    alignItems: 'center',
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    backgroundColor: colors.black,
    marginBottom: spacing[4],
  },
  statsContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing[3],
    borderWidth: 3,
    borderColor: colors.charcoal,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[1],
  },
  nickname: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginBottom: spacing[2],
  },
  age: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.mint,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.mist,
  },
  quickActions: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
  },
  quickActionHighlight: {
    backgroundColor: colors.orange,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  settingCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.charcoal,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceContent: {
    flex: 1,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  deviceDescription: {
    fontSize: 13,
    color: colors.charcoal,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    gap: spacing[2],
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  codeCard: {
    backgroundColor: colors.purple + '20',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginTop: spacing[3],
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.purple,
    letterSpacing: 4,
    marginBottom: spacing[1],
  },
  codeExpiry: {
    fontSize: 12,
    color: colors.charcoal,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  actionButtonHighlight: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.red,
    gap: spacing[2],
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
});
