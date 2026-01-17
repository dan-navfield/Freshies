/**
 * Parent Page 2: Risk Summary (Black Theme)
 * Large animated score, bullet points, practical tips
 * Theme: Black background with mint accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Shield, AlertTriangle, Check, X, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { sampleProductCaution, getScoreColor, getTierColor, getSeverityColor } from '../../../src/data/mockProductData';

const product = sampleProductCaution;

export default function ProductDetailParent2Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Black Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.mint} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Risk Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Score Section */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: product.image_url }} style={styles.heroImage} />
                    <View style={styles.heroOverlay}>
                        <Text style={styles.brandName}>{product.brand}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                    </View>

                    {/* Large Score Circle */}
                    <View style={[styles.scoreCircle, { borderColor: getScoreColor(product.safety_score) }]}>
                        <Text style={[styles.scoreNumber, { color: getScoreColor(product.safety_score) }]}>{product.safety_score}</Text>
                        <Text style={styles.scoreOutOf}>/100</Text>
                        <View style={[styles.tierBadge, { backgroundColor: getTierColor(product.safety_tier) }]}>
                            <Text style={styles.tierText}>Tier {product.safety_tier}</Text>
                        </View>
                    </View>
                </View>

                {/* Risk Level Banner */}
                <View style={[styles.riskBanner, { backgroundColor: getScoreColor(product.safety_score) + '30' }]}>
                    <AlertTriangle size={24} color={getScoreColor(product.safety_score)} />
                    <View style={styles.riskBannerContent}>
                        <Text style={[styles.riskLevel, { color: getScoreColor(product.safety_score) }]}>
                            {product.safety_score >= 75 ? 'LOW RISK' : product.safety_score >= 50 ? 'MODERATE RISK' : 'HIGH RISK'}
                        </Text>
                        <Text style={styles.riskDescription}>
                            {product.safety_score >= 75
                                ? 'Suitable for children with parent supervision'
                                : product.safety_score >= 50
                                    ? 'Use with caution - review flags below'
                                    : 'Not recommended for children'}
                        </Text>
                    </View>
                </View>

                {/* AI Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Parent Summary</Text>
                    <Text style={styles.summaryText}>{product.parent_message}</Text>
                </View>

                {/* Key Points */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Key Points</Text>

                    {product.concerns.length > 0 && (
                        <View style={styles.pointsSection}>
                            <Text style={styles.pointsLabel}>⚠️ Watch Out For:</Text>
                            {product.concerns.map((concern, i) => (
                                <View key={i} style={styles.pointItem}>
                                    <X size={14} color="#EF4444" />
                                    <Text style={styles.pointText}>{concern}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {product.benefits.length > 0 && (
                        <View style={styles.pointsSection}>
                            <Text style={styles.pointsLabel}>✅ Good Things:</Text>
                            {product.benefits.map((benefit, i) => (
                                <View key={i} style={styles.pointItem}>
                                    <Check size={14} color={colors.mint} />
                                    <Text style={styles.pointText}>{benefit}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Flags List */}
                {product.flags.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Safety Flags</Text>
                        {product.flags.map((flag, i) => (
                            <View key={i} style={[styles.flagItem, { borderLeftColor: getSeverityColor(flag.severity) }]}>
                                <View style={styles.flagHeader}>
                                    <Text style={styles.flagIcon}>{flag.icon}</Text>
                                    <Text style={[styles.flagTitle, { color: getSeverityColor(flag.severity) }]}>{flag.title}</Text>
                                    <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(flag.severity) }]}>
                                        <Text style={styles.severityText}>{flag.severity.toUpperCase()}</Text>
                                    </View>
                                </View>
                                <Text style={styles.flagDescription}>{flag.description}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Practical Tips */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Lightbulb size={20} color={colors.yellow} />
                        <Text style={styles.cardTitle}>Practical Tips</Text>
                    </View>
                    <View style={styles.tipsList}>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>1</Text>
                            <Text style={styles.tipText}>Start with a patch test on a small area</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>2</Text>
                            <Text style={styles.tipText}>Use 2-3 times per week initially</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>3</Text>
                            <Text style={styles.tipText}>Always follow with sunscreen during the day</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.declineButton}>
                        <ThumbsDown size={20} color="#EF4444" />
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton}>
                        <ThumbsUp size={20} color={colors.black} />
                        <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.black },

    header: {
        backgroundColor: colors.black,
        paddingTop: 60,
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.purple + '40',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.purple + '30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },

    scrollContent: { flex: 1 },

    heroSection: {
        alignItems: 'center',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[5],
        backgroundColor: colors.purple + '20',
    },
    heroImage: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: colors.purple + '40',
        borderWidth: 2,
        borderColor: colors.purple,
    },
    heroOverlay: { alignItems: 'center', marginTop: spacing[4] },
    brandName: { fontSize: 14, fontWeight: '600', color: colors.mint },
    productName: { fontSize: 22, fontWeight: 'bold', color: colors.white, marginTop: 4, textAlign: 'center' },

    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        backgroundColor: colors.black,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing[5],
    },
    scoreNumber: { fontSize: 42, fontWeight: 'bold' },
    scoreOutOf: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: -4 },
    tierBadge: {
        position: 'absolute',
        bottom: -10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tierText: { fontSize: 11, fontWeight: 'bold', color: colors.white },

    riskBanner: {
        marginHorizontal: spacing[5],
        marginTop: spacing[5],
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    riskBannerContent: { flex: 1 },
    riskLevel: { fontSize: 14, fontWeight: 'bold' },
    riskDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    card: {
        backgroundColor: colors.purple + '20',
        marginHorizontal: spacing[5],
        borderRadius: radii.lg,
        padding: spacing[4],
        marginTop: spacing[4],
        borderWidth: 1,
        borderColor: colors.purple + '40',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.white, marginBottom: spacing[3] },
    summaryText: { fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.8)' },

    pointsSection: { marginBottom: spacing[4] },
    pointsLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: spacing[2] },
    pointItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], marginBottom: spacing[2] },
    pointText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.9)' },

    flagItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: spacing[3],
        marginBottom: spacing[3],
        borderLeftWidth: 4,
    },
    flagHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
    flagIcon: { fontSize: 18 },
    flagTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    severityText: { fontSize: 9, fontWeight: 'bold', color: colors.white },
    flagDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

    tipsList: { gap: spacing[3] },
    tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
    tipNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.mint,
        textAlign: 'center',
        lineHeight: 24,
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.black,
        overflow: 'hidden',
    },
    tipText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },

    actionRow: {
        flexDirection: 'row',
        marginHorizontal: spacing[5],
        gap: spacing[3],
        marginTop: spacing[5],
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: 'rgba(239,68,68,0.2)',
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    declineText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.mint,
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
    },
    approveText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
