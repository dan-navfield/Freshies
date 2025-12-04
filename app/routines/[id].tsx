import { View, Text, ScrollView, Pressable, StyleSheet, Image, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { ChevronLeft, Sun, Moon, CheckCircle, Clock, Plus } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { RoutineWithSteps, RoutineStep, STEP_CATEGORY_CONFIG } from '../../src/types/routine';

export default function ChildRoutinesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // child_id
  const [routines, setRoutines] = useState<RoutineWithSteps[]>([]);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRoutines();
  }, [id]);

  async function loadRoutines() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    try {
      // Get child info
      const { data: childData } = await supabase
        .from('children')
        .select('first_name')
        .eq('id', id)
        .single();
      
      if (childData) {
        setChildName(childData.first_name);
      }

      // Get routines with steps
      const { data: routinesData, error } = await supabase
        .from('routines')
        .select(`
          *,
          routine_steps (*)
        `)
        .eq('child_id', id)
        .order('routine_type', { ascending: true });

      if (error) throw error;

      const routinesWithSteps: RoutineWithSteps[] = (routinesData || []).map((routine: any) => {
        const steps = (routine.routine_steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
        return {
          ...routine,
          steps,
          step_count: steps.length,
        };
      });

      setRoutines(routinesWithSteps);
    } catch (error) {
      console.error('Error loading routines:', error);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  }

  const morningRoutine = routines.find(r => r.routine_type === 'morning');
  const eveningRoutine = routines.find(r => r.routine_type === 'evening');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{childName}'s Routines</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading routines...</Text>
          </View>
        ) : routines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Routines Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a morning or evening routine to get started
            </Text>
            <Pressable style={styles.createButton}>
              <Plus size={20} color={colors.white} />
              <Text style={styles.createButtonText}>Create Routine</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Morning Routine */}
            {morningRoutine && (
              <View style={styles.routineSection}>
                <View style={styles.routineHeader}>
                  <View style={[styles.routineIcon, { backgroundColor: '#FFF4E6' }]}>
                    <Sun size={24} color={colors.orange} />
                  </View>
                  <View style={styles.routineHeaderText}>
                    <Text style={styles.routineTitle}>{morningRoutine.name}</Text>
                    <Text style={styles.routineDescription}>{morningRoutine.description}</Text>
                  </View>
                </View>

                {morningRoutine.last_completed_at && (
                  <View style={styles.lastCompletedBadge}>
                    <CheckCircle size={14} color={colors.mint} />
                    <Text style={styles.lastCompletedText}>
                      Last completed {getTimeAgo(morningRoutine.last_completed_at)}
                    </Text>
                  </View>
                )}

                <View style={styles.stepsContainer}>
                  {morningRoutine.steps.map((step, index) => (
                    <RoutineStepCard key={step.id} step={step} stepNumber={index + 1} />
                  ))}
                </View>
              </View>
            )}

            {/* Evening Routine */}
            {eveningRoutine && (
              <View style={styles.routineSection}>
                <View style={styles.routineHeader}>
                  <View style={[styles.routineIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Moon size={24} color={colors.purple} />
                  </View>
                  <View style={styles.routineHeaderText}>
                    <Text style={styles.routineTitle}>{eveningRoutine.name}</Text>
                    <Text style={styles.routineDescription}>{eveningRoutine.description}</Text>
                  </View>
                </View>

                {eveningRoutine.last_completed_at && (
                  <View style={styles.lastCompletedBadge}>
                    <CheckCircle size={14} color={colors.mint} />
                    <Text style={styles.lastCompletedText}>
                      Last completed {getTimeAgo(eveningRoutine.last_completed_at)}
                    </Text>
                  </View>
                )}

                <View style={styles.stepsContainer}>
                  {eveningRoutine.steps.map((step, index) => (
                    <RoutineStepCard key={step.id} step={step} stepNumber={index + 1} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RoutineStepCard({ step, stepNumber }: { step: RoutineStep; stepNumber: number }) {
  const categoryConfig = STEP_CATEGORY_CONFIG[step.category];
  
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepNumberBadge}>
          <Text style={styles.stepNumber}>{stepNumber}</Text>
        </View>
        <View style={styles.stepHeaderContent}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepCategory}>{categoryConfig.icon} {categoryConfig.label}</Text>
            {step.is_optional && (
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Optional</Text>
              </View>
            )}
          </View>
          <Text style={styles.stepProductName}>{step.product_name}</Text>
          {step.product_brand && (
            <Text style={styles.stepBrand}>{step.product_brand}</Text>
          )}
        </View>
      </View>

      {step.instructions && (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsLabel}>How to use:</Text>
          <Text style={styles.instructionsText}>{step.instructions}</Text>
        </View>
      )}

      {step.wait_time && step.wait_time > 0 && (
        <View style={styles.waitTimeBadge}>
          <Clock size={14} color={colors.charcoal} />
          <Text style={styles.waitTimeText}>
            Wait {Math.floor(step.wait_time / 60)} min before next step
          </Text>
        </View>
      )}
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172800) return 'yesterday';
  return `${Math.floor(seconds / 86400)} days ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  emptyContainer: {
    padding: spacing[8],
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.purple,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    gap: spacing[2],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  routineSection: {
    marginBottom: spacing[6],
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[5],
    gap: spacing[4],
  },
  routineIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineHeaderText: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: colors.charcoal,
  },
  lastCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  lastCompletedText: {
    fontSize: 13,
    color: colors.mint,
    fontWeight: '600',
  },
  stepsContainer: {
    padding: spacing[4],
    gap: spacing[3],
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
  },
  stepHeader: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stepHeaderContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  stepCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.charcoal,
  },
  optionalBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
  },
  stepProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  stepBrand: {
    fontSize: 14,
    color: colors.charcoal,
  },
  instructionsBox: {
    backgroundColor: colors.cream,
    padding: spacing[3],
    borderRadius: radii.md,
    marginBottom: spacing[2],
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing[1],
  },
  instructionsText: {
    fontSize: 13,
    color: colors.black,
    lineHeight: 18,
  },
  waitTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  waitTimeText: {
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
  },
});
