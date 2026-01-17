import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { X, Star, AlertCircle, ShoppingBag, Share2, MessageSquare, ThumbsUp } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { getScannedProducts, ScannedProduct } from '../../../src/services/storage/scannedProducts';
import PageHeader from '../../../src/components/navigation/PageHeader';
import FloatingAIButton from '../../../src/components/FloatingAIButton';

const { width } = Dimensions.get('window');

export default function ScannedProductsScreen() {
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      const products = await getScannedProducts();
      setScannedProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Load products when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  useEffect(() => {
    loadProducts();
  }, []);
  const handleProductPress = (product: ScannedProduct) => {
    router.push({
      pathname: '/product-result',
      params: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category || 'Personal Care',
        imageUrl: product.imageUrl || '',
        ingredientsText: product.ingredientsText || '',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <PageHeader
        title="History"
        subtitle="Your scanned products"
        showAvatar={true}
        showSearch={false}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Viewed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Scanned</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Submitted</Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.mint} />
        }
      >
        {scannedProducts.map((product, index) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
          >
            {/* Product Image & Shop Button */}
            <View style={styles.productLeft}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: product.imageUrl || 'https://via.placeholder.com/150' }} style={styles.productImage} />
                <View style={styles.userSubmittedBadge}>
                  <Text style={styles.badgeText}>User Submitted</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.shopButton}>
                <ShoppingBag color={colors.black} size={18} />
                <Text style={styles.shopButtonText}>Shop</Text>
              </TouchableOpacity>
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              {/* Rating Badge */}
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{index + 3}</Text>
              </View>

              {/* Product Name */}
              <Text style={styles.productName}>{product.name}</Text>

              {/* Star Rating */}
              <View style={styles.ratingRow}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    color={i < Math.floor(product.rating || 0) ? colors.yellow : colors.charcoal}
                    fill={i < Math.floor(product.rating || 0) ? colors.yellow : 'none'}
                  />
                ))}
                <Text style={styles.ratingCount}>{product.rating || 0}({product.reviewCount || 0})</Text>
              </View>

              {/* Would Buy Again */}
              <Text style={styles.wouldBuyAgain}>
                :) {product.wouldBuyAgain || 0}% would buy again
              </Text>

              {/* Ingredient Alerts */}
              {(product.ingredientAlerts || 0) > 0 && (
                <View style={styles.alertBadge}>
                  <AlertCircle color={colors.white} size={14} />
                  <Text style={styles.alertText}>
                    Ingredient Alerts ({product.ingredientAlerts})
                  </Text>
                  <View style={styles.lockIcon}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                </View>
              )}

              {/* Action Icons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton}>
                  <MessageSquare color={colors.charcoal} size={18} />
                  <Text style={styles.actionCount}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <ThumbsUp color={colors.charcoal} size={18} />
                  <Text style={styles.actionCount}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>✏️</Text>
                  <Text style={styles.actionCount}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Share2 color={colors.charcoal} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {scannedProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No scanned products yet</Text>
            <Text style={styles.emptySubtext}>
              Start scanning products to build your history
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating AI Button */}
      <FloatingAIButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: spacing[6],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.mint,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: colors.mint,
  },
  content: {
    flex: 1,
    paddingTop: spacing[4],
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: spacing[4],
  },
  productLeft: {
    alignItems: 'center',
    gap: spacing[3],
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: '#2A2A2A',
  },
  userSubmittedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '600',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  shopButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  productInfo: {
    flex: 1,
    gap: spacing[2],
  },
  ratingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginRight: 40,
    lineHeight: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.white,
    marginLeft: spacing[2],
  },
  wouldBuyAgain: {
    fontSize: 13,
    color: colors.white,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: '#333',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  alertText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  lockIcon: {
    marginLeft: spacing[1],
  },
  lockText: {
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  actionCount: {
    fontSize: 12,
    color: colors.charcoal,
  },
  actionIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.charcoal,
  },
});
