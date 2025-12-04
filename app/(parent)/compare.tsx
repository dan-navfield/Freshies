/**
 * Product Comparison Screen
 * Compare multiple products side-by-side
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import ProductComparison from '../../src/components/ProductComparison';
import type { ComparisonProduct } from '../../src/types/comparison';

export default function CompareScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<ComparisonProduct[]>([]);

  // Load comparison products from storage or state
  useEffect(() => {
    // TODO: Load from AsyncStorage or global state
    // For now, using mock data
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock comparison data
    const mockProducts: ComparisonProduct[] = [
      {
        barcode: '123456',
        name: 'Blemish Control Cleanser',
        brand: 'CeraVe',
        category: 'Cleanser',
        rating: 'GENTLE',
        riskScore: 15,
        totalIngredients: 20,
        concernCounts: { low: 7, mild: 13, medium: 0, high: 0 },
        averageRating: 5.0,
        totalReviews: 1,
        hasFragrance: false,
        hasParabens: false,
        hasSulfates: true,
      },
    ];
    setProducts(mockProducts);
  };

  const handleRemoveProduct = (barcode: string) => {
    Alert.alert(
      'Remove Product',
      'Remove this product from comparison?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setProducts(prev => prev.filter(p => p.barcode !== barcode));
          },
        },
      ]
    );
  };

  const handleAddProduct = () => {
    Alert.alert(
      'Add Product',
      'Scan a product or search to add it to comparison',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Scan Product', onPress: () => router.push('/(tabs)/scan') },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Products</Text>
        <TouchableOpacity onPress={handleAddProduct} style={styles.addButton}>
          <Plus size={24} color={colors.purple} />
        </TouchableOpacity>
      </View>

      {/* Comparison View */}
      <View style={styles.content}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products to compare</Text>
            <Text style={styles.emptyText}>
              Add products from the scan screen or your library to compare them side-by-side
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
              <Text style={styles.emptyButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoBar}>
              <Text style={styles.infoText}>
                Comparing {products.length} {products.length === 1 ? 'product' : 'products'}
              </Text>
              {products.length < 4 && (
                <TouchableOpacity onPress={handleAddProduct}>
                  <Text style={styles.addMoreText}>+ Add more</Text>
                </TouchableOpacity>
              )}
            </View>
            <ProductComparison products={products} onRemoveProduct={handleRemoveProduct} />
          </>
        )}
      </View>

      {/* Tips */}
      {products.length > 0 && (
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Comparison Tips</Text>
          <Text style={styles.tipsText}>
            • Lower risk scores are better{'\n'}
            • Check concern counts for red flags{'\n'}
            • Consider reviews from other parents{'\n'}
            • Look for fragrance-free options for sensitive skin
          </Text>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  backButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  addButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
    padding: spacing[5],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 15,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  emptyButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  tips: {
    backgroundColor: colors.white,
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.cream,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  tipsText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 20,
  },
});
