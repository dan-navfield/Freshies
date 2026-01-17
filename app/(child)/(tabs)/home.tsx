import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Scan, Heart, Clock, Star, TrendingUp, Smile, CheckCircle,
  Sun, Moon, Sunrise, ChevronRight, AlertCircle, BookOpen,
  Droplets, Sparkles, Shield, Trophy, Zap, Play
} from 'lucide-react-native';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { globalStyles } from '../../../src/theme/styles';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';
import PageHeader from '../../../src/components/navigation/PageHeader';
import FloatingAIButton from '../../../src/components/FloatingAIButton';
import { childHomeStyles } from '../../../src/styles/child/tabs/home-styles';
import { ShelfItem } from '../../../src/types/shelf';
import { shelfService } from '../../../src/services/shelfService';
import ExpiryRing from '../../../src/components/ExpiryRing';
import GamificationBand from '../../../src/components/gamification/GamificationBand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Child Home Screen
 * Mirrors parent app layout with child-appropriate content
 */
export default function ChildHomeScreen() {
  const styles = childHomeStyles;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [skinProfile, setSkinProfile] = useState<any>(null);
  const [mainGoal, setMainGoal] = useState<string | null>(null);
  const [currentRoutine, setCurrentRoutine] = useState<any>(null);
  const [routineProgress, setRoutineProgress] = useState({ completed: 0, total: 0 });
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [stats, setStats] = useState({ shelfCount: 0, wishlistCount: 0, streak: 7 });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock popular products data
  const popularProducts = [
    { id: '1', name: 'SPF 30 Lotion', brand: 'CeraVe', category: 'sunscreen', grade: 'A', icon: 'sun', iconColor: '#FFD700' },
    { id: '2', name: 'Gentle Cleanser', brand: 'Cetaphil', category: 'cleanser', grade: 'A', icon: 'droplets', iconColor: '#2196F3' },
    { id: '3', name: 'Niacinamide', brand: 'The Ordinary', category: 'moisturizer', grade: 'B', icon: 'heart', iconColor: '#E91E63' },
    { id: '4', name: 'Daily Moisturizer', brand: 'CeraVe', category: 'moisturizer', grade: 'A', icon: 'shield', iconColor: '#9b87f5' },
    { id: '5', name: 'Lip Balm SPF', brand: "Burt's Bees", category: 'lip_care', grade: 'A', icon: 'heart', iconColor: '#E91E63' },
    { id: '6', name: 'Hydrating Mist', brand: 'Mario Badescu', category: 'moisturizer', grade: 'B', icon: 'droplets', iconColor: '#2196F3' },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? popularProducts
    : popularProducts.filter(p => p.category === selectedCategory);

  const fetchChildProfile = useCallback(async () => {
    if (user?.id) {
      // First try to get from child_profiles
      const { data: childProfile } = await supabase
        .from('child_profiles')
        .select('display_name, avatar_config, avatar_url, id, skin_type, sensitivity_level')
        .eq('user_id', user.id)
        .single();

      if (childProfile?.display_name) {
        setUserName(childProfile.display_name);
      } else {
        // Fallback to profiles.first_name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (profile?.first_name) {
          setUserName(profile.first_name);
        }
      }

      // Get avatar - check for uploaded image first, then emoji
      if (childProfile?.avatar_url) {
        setUserAvatarUrl(childProfile.avatar_url);
      } else if (childProfile?.avatar_config?.emoji) {
        setUserAvatar(childProfile.avatar_config.emoji);
      }

      // Set skin profile
      if (childProfile) {
        setSkinProfile(childProfile);
        setChildProfileId(childProfile.id);

        // Get main goal
        const { data: goals } = await supabase
          .from('child_goals')
          .select('goal_type')
          .eq('child_profile_id', childProfile.id)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(1);

        if (goals && goals.length > 0) {
          setMainGoal(goals[0].goal_type);
        }

        // Load current routine
        await loadCurrentRoutine(childProfile.id);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchChildProfile().finally(() => setLoading(false));
  }, [fetchChildProfile]);

  // Load dynamic data (shelf items)
  const loadDynamicData = useCallback(async (profileId: string) => {
    try {
      const userId = user?.id || '';
      const items = await shelfService.getShelfItems(userId, profileId);
      setShelfItems(items.slice(0, 4));
      setStats(prev => ({ ...prev, shelfCount: items.length }));
    } catch (error) {
      console.error('Error loading shelf items:', error);
    }
  }, [user]);

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChildProfile();
      if (childProfileId) {
        loadCurrentRoutine(childProfileId);
        loadDynamicData(childProfileId);
      }
    }, [fetchChildProfile, childProfileId, loadDynamicData])
  );

  const loadCurrentRoutine = async (profileId: string) => {
    try {
      const currentHour = new Date().getHours();

      // Determine segments in order based on time of day
      // Morning: before 12pm, Afternoon: 12pm-6pm, Evening: after 6pm
      let segments: ('morning' | 'afternoon' | 'evening')[] = [];

      if (currentHour < 12) {
        // Morning: show morning first, then afternoon, then evening
        segments = ['morning', 'afternoon', 'evening'];
      } else if (currentHour < 18) {
        // Afternoon (12pm-6pm): show afternoon first, then evening
        segments = ['afternoon', 'evening', 'morning'];
      } else {
        // Evening (after 6pm): show evening first
        segments = ['evening', 'morning', 'afternoon'];
      }

      // Try to find the best routine to show
      for (const segment of segments) {
        const { data: routine } = await supabase
          .from('custom_routines')
          .select('*')
          .eq('child_profile_id', profileId)
          .eq('segment', segment)
          .eq('is_active', true)
          .single();

        if (routine) {
          // Get today's completion status
          const today = new Date().toISOString().split('T')[0];
          const { data: completions } = await supabase
            .from('routine_step_completions')
            .select('routine_step_id')
            .eq('child_profile_id', profileId)
            .eq('routine_id', routine.id)
            .eq('completion_date', today);

          const completedStepIds = new Set(completions?.map(c => c.routine_step_id) || []);
          const totalSteps = routine.steps?.length || 0;
          const completedSteps = routine.steps?.filter((step: any) =>
            completedStepIds.has(step.id)
          ).length || 0;

          // If this routine is NOT complete, or it's the first priority segment, use it
          if (completedSteps < totalSteps || segment === segments[0]) {
            setCurrentRoutine(routine);
            setRoutineProgress({
              completed: completedSteps,
              total: totalSteps
            });
            return; // Found our routine, exit
          }
        }
      }

      // No routine found
      setCurrentRoutine(null);
      setRoutineProgress({ completed: 0, total: 0 });
    } catch (error) {
      console.error('Error loading current routine:', error);
    }
  };

  // Helper functions for skin profile display
  const getSkinTypeLabel = (skinType?: string) => {
    const labels: Record<string, string> = {
      oily: 'Oily',
      dry: 'Dry',
      combination: 'Combination',
      normal: 'Normal',
      sensitive: 'Sensitive',
    };
    return labels[skinType || ''] || 'Normal';
  };

  const getGoalLabel = (goalType?: string) => {
    const labels: Record<string, string> = {
      reduce_breakouts: 'Clear skin',
      reduce_shine: 'Less shine',
      improve_hydration: 'Better hydration',
      reduce_redness: 'Calm redness',
      simple_routine: 'Simple routine',
      improve_after_sport: 'Post-sport care',
      feel_confident: 'Feel confident',
    };
    return labels[goalType || ''] || 'Healthy skin';
  };

  const getSkinTip = () => {
    if (!skinProfile?.skin_type) return 'Keep your skin clean and moisturized';

    const tips: Record<string, string> = {
      oily: 'Use oil-free, lightweight products',
      dry: 'Look for gentle, fragrance-free moisturizers',
      combination: 'Balance with different products for different areas',
      normal: 'Keep it simple with gentle products',
      sensitive: 'Avoid fragrances and harsh ingredients',
    };

    return tips[skinProfile.skin_type] || 'Keep your skin clean and moisturized';
  };

  const getSkinTypeDisplay = () => {
    let display = getSkinTypeLabel(skinProfile?.skin_type);
    if (skinProfile?.sensitivity_level && skinProfile.sensitivity_level > 3) {
      display += ' + Sensitive';
    }
    return display;
  };

  if (loading) {
    return (
      <View style={globalStyles.scrollContainer}>
        <PageHeader
          title="Hi there 👋"
          subtitle="Let's take care of your skin today"
          showAvatar={false}
          showSearch={false}
        />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.scrollContainer}>
      {/* Page Header with Child's Avatar */}
      <PageHeader
        title={`Hi ${userName || 'there'} 👋`}
        subtitle="Let's take care of your skin today"
        showAvatar={true}
        avatarEmoji={userAvatar || undefined}
        avatarUrl={userAvatarUrl}
        showSearch={true}
        searchPlaceholder="Search products, brands, ingredients..."
        compact={false}
      />

      {/* GAMIFICATION BAND - Same as Learn page */}
      <GamificationBand />

      {/* NEXT ROUTINE - Redesigned card */}
      <View style={{ marginHorizontal: spacing[4], marginTop: spacing[4], marginBottom: spacing[4] }}>
        <Pressable
          style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }}
          onPress={() => router.push('/(child)/(tabs)/routine')}
        >
          {/* Gradient accent bar at top */}
          <LinearGradient
            colors={[colors.purple, '#9C27B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 6 }}
          />

          <View style={{ padding: spacing[4] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {currentRoutine?.segment === 'morning' ? (
                    <Sunrise size={18} color={colors.purple} />
                  ) : currentRoutine?.segment === 'afternoon' ? (
                    <Sun size={18} color={colors.purple} />
                  ) : (
                    <Moon size={18} color={colors.purple} />
                  )}
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.purple, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Next Up
                  </Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.charcoal, marginBottom: 4 }}>
                  {currentRoutine?.segment === 'morning' ? 'Morning' : currentRoutine?.segment === 'afternoon' ? 'Afternoon' : 'Evening'} Routine
                </Text>
                <Text style={{ fontSize: 14, color: colors.charcoal + '70' }}>
                  {routineProgress.total > 0
                    ? `${routineProgress.completed}/${routineProgress.total} steps complete`
                    : 'No steps yet'}
                </Text>

                {/* Progress bar */}
                <View style={{ marginTop: spacing[3], backgroundColor: colors.purple + '15', borderRadius: 6, height: 8 }}>
                  <View style={{
                    backgroundColor: colors.purple,
                    borderRadius: 6,
                    height: 8,
                    width: `${routineProgress.total > 0 ? Math.round((routineProgress.completed / routineProgress.total) * 100) : 0}%`,
                  }} />
                </View>
              </View>

              {/* Circular play button */}
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.purple,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: spacing[4],
                shadowColor: colors.purple,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}>
                {routineProgress.completed === routineProgress.total && routineProgress.total > 0 ? (
                  <CheckCircle size={24} color={colors.white} />
                ) : (
                  <Play size={24} color={colors.white} fill={colors.white} />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </View>

      {/* TIP OF THE DAY */}
      <View style={{ marginHorizontal: spacing[4], marginBottom: spacing[4] }}>
        <View style={{
          backgroundColor: '#F3E5F5',
          borderRadius: 20,
          padding: spacing[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
        }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#9C27B0', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#7B1FA2', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>💡 Tip of the Day</Text>
            <Text style={{ fontSize: 14, color: '#4A148C', lineHeight: 20 }}>{getSkinTip()}</Text>
          </View>
        </View>
      </View>

      {/* ASK FRESHIE AI SECTION */}
      <Pressable
        style={{
          marginHorizontal: spacing[4],
          marginBottom: spacing[4],
          backgroundColor: colors.purple,
          borderRadius: 20,
          padding: spacing[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          shadowColor: colors.purple,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
        onPress={() => router.push('/freshies-chat')}
      >
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={28} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: 4 }}>
            Ask FreshieAI
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            Got a question about your skin? I'm here to help! ✨
          </Text>
        </View>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ChevronRight size={22} color={colors.white} />
        </View>
      </Pressable>

      {/* MY RECENT PRODUCTS - Dark background with swipeable cards */}
      <View style={{
        backgroundColor: '#1A1A1A',
        paddingVertical: spacing[5],
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4], paddingHorizontal: spacing[4] }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>My Recent Products</Text>
          {shelfItems.length > 0 && (
            <Pressable onPress={() => router.push('/(child)/(tabs)/shelf')}>
              <Text style={{ color: colors.purple, fontWeight: '600', fontSize: 14 }}>See All →</Text>
            </Pressable>
          )}
        </View>

        {shelfItems.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
          >
            {shelfItems.map((item) => {
              const daysOpen = item.opened_at ? Math.floor((new Date().getTime() - new Date(item.opened_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              return (
                <Pressable
                  key={item.id}
                  style={{
                    width: 160,
                    backgroundColor: '#2A2A2A',
                    borderRadius: 20,
                    padding: spacing[3],
                    alignItems: 'center',
                  }}
                  onPress={() => router.push(`/(shelf)/${item.id}`)}
                >
                  <View style={{ position: 'relative', marginBottom: spacing[3] }}>
                    <Image
                      source={{ uri: item.product_image_url || 'https://via.placeholder.com/80' }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 16,
                        backgroundColor: '#404040',
                      }}
                    />
                    {item.pao_months && item.opened_at && (
                      <View style={{ position: 'absolute', top: -5, right: -10 }}>
                        <ExpiryRing paoMonths={item.pao_months} daysOpen={daysOpen} size={32} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.white + '60',
                      textTransform: 'uppercase',
                      fontWeight: '500',
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.product_brand}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.white,
                      textAlign: 'center',
                    }}
                    numberOfLines={2}
                  >
                    {item.product_name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={{ paddingHorizontal: spacing[4] }}>
            <Pressable
              style={{
                backgroundColor: '#2A2A2A',
                borderRadius: 20,
                padding: spacing[6],
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#404040',
                borderStyle: 'dashed',
              }}
              onPress={() => router.push('/(child)/(tabs)/scan')}
            >
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.purple + '30',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <Scan size={28} color={colors.purple} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.white }}>No products yet</Text>
              <Text style={{ fontSize: 13, color: colors.white + '60', marginTop: 4 }}>Scan your first skincare product!</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* POPULAR PRODUCTS IN YOUR AGE GROUP */}
      <View style={{
        backgroundColor: '#1A1A1A',
        paddingVertical: spacing[5],
        marginBottom: spacing[4],
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3], paddingHorizontal: spacing[4] }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.white }}>Popular with Tweens</Text>
          <Pressable onPress={() => router.push('/(child)/products')}>
            <Text style={{ color: colors.purple, fontWeight: '600', fontSize: 14 }}>See All →</Text>
          </Pressable>
        </View>

        {/* Category Filter Circles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3], marginBottom: spacing[4] }}
        >
          {/* Category Filter Buttons */}
          {[
            { id: 'all', label: 'All', icon: Star, color: colors.purple },
            { id: 'sunscreen', label: 'Sunscreen', icon: Sun, color: colors.yellow },
            { id: 'cleanser', label: 'Cleanser', icon: Droplets, color: '#2196F3' },
            { id: 'moisturizer', label: 'Moisturizer', icon: Shield, color: colors.purple },
            { id: 'lip_care', label: 'Lip Care', icon: Heart, color: '#E91E63' },
          ].map((cat) => {
            const IconComponent = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={{ alignItems: 'center' }}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: isActive ? colors.purple : '#2A2A2A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                  borderWidth: isActive ? 0 : 2,
                  borderColor: '#404040',
                }}>
                  <IconComponent size={24} color={isActive ? colors.white : cat.color} />
                </View>
                <Text style={{
                  fontSize: 11,
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? colors.white : colors.white + '80'
                }}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing[4], gap: spacing[3] }}
        >
          {filteredProducts.map((product) => {
            const getIcon = () => {
              switch (product.icon) {
                case 'sun': return <Sun size={32} color={product.iconColor} />;
                case 'droplets': return <Droplets size={32} color={product.iconColor} />;
                case 'heart': return <Heart size={32} color={product.iconColor} />;
                case 'shield': return <Shield size={32} color={product.iconColor} />;
                default: return <Star size={32} color={product.iconColor} />;
              }
            };
            return (
              <Pressable
                key={product.id}
                style={{
                  width: 120,
                  backgroundColor: '#2A2A2A',
                  borderRadius: 16,
                  padding: spacing[2],
                  alignItems: 'center',
                }}
                onPress={() => router.push('/(child)/products')}
              >
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: '#404040',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing[2],
                }}>
                  {getIcon()}
                </View>
                <View style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: product.grade === 'A' ? colors.mint : colors.yellow,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.white, fontSize: 11, fontWeight: '800' }}>{product.grade}</Text>
                </View>
                <Text style={{ fontSize: 10, color: colors.white + '60', textTransform: 'uppercase', fontWeight: '500' }} numberOfLines={1}>{product.brand}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white, textAlign: 'center' }} numberOfLines={2}>{product.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* LEARNING SECTION */}
      <View style={{ marginHorizontal: spacing[4], marginBottom: spacing[4] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.charcoal }}>Keep Learning</Text>
          <Pressable onPress={() => router.push('/(child)/(tabs)/favorites')}>
            <Text style={{ color: colors.purple, fontWeight: '600', fontSize: 14 }}>See All →</Text>
          </Pressable>
        </View>

        {/* Latest Quiz Card */}
        <Pressable
          style={{
            backgroundColor: '#E8F5E9',
            borderRadius: 20,
            padding: spacing[4],
            marginBottom: spacing[3],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
          }}
          onPress={() => router.push('/(child)/learn/tips')}
        >
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: '#4CAF50',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={28} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Quiz Time!</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 2 }}>Skincare Basics</Text>
            <Text style={{ fontSize: 13, color: '#388E3C' }}>Earn 50 points • 5 questions</Text>
          </View>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#4CAF50',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Play size={18} color={colors.white} fill={colors.white} />
          </View>
        </Pressable>

        {/* Things to Learn - Horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing[3], marginBottom: spacing[3] }}
        >
          {/* Learn Card 1 */}
          <Pressable
            style={{
              width: 140,
              backgroundColor: '#E3F2FD',
              borderRadius: 16,
              padding: spacing[3],
              alignItems: 'center',
            }}
            onPress={() => router.push('/(child)/learn/tips')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#2196F3',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[2],
            }}>
              <Droplets size={24} color={colors.white} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#1565C0', textAlign: 'center' }}>Why Moisturize?</Text>
            <Text style={{ fontSize: 11, color: '#1976D2', marginTop: 2 }}>2 min read</Text>
          </Pressable>

          {/* Learn Card 2 */}
          <Pressable
            style={{
              width: 140,
              backgroundColor: '#FFF3E0',
              borderRadius: 16,
              padding: spacing[3],
              alignItems: 'center',
            }}
            onPress={() => router.push('/(child)/learn/tips')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FF9800',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[2],
            }}>
              <Sun size={24} color={colors.white} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#E65100', textAlign: 'center' }}>SPF Explained</Text>
            <Text style={{ fontSize: 11, color: '#F57C00', marginTop: 2 }}>3 min read</Text>
          </Pressable>

          {/* Learn Card 3 */}
          <Pressable
            style={{
              width: 140,
              backgroundColor: '#FCE4EC',
              borderRadius: 16,
              padding: spacing[3],
              alignItems: 'center',
            }}
            onPress={() => router.push('/(child)/learn/tips')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#E91E63',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing[2],
            }}>
              <Heart size={24} color={colors.white} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#C2185B', textAlign: 'center' }}>Sensitive Skin</Text>
            <Text style={{ fontSize: 11, color: '#D81B60', marginTop: 2 }}>4 min read</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
