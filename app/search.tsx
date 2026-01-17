/**
 * Enhanced Search Screen
 * Search products with advanced filters
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X, ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radii } from '../src/theme/tokens';
import ProductFilters from '../src/components/product/ProductFilters';
import type { ProductFilters as FilterType } from '../src/types/filters';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const activeFilterCount = Object.keys(filters).length;

  const handleSearch = () => {
    // TODO: Implement actual search with filters
    console.log('Searching:', searchQuery, 'with filters:', filters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.charcoal} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.charcoal + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color={colors.charcoal} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity 
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={20} color={activeFilterCount > 0 ? colors.purple : colors.charcoal} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersLabel}>Active filters:</Text>
          <View style={styles.filterChips}>
            {filters.excludeFragrance && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Fragrance-Free</Text>
              </View>
            )}
            {filters.excludeParabens && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Paraben-Free</Text>
              </View>
            )}
            {filters.excludeSulfates && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>Sulfate-Free</Text>
              </View>
            )}
            {filters.safetyRatings && filters.safetyRatings.length > 0 && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {filters.safetyRatings.length} safety rating{filters.safetyRatings.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {filters.categories && filters.categories.length > 0 && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {filters.categories.length} categor{filters.categories.length > 1 ? 'ies' : 'y'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Results */}
      <View style={styles.content}>
        {results.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color={colors.charcoal + '40'} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'Search for products'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Enter a product name, brand, or ingredient'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultBrand}>{item.brand}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
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
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  backButton: {
    padding: spacing[2],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
    paddingVertical: spacing[3],
  },
  clearButton: {
    padding: spacing[2],
  },
  filterButton: {
    padding: spacing[3],
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: colors.purple + '20',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.purple,
    borderRadius: radii.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  activeFilters: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  activeFiltersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: colors.purple + '15',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.purple + '40',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  content: {
    flex: 1,
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
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 15,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 22,
  },
  resultItem: {
    backgroundColor: colors.white,
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[1],
  },
  resultBrand: {
    fontSize: 14,
    color: colors.charcoal,
  },
});
