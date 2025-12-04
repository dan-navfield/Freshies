import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { X, Star, AlertCircle, ShoppingBag, Share2, MessageSquare, ThumbsUp } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';

const { width } = Dimensions.get('window');

// Mock data - will be replaced with real data from storage/API
const scannedProducts = [
  {
    id: '1',
    name: 'Jusu Body Natural Hair Putty (Medium Hold)',
    brand: 'Jusu Body',
    image: 'https://via.placeholder.com/150',
    rating: 5,
    reviewCount: 3,
    wouldBuyAgain: 100,
    ingredientAlerts: 3,
    scannedDate: '2024-01-15',
    barcode: '1234567890123',
  },
  {
    id: '2',
    name: 'Body Scrub Invigorating Mint',
    brand: 'basd',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
    reviewCount: 3,
    wouldBuyAgain: 100,
    ingredientAlerts: 0,
    scannedDate: '2024-01-14',
    barcode: '9876543210987',
  },
];

export default function ScannedProductsScreen() {
  const handleProductPress = (product: typeof scannedProducts[0]) => {
    router.push({
      pathname: '/product-result',
      params: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: 'Personal Care',
        imageUrl: product.image,
        ingredientsText: '',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <X color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanned Products</Text>
        <View style={styles.placeholder} />
      </View>

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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {scannedProducts.map((product, index) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
          >
            {/* Product Image & Shop Button */}
            <View style={styles.productLeft}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: product.image }} style={styles.productImage} />
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
                    color={i < Math.floor(product.rating) ? colors.yellow : colors.charcoal}
                    fill={i < Math.floor(product.rating) ? colors.yellow : 'none'}
                  />
                ))}
                <Text style={styles.ratingCount}>{product.rating}({product.reviewCount})</Text>
              </View>

              {/* Would Buy Again */}
              <Text style={styles.wouldBuyAgain}>
                :) {product.wouldBuyAgain}% would buy again
              </Text>

              {/* Ingredient Alerts */}
              {product.ingredientAlerts > 0 && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  placeholder: {
    width: 40,
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
