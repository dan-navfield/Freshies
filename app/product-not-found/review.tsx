/**
 * Product Not Found Flow - Review Screen
 * OCR processing + ingredient matching + lightweight confirmation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { ChevronLeft, Check, Wand2, AlertCircle, CheckCircle, XCircle, HelpCircle, Trash2 } from 'lucide-react-native';
import { extractTextFromImage, parseIngredients } from '../../src/services/ocr/ingredientScanner';
import { matchIngredientsToDatabase, IngredientMatchResult } from '../../../src/modules/ingredients';

/**
 * Convert text to sentence case (capitalize first letter of each word)
 */
const toSentenceCase = (text: string): string => {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function ReviewScreen() {
    const params = useLocalSearchParams<{
        frontImageUri?: string;
        ingredientsImageUri?: string;
        barcode?: string;
        // Pre-filled from AI identification
        productName?: string;
        brandName?: string;
    }>();

    // Form state - apply sentence case to AI-detected names
    const [productName, setProductName] = useState(toSentenceCase(params.productName || ''));
    const [brandName, setBrandName] = useState(toSentenceCase(params.brandName || ''));
    const [matchedIngredients, setMatchedIngredients] = useState<IngredientMatchResult[]>([]);

    // UI state
    const [isProcessing, setIsProcessing] = useState(true);
    const [processingStep, setProcessingStep] = useState('Reading text from photos...');
    const [ocrError, setOcrError] = useState<string | null>(null);
    const [nameAutoFilled, setNameAutoFilled] = useState(!!params.productName);
    const [brandAutoFilled, setBrandAutoFilled] = useState(!!params.brandName);

    // Run OCR and matching on mount
    useEffect(() => {
        processImages();
    }, []);

    const processImages = async () => {
        setIsProcessing(true);
        setOcrError(null);

        try {
            // Process ingredients image
            if (params.ingredientsImageUri) {
                setProcessingStep('Reading ingredients from photo...');
                console.log('🔍 Running OCR on ingredients image...');
                const ocrResult = await extractTextFromImage(params.ingredientsImageUri);

                if (ocrResult.success && ocrResult.text) {
                    // Parse ingredients
                    const parsedIngredients = ocrResult.ingredients || parseIngredients(ocrResult.text);

                    if (parsedIngredients.length > 0) {
                        setProcessingStep(`Matching ${parsedIngredients.length} ingredients...`);

                        // Match against database
                        const matches = await matchIngredientsToDatabase(parsedIngredients);
                        setMatchedIngredients(matches);

                        const matchCount = matches.filter(m => m.matched).length;
                        console.log(`✅ Matched ${matchCount}/${matches.length} ingredients`);
                    } else {
                        setOcrError('No ingredients detected. Please try a clearer photo.');
                    }
                } else {
                    setOcrError(ocrResult.error || 'Could not read text from image');
                }
            }
        } catch (error) {
            console.error('Processing Error:', error);
            setOcrError('Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setMatchedIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (matchedIngredients.length === 0) {
            return;
        }

        // Convert matched ingredients back to text for storage
        const ingredientsText = matchedIngredients
            .map(m => m.matchedIngredient?.name || m.rawName)
            .join(', ');

        router.push({
            pathname: '/product-not-found/complete',
            params: {
                frontImageUri: params.frontImageUri,
                ingredientsImageUri: params.ingredientsImageUri,
                barcode: params.barcode,
                productName,
                brandName,
                ingredientsText,
                matchedCount: matchedIngredients.filter(m => m.matched).length.toString(),
                totalCount: matchedIngredients.length.toString(),
            },
        });
    };

    const canSubmit = matchedIngredients.length > 0;
    const matchStats = {
        total: matchedIngredients.length,
        matched: matchedIngredients.filter(m => m.matched).length,
        unmatched: matchedIngredients.filter(m => !m.matched).length,
    };

    const getStatusIcon = (result: IngredientMatchResult) => {
        if (result.matched) {
            if (result.confidence === 'high') {
                return <CheckCircle size={18} color={colors.mint} />;
            }
            return <CheckCircle size={18} color="#F59E0B" />;
        }
        return <HelpCircle size={18} color="#6B7280" />;
    };

    const getStatusColor = (result: IngredientMatchResult) => {
        if (result.matched) {
            return result.confidence === 'high' ? colors.mint : '#F59E0B';
        }
        return '#6B7280';
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Processing indicator */}
                    {isProcessing && (
                        <View style={styles.processingCard}>
                            <ActivityIndicator size="large" color={colors.mint} />
                            <Text style={styles.processingText}>{processingStep}</Text>
                        </View>
                    )}

                    {/* OCR Error */}
                    {ocrError && !isProcessing && (
                        <View style={styles.errorCard}>
                            <AlertCircle size={24} color="#F59E0B" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.errorTitle}>Couldn't read automatically</Text>
                                <Text style={styles.errorText}>{ocrError}</Text>
                            </View>
                        </View>
                    )}

                    {/* Image previews */}
                    <View style={styles.imagesRow}>
                        {params.frontImageUri && (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: params.frontImageUri }} style={styles.previewImage} />
                                <Text style={styles.imageLabel}>Front</Text>
                            </View>
                        )}
                        {params.ingredientsImageUri && (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: params.ingredientsImageUri }} style={styles.previewImage} />
                                <Text style={styles.imageLabel}>Ingredients</Text>
                            </View>
                        )}
                    </View>

                    {/* Product Info (pre-filled from AI) */}
                    <View style={styles.form}>
                        {/* Product Name */}
                        <View style={styles.formField}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Product Name</Text>
                                {nameAutoFilled && (
                                    <View style={styles.autoFilledBadge}>
                                        <Wand2 size={12} color={colors.mint} />
                                        <Text style={styles.autoFilledText}>AI Detected</Text>
                                    </View>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                value={productName}
                                onChangeText={(text) => {
                                    setProductName(text);
                                    setNameAutoFilled(false);
                                }}
                                placeholder="e.g. Gentle Face Cleanser"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                        </View>

                        {/* Brand Name */}
                        <View style={styles.formField}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Brand Name</Text>
                                {brandAutoFilled && (
                                    <View style={styles.autoFilledBadge}>
                                        <Wand2 size={12} color={colors.mint} />
                                        <Text style={styles.autoFilledText}>AI Detected</Text>
                                    </View>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                value={brandName}
                                onChangeText={(text) => {
                                    setBrandName(text);
                                    setBrandAutoFilled(false);
                                }}
                                placeholder="e.g. CeraVe, Cetaphil"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                        </View>

                        {/* Ingredients List */}
                        <View style={styles.formField}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Ingredients ({matchStats.total})</Text>
                                {matchStats.total > 0 && (
                                    <View style={styles.matchStats}>
                                        <Text style={styles.matchStatsText}>
                                            {matchStats.matched} matched • {matchStats.unmatched} new
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Ingredient List */}
                            <View style={styles.ingredientsList}>
                                {matchedIngredients.map((result, index) => (
                                    <View key={index} style={styles.ingredientItem}>
                                        {getStatusIcon(result)}
                                        <View style={styles.ingredientInfo}>
                                            <Text style={[styles.ingredientName, { color: getStatusColor(result) }]}>
                                                {result.matchedIngredient?.name || result.rawName}
                                            </Text>
                                            {result.matched && result.matchedIngredient && (
                                                <Text style={styles.ingredientMeta}>
                                                    {result.matchedIngredient.safetyStatus === 'safe' ? '✓ Safe' :
                                                        result.matchedIngredient.safetyStatus === 'caution' ? '⚠ Caution' : '⛔ Avoid'}
                                                    {result.matchedIngredient.score > 0 && ` • ISI: ${result.matchedIngredient.score}`}
                                                </Text>
                                            )}
                                            {!result.matched && (
                                                <Text style={styles.ingredientMeta}>Not in database - will be added</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={() => handleRemoveIngredient(index)}
                                        >
                                            <Trash2 size={16} color="rgba(255,255,255,0.4)" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {matchedIngredients.length === 0 && !isProcessing && (
                                    <Text style={styles.noIngredientsText}>
                                        No ingredients detected yet
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                >
                    <Check size={22} color={colors.black} />
                    <Text style={styles.submitButtonText}>
                        Confirm {matchStats.total} Ingredients
                    </Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: spacing[5],
        paddingBottom: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
    },
    scrollContent: {
        flex: 1,
        padding: spacing[5],
    },
    processingCard: {
        backgroundColor: colors.purple + '20',
        borderRadius: radii.lg,
        padding: spacing[6],
        alignItems: 'center',
        gap: spacing[4],
        marginBottom: spacing[5],
    },
    processingText: {
        fontSize: 16,
        color: colors.white,
    },
    errorCard: {
        backgroundColor: '#F59E0B' + '20',
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[3],
        marginBottom: spacing[5],
        borderWidth: 1,
        borderColor: '#F59E0B' + '40',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    errorText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    imagesRow: {
        flexDirection: 'row',
        gap: spacing[4],
        marginBottom: spacing[5],
    },
    imagePreview: {
        flex: 1,
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        aspectRatio: 3 / 4,
        borderRadius: radii.lg,
        backgroundColor: colors.purple + '30',
    },
    imageLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: spacing[2],
    },
    form: {
        gap: spacing[5],
    },
    formField: {
        gap: spacing[2],
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
    },
    autoFilledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.mint + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    autoFilledText: {
        fontSize: 11,
        color: colors.mint,
    },
    matchStats: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    matchStatsText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: radii.lg,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
        fontSize: 16,
        color: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ingredientsList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        gap: spacing[3],
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 14,
        fontWeight: '500',
    },
    ingredientMeta: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    removeButton: {
        padding: spacing[2],
    },
    noIngredientsText: {
        padding: spacing[6],
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
    },
    footer: {
        padding: spacing[5],
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    submitButton: {
        backgroundColor: colors.mint,
        borderRadius: radii.xl,
        paddingVertical: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
    },
    submitButtonDisabled: {
        backgroundColor: colors.charcoal,
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
});
