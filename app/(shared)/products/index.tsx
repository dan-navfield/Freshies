import { View, Text, ScrollView, Pressable, StyleSheet, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { useAuth } from '../../../contexts/AuthContext';
import { ChevronLeft, Search, Filter, Package, TrendingUp, Clock, Grid, List } from 'lucide-react-native';
import { getChildProducts } from '../../../src/services/productsService';
import { getChildren } from '../../../src/services/familyService';
import { ChildProduct } from '../../../src/types/products';
import { ChildProfile } from '../../../src/types/family';

export default function ProductLibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<ChildProduct[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadProducts(selectedChild);
    }
  }, [selectedChild]);

  async function loadData() {
    if (!user?.id) return;
    
    setLoading(true);
    const childrenData = await getChildren(user.id);
    setChildren(childrenData);
    
    if (childrenData.length > 0) {
      setSelectedChild(childrenData[0].id);
      await loadProducts(childrenData[0].id);
    }
    setLoading(false);
  }

  async function loadProducts(childId: string) {
    const productsData = await getChildProducts(childId, 'active');
    setProducts(productsData);
  }

  const selectedChildData = children.find(c => c.id === selectedChild);
  
  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: products.length,
    recentlyUsed: products.filter(p => {
      if (!p.last_used_at) return false;
      const daysSinceUse = (Date.now() - new Date(p.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUse <= 7;
    }).length,
    favorites: products.filter(p => p.usage_count > 5).length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Product Library</Text>
        <Pressable 
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={styles.viewToggle}
        >
          {viewMode === 'grid' ? (
            <List size={20} color={colors.white} />
          ) : (
            <Grid size={20} color={colors.white} />
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Stats Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroHeader}>
              {selectedChildData && (
                <Image 
                  source={{ 
                    uri: selectedChildData.avatar_url || `https://ui-avatars.com/api/?name=${selectedChildData.first_name}&background=random&size=200`
                  }}
                  style={styles.heroAvatar}
                />
              )}
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>
                  {selectedChildData?.display_name}'s Products
                </Text>
                <Text style={styles.heroSubtitle}>
                  {stats.total} approved {stats.total === 1 ? 'product' : 'products'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.purple + '20' }]}>
                  <Package size={20} color={colors.purple} />
                </View>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.mint + '20' }]}>
                  <Clock size={20} color={colors.mint} />
                </View>
                <Text style={styles.statNumber}>{stats.recentlyUsed}</Text>
                <Text style={styles.statLabel}>Recent</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.orange + '20' }]}>
                  <TrendingUp size={20} color={colors.orange} />
                </View>
                <Text style={styles.statNumber}>{stats.favorites}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Child Selector */}
        {children.length > 1 && (
          <View style={styles.childSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {children.map((child) => (
                <Pressable
                  key={child.id}
                  style={[
                    styles.childChip,
                    selectedChild === child.id && styles.childChipActive
                  ]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <Image 
                    source={{ 
                      uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
                    }}
                    style={styles.childChipAvatar}
                  />
                  <Text style={[
                    styles.childChipText,
                    selectedChild === child.id && styles.childChipTextActive
                  ]}>
                    {child.display_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.charcoal} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.charcoal}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Products Grid/List */}
        <View style={styles.productsSection}>
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading products...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No products found' : 'No products yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Approved products will appear here'
                }
              </Text>
            </View>
          ) : viewMode === 'grid' ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <Pressable
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  {product.product_image_url ? (
                    <Image 
                      source={{ uri: product.product_image_url }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text style={styles.productImagePlaceholderText}>📦</Text>
                    </View>
                  )}
                  
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.product_name}
                    </Text>
                    {product.product_brand && (
                      <Text style={styles.productBrand} numberOfLines={1}>
                        {product.product_brand}
                      </Text>
                    )}
                    
                    {product.usage_count > 0 && (
                      <View style={styles.usageBadge}>
                        <Text style={styles.usageText}>
                          Used {product.usage_count}x
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.productsList}>
              {filteredProducts.map((product) => (
                <Pressable
                  key={product.id}
                  style={styles.productListItem}
                  onPress={() => router.push(`/products/${product.id}` as any)}
                >
                  {product.product_image_url ? (
                    <Image 
                      source={{ uri: product.product_image_url }}
                      style={styles.productListImage}
                    />
                  ) : (
                    <View style={styles.productListImagePlaceholder}>
                      <Text style={styles.productListImagePlaceholderText}>📦</Text>
                    </View>
                  )}
                  
                  <View style={styles.productListInfo}>
                    <Text style={styles.productListName} numberOfLines={1}>
                      {product.product_name}
                    </Text>
                    {product.product_brand && (
                      <Text style={styles.productListBrand} numberOfLines={1}>
                        {product.product_brand}
                      </Text>
                    )}
                    {product.usage_count > 0 && (
                      <Text style={styles.productListUsage}>
                        Used {product.usage_count} {product.usage_count === 1 ? 'time' : 'times'}
                      </Text>
                    )}
                  </View>
                  
                  <ChevronLeft 
                    size={20} 
                    color={colors.charcoal} 
                    style={{ transform: [{ rotate: '180deg' }] }} 
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  viewToggle: {
    width: 40,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.purple,
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    marginBottom: spacing[4],
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  heroContent: {
    padding: spacing[6],
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[5],
    gap: spacing[3],
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.white,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  childSelector: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.full,
    marginRight: spacing[3],
    gap: spacing[2],
  },
  childChipActive: {
    backgroundColor: colors.purple,
  },
  childChipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  childChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  childChipTextActive: {
    color: colors.white,
  },
  searchSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
  },
  productsSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.cream,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 48,
  },
  productInfo: {
    padding: spacing[4],
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
    minHeight: 36,
  },
  productBrand: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  usageBadge: {
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  usageText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mint,
  },
  productsList: {
    gap: spacing[3],
  },
  productListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productListImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  productListImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productListImagePlaceholderText: {
    fontSize: 32,
  },
  productListInfo: {
    flex: 1,
  },
  productListName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  productListBrand: {
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: 4,
  },
  productListUsage: {
    fontSize: 12,
    color: colors.mint,
    fontWeight: '600',
  },
  emptyState: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
  },
});
