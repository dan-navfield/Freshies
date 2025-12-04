import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Search, Droplets, Shield, AlertCircle, CheckCircle, Sparkles } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { supabase } from '../../../lib/supabase';
import SubPageHeader from '../../../components/SubPageHeader';

interface IngredientInfo {
  id: string;
  name: string;
  match_value: string;
  rule_type: 'avoid' | 'caution' | 'info' | 'ok';
  reason: string;
  recommendation?: string;
  function?: string;
  kid_friendly_description?: string;
  category?: string;
  is_popular?: boolean;
}

type FilterType = 'all' | 'popular' | 'safe' | 'caution';
type CategoryType = 'all' | 'moisturizer' | 'cleanser' | 'sunscreen' | 'treatment' | 'other';

const FEATURED_INGREDIENTS: IngredientInfo[] = [
  {
    id: '1',
    name: 'Hyaluronic Acid',
    match_value: 'hyaluronic acid',
    rule_type: 'ok',
    reason: 'Helps skin hold water',
    kid_friendly_description: 'Like a tiny sponge that keeps your skin hydrated! It can hold 1000x its weight in water. 💧',
    function: 'Hydration',
  },
  {
    id: '2',
    name: 'Niacinamide',
    match_value: 'niacinamide',
    rule_type: 'ok',
    reason: 'Helps with redness and oil control',
    kid_friendly_description: 'A vitamin (B3) that helps calm your skin and keep it balanced. Great for all skin types! ✨',
    function: 'Soothing',
  },
  {
    id: '3',
    name: 'Ceramides',
    match_value: 'ceramide',
    rule_type: 'ok',
    reason: 'Strengthens skin barrier',
    kid_friendly_description: 'Like tiny bricks that build a protective wall for your skin! Keeps moisture in and bad stuff out. 🧱',
    function: 'Protection',
  },
  {
    id: '4',
    name: 'Glycerin',
    match_value: 'glycerin',
    rule_type: 'ok',
    reason: 'Moisturizes and softens skin',
    kid_friendly_description: 'A super gentle moisturizer that attracts water to your skin. Safe for everyone! 💦',
    function: 'Moisturizing',
  },
  {
    id: '5',
    name: 'Zinc Oxide',
    match_value: 'zinc oxide',
    rule_type: 'ok',
    reason: 'Physical sunscreen protection',
    kid_friendly_description: 'Creates a shield on your skin to block harmful sun rays. The white stuff in sunscreen! ☀️',
    function: 'Sun Protection',
  },
  {
    id: '6',
    name: 'Fragrance',
    match_value: 'fragrance',
    rule_type: 'caution',
    reason: 'Can cause irritation or allergies',
    kid_friendly_description: 'Makes products smell nice, but can sometimes irritate sensitive skin. Look for "fragrance-free" if your skin is sensitive! 👃',
    function: 'Scent',
  },
];

/**
 * Ingredient Education Screen
 * Kid-friendly ingredient library
 */
