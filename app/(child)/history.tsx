import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { ChevronLeft, PackageOpen, RotateCcw } from 'lucide-react-native';
import { shelfService } from '../../src/services/shelfService';
import { ShelfItem } from '../../src/types/shelf';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import { useAuth } from '../../src/contexts/AuthContext';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();
    const [items, setItems] = useState<ShelfItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [user, childProfile])
    );

    const loadHistory = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await shelfService.getShelfItems(user.id, childProfile?.id);
            // Filter for finished items
            setItems(data.filter(i => i.status === 'finished'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await shelfService.updateShelfItem(id, { status: 'active' });
            loadHistory(); // Reload to remove from list
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.purple} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <DetailPageHeader title="Product Archive" />

            <ScrollView contentContainerStyle={styles.content}>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <PackageOpen size={64} color={colors.lavender} />
                        <Text style={styles.emptyTitle}>No finished products yet</Text>
                        <Text style={styles.emptyText}>Items you mark as finished will appear here.</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {items.map((item: ShelfItem) => (
                            <Pressable
                                key={item.id}
                                style={styles.card}
                                onPress={() => router.push(`/(shelf)/${item.id}`)}
                            >
                                <Image
                                    source={{ uri: item.product_image_url || 'https://via.placeholder.com/150' }}
                                    style={styles.cardImage}
                                />
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardBrand}>{item.product_brand}</Text>
                                    <Text style={styles.cardName} numberOfLines={2}>{item.product_name}</Text>

                                    <Pressable
                                        style={styles.restoreButton}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleRestore(item.id);
                                        }}
                                    >
                                        <RotateCcw size={14} color={colors.purple} />
                                        <Text style={styles.restoreText}>Put Back</Text>
                                    </Pressable>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing[4] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
    card: {
        width: '47%',
        backgroundColor: 'white',
        borderRadius: radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        marginBottom: spacing[2]
    },
    cardImage: { width: '100%', height: 120, resizeMode: 'cover', opacity: 0.8 },
    cardContent: { padding: spacing[3] },
    cardBrand: { fontSize: 10, fontWeight: '700', color: colors.charcoal, textTransform: 'uppercase', marginBottom: 2 },
    cardName: { fontSize: 13, fontWeight: '600', color: colors.charcoal, marginBottom: 8 },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        backgroundColor: colors.purple + '10',
        borderRadius: radii.md
    },
    restoreText: { fontSize: 12, fontWeight: '600', color: colors.purple },
    emptyState: { alignItems: 'center', marginTop: 60, gap: spacing[4] },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.charcoal },
    emptyText: { color: colors.charcoal, opacity: 0.6 }
});
