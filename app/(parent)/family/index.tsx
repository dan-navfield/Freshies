import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Users, Plus, Settings, AlertCircle, CheckCircle, Clock, ChevronLeft, Package } from 'lucide-react-native';
import { getChildren } from '../../../src/services/familyService';
import { ChildProfile, SAFETY_TIERS } from '../../../src/types/family';

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [showAddBanner, setShowAddBanner] = useState(true);

  // Reload children when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [user])
  );

  async function loadChildren() {
    if (!user?.id) return;
    
    setLoading(true);
    const data = await getChildren(user.id);
    setChildren(data);
    setLoading(false);
  }

  const getSafetyColor = (tier: string) => {
    switch (tier) {
      case 'strict': return colors.red;
      case 'moderate': return colors.orange;
      case 'relaxed': return colors.mint;
      default: return colors.charcoal;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} color={colors.mint} />;
      case 'pending': return <Clock size={16} color={colors.orange} />;
      case 'paused': return <AlertCircle size={16} color={colors.charcoal} />;
      default: return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Users size={28} color={colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Family</Text>
            <Text style={styles.headerSubtitle}>
              {children.length} {children.length === 1 ? 'child' : 'children'}
            </Text>
          </View>
        </View>
        <Pressable 
          style={styles.settingsButton}
          onPress={() => router.push('/family/settings' as any)}
        >
          <Settings size={24} color={colors.white} />
        </Pressable>
      </View>

      {/* Add Child Banner - Black Banner Only */}
      {!loading && showAddBanner && children.length > 0 && (
        <View style={styles.section}>
          <View style={styles.addBanner}>
            <Pressable 
              style={styles.addBannerContent}
              onPress={() => router.push('/family/add-child' as any)}
            >
              <View style={styles.addBannerIcon}>
                <Users size={20} color={colors.white} />
              </View>
              <View style={styles.addBannerText}>
                <Text style={styles.addBannerTitle}>
                  You have {children.length} {children.length === 1 ? 'Child' : 'Children'}. Tap to Add
                </Text>
              </View>
              <ChevronLeft size={20} color={colors.white} style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            <Pressable 
              style={styles.dismissButton}
              onPress={() => setShowAddBanner(false)}
            >
              <Text style={styles.dismissButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Children List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading family...</Text>
        </View>
      ) : children.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>No children added yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first child to start managing their skincare safety
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          {children.map((child) => (
            <Pressable 
              key={child.id}
              style={[
                styles.childCard,
                selectedChild === child.id && styles.childCardSelected
              ]}
              onPress={() => router.push(`/family/child/${child.id}` as any)}
            >
              {/* Child Avatar & Info */}
              <View style={styles.childHeader}>
                <Image 
                  source={{ 
                    uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
                  }}
                  style={styles.childAvatar}
                />
                <View style={styles.childInfo}>
                  <View style={styles.childNameRow}>
                    <Text style={styles.childName}>{child.display_name}</Text>
                    {getStatusIcon(child.status)}
                  </View>
                  <Text style={styles.childAge}>{child.age} years old</Text>
                  <View style={styles.childMeta}>
                    <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(child.safety_tier) + '20' }]}>
                      <Text style={[styles.safetyBadgeText, { color: getSafetyColor(child.safety_tier) }]}>
                        {SAFETY_TIERS[child.safety_tier].label}
                      </Text>
                    </View>
                    <View style={styles.deviceBadge}>
                      <Text style={styles.deviceBadgeText}>
                        {child.device_status === 'linked' ? '📱 Linked' : '⏳ Not Linked'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Activity Summary */}
              <View style={styles.activitySummary}>
                <View style={styles.activityItem}>
                  <Text style={styles.activityNumber}>{child.needs_approval_count}</Text>
                  <Text style={styles.activityLabel}>Needs Approval</Text>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <Text style={styles.activityNumber}>{child.recent_scans_count}</Text>
                  <Text style={styles.activityLabel}>Recent Scans</Text>
                </View>
                <View style={styles.activityDivider} />
                <View style={styles.activityItem}>
                  <Text style={styles.activityNumber}>{child.flagged_products_count}</Text>
                  <Text style={styles.activityLabel}>Flagged</Text>
                </View>
              </View>

              {/* Alerts */}
              {child.needs_approval_count > 0 && (
                <View style={styles.alertBanner}>
                  <AlertCircle size={16} color={colors.orange} />
                  <Text style={styles.alertText}>
                    {child.needs_approval_count} {child.needs_approval_count === 1 ? 'item' : 'items'} waiting for review
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      {children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Pressable style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <AlertCircle size={20} color={colors.orange} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Review All Pending</Text>
              <Text style={styles.actionSubtitle}>
                {children.reduce((sum, child) => sum + child.needs_approval_count, 0)} items need attention
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.actionCard}
            onPress={() => router.push('/products' as any)}
          >
            <View style={styles.actionIcon}>
              <Package size={20} color={colors.purple} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Product Library</Text>
              <Text style={styles.actionSubtitle}>View approved products</Text>
            </View>
          </Pressable>

          <Pressable style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <CheckCircle size={20} color={colors.mint} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Family Activity</Text>
              <Text style={styles.actionSubtitle}>View combined scan history</Text>
            </View>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[6],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingLeft: spacing[2],
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  settingsButton: {
    padding: spacing[2],
  },
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  addBanner: {
    position: 'relative',
    backgroundColor: colors.black,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  addBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingLeft: spacing[3],
    paddingRight: 70,
    gap: spacing[2],
  },
  addBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBannerText: {
    flex: 1,
  },
  addBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    flexWrap: 'nowrap',
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[5],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.purple,
    borderStyle: 'dashed',
    gap: spacing[4],
  },
  addChildIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChildText: {
    flex: 1,
  },
  addChildTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  addChildSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  loadingContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
  childCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childCardSelected: {
    borderColor: colors.purple,
  },
  childHeader: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    gap: spacing[4],
  },
  childAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.cream,
  },
  childInfo: {
    flex: 1,
    gap: spacing[2],
  },
  childNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  childAge: {
    fontSize: 14,
    color: colors.charcoal,
  },
  childMeta: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  safetyBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  safetyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    backgroundColor: colors.cream,
  },
  deviceBadgeText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  activitySummary: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },
  activityDivider: {
    width: 1,
    backgroundColor: colors.mist,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: spacing[3],
    borderRadius: radii.md,
    marginTop: spacing[3],
    gap: spacing[2],
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.charcoal,
  },
});
