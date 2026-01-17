/**
 * Child Page 3: Card Collection
 * Trading card style with stats, rarity, collectible feel
 * Theme: Purple background with mint accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Sparkles, Heart, Bookmark } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor } from '../../../src/data/mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailChild3Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Purple Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Card</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Trading Card */}
                <View style={styles.cardOuter}>
                    <View style={[styles.cardInner, { borderColor: colors.mint }]}>
                        {/* Rarity Banner */}
                        <View style={[styles.rarityBanner, { backgroundColor: colors.mint }]}>
                            <Sparkles size={14} color={colors.black} />
                            <Text style={styles.rarityText}>
                                {product.safety_tier === 'A' ? 'LEGENDARY' :
                                    product.safety_tier === 'B' ? 'EPIC' :
                                        product.safety_tier === 'C' ? 'RARE' : 'COMMON'}
                            </Text>
                        </View>

                        {/* Card Image */}
                        <Image source={{ uri: product.image_url }} style={styles.cardImage} />

                        {/* Card Info */}
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardBrand}>{product.brand}</Text>
                            <Text style={styles.cardName}>{product.name}</Text>
                            <Text style={styles.cardCategory}>{product.category}</Text>
                        </View>

                        {/* Stats Grid - Pokemon Style */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>SAFETY</Text>
                                <View style={styles.statBar}>
                                    <View style={[styles.statFill, { width: `${product.safety_score}%`, backgroundColor: colors.mint }]} />
                                </View>
                                <Text style={styles.statValue}>{product.safety_score}</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>GENTLE</Text>
                                <View style={styles.statBar}>
                                    <View style={[styles.statFill, { width: '88%', backgroundColor: colors.purple }]} />
                                </View>
                                <Text style={styles.statValue}>88</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={styles.statLabel}>POWER</Text>
                                <View style={styles.statBar}>
                                    <View style={[styles.statFill, { width: '75%', backgroundColor: colors.mint }]} />
                                </View>
                                <Text style={styles.statValue}>75</Text>
                            </View>
                        </View>

                        {/* Card Number */}
                        <Text style={styles.cardNumber}>#001 / 999</Text>
                    </View>
                </View>

                {/* Abilities */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ Special Abilities</Text>
                    <View style={styles.abilitiesGrid}>
                        {product.benefits.slice(0, 4).map((benefit, i) => (
                            <View key={i} style={styles.abilityCard}>
                                <Text style={styles.abilityEmoji}>{['🛡️', '💧', '✨', '🌿'][i % 4]}</Text>
                                <Text style={styles.abilityText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Key Ingredients as Cards */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🧪 Ingredient Cards</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientScroll}>
                        {product.ingredients.map((ing, i) => (
                            <View key={ing.id} style={styles.ingredientCard}>
                                <View style={[styles.ingredientIcon, { backgroundColor: i % 2 === 0 ? colors.mint : colors.purple }]}>
                                    <Text style={styles.ingredientEmoji}>{['💎', '🌟', '⭐', '💫', '✨'][i % 5]}</Text>
                                </View>
                                <Text style={styles.ingredientName}>{ing.name}</Text>
                                <View style={styles.ingredientScore}>
                                    <Text style={styles.ingredientScoreText}>{ing.isi_score}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Heart size={20} color={colors.mint} />
                        <Text style={styles.actionText}>Favorite</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                        <Bookmark size={20} color={colors.black} />
                        <Text style={[styles.actionText, { color: colors.black }]}>Add to Collection</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.purple },

    header: {
        backgroundColor: colors.purple,
        paddingTop: 60,
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },

    scrollContent: { flex: 1 },
    scrollContainer: { paddingBottom: spacing[5] },

    cardOuter: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
    },
    cardInner: {
        backgroundColor: colors.black,
        borderRadius: 20,
        borderWidth: 4,
        padding: spacing[4],
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    rarityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: spacing[3],
    },
    rarityText: { fontSize: 12, fontWeight: 'bold', color: colors.black, letterSpacing: 1 },

    cardImage: {
        width: 180,
        height: 180,
        borderRadius: 16,
        backgroundColor: colors.purple + '40',
        marginBottom: spacing[4],
        borderWidth: 2,
        borderColor: colors.mint + '40',
    },

    cardInfo: { alignItems: 'center', marginBottom: spacing[4] },
    cardBrand: { fontSize: 11, fontWeight: '600', color: colors.mint, letterSpacing: 1 },
    cardName: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginTop: 4, textAlign: 'center' },
    cardCategory: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

    statsGrid: { width: '100%', gap: spacing[3], marginBottom: spacing[4] },
    statRow: { flexDirection: 'row', alignItems: 'center' },
    statLabel: { width: 60, fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
    statBar: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginHorizontal: spacing[2],
    },
    statFill: { height: '100%', borderRadius: 4 },
    statValue: { width: 28, fontSize: 12, fontWeight: 'bold', color: colors.white, textAlign: 'right' },

    cardNumber: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },

    section: { marginHorizontal: spacing[5], marginBottom: spacing[5] },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.white, marginBottom: spacing[3] },

    abilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
    abilityCard: {
        width: '48%',
        backgroundColor: colors.black + '80',
        borderRadius: radii.lg,
        padding: spacing[3],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        borderWidth: 1,
        borderColor: colors.mint + '40',
    },
    abilityEmoji: { fontSize: 20 },
    abilityText: { flex: 1, fontSize: 11, color: colors.white },

    ingredientScroll: { marginHorizontal: -spacing[5], paddingHorizontal: spacing[5] },
    ingredientCard: {
        width: 100,
        backgroundColor: colors.black + '80',
        borderRadius: radii.lg,
        padding: spacing[3],
        alignItems: 'center',
        marginRight: spacing[3],
        borderWidth: 1,
        borderColor: colors.mint + '30',
    },
    ingredientIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    ingredientEmoji: { fontSize: 24 },
    ingredientName: { fontSize: 11, fontWeight: '600', color: colors.white, textAlign: 'center', marginBottom: spacing[2] },
    ingredientScore: {
        backgroundColor: colors.mint + '30',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    ingredientScoreText: { fontSize: 12, fontWeight: 'bold', color: colors.mint },

    actionRow: {
        flexDirection: 'row',
        marginHorizontal: spacing[5],
        gap: spacing[3],
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
        backgroundColor: colors.black + '80',
        borderWidth: 1,
        borderColor: colors.mint + '40',
    },
    primaryAction: { backgroundColor: colors.mint, borderColor: colors.mint },
    actionText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
