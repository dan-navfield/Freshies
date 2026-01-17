import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Animated,
  Dimensions,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Plus, Trash2, Clock, ChevronRight,
  Droplets, Sparkles, Sun, Shield, Droplet, Star,
  Info, Check, X, Search, Package, Timer, Zap, AlertTriangle
} from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { routineService, CustomRoutine, RoutineStepData } from '../../src/services/routineService';
import { routineTemplateService, RoutineStepTemplate } from '../../src/services/routineTemplateService';
import DetailPageHeader from '../../src/components/DetailPageHeader';
import GamificationBand from '../../src/components/GamificationBand';
import ProductSelectorModal from '../../src/components/ProductSelectorModal';

const { width } = Dimensions.get('window');

type Segment = 'morning' | 'afternoon' | 'evening';
type StepType = 'cleanser' | 'moisturizer' | 'sunscreen' | 'treatment' | 'serum';

interface RoutineStep {
  id: string;
  type: StepType;
  title: string;
  duration: number;
  product_id?: string;
  product?: Product;
  instructions: string[];
  tips?: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  fresh_score: number;
  benefits: string;
}

interface StepTemplate {
  type: StepType;
  title: string;
  icon: any;
  color: string;
  defaultDuration: number;
  defaultInstructions: string[];
  tips: string;
  recommendedOrder: number;
}

const STEP_TEMPLATES: Record<StepType, StepTemplate> = {
  cleanser: {
    type: 'cleanser',
    title: 'Cleanse Your Face',
    icon: Droplets,
    color: colors.mint,
    defaultDuration: 60,
    defaultInstructions: [
      'Wet your face with lukewarm water',
      'Apply a dime-sized amount of cleanser',
      'Gently massage in circular motions for 30 seconds',
      'Rinse thoroughly with water',
      'Pat dry with a clean towel'
    ],
    tips: '💡 Use gentle, upward circular motions to boost circulation!',
    recommendedOrder: 1
  },
  serum: {
    type: 'serum',
    title: 'Apply Serum',
    icon: Zap,
    color: colors.purple,
    defaultDuration: 30,
    defaultInstructions: [
      'Apply 2-3 drops to fingertips',
      'Gently pat onto face and neck',
      'Wait 30 seconds for absorption',
      'Focus on problem areas'
    ],
    tips: '💡 Less is more! A few drops go a long way.',
    recommendedOrder: 2
  },
  moisturizer: {
    type: 'moisturizer',
    title: 'Moisturize',
    icon: Sparkles,
    color: colors.peach,
    defaultDuration: 45,
    defaultInstructions: [
      'Take a pea-sized amount',
      'Dot on forehead, cheeks, nose, and chin',
      'Gently spread in upward motions',
      'Don\'t forget your neck!',
      'Let it absorb for a minute'
    ],
    tips: '💡 Always apply moisturizer while skin is slightly damp for better absorption!',
    recommendedOrder: 3
  },
  sunscreen: {
    type: 'sunscreen',
    title: 'Apply Sunscreen',
    icon: Sun,
    color: colors.yellow,
    defaultDuration: 30,
    defaultInstructions: [
      'Apply two finger lengths of sunscreen',
      'Spread evenly across face and neck',
      'Don\'t forget ears and hairline',
      'Wait 2 minutes before going outside'
    ],
    tips: '💡 Reapply every 2 hours when outdoors!',
    recommendedOrder: 4
  },
  treatment: {
    type: 'treatment',
    title: 'Spot Treatment',
    icon: Shield,
    color: colors.success,
    defaultDuration: 20,
    defaultInstructions: [
      'Apply directly to problem areas',
      'Use a small amount',
      'Gently pat, don\'t rub',
      'Let it dry completely'
    ],
    tips: '💡 Apply treatments before moisturizer for better penetration!',
    recommendedOrder: 2
  }
};

