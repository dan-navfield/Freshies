import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle, Camera, CheckCircle, XCircle } from 'lucide-react-native';
import { colors, spacing, radii } from '../../theme/tokens';
import { ImageQualityResult } from '../../services/camera/imageQualityChecker';

interface ImageQualityOverlayProps {
    visible: boolean;
    result: ImageQualityResult | null;
    onRetake: () => void;
    onProceed: () => void;
    onCancel: () => void;
}

export default function ImageQualityOverlay({
    visible,
    result,
    onRetake,
    onProceed,
    onCancel,
}: ImageQualityOverlayProps) {
    if (!visible || !result) return null;

    const getQualityColor = () => {
        switch (result.quality) {
            case 'good': return colors.mint;
            case 'fair': return colors.yellow;
            case 'poor': return '#FF6B6B';
            default: return colors.yellow;
        }
    };

    const getQualityIcon = () => {
        switch (result.quality) {
            case 'good': return <CheckCircle size={48} color={colors.mint} />;
            case 'fair': return <AlertTriangle size={48} color={colors.yellow} />;
            case 'poor': return <XCircle size={48} color="#FF6B6B" />;
            default: return <AlertTriangle size={48} color={colors.yellow} />;
        }
    };

    const getQualityTitle = () => {
        switch (result.quality) {
            case 'good': return 'Great Photo! 📸';
            case 'fair': return 'Photo Could Be Better';
            case 'poor': return 'Photo Needs Improvement';
            default: return 'Photo Quality';
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Quality Icon */}
                    <View style={styles.iconContainer}>
                        {getQualityIcon()}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{getQualityTitle()}</Text>

                    {/* Score Bar */}
                    <View style={styles.scoreContainer}>
                        <View style={styles.scoreBar}>
                            <View
                                style={[
                                    styles.scoreFill,
                                    { width: `${result.score}%`, backgroundColor: getQualityColor() }
                                ]}
                            />
                        </View>
                        <Text style={styles.scoreText}>{result.score}%</Text>
                    </View>

                    {/* Issues */}
                    {result.issues.length > 0 && (
                        <View style={styles.issuesContainer}>
                            {result.issues.map((issue, index) => (
                                <View key={index} style={styles.issueTag}>
                                    <Text style={styles.issueText}>{issue}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Suggestion */}
                    {result.suggestion && (
                        <Text style={styles.suggestion}>💡 {result.suggestion}</Text>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {result.quality !== 'good' && (
                            <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
                                <Camera size={20} color={colors.white} />
                                <Text style={styles.retakeButtonText}>Retake</Text>
                            </TouchableOpacity>
                        )}

                        {result.canProceed && (
                            <TouchableOpacity
                                style={[
                                    styles.proceedButton,
                                    result.quality === 'good' && styles.proceedButtonFull
                                ]}
                                onPress={onProceed}
                            >
                                <Text style={styles.proceedButtonText}>
                                    {result.quality === 'good' ? 'Continue' : 'Use Anyway'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {!result.canProceed && (
                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[4],
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[6],
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing[4],
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.charcoal,
        marginBottom: spacing[4],
        textAlign: 'center',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: spacing[4],
        gap: spacing[3],
    },
    scoreBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    scoreFill: {
        height: '100%',
        borderRadius: 4,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.charcoal,
        width: 40,
        textAlign: 'right',
    },
    issuesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    issueTag: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: '#FFD0D0',
    },
    issueText: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: '500',
    },
    suggestion: {
        fontSize: 14,
        color: colors.charcoal,
        textAlign: 'center',
        marginBottom: spacing[4],
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing[3],
        width: '100%',
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.purple,
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
        gap: spacing[2],
    },
    retakeButtonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    proceedButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.mint,
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
    },
    proceedButtonFull: {
        flex: 2,
    },
    proceedButtonText: {
        color: colors.charcoal,
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F0F0',
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
    },
    cancelButtonText: {
        color: colors.charcoal,
        fontWeight: '600',
        fontSize: 16,
    },
});
