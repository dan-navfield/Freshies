import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Plus, Trash2, GripVertical, Clock, CheckCircle, Sun, Moon, Sparkles } from 'lucide-react-native';
import { getRoutine, updateRoutine, removeProductFromRoutine } from '../../../src/services/routinesService';
import { RoutineWithProducts } from '../../../src/types/products';

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { childId, routineId } = useLocalSearchParams();
  const [routine, setRoutine] = useState<RoutineWithProducts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutine();
  }, [routineId]);

  async function loadRoutine() {
    if (!routineId || typeof routineId !== 'string') return;
    
    setLoading(true);
    const data = await getRoutine(routineId);
    setRoutine(data);
    setLoading(false);
  }

  async function handleToggleEnabled(value: boolean) {
    if (!routine) return;
    
    const success = await updateRoutine(routine.id, { enabled: value });
    if (success) {
      setRoutine({ ...routine, enabled: value });
    }
  }

  async function handleRemoveProduct(productId: string, productName: string) {
    if (!routine) return;

    Alert.alert(
      'Remove Product',
      `Remove ${productName} from this routine?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeProductFromRoutine(routine.id, productId);
            if (success) {
              await loadRoutine();
            }
          },
        },
      ]
    );
  }

  const getRoutineIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Sun size={32} color={colors.orange} />;
      case 'evening':
        return <Moon size={32} color={colors.purple} />;
      default:
        return <Sparkles size={32} color={colors.mint} />;
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

  if (loading || !routine) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading routine...</Text>
      </View>
    );
  }

  const routineColor = getRoutineColor(routine.routine_type);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{routine.name}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Routine Hero */}
        <View style={[styles.routineHero, { backgroundColor: routineColor + '20' }]}>
          <View style={[styles.routineIconLarge, { backgroundColor: routineColor + '30' }]}>
            {getRoutineIcon(routine.routine_type)}
          </View>
          <Text style={styles.routineTitle}>{routine.name}</Text>
          {routine.description && (
            <Text style={styles.routineDescription}>{routine.description}</Text>
          )}
          
          {routine.reminder_time && (
            <View style={styles.reminderBadge}>
              <Clock size={16} color={routineColor} />
              <Text style={[styles.reminderText, { color: routineColor }]}>
                {routine.reminder_time.slice(0, 5)}
              </Text>
            </View>
          )}
        </View>

        {/* Routine Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Routine Active</Text>
              <Text style={styles.toggleSubtitle}>
                {routine.enabled ? 'This routine is active' : 'This routine is paused'}
              </Text>
            </View>
            <Switch
              value={routine.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.mist, true: routineColor + '40' }}
              thumbColor={routine.enabled ? routineColor : colors.white}
            />
          </View>
        </View>

        {/* Products List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Products ({routine.products?.length || 0})
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => router.push(`/routines/${childId}/${routineId}/add-product` as any)}
            >
              <Plus size={20} color={colors.purple} />
            </Pressable>
          </View>

          {!routine.products || routine.products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>No products yet</Text>
              <Text style={styles.emptyProductsSubtext}>
                Add products to this routine
              </Text>
            </View>
          ) : (
            routine.products
              .sort((a, b) => a.step_order - b.step_order)
              .map((item, index) => (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    
                    {item.product.product_image_url ? (
                      <Image 
                        source={{ uri: item.product.product_image_url }}
                        style={styles.productImage}
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImagePlaceholderText}>📦</Text>
                      </View>
                    )}
                    
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.product.product_name}
                      </Text>
                      {item.product.product_brand && (
                        <Text style={styles.productBrand} numberOfLines={1}>
                          {item.product.product_brand}
                        </Text>
                      )}
                    </View>

                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveProduct(item.product_id, item.product.product_name)}
                    >
                      <Trash2 size={18} color={colors.red} />
                    </Pressable>
                  </View>

                  {item.instructions && (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsText}>{item.instructions}</Text>
                    </View>
                  )}
                </View>
              ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <CheckCircle size={24} color={colors.mint} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color={colors.orange} />
            <Text style={styles.statNumber}>
              {routine.products?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
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
  routineHero: {
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  routineIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  routineTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  routineDescription: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
    borderRadius: radii.full,
  },
  reminderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cream,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: colors.charcoal,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProducts: {
    padding: spacing[8],
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
  },
  emptyProductsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing[1],
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: colors.charcoal,
  },
  productCard: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImagePlaceholderText: {
    fontSize: 24,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 13,
    color: colors.charcoal,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionsBox: {
    marginTop: spacing[3],
    marginLeft: 47,
    padding: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.md,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
  },
  statLabel: {
    fontSize: 13,
    color: colors.charcoal,
  },
});