export default function EnhancedRoutineBuilder() {
  const router = useRouter();
  const { childProfile } = useChildProfile();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const segmentParam = (params.segment as Segment) || 'morning';
  const routineId = params.routineId as string;
  const suggestedStepsParam = params.suggestedSteps as string;

  const [selectedSegment, setSelectedSegment] = useState<Segment>(segmentParam);
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [routineName, setRoutineName] = useState(`${segmentParam.charAt(0).toUpperCase() + segmentParam.slice(1)} Routine`);
  const [showStepSelector, setShowStepSelector] = useState(false);
  const [showProductRecommendations, setShowProductRecommendations] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showGuidedMode, setShowGuidedMode] = useState(false);
  const [currentGuidedStep, setCurrentGuidedStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Default to all days
  const [dbTemplates, setDbTemplates] = useState<RoutineStepTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [pendingSuggestedSteps, setPendingSuggestedSteps] = useState<RoutineStep[]>([]);

  const fadeAnim = useState(new Animated.Value(1))[0]; // Start at 1 so content is visible

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    console.log('=== Routine Builder Mounted ===');
    console.log('routineId:', routineId);
    console.log('suggestedStepsParam:', suggestedStepsParam ? 'YES' : 'NO');
    console.log('segment:', selectedSegment);

    // Process suggested steps first (if any)
    if (suggestedStepsParam) {
      loadRoutineSteps(); // This will set pendingSuggestedSteps
    }

    // Load existing routine if we have a routineId (regardless of suggested steps)
    if (routineId) {
      console.log('Will load existing routine...');
      loadExistingRoutine();
    } else if (!suggestedStepsParam) {
      // Only set empty if no suggested steps and no routine
      loadRoutineSteps();
    }

    loadRecommendedProducts();
  }, [routineId, suggestedStepsParam]);

  // Append pending suggested steps when they become available
  // Use a ref to track if we've loaded the existing routine
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);

  useEffect(() => {
    if (pendingSuggestedSteps.length > 0) {
      console.log('=== Pending Steps Detected ===');
      console.log('Pending steps:', pendingSuggestedSteps.length);
      console.log('Current steps:', steps.length);
      console.log('Has routineId:', !!routineId);
      console.log('Has loaded existing:', hasLoadedExisting);

      if (routineId && !hasLoadedExisting) {
        // Waiting for existing routine to load
        console.log('Waiting for existing routine to load...');
        return;
      }

      if (routineId) {
        // Existing routine loaded (even if it has 0 steps), append to it
        console.log('Appending to existing routine (current steps:', steps.length, ')');
        setSteps(prevSteps => [...prevSteps, ...pendingSuggestedSteps]);
        setPendingSuggestedSteps([]); // Clear after appending
      } else {
        // New routine, use suggested steps as initial steps
        console.log('Using as initial steps for new routine');
        setSteps(pendingSuggestedSteps);
        setPendingSuggestedSteps([]);
      }
    }
  }, [pendingSuggestedSteps, steps.length, routineId, hasLoadedExisting]);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const result = await routineTemplateService.getTemplates({
        timeOfDay: selectedSegment as any
      });
      if (!result.ok) throw result.error;
      setDbTemplates(result.value);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadRoutineSteps = async () => {
    console.log('=== loadRoutineSteps called ===');
    console.log('routineId:', routineId);
    console.log('suggestedStepsParam exists:', !!suggestedStepsParam);

    // Check if we have suggested steps from Guided Mode
    if (suggestedStepsParam) {
      try {
        const suggestedSteps = JSON.parse(suggestedStepsParam);
        console.log('Parsed suggested steps:', suggestedSteps.length, 'steps');

        // Convert suggested steps to routine steps
        const newSteps = suggestedSteps.map((step: any, index: number) => ({
          id: `temp-${Date.now()}-${index}`,
          type: step.type as StepType,
          title: step.title,
          duration: step.duration,
          instructions: Array.isArray(step.instructions) ? step.instructions : [step.instructions || ''],
          tips: step.tips || step.tip || ''
        }));

        console.log('Converted to', newSteps.length, 'routine steps');

        // If we have a routineId, we're adding to an existing routine
        // Otherwise, start fresh with these steps
        if (routineId) {
          // Store them to append after existing routine loads
          console.log('Storing as pending steps (will append to existing routine)');
          setPendingSuggestedSteps(newSteps);
        } else {
          console.log('Setting as initial steps (new routine)');
          setPendingSuggestedSteps(newSteps); // Use pending even for new to trigger the effect
        }
      } catch (error) {
        console.error('Error parsing suggested steps:', error);
        if (!routineId) {
          setSteps([]);
        }
      }
    } else if (!routineId) {
      // Start with empty routine - user can add steps via Guided Mode or manually
      console.log('Starting with blank routine (no suggested steps, no routineId)');
      setSteps([]);
    }
  };

  const loadExistingRoutine = async () => {
    console.log('=== loadExistingRoutine called ===');
    console.log('routineId:', routineId);
    console.log('childProfile?.id:', childProfile?.id);

    if (!routineId || !childProfile?.id) {
      console.log('Missing routineId or childProfile, skipping');
      return;
    }

    try {
      // Load routine from database
      console.log('Fetching routines from database...');
      const result = await routineService.getRoutines(childProfile.id);
      if (!result.ok) throw result.error;

      const routines = result.value;
      console.log('Found', routines.length, 'routines');

      const routine = routines.find(r => r.id === routineId);
      console.log('Found matching routine:', !!routine);

      if (routine && routine.steps) {
        console.log('Routine has', routine.steps.length, 'steps');

        // Set the routine name and active days
        setRoutineName(routine.name);
        setActiveDays(routine.active_days || [0, 1, 2, 3, 4, 5, 6]);

        // Convert RoutineStepData back to local step format
        const loadedSteps = await Promise.all(routine.steps.map(async (step) => {
          let product = undefined;

          // Load product data if product_id exists
          if (step.product_id) {
            try {
              // Try fetching from Shelf Items first (preferred)
              const { data: shelfData } = await supabase
                .from('shelf_items')
                .select('*')
                .eq('id', step.product_id)
                .single();

              if (shelfData) {
                product = {
                  id: shelfData.id,
                  name: shelfData.product_name,
                  brand: shelfData.product_brand || 'Unknown Brand',
                  image: shelfData.product_image_url,
                  fresh_score: 85, // Default score or fetch if available
                  benefits: 'Maintained' // Default
                };
              } else {
                // Fallback to scanned_products for backward compatibility
                const { data: scannedData } = await supabase
                  .from('scanned_products')
                  .select('*')
                  .eq('id', step.product_id)
                  .single();

                if (scannedData) {
                  product = {
                    id: scannedData.id,
                    name: scannedData.product_name,
                    brand: scannedData.brand_name || 'Unknown',
                    image: scannedData.image_url,
                    fresh_score: 85,
                    benefits: 'Archived'
                  };
                }
              }
            } catch (error) {
              console.error('Error loading product:', error);
            }
          }

          return {
            id: step.id,
            type: step.type,
            title: step.title,
            duration: step.duration,
            product_id: step.product_id,
            product,
            instructions: step.instructions,
            tips: step.tips || ''
          };
        }));

        console.log('Setting', loadedSteps.length, 'loaded steps');
        setSteps(loadedSteps);
        setHasLoadedExisting(true); // Mark as loaded
      } else {
        console.log('Routine not found or has no steps');
        setHasLoadedExisting(true); // Still mark as loaded even if empty
      }
    } catch (error) {
      console.error('Error loading routine:', error);
      setHasLoadedExisting(true); // Mark as loaded even on error
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      // Load products based on child's skin type and concerns
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_approved', true)
        .limit(10);

      if (error) throw error;

      if (products && products.length > 0) {
        setRecommendedProducts(products.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          image: p.image || 'https://via.placeholder.com/60',
          fresh_score: p.fresh_score || 85,
          benefits: p.key_ingredients && p.key_ingredients.length > 0 ? p.key_ingredients[0] : 'Gentle'
        })));
      } else {
        // Fallback products if none in database
        setRecommendedProducts([
          {
            id: '1',
            name: 'Gentle Foam Cleanser',
            brand: 'CeraVe',
            image: 'https://via.placeholder.com/60',
            fresh_score: 92,
            benefits: 'Hydrating'
          },
          {
            id: '2',
            name: 'Daily Moisturizer',
            brand: 'Cetaphil',
            image: 'https://via.placeholder.com/60',
            fresh_score: 88,
            benefits: 'Soothing'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Use fallback products on error
      setRecommendedProducts([
        {
          id: '1',
          name: 'Gentle Foam Cleanser',
          brand: 'CeraVe',
          image: 'https://via.placeholder.com/60',
          fresh_score: 92,
          benefits: 'Hydrating'
        }
      ]);
    }
  };

  const addStep = (type: StepType) => {
    const template = STEP_TEMPLATES[type];
    const newStep: RoutineStep = {
      id: `temp-${Date.now()}`,
      type: type,
      title: template.title,
      duration: template.defaultDuration,
      instructions: template.defaultInstructions,
      tips: template.tips
    };

    setSteps([...steps, newStep]);
    setShowStepSelector(false);

    // Animate in
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const removeStep = (index: number) => {
    Alert.alert(
      'Remove Step',
      'Are you sure you want to remove this step?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newSteps = steps.filter((_, i) => i !== index);
            setSteps(newSteps.map((step, i) => ({ ...step, step_order: i + 1 })));
          }
        }
      ]
    );
  };

  const selectProduct = (product: any) => {
    if (selectedStepIndex === null) return;

    const updatedSteps = [...steps];
    updatedSteps[selectedStepIndex] = {
      ...updatedSteps[selectedStepIndex],
      product_id: product.id,
      product: {
        id: product.id,
        name: product.product_name || product.name,
        brand: product.brand_name || product.brand || 'Unknown Brand',
        image: product.image_url || product.image,
        fresh_score: product.fresh_score || 85,
        benefits: product.benefits || (product.key_ingredients && product.key_ingredients[0]) || 'Gentle'
      }
    };
    setSteps(updatedSteps);
    setShowProductRecommendations(false);
    setSelectedStepIndex(null);
  };

  const saveRoutine = async (saveAsDraft: boolean = false) => {
    try {
      if (!childProfile?.id) {
        Alert.alert('Error', 'User profile not found');
        return;
      }

      // Allow saving draft with no steps, but require steps for active
      if (!saveAsDraft && steps.length === 0) {
        Alert.alert('No Steps', 'Please add at least one step to publish your routine');
        return;
      }

      if (routineId) {
        // Update existing routine
        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        // Convert steps to RoutineStepData format
        const routineSteps: RoutineStepData[] = steps.map((step, index) => ({
          id: `step-${Date.now()}-${index}`,
          type: step.type,
          title: step.title,
          order: index,
          duration: step.duration,
          product_id: step.product_id,
          instructions: step.instructions,
          tips: step.tips
        }));

        const name = routineName?.trim() || `My ${selectedSegment.charAt(0).toUpperCase() + selectedSegment.slice(1)} Routine`;

        const result = await routineService.updateRoutine(routineId, {
          name,
          segment: selectedSegment,
          steps: routineSteps,
          total_duration: totalDuration,
          active_days: activeDays,
          status: saveAsDraft ? 'draft' : 'active',
          is_active: !saveAsDraft // Set is_active to true when publishing
        });

        if (result.ok) {
          setIsSaved(true);
          // Navigate back to routine library after showing saved state
          setTimeout(() => {
            router.push('/(child)/(tabs)/routine');
          }, 1500);
        } else {
          console.error('Failed to update routine:', result.error);
          Alert.alert('Error', `Failed to update routine: ${result.error?.message || 'Unknown error'}`);
        }
      } else {
        // Save routine with the name from the input field
        const name = routineName?.trim() || `My ${selectedSegment.charAt(0).toUpperCase() + selectedSegment.slice(1)} Routine`;

        const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

        // Convert steps to RoutineStepData format
        const routineSteps: RoutineStepData[] = steps.map((step, index) => ({
          id: `step-${Date.now()}-${index}`,
          type: step.type,
          title: step.title,
          order: index,
          duration: step.duration,
          product_id: step.product_id,
          instructions: step.instructions,
          tips: step.tips
        }));

        // Create the routine
        // Use childProfile.user_id if available, otherwise fall back to authenticated user
        const userId = childProfile.user_id || user?.id || '';

        console.log('Creating routine with:', {
          userId,
          childProfileId: childProfile.id,
          name,
          segment: selectedSegment,
          stepsCount: routineSteps.length
        });

        if (!userId) {
          Alert.alert('Error', 'User ID not found. Please try logging in again.');
          return;
        }

        const result = await routineService.createRoutine({
          user_id: userId,
          child_profile_id: childProfile.id,
          name,
          segment: selectedSegment,
          steps: routineSteps,
          total_duration: totalDuration,
          is_active: !saveAsDraft, // Set is_active to true when publishing
          completion_count: 0,
          active_days: activeDays,
          status: saveAsDraft ? 'draft' : 'active'
        });

        if (result.ok) {
          setIsSaved(true);
          // Navigate back after showing saved state
          setTimeout(() => {
            router.push('/(child)/(tabs)/routine');
          }, 1500);
        } else {
          console.error('Failed to create routine:', result.error);
          Alert.alert('Error', `Failed to save routine: ${result.error?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', `Failed to save routine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startGuidedRoutine = () => {
    router.push({
      pathname: '/(child)/guided-routine',
      params: {
        segment: selectedSegment,
        routineId: routineId || '', // Pass existing routine ID if editing
        routineName: routineName || ''
      }
    });
  };

  return (
    <View style={styles.container}>
      <DetailPageHeader
        title={routineId ? 'Edit Routine' : 'Build Your Routine'}
        subtitle="Create your perfect routine"
      />

      <GamificationBand />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.guidedButton}
          onPress={startGuidedRoutine}
        >
          <Timer size={16} color={colors.white} />
          <Text style={styles.guidedButtonText}>Guided Mode</Text>
        </TouchableOpacity>

        <View style={styles.saveButtonsContainer}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={() => saveRoutine(true)}
          >
            <Text style={styles.draftButtonText}>Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.publishButton, isSaved && styles.publishButtonSaved]}
            onPress={() => saveRoutine(false)}
            disabled={isSaved}
          >
            <Check size={16} color={isSaved ? colors.white : colors.charcoal} />
            <Text style={[styles.publishButtonText, isSaved && { color: colors.white }]}>
              {isSaved ? 'Saved!' : 'Publish'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Routine Name Input */}
        <View style={styles.nameInputContainer}>
          <Text style={styles.nameInputLabel}>Routine Name</Text>
          <TextInput
            style={styles.nameInput}
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="Enter routine name"
            placeholderTextColor={colors.charcoal + '60'}
          />
        </View>

        {/* Time of Day Selector */}
        <View style={styles.activeDaysContainer}>
          <Text style={styles.activeDaysLabel}>Time of day</Text>
          <View style={styles.segmentSelectorRow}>
            {(['morning', 'afternoon', 'evening'] as Segment[]).map((seg) => {
              const isActive = selectedSegment === seg;
              const icons: Record<Segment, string> = { morning: '☀️', afternoon: '🌤️', evening: '🌙' };
              const labels: Record<Segment, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
              return (
                <TouchableOpacity
                  key={seg}
                  style={[
                    styles.segmentButton,
                    isActive && styles.segmentButtonActive
                  ]}
                  onPress={() => setSelectedSegment(seg)}
                >
                  <Text style={styles.segmentIcon}>{icons[seg]}</Text>
                  <Text style={[
                    styles.segmentLabel,
                    isActive && styles.segmentLabelActive
                  ]}>
                    {labels[seg]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Active Days Selector */}
        <View style={styles.activeDaysContainer}>
          <Text style={styles.activeDaysLabel}>Active days</Text>
          <View style={styles.dayCirclesRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const isActive = activeDays.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCircleBuilder,
                    isActive && styles.dayCircleBuilderActive
                  ]}
                  onPress={() => {
                    setActiveDays(prev =>
                      prev.includes(index)
                        ? prev.filter(d => d !== index)
                        : [...prev, index].sort()
                    );
                  }}
                >
                  <Text style={[
                    styles.dayTextBuilder,
                    isActive && styles.dayTextBuilderActive
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Routine Steps */}
        {steps.map((step, index) => {
          const template = STEP_TEMPLATES[step.type] || STEP_TEMPLATES.cleanser; // Fallback to cleanser if type not found
          const Icon = template.icon;

          return (
            <Animated.View
              key={step.id}
              style={[
                styles.stepCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: fadeAnim }]
                }
              ]}
            >
              {/* Step Header */}
              <View style={styles.stepHeader}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, { backgroundColor: template.color + '20' }]}>
                    {React.createElement(Icon, { size: 24, color: template.color })}
                  </View>
                  <View>
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => removeStep(index)}>
                  <Trash2 size={20} color={colors.charcoal} />
                </TouchableOpacity>
              </View>

              {/* Product Selection */}
              <TouchableOpacity
                style={styles.productSection}
                onPress={() => {
                  setSelectedStepIndex(index);
                  setShowProductRecommendations(true);
                }}
              >
                {step.product ? (
                  <View style={styles.selectedProduct}>
                    {step.product.image && (
                      <Image
                        source={{ uri: step.product.image }}
                        style={styles.productImage}
                      />
                    )}
                    <View style={styles.productInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.productBrand}>{step.product.brand}</Text>
                        {/* Warning badge - placeholder for now */}
                        <View style={styles.warningBadge}>
                          <AlertTriangle size={12} color={colors.orange} />
                        </View>
                      </View>
                      <Text style={styles.productName}>{step.product.name}</Text>
                    </View>
                    <ChevronRight size={20} color={colors.charcoal} />
                  </View>
                ) : (
                  <View style={styles.addProduct}>
                    <Package size={20} color={colors.purple} />
                    <Text style={styles.addProductText}>Add Product</Text>
                    <ChevronRight size={20} color={colors.purple} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Duration */}
              <View style={styles.durationRow}>
                <Clock size={16} color={colors.charcoal} />
                <Text style={styles.durationText}>
                  {Math.floor(step.duration / 60)}:{(step.duration % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              {/* Instructions Preview */}
              <View style={styles.instructionsPreview}>
                <Text style={styles.instructionsLabel}>Quick Guide:</Text>
                <Text style={styles.instructionsText} numberOfLines={2}>
                  {step.instructions[0]}
                </Text>
              </View>

              {/* Tips */}
              {step.tips && (
                <View style={styles.tipsBox}>
                  <Info size={14} color={colors.purple} />
                  <Text style={styles.tipsText}>{step.tips}</Text>
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* Add Step Button */}
        <TouchableOpacity
          style={styles.addStepButton}
          onPress={() => setShowStepSelector(true)}
        >
          <Plus size={24} color={colors.purple} />
          <Text style={styles.addStepText}>Add Step</Text>
        </TouchableOpacity>

        {/* Total Time */}
        <View style={styles.totalTimeCard}>
          <Timer size={20} color={colors.purple} />
          <Text style={styles.totalTimeLabel}>Total Routine Time:</Text>
          <Text style={styles.totalTimeValue}>
            {Math.floor(steps.reduce((acc, step) => acc + step.duration, 0) / 60)} minutes
          </Text>
        </View>
      </ScrollView>

      {/* Step Selector Modal */}
      <Modal
        visible={showStepSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStepSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Step Type</Text>
              <TouchableOpacity onPress={() => setShowStepSelector(false)}>
                <X size={24} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              {/* Main Step Types */}
              {Object.values(STEP_TEMPLATES).map((template) => {
                const Icon = template.icon;
                return (
                  <TouchableOpacity
                    key={template.type}
                    style={styles.stepOption}
                    onPress={() => addStep(template.type)}
                  >
                    <View style={[styles.stepOptionIcon, { backgroundColor: template.color + '20' }]}>
                      <Icon size={24} color={template.color} />
                    </View>
                    <View style={styles.stepOptionInfo}>
                      <Text style={styles.stepOptionTitle}>{template.title}</Text>
                      <Text style={styles.stepOptionDuration}>
                        ~{Math.floor(template.defaultDuration / 60)} min
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.charcoal} />
                  </TouchableOpacity>
                );
              })}

              {/* More Options Section */}
              <View style={{ marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.charcoal + '80', marginBottom: spacing[3], marginLeft: spacing[2] }}>More Options</Text>

                {/* Toner */}
                <TouchableOpacity
                  style={styles.stepOption}
                  onPress={() => {
                    const newStep: RoutineStep = {
                      id: `temp-${Date.now()}`,
                      type: 'serum',
                      title: 'Apply Toner',
                      duration: 30,
                      instructions: ['Pour a small amount onto a cotton pad', 'Gently swipe across face', 'Let it absorb naturally'],
                      tips: '💡 Toner helps balance your skin\'s pH!'
                    };
                    setSteps([...steps, newStep]);
                    setShowStepSelector(false);
                  }}
                >
                  <View style={[styles.stepOptionIcon, { backgroundColor: '#E0F7FA' }]}>
                    <Droplet size={24} color="#00BCD4" />
                  </View>
                  <View style={styles.stepOptionInfo}>
                    <Text style={styles.stepOptionTitle}>Apply Toner</Text>
                    <Text style={styles.stepOptionDuration}>~0 min</Text>
                  </View>
                  <ChevronRight size={20} color={colors.charcoal} />
                </TouchableOpacity>

                {/* Eye Cream */}
                <TouchableOpacity
                  style={styles.stepOption}
                  onPress={() => {
                    const newStep: RoutineStep = {
                      id: `temp-${Date.now()}`,
                      type: 'treatment',
                      title: 'Apply Eye Cream',
                      duration: 20,
                      instructions: ['Use a rice grain amount', 'Gently dab around eye area', 'Use ring finger for light pressure'],
                      tips: '💡 Be gentle around the delicate eye area!'
                    };
                    setSteps([...steps, newStep]);
                    setShowStepSelector(false);
                  }}
                >
                  <View style={[styles.stepOptionIcon, { backgroundColor: '#FCE4EC' }]}>
                    <Star size={24} color="#E91E63" />
                  </View>
                  <View style={styles.stepOptionInfo}>
                    <Text style={styles.stepOptionTitle}>Apply Eye Cream</Text>
                    <Text style={styles.stepOptionDuration}>~0 min</Text>
                  </View>
                  <ChevronRight size={20} color={colors.charcoal} />
                </TouchableOpacity>

                {/* Face Mask */}
                <TouchableOpacity
                  style={styles.stepOption}
                  onPress={() => {
                    const newStep: RoutineStep = {
                      id: `temp-${Date.now()}`,
                      type: 'treatment',
                      title: 'Apply Face Mask',
                      duration: 600,
                      instructions: ['Apply an even layer to clean face', 'Avoid eye and lip area', 'Leave on for 10-15 minutes', 'Rinse off with lukewarm water'],
                      tips: '💡 Great for a weekly treat!'
                    };
                    setSteps([...steps, newStep]);
                    setShowStepSelector(false);
                  }}
                >
                  <View style={[styles.stepOptionIcon, { backgroundColor: '#F3E5F5' }]}>
                    <Sparkles size={24} color="#9C27B0" />
                  </View>
                  <View style={styles.stepOptionInfo}>
                    <Text style={styles.stepOptionTitle}>Apply Face Mask</Text>
                    <Text style={styles.stepOptionDuration}>~10 min</Text>
                  </View>
                  <ChevronRight size={20} color={colors.charcoal} />
                </TouchableOpacity>

                {/* Exfoliate */}
                <TouchableOpacity
                  style={styles.stepOption}
                  onPress={() => {
                    const newStep: RoutineStep = {
                      id: `temp-${Date.now()}`,
                      type: 'cleanser',
                      title: 'Exfoliate',
                      duration: 60,
                      instructions: ['Apply to damp skin', 'Gently massage in circular motions', 'Focus on T-zone', 'Rinse thoroughly'],
                      tips: '💡 Only exfoliate 1-2 times per week!'
                    };
                    setSteps([...steps, newStep]);
                    setShowStepSelector(false);
                  }}
                >
                  <View style={[styles.stepOptionIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Sun size={24} color="#FF9800" />
                  </View>
                  <View style={styles.stepOptionInfo}>
                    <Text style={styles.stepOptionTitle}>Exfoliate</Text>
                    <Text style={styles.stepOptionDuration}>~1 min</Text>
                  </View>
                  <ChevronRight size={20} color={colors.charcoal} />
                </TouchableOpacity>
              </View>

              {/* Add Custom Step */}
              <TouchableOpacity
                style={[styles.stepOption, { marginTop: spacing[4], backgroundColor: colors.purple + '10', borderWidth: 2, borderColor: colors.purple, borderStyle: 'dashed' }]}
                onPress={() => {
                  Alert.prompt(
                    'Add Custom Step',
                    'Enter a name for your custom step:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Add',
                        onPress: (stepName: string | undefined) => {
                          if (stepName && stepName.trim()) {
                            const newStep: RoutineStep = {
                              id: `temp-${Date.now()}`,
                              type: 'treatment',
                              title: stepName.trim(),
                              duration: 60,
                              instructions: ['Complete this step as needed'],
                              tips: ''
                            };
                            setSteps([...steps, newStep]);
                            setShowStepSelector(false);
                          }
                        }
                      }
                    ],
                    'plain-text',
                    '',
                    'default'
                  );
                }}
              >
                <View style={[styles.stepOptionIcon, { backgroundColor: colors.purple + '20' }]}>
                  <Plus size={24} color={colors.purple} />
                </View>
                <View style={styles.stepOptionInfo}>
                  <Text style={[styles.stepOptionTitle, { color: colors.purple }]}>Add Custom Step</Text>
                  <Text style={styles.stepOptionDuration}>Create your own</Text>
                </View>
                <ChevronRight size={20} color={colors.purple} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        visible={showProductRecommendations}
        onClose={() => {
          setShowProductRecommendations(false);
          setSelectedStepIndex(null);
        }}
        onSelectProduct={selectProduct}
        childProfileId={childProfile?.id || ''}
        stepType={selectedStepIndex !== null ? steps[selectedStepIndex]?.type : undefined}
      />

      {/* Guided Mode Modal - Simplified */}
      <Modal
        visible={showGuidedMode}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowGuidedMode(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.purple }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 }}>
            <TouchableOpacity onPress={() => setShowGuidedMode(false)}>
              <X size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '600', color: colors.white }}>Guided Routine</Text>
            <View style={{ width: 24 }} />
          </View>

          {steps[currentGuidedStep] && (
            <View style={{ flex: 1, padding: 20 }}>
              <Text style={{ fontSize: 16, color: colors.white, opacity: 0.8, textAlign: 'center', marginBottom: 20 }}>
                Step {currentGuidedStep + 1} of {steps.length}
              </Text>

              <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 30, alignItems: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: STEP_TEMPLATES[steps[currentGuidedStep].type].color + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {React.createElement(STEP_TEMPLATES[steps[currentGuidedStep].type].icon, {
                    size: 40,
                    color: STEP_TEMPLATES[steps[currentGuidedStep].type].color
                  })}
                </View>

                <Text style={{ fontSize: 24, fontWeight: '600', color: colors.charcoal, marginBottom: 20 }}>
                  {steps[currentGuidedStep].title}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 }}>
                  <Timer size={24} color={colors.purple} />
                  <Text style={{ fontSize: 32, fontWeight: '600', color: colors.purple }}>
                    {Math.floor(steps[currentGuidedStep].duration / 60)}:{(steps[currentGuidedStep].duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>

                <View style={{ width: '100%', marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.charcoal, marginBottom: 10 }}>Instructions:</Text>
                  {(steps[currentGuidedStep].instructions || []).map((instruction, index) => (
                    <Text key={index} style={{ fontSize: 14, color: colors.charcoal, marginBottom: 8, lineHeight: 20 }}>
                      {index + 1}. {instruction}
                    </Text>
                  ))}
                </View>

                {steps[currentGuidedStep].tips && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.lavender, padding: 12, borderRadius: 12, width: '100%' }}>
                    <Sparkles size={16} color={colors.purple} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.purple }}>
                      {steps[currentGuidedStep].tips}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, gap: 12 }}>
                {currentGuidedStep > 0 && (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => setCurrentGuidedStep(currentGuidedStep - 1)}
                  >
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>Previous</Text>
                  </TouchableOpacity>
                )}

                {currentGuidedStep < steps.length - 1 ? (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.mint, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => setCurrentGuidedStep(currentGuidedStep + 1)}
                  >
                    <Text style={{ color: colors.charcoal, fontSize: 16, fontWeight: '600' }}>Next Step</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: colors.yellow, paddingVertical: 16, borderRadius: 12, alignItems: 'center' }}
                    onPress={() => {
                      Alert.alert('Routine Complete! 🎉', 'Great job! You earned 100 XP!');
                      setShowGuidedMode(false);
                      setCurrentGuidedStep(0);
                    }}
                  >
                    <Text style={{ color: colors.charcoal, fontSize: 16, fontWeight: '600' }}>Complete Routine</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  actionBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    gap: spacing[3],
    alignItems: 'center' as const,
  },
  guidedButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing[2],
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  guidedButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveButtonsContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    gap: spacing[2],
  },
  draftButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  draftButtonText: {
    color: colors.purple,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  publishButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing[2],
    backgroundColor: colors.success,
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  publishButtonText: {
    color: colors.charcoal,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  publishButtonSaved: {
    backgroundColor: colors.purple,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  nameInputContainer: {
    marginBottom: spacing[5],
  },
  nameInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  nameInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mist,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.charcoal,
  },
  activeDaysContainer: {
    marginBottom: spacing[5],
  },
  activeDaysLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.charcoal,
    marginBottom: spacing[3],
  },
  dayCirclesRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  dayCircleBuilder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purple,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  dayCircleBuilderActive: {
    backgroundColor: colors.purple,
  },
  dayTextBuilder: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.purple,
  },
  dayTextBuilderActive: {
    color: colors.white,
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[4],
  },
  stepLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stepNumber: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.black,
  },
  productSection: {
    marginBottom: spacing[3],
  },
  selectedProduct: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    marginRight: spacing[3],
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.black,
    marginTop: spacing[1],
  },
  addProduct: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
  addProductText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.purple,
  },
  productBenefit: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
  },
  // Guided Mode Styles
  guidedModeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing[3],
    backgroundColor: colors.purple + '10',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.purple + '30',
    borderStyle: 'dashed' as const,
  },
  durationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  durationText: {
    fontSize: 14,
    color: colors.charcoal,
  },
  instructionsPreview: {
    marginBottom: spacing[3],
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.charcoal,
    opacity: 0.6,
    marginBottom: spacing[1],
  },
  instructionsText: {
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  tipsBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.purple + '10',
    borderRadius: radii.md,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: colors.purple,
    lineHeight: 18,
  },
  addStepButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: colors.purple,
    borderStyle: 'dashed' as const,
    marginBottom: spacing[4],
  },
  addStepText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.purple,
  },
  totalTimeCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.purple + '10',
    borderRadius: radii.xl,
    marginBottom: spacing[4],
  },
  totalTimeLabel: {
    fontSize: 14,
    color: colors.purple,
  },
  totalTimeValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.purple,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing[6],
    maxHeight: '70%' as const,
  },
  modalContentLarge: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing[6],
    maxHeight: '80%' as const,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing[6],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.black,
  },
  stepOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing[4],
    marginBottom: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  stepOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing[3],
  },
  stepOptionInfo: {
    flex: 1,
  },
  stepOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.black,
  },
  stepOptionDuration: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  productOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  productOptionImage: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    marginRight: spacing[3],
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionBrand: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  productOptionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.black,
    marginBottom: spacing[1],
  },
  productMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
  },
  freshScore: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1],
  },
  freshScoreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.yellow,
  },
  warningBadge: {
    backgroundColor: colors.orange + '20',
    borderRadius: radii.sm,
    padding: 2,
  },
  // Segment Selector Styles
  segmentSelectorRow: {
    flexDirection: 'row' as const,
    gap: spacing[3],
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.mist,
    gap: spacing[2],
  },
  segmentButtonActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purple + '10',
  },
  segmentIcon: {
    fontSize: 18,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.charcoal,
  },
  segmentLabelActive: {
    color: colors.purple,
    fontWeight: '600' as const,
  },
});
