import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, AlertCircle, CheckCircle, Info, Brain, Shield, XCircle, ChevronDown, ChevronUp, ChevronLeft, Users, Share2, Bookmark, ThumbsUp, ThumbsDown, Scale } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { saveScannedProduct } from '../../src/services/storage/scannedProducts';
import { openChatWithProduct, openChatWithQuestion } from '../../src/utils/chatHelpers';
import { useChatContextStore } from '../../src/stores/chatContextStore';
import { useAuth } from '../../src/contexts/AuthContext';
import { getChildren } from '../../../src/modules/parent-controls';
import { ChildProfile } from '../../src/types/family';
import { supabase } from '../../src/lib/supabase';
import { getIngredientInfo, getGenericIngredientInfo } from '../../src/data/ingredientDatabase';
import { getProductReviews, markReviewHelpful, createReview, rateProduct, getProductReviewSummary } from '../../src/services/reviewsService';
import { addToWishlist, isInWishlist, removeFromWishlist } from '../../../src/modules/product-library';
import type { WishlistItem } from '../../src/types/wishlist';
import type { ReviewWithContext, CreateReviewRequest, ProductReviewSummary } from '../../src/types/reviews';
import ReviewSubmissionModal from '../../src/components/modals/ReviewSubmissionModal';
import ReviewStatistics from '../../src/components/ReviewStatistics';
import { clearPromptCache } from '../../src/services/config/promptLoader';

/**
 * Convert text to sentence case (capitalize first letter of each word)
 */
