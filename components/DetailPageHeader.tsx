import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radii, spacing } from '../src/theme/tokens';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';

interface DetailPageHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  showSettings?: boolean;
  onBackPress?: () => void;
  onSettingsPress?: () => void;
  rightElement?: React.ReactNode; // Custom right element instead of avatar
}

/**
 * Header component specifically for detail/child pages
 * Always shows back button, optionally shows avatar or custom right element
 */
export default function DetailPageHeader({
  title,
  subtitle,
  showAvatar = true,
  showSettings = false,
  onBackPress,
  onSettingsPress,
  rightElement
}: DetailPageHeaderProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (showAvatar && user?.id) {
      loadAvatar();
    }
  }, [user, showAvatar]);

  // Load unread notifications count
  const loadUnreadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  }, [user?.id]);
  
  // Load on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUnreadNotifications();
    }, [loadUnreadNotifications])
  );

  const loadAvatar = async () => {
    try {
      if (userRole === 'child') {
        // Load child profile avatar
        const { data } = await supabase
          .from('child_profiles')
          .select('avatar_url, avatar_config')
          .eq('user_id', user?.id)
          .single();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
          if (data.avatar_config?.emoji) {
            setAvatarEmoji(data.avatar_config.emoji);
          }
        }
      } else {
        // Load parent profile avatar
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user?.id)
          .single();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleAvatarPress = () => {
    const accountPath = userRole === 'child' ? '/(child)/account' : '/(parent)/account';
    router.push(accountPath as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Back Button - Always present on detail pages */}
        <Pressable style={styles.backButton} onPress={handleBackPress}>
          <ChevronLeft size={24} color={colors.white} strokeWidth={2} />
        </Pressable>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>

        {/* Right Section - Avatar, Settings, or Custom Element */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : showAvatar ? (
            <Pressable style={styles.avatarButton} onPress={handleAvatarPress}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : avatarEmoji ? (
                <View style={styles.avatarEmoji}>
                  <Text style={styles.avatarEmojiText}>{avatarEmoji}</Text>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.email?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : showSettings ? (
            <Pressable style={styles.settingsButton} onPress={onSettingsPress}>
              <Settings size={20} color={colors.white} />
            </Pressable>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
    paddingTop: 60, // Account for status bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    minHeight: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing[2],
  },
  titleSection: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
    marginTop: 2,
  },
  rightSection: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButton: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarEmoji: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarEmojiText: {
    fontSize: 20,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 40,
    height: 40,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.red,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.black,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
});
