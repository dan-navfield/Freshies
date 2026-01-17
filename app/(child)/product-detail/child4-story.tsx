/**
 * Child Page 4: Story Mode
 * Narrative intro, step-by-step usage, celebration animations
 * Theme: Mint header with cream body
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, ChevronRight, Play, CheckCircle, Share, Clock } from 'lucide-react-native';
import { sampleProductExcellent } from './mockProductData';

const product = sampleProductExcellent;

const USAGE_STEPS = [
    { emoji: '💧', title: 'Get Wet', description: 'Splash some warm water on your face', duration: '5 sec' },
    { emoji: '🧴', title: 'Pump Product', description: 'Press the bottle 1-2 times into your hands', duration: '3 sec' },
    { emoji: '👐', title: 'Rub Together', description: 'Rub your hands together to make bubbles!', duration: '5 sec' },
    { emoji: '😊', title: 'Apply Gently', description: 'Spread the bubbles all over your face in circles', duration: '30 sec' },
    { emoji: '🌊', title: 'Rinse Off', description: 'Splash water until all the bubbles are gone', duration: '20 sec' },
    { emoji: '🧺', title: 'Pat Dry', description: 'Use a clean towel to pat (don\'t rub!) your face dry', duration: '10 sec' },
];

export default function ProductDetailChild4Screen() {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const markComplete = () => {
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }
        if (currentStep < USAGE_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Mint Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Story Mode</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Narrative Intro */}
                <View style={styles.introCard}>
                    <Image source={{ uri: product.image_url }} style={styles.introImage} />
                    <View style={styles.introContent}>
                        <Text style={styles.introLabel}>Meet Your Product</Text>
                        <Text style={styles.introTitle}>{product.name}</Text>
                        <Text style={styles.introText}>
                            This is your special cleanser that keeps your face clean and happy! Let's learn how to use it together. 🌟
                        </Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>
                        Step {currentStep + 1} of {USAGE_STEPS.length}
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${((completedSteps.length) / USAGE_STEPS.length) * 100}%` }]} />
                    </View>
                </View>

                {/* Current Step Card */}
                <View style={styles.stepCard}>
                    <Text style={styles.stepEmoji}>{USAGE_STEPS[currentStep].emoji}</Text>
                    <Text style={styles.stepTitle}>{USAGE_STEPS[currentStep].title}</Text>
                    <Text style={styles.stepDescription}>{USAGE_STEPS[currentStep].description}</Text>

                    <View style={styles.timerRow}>
                        <Clock size={16} color={colors.purple} />
                        <Text style={styles.timerText}>{USAGE_STEPS[currentStep].duration}</Text>
                    </View>

                    {completedSteps.includes(currentStep) ? (
                        <View style={styles.completedBadge}>
                            <CheckCircle size={20} color={colors.mint} />
                            <Text style={styles.completedText}>Done! Great job! 🎉</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.startButton} onPress={markComplete}>
                            <Play size={20} color={colors.white} fill={colors.white} />
                            <Text style={styles.startButtonText}>Mark as Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Step Navigation */}
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
                        onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft size={20} color={currentStep === 0 ? colors.charcoal : colors.purple} />
                        <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>Previous</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentStep === USAGE_STEPS.length - 1 && styles.navButtonDisabled]}
                        onPress={() => setCurrentStep(Math.min(USAGE_STEPS.length - 1, currentStep + 1))}
                        disabled={currentStep === USAGE_STEPS.length - 1}
                    >
                        <Text style={[styles.navButtonText, currentStep === USAGE_STEPS.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                        <ChevronRight size={20} color={currentStep === USAGE_STEPS.length - 1 ? colors.charcoal : colors.purple} />
                    </TouchableOpacity>
                </View>

                {/* All Steps List */}
                <View style={styles.stepsListSection}>
                    <Text style={styles.sectionTitle}>All Steps</Text>
                    {USAGE_STEPS.map((step, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.stepListItem, currentStep === i && styles.stepListItemActive]}
                            onPress={() => setCurrentStep(i)}
                        >
                            <View style={[styles.stepListIcon, completedSteps.includes(i) && styles.stepListIconComplete]}>
                                {completedSteps.includes(i) ? (
                                    <CheckCircle size={20} color={colors.white} />
                                ) : (
                                    <Text style={styles.stepListNumber}>{i + 1}</Text>
                                )}
                            </View>
                            <View style={styles.stepListContent}>
                                <Text style={styles.stepListTitle}>{step.emoji} {step.title}</Text>
                                <Text style={styles.stepListDuration}>{step.duration}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Celebration */}
                {completedSteps.length === USAGE_STEPS.length && (
                    <View style={styles.celebrationCard}>
                        <Text style={styles.celebrationEmoji}>🎉</Text>
                        <Text style={styles.celebrationTitle}>All Done!</Text>
                        <Text style={styles.celebrationText}>You did amazing! Your face is now clean and fresh!</Text>
                        <TouchableOpacity style={styles.shareButton}>
                            <Share size={18} color={colors.purple} />
                            <Text style={styles.shareButtonText}>Show Parent</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },

    header: {
        backgroundColor: colors.mint, // Brand mint header
        paddingTop: 60,
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[5],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.black },

    scrollContent: { flex: 1, padding: spacing[5] },

    introCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[4],
        flexDirection: 'row',
        marginBottom: spacing[5],
        borderWidth: 2,
        borderColor: colors.mint,
    },
    introImage: {
        width: 80,
        height: 80,
        borderRadius: radii.lg,
        backgroundColor: colors.mint + '30',
    },
    introContent: { flex: 1, marginLeft: spacing[4] },
    introLabel: { fontSize: 10, fontWeight: '700', color: colors.purple, letterSpacing: 1 },
    introTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginTop: 4 },
    introText: { fontSize: 13, color: colors.charcoal, marginTop: spacing[2], lineHeight: 18 },

    progressSection: { marginBottom: spacing[4] },
    progressLabel: { fontSize: 12, fontWeight: '600', color: colors.charcoal, marginBottom: spacing[2] },
    progressBar: {
        height: 8,
        backgroundColor: colors.mint + '30',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.mint,
        borderRadius: 4,
    },

    stepCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[6],
        alignItems: 'center',
        marginBottom: spacing[4],
        borderWidth: 3,
        borderColor: colors.purple + '30',
    },
    stepEmoji: { fontSize: 64, marginBottom: spacing[3] },
    stepTitle: { fontSize: 24, fontWeight: 'bold', color: colors.black },
    stepDescription: { fontSize: 16, color: colors.charcoal, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[4] },
    timerText: { fontSize: 14, fontWeight: '600', color: colors.purple },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        borderRadius: radii.xl,
        marginTop: spacing[5],
    },
    startButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.mint + '20',
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
        marginTop: spacing[5],
    },
    completedText: { fontSize: 14, fontWeight: '600', color: colors.black },

    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing[5],
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: spacing[2],
    },
    navButtonDisabled: { opacity: 0.3 },
    navButtonText: { fontSize: 14, fontWeight: '600', color: colors.purple },
    navButtonTextDisabled: { color: colors.charcoal },

    stepsListSection: { marginBottom: spacing[5] },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black, marginBottom: spacing[3] },
    stepListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[3],
        marginBottom: spacing[2],
    },
    stepListItemActive: { borderWidth: 2, borderColor: colors.purple },
    stepListIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.lavender,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    stepListIconComplete: { backgroundColor: colors.mint },
    stepListNumber: { fontSize: 14, fontWeight: 'bold', color: colors.purple },
    stepListContent: { flex: 1 },
    stepListTitle: { fontSize: 14, fontWeight: '600', color: colors.black },
    stepListDuration: { fontSize: 12, color: colors.charcoal, marginTop: 2 },

    celebrationCard: {
        backgroundColor: colors.mint + '30',
        borderRadius: radii.xl,
        padding: spacing[6],
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.mint,
    },
    celebrationEmoji: { fontSize: 64 },
    celebrationTitle: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginTop: spacing[3] },
    celebrationText: { fontSize: 14, color: colors.charcoal, textAlign: 'center', marginTop: spacing[2] },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        backgroundColor: colors.white,
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
        marginTop: spacing[4],
        borderWidth: 2,
        borderColor: colors.purple,
    },
    shareButtonText: { fontSize: 14, fontWeight: '600', color: colors.purple },
});
