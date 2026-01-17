/**
 * Wishlist Group Detail Screen
 * Shows items in a specific wishlist group/collection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2, Heart } from 'lucide-react-native';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import {
    getWishlistGroups,
    getGroupItems,
    removeItemFromGroup,
} from '../../../src/services/wishlistService';
import { WishlistGroup, WishlistItem } from '../../../src/types/wishlist';
import WishlistCard from '../../../src/components/WishlistCard';

export default function WishlistGroupDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { childProfile } = useChildProfile();

    const [group, setGroup] = useState<WishlistGroup | null>(null);
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (id) loadGroupData();
        }, [id])
    );

    const loadGroupData = async () => {
        if (!id || !childProfile?.id) return;

        setLoading(true);
        try {
            // Get group details
            const groups = await getWishlistGroups(childProfile.id);
            const currentGroup = groups.find(g => g.id === id);
            setGroup(currentGroup || null);

            // Get items in this group
            const groupItems = await getGroupItems(id);
            setItems(groupItems);
        } catch (error) {
            console.error('Error loading group:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromGroup = async (itemId: string) => {
        if (!id) return;

        Alert.alert(
            'Remove from Collection',
            'Remove this item from the collection? (It will stay in your wishlist)',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await removeItemFromGroup(itemId, id);
                        if (success) {
                            setItems(prev => prev.filter(i => i.id !== itemId));
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.black} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerEmoji}>{group?.emoji || '📁'}</Text>
                    <Text style={styles.headerTitle}>{group?.name || 'Collection'}</Text>
                </View>
                <View style={styles.backButton} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.purple} />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Heart size={64} color={colors.lavender} />
                    <Text style={styles.emptyTitle}>No items yet</Text>
                    <Text style={styles.emptyText}>
                        Add wishlist items to this collection from your wishlist.
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    <Text style={styles.itemCount}>{items.length} items</Text>
                    <View style={styles.grid}>
                        {items.map(item => (
                            <WishlistCard
                                key={item.id}
                                item={item}
                                onPress={() => {
                                    const productId = item.product_barcode || item.product_id;
                                    if (productId) {
                                        router.push(`/(child)/products/${productId}` as any);
                                    }
                                }}
                                onRemove={() => handleRemoveFromGroup(item.id)}
                                isChildView={true}
                            />
                        ))}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.mist,
    },
    backButton: {
        width: 40,
        alignItems: 'flex-start',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    headerEmoji: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[8],
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        marginTop: spacing[4],
    },
    emptyText: {
        fontSize: 14,
        color: colors.charcoal,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: spacing[4],
    },
    itemCount: {
        fontSize: 14,
        color: colors.charcoal,
        marginBottom: spacing[3],
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
    },
});
