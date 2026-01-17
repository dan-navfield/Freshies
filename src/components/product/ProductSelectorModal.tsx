import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Search, Package, Clock, Heart, Sparkles } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, radii } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { searchProducts } from '../services/api/productLookup';

interface Product {
  id: string;
  product_name: string;
  brand_name?: string;
  image_url?: string;
  category?: string;
  ingredients?: string;
  is_favorite?: boolean;
}

interface ProductSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  childProfileId: string;
  stepType?: string; // e.g., 'cleanser', 'moisturizer'
}

export default function ProductSelectorModal({
  visible,
  onClose,
  onSelectProduct,
  childProfileId,
  stepType,
}: ProductSelectorModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUsedProducts, setLastUsedProducts] = useState<Product[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'shelf' | 'global'>('shelf');

  useEffect(() => {
    if (visible) {
      console.log('ProductSelectorModal visible. Loading for childProfileId:', childProfileId);
      loadProducts();
    }
  }, [visible, childProfileId]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.log('No user ID found');
        setLoading(false);
        return;
      }

      // Load products from the Shelf
      const { data: shelfItems, error } = await supabase
        .from('shelf_items')
        .select('*')
        .eq('user_id', user.id) // Ensure we fetch items owned by the parent
        .eq('profile_id', childProfileId) // Filter by child
        .in('status', ['active', 'running_low']) // Include active and low stock
        .order('created_at', { ascending: false })
        .limit(50); // Fetch more

      if (error) throw error;

      console.log('Child shelf items:', shelfItems?.length || 0);

      // Convert to Modal Product format
      const childProducts: Product[] = (shelfItems || []).map(p => ({
        id: p.id,
        product_name: p.product_name,
        brand_name: p.product_brand,
        image_url: p.product_image_url,
        category: p.product_category,
        ingredients: undefined, // Shelf items might not have ingredients stored locally yet
        is_favorite: false // Default to false
      }));

      setProducts(childProducts);
      setFilteredProducts(childProducts);

      if (childProducts.length > 0) {
        await loadRecommendations(childProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (allProducts: Product[]) => {
    try {
      // Get last used products (from routine completions)
      const { data: recentCompletions } = await supabase
        .from('routine_step_completions')
        .select(`
          custom_routines!inner(steps)
        `)
        .eq('child_profile_id', childProfileId)
        .order('completion_date', { ascending: false })
        .limit(20);

      // Extract product IDs from recent completions
      const recentProductIds = new Set<string>();
      recentCompletions?.forEach((completion: any) => {
        const steps = completion.custom_routines?.steps || [];
        steps.forEach((step: any) => {
          if (step.product_id) {
            recentProductIds.add(step.product_id);
          }
        });
      });

      const lastUsed = allProducts.filter(p => recentProductIds.has(p.id)).slice(0, 3);
      setLastUsedProducts(lastUsed);

      // Get favorites (products marked as favorite)
      const favorites = allProducts.filter(p => p.is_favorite).slice(0, 3);
      setFavoriteProducts(favorites);

      // Get suggested products (filter by step type if available)
      let suggested = allProducts;
      if (stepType) {
        suggested = allProducts.filter(p =>
          p.category?.toLowerCase().includes(stepType.toLowerCase())
        );
      }
      // Exclude already shown products
      suggested = suggested.filter(p =>
        !recentProductIds.has(p.id) && !p.is_favorite
      ).slice(0, 3);
      setSuggestedProducts(suggested);

    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const filterProducts = async () => {
    if (!searchQuery.trim()) {
      // If there's a step type, filter by category
      if (stepType) {
        const filtered = products.filter(p =>
          p.category?.toLowerCase().includes(stepType.toLowerCase())
        );
        setFilteredProducts(filtered.length > 0 ? filtered : products);
      } else {
        setFilteredProducts(products);
      }
      return;
    }

    const query = searchQuery.toLowerCase().trim();

    // Search the global product database
    try {
      // If searching in shelf mode, we just filter local items (already done above if activeTab check was earlier, but let's be explicit)
      if (activeTab === 'shelf') {
        const query = searchQuery.toLowerCase().trim();
        const filtered = products.filter(product => {
          const productName = product.product_name?.toLowerCase() || '';
          const brandName = product.brand_name?.toLowerCase() || '';
          const category = product.category?.toLowerCase() || '';
          return productName.includes(query) || brandName.includes(query) || category.includes(query);
        });
        setFilteredProducts(filtered);
        return;
      }

      setLoading(true);
      console.log('Searching global database for:', query);

      const results = await searchProducts(query, 1);
      console.log('Search results:', results.products.length);

      // Convert search results to our Product format
      const searchedProducts: Product[] = results.products.map((p, index) => ({
        id: `search-${index}`, // Temporary ID for search results
        product_name: p.product?.name || 'Unknown Product',
        brand_name: p.product?.brand,
        image_url: p.product?.imageUrl,
        category: p.product?.category,
        ingredients: p.product?.ingredientsText,
      }));

      setFilteredProducts(searchedProducts);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to local filtering
      const filtered = products.filter(product => {
        const productName = product.product_name?.toLowerCase() || '';
        const brandName = product.brand_name?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';

        return (
          productName.includes(query) ||
          brandName.includes(query) ||
          category.includes(query)
        );
      });
      setFilteredProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    // If this is a search result (temporary ID), save it to database first
    if (product.id.startsWith('search-')) {
      try {
        const { data: savedProduct, error } = await supabase
          .from('shelf_items')
          .insert({
            user_id: user?.id,
            profile_id: childProfileId,
            product_name: product.product_name,
            product_brand: product.brand_name,
            product_image_url: product.image_url,
            product_category: product.category,
            status: 'active',
            quantity: 1,
            is_approved: true
          })
          .select()
          .single();

        if (error) throw error;

        if (savedProduct) {
          // Use the saved product with real database ID
          onSelectProduct({
            id: savedProduct.id,
            product_name: savedProduct.product_name,
            brand_name: savedProduct.brand_name,
            image_url: savedProduct.image_url,
            category: savedProduct.category,
            ingredients: savedProduct.ingredients,
          });
        }
      } catch (error) {
        console.error('Error saving product:', error);
        // Still pass the product but with temporary ID
        onSelectProduct(product);
      }
    } else {
      // Already has a real database ID
      onSelectProduct({
        id: product.id,
        product_name: product.product_name,
        brand_name: product.brand_name,
        image_url: product.image_url,
        category: product.category,
        ingredients: product.ingredients,
      });
    }

    setSearchQuery('');
    onClose();
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.productItem}
      onPress={() => handleSelectProduct(item)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Package size={24} color={colors.purple} />
        </View>
      )}

      <View style={styles.productInfo}>
        {item.brand_name && (
          <Text style={styles.productBrand}>{item.brand_name}</Text>
        )}
        <Text style={styles.productName}>{item.product_name}</Text>
        {item.category && (
          <Text style={styles.productCategory}>{item.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Product</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.charcoal} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'shelf' && styles.activeTab]}
              onPress={() => setActiveTab('shelf')}
            >
              <Package size={20} color={activeTab === 'shelf' ? colors.white : colors.charcoal} />
              <Text style={[styles.tabText, activeTab === 'shelf' && styles.activeTabText]}>My Shelf</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'global' && styles.activeTab]}
              onPress={() => setActiveTab('global')}
            >
              <Search size={20} color={activeTab === 'global' ? colors.white : colors.charcoal} />
              <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.charcoal} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'shelf' ? "Search your shelf..." : "Search new products..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.charcoal + '60'}
            />
          </View>

          {/* Products List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.purple} />
              <Text style={styles.loadingText}>Loading your products...</Text>
            </View>
          ) : filteredProducts.length === 0 && searchQuery ? (
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.mist} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          ) : searchQuery ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={
                <>
                  {/* Last Used */}
                  {lastUsedProducts.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Clock size={18} color={colors.purple} />
                        <Text style={styles.sectionTitle}>Last Used</Text>
                      </View>
                      {lastUsedProducts.map(product => renderProduct({ item: product }))}
                    </View>
                  )}

                  {/* Favorites */}
                  {favoriteProducts.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Heart size={18} color={colors.red} />
                        <Text style={styles.sectionTitle}>Favorites</Text>
                      </View>
                      {favoriteProducts.map(product => renderProduct({ item: product }))}
                    </View>
                  )}

                  {/* Suggested */}
                  {suggestedProducts.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Sparkles size={18} color={colors.mint} />
                        <Text style={styles.sectionTitle}>
                          {stepType ? `Suggested for ${stepType}` : 'Suggested'}
                        </Text>
                      </View>
                      {suggestedProducts.map(product => renderProduct({ item: product }))}
                    </View>
                  )}

                  {/* All Products */}
                  {products.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Package size={18} color={colors.charcoal} />
                        <Text style={styles.sectionTitle}>All Products</Text>
                      </View>
                      {products.map(product => renderProduct({ item: product }))}
                    </View>
                  )}

                  {products.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Package size={48} color={colors.mist} />
                      <Text style={styles.emptyTitle}>No products yet</Text>
                      <Text style={styles.emptySubtitle}>Scan some products to add them here!</Text>
                    </View>
                  )}
                </>
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: '75%',
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
  },
  closeButton: {
    padding: spacing[2],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.charcoal,
  },
  listContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing[3],
  },
  productBrand: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
    marginBottom: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: colors.purple,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.charcoal,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    gap: spacing[2],
  },
  activeTab: {
    backgroundColor: colors.purple,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  activeTabText: {
    color: colors.white,
  },
});
