import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Package, ShieldCheck, AlertTriangle, ShieldAlert, Heart, Check } from 'lucide-react-native';
import PageHeader from '../../../src/components/navigation/PageHeader';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { getPopularProducts, searchProducts, getProductsByFilter, ProductDetail } from '../../../src/services/productsService';
import { getWishlistItems } from '../../../src/services/wishlistService';
import { shelfService } from '../../../src/services/shelfService';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing[4] * 3) / 2;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'safe', label: 'Safe for me' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'cleanser', label: 'Face Wash' },
  { id: 'lip', label: 'Lip Care' },
  { id: 'moisturizer', label: 'Moisturizer' },
];

export default function ProductsHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { childProfile } = useChildProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [wishlistedBarcodes, setWishlistedBarcodes] = useState<Set<string>>(new Set());
  const [shelfBarcodes, setShelfBarcodes] = useState<Set<string>>(new Set());

  // Reload user collections when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserCollections();
    }, [user?.id, childProfile?.id])
  );

  useEffect(() => {
    loadInitialData();
    loadUserCollections();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      if (activeFilter === 'all') {
        loadInitialData();
      } else {
        handleFilterChange(activeFilter);
      }
    }
  }, [searchQuery, activeFilter]);

  const loadUserCollections = async () => {
    if (!user?.id) return;
    const profileId = childProfile?.id || user.id;

    try {
      // Load wishlist items
      const wishlistItems = await getWishlistItems(profileId);
      const wishlistSet = new Set<string>();
      wishlistItems.forEach(item => {
        if (item.product_barcode) wishlistSet.add(item.product_barcode);
      });
      setWishlistedBarcodes(wishlistSet);

      // Load shelf items
      const shelfItems = await shelfService.getShelfItems(user.id, childProfile?.id);
      const shelfSet = new Set<string>();
      shelfItems.forEach(item => {
        // Note: shelf items don't have barcode field, use product_name as fallback identifier
        if (item.product_name) shelfSet.add(item.product_name);
      });
      setShelfBarcodes(shelfSet);
    } catch (error) {
      console.error('Error loading user collections:', error);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const data = await getPopularProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filterId: string) => {
    setActiveFilter(filterId);
    setLoading(true);
    try {
      if (filterId === 'all') {
        const data = await getPopularProducts();
        setProducts(data);
      } else {
        const data = await getProductsByFilter(filterId);
        setProducts(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 1) {
      const results = await searchProducts(text);
      setProducts(results);
    } else if (text.length === 0) {
      // If search query is cleared, revert to current filter or popular products
      if (activeFilter === 'all') {
        loadInitialData();
      } else {
        handleFilterChange(activeFilter);
      }
    }
  };

  const renderProduct = ({ item }: { item: ProductDetail }) => {
    let borderColor = 'transparent';
    let tierColor = colors.mint;

    // Tier Colors
    if (['D', 'E'].includes(item.safetyTier)) tierColor = colors.red;
    else if (item.safetyTier === 'C') tierColor = colors.yellow;

    // Check if product is wishlisted or on shelf
    const isWishlisted = item.barcode ? wishlistedBarcodes.has(item.barcode) : false;
    const isOnShelf = shelfBarcodes.has(item.name);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(child)/products/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Package size={32} color={colors.purple} />
            </View>
          )}

          {/* Status Indicators Row - Top Left */}
          <View style={styles.statusIndicators}>
            {isWishlisted && (
              <View style={[styles.statusBadge, styles.wishlistBadge]}>
                <Heart size={12} color="#fff" fill="#fff" />
              </View>
            )}
            {isOnShelf && (
              <View style={[styles.statusBadge, styles.shelfBadge]}>
                <Check size={12} color="#fff" strokeWidth={3} />
              </View>
            )}
          </View>

          {/* Safety Tier Badge - Top Right */}
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.tierText}>{item.safetyTier}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.brandName} numberOfLines={1}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Safety Score:</Text>
            <Text style={[styles.scoreValue, { color: tierColor }]}>{item.safetyScore}/100</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Products"
        subtitle="Discover safe skincare"
        showSearch={true}
        searchPlaceholder="Foundations, Sunscreens..."
        showAvatar={true}
        showBackButton={true}
        onBackPress={() => router.back()}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
      />

      <View style={styles.content}>
        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  activeFilter === filter.id && styles.activeFilterChip
                ]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.activeFilterText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              !searchQuery ? (
                <Text style={styles.sectionTitle}>Popular Products</Text>
              ) : (
                <Text style={styles.sectionTitle}>Results for "{searchQuery}"</Text>
              )
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing[3],
    marginLeft: 4,
  },
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  tierBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tierText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  cardContent: {
    padding: spacing[3],
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing[2],
    height: 40,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  filtersWrapper: {
    height: 50,
    marginBottom: spacing[2],
  },
  filtersContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterChip: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  statusIndicators: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistBadge: {
    backgroundColor: colors.purple,
  },
  shelfBadge: {
    backgroundColor: colors.mint,
  },
});
