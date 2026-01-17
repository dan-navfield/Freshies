/**
 * Product Not Found Flow - Completion Screen
 * Saves submission and shows confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { Check, Home, ShoppingBag, Clock, AlertTriangle } from 'lucide-react-native';
import { createSubmission } from '../../src/services/userSubmissions';
import { uploadImage } from '../../src/services/freshiesBackend';

export default function CompleteScreen() {
    const params = useLocalSearchParams<{
        frontImageUri?: string;
        ingredientsImageUri?: string;
        barcode?: string;
        productName?: string;
        brandName?: string;
        ingredientsText?: string;
        ocrRawText?: string;
        profileId?: string; // For child accounts
    }>();

    const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        saveProduct();
    }, []);

    const saveProduct = async () => {
        try {
            setStatus('saving');

            // For now, use local URIs directly since backend upload isn't available
            // In production, these would be uploaded to Supabase storage
            const frontImageUrl = params.frontImageUri || '';
            const ingredientsImageUrl = params.ingredientsImageUri || '';

            // Create submission with local URIs
            console.log('📝 Creating submission...');
            await createSubmission({
                front_image_url: frontImageUrl,
                ingredients_image_url: ingredientsImageUrl,
                product_name: params.productName,
                brand_name: params.brandName,
                ingredients_text: params.ingredientsText || '',
                ocr_raw_text: params.ocrRawText,
                barcode: params.barcode,
                profile_id: params.profileId, // Pass profile for child shelf
            });

            console.log('✅ Submission created successfully!');
            setStatus('success');

        } catch (error) {
            console.error('❌ Error saving product:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
            setStatus('error');
        }
    };

    const handleGoHome = () => {
        router.replace('/(parent)/(tabs)/scan');
    };

    const handleViewShelf = () => {
        router.replace('/(parent)/(tabs)/shelf');
    };

    const handleRetry = () => {
        saveProduct();
    };

    // Saving state
    if (status === 'saving') {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={colors.mint} />
                    <Text style={styles.loadingTitle}>Saving Product...</Text>
                    <Text style={styles.loadingSubtitle}>
                        Uploading photos and saving to your shelf
                    </Text>
                </View>
            </View>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.content}>
                    <View style={styles.errorIcon}>
                        <AlertTriangle size={48} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Couldn't Save Product</Text>
                    <Text style={styles.errorText}>
                        {errorMessage || 'Something went wrong. Please try again.'}
                    </Text>
                    <View style={styles.errorActions}>
                        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleGoHome}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Success state
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                {/* Success animation */}
                <View style={styles.successIcon}>
                    <Check size={48} color={colors.black} />
                </View>

                <Text style={styles.title}>Product Saved! 🎉</Text>
                <Text style={styles.subtitle}>
                    Your product has been added to your shelf
                </Text>

                {/* Product preview */}
                <View style={styles.productCard}>
                    {params.frontImageUri && (
                        <Image source={{ uri: params.frontImageUri }} style={styles.productImage} />
                    )}
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>
                            {params.productName || 'Unknown Product'}
                        </Text>
                        {params.brandName && (
                            <Text style={styles.productBrand}>{params.brandName}</Text>
                        )}

                        {/* Status badges */}
                        <View style={styles.badges}>
                            <View style={styles.badge}>
                                <Clock size={12} color={colors.yellow} />
                                <Text style={styles.badgeText}>Pending Review</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Info card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>What happens next?</Text>
                    <View style={styles.infoItem}>
                        <View style={styles.infoDot} />
                        <Text style={styles.infoText}>
                            We'll analyze the ingredients for you
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.infoDot} />
                        <Text style={styles.infoText}>
                            The product is visible only on your shelf for now
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.infoDot} />
                        <Text style={styles.infoText}>
                            We'll review and add it to the database
                        </Text>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleViewShelf}>
                    <ShoppingBag size={22} color={colors.black} />
                    <Text style={styles.primaryButtonText}>View My Shelf</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                    <Home size={20} color={colors.white} />
                    <Text style={styles.secondaryButtonText}>Scan Another</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: spacing[6],
        paddingTop: 120,
        alignItems: 'center',
    },
    loadingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginTop: spacing[6],
        textAlign: 'center',
    },
    loadingSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: spacing[2],
        textAlign: 'center',
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EF4444' + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[5],
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: spacing[2],
    },
    errorText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    errorActions: {
        gap: spacing[3],
        width: '100%',
    },
    retryButton: {
        backgroundColor: colors.mint,
        borderRadius: radii.lg,
        paddingVertical: spacing[4],
        alignItems: 'center',
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.black,
    },
    cancelButton: {
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
    },
    successIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.mint,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[5],
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginTop: spacing[2],
        marginBottom: spacing[6],
    },
    productCard: {
        backgroundColor: colors.purple + '20',
        borderRadius: radii.xl,
        padding: spacing[4],
        flexDirection: 'row',
        width: '100%',
        marginBottom: spacing[5],
        borderWidth: 1,
        borderColor: colors.purple + '40',
    },
    productImage: {
        width: 70,
        height: 90,
        borderRadius: radii.lg,
        backgroundColor: colors.purple + '40',
    },
    productInfo: {
        flex: 1,
        marginLeft: spacing[4],
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    productBrand: {
        fontSize: 13,
        color: colors.mint,
        marginTop: 2,
    },
    badges: {
        flexDirection: 'row',
        gap: spacing[2],
        marginTop: spacing[3],
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.yellow + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.yellow,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        padding: spacing[4],
        width: '100%',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        marginBottom: spacing[3],
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        marginBottom: spacing[2],
    },
    infoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.mint,
        marginTop: 6,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 18,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
    secondaryButton: {
        paddingVertical: spacing[3],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
        opacity: 0.8,
    },
});
