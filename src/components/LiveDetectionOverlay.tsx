import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Package, ChevronRight, Sparkles, X } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';
import { LiveDetectionResult } from '../services/camera/liveDetectionService';

interface LiveDetectionOverlayProps {
    result: LiveDetectionResult | null;
    onTap: () => void;
    onDismiss?: () => void;
    isAnalyzing?: boolean;
}

export default function LiveDetectionOverlay({
    result,
    onTap,
    onDismiss,
    isAnalyzing = false,
}: LiveDetectionOverlayProps) {
    const slideAnim = useRef(new Animated.Value(100)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (result?.detected && result.productName) {
            // Slide in animation
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }).start();
        } else {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: 100,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [result?.detected, result?.productName]);

    useEffect(() => {
        if (isAnalyzing) {
            // Pulse animation when analyzing
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isAnalyzing]);

    // Show analyzing indicator
    if (isAnalyzing && (!result?.detected || !result?.productName)) {
        return (
            <Animated.View
                style={[
                    styles.analyzingContainer,
                    { transform: [{ scale: pulseAnim }] }
                ]}
            >
                <Sparkles size={16} color={colors.mint} />
                <Text style={styles.analyzingText}>Scanning...</Text>
            </Animated.View>
        );
    }

    // Show detected product
    if (!result?.detected || !result?.productName) {
        return null;
    }

    const confidencePercent = Math.round((result.confidence || 0) * 100);

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}
        >
            {/* Dismiss button */}
            {onDismiss && (
                <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                    <X size={18} color={colors.white} />
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.card} onPress={onTap} activeOpacity={0.9}>
                <View style={styles.iconContainer}>
                    <Package size={28} color={colors.purple} />
                </View>

                <View style={styles.textContainer}>
                    {result.brandName && (
                        <Text style={styles.brandText}>{result.brandName}</Text>
                    )}
                    <Text style={styles.productText} numberOfLines={1}>
                        {result.productName}
                    </Text>
                    {result.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{result.category}</Text>
                            <Text style={styles.confidenceText}>{confidencePercent}% match</Text>
                        </View>
                    )}
                </View>

                <View style={styles.arrowContainer}>
                    <ChevronRight size={24} color={colors.purple} />
                </View>
            </TouchableOpacity>

            <Text style={styles.hintText}>Tap to view details • Tap X to dismiss</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 220,
        left: spacing[4],
        right: spacing[4],
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[3],
        paddingRight: spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        width: '100%',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: radii.lg,
        backgroundColor: colors.purple + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    textContainer: {
        flex: 1,
    },
    brandText: {
        fontSize: 11,
        color: colors.charcoal + '80',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    productText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: 2,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    categoryText: {
        fontSize: 12,
        color: colors.purple,
        fontWeight: '600',
    },
    confidenceText: {
        fontSize: 11,
        color: colors.charcoal + '60',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.purple + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hintText: {
        marginTop: spacing[2],
        fontSize: 12,
        color: colors.white + '80',
        fontWeight: '500',
    },
    analyzingContainer: {
        position: 'absolute',
        top: 180,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.pill,
        gap: spacing[2],
    },
    analyzingText: {
        color: colors.mint,
        fontSize: 13,
        fontWeight: '600',
    },
    dismissButton: {
        position: 'absolute',
        top: -12,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});
