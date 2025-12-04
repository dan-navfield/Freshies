import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radii, spacing } from '../src/theme/tokens';
import { User, Search, Bell, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChildProfile } from '../src/contexts/ChildProfileContext';
import { supabase } from '../lib/supabase';
import { useState, useCallback } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  showAvatar?: boolean;
  avatarEmoji?: string; // For child profiles with emoji avatars
  avatarUrl?: string | null; // For uploaded avatar images
  showSearch?: boolean;
  searchPlaceholder?: string;
  compact?: boolean; // For pages with child switcher below
  showNotifications?: boolean;
  unreadCount?: number;
  showBackButton?: boolean; // Show back button
  onBackPress?: () => void; // Custom back handler
}

export default function PageHeader({
  title,
  subtitle,
  userName,
  showAvatar = true,
  avatarEmoji,
  avatarUrl,
  showSearch = true,
  searchPlaceholder = 'Search products, brands, ingredients...',
  compact = false,
  showNotifications = true,
  unreadCount,
  showBackButton = false,
  onBackPress
}: PageHeaderProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { childProfile } = useChildProfile();
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);
  
  // Use child profile avatar if available and no explicit avatar provided
  // Note: Using 'as any' temporarily because TypeScript types are outdated
  // The database actually has avatar_url and avatar_emoji columns
  const displayAvatarUrl = avatarUrl !== undefined ? avatarUrl : ((childProfile as any)?.avatar_url || null);
  const displayAvatarEmoji = avatarEmoji !== undefined ? avatarEmoji : ((childProfile as any)?.avatar_emoji || undefined);
  
  // Use provided unreadCount if available, otherwise use internal count
  const displayUnreadCount = unreadCount !== undefined ? unreadCount : internalUnreadCount;
  
  // Load unread notifications count
  const loadUnreadNotifications = useCallback(async () => {
    if (!user?.id || !showNotifications) return;
    
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setInternalUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  }, [user?.id, showNotifications]);
  
  // Load on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUnreadNotifications();
    }, [loadUnreadNotifications])
  );

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View>
      {/* Header with Avatar */}
      <View style={styles.header}>
        {showBackButton && (
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <ChevronLeft size={24} color={colors.white} strokeWidth={2} />
          </Pressable>
        )}
        <View style={[styles.headerText, showBackButton && styles.headerTextWithBack]}>
          <Text style={styles.greeting}>{title}</Text>
          <Text style={styles.subGreeting}>{subtitle}</Text>
        </View>
        {showAvatar && (
          <Pressable 
            style={styles.avatarButton}
            onPress={() => {
              console.log('Avatar pressed, userRole:', userRole);
              if (userRole === 'child') {
                router.push('/(child)/account');
              } else {
                router.push('/(parent)/account' as any);
              }
            }}
          >
            {displayAvatarUrl ? (
              <Image 
                source={{ uri: displayAvatarUrl }}
                style={styles.avatar}
              />
            ) : displayAvatarEmoji ? (
              <View style={styles.avatarEmoji}>
                <Text style={styles.avatarEmojiText}>{displayAvatarEmoji}</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces' }}
                style={styles.avatar}
              />
            )}
            {showNotifications && displayUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={[styles.searchContainer, compact && styles.searchContainerCompact]}>
          <View style={styles.searchBar}>
            <Search size={20} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.searchPlaceholder}>{searchPlaceholder}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  headerText: {
    flex: 1,
  },
  headerTextWithBack: {
    marginLeft: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  avatarButton: {
    padding: 4,
    position: 'relative',
  },
  notificationBadge: {
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
    borderColor: colors.black,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmojiText: {
    fontSize: 28,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[1],
    paddingBottom: spacing[6],
    backgroundColor: colors.black,
  },
  searchContainerCompact: {
    paddingBottom: spacing[1],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    gap: spacing[2],
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
