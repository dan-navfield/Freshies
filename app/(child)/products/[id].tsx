import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Bookmark, Heart, Package, ShieldCheck, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { getProductById, ProductDetail } from '../../../src/modules/product-discovery';
import { shelfService } from '../../../src/modules/product-library';
import { addToWishlist, isInWishlist, removeFromWishlist } from '../../../src/modules/product-library';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingToShelf, setAddingToShelf] = useState(false);
    const [addingToWishlist, setAddingToWishlist] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistItemId, setWishlistItemId] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadProduct(id as string);
        }
    }, [id]);

    useEffect(() => {
        // Check if product is in wishlist
        const checkWishlist = async () => {
            if (!user?.id || !product?.barcode) return;
            const profileId = childProfile?.id || user.id;
            const existing = await isInWishlist(profileId, product.barcode);
            if (existing) {
                setIsWishlisted(true);
                setWishlistItemId(existing.id);
            }
        };
        checkWishlist();
    }, [product, user?.id, childProfile?.id]);

    const loadProduct = async (prodId: string) => {
        setLoading(true);
        try {
            const data = await getProductById(prodId);
            setProduct(data || null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToShelf = () => {
        if (!user?.id || !product) {
            Alert.alert('Error', 'Please log in to add products to your shelf.');
            return;
        }

        // Navigate to add wizard with pre-populated product data
        router.push({
            pathname: '/(shelf)/add',
            params: {
                productName: product.name,
                productBrand: product.brand || 'Unknown Brand',
                productImage: product.imageUrl || '',
                productCategory: product.category || 'skincare',
                productBarcode: product.barcode || '',
            }
        } as any);
    };

    const handleToggleWishlist = async () => {
        if (!user?.id || !product) {
            Alert.alert('Error', 'Please log in to save products to your wishlist.');
            return;
        }

        setAddingToWishlist(true);
        try {
            const profileId = childProfile?.id || user.id;

            if (isWishlisted && wishlistItemId) {
                // Remove from wishlist
                await removeFromWishlist(wishlistItemId);
                setIsWishlisted(false);
                setWishlistItemId(null);
                Alert.alert('Removed', `${product.name} removed from your wishlist.`);
            } else {
                // Add to wishlist
                const newItem = await addToWishlist({
                    user_id: user.id,
                    profile_id: profileId,
                    product_barcode: product.barcode || '',
                    product_name: product.name,
                    product_brand: product.brand || 'Unknown Brand',
                    product_image_url: product.imageUrl || '',
                    product_category: product.category || 'skincare',
                    safety_score: product.safetyScore,
                    safety_rating: product.safetyTier,
                });
                if (newItem) {
                    setIsWishlisted(true);
                    setWishlistItemId(newItem.id);
                    Alert.alert('Saved! 💜', `${product.name} added to your wishlist.`);
                }
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
            Alert.alert('Error', 'Failed to update wishlist. Please try again.');
        } finally {
            setAddingToWishlist(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.purple} size="large" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.container}>
                <Text>Product not found</Text>
            </View>
        );
    }

    // Safety Logic
    let scoreColor = colors.mint;
    let statusText = 'Excellent Choice';
    if (['D', 'E'].includes(product.safetyTier)) {
        scoreColor = colors.red;
        statusText = 'Not Recommended';
    } else if (product.safetyTier === 'C') {
        scoreColor = colors.yellow;
        statusText = 'Use with Caution';
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header Image Area */}
                <View style={styles.imageHeader}>
                    <Image
                        source={product.imageUrl ? { uri: product.imageUrl } : { uri: 'https://via.placeholder.com/400' }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <SafeAreaView style={styles.headerOverlay} edges={['top']}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
                            <ArrowLeft color="#000" size={24} />
                        </TouchableOpacity>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.iconCircle}>
                                <Share2 color="#000" size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconCircle, isWishlisted && styles.iconCircleActive]}
                                onPress={handleToggleWishlist}
                                disabled={addingToWishlist}
                            >
                                {addingToWishlist ? (
                                    <ActivityIndicator size="small" color={colors.purple} />
                                ) : (
                                    <Heart
                                        color={isWishlisted ? colors.purple : "#000"}
                                        size={24}
                                        fill={isWishlisted ? colors.purple : "transparent"}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Content Body */}
                <View style={styles.body}>

                    {/* Brand & Name */}
                    <Text style={styles.brand}>{product.brand}</Text>
                    <Text style={styles.name}>{product.name}</Text>

                    {/* Safety Score Card */}
                    <View style={[styles.scoreCard, { borderColor: scoreColor }]}>
                        <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
                            <Text style={styles.scoreText}>{product.safetyScore}</Text>
                            <Text style={styles.totalScoreText}>/100</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={styles.scoreLabel}>SAFETY SCORE</Text>
                            <Text style={[styles.scoreStatus, { color: scoreColor }]}>{statusText}</Text>
                        </View>
                        <View style={[styles.tierLetter, { backgroundColor: scoreColor }]}>
                            <Text style={styles.tierLetterText}>{product.safetyTier}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About this product</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}

                    {/* Barcode Info */}
                    {product.barcode && (
                        <View style={styles.metaRow}>
                            <Package size={16} color="#6B7280" />
                            <Text style={styles.metaText}>Barcode: {product.barcode}</Text>
                        </View>
                    )}

                    <View style={{ height: 24 }} />

                    {/* Add to Wishlist Button */}
                    <TouchableOpacity
                        style={[styles.wishlistButton, isWishlisted && styles.wishlistButtonActive]}
                        onPress={handleToggleWishlist}
                        disabled={addingToWishlist}
                    >
                        {addingToWishlist ? (
                            <ActivityIndicator size="small" color={isWishlisted ? colors.white : colors.purple} />
                        ) : (
                            <>
                                <Heart
                                    size={20}
                                    color={isWishlisted ? colors.white : colors.purple}
                                    fill={isWishlisted ? colors.white : "transparent"}
                                />
                                <Text style={[styles.wishlistButtonText, isWishlisted && styles.wishlistButtonTextActive]}>
                                    {isWishlisted ? 'In My Wishlist ♥' : 'Add to My Wishlist'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 12 }} />

                    {/* Add to Shelf Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddToShelf}
                        disabled={addingToShelf}
                    >
                        {addingToShelf ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.addButtonText}>Add to My Shelf +</Text>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageHeader: {
        height: 350,
        width: '100%',
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing[4],
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    body: {
        flex: 1,
        marginTop: -40,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: spacing[5],
    },
    brand: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: spacing[6],
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: radii.xl,
        borderWidth: 1,
        backgroundColor: '#FAFAFA',
        marginBottom: spacing[6],
    },
    scoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    scoreText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        lineHeight: 28,
    },
    totalScoreText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    scoreInfo: {
        flex: 1,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 2,
    },
    scoreStatus: {
        fontSize: 18,
        fontWeight: '800',
    },
    tierLetter: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierLetterText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: spacing[3],
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[6],
        gap: 8,
    },
    metaText: {
        fontSize: 14,
        color: '#6B7280',
    },
    addButton: {
        backgroundColor: '#111827',
        paddingVertical: spacing[4],
        borderRadius: radii.full,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    iconCircleActive: {
        backgroundColor: colors.purple + '20',
    },
    wishlistButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[3],
        borderRadius: radii.full,
        borderWidth: 2,
        borderColor: colors.purple,
        backgroundColor: 'transparent',
        gap: spacing[2],
    },
    wishlistButtonActive: {
        backgroundColor: colors.purple,
        borderColor: colors.purple,
    },
    wishlistButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.purple,
    },
    wishlistButtonTextActive: {
        color: '#fff',
    },
});
