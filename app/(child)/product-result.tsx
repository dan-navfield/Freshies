/**
 * Child Product Result Screen
 * Kid-friendly product view matching parent styling with gamification elements
 */

import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, Animated, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Star, Sparkles, Heart, Camera, CheckCircle, AlertCircle, XCircle, Info, Share2, Bookmark } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { saveScannedProduct } from '../../src/services/storage/scannedProducts';
import { useAuth } from '../../src/contexts/AuthContext';

/**
 * Convert text to sentence case
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

/**
 * 6-tier safety rating system (matches parent)
 */
const getSafetyStyle = (rating: string) => {
    switch (rating) {
        case 'SUPER_GENTLE':
            return { color: '#10B981', icon: CheckCircle, bg: '#10B98120', label: 'Super Gentle', kidLabel: '✨ Super safe!' };
        case 'GENTLE':
            return { color: colors.mint, icon: CheckCircle, bg: colors.mint + '20', label: 'Gentle', kidLabel: '👍 Great for you!' };
        case 'MILD_CAUTION':
            return { color: colors.yellow, icon: AlertCircle, bg: colors.yellow + '20', label: 'Mild Caution', kidLabel: '😊 Mostly good' };
        case 'CAUTION':
            return { color: '#F59E0B', icon: AlertCircle, bg: '#F59E0B20', label: 'Caution', kidLabel: '🤔 Ask a parent' };
        case 'NOT_IDEAL':
            return { color: '#F97316', icon: XCircle, bg: '#F9731620', label: 'Not Ideal', kidLabel: '😬 Maybe not' };
        case 'AVOID':
            return { color: colors.red, icon: XCircle, bg: colors.red + '20', label: 'Avoid', kidLabel: '❌ Not for you' };
        default:
            return { color: colors.charcoal, icon: Info, bg: colors.charcoal + '20', label: 'Unknown', kidLabel: '❓ Unknown' };
    }
};

const getRiskColor = (score: number) => {
    if (score <= 10) return colors.riskVeryLow;
    if (score <= 25) return colors.riskLow;
    if (score <= 40) return colors.riskMedLow;
    if (score <= 60) return colors.riskMedium;
    if (score <= 75) return colors.riskMedHigh;
    return colors.riskHigh;
};

