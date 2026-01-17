import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Dimensions,
  Share,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy, Star, Target, Zap, Award, Users, TrendingUp,
  Lock, Share2, ChevronRight, Medal, Crown, Sparkles,
  Calendar, Flame, Heart, Shield, CheckCircle, Package
} from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { achievementService, UserAchievement } from '../../src/services/achievementService';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import { supabase } from '../../src/lib/supabase';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';
import GamificationBand from '../../src/components/gamification/GamificationBand';
import ShareAchievementModal from '../../src/components/gamification/ShareAchievementModal';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  category: 'streak' | 'milestone' | 'social' | 'learning' | 'special';
  points: number;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  shareText?: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  rank: number;
  isCurrentUser?: boolean;
}

// Mock data - replace with actual data from service
const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Steps',
    description: 'Complete your first routine',
    icon: Trophy,
    color: colors.purple,
    category: 'milestone',
    points: 50,
    requirement: 1,
    progress: 1,
    unlocked: true,
    rarity: 'common'
  },
  {
    id: '2',
    title: '7 Day Streak',
    description: 'Keep your routine going for 7 days',
    icon: Flame,
    color: colors.orange,
    category: 'streak',
    points: 100,
    requirement: 7,
    progress: 5,
    unlocked: false,
    rarity: 'rare'
  }
];

const categories = [
  { id: 'all', label: 'All', icon: Star },
  { id: 'streak', label: 'Streaks', icon: Flame },
  { id: 'milestone', label: 'Milestones', icon: Trophy },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'learning', label: 'Learning', icon: Award }
];

