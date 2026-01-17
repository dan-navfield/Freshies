/**
 * Parent Page 4: Approval Queue Style
 * Card-based theme matching approval queue UI
 * Theme: Purple header, cream body, mint accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Clock, ThumbsUp, ThumbsDown, MessageCircle, User } from 'lucide-react-native';
import { sampleProductCaution, getSeverityColor } from '../../../src/data/mockProductData';

const product = sampleProductCaution;

export default function ProductDetailParent4Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Purple Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerLabel}>APPROVAL REQUEST</Text>
                    <View style={styles.timeRow}>
                        <Clock size={12} color={colors.mint} />
                        <Text style={styles.timeText}>2 hours ago</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Child Info Card */}
                <View style={styles.childCard}>
                    <View style={styles.childAvatar}>
                        <User size={24} color={colors.purple} />
                    </View>
                    <View style={styles.childInfo}>
                        <Text style={styles.childName}>Emma</Text>
                        <Text style={styles.childAge}>8 years old</Text>
                    </View>
                    <View style={styles.requestType}>
                        <Text style={styles.requestTypeText}>Scanned</Text>
                    </View>
                </View>

                {/* Product Card */}
                <View style={styles.productCard}>
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    <View style={styles.productContent}>
                        <Text style={styles.brandName}>{product.brand}</Text>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.productMeta}>
                            <Text style={styles.metaText}>{product.category}</Text>
                            <Text style={styles.metaText}>•</Text>
                            <Text style={styles.metaText}>{product.size}</Text>
                        </View>
                    </View>
                </View>

                {/* Flags Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>⚠️ {product.flags.length} Flag{product.flags.length !== 1 ? 's' : ''} Detected</Text>
                    </View>

                    {product.flags.map((flag, i) => (
                        <View key={i} style={styles.flagCard}>
                            <View style={styles.flagHeader}>
                                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(flag.severity) }]} />
                                <Text style={styles.flagTitle}>{flag.title}</Text>
                                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(flag.severity) + '20' }]}>
                                    <Text style={[styles.severityText, { color: getSeverityColor(flag.severity) }]}>
                                        {flag.severity.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.flagDescription}>{flag.description}</Text>
                            <View style={styles.whyMatters}>
                                <Text style={styles.whyMattersLabel}>Why this matters:</Text>
                                <Text style={styles.whyMattersText}>
                                    {flag.severity === 'danger'
                                        ? 'This ingredient is not recommended for children and may cause harm.'
                                        : flag.severity === 'warning'
                                            ? 'Extra caution is advised. Consider alternatives if possible.'
                                            : 'Something to be aware of, but generally manageable.'}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Child Notes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💬 Emma's Note</Text>
                    <View style={styles.noteCard}>
                        <MessageCircle size={16} color={colors.purple} />
                        <Text style={styles.noteText}>"My friend has this and it smells pretty!"</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    <TouchableOpacity style={styles.declineButton}>
                        <ThumbsDown size={20} color="#EF4444" />
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton}>
                        <ThumbsUp size={20} color={colors.black} />
                        <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickAction}>
                        <Text style={styles.quickActionText}>Add note for Emma</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAction}>
                        <Text style={styles.quickActionText}>Suggest alternative</Text>
                    </TouchableOpacity>
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
        paddingBottom: spacing[4],
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
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    timeText: { fontSize: 12, color: colors.white },

    scrollContent: { flex: 1, padding: spacing[5] },

    childCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
        borderWidth: 2,
        borderColor: colors.purple + '30',
    },
    childAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.lavender,
        alignItems: 'center',
        justifyContent: 'center',
    },
    childInfo: { flex: 1, marginLeft: spacing[3] },
    childName: { fontSize: 16, fontWeight: 'bold', color: colors.black },
    childAge: { fontSize: 13, color: colors.charcoal, marginTop: 2 },
    requestType: {
        backgroundColor: colors.mint + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    requestTypeText: { fontSize: 12, fontWeight: '600', color: colors.black },

    productCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        marginBottom: spacing[5],
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: radii.md,
        backgroundColor: colors.lavender,
    },
    productContent: { flex: 1, marginLeft: spacing[4] },
    brandName: { fontSize: 12, fontWeight: '600', color: colors.purple },
    productName: { fontSize: 15, fontWeight: 'bold', color: colors.black, marginTop: 2 },
    productMeta: { flexDirection: 'row', gap: 6, marginTop: spacing[2] },
    metaText: { fontSize: 12, color: colors.charcoal },

    section: { marginBottom: spacing[5] },
    sectionHeader: { marginBottom: spacing[3] },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.black },

    flagCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        marginBottom: spacing[3],
    },
    flagHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] },
    severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing[2] },
    flagTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.black },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    severityText: { fontSize: 10, fontWeight: '700' },
    flagDescription: { fontSize: 13, color: colors.charcoal, marginBottom: spacing[3] },
    whyMatters: {
        backgroundColor: colors.purple + '10',
        borderRadius: 8,
        padding: spacing[3],
    },
    whyMattersLabel: { fontSize: 11, fontWeight: '600', color: colors.purple, marginBottom: 4 },
    whyMattersText: { fontSize: 12, color: colors.charcoal, lineHeight: 18 },

    noteCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
    },
    noteText: { flex: 1, fontSize: 14, color: colors.charcoal, fontStyle: 'italic' },

    actionSection: {
        flexDirection: 'row',
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.white,
        paddingVertical: spacing[4],
        borderRadius: radii.lg,
        borderWidth: 2,
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

    quickActions: { gap: spacing[2] },
    quickAction: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        alignItems: 'center',
    },
    quickActionText: { fontSize: 14, fontWeight: '600', color: colors.purple },
});
