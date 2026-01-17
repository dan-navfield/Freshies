import { View, Text, Pressable, StyleSheet, Image, TextInput, Keyboard } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../../theme/tokens';
import { User, Search, Bell, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChildProfile } from '../contexts/ChildProfileContext';
import { supabase } from '../lib/supabase';
import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores';

import GlobalSearchOverlay from './GlobalSearch/GlobalSearchOverlay';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  showAvatar?: boolean;
  avatarEmoji?: string;
  avatarUrl?: string | null;
  showSearch?: boolean;
  searchPlaceholder?: string;
  compact?: boolean;
  showNotifications?: boolean;
  unreadCount?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
  searchRightAction?: React.ReactNode;
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  searchMode?: 'global' | 'local';
  onSearchFocus?: () => void;
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
  onBackPress,
  searchRightAction,
  onSearchChange,
  searchValue = '',
  searchMode = 'global', // Default to global
  onSearchFocus,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userRole } = useAuth();
  const { childProfile } = useChildProfile();
  const profile = useAuthStore(state => state.profile);
  const [internalUnreadCount, setInternalUnreadCount] = useState(0);

  // Global Search State
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');

  // ... (Avatar logic stays same)

  let displayAvatarUrl = avatarUrl;
  if (displayAvatarUrl === undefined) {
    if (userRole === 'child') {
      displayAvatarUrl = childProfile?.avatar_url || null;
    } else {
      displayAvatarUrl = profile?.avatar_url || null;
    }
  }

  const displayAvatarEmoji = avatarEmoji !== undefined ? avatarEmoji : (childProfile?.avatar_emoji || undefined);
  const displayUnreadCount = unreadCount !== undefined ? unreadCount : internalUnreadCount;
  const resolvedName = userName || profile?.first_name || title || '?';

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

  const handleSearchChange = (text: string) => {
    if (searchMode === 'global') {
      setGlobalQuery(text);
      // Only show overlay if there is text
      setGlobalSearchVisible(text.length > 0);
    } else {
      onSearchChange?.(text);
    }
  };

  const handleSearchFocus = () => {
    if (onSearchFocus) onSearchFocus();
  };

  return (
    <View style={{ zIndex: 100 }}>
      {/* Header with Avatar */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) + 10 }
      ]}>
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
              <View style={[styles.avatarEmoji, { backgroundColor: colors.purple }]}>
                <Text style={[styles.avatarEmojiText, { color: colors.white, fontSize: 18, fontWeight: '700' }]}>
                  {resolvedName[0]?.toUpperCase()}
                </Text>
              </View>
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
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#CCCCCC"
              value={searchMode === 'global' ? globalQuery : searchValue}
              onChangeText={handleSearchChange}
              onFocus={handleSearchFocus}
            />
          </View>
          {/* Right Action */}
          {searchRightAction && (
            <View style={styles.searchRightAction}>
              {searchRightAction}
            </View>
          )}
        </View>
      )}

      {/* Global Search Overlay - Dropdown style */}
      {searchMode === 'global' && globalSearchVisible && (
        <GlobalSearchOverlay
          visible={globalSearchVisible}
          query={globalQuery}
          onClose={() => {
            setGlobalSearchVisible(false);
            Keyboard.dismiss();
          }}
        />
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
    // paddingTop handled dynamically
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
    zIndex: 101, // High zIndex for dropdown
  },
  // ... (rest of styles same)
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
    zIndex: 100, // Ensure search bar is on top of page content
  },
  searchContainerCompact: {
    paddingBottom: spacing[1],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  searchBar: {
    width: '100%', // Use width 100% instead of flex: 1 for more predictable layout in all contexts
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing[4],
    height: 50, // Fixed height for consistency
    borderRadius: radii.md,
    gap: spacing[2],
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    padding: 0,
    height: '100%',
    textAlignVertical: 'center', // Android fix
  },
  searchRightAction: {
    // Container for the action button
  },
});
