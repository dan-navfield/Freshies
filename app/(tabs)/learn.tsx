import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { globalStyles } from '../../src/theme/styles';
import { BookOpen, Droplet, Package, Shield, Users, Brain, Sparkles, Clock, TrendingUp } from 'lucide-react-native';
import PageHeader from '../../components/PageHeader';
import { supabase } from '../../src/lib/supabase';
import FloatingAIButton from '../../components/FloatingAIButton';

// Content pillars with article counts
const CONTENT_PILLARS = [
  {
    id: 'skin-basics',
    title: 'Skin Basics for Kids & Teens',
    description: 'How skin works at different ages',
    icon: Droplet,
    color: colors.mint,
    articleCount: 12,
    tags: ['Ages 5-8', 'Ages 9-12', 'Ages 13-16'],
  },
  {
    id: 'ingredients',
    title: 'Ingredients Explained',
    description: 'Friendly guides to common ingredients',
    icon: Sparkles,
    color: colors.lilac,
    articleCount: 24,
    tags: ['Surfactants', 'Acids', 'Preservatives'],
  },
  {
    id: 'products',
    title: 'Product Types',
    description: 'What each product does and when kids need it',
    icon: Package,
    color: colors.peach,
    articleCount: 15,
    tags: ['Cleansers', 'Moisturisers', 'Sunscreens'],
  },
  {
    id: 'routines',
    title: 'Routines & Layering',
    description: 'Building age-appropriate routines',
    icon: BookOpen,
    color: colors.lemon,
    articleCount: 10,
    tags: ['Morning', 'Evening', 'Layering'],
  },
  {
    id: 'safety',
    title: 'Safety & Regulation',
    description: 'How products are regulated in Australia',
    icon: Shield,
    color: colors.mint,
    articleCount: 8,
    tags: ['AICIS', 'TGA', 'Recalls'],
  },
  {
    id: 'mental-health',
    title: 'Teens & Social Media',
    description: 'Body image, trends and healthy boundaries',
    icon: Users,
    color: colors.purple,
    articleCount: 6,
    tags: ['Sephora Kids', 'TikTok', 'Body Image'],
  },
];

// Featured guided tracks
const GUIDED_TRACKS = [
  {
    id: 'new-to-skincare',
    title: 'New to Kids Skincare',
    description: '5 short modules for parents of 8-12 year olds',
    lessons: 5,
    duration: '15 min',
    color: colors.mint,
  },
  {
    id: 'eczema-guide',
    title: 'My Child Has Eczema',
    description: 'Understanding triggers, routines & doctor conversations',
    lessons: 6,
    duration: '20 min',
    color: colors.peach,
  },
  {
    id: 'tweens-tiktok',
    title: 'Tweens & TikTok Skincare',
    description: 'Understanding trends and setting boundaries',
    lessons: 4,
    duration: '12 min',
    color: colors.purple,
  },
];

