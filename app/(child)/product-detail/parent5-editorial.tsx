/**
 * Parent Page 5: Editorial Style
 * Magazine-like layout with hero image and long-form content
 * Theme: Black header, cream body, purple accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Bookmark, Share2, Star, Check, AlertTriangle } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor, getTierColor } from '../../../src/data/mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailParent5Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Image with Black Overlay */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: product.image_url }} style={styles.heroImage} />
                    <View style={styles.heroOverlay}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <ChevronLeft size={24} color={colors.white} />
                        </TouchableOpacity>
                        <View style={styles.heroActions}>
                            <TouchableOpacity style={styles.heroActionBtn}>
                                <Bookmark size={20} color={colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.heroActionBtn}>
                                <Share2 size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.brandOverlay}>
                        <Text style={styles.brandText}>{product.brand}</Text>
                    </View>
                </View>

                {/* Article Header */}
                <View style={styles.articleHeader}>
                    <Text style={styles.category}>{product.category.toUpperCase()}</Text>
                    <Text style={styles.title}>{product.name}</Text>
                    <View style={styles.ratingRow}>
                        <View style={[styles.tierBadge, { backgroundColor: getTierColor(product.safety_tier) }]}>
                            <Text style={styles.tierText}>Tier {product.safety_tier}</Text>
                        </View>
                        <View style={styles.scoreChip}>
                            <Star size={14} color={getScoreColor(product.safety_score)} fill={getScoreColor(product.safety_score)} />
                            <Text style={[styles.scoreText, { color: getScoreColor(product.safety_score) }]}>{product.safety_score}/100</Text>
                        </View>
                    </View>
                </View>

                {/* AI Summary - Long Form */}
                <View style={styles.articleSection}>
                    <Text style={styles.dropCap}>{product.ai_summary.charAt(0)}</Text>
                    <Text style={styles.bodyText}>{product.ai_summary.slice(1)}</Text>
                </View>

                {/* Quick Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Size</Text>
                        <Text style={styles.detailValue}>{product.size}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Price</Text>
                        <Text style={styles.detailValue}>{product.price}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Age Range</Text>
                        <Text style={styles.detailValue}>{product.target_age_band}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Type</Text>
                        <Text style={styles.detailValue}>{product.form_factor}</Text>
                    </View>
                </View>

                {/* Ingredient Stories */}
                <View style={styles.articleSection}>
                    <Text style={styles.sectionTitle}>What's Inside</Text>
                    {product.ingredients.slice(0, 3).map((ing, i) => (
                        <View key={ing.id} style={styles.ingredientStory}>
                            <View style={[styles.ingredientNumber, { backgroundColor: i === 0 ? colors.purple : i === 1 ? colors.mint : colors.purple + '60' }]}>
                                <Text style={styles.ingredientNumberText}>{i + 1}</Text>
                            </View>
                            <View style={styles.ingredientContent}>
                                <Text style={styles.ingredientName}>{ing.name}</Text>
                                <Text style={styles.ingredientDescription}>{ing.what_it_does}. This ingredient scores {ing.isi_score}/100 in our safety analysis.</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Verdict Card */}
                <View style={[styles.verdictCard, { backgroundColor: colors.mint + '20', borderColor: colors.mint }]}>
                    <Text style={styles.verdictLabel}>THE BOTTOM LINE</Text>
                    <Text style={styles.verdictTitle}>
                        {product.safety_score >= 75 ? 'Highly Recommended' :
                            product.safety_score >= 50 ? 'Use With Caution' : 'Not Recommended'}
                    </Text>
                    <Text style={styles.verdictText}>
                        {product.safety_score >= 75
                            ? 'This product is an excellent choice for children. It contains gentle, effective ingredients without common irritants or allergens.'
                            : product.safety_score >= 50
                                ? 'This product may be suitable for some children with parent supervision. Review the ingredient list carefully.'
                                : 'We don\'t recommend this product for children due to potentially harmful ingredients.'}
                    </Text>
                    <View style={styles.verdictBullets}>
                        {product.benefits.slice(0, 3).map((b, i) => (
                            <View key={i} style={styles.verdictBullet}>
                                <Check size={14} color={colors.mint} />
                                <Text style={styles.verdictBulletText}>{b}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* What Parents Say */}
                <View style={styles.articleSection}>
                    <Text style={styles.sectionTitle}>What Parents Say</Text>
                    <View style={styles.reviewCard}>
                        <View style={styles.reviewStars}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} size={14} color={colors.yellow} fill={n <= 4 ? colors.yellow : 'none'} />
                            ))}
                        </View>
                        <Text style={styles.reviewText}>"My daughter has sensitive skin and this has been perfect for her. No irritation at all!"</Text>
                        <Text style={styles.reviewAuthor}>— Sarah M., verified parent</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    scrollContent: { flex: 1 },

    heroSection: { position: 'relative' },
    heroImage: { width: '100%', height: 300, backgroundColor: colors.black },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 60,
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.black + '80',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroActions: { flexDirection: 'row', gap: spacing[2] },
    heroActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.black + '80',
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[5],
        backgroundColor: colors.black + 'CC',
    },
    brandText: { fontSize: 14, fontWeight: '600', color: colors.mint, letterSpacing: 2 },

    articleHeader: {
        padding: spacing[5],
        backgroundColor: colors.white,
    },
    category: { fontSize: 11, fontWeight: '700', color: colors.purple, letterSpacing: 1 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.black, marginTop: spacing[2], lineHeight: 34 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[4] },
    tierBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    tierText: { fontSize: 12, fontWeight: 'bold', color: colors.white },
    scoreChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scoreText: { fontSize: 14, fontWeight: '600' },

    articleSection: { padding: spacing[5] },
    dropCap: {
        fontSize: 64,
        fontWeight: 'bold',
        color: colors.purple,
        lineHeight: 64,
        marginRight: spacing[2],
    },
    bodyText: { fontSize: 16, lineHeight: 26, color: colors.charcoal },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.black, marginBottom: spacing[4] },

    detailsCard: {
        marginHorizontal: spacing[5],
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        marginBottom: spacing[5],
        borderWidth: 2,
        borderColor: colors.purple + '20',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.cream,
    },
    detailLabel: { fontSize: 13, color: colors.charcoal },
    detailValue: { fontSize: 13, fontWeight: '600', color: colors.black },

    ingredientStory: { flexDirection: 'row', marginBottom: spacing[4] },
    ingredientNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    ingredientNumberText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
    ingredientContent: { flex: 1 },
    ingredientName: { fontSize: 16, fontWeight: '600', color: colors.black, marginBottom: 4 },
    ingredientDescription: { fontSize: 14, lineHeight: 20, color: colors.charcoal },

    verdictCard: {
        marginHorizontal: spacing[5],
        borderRadius: radii.xl,
        padding: spacing[5],
        marginBottom: spacing[5],
        borderWidth: 2,
    },
    verdictLabel: { fontSize: 10, fontWeight: '700', color: colors.charcoal, letterSpacing: 1, marginBottom: spacing[2] },
    verdictTitle: { fontSize: 22, fontWeight: 'bold', color: colors.black, marginBottom: spacing[3] },
    verdictText: { fontSize: 14, lineHeight: 22, color: colors.charcoal, marginBottom: spacing[4] },
    verdictBullets: { gap: spacing[2] },
    verdictBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
    verdictBulletText: { flex: 1, fontSize: 13, color: colors.black },

    reviewCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.purple + '20',
    },
    reviewStars: { flexDirection: 'row', gap: 2, marginBottom: spacing[3] },
    reviewText: { fontSize: 14, fontStyle: 'italic', color: colors.charcoal, lineHeight: 20, marginBottom: spacing[2] },
    reviewAuthor: { fontSize: 12, color: colors.purple },
});