export default function ChildProductResultScreen() {
    const params = useLocalSearchParams();
    const { barcode, name, brand, category, size, imageUrl, confidence, ingredients: ingredientsJSON, scoring: scoringJSON, sourceType } = params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Parse data
    const scoring = scoringJSON ? JSON.parse(scoringJSON as string) : null;
    const ingredients = ingredientsJSON ? JSON.parse(ingredientsJSON as string) : { normalised: [], rawText: '' };
    const safetyStyle = scoring ? getSafetyStyle(scoring.rating) : getSafetyStyle('UNKNOWN');
    const hasIngredients = ingredients.normalised && ingredients.normalised.length > 0;
    const isAiIdentified = sourceType === 'ai_identified';

    // State
    const [pointsEarned, setPointsEarned] = useState(0);
    const [showPointsAnimation, setShowPointsAnimation] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myReview, setMyReview] = useState('');
    const [showReviewInput, setShowReviewInput] = useState(false);
    const [kidReviews, setKidReviews] = useState<any[]>([]);

    // Animation
    const pointsAnim = useRef(new Animated.Value(0)).current;

    // Save scan and award points
    useEffect(() => {
        const saveAndAwardPoints = async () => {
            try {
                await saveScannedProduct({
                    barcode: barcode as string,
                    name: name as string,
                    brand: brand as string,
                    category: category as string,
                    imageUrl: imageUrl as string || '',
                });

                const points = sourceType === 'ai_identified' ? 15 : 10;
                setPointsEarned(points);
                setShowPointsAnimation(true);

                Animated.sequence([
                    Animated.timing(pointsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.delay(2000),
                    Animated.timing(pointsAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => setShowPointsAnimation(false));
            } catch (error) {
                console.error('Error saving product:', error);
            }
        };

        saveAndAwardPoints();
    }, []);

    const handleAddToShelf = () => {
        Alert.alert('✨ Added to My Shelf!', `${name} is now on your product shelf.`, [{ text: 'Awesome!' }]);
    };

    const handleSubmitReview = () => {
        if (myRating === 0) {
            Alert.alert('Oops!', 'Tap the stars to rate this product first!');
            return;
        }
        Alert.alert('🎉 Thanks for your review!', 'You earned +5 bonus points!', [{ text: 'Cool!' }]);
        setShowReviewInput(false);
    };

    const bgColor = scoring ? getRiskColor(scoring.riskScore) : colors.charcoal;
    const textColor = scoring && scoring.riskScore <= 40 ? colors.black : colors.white;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                {/* BLACK BANNER - Product Info + Scan Again (matches parent) */}
                <View style={[styles.blackBanner, { paddingTop: insets.top + spacing[2] }]}>
                    <View style={styles.blackBannerContent}>
                        {imageUrl && <Image source={{ uri: imageUrl as string }} style={styles.scanThumbnail} />}
                        <View style={styles.blackBannerInfo}>
                            <Text style={styles.blackBannerBrand}>{toSentenceCase(brand as string)}</Text>
                            <Text style={styles.blackBannerName} numberOfLines={1}>{toSentenceCase(name as string)}</Text>
                        </View>
                        <TouchableOpacity style={styles.scanAgainButton} onPress={() => router.back()}>
                            <Text style={styles.scanAgainButtonText}>Scan again</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.notRightProductHint}>Not the right product?</Text>
                </View>

                {/* PURPLE BANNER - Add Ingredients (if missing) */}
                {(isAiIdentified || !hasIngredients) && (
                    <View style={styles.purpleBanner}>
                        <View style={styles.purpleBannerContent}>
                            <View style={styles.purpleBannerTextSection}>
                                <Text style={styles.purpleBannerTitle}>{isAiIdentified ? '🆕 New product!' : '📋 Missing ingredients'}</Text>
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
                )}

                {/* Points Earned Animation */}
                {showPointsAnimation && (
                    <Animated.View style={[styles.pointsBanner, { opacity: pointsAnim }]}>
                        <Sparkles size={20} color={colors.yellow} />
                        <Text style={styles.pointsText}>+{pointsEarned} points!</Text>
                        <Sparkles size={20} color={colors.yellow} />
                    </Animated.View>
                )}

                {/* Hero Section - Full Width Image */}
                <View style={styles.heroSection}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ChevronLeft color={colors.white} size={28} />
                    </TouchableOpacity>

                    {/* Action Buttons - Top Right */}
                    <View style={styles.heroActions}>
                        <TouchableOpacity style={styles.heroActionButton} onPress={() => {
                            Alert.alert('Share', 'Sharing coming soon!');
                        }}>
                            <Share2 size={20} color={colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.heroActionButton} onPress={() => {
                            Alert.alert('Saved!', 'Added to your favorites');
                        }}>
                            <Bookmark size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    {imageUrl && (
                        <View style={styles.heroImageContainer}>
                            <Image source={{ uri: imageUrl as string }} style={styles.heroImage} />
                            {/* Score Badge on Image */}
                            {scoring && (
                                <View style={[styles.heroScoreBadge, { backgroundColor: bgColor }]}>
                                    <Text style={[styles.heroScoreText, { color: textColor }]}>
                                        {scoring.riskScore}/100
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Main Content - White Background */}
                <View style={styles.productInfoSection}>

                    {/* Product Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.productBrand}>{toSentenceCase(brand as string)}</Text>
                        <Text style={styles.productName}>{toSentenceCase(name as string)}</Text>
                        {size && <Text style={styles.productSize}>{size}</Text>}

                        {/* Category & Confidence */}
                        <View style={styles.metaRow}>
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

                    {/* Safety Rating Badge - Uses proper scoring */}
                    {scoring && (
                        <View style={[styles.safetyRatingBadge, { backgroundColor: bgColor }]}>
                            <View style={styles.ratingContent}>
                                <View style={styles.ratingTopRow}>
                                    <Text style={[styles.ratingLabel, { color: textColor, opacity: 0.8 }]}>SAFETY RATING</Text>
                                    <View style={[styles.ratingScorePill, { backgroundColor: textColor === colors.black ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }]}>
                                        <Text style={[styles.ratingScorePillText, { color: textColor }]}>{scoring.riskScore}/100</Text>
                                    </View>
                                </View>
                                <Text style={[styles.ratingTierName, { color: textColor }]}>
                                    {safetyStyle.kidLabel}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Rate This Product */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>⭐ Rate This Product</Text>
                        <View style={styles.starRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setMyRating(star)}>
                                    <Star
                                        size={40}
                                        color={star <= myRating ? colors.yellow : '#ddd'}
                                        fill={star <= myRating ? colors.yellow : 'none'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {myRating > 0 && !showReviewInput && (
                            <TouchableOpacity style={styles.writeReviewButton} onPress={() => setShowReviewInput(true)}>
                                <Text style={styles.writeReviewText}>✏️ Write a quick review</Text>
                            </TouchableOpacity>
                        )}

                        {showReviewInput && (
                            <View style={styles.reviewInputContainer}>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="What did you think? (optional)"
                                    placeholderTextColor="#999"
                                    value={myReview}
                                    onChangeText={setMyReview}
                                    multiline
                                    maxLength={200}
                                />
                                <TouchableOpacity style={styles.submitReviewButton} onPress={handleSubmitReview}>
                                    <Text style={styles.submitReviewText}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* What Other Kids Think */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>👦👧 What Other Kids Think</Text>
                        {kidReviews.length === 0 ? (
                            <View style={styles.noReviewsBox}>
                                <Text style={styles.noReviewsText}>No reviews yet!</Text>
                                <Text style={styles.noReviewsSubtext}>Be the first to share what you think ⬆️</Text>
                            </View>
                        ) : (
                            kidReviews.map((review, index) => (
                                <View key={index} style={styles.kidReviewCard}>
                                    <View style={styles.kidReviewStars}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} size={14} color={s <= review.rating ? colors.yellow : '#ddd'} fill={s <= review.rating ? colors.yellow : 'none'} />
                                        ))}
                                    </View>
                                    {review.text && <Text style={styles.kidReviewText}>"{review.text}"</Text>}
                                </View>
                            ))
                        )}
                    </View>

                    {/* Add to Shelf Button */}
                    <TouchableOpacity style={styles.addToShelfButton} onPress={handleAddToShelf}>
                        <Heart size={20} color={colors.white} />
                        <Text style={styles.addToShelfText}>Add to My Shelf</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
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
    // Black Banner (matches parent)
    blackBanner: {
        backgroundColor: colors.black,
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[3],
    },
    blackBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    scanThumbnail: {
        width: 44,
        height: 44,
        borderRadius: radii.md,
        backgroundColor: colors.white,
    },
    blackBannerInfo: {
        flex: 1,
    },
    blackBannerBrand: {
        fontSize: 11,
        color: colors.purple,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    blackBannerName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.white,
    },
    scanAgainButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.lg,
    },
    scanAgainButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.white,
    },
    notRightProductHint: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'right',
        marginTop: spacing[1],
    },
    // Purple Banner (matches parent)
    purpleBanner: {
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    purpleBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    purpleBannerTextSection: {
        flex: 1,
    },
    purpleBannerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    purpleBannerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    addIngredientsButton: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.lg,
    },
    addIngredientsButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.purple,
    },
    // Points Animation
    pointsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.mint,
        paddingVertical: spacing[3],
        gap: spacing[2],
    },
    pointsText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
    // Main Content
    productInfoSection: {
        backgroundColor: colors.cream,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    productImage: {
        width: 160,
        height: 160,
        borderRadius: radii.lg,
    },
    placeholderImage: {
        width: 160,
        height: 160,
        borderRadius: radii.lg,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    productBrand: {
        fontSize: 12,
        color: colors.purple,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productName: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.black,
        marginTop: spacing[1],
    },
    productSize: {
        fontSize: 14,
        color: colors.charcoal,
        marginTop: spacing[1],
    },
    metaRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginTop: spacing[3],
        flexWrap: 'wrap',
    },
    categoryBadge: {
        backgroundColor: colors.mint,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radii.full,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.black,
    },
    confidenceBadge: {
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radii.full,
    },
    confidenceText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.white,
    },
    // Safety Rating Badge
    safetyRatingBadge: {
        borderRadius: radii.xl,
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    ratingContent: {},
    ratingTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    ratingLabel: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    ratingScorePill: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: radii.full,
    },
    ratingScorePillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    ratingTierName: {
        fontSize: 24,
        fontWeight: '700',
    },
    // Sections
    section: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.black,
        marginBottom: spacing[3],
    },
    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[2],
    },
    writeReviewButton: {
        alignSelf: 'center',
        marginTop: spacing[3],
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        backgroundColor: colors.purple + '15',
        borderRadius: radii.full,
    },
    writeReviewText: {
        color: colors.purple,
        fontSize: 14,
        fontWeight: '500',
    },
    reviewInputContainer: {
        marginTop: spacing[3],
    },
    reviewInput: {
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: spacing[3],
        color: colors.black,
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    submitReviewButton: {
        alignSelf: 'flex-end',
        marginTop: spacing[2],
        backgroundColor: colors.purple,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        borderRadius: radii.lg,
    },
    submitReviewText: {
        color: colors.white,
        fontWeight: '600',
    },
    noReviewsBox: {
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: spacing[4],
        alignItems: 'center',
    },
    noReviewsText: {
        fontSize: 16,
        color: colors.charcoal,
    },
    noReviewsSubtext: {
        fontSize: 13,
        color: '#999',
        marginTop: spacing[1],
    },
    kidReviewCard: {
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: spacing[3],
        marginBottom: spacing[2],
    },
    kidReviewStars: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: spacing[1],
    },
    kidReviewText: {
        fontSize: 14,
        color: colors.charcoal,
        fontStyle: 'italic',
    },
    addToShelfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.mint,
        paddingVertical: spacing[4],
        borderRadius: radii.xl,
    },
    addToShelfText: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.black,
    },
    // Hero Section
    heroSection: {
        height: 280,
        backgroundColor: colors.black,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 12,
        left: 16,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroActions: {
        position: 'absolute',
        top: 12,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        gap: 8,
    },
    heroActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    heroScoreText: {
        fontSize: 20,
        fontWeight: '700',
    },
});
