/**
 * Child Page 1: Fun & Friendly
 * Colorful, emoji-based, playful view for kids
 * Theme: Purple header with lavender body
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Heart, Star, Sparkles } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor } from './mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailChild1Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Purple Fun Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerEmoji}>🧴</Text>
                    <Text style={styles.headerTitle}>Product Check!</Text>
                </View>
                <TouchableOpacity style={styles.favoriteButton}>
                    <Heart size={24} color={product.is_favorite ? colors.mint : colors.white} fill={product.is_favorite ? colors.mint : 'none'} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Big Hero Image */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: product.image_url }} style={styles.heroImage} />

                    {/* Big Safety Emoji */}
                    <View style={[styles.safetyBubble, { backgroundColor: getScoreColor(product.safety_score) }]}>
                        <Text style={styles.safetyEmoji}>
                            {product.safety_score >= 75 ? '✅' : product.safety_score >= 50 ? '⚠️' : '🚫'}
                        </Text>
                        <Text style={styles.safetyLabel}>
                            {product.safety_score >= 75 ? 'SAFE!' : product.safety_score >= 50 ? 'CAREFUL' : 'NOPE'}
                        </Text>
                    </View>
                </View>

                {/* Product Name Card */}
                <View style={styles.nameCard}>
                    <Text style={styles.brandName}>{product.brand}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>🧼 {product.category}</Text>
                    </View>
                </View>

                {/* Kid Friendly Message */}
                <View style={styles.messageCard}>
                    <View style={styles.messageBubble}>
                        <Text style={styles.messageText}>{product.kid_friendly_message}</Text>
                    </View>
                    <View style={styles.messageAvatar}>
                        <Text style={styles.avatarEmoji}>🤖</Text>
                    </View>
                </View>

                {/* What Does This Do? */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ What Does This Do?</Text>
                    <View style={styles.benefitsGrid}>
                        {product.benefits.slice(0, 4).map((benefit, i) => (
                            <View key={i} style={styles.benefitCard}>
                                <Text style={styles.benefitEmoji}>
                                    {['💧', '🌿', '✨', '🛡️', '🌸'][i % 5]}
                                </Text>
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Is It For Me? */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Is It For Me?</Text>
                    <View style={[styles.matchCard, {
                        backgroundColor: product.profile_match === 'great_match' ? colors.mint + '30' :
                            product.profile_match === 'ok_with_care' ? '#FBBF24' + '30' : '#EF4444' + '30'
                    }]}>
                        <Text style={styles.matchEmoji}>
                            {product.profile_match === 'great_match' ? '🎉' :
                                product.profile_match === 'ok_with_care' ? '🤔' : '😢'}
                        </Text>
                        <Text style={styles.matchTitle}>
                            {product.profile_match === 'great_match' ? 'Perfect for you!' :
                                product.profile_match === 'ok_with_care' ? 'Maybe, ask a grown-up!' : 'Not right now...'}
                        </Text>
                        <Text style={styles.matchDescription}>
                            {product.profile_match === 'great_match'
                                ? 'This product is super gentle and safe for your skin!'
                                : product.profile_match === 'ok_with_care'
                                    ? 'This might work, but check with your parent first!'
                                    : 'This product isn\'t made for kids. Let\'s find something else!'}
                        </Text>
                    </View>
                </View>

                {/* Fun Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Your Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statEmoji}>🔥</Text>
                            <Text style={styles.statNumber}>{product.usage_count}</Text>
                            <Text style={styles.statLabel}>Times Used</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statEmoji}>{product.in_routine ? '⭐' : '➕'}</Text>
                            <Text style={styles.statNumber}>{product.in_routine ? 'Yes!' : 'Nope'}</Text>
                            <Text style={styles.statLabel}>In Routine</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statEmoji}>{product.on_shelf ? '🏠' : '🛒'}</Text>
                            <Text style={styles.statNumber}>{product.on_shelf ? 'Got it!' : 'Need it'}</Text>
                            <Text style={styles.statLabel}>On Shelf</Text>
                        </View>
                    </View>
                </View>

                {/* Magic Ingredients */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🧪 Magic Ingredients</Text>
                    <View style={styles.ingredientsList}>
                        {product.ingredients.slice(0, 3).map((ing, i) => (
                            <View key={ing.id} style={styles.ingredientItem}>
                                <View style={[styles.ingredientIcon, { backgroundColor: i === 0 ? colors.purple : i === 1 ? colors.mint : colors.purple + '60' }]}>
                                    <Text style={styles.ingredientIconText}>{['🌟', '💫', '✨'][i % 3]}</Text>
                                </View>
                                <View style={styles.ingredientInfo}>
                                    <Text style={styles.ingredientName}>{ing.name}</Text>
                                    <Text style={styles.ingredientWhat}>{ing.what_it_does}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Big Action Button */}
                <View style={styles.actionSection}>
                    <Pressable style={styles.primaryButton}>
                        <Heart size={20} color={colors.white} fill={colors.white} />
                        <Text style={styles.primaryButtonText}>Add to Favorites!</Text>
                    </Pressable>

                    <TouchableOpacity style={styles.secondaryButton}>
                        <Sparkles size={18} color={colors.purple} />
                        <Text style={styles.secondaryButtonText}>Add to My Routine</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.lavender },

    header: {
        backgroundColor: colors.purple, // Brand purple
        paddingTop: 60,
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: { flex: 1, alignItems: 'center' },
    headerEmoji: { fontSize: 28 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginTop: 4 },
    favoriteButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    scrollContent: { flex: 1 },

    heroSection: {
        alignItems: 'center',
        marginTop: -30,
        marginBottom: spacing[5],
    },
    heroImage: {
        width: 200,
        height: 200,
        borderRadius: 24,
        backgroundColor: colors.white,
        borderWidth: 4,
        borderColor: colors.mint,
    },
    safetyBubble: {
        position: 'absolute',
        bottom: -10,
        right: 80,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    safetyEmoji: { fontSize: 24 },
    safetyLabel: { fontSize: 10, fontWeight: 'bold', color: colors.white, marginTop: 2 },

    nameCard: {
        backgroundColor: colors.white,
        marginHorizontal: spacing[5],
        borderRadius: radii.xl,
        padding: spacing[5],
        alignItems: 'center',
        marginBottom: spacing[5],
    },
    brandName: { fontSize: 13, fontWeight: '600', color: colors.purple },
    productName: { fontSize: 22, fontWeight: 'bold', color: colors.black, marginTop: 4, textAlign: 'center' },
    categoryBadge: {
        backgroundColor: colors.mint + '30',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: spacing[3],
    },
    categoryText: { fontSize: 13, fontWeight: '600', color: colors.black },

    messageCard: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[5],
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageBubble: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        borderBottomRightRadius: 8,
        padding: spacing[4],
        marginRight: spacing[2],
    },
    messageText: { fontSize: 15, lineHeight: 22, color: colors.charcoal },
    messageAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.purple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: { fontSize: 24 },

    section: {
        marginHorizontal: spacing[5],
        marginBottom: spacing[5],
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.black, marginBottom: spacing[4] },

    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
    },
    benefitCard: {
        width: '47%',
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        alignItems: 'center',
    },
    benefitEmoji: { fontSize: 28, marginBottom: spacing[2] },
    benefitText: { fontSize: 12, fontWeight: '600', color: colors.charcoal, textAlign: 'center' },

    matchCard: {
        borderRadius: radii.xl,
        padding: spacing[5],
        alignItems: 'center',
    },
    matchEmoji: { fontSize: 48, marginBottom: spacing[3] },
    matchTitle: { fontSize: 20, fontWeight: 'bold', color: colors.black, marginBottom: spacing[2] },
    matchDescription: { fontSize: 14, color: colors.charcoal, textAlign: 'center', lineHeight: 20 },

    statsGrid: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        alignItems: 'center',
    },
    statEmoji: { fontSize: 28 },
    statNumber: { fontSize: 18, fontWeight: 'bold', color: colors.black, marginTop: spacing[2] },
    statLabel: { fontSize: 11, color: colors.charcoal, marginTop: 2 },

    ingredientsList: { gap: spacing[3] },
    ingredientItem: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    ingredientIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ingredientIconText: { fontSize: 20 },
    ingredientInfo: { flex: 1 },
    ingredientName: { fontSize: 14, fontWeight: 'bold', color: colors.black },
    ingredientWhat: { fontSize: 12, color: colors.charcoal, marginTop: 2 },

    actionSection: {
        marginHorizontal: spacing[5],
        gap: spacing[3],
    },
    primaryButton: {
        backgroundColor: colors.purple,
        borderRadius: radii.xl,
        paddingVertical: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    primaryButtonText: { fontSize: 18, fontWeight: 'bold', color: colors.white },
    secondaryButton: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        paddingVertical: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        borderWidth: 2,
        borderColor: colors.purple,
    },
    secondaryButtonText: { fontSize: 16, fontWeight: '700', color: colors.purple },
});
