import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { ChevronLeft, Bell, CheckCircle, AlertCircle, Package, Sparkles, Circle } from 'lucide-react-native';
import { getNotifications, markNotificationAsRead } from '../../../src/modules/notifications';
import { Notification } from '../../src/types/products';
import { useAuth } from '../../src/contexts/AuthContext';

type FilterType = 'all' | 'unread' | 'approval' | 'routine' | 'product';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  async function loadNotifications() {
    if (!user?.id) return;
    
    setLoading(true);
    const data = await getNotifications(user.id);
    setAllNotifications(data);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  async function handleMarkAsRead(notification: Notification) {
    if (notification.read) return;
    
    const success = await markNotificationAsRead(notification.id);
    if (success) {
      setAllNotifications(allNotifications.map(n =>
        n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n
      ));
    }
  }

  async function handleMarkAllAsRead() {
    const unreadIds = allNotifications.filter(n => !n.read).map(n => n.id);
    
    for (const id of unreadIds) {
      await markNotificationAsRead(id);
    }
    
    setAllNotifications(allNotifications.map(n => ({
      ...n,
      read: true,
      read_at: n.read_at || new Date().toISOString()
    })));
  }

  // Filter notifications client-side
  const notifications = allNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <CheckCircle size={20} color={colors.mint} />;
      case 'routine':
        return <Sparkles size={20} color={colors.purple} />;
      case 'product':
        return <Package size={20} color={colors.orange} />;
      default:
        return <Bell size={20} color={colors.charcoal} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval':
        return colors.mint;
      case 'routine':
        return colors.purple;
      case 'product':
        return colors.orange;
      default:
        return colors.charcoal;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all</Text>
          </Pressable>
        )}
        {unreadCount === 0 && <View style={styles.backButton} />}
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Bell size={32} color={colors.purple} />
            {unreadCount > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>
            {unreadCount > 0 ? `${unreadCount} Unread` : 'All Caught Up!'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {notifications.length} total {notifications.length === 1 ? 'notification' : 'notifications'}
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
              style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
              onPress={() => setFilter('unread')}
            >
              <Circle size={16} color={filter === 'unread' ? colors.white : colors.charcoal} />
              <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'approval' && styles.filterChipActive]}
              onPress={() => setFilter('approval')}
            >
              <CheckCircle size={16} color={filter === 'approval' ? colors.white : colors.mint} />
              <Text style={[styles.filterText, filter === 'approval' && styles.filterTextActive]}>
                Approvals
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'routine' && styles.filterChipActive]}
              onPress={() => setFilter('routine')}
            >
              <Sparkles size={16} color={filter === 'routine' ? colors.white : colors.purple} />
              <Text style={[styles.filterText, filter === 'routine' && styles.filterTextActive]}>
                Routines
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, filter === 'product' && styles.filterChipActive]}
              onPress={() => setFilter('product')}
            >
              <Package size={16} color={filter === 'product' ? colors.white : colors.orange} />
              <Text style={[styles.filterText, filter === 'product' && styles.filterTextActive]}>
                Products
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'unread' 
                  ? "You're all caught up!"
                  : 'Notifications will appear here'
                }
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const notificationColor = getNotificationColor(notification.type);
              
              return (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread,
                  ]}
                  onPress={() => handleMarkAsRead(notification)}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: notificationColor + '20' }]}>
                    {getNotificationIcon(notification.type)}
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.created_at)}
                    </Text>
                  </View>
                </Pressable>
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
  markAllButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mint,
  },
  scrollView: {
    flex: 1,
  },
  hero: {
    backgroundColor: colors.cream,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    position: 'relative',
  },
  heroBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.red,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
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
  filterBadge: {
    backgroundColor: colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  notificationsSection: {
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  notificationCardUnread: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple + '40',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.purple,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  notificationTime: {
    fontSize: 12,
    color: colors.charcoal,
  },
});
