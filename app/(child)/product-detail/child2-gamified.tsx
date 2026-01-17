/**
 * Child Page 2: Gamified Achievement
 * XP/Points, badges, achievements with dark theme
 * Theme: Black background with mint/purple accents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Award, Zap, Star, Sparkles, Trophy, Lock } from 'lucide-react-native';
import { sampleProductExcellent, getScoreColor } from './mockProductData';

const product = sampleProductExcellent;

export default function ProductDetailChild2Screen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Black Header with XP */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.mint} />
                </TouchableOpacity>
                <View style={styles.xpBadge}>
                    <Zap size={16} color={colors.purple} fill={colors.purple} />
                    <Text style={styles.xpText}>+25 XP</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Product */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: product.image_url }} style={styles.heroImage} />
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>LVL 3</Text>
                    </View>
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                    <Text style={styles.brandName}>{product.brand}</Text>
                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Safety Stars */}
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <Star
                                key={n}
                                size={28}
                                color={colors.mint}
                                fill={n <= Math.round(product.safety_score / 20) ? colors.mint : 'none'}
                            />
                        ))}
                    </View>
                </View>

                {/* Quick Safety Icons */}
                <View style={styles.safetyIcons}>
                    <View style={styles.safetyIcon}>
                        <View style={[styles.safetyIconBg, { backgroundColor: colors.mint + '30' }]}>
                            <Text style={styles.safetyEmoji}>✨</Text>
                        </View>
                        <Text style={styles.safetyLabel}>Gentle</Text>
                    </View>
                    <View style={styles.safetyIcon}>
                        <View style={[styles.safetyIconBg, { backgroundColor: colors.purple + '30' }]}>
                            <Text style={styles.safetyEmoji}>🌿</Text>
                        </View>
                        <Text style={styles.safetyLabel}>Clean</Text>
                    </View>
                    <View style={styles.safetyIcon}>
                        <View style={[styles.safetyIconBg, { backgroundColor: colors.mint + '30' }]}>
                            <Text style={styles.safetyEmoji}>👶</Text>
                        </View>
                        <Text style={styles.safetyLabel}>Kid Safe</Text>
                    </View>
                </View>

                {/* Achievement Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Product Mastery</Text>
                    <View style={styles.achievementCard}>
                        <View style={styles.achievementProgress}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: '65%' }]} />
                            </View>
                            <Text style={styles.progressText}>65% Complete</Text>
                        </View>
                        <View style={styles.achievementBadges}>
                            <View style={[styles.badge, styles.badgeEarned]}>
                                <Award size={24} color={colors.mint} />
                                <Text style={styles.badgeLabel}>First Use</Text>
                            </View>
                            <View style={[styles.badge, styles.badgeEarned]}>
                                <Star size={24} color={colors.purple} />
                                <Text style={styles.badgeLabel}>Week Streak</Text>
                            </View>
                            <View style={[styles.badge, styles.badgeLocked]}>
                                <Lock size={24} color={colors.charcoal} />
                                <Text style={styles.badgeLabelLocked}>Expert</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Did You Know */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💡 Did You Know?</Text>
                    <View style={styles.factCard}>
                        <Sparkles size={24} color={colors.mint} />
                        <Text style={styles.factText}>
                            Ceramides are natural fats in your skin that keep it smooth and hydrated - like a protective shield! 🛡️
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Your Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{product.usage_count}</Text>
                            <Text style={styles.statLabel}>Uses</Text>
                            <View style={styles.statXp}>
                                <Text style={styles.statXpText}>+{product.usage_count * 5} XP</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>7</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                            <View style={[styles.statXp, { backgroundColor: colors.purple + '30' }]}>
                                <Text style={[styles.statXpText, { color: colors.purple }]}>🔥 Hot!</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action */}
                <TouchableOpacity style={styles.useButton}>
                    <Zap size={20} color={colors.black} fill={colors.black} />
                    <Text style={styles.useButtonText}>I Used This! (+5 XP)</Text>
                </TouchableOpacity>

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
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.mint + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    xpText: { fontSize: 14, fontWeight: 'bold', color: colors.mint },

    scrollContent: { flex: 1 },

    heroSection: { alignItems: 'center', marginVertical: spacing[5] },
    heroImage: {
        width: 160,
        height: 160,
        borderRadius: 20,
        backgroundColor: colors.purple + '40',
        borderWidth: 3,
        borderColor: colors.mint,
    },
    levelBadge: {
        position: 'absolute',
        bottom: -10,
        backgroundColor: colors.purple,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    levelText: { fontSize: 12, fontWeight: 'bold', color: colors.white },

    productInfo: { alignItems: 'center', marginBottom: spacing[5] },
    brandName: { fontSize: 13, fontWeight: '600', color: colors.mint },
    productName: { fontSize: 22, fontWeight: 'bold', color: colors.white, marginTop: 4, textAlign: 'center', paddingHorizontal: spacing[5] },
    starsRow: { flexDirection: 'row', gap: 4, marginTop: spacing[3] },

    safetyIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[5],
        marginBottom: spacing[5],
    },
    safetyIcon: { alignItems: 'center' },
    safetyIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    safetyEmoji: { fontSize: 28 },
    safetyLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

    section: { marginHorizontal: spacing[5], marginBottom: spacing[5] },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white, marginBottom: spacing[3] },

    achievementCard: {
        backgroundColor: colors.purple + '20',
        borderRadius: radii.xl,
        padding: spacing[4],
        borderWidth: 1,
        borderColor: colors.purple + '40',
    },
    achievementProgress: { marginBottom: spacing[4] },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: spacing[2],
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.mint,
        borderRadius: 4,
    },
    progressText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
    achievementBadges: { flexDirection: 'row', justifyContent: 'space-around' },
    badge: {
        alignItems: 'center',
        padding: spacing[3],
        borderRadius: radii.lg,
        width: 80,
    },
    badgeEarned: { backgroundColor: 'rgba(255,255,255,0.1)' },
    badgeLocked: { backgroundColor: 'rgba(255,255,255,0.05)' },
    badgeLabel: { fontSize: 10, color: colors.white, marginTop: 6, textAlign: 'center' },
    badgeLabelLocked: { fontSize: 10, color: colors.charcoal, marginTop: 6, textAlign: 'center' },

    factCard: {
        backgroundColor: colors.mint + '20',
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        borderLeftWidth: 4,
        borderLeftColor: colors.mint,
    },
    factText: { flex: 1, fontSize: 14, lineHeight: 22, color: 'rgba(255,255,255,0.9)' },

    statsGrid: { flexDirection: 'row', gap: spacing[3] },
    statCard: {
        flex: 1,
        backgroundColor: colors.purple + '20',
        borderRadius: radii.lg,
        padding: spacing[4],
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.purple + '40',
    },
    statNumber: { fontSize: 32, fontWeight: 'bold', color: colors.white },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    statXp: {
        backgroundColor: colors.mint + '30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: spacing[2],
    },
    statXpText: { fontSize: 10, fontWeight: '600', color: colors.mint },

    useButton: {
        marginHorizontal: spacing[5],
        backgroundColor: colors.mint,
        borderRadius: radii.xl,
        paddingVertical: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    useButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.black },
});
