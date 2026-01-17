import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { CustomRoutine } from '../../../src/modules/routines';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageHeader from '../../../src/components/navigation/PageHeader';
import { ChevronLeft } from 'lucide-react-native';

export default function ParentRoutineDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [routine, setRoutine] = useState<CustomRoutine | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadRoutine();
    }, [id]);

    const loadRoutine = async () => {
        try {
            const { data, error } = await supabase
                .from('custom_routines')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setRoutine(data);
        } catch (error) {
            console.error('Error loading routine:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.purple} />
            </View>
        );
    }

    if (!routine) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Routine not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const getIconForType = (type: string) => {
        switch (type) {
            case 'cleanser': return 'water-outline';
            case 'moisturizer': return 'water';
            case 'sunscreen': return 'sunny';
            case 'treatment': return 'medkit-outline';
            case 'serum': return 'flask-outline';
            default: return 'cube-outline';
        }
    };

    const getIconBgColor = (type: string) => {
        switch (type) {
            case 'cleanser': return colors.mint + '30';
            case 'moisturizer': return colors.lilac;
            case 'sunscreen': return '#FFD58030';
            case 'treatment': return colors.peach + '40';
            case 'serum': return colors.lavender;
            default: return colors.cream;
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'cleanser': return colors.mint;
            case 'moisturizer': return colors.purple;
            case 'sunscreen': return '#FF9500';
            case 'treatment': return colors.accent;
            case 'serum': return colors.deepPurple;
            default: return colors.charcoal;
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={colors.white} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{routine.name}</Text>
                    <Text style={styles.headerSubtitle}>
                        {routine.segment === 'morning' ? '☀️ Morning Routine' : '🌙 Evening Routine'}
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Stats Summary Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{routine.steps.length}</Text>
                        <Text style={styles.statLabel}>Steps</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{(routine.total_duration / 60).toFixed(1)}m</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{routine.completion_count || 0}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Steps List */}
                <Text style={styles.sectionTitle}>Routine Steps</Text>

                <View style={styles.stepsContainer}>
                    {routine.steps.sort((a, b) => a.order - b.order).map((step, index) => (
                        <View key={step.id || index} style={styles.stepCard}>
                            <View style={[styles.stepIconContainer, { backgroundColor: getIconBgColor(step.type) }]}>
                                <Ionicons name={getIconForType(step.type) as any} size={24} color={getIconColor(step.type)} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDuration}>{(step.duration / 60).toFixed(1)} min</Text>
                                {step.instructions && step.instructions.length > 0 && (
                                    <Text style={styles.instructionPreview} numberOfLines={2}>
                                        {step.instructions[0]}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.stepOrder}>
                                <Text style={styles.orderText}>{index + 1}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.actionButton} disabled>
                    <Text style={styles.actionButtonText}>Edit Routine (Coming Soon)</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.cream,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    errorText: {
        fontSize: 18,
        color: colors.charcoal,
        marginBottom: spacing[4],
    },
    backButton: {
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
    },
    backButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    // Header
    header: {
        backgroundColor: colors.black,
        paddingTop: 60,
        paddingBottom: spacing[5],
        paddingHorizontal: spacing[6],
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    content: {
        padding: spacing[6],
        paddingBottom: 100,
    },
    // Stats Card
    statsCard: {
        backgroundColor: colors.white,
        borderRadius: radii.xl,
        padding: spacing[5],
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: spacing[6],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.charcoal,
        textTransform: 'uppercase',
        fontWeight: '600',
        opacity: 0.7,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing[4],
        color: colors.black,
    },
    stepsContainer: {
        gap: spacing[3],
        marginBottom: spacing[6],
    },
    stepCard: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    stepIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
        marginBottom: 2,
    },
    stepDuration: {
        fontSize: 13,
        color: colors.purple,
        fontWeight: '500',
    },
    instructionPreview: {
        fontSize: 13,
        color: colors.charcoal,
        marginTop: 4,
        opacity: 0.8,
    },
    stepOrder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing[2],
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    orderText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.charcoal,
    },
    actionButton: {
        backgroundColor: colors.cream,
        padding: spacing[4],
        borderRadius: radii.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderStyle: 'dashed',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.charcoal,
        opacity: 0.6,
    },
});