export default function EnhancedAchievementsScreen() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'streak' | 'milestone' | 'social' | 'learning'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [achievementToShare, setAchievementToShare] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [achievements] = useState<Achievement[]>(mockAchievements);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: Star },
    { id: 'streak', label: 'Streaks', icon: Flame },
    { id: 'milestone', label: 'Milestones', icon: Trophy },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'learning', label: 'Learning', icon: Award }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  const shareAchievement = async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `🏆 I just unlocked "${achievement.title}" in Freshies! ${achievement.shareText || achievement.description} #FreshiesSkincare #Achievement`,
        title: 'Check out my achievement!'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return colors.purple;
      case 'epic': return colors.accent;
      case 'rare': return colors.info;
      default: return colors.charcoal;
    }
  };

  const getRarityGradient = (rarity: string): [string, string] => {
    switch (rarity) {
      case 'legendary': return [colors.purple, colors.deepPurple];
      case 'epic': return [colors.accent, colors.peach];
      case 'rare': return [colors.info, colors.lilac];
      default: return [colors.mist, colors.white];
    }
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader 
        title="Stats & Rewards"
        subtitle="Track your progress and earn rewards!"
        showAvatar={true}
      />
      
      <GamificationBand />

      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Trophy size={20} color={colors.yellow} />
          <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={20} color={colors.purple} />
          <Text style={styles.statValue}>{totalPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Medal size={20} color={colors.orange} />
          <Text style={styles.statValue}>#4</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
          onPress={() => setSelectedTab('achievements')}
        >
          <Trophy size={18} color={selectedTab === 'achievements' ? colors.white : colors.charcoal} />
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>
            Achievements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'leaderboard' && styles.tabActive]}
          onPress={() => setSelectedTab('leaderboard')}
        >
          <Users size={18} color={selectedTab === 'leaderboard' ? colors.white : colors.charcoal} />
          <Text style={[styles.tabText, selectedTab === 'leaderboard' && styles.tabTextActive]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'achievements' ? (
        <>
          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive
                  ]}
                  onPress={() => setSelectedCategory(category.id as any)}
                >
                  <Icon size={16} color={selectedCategory === category.id ? colors.white : colors.purple} />
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Achievements Grid */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.achievementsGrid}
            showsVerticalScrollIndicator={false}
          >
            {filteredAchievements.map((achievement) => {
              const Icon = achievement.icon;
              const progress = (achievement.progress / achievement.requirement) * 100;
              
              return (
                <TouchableOpacity
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    achievement.unlocked && styles.achievementCardUnlocked
                  ]}
                  onPress={() => setSelectedAchievement(achievement)}
                  disabled={!achievement.unlocked}
                >
                  {achievement.unlocked ? (
                    <LinearGradient
                      colors={getRarityGradient(achievement.rarity)}
                      style={styles.achievementGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  ) : null}
                  
                  <View style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.unlocked ? 'transparent' : colors.mist }
                  ]}>
                    <Icon 
                      size={32} 
                      color={achievement.unlocked ? colors.white : colors.charcoal} 
                    />
                    {!achievement.unlocked && (
                      <View style={styles.lockOverlay}>
                        <Lock size={16} color={colors.charcoal} />
                      </View>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked
                  ]} numberOfLines={1}>
                    {achievement.title}
                  </Text>
                  
                  <Text style={styles.achievementPoints}>
                    {achievement.points} pts
                  </Text>
                  
                  {!achievement.unlocked && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill,
                            { width: `${progress}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress}/{achievement.requirement}
                      </Text>
                    </View>
                  )}
                  
                  {achievement.unlocked && (
                    <>
                      <View style={[
                        styles.rarityBadge,
                        { backgroundColor: getRarityColor(achievement.rarity) }
                      ]}>
                        <Text style={styles.rarityText}>
                          {achievement.rarity.toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setAchievementToShare(achievement);
                          setShowShareModal(true);
                        }}
                      >
                        <Share2 size={16} color={colors.purple} />
                      </TouchableOpacity>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      ) : (
        /* Leaderboard View */
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>Weekly Leaderboard</Text>
            <Text style={styles.leaderboardSubtitle}>Resets in 3 days</Text>
          </View>
          
          {leaderboard.map((entry, index) => (
            <View 
              key={entry.id}
              style={[
                styles.leaderboardEntry,
                entry.isCurrentUser && styles.leaderboardEntryHighlight
              ]}
            >
              <View style={styles.leaderboardRank}>
                {index < 3 ? (
                  <View style={[
                    styles.rankBadge,
                    { backgroundColor: index === 0 ? colors.yellow : index === 1 ? colors.mist : colors.peach }
                  ]}>
                    <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                  </View>
                ) : (
                  <Text style={styles.rankText}>{entry.rank}</Text>
                )}
              </View>
              
              <View style={styles.leaderboardUser}>
                <Text style={styles.userAvatar}>{entry.avatar}</Text>
                <View>
                  <Text style={[
                    styles.userName,
                    entry.isCurrentUser && styles.userNameHighlight
                  ]}>
                    {entry.name}
                  </Text>
                  <Text style={styles.userLevel}>Level {entry.level}</Text>
                </View>
              </View>
              
              <View style={styles.leaderboardPoints}>
                <Text style={styles.pointsValue}>{entry.points.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Achievement Detail Modal */}
      <Modal
        visible={selectedAchievement !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAchievement(null)}
      >
        {selectedAchievement && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={getRarityGradient(selectedAchievement.rarity)}
                style={styles.modalGradient}
              />
              
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setSelectedAchievement(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.modalIcon}>
                {React.createElement(selectedAchievement.icon, {
                  size: 64,
                  color: colors.white
                })}
              </View>
              
              <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
              <Text style={styles.modalDescription}>{selectedAchievement.description}</Text>
              
              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Star size={20} color={colors.yellow} />
                  <Text style={styles.modalStatText}>{selectedAchievement.points} points</Text>
                </View>
                <View style={styles.modalStat}>
                  <Sparkles size={20} color={getRarityColor(selectedAchievement.rarity)} />
                  <Text style={styles.modalStatText}>{selectedAchievement.rarity}</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareAchievement(selectedAchievement)}
              >
                <Share2 size={20} color={colors.white} />
                <Text style={styles.shareButtonText}>Share Achievement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Family Share Modal */}
      <ShareAchievementModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setAchievementToShare(null);
        }}
        achievement={achievementToShare}
        childProfileId={childProfile?.id || ''}
        onSuccess={() => {
          // Could show a success message or confetti here
          console.log('Achievement shared with family!');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  statsOverview: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    alignItems: 'center' as const,
    padding: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.black,
    marginTop: spacing[1],
  },
  statLabel: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  tabSelector: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  tabActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.charcoal,
  },
  tabTextActive: {
    color: colors.white,
  },
  categoryFilter: {
    maxHeight: 50,
    marginBottom: spacing[3],
  },
  categoryFilterContent: {
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.purple,
    marginRight: spacing[2],
  },
  categoryChipActive: {
    backgroundColor: colors.purple,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.purple,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  achievementsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
    gap: spacing[3],
  },
  achievementCard: {
    width: (width - spacing[6] * 2 - spacing[3]) / 2,
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.mist,
    alignItems: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  achievementCardUnlocked: {
    borderWidth: 0,
  },
  achievementGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing[2],
    position: 'relative' as const,
  },
  lockOverlay: {
    position: 'absolute' as const,
    bottom: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: radii.full,
    padding: 4,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: spacing[1],
    textAlign: 'center' as const,
  },
  achievementTitleLocked: {
    color: colors.black,
  },
  achievementPoints: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing[2],
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.mist,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.purple,
  },
  progressText: {
    fontSize: 10,
    color: colors.charcoal,
    textAlign: 'center' as const,
    marginTop: spacing[1],
  },
  rarityBadge: {
    position: 'absolute' as const,
    top: spacing[2],
    right: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: colors.white,
  },
  leaderboardHeader: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.black,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  leaderboardEntry: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  leaderboardEntryHighlight: {
    backgroundColor: colors.purple + '10',
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center' as const,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.charcoal,
  },
  leaderboardUser: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
  },
  userAvatar: {
    fontSize: 32,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.black,
  },
  userNameHighlight: {
    color: colors.purple,
  },
  userLevel: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  leaderboardPoints: {
    alignItems: 'flex-end' as const,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.purple,
  },
  pointsLabel: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[6],
    alignItems: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  modalGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  modalClose: {
    position: 'absolute' as const,
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.white + '30',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.white,
  },
  modalIcon: {
    marginTop: spacing[8],
    marginBottom: spacing[4],
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.black,
    marginBottom: spacing[2],
  },
  modalDescription: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center' as const,
    marginBottom: spacing[4],
  },
  modalStats: {
    flexDirection: 'row' as const,
    gap: spacing[6],
    marginBottom: spacing[6],
  },
  modalStat: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
  modalStatText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.black,
  },
  shareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
});
