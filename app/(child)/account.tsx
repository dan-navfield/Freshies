import { View, Text, ScrollView, Pressable, StyleSheet, Image, Switch, Alert, Modal, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { 
  LogOut, 
  ChevronRight, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Award,
  Heart,
  Moon,
  Volume2,
  Sparkles,
  Camera,
  Users,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Edit3
} from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';

export default function ChildAccountScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({ streak: 0, points: 0, badges: 0 });
  const [parentConnection, setParentConnection] = useState<any>(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when page comes into focus (e.g., returning from avatar selector)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [user?.id])
  );

  const loadProfile = async () => {
    try {
      if (!user?.id) return;
      
      const { data: profileData } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        // Load preferences
        setNotifications(profileData.notifications_enabled ?? true);
        setSoundEffects(profileData.sound_effects_enabled ?? true);
        setDarkMode(profileData.dark_mode_enabled ?? false);
        
        // Load gamification stats
        // Get streak
        const { data: streakData } = await supabase
          .from('streaks')
          .select('current_streak')
          .eq('child_profile_id', profileData.id)
          .eq('streak_type', 'daily')
          .single();
        
        // Get points
        const { data: pointsData } = await supabase
          .from('gamification_points')
          .select('total_points')
          .eq('child_profile_id', profileData.id)
          .single();
        
        // Get badges count
        const { count: badgesCount } = await supabase
          .from('user_achievements')
          .select('*', { count: 'exact', head: true })
          .eq('child_profile_id', profileData.id);
        
        setStats({
          streak: streakData?.current_streak || 0,
          points: pointsData?.total_points || 0,
          badges: badgesCount || 0
        });
        
        // Load parent connection
        await loadParentConnection(profileData.id);
        
        // Load unread notifications count
        await loadUnreadNotifications();
        
        // Load family circle
        await loadFamilyCircle(profileData.id);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('read', false);
      
      if (!error) {
        setUnreadNotifications(count || 0);
      }
    } catch (error) {
      console.error('Error loading unread notifications:', error);
    }
  };

  const loadFamilyCircle = async (childProfileId: string) => {
    try {
      const { data, error } = await supabase
        .from('family_circle')
        .select('*')
        .eq('child_profile_id', childProfileId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
        .limit(10);
      
      if (!error) {
        setFamilyMembers(data || []);
      }
    } catch (error) {
      console.error('Error loading family circle:', error);
    }
  };

  const loadParentConnection = async (childProfileId: string) => {
    try {
      // Get the child profile with parent info
      const { data: childData, error: childError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', childProfileId)
        .single();
      
      if (childError || !childData) {
        setParentConnection(null);
        return;
      }
      
      // If there's a parent_id, get the parent profile info
      if (childData.parent_id) {
        // Try to get parent profile from profiles table
        const { data: parentProfile, error: parentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('id', childData.parent_id)
          .single();
        
        if (parentProfile) {
          // Successfully got parent profile
          setParentConnection({
            ...childData,
            parent: {
              id: parentProfile.id,
              display_name: parentProfile.first_name 
                ? `${parentProfile.first_name} ${parentProfile.last_name || ''}`.trim()
                : parentProfile.email?.split('@')[0] || 'Parent',
              email: parentProfile.email
            }
          });
        } else {
          // Fallback: just show as connected without details
          setParentConnection({
            ...childData,
            parent: {
              id: childData.parent_id,
              display_name: 'Parent',
              email: null
            }
          });
        }
      } else {
        setParentConnection(null);
      }
    } catch (error) {
      console.error('Error loading parent connection:', error);
      setParentConnection(null);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          }
        }
      ]
    );
  };

  const handleAvatarPress = () => {
    router.push('/(child)/avatar-selector');
  };

  const handleRequestParentConnection = () => {
    Alert.alert(
      'Connect with Parent',
      'Ask your parent or guardian to connect their account with yours. They can do this from the Parent app or website.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleViewParentConnection = () => {
    if (!parentConnection) return;
    
    Alert.alert(
      'Connected Parent',
      `Your account is connected with ${parentConnection.parent_profile?.display_name || 'your parent'}.\n\nThey can help monitor your skincare journey and provide guidance.`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const updatePreference = async (key: string, value: boolean) => {
    try {
      await supabase
        .from('child_profiles')
        .update({ [key]: value })
        .eq('user_id', user?.id);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  const getRelationshipEmoji = (relationship: string) => {
    const emojis: Record<string, string> = {
      parent: '👨‍👩',
      grandparent: '👴👵',
      sibling: '👧👦',
      aunt_uncle: '👨‍👩',
      other: '👤',
    };
    return emojis[relationship] || '👤';
  };

  const MenuItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightElement,
    iconColor = colors.purple 
  }: any) => (
    <Pressable 
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemText}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtext}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (showArrow && (
        <ChevronRight size={20} color={colors.charcoal} strokeWidth={2} />
      ))}
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title="My Account"
        subtitle="Settings & Preferences"
        showAvatar={false}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : profile?.avatar_config?.emoji ? (
                <View style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: profile.avatar_config.backgroundColor || colors.purple }
                ]}>
                  <Text style={styles.avatarEmojiText}>
                    {profile.avatar_config.emoji}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={16} color={colors.white} strokeWidth={2.5} />
              </View>
              {unreadNotifications > 0 && (
                <View style={styles.avatarNotificationBadge}>
                  <Text style={styles.avatarNotificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
          
          <Text style={styles.profileName}>{profile?.display_name || 'Freshie'}</Text>
          <Text style={styles.profileUsername}>@{profile?.username || user?.email?.split('@')[0]}</Text>
          
          {profile?.bio && (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          )}
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Sparkles size={20} color={colors.white} />
              <Text style={styles.statValue}>{stats.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Award size={20} color={colors.white} />
              <Text style={styles.statValue}>{stats.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Heart size={20} color={colors.white} />
              <Text style={styles.statValue}>{stats.badges}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Family Circle Banner */}
        {familyMembers.length > 0 && (
          <View style={styles.familyCircleSection}>
            <View style={styles.familyCircleHeader}>
              <Text style={styles.familyCircleTitle}>My Family Circle</Text>
              <Pressable onPress={() => router.push('/(child)/family-circle')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.familyScrollContent}
            >
              {familyMembers.map((member) => (
                <View key={member.id} style={styles.familyMemberCard}>
                  <View style={styles.familyMemberAvatar}>
                    <Text style={styles.familyMemberEmoji}>
                      {getRelationshipEmoji(member.relationship)}
                    </Text>
                  </View>
                  <Text style={styles.familyMemberName} numberOfLines={1}>
                    {member.family_member_name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* My Stuff */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Stuff</Text>
          
          <MenuItem
            icon={Edit3}
            title="Edit Profile"
            subtitle="Update your name and bio"
            iconColor={colors.purple}
            onPress={() => router.push('/(child)/edit-profile')}
          />
          
          <MenuItem
            icon={Award}
            title="My Achievements"
            subtitle="View badges & rewards"
            iconColor={colors.yellow}
            onPress={() => router.push('/(child)/learn/stats')}
          />
          
          <MenuItem
            icon={Heart}
            title="My Skin Profile"
            subtitle={profile?.skin_type || "Set up your skin type"}
            iconColor={colors.peach}
            onPress={() => {
              console.log('Navigating to skin profile...');
              router.push('/(child)/skin-profile');
            }}
          />
          
          <MenuItem
            icon={Sparkles}
            title="Freshie Gallery"
            subtitle="Your skincare photos"
            iconColor={colors.purple}
            onPress={() => router.push('/(child)/freshie-gallery')}
          />
        </View>

        {/* Family & Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family & Connections</Text>
          
          <MenuItem
            icon={Users}
            title="My Family Circle"
            subtitle="See who cheers you on"
            iconColor={colors.peach}
            onPress={() => router.push('/(child)/family-circle')}
          />
          
          <MenuItem
            icon={Users}
            title="Parent Account"
            subtitle={parentConnection ? 
              `Connected to ${parentConnection.parent?.display_name || 'parent'}` : 
              'Not connected'}
            iconColor={parentConnection ? colors.mint : colors.orange}
            onPress={() => setShowParentModal(true)}
            rightElement={
              parentConnection ? (
                <View style={styles.connectedBadge}>
                  <CheckCircle size={16} color={colors.mint} />
                </View>
              ) : (
                <View style={styles.notConnectedBadge}>
                  <AlertCircle size={16} color={colors.orange} />
                </View>
              )
            }
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuItem
            icon={Bell}
            title="Notifications"
            subtitle="View all your notifications"
            iconColor={colors.purple}
            onPress={() => router.push('/(child)/notifications')}
            rightElement={
              unreadNotifications > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              ) : null
            }
          />
          
          <MenuItem
            icon={Bell}
            title="Reminders"
            subtitle={notifications ? "On" : "Off"}
            iconColor={colors.mint}
            onPress={() => router.push('/(child)/notification-settings')}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={(value) => {
                  setNotifications(value);
                  updatePreference('notifications_enabled', value);
                }}
                trackColor={{ false: colors.mist, true: colors.mint }}
                thumbColor={colors.white}
              />
            }
          />
          
          <MenuItem
            icon={Volume2}
            title="Sound Effects"
            subtitle={soundEffects ? "On" : "Off"}
            iconColor={colors.lilac}
            rightElement={
              <Switch
                value={soundEffects}
                onValueChange={(value) => {
                  setSoundEffects(value);
                  updatePreference('sound_effects_enabled', value);
                }}
                trackColor={{ false: colors.mist, true: colors.lilac }}
                thumbColor={colors.white}
              />
            }
          />
          
          <MenuItem
            icon={Moon}
            title="Dark Mode"
            subtitle={darkMode ? "On" : "Off"}
            iconColor={colors.deepPurple}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  setDarkMode(value);
                  updatePreference('dark_mode_enabled', value);
                }}
                trackColor={{ false: colors.mist, true: colors.deepPurple }}
                thumbColor={colors.white}
              />
            }
          />
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help</Text>
          
          <MenuItem
            icon={HelpCircle}
            title="How to Use Freshies"
            subtitle="Tips and tutorials"
            iconColor={colors.mint}
            onPress={() => router.push('/(child)/help')}
          />
          
          <MenuItem
            icon={Shield}
            title="Safety & Privacy"
            subtitle="Learn how we protect you"
            iconColor={colors.orange}
            onPress={() => router.push('/(child)/safety')}
          />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.red} strokeWidth={2} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Freshies v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with 💜 for healthy skin</Text>
        </View>
      </ScrollView>

      {/* Parent Connection Modal */}
      <Modal
        visible={showParentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParentModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowParentModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Parent Connection</Text>
            
            {parentConnection ? (
              <View style={styles.modalBody}>
                <View style={styles.connectionStatusCard}>
                  <CheckCircle size={48} color={colors.mint} />
                  <Text style={styles.connectionStatusTitle}>Connected</Text>
                  <Text style={styles.connectionStatusText}>
                    Your account is safely connected with your parent
                  </Text>
                </View>

                <View style={styles.parentDetailsCard}>
                  <Text style={styles.parentDetailsLabel}>Parent Name</Text>
                  <Text style={styles.parentDetailsValue}>
                    {parentConnection.parent?.display_name || 'Parent'}
                  </Text>
                </View>

                <View style={styles.parentDetailsCard}>
                  <Text style={styles.parentDetailsLabel}>Email</Text>
                  <Text style={styles.parentDetailsValue}>
                    {parentConnection.parent?.email || 'Not available'}
                  </Text>
                </View>

                <View style={styles.parentInfoCard}>
                  <Shield size={20} color={colors.mint} />
                  <Text style={styles.parentInfoText}>
                    Your parent can view your progress and help guide your skincare journey. They keep you safe!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <View style={styles.connectionStatusCard}>
                  <AlertCircle size={48} color={colors.orange} />
                  <Text style={styles.connectionStatusTitle}>Not Connected</Text>
                  <Text style={styles.connectionStatusText}>
                    Ask your parent or guardian to connect their account
                  </Text>
                </View>

                <View style={styles.parentInfoCard}>
                  <AlertCircle size={20} color={colors.orange} />
                  <Text style={styles.parentInfoText}>
                    Connecting with a parent gives you a safer experience and helpful guidance on your skincare journey.
                  </Text>
                </View>

                <Text style={styles.howToConnectTitle}>How to Connect:</Text>
                <Text style={styles.howToConnectText}>
                  1. Ask your parent to download the Freshies Parent app{'\n'}
                  2. They'll create an account{'\n'}
                  3. They can send you a connection request{'\n'}
                  4. You'll see it here and can accept!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowParentModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    marginBottom: spacing[4],
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  avatarContainer: {
    marginBottom: spacing[3],
  },
  avatar: {
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  avatarEmojiText: {
    fontSize: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.purple,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[1],
  },
  profileUsername: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  profileBio: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    borderRadius: radii.xl,
    padding: spacing[3],
    paddingHorizontal: spacing[6],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing[4],
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginVertical: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
    marginLeft: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.deepPurple,
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: colors.charcoal,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.red,
    gap: spacing[2],
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: spacing[8],
  },
  versionText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  versionSubtext: {
    fontSize: 11,
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mint,
  },
  notConnectedBadge: {
    backgroundColor: colors.orange + '20',
    padding: spacing[1],
    borderRadius: radii.md,
  },
  parentInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    marginTop: spacing[2],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  parentInfoText: {
    flex: 1,
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.mist,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.deepPurple,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  modalBody: {
    gap: spacing[3],
  },
  connectionStatusCard: {
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
    gap: spacing[2],
  },
  connectionStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.deepPurple,
  },
  connectionStatusText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  parentDetailsCard: {
    backgroundColor: colors.cream,
    padding: spacing[3],
    borderRadius: radii.lg,
  },
  parentDetailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  parentDetailsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.deepPurple,
  },
  howToConnectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.deepPurple,
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  howToConnectText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: colors.purple,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
    marginTop: spacing[4],
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  notificationBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  avatarNotificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444', // Red color
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarNotificationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  familyCircleSection: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  familyCircleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  familyCircleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  familyScrollContent: {
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  familyMemberCard: {
    alignItems: 'center',
    width: 80,
  },
  familyMemberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
    borderWidth: 2,
    borderColor: colors.peach + '40',
  },
  familyMemberEmoji: {
    fontSize: 32,
  },
  familyMemberName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
  },
});
