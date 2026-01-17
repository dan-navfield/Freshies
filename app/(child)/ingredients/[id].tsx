import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowLeft, Share2, Bookmark, ExternalLink } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { getIngredientById, IngredientDetail } from '../../../src/services/ingredientsService';

export default function IngredientDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [ingredient, setIngredient] = useState<IngredientDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadIngredient(id as string);
        }
    }, [id]);

    const loadIngredient = async (ingId: string) => {
        setLoading(true);
        try {
            const data = await getIngredientById(ingId);
            setIngredient(data || null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.purple} size="large" />
            </View>
        );
    }

    if (!ingredient) {
        return (
            <View style={styles.container}>
                <Text>Ingredient not found</Text>
            </View>
        );
    }

    // Determine Badge Styling
    let BadgeIcon = ShieldCheck;
    let headerColor = colors.mint;
    let statusText = 'Safe for you';

    if (ingredient.safetyStatus === 'caution') {
        BadgeIcon = AlertTriangle;
        headerColor = colors.yellow;
        statusText = 'Use with caution';
    } else if (ingredient.safetyStatus === 'avoid') {
        BadgeIcon = ShieldAlert;
        headerColor = colors.red; // Assuming defined or fallback needed
        statusText = 'Avoid for now';
    }

    return (
        <View style={styles.container}>
            {/* Custom Header with Safety Color Background */}
            <View style={[styles.header, { backgroundColor: headerColor }]}>
                <SafeAreaView edges={['top']} style={styles.headerContent}>
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <ArrowLeft color="#000" size={24} />
                        </TouchableOpacity>
                        <View style={styles.navActions}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Share2 color="#000" size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Bookmark color="#000" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.titleContainer}>
                        {/* Score Indicator */}
                        <View style={[styles.scoreContainer, { backgroundColor: headerColor }]}>
                            <Text style={styles.scoreTitle}>ISI SCORE</Text>
                            <View style={styles.scoreBubble}>
                                <Text style={[styles.scoreText, { color: headerColor }]}>{ingredient.score}</Text>
                            </View>
                        </View>

                        <View style={styles.safetyBadge}>
                            <BadgeIcon size={16} color="#000" />
                            <Text style={styles.safetyText}>{statusText}</Text>
                        </View>
                        <Text style={styles.title}>{ingredient.name}</Text>
                        {ingredient.commonName && <Text style={styles.subtitle}>Also known as {ingredient.commonName}</Text>}

                        <View style={styles.tags}>
                            {ingredient.category.map((cat, i) => (
                                <View key={i} style={styles.tag}>
                                    <Text style={styles.tagText}>{cat}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* Sections */}

                {/* What it is */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>What it is</Text>
                    <Text style={styles.bodyText}>{ingredient.description}</Text>
                </View>

                {/* Good to Know / Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Why it's used</Text>
                    <Text style={styles.bodyText}>{ingredient.function}</Text>
                    {ingredient.benefits.map((benefit, i) => (
                        // Only show if different from function text to avoid dupes
                        benefit !== ingredient.function && (
                            <View key={i} style={styles.listItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.listText}>{benefit}</Text>
                            </View>
                        )
                    ))}
                </View>

                {/* Warnings / Watch outs - Only show if Risky */}
                {(ingredient.safetyStatus === 'caution' || ingredient.safetyStatus === 'avoid') && (
                    <View style={styles.warningSection}>
                        <Text style={styles.warningHeader}>Watch Out</Text>
                        {ingredient.safetyReason && ingredient.safetyReason !== ingredient.description && (
                            <Text style={styles.warningText}>• {ingredient.safetyReason}</Text>
                        )}
                        {ingredient.watchOuts?.map((watch, i) => (
                            <Text key={i} style={styles.warningText}>• {watch}</Text>
                        ))}
                    </View>
                )}

                {/* Myth Buster */}
                {ingredient.mythBuster && (
                    <View style={styles.mythBox}>
                        <Text style={styles.mythLabel}>MYTH:</Text>
                        <Text style={styles.mythText}>{ingredient.mythBuster?.myth || "Info not available"}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.mythLabel}>REALITY:</Text>
                        <Text style={styles.realityText}>{ingredient.mythBuster?.reality || "Info not available"}</Text>
                    </View>
                )}

                {/* Action Button */}
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>View {ingredient.productsCount} Products with {ingredient.name}</Text>
                    <ExternalLink size={20} color={colors.white} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
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
    header: {
        paddingBottom: spacing[6],
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: spacing[4],
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    navActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    iconButton: {
        padding: 8,
        borderRadius: radii.full,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    titleContainer: {
        alignItems: 'center',
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: spacing[3],
        padding: 6,
        borderRadius: radii.lg,
        backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent
    },
    scoreTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(0,0,0,0.6)',
        marginBottom: 2,
        letterSpacing: 0.5,
    },
    scoreBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    scoreText: {
        fontSize: 20,
        fontWeight: '900',
    },
    safetyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: spacing[3],
        paddingVertical: 6,
        marginBottom: spacing[3],
        gap: 6,
    },
    safetyText: {
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.6)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: spacing[3],
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontWeight: '600',
        fontSize: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing[5],
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: spacing[3],
    },
    bodyText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        marginBottom: spacing[2],
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.purple,
        marginRight: 10,
    },
    listText: {
        fontSize: 16,
        color: '#374151',
    },
    warningSection: {
        backgroundColor: '#FEF2F2', // Light red
        borderRadius: radii.lg,
        padding: spacing[4],
        marginBottom: spacing[6],
        borderLeftWidth: 4,
        borderLeftColor: colors.red,
    },
    warningHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#991B1B', // Dark red
        marginBottom: spacing[2],
    },
    warningText: {
        fontSize: 15,
        color: '#7F1D1D',
        marginBottom: 4,
        lineHeight: 22,
    },
    mythBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: radii.lg,
        padding: spacing[4],
        marginBottom: spacing[6],
    },
    mythLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#6B7280',
        marginBottom: 4,
    },
    mythText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#DC2626', // Red for myth
        marginBottom: spacing[3],
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: spacing[3],
    },
    realityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#059669', // Green for reality
    },
    actionButton: {
        backgroundColor: '#111827',
        borderRadius: radii.xl,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
