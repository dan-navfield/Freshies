/**
 * Product Not Found Flow - Photo Capture Screen
 * Guided capture for front and ingredients photos
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { Camera, X, Check, RotateCcw, Image as ImageIcon, ZapOff, Zap, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

type CaptureStep = 'front' | 'ingredients';

interface CaptureState {
    front: string | null;
    ingredients: string | null;
}

export default function CaptureScreen() {
    const params = useLocalSearchParams<{
        frontImageUri?: string;
        barcode?: string;
        // New params from product-result when adding ingredients
        existingImageUri?: string;
        productName?: string;
        productBrand?: string;
        mode?: 'add_ingredients' | 'add_front' | 'full';
    }>();

    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // Determine which photo we already have
    const hasFrontImage = !!(params.frontImageUri || (params.mode === 'add_ingredients' && params.existingImageUri));
    const hasIngredientsImage = params.mode === 'add_front' && params.existingImageUri;

    // Start on the step we need
    const [currentStep, setCurrentStep] = useState<CaptureStep>(hasFrontImage ? 'ingredients' : 'front');
    const [captures, setCaptures] = useState<CaptureState>({
        front: params.frontImageUri || (params.mode === 'add_ingredients' ? params.existingImageUri : null) || null,
        ingredients: hasIngredientsImage ? (params.existingImageUri || null) : null,
    });
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const stepConfig = {
        front: {
            title: 'Front of Product',
            subtitle: 'Capture the product name and brand clearly',
            hints: ['Include the full product name', 'Make sure brand logo is visible', 'Avoid glare on packaging'],
            icon: '📦',
        },
        ingredients: {
            title: 'Ingredients List',
            subtitle: 'Capture the full ingredients panel',
            hints: ['Get close enough to read text', 'Ensure good lighting', 'Include all ingredients'],
            icon: '📋',
        },
    };

    const config = stepConfig[currentStep];
    const progress = captures.front ? (captures.ingredients ? 2 : 1) : 0;

    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;

        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.9,
                skipProcessing: false,
            });

            if (photo?.uri) {
                setPreviewUri(photo.uri);
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
            Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const handlePickFromLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            // Use different aspect ratio for ingredients vs front
            aspect: currentStep === 'ingredients' ? [4, 3] : [3, 4],
            quality: 1.0,
        });

        if (!result.canceled && result.assets[0]) {
            setPreviewUri(result.assets[0].uri);
        }
    };

    const handleConfirmPhoto = () => {
        if (!previewUri) return;

        const newCaptures = { ...captures, [currentStep]: previewUri };
        setCaptures(newCaptures);
        setPreviewUri(null);

        // Move to next step or proceed
        if (currentStep === 'front') {
            setCurrentStep('ingredients');
        } else {
            // Both photos captured, go to review
            router.push({
                pathname: '/product-not-found/review',
                params: {
                    frontImageUri: newCaptures.front,
                    ingredientsImageUri: newCaptures.ingredients,
                    barcode: params.barcode,
                    productName: params.productName,
                    brandName: params.productBrand,
                },
            });
        }
    };

    const handleRetake = () => {
        setPreviewUri(null);
    };

    const handleSkipToReview = () => {
        if (captures.front && captures.ingredients) {
            router.push({
                pathname: '/product-not-found/review',
                params: {
                    frontImageUri: captures.front,
                    ingredientsImageUri: captures.ingredients,
                    barcode: params.barcode,
                },
            });
        }
    };

    // Permission handling
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.messageText}>Loading camera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to capture product photos.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Preview mode
    if (previewUri) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />

                <Image source={{ uri: previewUri }} style={styles.previewImage} />

                {/* Preview overlay */}
                <View style={styles.previewOverlay}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewTitle}>Looking good?</Text>
                        <Text style={styles.previewSubtitle}>Make sure the {currentStep === 'front' ? 'product name' : 'ingredients'} are clearly visible</Text>
                    </View>

                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                            <RotateCcw size={24} color={colors.white} />
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPhoto}>
                            <Check size={24} color={colors.black} />
                            <Text style={styles.confirmText}>Use Photo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Camera mode
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                enableTorch={torchOn}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                    <X size={24} color={colors.white} />
                </TouchableOpacity>

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, progress >= 1 && styles.progressDotActive]} />
                    <View style={styles.progressLine} />
                    <View style={[styles.progressDot, progress >= 2 && styles.progressDotActive]} />
                </View>

                <TouchableOpacity style={styles.headerButton} onPress={() => setTorchOn(!torchOn)}>
                    {torchOn ? (
                        <Zap size={24} color={colors.yellow} fill={colors.yellow} />
                    ) : (
                        <ZapOff size={24} color={colors.white} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Step info - no icon, moved up */}
            <View style={styles.stepInfo}>
                {/* Captured indicator - now at top left */}
                {captures.front && (
                    <View style={styles.capturedIndicatorInline}>
                        <Check size={14} color={colors.mint} />
                        <Text style={styles.capturedTextInline}>Front photo captured</Text>
                    </View>
                )}
                <Text style={styles.stepTitle}>{config.title}</Text>
                <Text style={styles.stepSubtitle}>{config.subtitle}</Text>
            </View>

            {/* Framing area */}
            <View style={styles.frameContainer}>
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameTopRight]} />
                <View style={[styles.frameCorner, styles.frameBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameBottomRight]} />
            </View>

            {/* Hints - positioned below frame */}
            <View style={styles.hintsContainer}>
                {config.hints.map((hint, i) => (
                    <View key={i} style={styles.hintItem}>
                        <Text style={styles.hintBullet}>•</Text>
                        <Text style={styles.hintText}>{hint}</Text>
                    </View>
                ))}
            </View>

            {/* Capture controls */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.galleryButton} onPress={handlePickFromLibrary}>
                    <ImageIcon size={24} color={colors.white} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                {/* Skip/Continue if front already captured */}
                {captures.front && captures.ingredients ? (
                    <TouchableOpacity style={styles.skipButton} onPress={handleSkipToReview}>
                        <ChevronRight size={24} color={colors.mint} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    camera: {
        flex: 1,
    },
    messageText: {
        color: colors.white,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing[6],
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.white,
        marginBottom: spacing[3],
    },
    permissionText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    permissionButton: {
        backgroundColor: colors.mint,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        borderRadius: radii.pill,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing[5],
        zIndex: 10,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 2,
        borderColor: colors.white,
    },
    progressDotActive: {
        backgroundColor: colors.mint,
        borderColor: colors.mint,
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    stepInfo: {
        position: 'absolute',
        top: 110,
        left: spacing[5],
        right: spacing[5],
        alignItems: 'flex-start',
        zIndex: 10,
    },
    capturedIndicatorInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        marginBottom: spacing[2],
    },
    capturedTextInline: {
        fontSize: 13,
        color: colors.mint,
        fontWeight: '500',
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.white,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    stepSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    frameContainer: {
        position: 'absolute',
        top: height * 0.28,
        left: spacing[6],
        right: spacing[6],
        height: height * 0.38,
    },
    frameCorner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.mint,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        top: 0,
        left: 0,
    },
    frameTopRight: {
        top: 0,
        left: undefined,
        right: 0,
        borderLeftWidth: 0,
        borderRightWidth: 3,
    },
    frameBottomLeft: {
        top: undefined,
        bottom: 0,
        borderTopWidth: 0,
        borderBottomWidth: 3,
    },
    frameBottomRight: {
        top: undefined,
        left: undefined,
        right: 0,
        bottom: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 3,
        borderBottomWidth: 3,
    },
    hintsContainer: {
        position: 'absolute',
        bottom: 180,
        left: spacing[6],
        right: spacing[6],
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: radii.lg,
        padding: spacing[4],
    },
    hintItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing[2],
        marginBottom: 4,
    },
    hintBullet: {
        color: colors.mint,
        fontSize: 14,
        fontWeight: 'bold',
    },
    hintText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        flex: 1,
    },
    controls: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing[8],
    },
    galleryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.mint,
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.mint,
    },
    skipButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 50,
        height: 50,
    },
    capturedIndicator: {
        position: 'absolute',
        top: 120,
        right: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    capturedText: {
        fontSize: 12,
        color: colors.mint,
    },
    previewImage: {
        flex: 1,
        resizeMode: 'contain',
        backgroundColor: colors.black,
    },
    previewOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    previewHeader: {
        paddingTop: 100,
        paddingHorizontal: spacing[6],
        alignItems: 'center',
    },
    previewTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        textAlign: 'center',
    },
    previewSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: spacing[2],
    },
    previewActions: {
        flexDirection: 'row',
        paddingHorizontal: spacing[5],
        paddingBottom: 60,
        gap: spacing[4],
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        paddingVertical: spacing[4],
        borderRadius: radii.xl,
        borderWidth: 2,
        borderColor: colors.white,
    },
    retakeText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.mint,
        paddingVertical: spacing[4],
        borderRadius: radii.xl,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
    },
});
