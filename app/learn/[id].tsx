/**
 * Learn Article Detail Screen
 * Displays full article content with FAQs
 */

import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { globalStyles } from '../../src/theme/styles';
import { BookOpen, Bookmark, Share2, ChevronLeft, ExternalLink, Brain } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { openChatWithQuestion } from '../../src/utils/chatHelpers';

interface Article {
  id: string;
  title: string;
  summary: string;
  body_sections: Array<{
    heading: string;
    content: string;
    order: number;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    order: number;
  }>;
  topic: string;
  tags: string[];
  age_bands: string[];
  source_name: string;
  source_url: string;
  disclaimer: string;
  view_count: number;
  save_count: number;
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [id]);

  async function loadArticle() {
    try {
      const { data, error } = await supabase
        .from('learn_articles')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      setArticle(data);
      
      // Increment view count
      await supabase.rpc('increment_article_view_count', {
        article_uuid: id,
      });
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setIsSaved(!isSaved);
    // TODO: Call API to save/unsave article
  }

  async function handleShare() {
    // TODO: Implement share functionality
    console.log('Share article');
  }

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <Text style={globalStyles.textBase}>Loading...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[globalStyles.container, globalStyles.centerContainer]}>
        <Text style={globalStyles.textBase}>Article not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        
        <View style={styles.headerActions}>
          <Pressable onPress={handleSave} style={styles.iconButton}>
            <Bookmark 
              size={24} 
              color={colors.white} 
              fill={isSaved ? colors.white : 'none'}
            />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.iconButton}>
            <Share2 size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <BookOpen size={16} color={colors.charcoal} />
            <Text style={styles.metaText}>{article.source_name}</Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{article.view_count} views</Text>
        </View>

        {/* Tags */}
        <View style={styles.tags}>
          {article.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Summary / Key Takeaways */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Key Takeaways</Text>
          <View style={styles.summaryContent}>
            {article.summary.split('\n').filter(line => line.trim()).map((point, index) => (
              <View key={index} style={styles.summaryPoint}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>{point.replace('•', '').trim()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Body Sections */}
        {article.body_sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* FAQs */}
        {article.faqs.length > 0 && (
          <View style={styles.faqSection}>
            <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
            {article.faqs.map((faq, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Q: {faq.question}</Text>
                <Text style={styles.faqAnswer}>A: {faq.answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{article.disclaimer}</Text>
        </View>

        {/* Ask FreshiesAI */}
        <Pressable 
          style={styles.aiButton}
          onPress={() => openChatWithQuestion(`Can you help me understand more about: ${article.title}?`)}
        >
          <View style={styles.aiButtonIcon}>
            <Brain size={20} color={colors.white} />
          </View>
          <View style={styles.aiButtonContent}>
            <Text style={styles.aiButtonTitle}>Ask FreshiesAI about this topic</Text>
            <Text style={styles.aiButtonSubtitle}>Get personalized answers for your child</Text>
          </View>
        </Pressable>

        {/* Source Link */}
        {article.source_url && (
          <Pressable 
            style={styles.sourceLink}
            onPress={() => Linking.openURL(article.source_url)}
          >
            <View style={styles.sourceLinkContent}>
              <ExternalLink size={16} color={colors.mint} />
              <View style={styles.sourceLinkText}>
                <Text style={styles.sourceLinkTitle}>Read the original article</Text>
                <Text style={styles.sourceLinkSource}>{article.source_name}</Text>
              </View>
            </View>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
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
    padding: spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  iconButton: {
    padding: spacing[2],
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
    lineHeight: 36,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaText: {
    fontSize: 14,
    color: colors.charcoal,
  },
  metaDivider: {
    fontSize: 14,
    color: colors.charcoal,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  tag: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.black,
  },
  summaryCard: {
    backgroundColor: '#E8D5F2',
    padding: spacing[4],
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.lilac,
    marginBottom: spacing[8],
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  summaryContent: {
    gap: spacing[3],
  },
  summaryPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  summaryBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.black,
    marginTop: 7,
  },
  summaryText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.black,
    lineHeight: 26,
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  sectionContent: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 26,
  },
  faqSection: {
    backgroundColor: colors.purple + '08',
    padding: spacing[5],
    borderRadius: radii.lg,
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[5],
  },
  faqItem: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.md,
    marginBottom: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: colors.purple,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[2],
  },
  faqAnswer: {
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 24,
  },
  disclaimer: {
    backgroundColor: colors.orange + '10',
    padding: spacing[4],
    borderRadius: radii.md,
    marginTop: spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  disclaimerText: {
    fontSize: 13,
    color: colors.charcoal,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    padding: spacing[4],
    borderRadius: radii.md,
    marginTop: spacing[4],
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  aiButtonIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  aiButtonContent: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  aiButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sourceLink: {
    backgroundColor: colors.mint,
    padding: spacing[4],
    borderRadius: radii.md,
    marginTop: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.black,
  },
  sourceLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sourceLinkText: {
    flex: 1,
  },
  sourceLinkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  sourceLinkSource: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
});
