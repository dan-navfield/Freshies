import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Sun, Droplets, Moon, Sparkles, Heart, Shield, Star } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import SubPageHeader from '../../../src/components/SubPageHeader';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { trackLearningProgress } from '../../../src/services/gamificationService';
import { supabase } from '../../../src/lib/supabase';

interface Tip {
  id: string;
  title: string;
  content: string;
  icon: any;
  color: string;
  category: string;
  ageGroup: string;
  isRead: boolean;
}

const SKINCARE_TIPS: Tip[] = [
  {
    id: '1',
    title: 'Always Wear Sunscreen',
    content: 'Sunscreen protects your skin from harmful UV rays that can cause damage. Apply it every morning, even on cloudy days! Look for SPF 30 or higher.',
    icon: Sun,
    color: '#F59E0B',
    category: 'Protection',
    ageGroup: 'all',
    isRead: true,
  },
  {
    id: '2',
    title: 'Drink Lots of Water',
    content: 'Your skin needs water to stay healthy and glowing! Try to drink 6-8 glasses of water every day. It helps keep your skin hydrated from the inside out.',
    icon: Droplets,
    color: colors.mint,
    category: 'Hydration',
    ageGroup: 'all',
    isRead: true,
  },
  {
    id: '3',
    title: 'Wash Your Face Twice Daily',
    content: 'Clean your face in the morning and before bed. Use a gentle cleanser and lukewarm water. This removes dirt, oil, and helps prevent breakouts!',
    icon: Sparkles,
    color: colors.purple,
    category: 'Cleansing',
    ageGroup: 'all',
    isRead: true,
  },
  {
    id: '4',
    title: 'Get Enough Sleep',
    content: 'Your skin repairs itself while you sleep! Aim for 8-10 hours of sleep each night. This helps your skin look fresh and healthy.',
    icon: Moon,
    color: '#8B7AB8',
    category: 'Lifestyle',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '5',
    title: 'Moisturize Daily',
    content: 'After washing your face, apply moisturizer to keep your skin soft and hydrated. Choose one that\'s right for your skin type!',
    icon: Heart,
    color: '#EC4899',
    category: 'Hydration',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '6',
    title: 'Don\'t Touch Your Face',
    content: 'Your hands touch lots of things during the day and can transfer bacteria to your face. Try to avoid touching your face to prevent breakouts!',
    icon: Shield,
    color: '#10B981',
    category: 'Habits',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '7',
    title: 'Eat Healthy Foods',
    content: 'Fruits and vegetables are great for your skin! Foods with vitamins A, C, and E help keep your skin healthy. Try to eat colorful foods!',
    icon: Sparkles,
    color: '#F59E0B',
    category: 'Nutrition',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '8',
    title: 'Be Gentle with Your Skin',
    content: 'Don\'t scrub too hard when washing your face. Use gentle, circular motions. Pat your face dry with a soft towel instead of rubbing.',
    icon: Heart,
    color: colors.peach,
    category: 'Technique',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '9',
    title: 'Change Your Pillowcase',
    content: 'Change your pillowcase at least once a week. Old pillowcases can collect oil and bacteria that can cause breakouts.',
    icon: Moon,
    color: colors.lilac,
    category: 'Habits',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '10',
    title: 'Protect Your Lips',
    content: 'Your lips need care too! Use lip balm with SPF to protect them from the sun and keep them soft and moisturized.',
    icon: Heart,
    color: '#EC4899',
    category: 'Protection',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '11',
    title: 'Exercise Regularly',
    content: 'Exercise increases blood flow, which helps nourish your skin cells. Plus, sweating helps clean out your pores! Just remember to wash your face after.',
    icon: Sparkles,
    color: '#10B981',
    category: 'Lifestyle',
    ageGroup: 'all',
    isRead: false,
  },
  {
    id: '12',
    title: 'Be Patient',
    content: 'Good skin takes time! Stick to your routine and be patient. It can take 4-6 weeks to see results from a new skincare routine.',
    icon: Heart,
    color: colors.purple,
    category: 'Mindset',
    ageGroup: 'all',
    isRead: false,
  },
];

