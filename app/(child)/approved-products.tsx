import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle, MessageSquare } from 'lucide-react-native';
import PageHeader from '../../src/components/PageHeader';
import GamificationBand from '../../src/components/GamificationBand';
import { colors, spacing, radii } from '../../src/theme/tokens';

/**
 * Child Approved Products Screen
 * Shows all products that parent has approved for the child
 */
export default function ChildApprovedProductsScreen() {
  const router = useRouter();

  // Mock data - will be replaced with actual approved products from database
  const approvedProducts = [
    {
      id: '1',
      name: 'Hydrating Facial Cleanser',
      brand: 'CeraVe',
      category: 'Cleanser',
      image: 'https://via.placeholder.com/100',
      parentNote: 'Great for sensitive skin!',
    },
    {
      id: '2',
      name: 'Daily Facial Moisturizer',
      brand: 'Cetaphil',
      category: 'Moisturizer',
      image: 'https://via.placeholder.com/100',
      parentNote: 'Use every morning',
    },
    {
      id: '3',
      name: 'Kids Sunscreen SPF 50',
      brand: 'Banana Boat',
      category: 'Sunscreen',
      image: 'https://via.placeholder.com/100',
      parentNote: 'Before going outside!',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <PageHeader 
        title="Approved Products"
        subtitle="Products safe for you to use! ✅"
        showAvatar={true}
      />
      
      {/* Gamification Band */}
      <GamificationBand />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          These products are safe for you to use!
        </Text>

        {approvedProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No approved products yet</Text>
            <Text style={styles.emptyText}>
              Ask your parent to approve some products for you!
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {approvedProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push({
                  pathname: '/(shared)/product-result',
                  params: { productId: product.id, childMode: 'true' },
                })}
              >
                <Image source={{ uri: product.image }} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                  </View>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.parentNote && (
                    <View style={styles.noteContainer}>
                      <MessageSquare size={14} color="#6366F1" />
                      <Text style={styles.noteText} numberOfLines={2}>
                        {product.parentNote}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.approvedBadge}>
                  <CheckCircle size={32} color="#10B981" fill="#10B981" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  productBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    fontStyle: 'italic',
  },
  approvedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
