/**
 * Product Filters Component
 * Advanced filtering UI for product search
 */

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import type { ProductFilters, FilterGroup } from '../types/filters';
import { useState } from 'react';

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClose?: () => void;
}

export default function ProductFilters({ filters, onFiltersChange, onClose }: ProductFiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['safety', 'ingredients']));

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filterGroups: FilterGroup[] = [
    {
      id: 'safety',
      label: 'Safety Rating',
      type: 'checkbox',
      options: [
        { id: 'SUPER_GENTLE', label: 'Super Gentle', value: 'SUPER_GENTLE' },
        { id: 'GENTLE', label: 'Gentle', value: 'GENTLE' },
        { id: 'MOSTLY_SAFE', label: 'Mostly Safe', value: 'MOSTLY_SAFE' },
        { id: 'CAUTION', label: 'Caution', value: 'CAUTION' },
      ],
    },
    {
      id: 'ingredients',
      label: 'Exclude Ingredients',
      type: 'toggle',
      options: [
        { id: 'fragrance', label: 'Fragrance-Free', value: 'excludeFragrance' },
        { id: 'parabens', label: 'Paraben-Free', value: 'excludeParabens' },
        { id: 'sulfates', label: 'Sulfate-Free', value: 'excludeSulfates' },
        { id: 'alcohol', label: 'Alcohol-Free', value: 'excludeAlcohol' },
      ],
    },
    {
      id: 'category',
      label: 'Product Type',
      type: 'checkbox',
      options: [
        { id: 'cleanser', label: 'Cleanser', value: 'cleanser' },
        { id: 'moisturizer', label: 'Moisturizer', value: 'moisturizer' },
        { id: 'sunscreen', label: 'Sunscreen', value: 'sunscreen' },
        { id: 'shampoo', label: 'Shampoo', value: 'shampoo' },
        { id: 'body_wash', label: 'Body Wash', value: 'body_wash' },
      ],
    },
    {
      id: 'skinType',
      label: 'Skin Type',
      type: 'checkbox',
      options: [
        { id: 'normal', label: 'Normal', value: 'normal' },
        { id: 'dry', label: 'Dry', value: 'dry' },
        { id: 'oily', label: 'Oily', value: 'oily' },
        { id: 'sensitive', label: 'Sensitive', value: 'sensitive' },
        { id: 'combination', label: 'Combination', value: 'combination' },
      ],
    },
    {
      id: 'certifications',
      label: 'Certifications',
      type: 'toggle',
      options: [
        { id: 'vegan', label: 'Vegan', value: 'veganOnly' },
        { id: 'crueltyFree', label: 'Cruelty-Free', value: 'crueltyFreeOnly' },
        { id: 'organic', label: 'Organic', value: 'organicOnly' },
      ],
    },
  ];

  const handleSafetyRatingToggle = (rating: string) => {
    const current = filters.safetyRatings || [];
    const newRatings = current.includes(rating as any)
      ? current.filter(r => r !== rating)
      : [...current, rating as any];
    onFiltersChange({ ...filters, safetyRatings: newRatings });
  };

  const handleCategoryToggle = (category: string) => {
    const current = filters.categories || [];
    const newCategories = current.includes(category as any)
      ? current.filter(c => c !== category)
      : [...current, category as any];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleSkinTypeToggle = (skinType: string) => {
    const current = filters.skinTypes || [];
    const newSkinTypes = current.includes(skinType as any)
      ? current.filter(s => s !== skinType)
      : [...current, skinType as any];
    onFiltersChange({ ...filters, skinTypes: newSkinTypes });
  };

  const handleToggleFilter = (key: keyof ProductFilters) => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Filters</Text>
          {activeFilterCount > 0 && (
            <Text style={styles.headerSubtitle}>{activeFilterCount} active</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.charcoal} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Groups */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filterGroups.map(group => {
          const isExpanded = expandedGroups.has(group.id);

          return (
            <View key={group.id} style={styles.filterGroup}>
              <TouchableOpacity
                style={styles.filterGroupHeader}
                onPress={() => toggleGroup(group.id)}
              >
                <Text style={styles.filterGroupTitle}>{group.label}</Text>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.charcoal} />
                ) : (
                  <ChevronDown size={20} color={colors.charcoal} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.filterGroupContent}>
                  {group.type === 'toggle' ? (
                    // Toggle switches
                    group.options.map(option => (
                      <View key={option.id} style={styles.toggleOption}>
                        <Text style={styles.toggleLabel}>{option.label}</Text>
                        <Switch
                          value={!!filters[option.value as keyof ProductFilters]}
                          onValueChange={() => handleToggleFilter(option.value as keyof ProductFilters)}
                          trackColor={{ false: colors.cream, true: colors.purple + '60' }}
                          thumbColor={filters[option.value as keyof ProductFilters] ? colors.purple : colors.white}
                        />
                      </View>
                    ))
                  ) : (
                    // Checkboxes
                    group.options.map(option => {
                      let isSelected = false;
                      if (group.id === 'safety') {
                        isSelected = (filters.safetyRatings || []).includes(option.value);
                      } else if (group.id === 'category') {
                        isSelected = (filters.categories || []).includes(option.value);
                      } else if (group.id === 'skinType') {
                        isSelected = (filters.skinTypes || []).includes(option.value);
                      }

                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[styles.checkboxOption, isSelected && styles.checkboxOptionSelected]}
                          onPress={() => {
                            if (group.id === 'safety') handleSafetyRatingToggle(option.value);
                            else if (group.id === 'category') handleCategoryToggle(option.value);
                            else if (group.id === 'skinType') handleSkinTypeToggle(option.value);
                          }}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.purple,
    marginTop: spacing[1],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  clearButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
  },
  filterGroup: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  filterGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  filterGroupContent: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.charcoal,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cream,
  },
  checkboxOptionSelected: {
    backgroundColor: colors.purple + '10',
    borderColor: colors.purple,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.charcoal + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  checkboxSelected: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.charcoal,
  },
  checkboxLabelSelected: {
    color: colors.purple,
    fontWeight: '600',
  },
});
