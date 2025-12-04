import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../src/theme/tokens';
import { ChevronLeft, Plus, Sun, Moon, Sparkles, CheckCircle, Clock } from 'lucide-react-native';
import { getChildRoutines } from '../../src/services/routinesService';
import { getChildById } from '../../src/services/familyService';
import { RoutineWithProducts } from '../../src/types/products';
import { ChildProfile } from '../../src/types/family';

export default function ChildRoutinesScreen() {
  const router = useRouter();
  const { childId } = useLocalSearchParams();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [routines, setRoutines] = useState<RoutineWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [childId]);

  async function loadData() {
    if (!childId || typeof childId !== 'string') return;
    
    setLoading(true);
    const [childData, routinesData] = await Promise.all([
      getChildById(childId),
      getChildRoutines(childId),
    ]);
    
    setChild(childData);
    setRoutines(routinesData);
    setLoading(false);
  }

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Sun size={24} color={colors.orange} />;
      case 'evening':
        return <Moon size={24} color={colors.purple} />;
      default:
        return <Sparkles size={24} color={colors.mint} />;
    }
  };

  const getRoutineColor = (type: string) => {
    switch (type) {
      case 'morning':
        return colors.orange;
      case 'evening':
        return colors.purple;
      default:
        return colors.mint;
    }
  };

  if (loading || !child) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading routines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{child.display_name}'s Routines</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Image 
            source={{ 
              uri: child.avatar_url || `https://ui-avatars.com/api/?name=${child.first_name}&background=random&size=200`
            }}
            style={styles.heroAvatar}
          />
          <Text style={styles.heroTitle}>Daily Routines</Text>
          <Text style={styles.heroSubtitle}>
            {routines.length} {routines.length === 1 ? 'routine' : 'routines'} • Stay consistent!
          </Text>
        </View>

        {/* Routines List */}
        <View style={styles.routinesSection}>
          {routines.length === 0 ? (
            <View style={styles.emptyState}>
              <Sparkles size={64} color={colors.charcoal} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyTitle}>No routines yet</Text>
              <Text style={styles.emptySubtitle}>
                Create a routine to help {child.display_name} stay organized
              </Text>
            </View>
          ) : (
            routines.map((routine) => (
              <Pressable
                key={routine.id}
                style={styles.routineCard}
                onPress={() => router.push(`/routines/${childId}/${routine.id}` as any)}
              >
                <View style={styles.routineHeader}>
                  <View style={[
                    styles.routineIcon,
                    { backgroundColor: getRoutineColor(routine.routine_type) + '20' }
                  ]}>
                    {getRoutineIcon(routine.routine_type)}
                  </View>
                  
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={styles.routineDescription}>{routine.description}</Text>
                    )}
                  </View>

                  <ChevronLeft 
                    size={20} 
                    color={colors.charcoal} 
                    style={{ transform: [{ rotate: '180deg' }] }} 
                  />
                </View>

                <View style={styles.routineStats}>
                  <View style={styles.routineStat}>
                    <Text style={styles.routineStatNumber}>
                      {routine.products?.length || 0}
                    </Text>
                    <Text style={styles.routineStatLabel}>Products</Text>
                  </View>

                  {routine.reminder_enabled && routine.reminder_time && (
                    <View style={styles.routineStat}>
                      <Clock size={16} color={colors.charcoal} />
                      <Text style={styles.routineStatLabel}>
                        {routine.reminder_time.slice(0, 5)}
                      </Text>
                    </View>
                  )}

                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: routine.enabled ? colors.mint + '20' : colors.mist }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: routine.enabled ? colors.mint : colors.charcoal }
                    ]}>
                      {routine.enabled ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => router.push(`/routines/${childId}/create` as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.purple + '20' }]}>
              <Plus size={20} color={colors.purple} />
            </View>
            <Text style={styles.actionButtonText}>Create Custom Routine</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
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
  scrollView: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.cream,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing[4],
    borderWidth: 3,
    borderColor: colors.white,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  routinesSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  emptyState: {
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
  },
  routineCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  routineDescription: {
    fontSize: 14,
    color: colors.charcoal,
  },
  routineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  routineStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  routineStatNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  routineStatLabel: {
    fontSize: 13,
    color: colors.charcoal,
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
    marginLeft: 'auto',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
});