export default function LearnScreen() {
  const router = useRouter();
  const [newArticles, setNewArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewArticles();
  }, []);

  async function loadNewArticles() {
    try {
      const { data, error } = await supabase
        .from('learn_articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNewArticles(data || []);
    } catch (error) {
      console.error('Error loading new articles:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={globalStyles.scrollContainer}>
      {/* Page Header */}
      <PageHeader
        title="Learn"
        subtitle="Evidence-based guidance for kids' skincare"
        showAvatar={true}
        showSearch={true}
        searchPlaceholder="Search articles, ingredients, conditions..."
      />

      {/* New Articles */}
      {!loading && newArticles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>New Articles</Text>
              <Text style={styles.sectionSubtitle}>
                Latest evidence-based guidance
              </Text>
            </View>
            <TrendingUp size={24} color={colors.mint} />
          </View>
          
          {newArticles.map((article) => (
            <Pressable
              key={article.id}
              style={styles.newArticleCard}
              onPress={() => router.push(`/learn/${article.id}`)}
            >
              <View style={styles.newArticleContent}>
                <Text style={styles.newArticleTitle}>{article.title}</Text>
                <Text style={styles.newArticleSummary} numberOfLines={2}>
                  {article.summary.split('\n')[0].replace('•', '').trim()}
                </Text>
                <View style={styles.newArticleMeta}>
                  <View style={styles.newArticleMetaItem}>
                    <BookOpen size={12} color={colors.charcoal} />
                    <Text style={styles.newArticleMetaText}>{article.source_name}</Text>
                  </View>
                  <View style={styles.newArticleMetaItem}>
                    <Clock size={12} color={colors.charcoal} />
                    <Text style={styles.newArticleMetaText}>5 min read</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.newArticleBadge, { backgroundColor: colors.mint + '20' }]}>
                <Text style={[styles.newArticleBadgeText, { color: colors.mint }]}>NEW</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Guided Tracks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guided Learning Tracks</Text>
        <Text style={styles.sectionSubtitle}>
          Step-by-step courses to build your confidence
        </Text>
        
        {GUIDED_TRACKS.map((track) => (
          <Pressable key={track.id} style={[styles.trackCard, { borderLeftColor: track.color }]}>
            <View style={styles.trackContent}>
              <Text style={styles.trackTitle}>{track.title}</Text>
              <Text style={styles.trackDescription}>{track.description}</Text>
              <View style={styles.trackMeta}>
                <View style={styles.trackMetaItem}>
                  <BookOpen size={14} color={colors.charcoal} />
                  <Text style={styles.trackMetaText}>{track.lessons} lessons</Text>
                </View>
                <View style={styles.trackMetaItem}>
                  <Text style={styles.trackMetaText}>• {track.duration}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.trackArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      {/* Browse by Topic */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse by Topic</Text>
        <Text style={styles.sectionSubtitle}>
          Evidence-based guidance organised by what matters most
        </Text>
        
        <View style={styles.pillarsGrid}>
          {CONTENT_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Pressable 
                key={pillar.id} 
                style={styles.pillarCard}
                onPress={() => router.push(`/learn/topic/${pillar.id}`)}
              >
                <View style={[styles.pillarIcon, { backgroundColor: pillar.color + '20' }]}>
                  <Icon size={24} color={pillar.color} />
                </View>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarDescription}>{pillar.description}</Text>
                <Text style={styles.pillarCount}>{pillar.articleCount} articles</Text>
                <View style={styles.pillarTags}>
                  {pillar.tags.slice(0, 2).map((tag, index) => (
                    <Text key={index} style={styles.pillarTag}>{tag}</Text>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Ask AI Section */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Pressable 
          style={styles.aiCard}
          onPress={() => router.push('/freshies-chat')}
        >
          <View style={styles.aiIconContainer}>
            <Brain size={32} color={colors.white} />
          </View>
          <Text style={styles.aiTitle}>Ask FreshiesAI</Text>
          <Text style={styles.aiDescription}>
            Get instant answers about ingredients, routines, and products
          </Text>
          <View style={styles.aiButton}>
            <Text style={styles.aiButtonText}>Start Conversation</Text>
          </View>
        </Pressable>
      </View>

      {/* Floating AI Button */}
      <FloatingAIButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Sections
  section: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  // New Articles
  newArticleCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mint + '30',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newArticleContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  newArticleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    lineHeight: 22,
  },
  newArticleSummary: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  newArticleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  newArticleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  newArticleMetaText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  newArticleBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    height: 24,
    justifyContent: 'center',
  },
  newArticleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Guided Tracks
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
    borderLeftWidth: 4,
  },
  trackContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  trackDescription: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  trackMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  trackMetaText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  trackArrow: {
    fontSize: 20,
    color: colors.charcoal,
  },

  // Content Pillars
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  pillarCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  pillarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  pillarDescription: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: spacing[2],
    minHeight: 32,
  },
  pillarCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[2],
  },
  pillarTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  pillarTag: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  pillarTagText: {
    fontSize: 10,
    color: colors.charcoal,
  },

  // AI Card
  aiCard: {
    backgroundColor: colors.purple,
    padding: spacing[6],
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  aiDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  aiButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.purple,
  },
});
