import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, Plus, Trash2, GripVertical, Search, X,
  Droplets, Sparkles, Sun, Shield, Droplet
} from 'lucide-react-native';
import { colors } from '../../src/theme/tokens';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { routineBuilderStyles as styles } from './routine-builder-styles';

type Segment = 'morning' | 'afternoon' | 'evening';
type StepType = 'cleanser' | 'moisturiser' | 'sunscreen' | 'treatment' | 'toner';

interface RoutineStep {
  id?: string;
  step_order: number;
  step_type: StepType;
  title: string;
  notes: string;
  product_id?: string;
  product_name?: string;
  product_brand?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
}

const STEP_TYPE_ICONS: Record<StepType, any> = {
  cleanser: Droplets,
  moisturiser: Sparkles,
  sunscreen: Sun,
  treatment: Shield,
  toner: Droplet,
};

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const segment = (params.segment as Segment) || 'morning';
  const routineId = params.routineId as string;
  
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    loadRoutineSteps();
  }, []);

  const loadRoutineSteps = async () => {
    try {
      if (!routineId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('routine_steps')
        .select(`
          id,
          step_order,
          step_type,
          title,
          notes,
          product_id,
          scraped_products:product_id (
            name,
            brand
          )
        `)
        .eq('routine_id', routineId)
        .eq('segment', segment)
        .eq('is_active', true)
        .order('step_order');

      if (error) throw error;

      const formattedSteps = data.map((step: any) => ({
        id: step.id,
        step_order: step.step_order,
        step_type: step.step_type,
        title: step.title,
        notes: step.notes || '',
        product_id: step.product_id,
        product_name: step.scraped_products?.name,
        product_brand: step.scraped_products?.brand,
      }));

      setSteps(formattedSteps);
    } catch (error) {
      console.error('Error loading routine steps:', error);
      Alert.alert('Error', 'Failed to load routine steps');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scraped_products')
        .select('id, name, brand, category, image_url')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addStep = () => {
    const newStep: RoutineStep = {
      step_order: steps.length + 1,
      step_type: 'cleanser',
      title: '',
      notes: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder remaining steps
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof RoutineStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const selectProduct = (product: Product) => {
    if (selectedStepIndex !== null) {
      updateStep(selectedStepIndex, 'product_id', product.id);
      updateStep(selectedStepIndex, 'product_name', product.name);
      updateStep(selectedStepIndex, 'product_brand', product.brand);
      updateStep(selectedStepIndex, 'title', `${product.brand} ${product.name}`);
    }
    setShowProductSearch(false);
    setSelectedStepIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const saveRoutine = async () => {
    if (!routineId) {
      Alert.alert('Error', 'No routine ID provided');
      return;
    }

    setSaving(true);
    try {
      // Delete existing steps for this segment
      await supabase
        .from('routine_steps')
        .delete()
        .eq('routine_id', routineId)
        .eq('segment', segment);

      // Insert new steps
      const stepsToInsert = steps.map((step) => ({
        routine_id: routineId,
        segment,
        step_order: step.step_order,
        step_type: step.step_type,
        title: step.title,
        notes: step.notes,
        product_id: step.product_id,
        parent_approved: false,
        is_active: true,
      }));

      const { error } = await supabase
        .from('routine_steps')
        .insert(stepsToInsert);

      if (error) throw error;

      Alert.alert('Success', 'Routine saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  const getStepIcon = (type: StepType) => {
    const Icon = STEP_TYPE_ICONS[type];
    return Icon;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Edit {segment.charAt(0).toUpperCase() + segment.slice(1)} Routine
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveRoutine}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Steps List */}
        {steps.map((step, index) => {
          const Icon = getStepIcon(step.step_type);
          return (
            <View key={index} style={styles.stepCard}>
              {/* Drag Handle */}
              <View style={styles.dragHandle}>
                <GripVertical size={20} color={colors.charcoal} />
              </View>

              <View style={styles.stepContent}>
                {/* Step Type Selector */}
                <View style={styles.stepTypeRow}>
                  <View style={styles.stepIconContainer}>
                    <Icon size={20} color={colors.purple} />
                  </View>
                  <View style={styles.stepTypeButtons}>
                    {(['cleanser', 'moisturiser', 'sunscreen', 'treatment', 'toner'] as StepType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.stepTypeButton,
                          step.step_type === type && styles.stepTypeButtonActive
                        ]}
                        onPress={() => updateStep(index, 'step_type', type)}
                      >
                        <Text style={[
                          styles.stepTypeButtonText,
                          step.step_type === type && styles.stepTypeButtonTextActive
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Product Selection */}
                <TouchableOpacity
                  style={styles.productSelector}
                  onPress={() => {
                    setSelectedStepIndex(index);
                    setShowProductSearch(true);
                  }}
                >
                  {step.product_name ? (
                    <View>
                      <Text style={styles.productBrand}>{step.product_brand}</Text>
                      <Text style={styles.productName}>{step.product_name}</Text>
                    </View>
                  ) : (
                    <View style={styles.productPlaceholder}>
                      <Plus size={20} color={colors.purple} />
                      <Text style={styles.productPlaceholderText}>Select Product</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Title Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Step Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Gentle Face Wash"
                    value={step.title}
                    onChangeText={(text) => updateStep(index, 'title', text)}
                  />
                </View>

                {/* Notes Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Instructions (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="Add helpful tips like 'Use warm water' or 'Focus on T-zone'..."
                    value={step.notes}
                    onChangeText={(text) => updateStep(index, 'notes', text)}
                    multiline
                  />
                </View>

              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeStep(index)}
              >
                <Trash2 size={20} color={colors.red} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Step Button */}
        <TouchableOpacity style={styles.addStepButton} onPress={addStep}>
          <Plus size={24} color={colors.purple} />
          <Text style={styles.addStepButtonText}>Add Step</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Product Search Modal */}
      {showProductSearch && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => {
                setShowProductSearch(false);
                setSelectedStepIndex(null);
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <X size={24} color={colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Search size={20} color={colors.charcoal} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchProducts(text);
                }}
                autoFocus
                placeholderTextColor={colors.charcoal}
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searchResults.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productResult}
                  onPress={() => selectProduct(product)}
                >
                  <View>
                    <Text style={styles.resultBrand}>{product.brand}</Text>
                    <Text style={styles.resultName}>{product.name}</Text>
                    <Text style={styles.resultCategory}>{product.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <Text style={styles.noResults}>No products found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
