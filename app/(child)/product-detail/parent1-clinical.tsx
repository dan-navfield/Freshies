/**
 * Parent Page 1: Clinical Dashboard
 * Data-focused view with ingredient tables, ISI scores, and flag chips
 * Theme: Purple header, cream body
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Shield, AlertTriangle, Check, Info, Clock, Package } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor, getTierColor, getSeverityColor, MockIngredient, MockProductFlag } from '../../../src/data/mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailParent1Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Purple Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerLabel}>CLINICAL DASHBOARD</Text>
                    <Text style={styles.headerTitle}>{product.name}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Product Overview Card */}
                <View style={styles.overviewCard}>
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    <View style={styles.overviewContent}>
                        <Text style={styles.brandName}>{product.brand}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Package size={14} color={colors.charcoal} />
                                <Text style={styles.metaText}>{product.size}</Text>
                            </View>
                            <Text style={styles.metaText}>{product.category}</Text>
                        </View>
                    </View>

                    {/* Large Safety Score Badge */}
                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(product.safety_score) }]}>
                        <Text style={styles.scoreValue}>{product.safety_score}</Text>
                        <Text style={styles.scoreTier}>Tier {product.safety_tier}</Text>
                    </View>
                </View>

                {/* Safety Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Safety Summary</Text>
                    <View style={styles.summaryCard}>
                        <Shield size={20} color={getScoreColor(product.safety_score)} />
                        <Text style={styles.summaryText}>{product.parent_message}</Text>
                    </View>
                </View>

                {/* Flags Grid */}
                {product.flags.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Flags & Alerts</Text>
                        <View style={styles.flagsGrid}>
                            {product.flags.map((flag, index) => (
                                <View key={index} style={[styles.flagChip, { borderColor: getSeverityColor(flag.severity) }]}>
                                    <Text style={styles.flagIcon}>{flag.icon}</Text>
                                    <View style={styles.flagContent}>
                                        <Text style={[styles.flagTitle, { color: getSeverityColor(flag.severity) }]}>{flag.title}</Text>
                                        <Text style={styles.flagDesc}>{flag.description}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Ingredient Table */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ingredient Analysis</Text>
                        <Text style={styles.sectionSubtitle}>{product.ingredients_count} ingredients total</Text>
                    </View>

                    <View style={styles.ingredientTable}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Ingredient</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>ISI Score</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Function</Text>
                        </View>

                        {/* Table Rows */}
                        {product.ingredients.map((ing, index) => (
                            <View key={ing.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : null]}>
                                <View style={[styles.tableCell, { flex: 2 }]}>
                                    <Text style={styles.ingredientName}>{ing.name}</Text>
                                    <Text style={styles.ingredientInci}>{ing.inci_name}</Text>
                                </View>
                                <View style={[styles.tableCell, { flex: 1, alignItems: 'center' }]}>
                                    <View style={[styles.isiScoreBadge, { backgroundColor: getScoreColor(ing.isi_score) }]}>
                                        <Text style={styles.isiScoreText}>{ing.isi_score}</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, { flex: 2 }]}>
                                    <Text style={styles.ingredientFunction}>{ing.what_it_does}</Text>
                                    {ing.is_flagged && (
                                        <View style={styles.ingredientFlag}>
                                            <AlertTriangle size={10} color="#F59E0B" />
                                            <Text style={styles.ingredientFlagText}>{ing.flag_reason}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Benefits & Concerns */}
                <View style={styles.twoColumn}>
                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>✅ Benefits</Text>
                        {product.benefits.map((benefit, i) => (
                            <View key={i} style={styles.listItem}>
                                <Check size={14} color={colors.mint} />
                                <Text style={styles.listItemText}>{benefit}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>⚠️ Concerns</Text>
                        {product.concerns.length > 0 ? (
                            product.concerns.map((concern, i) => (
                                <View key={i} style={styles.listItem}>
                                    <AlertTriangle size={14} color="#F59E0B" />
                                    <Text style={styles.listItemText}>{concern}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noConcerns}>No concerns identified</Text>
                        )}
                    </View>
                </View>

                {/* Profile Match */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Match</Text>
                    <View style={[styles.matchCard, {
                        backgroundColor: product.profile_match === 'great_match' ? colors.mint + '20' :
                            product.profile_match === 'ok_with_care' ? '#FBBF24' + '20' : '#EF4444' + '20'
                    }]}>
                        <Text style={styles.matchStatus}>
                            {product.profile_match === 'great_match' ? '✨ Great Match' :
                                product.profile_match === 'ok_with_care' ? '⚠️ OK with Care' : '🚫 Not Recommended'}
                        </Text>
                        {product.match_reasons.map((reason, i) => (
                            <Text key={i} style={styles.matchReason}>• {reason}</Text>
                        ))}
                    </View>
                </View>

                {/* Usage Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{product.usage_count}</Text>
                        <Text style={styles.statLabel}>Uses</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Clock size={16} color={colors.charcoal} />
                        <Text style={styles.statLabel}>Last used: {product.last_used || 'Never'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{product.in_routine ? '✅' : '—'}</Text>
                        <Text style={styles.statLabel}>In Routine</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    header: {
        backgroundColor: colors.purple, // Brand purple header
        paddingTop: 60,
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    headerContent: { flex: 1 },
    headerLabel: { fontSize: 10, fontWeight: '700', color: colors.mint, letterSpacing: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginTop: 2 },
    scrollContent: { flex: 1, padding: spacing[5] },

    overviewCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[4],
        flexDirection: 'row',
        marginBottom: spacing[5],
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: radii.lg,
        backgroundColor: colors.cream,
    },
    overviewContent: { flex: 1, marginLeft: spacing[4] },
    brandName: { fontSize: 12, fontWeight: '600', color: colors.purple },
    productName: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: colors.charcoal },

    scoreBadge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreValue: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    scoreTier: { fontSize: 9, fontWeight: '600', color: colors.white, opacity: 0.9 },

    section: { marginBottom: spacing[5] },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginBottom: spacing[3] },
    sectionSubtitle: { fontSize: 12, color: colors.charcoal },

    summaryCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    summaryText: { flex: 1, fontSize: 13, lineHeight: 20, color: colors.charcoal },

    flagsGrid: { gap: spacing[3] },
    flagChip: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[3],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        borderLeftWidth: 4,
    },
    flagIcon: { fontSize: 20 },
    flagContent: { flex: 1 },
    flagTitle: { fontSize: 13, fontWeight: '600' },
    flagDesc: { fontSize: 12, color: colors.charcoal, marginTop: 2 },

    ingredientTable: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.purple, // Brand purple table header
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
    },
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: colors.white },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.cream,
    },
    tableRowEven: { backgroundColor: colors.lavender + '40' },
    tableCell: { justifyContent: 'center' },
    ingredientName: { fontSize: 12, fontWeight: '600', color: colors.black },
    ingredientInci: { fontSize: 9, color: colors.charcoal, marginTop: 1 },
    isiScoreBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    isiScoreText: { fontSize: 11, fontWeight: 'bold', color: colors.white },
    ingredientFunction: { fontSize: 11, color: colors.charcoal },
    ingredientFlag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    ingredientFlagText: { fontSize: 10, color: '#F59E0B' },

    twoColumn: {
        flexDirection: 'row',
        gap: spacing[4],
        marginBottom: spacing[5],
    },
    column: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
    },
    columnTitle: { fontSize: 13, fontWeight: 'bold', color: colors.black, marginBottom: spacing[3] },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginBottom: spacing[2] },
    listItemText: { flex: 1, fontSize: 12, color: colors.charcoal },
    noConcerns: { fontSize: 12, color: colors.mint, fontStyle: 'italic' },

    matchCard: {
        borderRadius: radii.lg,
        padding: spacing[4],
    },
    matchStatus: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginBottom: spacing[2] },
    matchReason: { fontSize: 13, color: colors.charcoal, marginTop: 4 },

    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        justifyContent: 'space-around',
    },
    statItem: { alignItems: 'center', gap: 4 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: colors.black },
    statLabel: { fontSize: 11, color: colors.charcoal },
});
