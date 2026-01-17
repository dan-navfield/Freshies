/**
 * Product Comparison Component
 * Side-by-side comparison of multiple products
 */

import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Star, AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import type { ComparisonProduct } from '../../types/comparison';

interface ProductComparisonProps {
  products: ComparisonProduct[];
  onRemoveProduct?: (barcode: string) => void;
}

export default function ProductComparison({ products, onRemoveProduct }: ProductComparisonProps) {
  if (products.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Add products to compare</Text>
      </View>
    );
  }

  const getSafetyColor = (rating: string) => {
    switch (rating) {
      case 'SUPER_GENTLE': return colors.mint;
      case 'GENTLE': return colors.mint;
      case 'MOSTLY_SAFE': return '#10B981';
      case 'CAUTION': return '#F59E0B';
      case 'AVOID': return colors.red;
      default: return colors.charcoal;
    }
  };

  const getSafetyLabel = (rating: string) => {
    switch (rating) {
      case 'SUPER_GENTLE': return 'Super Gentle';
      case 'GENTLE': return 'Gentle';
      case 'MOSTLY_SAFE': return 'Mostly Safe';
      case 'CAUTION': return 'Caution';
      case 'AVOID': return 'Avoid';
      default: return 'Unknown';
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {products.map((product, index) => (
        <View key={product.barcode} style={[styles.productCard, index > 0 && styles.productCardSpaced]}>
          {/* Remove Button */}
          {onRemoveProduct && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => onRemoveProduct(product.barcode)}
            >
              <X size={16} color={colors.white} />
            </TouchableOpacity>
          )}

          {/* Product Image */}
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          </View>

          {/* Safety Rating */}
          <View style={[styles.safetyBadge, { backgroundColor: getSafetyColor(product.rating) + '20' }]}>
            <Text style={[styles.safetyText, { color: getSafetyColor(product.rating) }]}>
              {getSafetyLabel(product.rating)}
            </Text>
            <Text style={[styles.riskScore, { color: getSafetyColor(product.rating) }]}>
              {product.riskScore}/100
            </Text>
          </View>

          {/* Comparison Metrics */}
          <View style={styles.metrics}>
            {/* Ingredients */}
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Ingredients</Text>
              <Text style={styles.metricValue}>{product.totalIngredients}</Text>
            </View>

            {/* Concerns */}
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Concerns</Text>
              <View style={styles.concernBadges}>
                {product.concernCounts.high > 0 && (
                  <View style={[styles.concernBadge, { backgroundColor: colors.red + '20' }]}>
                    <Text style={[styles.concernText, { color: colors.red }]}>
                      {product.concernCounts.high} high
                    </Text>
                  </View>
                )}
                {product.concernCounts.medium > 0 && (
                  <View style={[styles.concernBadge, { backgroundColor: '#F59E0B20' }]}>
                    <Text style={[styles.concernText, { color: '#F59E0B' }]}>
                      {product.concernCounts.medium} med
                    </Text>
                  </View>
                )}
                {product.concernCounts.high === 0 && product.concernCounts.medium === 0 && (
                  <View style={[styles.concernBadge, { backgroundColor: colors.mint + '20' }]}>
                    <Text style={[styles.concernText, { color: colors.mint }]}>
                      None
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Reviews */}
            {product.totalReviews > 0 && (
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Rating</Text>
                <View style={styles.ratingRow}>
                  <Star size={14} color={colors.purple} fill={colors.purple} />
                  <Text style={styles.ratingText}>
                    {product.averageRating?.toFixed(1)} ({product.totalReviews})
                  </Text>
                </View>
              </View>
            )}

            {/* Key Flags */}
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Contains</Text>
              <View style={styles.flagsList}>
                {product.hasFragrance && (
                  <View style={styles.flagItem}>
                    <AlertCircle size={12} color={colors.charcoal} />
                    <Text style={styles.flagText}>Fragrance</Text>
                  </View>
                )}
                {product.hasParabens && (
                  <View style={styles.flagItem}>
                    <AlertCircle size={12} color={colors.charcoal} />
                    <Text style={styles.flagText}>Parabens</Text>
                  </View>
                )}
                {product.hasSulfates && (
                  <View style={styles.flagItem}>
                    <AlertCircle size={12} color={colors.charcoal} />
                    <Text style={styles.flagText}>Sulfates</Text>
                  </View>
                )}
                {!product.hasFragrance && !product.hasParabens && !product.hasSulfates && (
                  <View style={styles.flagItem}>
                    <CheckCircle size={12} color={colors.mint} />
                    <Text style={[styles.flagText, { color: colors.mint }]}>Clean</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.charcoal,
    opacity: 0.6,
  },
  productCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.cream,
  },
  productCardSpaced: {
    marginLeft: spacing[3],
  },
  removeButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.red,
    borderRadius: radii.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    marginBottom: spacing[3],
  },
  placeholderImage: {
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.5,
  },
  productInfo: {
    marginBottom: spacing[3],
  },
  productBrand: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[1],
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    lineHeight: 20,
  },
  safetyBadge: {
    padding: spacing[3],
    borderRadius: radii.md,
    marginBottom: spacing[3],
    alignItems: 'center',
  },
  safetyText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  metrics: {
    gap: spacing[3],
  },
  metric: {
    borderTopWidth: 1,
    borderTopColor: colors.cream,
    paddingTop: spacing[3],
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  concernBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  concernBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  concernText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  flagsList: {
    gap: spacing[1],
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  flagText: {
    fontSize: 12,
    color: colors.charcoal,
  },
});
