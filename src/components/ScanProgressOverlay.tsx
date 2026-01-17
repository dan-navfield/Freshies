/**
 * Scan Progress Overlay
 * Shows step-by-step progress during product scanning
 * Displays as a centered overlay (not full screen)
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Check, CircleDashed } from 'lucide-react-native';
import { colors, spacing, radii } from '../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ScanStep {
    id: string;
    label: string;
    status: 'pending' | 'active' | 'complete' | 'skipped';
}

interface ScanProgressOverlayProps {
    visible: boolean;
    steps: ScanStep[];
    currentMessage?: string;
}

export default function ScanProgressOverlay({
    visible,
    steps,
    currentMessage,
}: ScanProgressOverlayProps) {
    // Count completed and skipped steps properly
    const completedSteps = steps.filter(s => s.status === 'complete').length;
    const skippedSteps = steps.filter(s => s.status === 'skipped').length;
    const processedSteps = completedSteps + skippedSteps;

    // Find current active step index (1-based for display)
    const activeIndex = steps.findIndex(s => s.status === 'active');
    const currentStep = activeIndex >= 0 ? activeIndex + 1 : processedSteps + 1;

    // Total meaningful steps (not counting skipped as progress)
    const totalSteps = steps.length;
    const progressPercent = (processedSteps / totalSteps) * 100;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <Text style={styles.title}>Analyzing Product</Text>
                    <Text style={styles.subtitle}>
                        Step {currentStep} of {totalSteps}
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                { width: `${progressPercent}%` }
                            ]}
                        />
                    </View>

                    {/* Steps list */}
                    <View style={styles.stepsList}>
                        {steps.map((step) => (
                            <View key={step.id} style={styles.stepRow}>
                                <View style={styles.stepIcon}>
                                    {step.status === 'complete' ? (
                                        <View style={styles.checkCircle}>
                                            <Check color={colors.white} size={14} strokeWidth={3} />
                                        </View>
                                    ) : step.status === 'active' ? (
                                        <ActivityIndicator size="small" color={colors.mint} />
                                    ) : step.status === 'skipped' ? (
                                        <View style={styles.skippedCircle}>
                                            <Text style={styles.skippedText}>—</Text>
                                        </View>
                                    ) : (
                                        <CircleDashed color="#9ca3af" size={20} />
                                    )}
                                </View>
                                <Text style={[
                                    styles.stepLabel,
                                    step.status === 'complete' && styles.stepLabelComplete,
                                    step.status === 'active' && styles.stepLabelActive,
                                    step.status === 'skipped' && styles.stepLabelSkipped,
                                ]}>
                                    {step.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Current action message */}
                    {currentMessage && (
                        <Text style={styles.currentMessage}>{currentMessage}</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.25)', // Very light overlay to see camera
        justifyContent: 'center', // Center vertically
        alignItems: 'center',
        paddingBottom: 80, // Less offset - better centered in scan frame
    },
    container: {
        backgroundColor: 'rgba(139, 92, 246, 0.85)', // Semi-transparent purple
        borderRadius: radii.xl,
        padding: spacing[5],
        width: '80%',
        maxWidth: 300,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.white,
        textAlign: 'center',
        marginBottom: spacing[1],
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        marginBottom: spacing[4],
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.mint,
        borderRadius: 3,
    },
    stepsList: {
        gap: spacing[3],
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    stepIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.mint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skippedCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skippedText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '700',
    },
    stepLabel: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.5)',
        flex: 1,
    },
    stepLabelComplete: {
        color: colors.mint,
    },
    stepLabelActive: {
        color: colors.white,
        fontWeight: '600',
    },
    stepLabelSkipped: {
        color: 'rgba(255, 255, 255, 0.35)',
        textDecorationLine: 'line-through',
    },
    currentMessage: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: spacing[4],
        fontStyle: 'italic',
    },
});
