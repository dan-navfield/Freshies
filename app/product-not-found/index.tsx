/**
 * Product Not Found Flow - Entry Screen
 * Graceful failure message with option to save product
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { Camera, Search, PackagePlus, ChevronRight, HelpCircle } from 'lucide-react-native';

export default function ProductNotFoundScreen() {
    const params = useLocalSearchParams<{
        imageUri?: string;
        barcode?: string;
    }>();

    const handleSaveToShelf = () => {
        router.push({
            pathname: '/product-not-found/capture',
            params: {
                frontImageUri: params.imageUri,
                barcode: params.barcode,
            },
        });
    };

    const handleTryAgain = () => {
        router.back();
    };

    const handleSearchManually = () => {
        router.push('/product-not-found/search');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={handleTryAgain}>
                    <Text style={styles.closeText}>← Back</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <HelpCircle size={64} color={colors.mint} />
                </View>

                {/* Title & Message */}
                <Text style={styles.title}>Product Not Found</Text>
                <Text style={styles.subtitle}>
                    We haven't seen this product before, but that's okay!
                </Text>

                {/* Reassurance Card */}
                <View style={styles.infoCard}>
                    <PackagePlus size={24} color={colors.purple} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Help us improve</Text>
                        <Text style={styles.infoText}>
                            Take a quick photo of the front and ingredients. We'll save it to your shelf and review it for the database.
                        </Text>
                    </View>
                </View>

                {/* What you'll need */}
                <View style={styles.checklistCard}>
                    <Text style={styles.checklistTitle}>📸 What we'll need:</Text>
                    <View style={styles.checklistItem}>
                        <View style={styles.checkDot} />
                        <Text style={styles.checklistText}>Clear photo of the front (name & brand)</Text>
                    </View>
                    <View style={styles.checklistItem}>
                        <View style={styles.checkDot} />
                        <Text style={styles.checklistText}>Clear photo of the ingredients list</Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                {/* Primary CTA */}
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveToShelf}>
                    <Camera size={22} color={colors.black} />
                    <Text style={styles.primaryButtonText}>Save to My Shelf</Text>
                    <ChevronRight size={20} color={colors.black} />
                </TouchableOpacity>

                {/* Secondary Actions */}
                <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAgain}>
                    <Text style={styles.secondaryButtonText}>Try Scanning Again</Text>
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
        paddingBottom: spacing[4],
    },
    closeButton: {
        alignSelf: 'flex-start',
    },
    closeText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
    },
    iconContainer: {
        alignSelf: 'center',
        marginBottom: spacing[5],
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: spacing[6],
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: colors.purple + '20',
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        marginBottom: spacing[4],
        borderWidth: 1,
        borderColor: colors.purple + '40',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
    },
    checklistCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        padding: spacing[4],
    },
    checklistTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        marginBottom: spacing[3],
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        marginBottom: spacing[2],
    },
    checkDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.mint,
    },
    checklistText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    actions: {
        padding: spacing[5],
        paddingBottom: 40,
        gap: spacing[3],
    },
    primaryButton: {
        backgroundColor: colors.mint,
        borderRadius: radii.xl,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
        flex: 1,
        textAlign: 'center',
        marginLeft: spacing[2],
    },
    secondaryButton: {
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
        opacity: 0.8,
    },
});