/**
 * Skincare Tips Screen
 * Age-appropriate skincare education
 */
export default function TipsScreen() {
  const { childProfile } = useChildProfile();
  const [tips, setTips] = useState(SKINCARE_TIPS);
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [readTipIds, setReadTipIds] = useState<Set<string>>(new Set());
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);

  useEffect(() => {
    loadReadTips();
  }, [childProfile?.id]);

  const loadReadTips = async () => {
    if (!childProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('content_id')
        .eq('child_profile_id', childProfile.id)
        .eq('content_type', 'tip')
        .eq('completed', true);

      if (!error && data) {
        const readIds = new Set(data.map(item => item.content_id));
        setReadTipIds(readIds);

        // Update tips with read status
        setTips(prevTips =>
          prevTips.map(tip => ({
            ...tip,
            isRead: readIds.has(tip.id)
          }))
        );
      }
    } catch (error) {
      console.error('Error loading read tips:', error);
    }
  };

  const markTipAsRead = async (tip: Tip) => {
    if (!childProfile?.id || readTipIds.has(tip.id)) {
      setSelectedTip(null);
      return;
    }

    try {
      // Track learning progress and award points
      await trackLearningProgress(
        childProfile.id,
        'tip',
        tip.id,
        tip.title,
        true
      );

      // Update local state
      setReadTipIds(prev => new Set([...prev, tip.id]));
      setTips(prevTips =>
        prevTips.map(t =>
          t.id === tip.id ? { ...t, isRead: true } : t
        )
      );

      // Show points animation
      setPointsEarned(5);
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 2000);

      setSelectedTip(null);
    } catch (error) {
      console.error('Error marking tip as read:', error);
    }
  };

  const readCount = tips.filter(t => t.isRead).length;

  return (
    <View style={styles.container}>
      {/* SubPage Header with Info Strip */}
      <SubPageHeader
        title="Skincare Tips"
        infoStripColor={colors.purple}
        infoStripText={`${readCount}/${tips.length} tips read • Learn healthy skincare habits! 💜`}
        backRoute="/(child)/learn"
        showSearch={true}
        searchPlaceholder="Search tips..."
      />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tips Grid */}
        <View style={styles.tipsGrid}>
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <TouchableOpacity
                key={tip.id}
                style={[
                  styles.tipCard,
                  selectedTip?.id === tip.id && styles.tipCardActive,
                ]}
                onPress={() => setSelectedTip(tip)}
              >
                <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
                  <Icon size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.tipTitle} numberOfLines={2}>
                  {tip.title}
                </Text>
                {tip.isRead && (
                  <View style={styles.readBadge}>
                    <Text style={styles.readBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Tip Detail Modal */}
      {selectedTip && (
        <View style={styles.modal}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedTip(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.modalIcon, { backgroundColor: selectedTip.color }]}>
              {React.createElement(selectedTip.icon, {
                size: 40,
                color: colors.white,
                strokeWidth: 2.5,
              })}
            </View>

            <Text style={styles.modalTitle}>{selectedTip.title}</Text>
            <View style={styles.modalCategory}>
              <Text style={styles.modalCategoryText}>{selectedTip.category}</Text>
            </View>

            <Text style={styles.modalContent}>{selectedTip.content}</Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: selectedTip.color }]}
              onPress={() => markTipAsRead(selectedTip)}
            >
              <Text style={styles.modalButtonText}>
                {readTipIds.has(selectedTip.id) ? 'Got it! ✨' : 'Mark as Read (+5 pts) ✨'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Points Earned Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimation}>
          <View style={styles.pointsAnimationContent}>
            <Star size={24} color={colors.mint} fill={colors.mint} />
            <Text style={styles.pointsAnimationText}>+{pointsEarned} points!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing[4],
    gap: spacing[3],
  },
  tipCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  tipCardActive: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  tipIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },
  readBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readBadgeText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[6],
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.charcoal,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  modalCategory: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    marginBottom: spacing[4],
  },
  modalCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalContent: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  modalButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radii.pill,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
  pointsAnimation: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pointsAnimationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  pointsAnimationText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.mint,
  },
});
