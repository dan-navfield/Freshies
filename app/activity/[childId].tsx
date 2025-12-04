import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { ChevronLeft, Scan, CheckCircle, XCircle, Package, Calendar, Filter } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { getChildById } from '../../src/services/familyService';
import { ChildProfile } from '../../src/types/family';

interface Activity {
  id: string;
  child_id: string;
  activity_type: 'product_scan' | 'approval' | 'product_usage' | 'routine_completion';
  product_name?: string;
  product_brand?: string;
  product_image_url?: string;
  status?: string;
  metadata?: any;
  created_at: string;
}

type FilterType = 'all' | 'scans' | 'approvals' | 'usage';

export default function ActivityFeedScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [childId]);

  async function loadData() {
    if (!childId || typeof childId !== 'string') return;
    
    setLoading(true);
    const [childData, activitiesData] = await Promise.all([
      getChildById(childId),
      loadActivities(childId),
    ]);
    
    setChild(childData);
    setAllActivities(activitiesData);
    setLoading(false);
  }

  // Filter activities client-side instead of reloading
  const activities = allActivities.filter(activity => {
    if (filter === 'all') return true;
    const typeMap: Record<FilterType, string> = {
      scans: 'product_scan',
      approvals: 'approval',
      usage: 'product_usage',
      all: ''
    };
    return activity.activity_type === typeMap[filter];
  });

  async function loadActivities(childId: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('child_activities')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  }

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'product_scan':
        return <Scan size={20} color={colors.purple} />;
      case 'approval':
        return status === 'approved' 
          ? <CheckCircle size={20} color={colors.mint} />
          : <XCircle size={20} color={colors.red} />;
      case 'product_usage':
        return <Package size={20} color={colors.orange} />;
      default:
        return <Calendar size={20} color={colors.charcoal} />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    switch (type) {
      case 'product_scan':
        return colors.purple;
      case 'approval':
        return status === 'approved' ? colors.mint : colors.red;
      case 'product_usage':
        return colors.orange;
      default:
        return colors.charcoal;
    }
  };

  const getActivityTitle = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'product_scan':
        return 'Scanned Product';
      case 'approval':
        return activity.status === 'approved' ? 'Product Approved' : 'Product Declined';
      case 'product_usage':
        return 'Used Product';
      case 'routine_completion':
        return 'Completed Routine';
      default:
        return 'Activity';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading || !child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{child.display_name}'s Activity</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Image 
            source={{ 
              uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
            }}
            style={styles.heroAvatar}
          />
          <Text style={styles.heroTitle}>Activity Feed</Text>
          <Text style={styles.heroSubtitle}>
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'scans' && styles.filterChipActive]}
              onPress={() => setFilter('scans')}
            >
              <Scan size={16} color={filter === 'scans' ? colors.white : colors.charcoal} />
              <Text style={[styles.filterText, filter === 'scans' && styles.filterTextActive]}>
                Scans
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'approvals' && styles.filterChipActive]}
              onPress={() => setFilter('approvals')}
            >
              <CheckCircle size={16} color={filter === 'approvals' ? colors.white : colors.charcoal} />
              <Text style={[styles.filterText, filter === 'approvals' && styles.filterTextActive]}>
                Approvals
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'usage' && styles.filterChipActive]}
              onPress={() => setFilter('usage')}
            >
              <Package size={16} color={filter === 'usage' ? colors.white : colors.charcoal} />
              <Text style={[styles.filterText, filter === 'usage' && styles.filterTextActive]}>
                Usage
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Activity Timeline */}
        <View style={styles.timelineSection}>
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySubtitle}>
                Activity will appear here as {child.display_name} uses the app
              </Text>
            </View>
          ) : (
            activities.map((activity, index) => {
              const activityColor = getActivityColor(activity.activity_type, activity.status);
              
              return (
                <View key={activity.id} style={styles.activityItem}>
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  
                  {/* Activity Icon */}
                  <View style={[styles.activityIcon, { backgroundColor: activityColor + '20' }]}>
                    {getActivityIcon(activity.activity_type, activity.status)}
                  </View>

                  {/* Activity Content */}
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>
                        {getActivityTitle(activity)}
                      </Text>
                      <Text style={styles.activityTime}>
                        {formatDate(activity.created_at)}
                      </Text>
                    </View>

                    {activity.product_name && (
                      <View style={styles.productInfo}>
                        {activity.product_image_url && (
                          <Image 
                            source={{ uri: activity.product_image_url }}
                            style={styles.productImage}
                          />
                        )}
                        <View style={styles.productText}>
                          <Text style={styles.productName} numberOfLines={1}>
                            {activity.product_name}
                          </Text>
                          {activity.product_brand && (
                            <Text style={styles.productBrand} numberOfLines={1}>
                              {activity.product_brand}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.cream,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing[4],
    borderWidth: 3,
    borderColor: colors.white,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  filtersSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.cream,
    borderRadius: radii.full,
    marginRight: spacing[2],
  },
  filterChipActive: {
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
  timelineSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  emptyState: {
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
  activityItem: {
    flexDirection: 'row',
    marginBottom: spacing[5],
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 48,
    bottom: -20,
    width: 2,
    backgroundColor: colors.mist,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    zIndex: 1,
  },
  activityContent: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  activityTime: {
    fontSize: 13,
    color: colors.charcoal,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  productText: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 13,
    color: colors.charcoal,
  },
});
