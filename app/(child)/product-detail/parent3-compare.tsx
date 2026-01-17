/**
 * Parent Page 3: Comparison Ready
 * Side-by-side comparison layout, severity bars, quick facts grid
 * Theme: Mint/aqua background with purple accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Check, X, Scale, PenLine, Search } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor, getSeverityColor } from './mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailParent3Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Mint Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comparison View</Text>
                <TouchableOpacity style={styles.compareButton}>
                    <Scale size={20} color={colors.black} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Product Card */}
                <View style={styles.productCard}>
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <Text style={styles.brandName}>{product.brand}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.scoreRow}>
                            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(product.safety_score) }]}>
                                <Text style={styles.scoreText}>{product.safety_score}</Text>
                            </View>
                            <Text style={styles.scoreTier}>Tier {product.safety_tier}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Facts Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Facts</Text>
                    <View style={styles.factsGrid}>
                        <View style={styles.factItem}>
                            <Text style={styles.factLabel}>Fragrance</Text>
                            <View style={[styles.factValue, { backgroundColor: colors.mint + '40' }]}>
                                <X size={14} color={colors.black} />
                                <Text style={[styles.factValueText, { color: colors.black }]}>None</Text>
                            </View>
                        </View>
                        <View style={styles.factItem}>
                            <Text style={styles.factLabel}>Leave-On</Text>
                            <View style={[styles.factValue, { backgroundColor: product.leave_on ? colors.purple + '20' : colors.mint + '40' }]}>
                                {product.leave_on ? <Check size={14} color={colors.purple} /> : <X size={14} color={colors.black} />}
                                <Text style={[styles.factValueText, { color: product.leave_on ? colors.purple : colors.black }]}>
                                    {product.leave_on ? 'Yes' : 'No'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.factItem}>
                            <Text style={styles.factLabel}>Allergens</Text>
                            <View style={[styles.factValue, { backgroundColor: colors.mint + '40' }]}>
                                <X size={14} color={colors.black} />
                                <Text style={[styles.factValueText, { color: colors.black }]}>None</Text>
                            </View>
                        </View>
                        <View style={styles.factItem}>
                            <Text style={styles.factLabel}>Age Range</Text>
                            <View style={[styles.factValue, { backgroundColor: colors.purple + '20' }]}>
                                <Text style={[styles.factValueText, { color: colors.purple }]}>{product.target_age_band}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Ingredient Severity Bars */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingredient Breakdown</Text>
                    <View style={styles.severityBars}>
                        {product.ingredients.map((ing) => (
                            <View key={ing.id} style={styles.severityItem}>
                                <View style={styles.severityLabel}>
                                    <Text style={styles.ingredientName}>{ing.name}</Text>
                                    <Text style={styles.ingredientScore}>{ing.isi_score}</Text>
                                </View>
                                <View style={styles.severityBarBg}>
                                    <View style={[styles.severityBarFill, {
                                        width: `${ing.isi_score}%`,
                                        backgroundColor: getScoreColor(ing.isi_score)
                                    }]} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Compare Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Compare With</Text>
                    <TouchableOpacity style={styles.compareAddCard}>
                        <Search size={24} color={colors.purple} />
                        <Text style={styles.compareAddText}>Search for a product to compare</Text>
                    </TouchableOpacity>
                </View>

                {/* Parent Notes */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <PenLine size={18} color={colors.black} />
                        <Text style={styles.sectionTitle}>Parent Notes</Text>
                    </View>
                    <View style={styles.notesCard}>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Add your notes about this product..."
                            placeholderTextColor={colors.charcoal}
                            multiline
                            numberOfLines={4}
                        />
                    </View>
                </View>

                {/* Similar Products Link */}
                <TouchableOpacity style={styles.similarLink}>
                    <Text style={styles.similarLinkText}>View Similar Products →</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },

    header: {
        backgroundColor: colors.mint, // Brand mint header
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
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.black },
    compareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    scrollContent: { flex: 1, padding: spacing[5] },

    productCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[4],
        flexDirection: 'row',
        marginBottom: spacing[5],
        borderWidth: 2,
        borderColor: colors.mint,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: radii.lg,
        backgroundColor: colors.mint + '20',
    },
    productInfo: { flex: 1, marginLeft: spacing[4] },
    brandName: { fontSize: 12, fontWeight: '600', color: colors.purple },
    productName: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginTop: 2 },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    scoreText: { fontSize: 14, fontWeight: 'bold', color: colors.white },
    scoreTier: { fontSize: 12, color: colors.charcoal },

    section: { marginBottom: spacing[5] },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginBottom: spacing[3] },

    factsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
    },
    factItem: {
        width: '47%',
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[3],
    },
    factLabel: { fontSize: 11, color: colors.charcoal, marginBottom: spacing[2] },
    factValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    factValueText: { fontSize: 13, fontWeight: '600' },

    severityBars: { gap: spacing[3] },
    severityItem: { gap: 6 },
    severityLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ingredientName: { fontSize: 13, fontWeight: '500', color: colors.black },
    ingredientScore: { fontSize: 12, fontWeight: '600', color: colors.charcoal },
    severityBarBg: {
        height: 8,
        backgroundColor: colors.mint + '30',
        borderRadius: 4,
        overflow: 'hidden',
    },
    severityBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    compareAddCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[5],
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.purple + '40',
        alignItems: 'center',
        gap: spacing[2],
    },
    compareAddText: { fontSize: 14, color: colors.purple },

    notesCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
    },
    notesInput: {
        fontSize: 14,
        color: colors.black,
        minHeight: 80,
        textAlignVertical: 'top',
    },

    similarLink: {
        alignItems: 'center',
        paddingVertical: spacing[4],
    },
    similarLinkText: { fontSize: 14, fontWeight: '600', color: colors.purple },
});
