import { View, Text, ScrollView, Pressable, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../../src/theme/tokens';
import { ChevronLeft, Search, Plus, CheckCircle } from 'lucide-react-native';
import { supabase } from '../../../../src/lib/supabase';
import { addProductToRoutine } from '../../../../src/services/routinesService';
import { ChildProduct } from '../../../../src/types/products';

export default function AddProductToRoutineScreen() {
  const router = useRouter();
  const { childId, routineId } = useLocalSearchParams();
  const [products, setProducts] = useState<ChildProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [childId, routineId]);

  async function loadProducts() {
    if (!childId || typeof childId !== 'string') return;
    if (!routineId || typeof routineId !== 'string') return;
    
    setLoading(true);
    try {
      // Get all child's products
      const { data: allProducts, error: productsError } = await supabase
        .from('child_products')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'active')
        .order('product_name', { ascending: true });

      if (productsError) throw productsError;

      // Get products already in this routine
      const { data: routineProducts, error: routineError } = await supabase
        .from('routine_products')
        .select('product_id')
        .eq('routine_id', routineId);

      if (routineError) throw routineError;

      // Filter out products already in routine
      const existingProductIds = new Set(routineProducts?.map(rp => rp.product_id) || []);
      const availableProducts = (allProducts || []).filter(
        p => !existingProductIds.has(p.id)
      );

      setProducts(availableProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
    setLoading(false);
  }

  async function handleAddProduct(product: ChildProduct) {
    if (!routineId || typeof routineId !== 'string') return;

    setAddingProductId(product.id);
    
    // Get current max step order
    const { data: existingProducts } = await supabase
      .from('routine_products')
      .select('step_order')
      .eq('routine_id', routineId)
      .order('step_order', { ascending: false })
      .limit(1);

    const nextStepOrder = (existingProducts?.[0]?.step_order || 0) + 1;

    const success = await addProductToRoutine(
      routineId,
      product.id,
      nextStepOrder
    );

    if (success) {
      // Remove from available list
      setProducts(products.filter(p => p.id !== product.id));
      Alert.alert('Added!', `${product.product_name} added to routine`);
    } else {
      Alert.alert('Error', 'Failed to add product');
    }
    
    setAddingProductId(null);
  }

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Products</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.charcoal} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.charcoal + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsSection}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try a different search term'
                  : 'All approved products are already in this routine'
                }
              </Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
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
                      <Text style={styles.productUsage}>
                        Used {product.usage_count} {product.usage_count === 1 ? 'time' : 'times'}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={[
                      styles.addButton,
                      addingProductId === product.id && styles.addButtonDisabled,
                    ]}
                    onPress={() => handleAddProduct(product)}
                    disabled={addingProductId === product.id}
                  >
                    {addingProductId === product.id ? (
                      <CheckCircle size={20} color={colors.white} />
                    ) : (
                      <Plus size={20} color={colors.white} />
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
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
  scrollView: {
    flex: 1,
  },
  searchSection: {
    padding: spacing[6],
    backgroundColor: colors.cream,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  productsSection: {
    padding: spacing[6],
    gap: spacing[3],
  },
  emptyState: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: 2,
  },
  productUsage: {
    fontSize: 12,
    color: colors.charcoal,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.mint,
  },
});
