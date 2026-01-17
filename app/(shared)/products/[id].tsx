import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { colors, radii, spacing } from '../../../src/theme/tokens';
import { ChevronLeft, Calendar, TrendingUp, Package, Trash2, Plus } from 'lucide-react-native';
import { supabase } from '../../../src/lib/supabase';
import { ChildProduct } from '../../../src/types/products';
import { logProductUsage, removeChildProduct } from '../../../src/modules/product-discovery';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<ChildProduct | null>(null);
  const [childName, setChildName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('child_products')
        .select(`
          *,
          children (
            first_name,
            nickname
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setProduct(data);
        setChildName(data.children?.nickname || data.children?.first_name || 'Child');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    }
    setLoading(false);
  }

  async function handleLogUsage() {
    if (!product) return;

    const success = await logProductUsage(product.child_id, product.id);
    if (success) {
      Alert.alert('Logged!', 'Product usage has been recorded.');
      loadProduct(); // Reload to update usage count
    } else {
      Alert.alert('Error', 'Failed to log usage.');
    }
  }

  async function handleRemove() {
    if (!product) return;

    Alert.alert(
      'Remove Product',
      `Remove ${product.product_name} from ${childName}'s library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeChildProduct(product.id);
            if (success) {
              router.back();
            } else {
              Alert.alert('Error', 'Failed to remove product.');
            }
          },
        },
      ]
    );
  }

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const lastUsed = product.last_used_at 
    ? new Date(product.last_used_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    : 'Never';

  const addedDate = new Date(product.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.backButton} />
        </View>

        {/* Product Hero */}
        <View style={styles.productHero}>
          {product.product_image_url ? (
            <Image 
              source={{ uri: product.product_image_url }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImagePlaceholderText}>📦</Text>
            </View>
          )}
          
          <Text style={styles.productName}>{product.product_name}</Text>
          {product.product_brand && (
            <Text style={styles.productBrand}>{product.product_brand}</Text>
          )}
          
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Approved Product</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.mint + '20' }]}>
              <TrendingUp size={24} color={colors.mint} />
            </View>
            <Text style={styles.statNumber}>{product.usage_count}</Text>
            <Text style={styles.statLabel}>Times Used</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.purple + '20' }]}>
              <Calendar size={24} color={colors.purple} />
            </View>
            <Text style={styles.statNumber}>{lastUsed}</Text>
            <Text style={styles.statLabel}>Last Used</Text>
          </View>
        </View>

        {/* Parent Notes */}
        {product.parent_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent's Note</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{product.parent_notes}</Text>
            </View>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Added to Library</Text>
              <Text style={styles.infoValue}>{addedDate}</Text>
            </View>
            
            {product.product_category && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{product.product_category}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: colors.mint }]}>
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Pressable 
            style={styles.actionButton}
            onPress={handleLogUsage}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.mint + '20' }]}>
              <Plus size={20} color={colors.mint} />
            </View>
            <Text style={styles.actionButtonText}>Log Usage</Text>
            <Text style={styles.actionButtonSubtext}>Track when you use this product</Text>
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.red }]}>Danger Zone</Text>
          
          <Pressable 
            style={styles.dangerButton}
            onPress={handleRemove}
          >
            <Trash2 size={20} color={colors.red} />
            <Text style={styles.dangerButtonText}>Remove from Library</Text>
          </Pressable>
        </View>
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
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
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
  productHero: {
    backgroundColor: colors.white,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: radii.xl,
    marginBottom: spacing[4],
  },
  productImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: radii.xl,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  productImagePlaceholderText: {
    fontSize: 80,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  productBrand: {
    fontSize: 16,
    color: colors.charcoal,
    marginBottom: spacing[4],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mint + '20',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    gap: spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mint,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: 13,
    color: colors.charcoal,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[4],
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
  },
  noteText: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.charcoal,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
  },
  actionButtonSubtext: {
    fontSize: 13,
    color: colors.charcoal,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.red,
    gap: spacing[2],
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
});
