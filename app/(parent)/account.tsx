import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, ChevronRight, User, Bell, Shield, HelpCircle, FileText, Users, CheckCircle, Activity, Camera } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';

export default function AccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!user?.id) return;
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    }
    loadUnreadCount();
    loadAvatar();
  }, [user]);

  const loadAvatar = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.backButton} />
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Pressable 
          style={styles.avatarContainer}
          onPress={() => router.push('/(parent)/avatar-selector' as any)}
        >
          <Image 
            source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces' }}
            style={styles.profileAvatar}
          />
          <View style={styles.cameraIcon}>
            <Camera size={16} color={colors.white} strokeWidth={2.5} />
          </View>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'No email'}</Text>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <Pressable 
          style={styles.menuItem}
          onPress={() => router.push('/family' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.purple + '20' }]}>
              <Users size={20} color={colors.purple} />
            </View>
            <Text style={styles.menuItemText}>Manage Family</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable 
          style={styles.menuItem}
          onPress={() => router.push('/approvals' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.orange + '20' }]}>
              <CheckCircle size={20} color={colors.orange} />
            </View>
            <Text style={styles.menuItemText}>Approval Queue</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable 
          style={styles.menuItem}
          onPress={() => router.push('/activity' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.mint + '20' }]}>
              <Activity size={20} color={colors.mint} />
            </View>
            <Text style={styles.menuItemText}>Activity Timeline</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.purple + '20' }]}>
              <User size={20} color={colors.purple} />
            </View>
            <Text style={styles.menuItemText}>Edit Profile</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable 
          style={styles.menuItem}
          onPress={() => router.push('/notifications' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.mint + '20' }]}>
              <Bell size={20} color={colors.mint} />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.orange + '20' }]}>
              <Shield size={20} color={colors.orange} />
            </View>
            <Text style={styles.menuItemText}>Privacy & Security</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.lilac + '20' }]}>
              <HelpCircle size={20} color={colors.lilac} />
            </View>
            <Text style={styles.menuItemText}>Help Center</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>

        <Pressable style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIcon, { backgroundColor: colors.charcoal + '20' }]}>
              <FileText size={20} color={colors.charcoal} />
            </View>
            <Text style={styles.menuItemText}>Terms & Privacy</Text>
          </View>
          <ChevronRight size={20} color={colors.charcoal} />
        </Pressable>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <Pressable 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color={colors.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </View>

      {/* App Version */}
      <View style={styles.versionSection}>
        <Text style={styles.versionText}>Freshies v1.0.0</Text>
      </View>
    </ScrollView>
  );
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
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    backgroundColor: colors.black,
    marginBottom: spacing[6],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.red,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 3,
    borderColor: colors.black,
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.purple,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.black,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[1],
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.red,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  versionText: {
    fontSize: 12,
    color: colors.charcoal,
  },
});
