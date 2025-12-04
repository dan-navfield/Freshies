import { View, Text, ScrollView, Pressable, StyleSheet, Image, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import { ChevronLeft, AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react-native';
import { getPendingApprovals, getApprovalStats, approveProduct, declineProduct } from '../../../src/services/approvalService';
import { ApprovalWithDetails, ApprovalStats, SEVERITY_CONFIG } from '../../../src/types/approval';

export default function ApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalWithDetails[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');

  useEffect(() => {
    loadApprovals();
  }, [user]);

  async function loadApprovals() {
    if (!user?.id) return;
    
    setLoading(true);
    const [approvalsData, statsData] = await Promise.all([
      getPendingApprovals(user.id),
      getApprovalStats(user.id),
    ]);
    
    setApprovals(approvalsData);
    setStats(statsData);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadApprovals();
    setRefreshing(false);
  }

  const filteredApprovals = filter === 'flagged' 
    ? approvals.filter(a => a.flag_count > 0)
    : approvals;

  const getSeverityColor = (severity: string) => {
    return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]?.color || colors.charcoal;
  };

  async function handleQuickApprove(approval: ApprovalWithDetails, e: any) {
    e.stopPropagation();
    
    Alert.alert(
      'Quick Approve',
      `Approve ${approval.product_name} for ${approval.child_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const success = await approveProduct({
              approval_id: approval.id,
              action: 'approve',
              notify_child: true,
            });
            
            if (success) {
              await loadApprovals();
              Alert.alert('Approved!', `${approval.product_name} has been approved.`);
            } else {
              Alert.alert('Error', 'Failed to approve product. Please try again.');
            }
          },
        },
      ]
    );
  }

  async function handleQuickDecline(approval: ApprovalWithDetails, e: any) {
    e.stopPropagation();
    
    Alert.alert(
      'Quick Decline',
      `Decline ${approval.product_name} for ${approval.child_name}?\n\nTip: Tap the card to add a note explaining why.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            const success = await declineProduct({
              approval_id: approval.id,
              action: 'decline',
              notify_child: true,
            });
            
            if (success) {
              await loadApprovals();
              Alert.alert('Declined', `${approval.product_name} has been declined.`);
            } else {
              Alert.alert('Error', 'Failed to decline product. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Approval Queue</Text>
        <View style={styles.backButton} />
      </View>

      {/* Stats Bar */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Clock size={20} color={colors.orange} />
            <Text style={styles.statNumber}>{stats.total_pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AlertCircle size={20} color={colors.red} />
            <Text style={styles.statNumber}>{stats.flagged_count}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <CheckCircle size={20} color={colors.mint} />
            <Text style={styles.statNumber}>{stats.total_approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>
      )}

      {/* Filter */}
      <View style={styles.filterSection}>
        <Pressable 
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({approvals.length})
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.filterButton, filter === 'flagged' && styles.filterButtonActive]}
          onPress={() => setFilter('flagged')}
        >
          <AlertCircle size={16} color={filter === 'flagged' ? colors.white : colors.charcoal} />
          <Text style={[styles.filterText, filter === 'flagged' && styles.filterTextActive]}>
            Flagged ({approvals.filter(a => a.flag_count > 0).length})
          </Text>
        </Pressable>
      </View>

      {/* Approvals List */}
      <View style={styles.section}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading approvals...</Text>
          </View>
        ) : filteredApprovals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color={colors.mint} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'flagged' 
                ? 'No flagged products need review'
                : 'No pending approvals at the moment'
              }
            </Text>
          </View>
        ) : (
          filteredApprovals.map((approval) => (
            <Pressable
              key={approval.id}
              style={styles.approvalCard}
              onPress={() => router.push(`/approvals/${approval.id}` as any)}
            >
              {/* Product Image & Info */}
              <View style={styles.approvalHeader}>
                {approval.product_image_url ? (
                  <Image 
                    source={{ uri: approval.product_image_url }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productImagePlaceholderText}>📦</Text>
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {approval.product_name}
                  </Text>
                  {approval.product_brand && (
                    <Text style={styles.productBrand}>{approval.product_brand}</Text>
                  )}
                  <View style={styles.requestInfo}>
                    <Image 
                      source={{ 
                        uri: approval.child_avatar_url || `https://ui-avatars.com/api/?name=${approval.child_name}&background=random&size=200`
                      }}
                      style={styles.childAvatar}
                    />
                    <Text style={styles.childName}>{approval.child_name}</Text>
                    <Text style={styles.requestTime}>
                      {getTimeAgo(approval.requested_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Flags */}
              {approval.flags.length > 0 && (
                <View style={styles.flagsContainer}>
                  {approval.flags.slice(0, 2).map((flag) => (
                    <View 
                      key={flag.id}
                      style={[
                        styles.flagBadge,
                        { backgroundColor: getSeverityColor(flag.severity) + '20' }
                      ]}
                    >
                      <Text style={[styles.flagText, { color: getSeverityColor(flag.severity) }]}>
                        {flag.title}
                      </Text>
                    </View>
                  ))}
                  {approval.flags.length > 2 && (
                    <Text style={styles.moreFlags}>+{approval.flags.length - 2} more</Text>
                  )}
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <Pressable 
                  style={[styles.quickActionButton, styles.approveButton]}
                  onPress={(e) => handleQuickApprove(approval, e)}
                >
                  <CheckCircle size={18} color={colors.white} />
                  <Text style={styles.quickActionText}>Approve</Text>
                </Pressable>
                <Pressable 
                  style={[styles.quickActionButton, styles.declineButton]}
                  onPress={(e) => handleQuickDecline(approval, e)}
                >
                  <XCircle size={18} color={colors.white} />
                  <Text style={styles.quickActionText}>Decline</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.mist,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    backgroundColor: colors.white,
    gap: spacing[2],
  },
  filterButtonActive: {
    backgroundColor: colors.purple,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  filterTextActive: {
    color: colors.white,
  },
  section: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  approvalHeader: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  productBrand: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  childAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  childName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  requestTime: {
    fontSize: 12,
    color: colors.charcoal,
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  flagBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  flagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreFlags: {
    fontSize: 12,
    color: colors.charcoal,
    alignSelf: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    gap: spacing[2],
  },
  approveButton: {
    backgroundColor: colors.mint,
  },
  declineButton: {
    backgroundColor: colors.red,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
