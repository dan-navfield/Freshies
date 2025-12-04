import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { globalStyles } from '../../src/theme/styles';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Star, Smile, Frown, Meh, Users, ChevronRight, Bell } from 'lucide-react-native';
import { searchProductsByName, lookupProductByBarcode } from '../../src/services/api/openBeautyFacts';
import { searchMakeupByBrand } from '../../src/services/makeup/makeupApi';
import PageHeader from '../../components/PageHeader';
import FloatingAIButton from '../../components/FloatingAIButton';
import ChildSwitcher from '../../components/ChildSwitcher';
import { getChildren } from '../../src/services/familyService';
import { ChildProfile } from '../../src/types/family';
import { supabase } from '../../src/lib/supabase';

// Mock data - replace with real data from your backend
const MOCK_CHILDREN = [
  { 
    id: '1', 
    name: 'Ruby', 
    age: 11, 
    status: 'caution', 
    statusText: '1 product flagged', 
    color: colors.orange,
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop&crop=faces'
  },
  { 
    id: '2', 
    name: 'Leo', 
    age: 8, 
    status: 'ok', 
    statusText: 'New product added', 
    color: colors.mint,
    avatar: 'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=200&h=200&fit=crop&crop=faces'
  },
  { 
    id: '3', 
    name: 'Elliot', 
    age: 6, 
    status: 'pending', 
    statusText: 'Awaiting approval', 
    color: colors.lilac,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces'
  },
];

// Real products will be fetched from API
interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  status: 'ok' | 'caution' | 'avoid';
  image: string | null;
}

const MOCK_ATTENTION_PRODUCTS = [
  { id: '1', product: 'Brightening Serum', issue: 'Strong actives for age 11', severity: 'caution' },
  { id: '2', product: 'Kids Bubbly Wash', issue: 'Contains fragrance (marked as avoid)', severity: 'avoid' },
  { id: '3', product: 'Daily Moisturiser', issue: 'Formulation update detected 3 days ago', severity: 'info' },
];