export default function IngredientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allIngredients, setAllIngredients] = useState<IngredientInfo[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<IngredientInfo[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    filterIngredients();
  }, [searchQuery, allIngredients, activeFilter, activeCategory]);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      
      // Mark featured ingredients as popular
      const featuredWithPopular = FEATURED_INGREDIENTS.map(ing => ({
        ...ing,
        is_popular: true,
        category: getCategoryFromFunction(ing.function),
      }));

      // Try to load from database, but don't fail if table doesn't exist
      try {
        const { data, error } = await supabase
          .from('ingredient_rules')
          .select('*')
          .eq('is_active', true)
          .order('match_value');

        if (!error && data && data.length > 0) {
          // Process database ingredients
          const dbIngredients: IngredientInfo[] = data.map(rule => ({
            id: rule.id,
            name: formatIngredientName(rule.match_value),
            match_value: rule.match_value,
            rule_type: rule.rule_type,
            reason: rule.reason,
            recommendation: rule.recommendation,
            category: 'other',
            is_popular: false,
          }));

          // Combine and remove duplicates
          const combined = [...featuredWithPopular, ...dbIngredients];
          const unique = combined.filter((ing, index, self) =>
            index === self.findIndex(t => t.match_value.toLowerCase() === ing.match_value.toLowerCase())
          );

          setAllIngredients(unique);
        } else {
          // No database data, use featured only
          console.log('No ingredient_rules data, using featured ingredients');
          setAllIngredients(featuredWithPopular);
        }
      } catch (dbError) {
        // Database table doesn't exist or other error, use featured only
        console.log('Database error, using featured ingredients:', dbError);
        setAllIngredients(featuredWithPopular);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
      // Final fallback to featured ingredients
      setAllIngredients(FEATURED_INGREDIENTS);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromFunction = (func?: string): CategoryType => {
    if (!func) return 'other';
    const lower = func.toLowerCase();
    if (lower.includes('moistur') || lower.includes('hydrat')) return 'moisturizer';
    if (lower.includes('cleans') || lower.includes('clean')) return 'cleanser';
    if (lower.includes('sun') || lower.includes('spf') || lower.includes('protect')) return 'sunscreen';
    if (lower.includes('treat') || lower.includes('sooth') || lower.includes('repair')) return 'treatment';
    return 'other';
  };

  const formatIngredientName = (matchValue: string): string => {
    return matchValue
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filterIngredients = () => {
    let filtered = [...allIngredients];

    // Apply filter type
    if (activeFilter === 'popular') {
      filtered = filtered.filter(ing => ing.is_popular);
    } else if (activeFilter === 'safe') {
      filtered = filtered.filter(ing => ing.rule_type === 'ok');
    } else if (activeFilter === 'caution') {
      filtered = filtered.filter(ing => ing.rule_type === 'caution' || ing.rule_type === 'avoid');
    }

    // Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(ing => ing.category === activeCategory);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ing: IngredientInfo) =>
        ing.name.toLowerCase().includes(query) ||
        ing.match_value.toLowerCase().includes(query) ||
        ing.reason.toLowerCase().includes(query)
      );
    }

    // Sort: popular first, then alphabetically
    filtered.sort((a, b) => {
      if (a.is_popular && !b.is_popular) return -1;
      if (!a.is_popular && b.is_popular) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredIngredients(filtered);
  };

  const getRuleIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'ok': return CheckCircle;
      case 'info': return Sparkles;
      case 'caution': return AlertCircle;
      case 'avoid': return Shield;
      default: return Droplets;
    }
  };

  const getRuleColor = (ruleType: string) => {
    switch (ruleType) {
      case 'ok': return '#10B981';
      case 'info': return colors.purple;
      case 'caution': return '#F59E0B';
      case 'avoid': return '#EF4444';
      default: return colors.charcoal;
    }
  };

  const getRuleLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'ok': return 'Safe';
      case 'info': return 'Good to Know';
      case 'caution': return 'Be Careful';
      case 'avoid': return 'Avoid';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* SubPage Header with Info Strip */}
      <SubPageHeader
        title="Ingredient Guide"
        infoStripColor={colors.mint}
        infoStripText={`${filteredIngredients.length} ingredients • Learn what's in your products! 🧪`}
        backRoute="/(child)/learn"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.charcoal} style={{ opacity: 0.5 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients..."
            placeholderTextColor={colors.charcoal + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {(['all', 'popular', 'safe', 'caution'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>
                {filter === 'all' && '🌟 All'}
                {filter === 'popular' && '⭐ Popular'}
                {filter === 'safe' && '✅ Safe'}
                {filter === 'caution' && '⚠️ Caution'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
          {(['all', 'moisturizer', 'cleanser', 'sunscreen', 'treatment'] as CategoryType[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryTab, activeCategory === category && styles.categoryTabActive]}
              onPress={() => setActiveCategory(category)}
            >
              <Text style={[styles.categoryTabText, activeCategory === category && styles.categoryTabTextActive]}>
                {category === 'all' && 'All'}
                {category === 'moisturizer' && '💧 Moisturizer'}
                {category === 'cleanser' && '🧼 Cleanser'}
                {category === 'sunscreen' && '☀️ Sunscreen'}
                {category === 'treatment' && '✨ Treatment'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ingredient List */}
        <View style={styles.ingredientsList}>
          {filteredIngredients.map((ingredient) => {
            const Icon = getRuleIcon(ingredient.rule_type);
            const color = getRuleColor(ingredient.rule_type);
            
            return (
              <TouchableOpacity
                key={ingredient.id}
                style={styles.ingredientCard}
                onPress={() => setSelectedIngredient(ingredient)}
              >
                <View style={[styles.ingredientIcon, { backgroundColor: color + '20' }]}>
                  <Icon size={24} color={color} />
                </View>

                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientReason} numberOfLines={1}>
                    {ingredient.reason}
                  </Text>
                  {ingredient.function && (
                    <View style={[styles.functionBadge, { backgroundColor: color + '20' }]}>
                      <Text style={[styles.functionText, { color }]}>
                        {ingredient.function}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.ruleBadge, { backgroundColor: color }]}>
                  <Text style={styles.ruleBadgeText}>{getRuleLabel(ingredient.rule_type)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredIngredients.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={64} color={colors.mist} />
            <Text style={styles.emptyTitle}>No ingredients found</Text>
            <Text style={styles.emptyText}>Try searching for something else!</Text>
          </View>
        )}
      </ScrollView>

      {/* Ingredient Detail Modal */}
      {selectedIngredient && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedIngredient(null)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <View style={[
              styles.modalIcon,
              { backgroundColor: getRuleColor(selectedIngredient.rule_type) }
            ]}>
              {React.createElement(getRuleIcon(selectedIngredient.rule_type), {
                size: 40,
                color: colors.white,
                strokeWidth: 2.5,
              })}
            </View>

            <Text style={styles.modalTitle}>{selectedIngredient.name}</Text>
            
            <View style={[
              styles.modalBadge,
              { backgroundColor: getRuleColor(selectedIngredient.rule_type) }
            ]}>
              <Text style={styles.modalBadgeText}>
                {getRuleLabel(selectedIngredient.rule_type)}
              </Text>
            </View>

            {selectedIngredient.function && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>What it does:</Text>
                <Text style={styles.modalSectionText}>{selectedIngredient.function}</Text>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Why it matters:</Text>
              <Text style={styles.modalSectionText}>{selectedIngredient.reason}</Text>
            </View>

            {selectedIngredient.kid_friendly_description && (
              <View style={[styles.modalSection, styles.funFactSection]}>
                <Text style={styles.funFactTitle}>💡 Fun Fact</Text>
                <Text style={styles.funFactText}>
                  {selectedIngredient.kid_friendly_description}
                </Text>
              </View>
            )}

            {selectedIngredient.recommendation && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Tip:</Text>
                <Text style={styles.modalSectionText}>{selectedIngredient.recommendation}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: getRuleColor(selectedIngredient.rule_type) }
              ]}
              onPress={() => setSelectedIngredient(null)}
            >
              <Text style={styles.modalButtonText}>Got it! ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.cream,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.charcoal,
  },
  filterTabs: {
    marginTop: spacing[3],
  },
  filterTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  filterTabActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  categoryTabs: {
    marginTop: spacing[2],
  },
  categoryTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    marginRight: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  categoryTabActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  categoryTabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    flex: 1,
  },
  ingredientsList: {
    padding: spacing[4],
    gap: spacing[3],
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ingredientIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  ingredientReason: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[2],
  },
  functionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  functionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ruleBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    marginLeft: spacing[2],
  },
  ruleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.charcoal,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
    textAlign: 'center',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.charcoal,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  modalBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    marginBottom: spacing[4],
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalSection: {
    width: '100%',
    marginBottom: spacing[4],
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSectionText: {
    fontSize: 16,
    color: colors.charcoal,
    lineHeight: 24,
  },
  funFactSection: {
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  funFactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[2],
  },
  funFactText: {
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radii.pill,
    width: '100%',
    marginTop: spacing[2],
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
  },
});
