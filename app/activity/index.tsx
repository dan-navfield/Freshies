import { View, Text, ScrollView, Pressable, StyleSheet, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Filter, Calendar } from 'lucide-react-native';
import { getParentActivities, groupActivitiesByDate, getActivityStats, getTimeAgo } from '../../src/services/activityService';
import { ActivityWithChild, ActivityGroup, ActivityStats, ActivityFilter, ACTIVITY_CONFIG, CATEGORY_CONFIG } from '../../src/types/activity';
import { getChildren } from '../../src/services/familyService';
import { ChildProfile } from '../../src/types/family';

export default function ActivityTimelineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityWithChild[]>([]);
  const [groupedActivities, setGroupedActivities] = useState<ActivityGroup[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, filter]);

  async function loadData() {
    if (!user?.id) return;
    
    setLoading(true);
    const [activitiesData, statsData, childrenData] = await Promise.all([
      getParentActivities(user.id, filter),
      getActivityStats(user.id),
      getChildren(user.id),
    ]);
    
    setActivities(activitiesData);
    setGroupedActivities(groupActivitiesByDate(activitiesData));
    setStats(statsData);
    setChildren(childrenData);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function clearFilters() {
    setFilter({});
    setShowFilters(false);
  }

  const hasActiveFilters = filter.child_id || filter.category;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Activity Timeline</Text>
        <Pressable onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Filter size={20} color={hasActiveFilters ? colors.purple : colors.white} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Stats Bar */}
        {stats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_today}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total_week}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            {stats.most_active_child && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Most Active</Text>
                  <Text style={styles.statName}>{stats.most_active_child}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>Filter by:</Text>
            
            {/* Child Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Child</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <Pressable
                  style={[styles.filterChip, !filter.child_id && styles.filterChipActive]}
                  onPress={() => setFilter({ ...filter, child_id: undefined })}
                >
                  <Text style={[styles.filterChipText, !filter.child_id && styles.filterChipTextActive]}>
                    All
                  </Text>
                </Pressable>
                {children.map((child) => (
                  <Pressable
                    key={child.id}
                    style={[styles.filterChip, filter.child_id === child.id && styles.filterChipActive]}
                    onPress={() => setFilter({ ...filter, child_id: child.id })}
                  >
                    <Text style={[styles.filterChipText, filter.child_id === child.id && styles.filterChipTextActive]}>
                      {child.display_name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Category Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <Pressable
                  style={[styles.filterChip, !filter.category && styles.filterChipActive]}
                  onPress={() => setFilter({ ...filter, category: undefined })}
                >
                  <Text style={[styles.filterChipText, !filter.category && styles.filterChipTextActive]}>
                    All
                  </Text>
                </Pressable>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <Pressable
                    key={key}
                    style={[styles.filterChip, filter.category === key && styles.filterChipActive]}
                    onPress={() => setFilter({ ...filter, category: key as any })}
                  >
                    <Text style={styles.filterChipIcon}>{config.icon}</Text>
                    <Text style={[styles.filterChipText, filter.category === key && styles.filterChipTextActive]}>
                      {config.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {hasActiveFilters && (
              <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Activity Timeline */}
        <View style={styles.timeline}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Loading activities...</Text>
            </View>
          ) : groupedActivities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyTitle}>No Activity Yet</Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveFilters 
                  ? 'Try adjusting your filters'
                  : 'Activity will appear here as your children use the app'
                }
              </Text>
            </View>
          ) : (
            groupedActivities.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>{group.display_date}</Text>
                  <Text style={styles.dateCount}>{group.count} {group.count === 1 ? 'activity' : 'activities'}</Text>
                </View>

                {group.activities.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.activity_type];
                  return (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={[styles.activityIcon, { backgroundColor: config.color + '20' }]}>
                        <Text style={styles.activityEmoji}>{config.icon}</Text>
                      </View>
                      
                      <View style={styles.activityContent}>
                        <View style={styles.activityHeader}>
                          <Image 
                            source={{ 
                              uri: activity.child_avatar_url || `https://ui-avatars.com/api/?name=${activity.child_name}&background=random&size=200`
                            }}
                            style={styles.childAvatar}
                          />
                          <Text style={styles.childName}>{activity.child_name}</Text>
                          <Text style={styles.activityTime}>{getTimeAgo(activity.created_at)}</Text>
                        </View>
                        
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        
                        {activity.description && (
                          <Text style={styles.activityDescription} numberOfLines={2}>
                            {activity.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
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
  scrollView: {
    flex: 1,
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
  filterButton: {
    width: 40,
    alignItems: 'flex-end',
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
    gap: spacing[1],
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
  statName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.mist,
  },
  filtersSection: {
    backgroundColor: colors.white,
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  filterGroup: {
    marginBottom: spacing[4],
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    backgroundColor: colors.cream,
    marginRight: spacing[2],
    gap: spacing[1],
  },
  filterChipActive: {
    backgroundColor: colors.purple,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  timeline: {
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
  dateGroup: {
    marginBottom: spacing[6],
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  dateCount: {
    fontSize: 13,
    color: colors.charcoal,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  childAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  childName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.purple,
  },
  activityTime: {
    fontSize: 12,
    color: colors.charcoal,
    marginLeft: 'auto',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[1],
  },
  activityDescription: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
});