const MOCK_RECOMMENDATIONS = [
  { id: '1', title: 'Fragrance-free options', description: 'Based on your past choices', category: 'Suitable for kids' },
  { id: '2', title: 'Gentle moisturisers', description: 'For eczema-prone skin', category: 'Gentle ingredients' },
  { id: '3', title: 'Mineral sunscreens', description: 'Highly rated, ingredient-safe', category: 'Safe actives' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, userRole, onboardingCompleted } = useAuth();
  const [userName, setUserName] = useState('Dan');
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [familyPromptDismissed, setFamilyPromptDismissed] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch children and notifications on mount
  useEffect(() => {
    async function loadData() {
      if (user?.id && userRole === 'parent') {
        const childrenData = await getChildren(user.id);
        setChildren(childrenData);
        
        // Fetch unread notifications count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
        
        setUnreadNotifications(count || 0);
      }
    }
    loadData();
  }, [user, userRole]);

  // Fetch real products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const allProducts: RecentProduct[] = [];

        // 1. Fetch from Open Beauty Facts (barcodes)
        const barcodes = [
          '3337875696548', // La Roche-Posay Lipikar Baume
          '3600523595426', // Bioderma Sensibio H2O
          '3337871330453', // La Roche-Posay Anthelios
          '3337875597180', // CeraVe Hydrating Cleanser
          '3600550964097', // Garnier Micellar Water
          '3574661530598', // Vichy Mineral 89
        ];

        const obfProducts = await Promise.all(
          barcodes.map(async (barcode, index) => {
            const result = await lookupProductByBarcode(barcode);
            if (result.found && result.product) {
              const statuses: ('ok' | 'caution' | 'avoid')[] = ['ok', 'ok', 'caution', 'ok', 'ok', 'caution'];
              return {
                id: barcode,
                name: result.product.name,
                brand: result.product.brand,
                status: statuses[index],
                image: result.product.imageUrl || null,
              };
            }
            return null;
          })
        );

        allProducts.push(...obfProducts.filter((p): p is RecentProduct => p !== null));

        // 2. Fetch from Makeup API (different brands)
        try {
          const makeupBrands = ['maybelline', 'nyx', 'covergirl'];
          
          for (const brand of makeupBrands) {
            const makeupResults = await searchMakeupByBrand(brand);
            
            // Take first 2 products from each brand
            const brandProducts = makeupResults.slice(0, 2).map((product, index) => ({
              id: `makeup-${product.id}`,
              name: product.name,
              brand: product.brand,
              status: (index % 3 === 0 ? 'caution' : 'ok') as 'ok' | 'caution' | 'avoid',
              image: product.image_link || product.api_featured_image || null,
            }));
            
            allProducts.push(...brandProducts);
          }
        } catch (makeupError) {
          // Silently handle - Makeup API is optional
        }

        setRecentProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <ScrollView style={globalStyles.scrollContainer}>
      {/* Page Header */}
      <PageHeader
        title={`Hi ${userName} 👋`}
        subtitle="Here's what's happening with your family"
        showAvatar={true}
        showSearch={true}
        searchPlaceholder="Search products, brands, ingredients..."
        compact={true}
        showNotifications={true}
        unreadCount={unreadNotifications}
      />

      {/* Child Switcher - Only show for parents with children */}
      {userRole === 'parent' && children.length > 0 && (
        <ChildSwitcher
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
          showAllOption={true}
        />
      )}

      {/* Manage Family Button - For parents */}
      {userRole === 'parent' && !familyPromptDismissed && (
        <View style={styles.manageFamilySection}>
          <Pressable 
            style={styles.manageFamilyButton}
            onPress={() => router.push('/family' as any)}
          >
            <View style={styles.manageFamilyIcon}>
              <Users size={18} color={colors.white} />
            </View>
            <View style={styles.manageFamilyContent}>
              <Text style={styles.manageFamilyTitle}>
                {children.length === 0 
                  ? 'Add your first child'
                  : children.length === 1
                  ? 'You have 1 Child. Tap to Add/Manage'
                  : `You have ${children.length} Children. Tap to Add/Manage`
                }
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.6)" />
            {children.length > 0 && (
              <Pressable 
                onPress={(e) => {
                  e.stopPropagation();
                  setFamilyPromptDismissed(true);
                }}
                style={styles.dismissButton}
                hitSlop={8}
              >
                <Text style={styles.dismissText}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        </View>
      )}

      {/* Section 1: Family Information Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Updates</Text>
        
        {/* Family Update Banner - Navigate to Approvals */}
        <Pressable 
          style={styles.updateBanner}
          onPress={() => router.push('/approvals' as any)}
        >
          <AlertCircle size={20} color={colors.orange} />
          <Text style={styles.updateText}>2 products need review for Ruby</Text>
        </Pressable>

        {/* Child Status Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childRow}>
          {MOCK_CHILDREN.map((child) => (
            <Pressable key={child.id} style={styles.childCard}>
              <Image 
                source={{ uri: child.avatar }}
                style={styles.childAvatar}
              />
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childStatus}>{child.statusText}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Weekly Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightRow}>
            <TrendingUp size={16} color={colors.purple} />
            <Text style={styles.insightText}>You scanned 3 new products this week</Text>
          </View>
          <View style={styles.insightRow}>
            <CheckCircle size={16} color={colors.mint} />
            <Text style={styles.insightText}>2 products added to routines</Text>
          </View>
          <View style={styles.insightRow}>
            <AlertCircle size={16} color={colors.orange} />
            <Text style={styles.insightText}>1 suggestion to simplify routines</Text>
          </View>
        </View>

        {/* Reminders */}
        <View style={styles.reminderCard}>
          <Clock size={16} color={colors.charcoal} />
          <View style={styles.reminderContent}>
            <Text style={styles.reminderText}>Ruby's sunscreen expires next month</Text>
            <Text style={styles.reminderSubtext}>Consider restocking soon</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Product-Focused Surfaces */}
      <View style={styles.productSection}>
        <Text style={styles.productSectionTitle}>Recently Scanned</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.productRow}
            contentContainerStyle={styles.productRowContent}
            snapToInterval={196} // card width (180) + margin (16)
            decelerationRate="fast"
            pagingEnabled={false}
          >
            {recentProducts.map((product: RecentProduct, index) => {
              // Generate mock rating data - make 3rd product score badly
              const isBadProduct = index === 2;
              const rating = isBadProduct ? '2.8' : (3.5 + Math.random() * 1.5).toFixed(1);
              const reviewCount = Math.floor(Math.random() * 50) + 5;
              const freshScore = isBadProduct ? 32 : Math.floor(60 + Math.random() * 35);
              
              return (
                <Pressable key={product.id} style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    {product.image ? (
                      <Image 
                        source={{ uri: product.image }} 
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholderContainer]}>
                        <Text style={styles.productImagePlaceholder}>📦</Text>
                      </View>
                    )}
                    {/* Fresh Rating Badge */}
                    <View style={[styles.freshBadge, isBadProduct && styles.freshBadgeBad]}>
                      <Text style={styles.freshScore}>{freshScore}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.productInfo}>
                    <View style={styles.brandRow}>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <Text style={styles.verifiedBadge}>✓</Text>
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    
                    {/* Star Rating */}
                    <View style={styles.ratingRow}>
                      <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= Math.floor(parseFloat(rating)) ? (isBadProduct ? colors.orange : '#FFD700') : 'transparent'}
                            color={star <= Math.floor(parseFloat(rating)) ? (isBadProduct ? colors.orange : '#FFD700') : 'rgba(255, 255, 255, 0.3)'}
                            style={{ marginRight: 2 }}
                          />
                        ))}
                      </View>
                      <Text style={[styles.ratingText, isBadProduct && { color: colors.orange }]}>
                        {rating} ({reviewCount})
                      </Text>
                    </View>
                    
                    {/* Would Buy Again */}
                    <View style={styles.buyAgainRow}>
                      {freshScore < 50 ? (
                        <Frown 
                          size={14} 
                          color={colors.orange} 
                          style={{ marginRight: spacing[1] }}
                        />
                      ) : freshScore < 70 ? (
                        <Meh 
                          size={14} 
                          color={colors.orange} 
                          style={{ marginRight: spacing[1] }}
                        />
                      ) : (
                        <Smile 
                          size={14} 
                          color='rgba(255, 255, 255, 0.7)' 
                          style={{ marginRight: spacing[1] }}
                        />
                      )}
                      <Text style={[styles.buyAgainText, freshScore < 70 && { color: colors.orange }]}>
                        {freshScore}% would buy again
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        
        {/* Go to My Scans Link */}
        {!loading && recentProducts.length > 0 && (
          <Pressable 
            style={styles.viewAllLink}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Text style={styles.viewAllLinkText}>Go to my Scans →</Text>
          </Pressable>
        )}
      </View>

      {/* Products Needing Attention */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Needs Your Attention</Text>
        {MOCK_ATTENTION_PRODUCTS.map((item) => (
          <Pressable key={item.id} style={[styles.attentionCard, item.severity === 'caution' ? styles.attention_caution : item.severity === 'avoid' ? styles.attention_avoid : styles.attention_info]}>
            <View style={styles.attentionContent}>
              <Text style={styles.attentionProduct}>{item.product}</Text>
              <Text style={styles.attentionIssue}>{item.issue}</Text>
            </View>
            <AlertCircle size={20} color={item.severity === 'avoid' ? colors.red : colors.orange} />
          </Pressable>
        ))}
      </View>

      {/* Recommended Good Choices */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for Your Family</Text>
        {MOCK_RECOMMENDATIONS.map((rec) => (
          <Pressable key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
              <Text style={styles.recommendationDescription}>{rec.description}</Text>
              <View style={styles.recommendationBadge}>
                <Text style={styles.recommendationBadgeText}>{rec.category}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Household Product Summary */}
      <View style={styles.section}>
        <Pressable style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Household Products</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatNumber}>18</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.mint }]}>12</Text>
              <Text style={styles.summaryStatLabel}>OK</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.orange }]}>4</Text>
              <Text style={styles.summaryStatLabel}>Caution</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatNumber, { color: colors.red }]}>2</Text>
              <Text style={styles.summaryStatLabel}>Avoid</Text>
            </View>
          </View>
          <Text style={styles.summaryLink}>View all products →</Text>
        </Pressable>
      </View>

      {/* Routines to Check */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Routines to Review</Text>
        {MOCK_CHILDREN.map((child) => (
          <Pressable key={child.id} style={styles.routineCard}>
            <Image 
              source={{ uri: child.avatar }}
              style={styles.routineAvatar}
            />
            <View style={styles.routineContent}>
              <Text style={styles.routineName}>{child.name}'s Routine</Text>
              <Text style={styles.routineDescription}>
                {child.status === 'caution' ? '⚠️ Needs review' : '✓ Looking good'}
              </Text>
            </View>
            <Text style={styles.routineArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      {/* Ask FreshiesAI */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Pressable style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconContainer}>
              <Text style={styles.aiIcon}>🤖</Text>
            </View>
            <View style={styles.aiHeaderText}>
              <Text style={styles.aiTitle}>Ask FreshiesAI</Text>
              <Text style={styles.aiSubtitle}>Get instant answers about products & routines</Text>
            </View>
          </View>
          <View style={styles.aiSuggestions}>
            <Text style={styles.aiSuggestionTitle}>Try asking:</Text>
            <Text style={styles.aiSuggestion}>• "Is this product safe for my 11-year-old?"</Text>
            <Text style={styles.aiSuggestion}>• "What's a good routine for eczema?"</Text>
            <Text style={styles.aiSuggestion}>• "Can these products be used together?"</Text>
          </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },

  // Product Section (Black Background)
  productSection: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
    marginBottom: spacing[6],
  },
  productSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[4],
  },
  viewAllLink: {
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  viewAllLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Update Banner
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  updateText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },

  // Child Cards
  childRow: {
    marginBottom: spacing[4],
  },
  childCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginRight: spacing[3],
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: spacing[2],
    borderWidth: 2,
    borderColor: colors.white,
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  childStatus: {
    fontSize: 12,
    color: colors.charcoal,
    textAlign: 'center',
  },

  // Insights Card
  insightsCard: {
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
  },

  // Reminder Card
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
    gap: spacing[3],
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  reminderSubtext: {
    fontSize: 12,
    color: colors.charcoal,
  },

  // Product Cards
  productRow: {
    marginBottom: spacing[4],
  },
  productRowContent: {
    paddingRight: spacing[6], // Add padding at the end for better scrolling
  },
  loadingContainer: {
    padding: spacing[6],
    alignItems: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: 14,
  },
  productCard: {
    width: 180,
    backgroundColor: colors.black,
    borderRadius: radii.lg,
    marginRight: spacing[4],
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: colors.white,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholder: {
    fontSize: 40,
  },
  freshBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderTopLeftRadius: radii.md,
  },
  freshBadgeBad: {
    backgroundColor: colors.red,
  },
  freshScore: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  productInfo: {
    padding: spacing[3],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  productBrand: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mint,
    marginRight: spacing[1],
  },
  verifiedBadge: {
    fontSize: 12,
    color: colors.mint,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing[2],
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[2],
  },
  ratingText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buyAgainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyAgainText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Attention Cards
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderLeftWidth: 4,
  },
  attention_caution: {
    backgroundColor: '#FFF4E6',
    borderLeftColor: '#FF9500',
  },
  attention_avoid: {
    backgroundColor: '#FFE5E5',
    borderLeftColor: '#FF3B30',
  },
  attention_info: {
    backgroundColor: '#E5F2FF',
    borderLeftColor: colors.purple,
  },
  attentionContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  attentionProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  attentionIssue: {
    fontSize: 13,
    color: colors.charcoal,
  },

  // Recommendation Cards
  recommendationCard: {
    backgroundColor: '#D4F4DD',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  recommendationContent: {
    gap: spacing[2],
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  recommendationDescription: {
    fontSize: 13,
    color: colors.charcoal,
  },
  recommendationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  recommendationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.black,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.white,
    padding: spacing[5],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[4],
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.charcoal,
  },
  summaryLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
    textAlign: 'center',
  },

  // Routine Cards
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  routineAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing[3],
  },
  routineContent: {
    flex: 1,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 13,
    color: colors.charcoal,
  },
  routineArrow: {
    fontSize: 20,
    color: colors.charcoal,
  },

  // AI Card
  aiCard: {
    backgroundColor: colors.purple,
    padding: spacing[5],
    borderRadius: radii.xl,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  aiIcon: {
    fontSize: 24,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  aiSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  aiSuggestions: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing[4],
    borderRadius: radii.md,
    marginBottom: spacing[4],
  },
  aiSuggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing[2],
  },
  aiSuggestion: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing[1],
  },
  aiButton: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.purple,
  },

  // Manage Family Button
  manageFamilySection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  manageFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    gap: spacing[3],
  },
  manageFamilyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageFamilyContent: {
    flex: 1,
  },
  manageFamilyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  manageFamilySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  dismissText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },

  // Approval Banner
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.orange,
    gap: spacing[3],
  },
  approvalBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalBannerContent: {
    flex: 1,
  },
  approvalBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  approvalBannerText: {
    fontSize: 13,
    color: colors.charcoal,
  },
});