const toSentenceCase = (text: string | string[]): string => {
  const str = Array.isArray(text) ? text[0] : text;
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function ProductResultScreen() {
  const params = useLocalSearchParams();
  const { barcode, name, brand, category, size, imageUrl, confidence, description, ingredients: ingredientsJSON, scoring: scoringJSON, sourceType } = params;
  const insets = useSafeAreaInsets();

  // DEBUG: Log received params
  console.log('🔍 ProductResult received:', { name, brand, size, sourceType, confidence, ingredientsJSON: ingredientsJSON?.toString()?.slice(0, 100) });

  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<'general' | string>('general'); // 'general' or child ID
  const [reviews, setReviews] = useState<ReviewWithContext[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const assessmentSectionRef = useRef<View>(null);

  // Parse JSON data
  const rawIngredients = ingredientsJSON ? JSON.parse(ingredientsJSON as string) : { normalised: [], rawText: '' };

  // Normalize ingredients - handle both string arrays (from AI) and object arrays (from DB)
  const ingredients = {
    ...rawIngredients,
    normalised: rawIngredients.normalised?.map((ing: any) => {
      // If it's already an object with canonicalName, use it as-is
      if (typeof ing === 'object' && ing.canonicalName) {
        return ing;
      }
      // If it's a string (from AI identification), convert to ingredient object
      if (typeof ing === 'string') {
        return {
          canonicalName: ing,
          originalName: ing,
          safetyRating: 5, // Default to low concern for AI-identified
          flags: [],
        };
      }
      // Fallback: wrap unknown types
      return {
        canonicalName: String(ing),
        originalName: String(ing),
        safetyRating: 5,
        flags: [],
      };
    }) || []
  };
  const scoring = scoringJSON ? JSON.parse(scoringJSON as string) : null;

  // Get safety color, icon, and label for six-tier system
  const getSafetyStyle = (rating: string) => {
    switch (rating) {
      case 'SUPER_GENTLE':
        return {
          color: '#10B981', // Soft green
          icon: CheckCircle,
          bg: '#10B98120',
          label: 'Super Gentle'
        };
      case 'GENTLE':
        return {
          color: colors.mint,
          icon: CheckCircle,
          bg: colors.mint + '20',
          label: 'Gentle'
        };
      case 'MILD_CAUTION':
        return {
          color: colors.yellow,
          icon: AlertCircle,
          bg: colors.yellow + '20',
          label: 'Mild Caution'
        };
      case 'CAUTION':
        return {
          color: '#F59E0B', // Amber
          icon: AlertCircle,
          bg: '#F59E0B20',
          label: 'Caution'
        };
      case 'NOT_IDEAL':
        return {
          color: '#F97316', // Orange-red
          icon: XCircle,
          bg: '#F9731620',
          label: 'Not Ideal'
        };
      case 'AVOID':
        return {
          color: colors.red,
          icon: XCircle,
          bg: colors.red + '20',
          label: 'Avoid for Child'
        };
      default:
        return {
          color: colors.charcoal,
          icon: Info,
          bg: colors.charcoal + '20',
          label: 'Unknown'
        };
    }
  };

  const safetyStyle = scoring ? getSafetyStyle(scoring.rating) : getSafetyStyle('UNKNOWN');

  // Load children and save product to history when viewed
  useEffect(() => {
    const loadData = async () => {
      try {
        // Save to history
        await saveScannedProduct({
          barcode: barcode as string,
          name: name as string,
          brand: brand as string,
          category: category as string,
          imageUrl: imageUrl as string,
          ingredientsText: ingredients.rawText || '',
        });

        // Load children if user is a parent
        if (user?.id) {
          const childrenData = await getChildren(user.id);
          setChildren(childrenData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (barcode && name && brand) {
      loadData();
    }
  }, [barcode, name, brand, category, imageUrl, user?.id]);

  // Load reviews and summary separately - only when barcode changes
  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      if (!barcode) return;

      setLoadingReviews(true);
      try {
        // Load reviews and summary in parallel
        const [reviewsData, summaryData] = await Promise.all([
          getProductReviews(barcode as string, user?.id),
          getProductReviewSummary(barcode as string),
        ]);

        if (!cancelled) {
          setReviews(reviewsData);
          setReviewSummary(summaryData);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        if (!cancelled) {
          setReviews([]);
          setReviewSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingReviews(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [barcode, user?.id]);

  // Get confidence level styling
  const getConfidenceStyle = () => {
    const conf = parseFloat(confidence as string) || 0;
    if (conf >= 0.8) {
      return { color: colors.mint, label: 'High confidence', bg: colors.mint + '20' };
    } else if (conf >= 0.5) {
      return { color: '#F59E0B', label: 'Medium confidence', bg: '#F59E0B20' };
    } else {
      return { color: colors.charcoal, label: 'Check the label', bg: colors.charcoal + '20' };
    }
  };

  const confidenceStyle = getConfidenceStyle();

  // Handle sharing product
  const handleShare = async () => {
    try {
      const shareMessage = `Check out this product: ${brand} - ${name}\n\nSafety Rating: ${scoring?.riskScore || 'N/A'}/100\n\nScanned with Freshies App`;

      // For now, just show an alert. In production, use React Native Share API
      Alert.alert(
        'Share Product',
        shareMessage,
        [
          { text: 'OK' }
        ]
      );

      // TODO: Implement actual sharing with Share API
      // const result = await Share.share({
      //   message: shareMessage,
      //   url: imageUrl as string,
      //   title: `${brand} - ${name}`,
      // });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle adding/removing from wishlist
  const handleBookmark = async (targetProfileId?: string) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to save products.');
      return;
    }

    // If no target specified and we have children, show selector
    if (!targetProfileId && children.length > 0 && !isBookmarked) {
      Alert.alert(
        'Add to Wishlist',
        'Who is this wishlist for?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Myself', onPress: () => handleBookmark(user.id) },
          ...children.map(child => ({
            text: child.display_name,
            onPress: () => handleBookmark(child.id),
          })),
        ]
      );
      return;
    }

    const profileId = targetProfileId || user.id;
    setAddingToWishlist(true);
    try {
      if (isBookmarked && wishlistItemId) {
        // Remove from wishlist
        await removeFromWishlist(wishlistItemId);
        setIsBookmarked(false);
        setWishlistItemId(null);
        Alert.alert('Removed', `${name} removed from wishlist.`);
      } else {
        // Add to wishlist
        const newItem = await addToWishlist({
          profile_id: profileId,
          user_id: user.id,
          product_barcode: barcode as string,
          product_name: name as string,
          product_brand: brand as string,
          product_image_url: imageUrl as string,
          product_category: category as string,
          safety_score: scoring?.riskScore,
          safety_rating: scoring?.rating,
        });
        if (newItem) {
          setIsBookmarked(true);
          setWishlistItemId(newItem.id);
          const childName = children.find(c => c.id === profileId)?.display_name;
          Alert.alert('Saved! 💜', `${name} added to ${childName || 'your'} wishlist.`);
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist.');
    } finally {
      setAddingToWishlist(false);
    }
  };

  // Check if product is already in wishlist on load
  useEffect(() => {
    const checkWishlist = async () => {
      if (!user?.id || !barcode) return;
      const existing = await isInWishlist(user.id, barcode as string);
      if (existing) {
        setIsBookmarked(true);
        setWishlistItemId(existing.id);
      }
    };
    checkWishlist();
  }, [user?.id, barcode]);

  // Handle adding product to child's library
  const handleAddToChild = async (child: ChildProfile) => {
    setAddingProduct(true);

    try {
      // Check if product already exists for this child
      const { data: existingProduct, error: checkError } = await supabase
        .from('child_products')
        .select('id')
        .eq('child_id', child.id)
        .eq('product_name', name as string)
        .eq('product_brand', brand as string)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingProduct) {
        Alert.alert(
          'Already Added',
          `${name} is already in ${child.first_name}'s product library.`
        );
        setShowChildSelector(false);
        setAddingProduct(false);
        return;
      }

      // Add product to child's library
      const { error: insertError } = await supabase
        .from('child_products')
        .insert({
          child_id: child.id,
          product_id: barcode as string,
          product_name: name as string,
          product_brand: brand as string,
          product_image_url: imageUrl as string,
          product_category: category as string,
          status: 'active',
        });

      if (insertError) throw insertError;

      Alert.alert(
        'Success! ✓',
        `${name} has been added to ${child.first_name}'s product library.`,
        [
          { text: 'OK', onPress: () => setShowChildSelector(false) }
        ]
      );
    } catch (error) {
      console.error('Error adding product to child:', error);
      Alert.alert(
        'Error',
        'Failed to add product. Please try again.'
      );
    } finally {
      setAddingProduct(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        {/* BLACK BANNER - Product Info + Scan Again */}
        <View style={[styles.blackBanner, { paddingTop: insets.top + spacing[2] }]}>
          <View style={styles.blackBannerContent}>
            {/* Product Thumbnail */}
            {imageUrl && (
              <Image
                source={{ uri: imageUrl as string }}
                style={styles.scanThumbnail}
              />
            )}

            {/* Product Info */}
            <View style={styles.blackBannerInfo}>
              <Text style={styles.blackBannerBrand}>{toSentenceCase(brand as string)}</Text>
              <Text style={styles.blackBannerName} numberOfLines={1}>{toSentenceCase(name as string)}</Text>
            </View>

            {/* Scan Again Button */}
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => router.back()}
            >
              <Text style={styles.scanAgainButtonText}>Scan again</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.notRightProductHint}>Not the right product?</Text>
        </View>

        {/* PURPLE BANNER - Add Ingredients (Scenarios 2 & 3 only) */}
        {(() => {
          const hasIngredients = ingredients.normalised && ingredients.normalised.length > 0;
          const isFullDbMatch = sourceType === 'database';
          const isDbIncomplete = sourceType === 'database_incomplete';
          const isAiIdentifiedOnly = sourceType === 'ai_identified';

          // Scenario 4: Full DB match with ingredients - NO BANNER
          if (isFullDbMatch && hasIngredients) return null;

          // Scenario 2: AI identified, not in DB - show "New product" banner
          if (isAiIdentifiedOnly) {
            return (
              <View style={styles.purpleBanner}>
                <View style={styles.purpleBannerContent}>
                  <View style={styles.purpleBannerTextSection}>
                    <Text style={styles.purpleBannerTitle}>New product!</Text>
                    <Text style={styles.purpleBannerSubtitle}>Help us add it to Freshies</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addIngredientsButton}
                    onPress={() => {
                      router.push({
                        pathname: '/product-not-found/capture',
                        params: {
                          productName: name as string,
                          productBrand: brand as string,
                          existingImageUri: imageUrl as string,
                          mode: 'add_ingredients',
                        },
                      });
                    }}
                  >
                    <Text style={styles.addIngredientsButtonText}>📸 Add ingredients</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          // Scenario 3: DB match but missing ingredients - show "Complete profile" banner
          if (isDbIncomplete || (isFullDbMatch && !hasIngredients)) {
            return (
              <View style={styles.purpleBanner}>
                <View style={styles.purpleBannerContent}>
                  <View style={styles.purpleBannerTextSection}>
                    <Text style={styles.purpleBannerTitle}>Missing ingredients</Text>
                    <Text style={styles.purpleBannerSubtitle}>Help complete this product</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addIngredientsButton}
                    onPress={() => {
                      router.push({
                        pathname: '/product-not-found/capture',
                        params: {
                          productName: name as string,
                          productBrand: brand as string,
                          existingImageUri: imageUrl as string,
                          mode: 'add_ingredients',
                        },
                      });
                    }}
                  >
                    <Text style={styles.addIngredientsButtonText}>📸 Add ingredients</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return null;
        })()}

        {/* Hero Section - Large Image with Back Button */}
        <View style={styles.heroSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft color={colors.white} size={28} />
          </TouchableOpacity>

          {/* Action Buttons - Top Right */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionButton} onPress={handleShare}>
              <Share2 size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => handleBookmark()}
            >
              <Bookmark
                size={20}
                color={colors.white}
                fill={isBookmarked ? colors.white : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroActionButton}
              onPress={() => {
                Alert.alert(
                  'Add to Comparison',
                  'This product will be added to your comparison list',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Add & Compare',
                      onPress: () => {
                        // TODO: Add to comparison storage
                        router.push('/compare');
                      }
                    },
                  ]
                );
              }}
            >
              <Scale size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {imageUrl && (
            <View style={styles.heroImageContainer}>
              <Image source={{ uri: imageUrl as string }} style={styles.heroImage} />
              {scoring && (() => {
                const getRiskColor = (score: number) => {
                  if (score <= 10) return colors.riskVeryLow;
                  if (score <= 25) return colors.riskLow;
                  if (score <= 40) return colors.riskMedLow;
                  if (score <= 60) return colors.riskMedium;
                  if (score <= 75) return colors.riskMedHigh;
                  return colors.riskHigh;
                };
                const bgColor = getRiskColor(scoring.riskScore);

                return (
                  <TouchableOpacity
                    style={[styles.heroScoreBadge, { backgroundColor: bgColor }]}
                    onLongPress={() => {
                      Alert.alert(
                        'Developer Option',
                        'Clear this product and re-scan to get updated AI analysis?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Clear & Re-scan',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                const { deleteScannedProduct, getScannedProductByBarcode } = await import('../../src/services/storage/scannedProducts');
                                const product = await getScannedProductByBarcode(barcode as string);
                                if (product) {
                                  await deleteScannedProduct(product.id);
                                }
                                // Navigate back to scanner
                                router.push('/(parent)/(tabs)/scan');
                              } catch (error) {
                                console.error('Error clearing product:', error);
                                Alert.alert('Error', 'Failed to clear product cache');
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.heroScoreText}>{scoring.riskScore}/100</Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.productInfoSection}>

          {/* Product Info Card */}
          <View style={styles.infoCard}>
            {/* Brand */}
            <Text style={styles.brand}>{toSentenceCase(brand as string)}</Text>

            {/* Product Name */}
            <Text style={styles.productName}>{toSentenceCase(name as string)}</Text>

            {/* Size/Quantity */}
            {size && <Text style={styles.productSize}>{size}</Text>}

            {/* Description/Subtext */}
            {description && <Text style={styles.productDescription}>{description}</Text>}

            {/* Category & Confidence Row */}
            <View style={styles.metaRow}>
              {/* Only show category if it's in English (no language prefix like fr:, de:, etc.) */}
              {category && !String(category).includes(':') && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{toSentenceCase(category as string)}</Text>
                </View>
              )}
              {confidence && parseFloat(confidence as string) > 0 && (
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {(parseFloat(confidence as string) * 100).toFixed(0)}% match
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Profile Switcher */}
          {children.length > 0 && (
            <View style={styles.profileSwitcher}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.profileSwitcherContent}
              >
                <TouchableOpacity
                  style={[
                    styles.profileButton,
                    selectedProfile === 'general' && styles.profileButtonActive
                  ]}
                  onPress={() => setSelectedProfile('general')}
                >
                  <Text style={[
                    styles.profileButtonText,
                    selectedProfile === 'general' && styles.profileButtonTextActive
                  ]}>
                    General
                  </Text>
                </TouchableOpacity>

                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.profileButton,
                      selectedProfile === child.id && styles.profileButtonActive
                    ]}
                    onPress={() => setSelectedProfile(child.id)}
                  >
                    <Text style={[
                      styles.profileButtonText,
                      selectedProfile === child.id && styles.profileButtonTextActive
                    ]}>
                      {child.first_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* General Rating Badge */}
          {scoring && (() => {
            // Get background color based on risk score (inverted - lower is better)
            const getRiskColor = (score: number) => {
              if (score <= 10) return colors.riskVeryLow;      // Green - Very safe
              if (score <= 25) return colors.riskLow;          // Lime - Safe
              if (score <= 40) return colors.riskMedLow;       // Yellow - Mostly safe
              if (score <= 60) return colors.riskMedium;       // Amber - Caution
              if (score <= 75) return colors.riskMedHigh;      // Orange - Concern
              return colors.riskHigh;                          // Red - High concern
            };

            const bgColor = getRiskColor(scoring.riskScore);
            const textColor = scoring.riskScore <= 40 ? colors.black : colors.white;

            return (
              <View style={[styles.generalRatingBadge, { backgroundColor: bgColor }]}>
                <View style={styles.ratingContent}>
                  <View style={styles.ratingTopRow}>
                    <Text style={[styles.ratingLabel, { color: textColor, opacity: 0.8 }]}>SAFETY RATING</Text>
                    <View style={[styles.ratingScorePill, { backgroundColor: textColor === colors.black ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                      <Text style={[styles.ratingScorePillText, { color: textColor }]}>{scoring.riskScore}/100</Text>
                    </View>
                  </View>

                  <Text style={[styles.ratingTierName, { color: textColor }]}>
                    {safetyStyle.label}
                  </Text>

                  <Text style={[styles.ratingSupportingText, { color: textColor, opacity: 0.9 }]}>
                    {scoring.riskScore <= 10 && 'Very safe formula with simple, gentle ingredients'}
                    {scoring.riskScore > 10 && scoring.riskScore <= 25 && 'Suitable for most kids with minimal concerns'}
                    {scoring.riskScore > 25 && scoring.riskScore <= 40 && 'Mostly fine with one or two mild concerns'}
                    {scoring.riskScore > 40 && scoring.riskScore <= 60 && 'Clear concerns depending on child and usage'}
                    {scoring.riskScore > 60 && scoring.riskScore <= 75 && 'Better alternatives exist for sensitive skin'}
                    {scoring.riskScore > 75 && 'Contains strong irritants or high-risk ingredients'}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Child Chips - Only show when a child is selected */}
          {selectedProfile !== 'general' && (() => {
            const selectedChild = children.find(c => c.id === selectedProfile);
            if (!selectedChild) return null;

            return (
              <View style={styles.childChipsContainer}>
                {/* Age chip */}
                <View style={[styles.childChip, { backgroundColor: colors.mint + '20', borderColor: colors.mint }]}>
                  <Text style={[styles.childChipText, { color: colors.mint }]}>
                    Fine for age {selectedChild.age}
                  </Text>
                </View>

                {/* Skin type chip */}
                {(selectedChild as any).skin_type && (
                  <View style={[styles.childChip, { backgroundColor: colors.purple + '15', borderColor: colors.purple }]}>
                    <Text style={[styles.childChipText, { color: colors.purple }]}>
                      {(selectedChild as any).skin_type === 'sensitive' ? 'Sensitive skin' :
                        (selectedChild as any).skin_type === 'dry' ? 'Dry skin' :
                          (selectedChild as any).skin_type === 'oily' ? 'Oily skin' : 'Normal skin'}
                    </Text>
                  </View>
                )}

                {/* Allergy warnings */}
                {(selectedChild as any).allergies && (selectedChild as any).allergies.length > 0 && (
                  <View style={[styles.childChip, { backgroundColor: colors.red + '15', borderColor: colors.red }]}>
                    <AlertCircle size={14} color={colors.red} />
                    <Text style={[styles.childChipText, { color: colors.red, marginLeft: 4 }]}>
                      Check allergies
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Child Summary Panel - Only show when a child is selected */}
          {selectedProfile !== 'general' && (() => {
            const selectedChild = children.find(c => c.id === selectedProfile);
            if (!selectedChild) return null;

            return (
              <View style={styles.childSummaryPanel}>
                <Text style={styles.childSummaryTitle}>
                  How this looks for {selectedChild.first_name}
                </Text>

                <Text style={styles.childSummaryText}>
                  Based on {selectedChild.first_name}'s profile, here's what you should know about this product.
                </Text>

                <View style={styles.childSummaryPoints}>
                  {/* Age consideration with product-specific guidance */}
                  <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryPointText}>
                      <Text style={{ fontWeight: '600' }}>Age {selectedChild.age}:</Text> {
                        (() => {
                          const riskScore = scoring?.riskScore || 0;
                          const age = selectedChild.age;

                          // Under 3 - very cautious
                          if (age < 3) {
                            if (riskScore > 40) return 'Not recommended - this product has ingredients that may be too harsh for toddler skin. Look for products specifically labeled for babies/toddlers.';
                            if (riskScore > 20) return 'Use with caution - test on a small area first and watch for any redness or irritation.';
                            return 'Should be fine, but always do a patch test first with very young children.';
                          }

                          // Ages 3-7 - gentle needed
                          if (age < 8) {
                            if (riskScore > 60) return 'Not ideal for this age - contains ingredients that could irritate young skin. Consider gentler alternatives.';
                            if (riskScore > 40) return 'Some concerns - watch for fragrances and strong surfactants which can dry out young skin.';
                            if (riskScore > 20) return 'Generally okay, but monitor for any signs of dryness or irritation after use.';
                            return 'Good choice for this age - gentle formula suitable for young skin.';
                          }

                          // Ages 8-12 - more tolerant but still developing
                          if (age < 13) {
                            if (riskScore > 70) return 'Not recommended - this product has strong ingredients. At this age, skin is still developing and needs gentler care.';
                            if (riskScore > 50) return 'Some ingredients may be too strong. If using, start with less frequent application and watch for reactions.';
                            if (riskScore > 30) return 'Should be fine with normal use, but avoid if skin becomes irritated or dry.';
                            return 'Suitable for this age - skin can handle this formula well.';
                          }

                          // Teens 13+ - can handle more but still need guidance
                          if (riskScore > 75) return 'Not ideal even for teen skin - contains harsh ingredients that could cause irritation or disrupt skin barrier.';
                          if (riskScore > 50) return 'Use carefully - teen skin can be sensitive due to hormonal changes. Start slow and monitor results.';
                          if (riskScore > 30) return 'Should work well, but watch for any breakouts or irritation, especially if skin is going through changes.';
                          return 'Good match for teen skin - formula should work well at this age.';
                        })()
                      }
                    </Text>
                  </View>

                  {/* Skin type consideration */}
                  {(selectedChild as any).skin_type && (
                    <View style={styles.summaryPoint}>
                      <Text style={styles.summaryBullet}>•</Text>
                      <Text style={styles.summaryPointText}>
                        <Text style={{ fontWeight: '600' }}>{(selectedChild as any).skin_type === 'sensitive' ? 'Sensitive' : (selectedChild as any).skin_type} skin:</Text> {
                          (selectedChild as any).skin_type === 'sensitive' ? 'Avoid fragrances and strong surfactants' :
                            (selectedChild as any).skin_type === 'dry' ? 'Look for moisturizing ingredients' :
                              (selectedChild as any).skin_type === 'oily' ? 'Lightweight, non-comedogenic formulas work best' :
                                'Most products should work well'
                        }
                      </Text>
                    </View>
                  )}

                  {/* Allergy consideration */}
                  {(selectedChild as any).allergies && (selectedChild as any).allergies.length > 0 && (
                    <View style={styles.summaryPoint}>
                      <Text style={styles.summaryBullet}>•</Text>
                      <Text style={styles.summaryPointText}>
                        <Text style={{ fontWeight: '600' }}>Allergies:</Text> Check ingredients carefully for {(selectedChild as any).allergies.join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Product type consideration */}
                  <View style={styles.summaryPoint}>
                    <Text style={styles.summaryBullet}>•</Text>
                    <Text style={styles.summaryPointText}>
                      <Text style={{ fontWeight: '600' }}>Product type:</Text> {
                        (typeof category === 'string' && category.toLowerCase().includes('sunscreen')) ? 'Sunscreen - reapply every 2 hours' :
                          (typeof category === 'string' && category.toLowerCase().includes('cleanser')) ? 'Cleanser - rinse thoroughly' :
                            (typeof category === 'string' && category.toLowerCase().includes('moisturizer')) ? 'Moisturizer - apply to damp skin' :
                              'Follow product instructions for best results'
                      }
                    </Text>
                  </View>
                </View>
              </View>
            );
          })()}


          {/* Key Reasons Panel */}
          {scoring && scoring.reasons && scoring.reasons.length > 0 && (
            <View style={styles.keyReasonsPanel}>
              <Text style={styles.keyReasonsTitle}>Why we rated it this way</Text>

              {scoring.reasons.slice(0, 4).map((reason: any, index: number) => {
                const IconComponent = reason.severity === 'HIGH' ? AlertCircle :
                  reason.severity === 'MEDIUM' ? Info :
                    CheckCircle;
                const iconColor = reason.severity === 'HIGH' ? colors.riskHigh :
                  reason.severity === 'MEDIUM' ? colors.riskMedium :
                    colors.mint;

                return (
                  <View key={index} style={styles.reasonItem}>
                    <View style={[styles.reasonIconCircle, { backgroundColor: iconColor + '30' }]}>
                      <IconComponent color={colors.white} size={22} />
                    </View>

                    <View style={styles.reasonTextContainer}>
                      <Text style={styles.reasonHeading}>
                        {reason.ingredient || reason.code.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.reasonExplanation}>
                        {reason.detail}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Ingredients Summary + List */}
          <View style={styles.ingredientsSection}>
            {ingredients.normalised && ingredients.normalised.length > 0 ? (
              <>
                <TouchableOpacity
                  style={styles.ingredientsSummaryHeader}
                  onPress={() => setIngredientsExpanded(!ingredientsExpanded)}
                >
                  <View style={styles.ingredientsSummaryContent}>
                    <Text style={styles.ingredientsHeaderTitle}>
                      Ingredients ({ingredients.normalised.length})
                    </Text>
                    <Text style={styles.ingredientsSummaryText}>
                      {ingredients.normalised.filter((ing: any) => ing.safetyRating <= 10).length} low concern • {' '}
                      {ingredients.normalised.filter((ing: any) => ing.safetyRating > 10 && ing.safetyRating <= 30).length} mild • {' '}
                      {ingredients.normalised.filter((ing: any) => ing.safetyRating > 30 && ing.safetyRating <= 60).length} medium • {' '}
                      {ingredients.normalised.filter((ing: any) => ing.safetyRating > 60).length} high concern
                    </Text>
                  </View>
                  {ingredientsExpanded ? (
                    <ChevronUp size={24} color={colors.white} />
                  ) : (
                    <ChevronDown size={24} color={colors.white} />
                  )}
                </TouchableOpacity>

                {/* Grouped Ingredients List */}
                {ingredientsExpanded && (() => {
                  // Helper functions
                  const getConcernStyle = (rating: number) => {
                    if (rating <= 10) return { color: colors.mint, label: 'Low', bg: colors.mint + '15' };
                    if (rating <= 30) return { color: colors.yellow, label: 'Mild', bg: colors.yellow + '15' };
                    if (rating <= 60) return { color: '#F59E0B', label: 'Medium', bg: '#F59E0B15' };
                    return { color: colors.red, label: 'High', bg: colors.red + '15' };
                  };

                  const getRole = (flags: string[]) => {
                    if (!flags || flags.length === 0) return 'Ingredient';
                    if (flags.includes('FRAGRANCE')) return 'Fragrance';
                    if (flags.includes('SULFATE_SURFACTANT') || flags.includes('STRONG_SURFACTANT')) return 'Foaming cleanser';
                    if (flags.includes('PARABEN')) return 'Preservative';
                    return 'Ingredient';
                  };

                  // Group ingredients by concern level
                  const lowConcern = ingredients.normalised.filter((ing: any) => (ing.safetyRating || 0) <= 10);
                  const mildConcern = ingredients.normalised.filter((ing: any) => (ing.safetyRating || 0) > 10 && (ing.safetyRating || 0) <= 30);
                  const mediumConcern = ingredients.normalised.filter((ing: any) => (ing.safetyRating || 0) > 30 && (ing.safetyRating || 0) <= 60);
                  const highConcern = ingredients.normalised.filter((ing: any) => (ing.safetyRating || 0) > 60);

                  const toggleGroup = (groupTitle: string) => {
                    const newExpanded = new Set(expandedGroups);
                    if (newExpanded.has(groupTitle)) {
                      newExpanded.delete(groupTitle);
                    } else {
                      newExpanded.add(groupTitle);
                    }
                    setExpandedGroups(newExpanded);
                  };

                  const renderIngredientGroup = (title: string, items: any[], concernStyle: any) => {
                    if (items.length === 0) return null;
                    const isExpanded = expandedGroups.has(title);

                    return (
                      <View key={title} style={styles.ingredientGroup}>
                        <TouchableOpacity
                          style={[styles.ingredientGroupHeader, { backgroundColor: concernStyle.bg }]}
                          onPress={() => toggleGroup(title)}
                        >
                          <View style={styles.ingredientGroupHeaderLeft}>
                            <View style={[styles.groupDot, { backgroundColor: concernStyle.color }]} />
                            <Text style={styles.ingredientGroupTitle}>{title} ({items.length})</Text>
                          </View>
                          {isExpanded ? (
                            <ChevronUp size={20} color={concernStyle.color} />
                          ) : (
                            <ChevronDown size={20} color={concernStyle.color} />
                          )}
                        </TouchableOpacity>
                        {isExpanded && items.map((ing: any, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.ingredientRow}
                            onPress={() => setSelectedIngredient(ing)}
                          >
                            <View style={styles.ingredientInfo}>
                              <Text style={styles.ingredientNameText}>{ing.canonicalName}</Text>
                              <Text style={styles.ingredientRole}>{getRole(ing.flags)}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  };

                  return (
                    <View style={styles.ingredientsList}>
                      {renderIngredientGroup('Low Concern', lowConcern, getConcernStyle(5))}
                      {renderIngredientGroup('Mild Concern', mildConcern, getConcernStyle(20))}
                      {renderIngredientGroup('Medium Concern', mediumConcern, getConcernStyle(45))}
                      {renderIngredientGroup('High Concern', highConcern, getConcernStyle(80))}
                    </View>
                  );
                })()}
              </>
            ) : (
              /* No ingredients - show scan prompt */
              <View style={styles.ingredientsSummaryHeader}>
                <View style={styles.ingredientsSummaryContent}>
                  <Text style={styles.ingredientsHeaderTitle}>
                    Ingredients
                  </Text>
                  <Text style={styles.ingredientsSummaryText}>
                    No ingredient data yet
                  </Text>
                </View>
              </View>
            )}

            {/* Prompt to add ingredients if missing */}
            {(!ingredients.normalised || ingredients.normalised.length === 0) && (
              <TouchableOpacity
                style={styles.addIngredientsButton}
                onPress={() => {
                  Alert.alert(
                    'Add Ingredients',
                    'Take a photo of the ingredients list on the back of the product to get a full safety analysis.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Scan Ingredients', onPress: () => router.back() }
                    ]
                  );
                }}
              >
                <Text style={styles.addIngredientsButtonText}>📷 Scan ingredient list</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Reviews Section */}
          <View style={styles.reviewsSection}>
            <Text style={styles.reviewsSectionTitle}>What other parents say</Text>
            <Text style={styles.reviewsSectionSubtitle}>Shared anonymously by Freshies parents</Text>

            {/* Review Statistics */}
            {reviewSummary && reviewSummary.total_reviews > 0 && (
              <ReviewStatistics summary={reviewSummary} />
            )}

            {loadingReviews ? (
              <View style={styles.reviewsLoading}>
                <ActivityIndicator size="small" color={colors.purple} />
                <Text style={styles.reviewsLoadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewsEmpty}>
                <Text style={styles.reviewsEmptyText}>
                  No reviews yet. Be the first to share your experience!
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map(review => {
                  const experienceLabels = {
                    worked_well: '✅ Worked well',
                    somewhat: '😐 Somewhat',
                    no_irritation: '❌ No / Irritation',
                  };

                  const contextParts = [];
                  if (review.child_age) contextParts.push(`Age ${review.child_age}`);
                  if (review.child_skin_type) contextParts.push(`${review.child_skin_type} skin`);
                  if (review.child_allergies && review.child_allergies.length > 0) {
                    contextParts.push(`Allergies: ${review.child_allergies.join(', ')}`);
                  }
                  const context = contextParts.length > 0 ? contextParts.join(' • ') : 'Parent';

                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewExperienceBadge}>
                        <Text style={styles.reviewExperienceText}>
                          {experienceLabels[review.experience_rating]}
                        </Text>
                      </View>

                      {review.review_text && (
                        <Text style={styles.reviewText}>"{review.review_text}"</Text>
                      )}

                      <View style={styles.reviewMeta}>
                        <Text style={styles.reviewContext}>{context}</Text>
                        <View style={styles.reviewHelpfulActions}>
                          <TouchableOpacity
                            style={styles.reviewHelpfulButton}
                            onPress={async () => {
                              if (!user) {
                                Alert.alert('Sign in required', 'Please sign in to mark reviews as helpful');
                                return;
                              }
                              try {
                                await markReviewHelpful(review.id, user.id, true);
                                // Reload reviews and summary
                                const [updatedReviews, updatedSummary] = await Promise.all([
                                  getProductReviews(barcode as string, user.id),
                                  getProductReviewSummary(barcode as string),
                                ]);
                                setReviews(updatedReviews);
                                setReviewSummary(updatedSummary);
                              } catch (error) {
                                console.error('Error marking helpful:', error);
                              }
                            }}
                          >
                            <ThumbsUp
                              size={16}
                              color={review.user_helpfulness_vote === true ? colors.purple : colors.charcoal}
                              fill={review.user_helpfulness_vote === true ? colors.purple : 'none'}
                            />
                            <Text style={styles.reviewHelpfulCount}>{review.helpful_count}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Share Your Experience Button */}
            <TouchableOpacity
              style={styles.shareExperienceButton}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.shareExperienceButtonText}>Share your experience</Text>
            </TouchableOpacity>
          </View>

          {/* Review Submission Modal */}
          <ReviewSubmissionModal
            visible={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            onSubmit={async (reviewData: CreateReviewRequest, rating?: number) => {
              if (!user) return;

              // Submit review
              await createReview(reviewData, user.id);

              // Submit rating if provided
              if (rating && rating > 0) {
                await rateProduct({
                  product_barcode: barcode as string,
                  rating,
                  child_id: reviewData.child_id,
                }, user.id);
              }

              // Reload reviews and summary
              const [updatedReviews, updatedSummary] = await Promise.all([
                getProductReviews(barcode as string, user.id),
                getProductReviewSummary(barcode as string),
              ]);
              setReviews(updatedReviews);
              setReviewSummary(updatedSummary);
            }}
            productBarcode={barcode as string}
            productName={name as string}
            productBrand={brand as string}
            children={children}
          />

          {/* Ask FreshiesAI */}
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => {
              // Set product context first
              useChatContextStore.getState().setLastScannedProduct({
                name: name as string,
                brand: brand as string,
                category: category as string,
                ingredients_raw: ingredients.rawText || '',
                barcode: barcode as string,
                image_url: imageUrl as string,
              });
              // Then open chat with auto-submitted question
              openChatWithQuestion(`Is ${name} by ${brand} safe and suitable for my child?`);
            }}
          >
            <View style={styles.aiButtonIcon}>
              <Brain size={20} color={colors.white} />
            </View>
            <View style={styles.aiButtonContent}>
              <Text style={styles.aiButtonTitle}>Ask FreshiesAI about this product</Text>
              <Text style={styles.aiButtonSubtitle}>Get instant answers and recommendations</Text>
            </View>
          </TouchableOpacity>

          {/* Feedback Strip */}
          <View style={styles.feedbackStrip}>
            <Text style={styles.feedbackQuestion}>Does this feel right for your child?</Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity style={styles.feedbackButton}>
                <Text style={styles.feedbackButtonText}>Makes sense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackButton}>
                <Text style={styles.feedbackButtonText}>Too strict</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackButton}>
                <Text style={styles.feedbackButtonText}>Too soft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.feedbackButton}>
                <Text style={styles.feedbackButtonText}>Something's wrong</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (children.length === 0) {
                  Alert.alert(
                    'No Children Added',
                    'Please add a child to your family first.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Add Child', onPress: () => router.push('/family/add-child' as any) }
                    ]
                  );
                } else if (children.length === 1) {
                  // Directly add to the only child
                  handleAddToChild(children[0]);
                } else {
                  // Show child selector
                  setShowChildSelector(true);
                }
              }}
              disabled={addingProduct}
            >
              <Text style={styles.primaryButtonText}>
                {addingProduct ? 'Adding...' : 'Add to Child\'s Products'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* How Freshies Assesses - Expandable */}
          <View ref={assessmentSectionRef} style={styles.assessmentSection}>
            <TouchableOpacity
              style={styles.assessmentHeader}
              onPress={() => {
                const wasExpanded = ingredientsExpanded;
                setIngredientsExpanded(!ingredientsExpanded);
                // Scroll to section after expansion
                if (!wasExpanded) {
                  setTimeout(() => {
                    assessmentSectionRef.current?.measureLayout(
                      scrollViewRef.current as any,
                      (x, y) => {
                        scrollViewRef.current?.scrollTo({
                          y: y - 100,
                          animated: true
                        });
                      },
                      () => { }
                    );
                  }, 300);
                }
              }}
            >
              <Text style={styles.assessmentTitle}>How Freshies assesses products</Text>
              {ingredientsExpanded ? (
                <ChevronUp size={20} color={colors.charcoal} />
              ) : (
                <ChevronDown size={20} color={colors.charcoal} />
              )}
            </TouchableOpacity>

            {ingredientsExpanded && (
              <View style={styles.assessmentContent}>
                <Text style={styles.assessmentText}>
                  We read the ingredients list, match known irritants and allergens, and apply child-focused safety logic.
                </Text>
                <Text style={styles.assessmentText}>
                  This is informational guidance and not medical advice. Always consult your pediatrician or dermatologist for specific concerns.
                </Text>
                <Text style={styles.assessmentText}>
                  We show when data is incomplete or uncertain, and err on the side of caution for children's safety.
                </Text>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChildSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowChildSelector(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Child's Products</Text>
              <TouchableOpacity onPress={() => setShowChildSelector(false)}>
                <X size={24} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSubtitle}>Select which child to add this product for:</Text>

              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={styles.childOption}
                  onPress={() => handleAddToChild(child)}
                  disabled={addingProduct}
                >
                  <View style={styles.childOptionContent}>
                    <View style={[styles.childAvatar, { backgroundColor: colors.purple + '20' }]}>
                      <Users size={20} color={colors.purple} />
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childOptionName}>
                        {child.first_name} {child.last_name || ''}
                      </Text>
                      <Text style={styles.childOptionAge}>
                        Age {child.age} • {child.safety_tier} safety tier
                      </Text>
                    </View>
                  </View>
                  <ChevronDown size={20} color={colors.charcoal} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ingredient Detail Drawer */}
      {selectedIngredient && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedIngredient(null)}
          />
          <View style={styles.drawerContent}>
            <View style={styles.drawerHandle} />

            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{selectedIngredient.canonicalName}</Text>
              <TouchableOpacity onPress={() => setSelectedIngredient(null)}>
                <X size={24} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerScroll}>
              {(() => {
                // Get detailed ingredient info from database
                const ingredientInfo = getIngredientInfo(selectedIngredient.canonicalName);
                const genericInfo = getGenericIngredientInfo(selectedIngredient.flags);
                const info = ingredientInfo || genericInfo;

                return (
                  <>
                    {/* Safety Rating */}
                    <View style={styles.drawerSection}>
                      <Text style={styles.drawerSectionTitle}>SAFETY RATING</Text>
                      <View style={styles.drawerRatingRow}>
                        <Text style={styles.drawerRatingScore}>{selectedIngredient.safetyRating || 0}/100</Text>
                        <Text style={styles.drawerRatingLabel}>
                          {selectedIngredient.safetyRating <= 10 ? 'Low Concern' :
                            selectedIngredient.safetyRating <= 30 ? 'Mild Concern' :
                              selectedIngredient.safetyRating <= 60 ? 'Medium Concern' : 'High Concern'}
                        </Text>
                      </View>
                    </View>

                    {/* Category */}
                    {info.category && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>CATEGORY</Text>
                        <Text style={styles.drawerText}>{info.category}</Text>
                      </View>
                    )}

                    {/* Description */}
                    {info.description && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>WHAT IT IS</Text>
                        <Text style={styles.drawerText}>{info.description}</Text>
                      </View>
                    )}

                    {/* What it does */}
                    {info.whatItDoes && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>WHAT IT DOES</Text>
                        <Text style={styles.drawerText}>{info.whatItDoes}</Text>
                      </View>
                    )}

                    {/* Benefits */}
                    {ingredientInfo?.benefits && ingredientInfo.benefits.length > 0 && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>BENEFITS</Text>
                        {ingredientInfo.benefits.map((benefit, index) => (
                          <View key={index} style={styles.drawerBulletPoint}>
                            <Text style={styles.drawerBullet}>•</Text>
                            <Text style={styles.drawerText}>{benefit}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Concerns */}
                    {ingredientInfo?.concerns && ingredientInfo.concerns.length > 0 && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>POTENTIAL CONCERNS</Text>
                        {ingredientInfo.concerns.map((concern, index) => (
                          <View key={index} style={styles.drawerBulletPoint}>
                            <Text style={styles.drawerBullet}>•</Text>
                            <Text style={styles.drawerText}>{concern}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Child Safety */}
                    {info.childSafety && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>WHY FRESHIES NOTICES IT</Text>
                        {info.childSafety.ageRestrictions && (
                          <Text style={[styles.drawerText, { fontWeight: '600', marginBottom: spacing[2] }]}>
                            {info.childSafety.ageRestrictions}
                          </Text>
                        )}
                        <Text style={styles.drawerText}>{info.childSafety.notes}</Text>
                      </View>
                    )}

                    {/* Common Uses */}
                    {ingredientInfo?.commonUses && ingredientInfo.commonUses.length > 0 && (
                      <View style={styles.drawerSection}>
                        <Text style={styles.drawerSectionTitle}>COMMONLY FOUND IN</Text>
                        <View style={styles.drawerTagsContainer}>
                          {ingredientInfo.commonUses.map((use, index) => (
                            <View key={index} style={styles.drawerTag}>
                              <Text style={styles.drawerTagText}>{use}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Fun Fact */}
                    {ingredientInfo?.funFact && (
                      <View style={[styles.drawerSection, { borderBottomWidth: 0 }]}>
                        <Text style={styles.drawerSectionTitle}>DID YOU KNOW?</Text>
                        <Text style={[styles.drawerText, { fontStyle: 'italic' }]}>
                          {ingredientInfo.funFact}
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  // Scan Confirmation Strip
  scanConfirmationStrip: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  // Black Banner - Product Info + Scan Again
  blackBanner: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  blackBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  blackBannerInfo: {
    flex: 1,
  },
  blackBannerBrand: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  blackBannerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  scanAgainButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanAgainButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  notRightProductHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing[2],
  },
  // Purple Banner - Add Ingredients CTA
  purpleBanner: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  purpleBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  purpleBannerTextSection: {
    flex: 1,
  },
  purpleBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  purpleBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  addIngredientsButton: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  addIngredientsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  scanConfirmationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  scanThumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
  },
  scanProductInfo: {
    flex: 1,
    gap: spacing[1],
  },
  scanBrand: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scanNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  scanProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    flex: 1,
  },
  scanSize: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.charcoal,
  },
  confidencePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.full,
    marginTop: spacing[1],
  },
  confidencePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addPhotoButtonSmall: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.md,
    marginTop: spacing[1],
  },
  addPhotoButtonSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  wrongProductLink: {
    marginTop: spacing[2],
    alignSelf: 'flex-start',
  },
  wrongProductText: {
    fontSize: 13,
    color: colors.charcoal,
    textDecorationLine: 'underline',
  },
  heroSection: {
    position: 'relative',
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing[4],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  heroActions: {
    position: 'absolute',
    top: 60,
    right: spacing[4],
    flexDirection: 'row',
    gap: spacing[2],
    zIndex: 10,
  },
  heroActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.purple,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  heroImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroScoreBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroScoreText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.black,
  },
  productInfoSection: {
    backgroundColor: colors.white,
  },
  headerContainer: {
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
  closeButton: {
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
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[6],
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: radii.lg,
  },
  infoCard: {
    backgroundColor: colors.black,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[6],
  },
  // Profile Switcher
  profileSwitcher: {
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  profileSwitcherContent: {
    gap: spacing[2],
  },
  profileButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  profileButtonActive: {
    backgroundColor: colors.purple + '15',
    borderColor: colors.purple,
  },
  profileButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },
  profileButtonTextActive: {
    color: colors.purple,
  },
  // General Rating Badge
  generalRatingBadge: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    borderRadius: radii.lg,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingContent: {
    padding: spacing[6],
  },
  ratingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingScorePill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
  },
  ratingScorePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  ratingTierName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  ratingSupportingText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.charcoal,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mint,
    letterSpacing: 1,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[3],
    lineHeight: 30,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.cream,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  productSize: {
    fontSize: 14,
    color: '#888888', // Light grey for readability
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  categoryBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  categoryText: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '600',
  },
  confidenceBadge: {
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  confidenceText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  category: {
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  barcode: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
  },
  chipSuccess: {
    backgroundColor: 'rgba(184, 230, 213, 0.2)',
  },
  chipInfo: {
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  section: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[3],
  },
  // Key Reasons Panel
  keyReasonsPanel: {
    backgroundColor: colors.purple,
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[6],
    borderRadius: radii.lg,
  },
  keyReasonsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[5],
  },
  reasonItem: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  reasonIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'capitalize',
    marginBottom: spacing[1],
  },
  reasonExplanation: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  ingredientsCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  ingredientsText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 22,
  },
  comingSoonCard: {
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    padding: spacing[5],
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    borderRadius: radii.lg,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  aiButtonIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  aiButtonContent: {
    flex: 1,
  },
  aiButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  aiButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actions: {
    paddingHorizontal: spacing[6],
    marginTop: spacing[6],
  },
  primaryButton: {
    backgroundColor: colors.mint,
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.purple,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.purple,
  },
  // Safety Rating Styles
  safetyCard: {
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    padding: spacing[6],
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.charcoal,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  reasonsContainer: {
    marginTop: spacing[4],
    gap: spacing[3],
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[2],
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  reasonContent: {
    flex: 1,
  },
  reasonCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  reasonIngredient: {
    fontSize: 13,
    color: colors.purple,
    marginBottom: 2,
  },
  reasonDetail: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
  // Ingredients List Styles
  ingredientsList: {
    marginTop: spacing[2],
  },
  // Rating Section
  ratingSection: {
    backgroundColor: colors.white,
    padding: spacing[6],
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  starRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  starRating: {
    fontSize: 18,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.charcoal,
  },
  wouldBuyAgain: {
    fontSize: 14,
    color: colors.charcoal,
  },
  // Certifiers Section
  certifiersSection: {
    backgroundColor: colors.white,
    padding: spacing[6],
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    borderRadius: radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  certBadge: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.mist,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  certBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Ingredients Summary
  ingredientsSection: {
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
  },
  ingredientsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[6],
    backgroundColor: colors.mint,
    borderRadius: radii.lg,
  },
  ingredientsSummaryContent: {
    flex: 1,
  },
  ingredientsHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  ingredientsSummaryText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  ingredientBreakdown: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[3],
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    fontSize: 13,
    color: colors.charcoal,
    fontWeight: '500',
  },
  // Ingredient Row Styles
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  concernDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  ingredientRole: {
    fontSize: 13,
    color: colors.charcoal,
  },
  // Ingredient Groups
  ingredientGroup: {
    marginBottom: spacing[3],
  },
  ingredientGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    marginBottom: spacing[1],
  },
  ingredientGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  groupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ingredientGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
  },
  // Drawer Styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.cream,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  drawerScroll: {
    paddingHorizontal: spacing[6],
  },
  drawerSection: {
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  drawerSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  drawerRatingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[3],
  },
  drawerRatingScore: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.black,
  },
  drawerRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.charcoal,
  },
  drawerText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.charcoal,
  },
  drawerBulletPoint: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    paddingRight: spacing[4],
  },
  drawerBullet: {
    fontSize: 15,
    color: colors.purple,
    marginRight: spacing[2],
    fontWeight: '700',
  },
  drawerTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  drawerTag: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
  },
  drawerTagText: {
    fontSize: 13,
    color: colors.charcoal,
    fontWeight: '500',
  },
  // AI Card
  aiCard: {
    backgroundColor: colors.purple,
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    padding: spacing[5],
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.cream,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.cream,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    flex: 1,
  },
  modalScroll: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  // Child Option Styles
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.cream,
  },
  childOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  childInfo: {
    flex: 1,
  },
  childOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2,
  },
  childOptionAge: {
    fontSize: 13,
    color: colors.charcoal,
  },
  // Child Chips
  childChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  childChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Child Summary Panel
  childSummaryPanel: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  childSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  childSummaryText: {
    fontSize: 14,
    color: colors.charcoal,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  childSummaryPoints: {
    gap: spacing[3],
  },
  summaryPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryBullet: {
    fontSize: 16,
    color: colors.purple,
    marginRight: spacing[2],
    fontWeight: '700',
    marginTop: 2,
  },
  summaryPointText: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  // AI Identified Product Banner
  aiIdentifiedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: colors.purple + '15',
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.purple,
  },
  aiIdentifiedTextContainer: {
    flex: 1,
  },
  aiIdentifiedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[1],
  },
  aiIdentifiedText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    opacity: 0.8,
  },
  // Incomplete Data Card with Photo Capture
  incompleteDataCard: {
    backgroundColor: colors.purple + '12',
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.purple + '30',
  },
  incompleteDataHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  incompleteDataTextContainer: {
    flex: 1,
  },
  incompleteDataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple,
    marginBottom: spacing[1],
  },
  incompleteDataText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    opacity: 0.85,
  },
  captureIngredientsButton: {
    backgroundColor: colors.purple,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  captureIngredientsButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  captureIngredientsHint: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
    textAlign: 'center',
  },
  // Incomplete Data Banner
  incompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.cream,
    marginHorizontal: spacing[6],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.charcoal + '40',
  },
  incompleteBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
    opacity: 0.8,
  },
  // How Freshies Assesses
  assessmentSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    marginBottom: spacing[6],
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cream,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  assessmentContent: {
    padding: spacing[4],
    paddingTop: 0,
    gap: spacing[3],
  },
  assessmentText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  // Feedback Strip
  feedbackStrip: {
    backgroundColor: colors.cream,
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
    padding: spacing[5],
    borderRadius: radii.lg,
  },
  feedbackQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'center',
  },
  feedbackButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.charcoal + '30',
  },
  feedbackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  // User Reviews Section
  reviewsSection: {
    marginHorizontal: spacing[6],
    marginTop: spacing[6],
  },
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  reviewsSectionSubtitle: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.7,
    marginBottom: spacing[3],
  },
  reviewsList: {
    gap: spacing[3],
  },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cream,
  },
  reviewText: {
    fontSize: 15,
    color: colors.charcoal,
    lineHeight: 22,
    marginBottom: spacing[3],
    fontStyle: 'italic',
  },
  reviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewContext: {
    fontSize: 13,
    color: colors.charcoal,
    opacity: 0.6,
  },
  reviewHelpful: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewHelpfulText: {
    fontSize: 12,
    color: colors.charcoal,
    opacity: 0.6,
  },
  shareExperienceButton: {
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.purple,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  shareExperienceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple,
  },
  // Review states
  reviewsLoading: {
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  reviewsLoadingText: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.6,
  },
  reviewsEmpty: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  reviewsEmptyText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewExperienceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    marginBottom: spacing[2],
  },
  reviewExperienceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  reviewHelpfulActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  reviewHelpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  reviewHelpfulCount: {
    fontSize: 13,
    color: colors.charcoal,
    fontWeight: '600',
  },
});
