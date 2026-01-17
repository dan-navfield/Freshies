/**
 * Learn Topic List Screen
 * Shows all articles for a specific topic
 */

import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { globalStyles } from '../../../src/theme/styles';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react-native';
import { supabase } from '../../../src/lib/supabase';

interface Article {
  id: string;
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  age_bands: string[];
  source_name: string;
  view_count: number;
}

const TOPIC_INFO: Record<string, { title: string; description: string; color: string }> = {
  'skin-basics': {
    title: 'Skin Basics for Kids & Teens',
    description: 'Understanding how skin works at different ages',
    color: colors.mint,
  },
  'ingredients': {
    title: 'Ingredients Explained',
    description: 'Friendly guides to common skincare ingredients',
    color: colors.lilac,
  },
  'products': {
    title: 'Product Types',
    description: 'What each product does and when kids need it',
    color: colors.peach,
  },
  'routines': {
    title: 'Routines & Layering',
    description: 'Building age-appropriate skincare routines',
    color: colors.lemon,
  },
  'safety': {
    title: 'Safety & Regulation',
    description: 'How products are regulated in Australia',
    color: colors.orange,
  },
  'mental-health': {
    title: 'Teens & Social Media',
    description: 'Navigating skincare trends and social pressure',
    color: colors.purple,
  },
};

export default function TopicListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const topicInfo = TOPIC_INFO[id as string] || TOPIC_INFO['skin-basics'];

  useEffect(() => {
    loadArticles();
  }, [id]);

  async function loadArticles() {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('learn_articles')
        .select('*')
        .eq('topic', id)
        .eq('status', 'published')
        .or(`published_at.is.null,published_at.lte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: topicInfo.color }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{topicInfo.title}</Text>
          <Text style={styles.headerDescription}>{topicInfo.description}</Text>
          <Text style={styles.headerCount}>{articles.length} articles</Text>
        </View>
      </View>

      {/* Articles List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading articles...</Text>
          </View>
        ) : (
          <>
            {articles.map((article) => (
              <Pressable
                key={article.id}
                style={styles.articleCard}
                onPress={() => router.push(`/learn/${article.id}`)}
              >
                <View style={styles.articleHeader}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <View style={styles.articleMeta}>
                    <BookOpen size={14} color={colors.charcoal} />
                    <Text style={styles.articleMetaText}>{article.source_name}</Text>
                  </View>
                </View>
                
                <Text style={styles.articleSummary} numberOfLines={2}>
                  {article.summary}
                </Text>
                
                <View style={styles.articleFooter}>
                  <View style={styles.articleTags}>
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.articleTag}>
                        <Text style={styles.articleTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.articleStats}>
                    <Clock size={12} color={colors.charcoal} />
                    <Text style={styles.articleStatsText}>5 min read</Text>
                  </View>
                </View>
              </Pressable>
            ))}
            
            {articles.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No articles yet</Text>
                <Text style={styles.emptySubtext}>
                  We're working on adding content to this topic
                </Text>
              </View>
            )}
          </>
        )}
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
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[8],
  },
  backButton: {
    padding: spacing[2],
    marginBottom: spacing[4],
    alignSelf: 'flex-start',
  },
  headerContent: {
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  headerDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing[3],
  },
  headerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[12],
  },
  loadingContainer: {
    paddingVertical: spacing[12],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  articleCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  articleHeader: {
    marginBottom: spacing[3],
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    lineHeight: 24,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  articleMetaText: {
    fontSize: 13,
    color: colors.charcoal,
  },
  articleSummary: {
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleTags: {
    flexDirection: 'row',
    gap: spacing[2],
    flex: 1,
  },
  articleTag: {
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  articleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mint,
  },
  articleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  articleStatsText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  emptyState: {
    paddingVertical: spacing[12],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.charcoal,
    textAlign: 'center',
  },
});
