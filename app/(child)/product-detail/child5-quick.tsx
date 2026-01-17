/**
 * Child Page 5: Quick Glance
 * Minimal, fast-loading, essential info only
 * Theme: Black background with mint accents
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, ChevronUp, CheckCircle } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor } from './mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailChild5Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Minimal Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.mint} />
                </TouchableOpacity>
            </View>

            {/* Main Content - Centered */}
            <View style={styles.mainContent}>
                {/* Product Image */}
                <Image source={{ uri: product.image_url }} style={styles.productImage} />

                {/* Score + 3-Word Verdict */}
                <View style={[styles.scoreBadge, { backgroundColor: colors.mint }]}>
                    <Text style={styles.scoreNumber}>{product.safety_score}</Text>
                </View>

                <Text style={styles.verdict}>
                    {product.safety_score >= 75 ? 'Safe & Gentle ✨' :
                        product.safety_score >= 50 ? 'Use With Care ⚠️' : 'Not For Kids 🚫'}
                </Text>

                {/* Product Name */}
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.brandName}>{product.brand}</Text>

                {/* Quick Yes/No Answers */}
                <View style={styles.quickAnswers}>
                    <View style={styles.answerItem}>
                        <Text style={styles.answerLabel}>Safe?</Text>
                        <Text style={styles.answerValue}>{product.safety_score >= 50 ? '✅' : '❌'}</Text>
                    </View>
                    <View style={styles.answerDivider} />
                    <View style={styles.answerItem}>
                        <Text style={styles.answerLabel}>For me?</Text>
                        <Text style={styles.answerValue}>{product.profile_match === 'great_match' ? '✅' : '🤔'}</Text>
                    </View>
                    <View style={styles.answerDivider} />
                    <View style={styles.answerItem}>
                        <Text style={styles.answerLabel}>Daily?</Text>
                        <Text style={styles.answerValue}>✅</Text>
                    </View>
                </View>

                {/* Single Ingredient Highlight */}
                <View style={styles.ingredientCard}>
                    <Text style={styles.ingredientLabel}>⭐ Key Ingredient</Text>
                    <Text style={styles.ingredientName}>{product.ingredients[0]?.name}</Text>
                    <Text style={styles.ingredientWhat}>{product.ingredients[0]?.what_it_does}</Text>
                </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomSection}>
                {/* Swipe Hint */}
                <View style={styles.swipeHint}>
                    <ChevronUp size={20} color={colors.charcoal} />
                    <Text style={styles.swipeText}>Swipe up for details</Text>
                </View>

                {/* Quick Action Button */}
                <TouchableOpacity style={styles.logButton}>
                    <CheckCircle size={20} color={colors.black} />
                    <Text style={styles.logButtonText}>I Used It!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },

    header: {
        paddingTop: 60,
        paddingHorizontal: spacing[5],
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.purple + '40',
        alignItems: 'center',
        justifyContent: 'center',
    },

    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[6],
    },

    productImage: {
        width: 160,
        height: 160,
        borderRadius: 24,
        backgroundColor: colors.purple + '40',
        marginBottom: spacing[4],
        borderWidth: 3,
        borderColor: colors.mint,
    },

    scoreBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
        marginTop: -40,
        shadowColor: colors.mint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    scoreNumber: { fontSize: 28, fontWeight: 'bold', color: colors.black },

    verdict: { fontSize: 22, fontWeight: 'bold', color: colors.white, textAlign: 'center' },

    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.mint,
        marginTop: spacing[4],
        textAlign: 'center',
    },
    brandName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },

    quickAnswers: {
        flexDirection: 'row',
        backgroundColor: colors.purple + '30',
        borderRadius: radii.xl,
        padding: spacing[4],
        marginTop: spacing[5],
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.purple + '60',
    },
    answerItem: { flex: 1, alignItems: 'center' },
    answerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
    answerValue: { fontSize: 24 },
    answerDivider: { width: 1, height: 40, backgroundColor: colors.purple + '40' },

    ingredientCard: {
        backgroundColor: colors.mint + '20',
        borderRadius: radii.lg,
        padding: spacing[4],
        marginTop: spacing[4],
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: colors.mint + '40',
    },
    ingredientLabel: { fontSize: 11, fontWeight: '600', color: colors.mint, marginBottom: spacing[2] },
    ingredientName: { fontSize: 16, fontWeight: 'bold', color: colors.white },
    ingredientWhat: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

    bottomSection: {
        paddingHorizontal: spacing[5],
        paddingBottom: 40,
        gap: spacing[4],
    },

    swipeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    swipeText: { fontSize: 12, color: colors.charcoal },

    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.mint,
        paddingVertical: spacing[4],
        borderRadius: radii.xl,
    },
    logButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.black },
});
