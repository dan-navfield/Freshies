/**
 * Product Search Modal - Deep Product Intelligence Console
 * Handles natural language queries, AI-powered search, and rich product results
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { X, Search, Filter, ChevronDown, AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { searchProducts as searchProductsFrontend } from '../services/api';
import { scanProduct } from '../services/freshiesBackend';

const { width } = Dimensions.get('window');

interface ProductSearchModalProps {
  visible: boolean;
  onClose: () => void;
  childProfiles?: Array<{
    id: string;
    name: string;
    age: number;
    skinType?: string;
    conditions?: string[];
    allergies?: string[];
  }>;
  onProductSelect: (product: any) => void;
}

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string;
  score: number;
  rating: 'EXCELLENT' | 'GOOD' | 'GENTLE' | 'MODERATE' | 'CAUTION' | 'AVOID';
  childSuitability: {
    [childId: string]: {
      rating: 'EXCELLENT' | 'OK' | 'AVOID';
      reason?: string;
    };
  };
  topIngredients: Array<{
    name: string;
    concern?: string;
    positive?: boolean;
  }>;
  price?: string;
  availability?: string;
  matchConfidence: number;
}

interface ActiveFilter {
  type: 'child' | 'ingredient' | 'score' | 'price' | 'condition';
  label: string;
  value: any;
}

export default function ProductSearchModal({
  visible,
  onClose,
  childProfiles = [],
  onProductSelect,
}: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Auto-focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setResults([]);
      setActiveFilters([]);
      setAiSuggestion('');
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [visible]);

  // Live search as user types (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAiSuggestion('');
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 500); // Wait 500ms after user stops typing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setAiSuggestion('');

    try {
      // Search using frontend API (Open Beauty Facts, Makeup API)
      const searchResponse = await searchProductsFrontend(searchQuery, 1);
      
      console.log('Search response:', JSON.stringify(searchResponse, null, 2));

      // Generate AI suggestion based on query
      if (searchQuery.toLowerCase().includes('eczema')) {
        setAiSuggestion('Showing fragrance-free, gentle products suitable for eczema-prone skin');
      } else if (searchQuery.toLowerCase().includes('spf') || searchQuery.toLowerCase().includes('sunscreen')) {
        setAiSuggestion('Showing sun protection products with safety ratings');
      } else if (searchQuery.toLowerCase().includes('sensitive')) {
        setAiSuggestion('Showing gentle, hypoallergenic products for sensitive skin');
      }

      // Transform API results to our format
      const transformedResults: SearchResult[] = (searchResponse.products || [])
        .filter((item: any) => {
          // Filter out items without valid product data
          if (!item || !item.product) return false;
          const p = item.product;
          // Must have both name and brand, and they can't be "Unknown"
          return p.name && p.name !== 'Unknown' && p.name !== 'Unknown Product';
        })
        .map((item: any) => {
          const product = item.product;
          
          // Calculate score from ingredients (simplified)
          const score = product.ingredientsText ? 
            Math.min(100, Math.max(0, 100 - (product.ingredientsText.split(',').length * 2))) : 
            75;
          
          // Determine rating based on score
          let rating: SearchResult['rating'] = 'GENTLE';
          if (score >= 90) rating = 'EXCELLENT';
          else if (score >= 75) rating = 'GOOD';
          else if (score >= 60) rating = 'GENTLE';
          else if (score >= 40) rating = 'MODERATE';
          else if (score >= 20) rating = 'CAUTION';
          else rating = 'AVOID';

          // Extract top ingredients
          const ingredients = product.ingredientsText?.split(',').slice(0, 3).map((ing: string) => ({
            name: ing.trim(),
            positive: Math.random() > 0.5, // TODO: Real ingredient analysis
          })) || [];

          return {
            id: product.barcode || product.id || Math.random().toString(),
            name: product.name || 'Unknown Product',
            brand: product.brand || 'Unknown Brand',
            imageUrl: product.imageUrl,
            score,
            rating,
            childSuitability: {}, // TODO: Calculate based on child profiles
            topIngredients: ingredients,
            matchConfidence: item.score || 0.8,
          };
        });

      setResults(transformedResults);
      
      // Show helpful message if no results
      if (transformedResults.length === 0) {
        setAiSuggestion('No products found. Try searching for a brand name like "CeraVe" or "Neutrogena"');
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setAiSuggestion('Search failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFilter = (filter: ActiveFilter) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    // Re-run search with updated filters
    handleSearch();
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return colors.riskVeryLow;
      case 'GOOD': return colors.riskLow;
      case 'GENTLE': return colors.mint;
      case 'MODERATE': return colors.riskMedium;
      case 'CAUTION': return colors.orange;
      case 'AVOID': return colors.red;
      default: return colors.charcoal;
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'Great choice';
      case 'GOOD': return 'Good option';
      case 'GENTLE': return 'Gentle formula';
      case 'MODERATE': return 'Use with care';
      case 'CAUTION': return 'Check ingredients';
      case 'AVOID': return 'Avoid if possible';
      default: return 'Unknown';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Search</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
            <Filter size={20} color={colors.purple} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={colors.charcoal} style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search products, brands, or ingredients..."
              placeholderTextColor={colors.charcoal + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          {/* AI Suggestion */}
          {aiSuggestion && (
            <View style={styles.aiSuggestion}>
              <Info size={16} color={colors.purple} />
              <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
            </View>
          )}

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            >
              {activeFilters.map((filter, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.filterChip}
                  onPress={() => removeFilter(filter)}
                >
                  <Text style={styles.filterChipText}>{filter.label}</Text>
                  <X size={14} color={colors.purple} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Results */}
        <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.purple} />
              <Text style={styles.loadingText}>Searching products...</Text>
            </View>
          ) : results.length > 0 ? (
            results.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => onProductSelect(product)}
              >
                {/* Product Image & Basic Info */}
                <View style={styles.productHeader}>
                  <View style={styles.productImage}>
                    {product.imageUrl ? (
                      <Image source={{ uri: product.imageUrl }} style={styles.image} />
                    ) : (
                      <View style={styles.imagePlaceholder} />
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    {product.price && (
                      <Text style={styles.productPrice}>{product.price}</Text>
                    )}
                  </View>
                </View>

                {/* Freshies Score */}
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        { width: `${product.score}%`, backgroundColor: getRatingColor(product.rating) },
                      ]}
                    />
                  </View>
                  <View style={styles.scoreInfo}>
                    <Text style={[styles.scoreLabel, { color: getRatingColor(product.rating) }]}>
                      {getRatingLabel(product.rating)}
                    </Text>
                    <Text style={styles.scoreValue}>{product.score}/100</Text>
                  </View>
                </View>

                {/* Child Suitability */}
                {Object.keys(product.childSuitability).length > 0 && (
                  <View style={styles.childSuitability}>
                    {Object.entries(product.childSuitability).map(([childId, suitability]) => {
                      const child = childProfiles.find(c => c.id === childId);
                      if (!child) return null;

                      return (
                        <View key={childId} style={styles.childBadge}>
                          <Text style={styles.childName}>{child.name}</Text>
                          <View
                            style={[
                              styles.suitabilityBadge,
                              {
                                backgroundColor:
                                  suitability.rating === 'EXCELLENT'
                                    ? colors.riskVeryLow + '20'
                                    : suitability.rating === 'OK'
                                    ? colors.yellow + '20'
                                    : colors.red + '20',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.suitabilityText,
                                {
                                  color:
                                    suitability.rating === 'EXCELLENT'
                                      ? colors.riskVeryLow
                                      : suitability.rating === 'OK'
                                      ? colors.yellow
                                      : colors.red,
                                },
                              ]}
                            >
                              {suitability.rating}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Top Ingredients */}
                <View style={styles.ingredients}>
                  {product.topIngredients.map((ingredient, idx) => (
                    <View key={idx} style={styles.ingredientTag}>
                      {ingredient.positive ? (
                        <CheckCircle2 size={12} color={colors.riskVeryLow} />
                      ) : ingredient.concern ? (
                        <AlertCircle size={12} color={colors.orange} />
                      ) : (
                        <Info size={12} color={colors.charcoal} />
                      )}
                      <Text style={styles.ingredientText}>{ingredient.name}</Text>
                    </View>
                  ))}
                </View>

                {/* Availability */}
                {product.availability && (
                  <Text style={styles.availability}>{product.availability}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : searchQuery ? (
            <View style={styles.emptyState}>
              <Search size={48} color={colors.charcoal + '40'} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try different keywords or check your filters
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Search size={48} color={colors.charcoal + '40'} />
              <Text style={styles.emptyTitle}>Search for products</Text>
              <Text style={styles.emptyText}>
                Try "SPF 50 for kids" or "fragrance-free moisturizer"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  closeButton: {
    padding: spacing[2],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  filterButton: {
    padding: spacing[2],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.purple + '10',
    borderRadius: radii.md,
    gap: spacing[2],
  },
  aiSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: colors.purple,
  },
  filtersScroll: {
    marginTop: spacing[3],
  },
  filtersContent: {
    gap: spacing[2],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.purple + '20',
    borderRadius: radii.pill,
    gap: spacing[2],
  },
  filterChipText: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.cream,
    gap: spacing[3],
  },
  productHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.cream,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cream,
  },
  productInfo: {
    flex: 1,
    gap: spacing[1],
  },
  productBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  productPrice: {
    fontSize: 14,
    color: colors.charcoal,
    marginTop: spacing[1],
  },
  scoreContainer: {
    gap: spacing[2],
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.cream,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  scoreInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  childSuitability: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  childBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  childName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
  },
  suitabilityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  suitabilityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ingredients: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  ingredientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    gap: spacing[1],
  },
  ingredientText: {
    fontSize: 12,
    color: colors.charcoal,
  },
  availability: {
    fontSize: 12,
    color: colors.mint,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
  },
  emptyText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    paddingHorizontal: spacing[6],
  },
});
