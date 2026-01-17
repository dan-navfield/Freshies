import { View, Text, StyleSheet, Image, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { ChevronLeft, Trash2, Calendar, Clock, Tag, Edit2, FileText, CheckCircle, PackageCheck, Flame, BarChart2, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { shelfService } from '../../../src/modules/product-library';
import { usageService, UsageStats } from '../../../src/modules/product-library';
import { ShelfItem } from '../../src/types/shelf';
import DetailPageHeader from '../../src/components/navigation/DetailPageHeader';

export default function ShelfItemDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [item, setItem] = useState<ShelfItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
    const [trackingUsage, setTrackingUsage] = useState(false);

    useEffect(() => {
        if (id) loadItem();
    }, [id]);

    const loadItem = async () => {
        try {
            const { data, error } = await supabase
                .from('shelf_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setItem(data);

            // Load usage stats if profile_id exists
            if (data.profile_id) {
                const stats = await usageService.getUsageStats(data.id, data.profile_id);
                setUsageStats(stats);
            }
        } catch (e) {
            console.error('Error loading item:', e);
            Alert.alert('Error', 'Could not load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleTrackUsage = async () => {
        if (!item?.profile_id || !item?.id) return;

        try {
            setTrackingUsage(true);
            await usageService.trackUsage(item.id, item.profile_id);
            // Reload stats
            const stats = await usageService.getUsageStats(item.id, item.profile_id);
            setUsageStats(stats);
            Alert.alert('Success', 'Usage tracked! Keep up the streak! 🔥');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to track usage');
        } finally {
            setTrackingUsage(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Remove Product',
            'Are you sure you want to remove this from your shelf?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await shelfService.deleteShelfItem(item!.id);
                            router.back();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    }
                }
            ]
        );
    };

    const handleFinish = async () => {
        try {
            const newStatus = item?.status === 'finished' ? 'active' : 'finished';
            await shelfService.updateShelfItem(item!.id, { status: newStatus });
            loadItem();
            Alert.alert(newStatus === 'finished' ? 'Finished!' : 'Restored',
                newStatus === 'finished' ? 'Product moved to archive.' : 'Product moved back to shelf.');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleToggleLow = async () => {
        try {
            const newLowStatus = !item?.is_low;
            await shelfService.updateShelfItem(item!.id, { is_low: newLowStatus });
            loadItem();
            Alert.alert(
                newLowStatus ? 'Marked as Low' : 'Marked as Stocked',
                newLowStatus ? 'We\'ll remind you to restock this soon.' : 'Stock status updated.'
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update stock status');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.purple} />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.center}>
                <Text>Item not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <DetailPageHeader
                title="Product Details"
                rightElement={
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable onPress={() => router.push({ pathname: '/(shelf)/edit', params: { id: item.id } })} style={styles.iconButton}>
                            <Edit2 size={20} color={colors.purple} />
                        </Pressable>
                        <Pressable onPress={handleDelete} style={styles.iconButton}>
                            <Trash2 size={20} color={colors.red} />
                        </Pressable>
                    </View>
                }
            />

            <ScrollView>
                <Image
                    source={{ uri: item.product_image_url || 'https://via.placeholder.com/300' }}
                    style={styles.image}
                />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.brand}>{item.product_brand}</Text>
                        <Text style={styles.name}>{item.product_name}</Text>

                        {/* Usage Stats (Streaks) */}
                        {usageStats && (
                            <View style={styles.streakRow}>
                                <View style={styles.statBadge}>
                                    <Flame size={16} color={colors.orange} fill={usageStats.currentStreak > 0 ? colors.orange : 'transparent'} />
                                    <Text style={[styles.statText, { color: colors.orange }]}>
                                        {usageStats.currentStreak} Day Streak
                                    </Text>
                                </View>
                                <View style={styles.statBadge}>
                                    <BarChart2 size={16} color={colors.purple} />
                                    <Text style={styles.statText}>
                                        Used {usageStats.totalCount} times
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Track Usage Button */}
                    {item.profile_id && (
                        <Pressable
                            style={[
                                styles.usageButton,
                                usageStats?.usedToday && styles.usageButtonDisabled
                            ]}
                            onPress={handleTrackUsage}
                            disabled={usageStats?.usedToday || trackingUsage}
                        >
                            <Text style={[styles.usageButtonText, usageStats?.usedToday && styles.usageButtonTextDisabled]}>
                                {usageStats?.usedToday ? '✓ Used Today' : 'Mark as Used Today'}
                            </Text>
                        </Pressable>
                    )}

                    <View style={styles.section}>
                        <View style={styles.row}>
                            <Tag size={18} color={colors.charcoal} />
                            <Text style={styles.rowText}>{item.product_category || 'Uncategorized'}</Text>
                        </View>

                        {item.opened_at && (
                            <View style={styles.row}>
                                <Calendar size={18} color={colors.charcoal} />
                                <Text style={styles.rowText}>
                                    Opened: {new Date(item.opened_at).toLocaleDateString()}
                                </Text>
                            </View>
                        )}

                        {item.pao_months && (
                            <View style={styles.row}>
                                <Clock size={18} color={colors.charcoal} />
                                <Text style={styles.rowText}>PAO: {item.pao_months} Months</Text>
                            </View>
                        )}

                        {/* Running Low Toggle */}
                        <Pressable
                            style={[styles.row, { marginTop: 8, padding: 8, backgroundColor: item.is_low ? '#FFF3E0' : 'transparent', borderRadius: 8 }]}
                            onPress={handleToggleLow}
                        >
                            <AlertTriangle size={18} color={item.is_low ? colors.orange : colors.charcoal} />
                            <Text style={[styles.rowText, item.is_low && { color: colors.orange, fontWeight: '600' }]}>
                                {item.is_low ? 'Running Low' : 'Mark as Running Low'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Notes Section */}
                    {item.notes ? (
                        <View style={styles.section}>
                            <View style={[styles.row, { marginBottom: 8 }]}>
                                <FileText size={18} color={colors.purple} />
                                <Text style={[styles.rowText, { fontWeight: '600', color: colors.purple }]}>My Notes</Text>
                            </View>
                            <Text style={styles.noteText}>{item.notes}</Text>
                        </View>
                    ) : null}

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: item.is_approved ? colors.mint + '20' : colors.orange + '20' }]}>
                        <Text style={{ color: item.is_approved ? colors.mint : colors.orange, fontWeight: '600' }}>
                            {item.is_approved ? '✓ Approved for Kids' : '⚠️ Pending Approval'}
                        </Text>
                    </View>

                    {/* Finish / Restore Button */}
                    <Pressable
                        style={[
                            styles.actionButton,
                            item.status === 'finished' ? styles.restoreButton : styles.finishButton
                        ]}
                        onPress={handleFinish}
                    >
                        {item.status === 'finished' ? (
                            <>
                                <PackageCheck size={20} color={colors.purple} />
                                <Text style={[styles.actionButtonText, { color: colors.purple }]}>Put Back on Shelf</Text>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} color="white" />
                                <Text style={styles.actionButtonText}>Mark as Finished</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: { width: '100%', height: 300, resizeMode: 'cover', backgroundColor: 'white' },
    content: { padding: spacing[6] },
    header: { marginBottom: spacing[6] },
    brand: { fontSize: 14, fontWeight: '700', color: colors.purple, textTransform: 'uppercase', marginBottom: 4 },
    name: { fontSize: 24, fontWeight: '700', color: colors.black },
    section: {
        backgroundColor: 'white',
        padding: spacing[4],
        borderRadius: radii.lg,
        gap: spacing[3],
        marginBottom: spacing[4]
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
    rowText: { fontSize: 16, color: colors.charcoal },
    iconButton: { padding: 8 },
    statusBadge: {
        padding: spacing[4],
        borderRadius: radii.lg,
        alignItems: 'center',
        marginBottom: spacing[6]
    },
    noteText: {
        fontSize: 16,
        color: colors.charcoal,
        lineHeight: 24
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[4],
        borderRadius: radii.full,
        gap: spacing[2],
        marginBottom: spacing[6]
    },
    finishButton: {
        backgroundColor: colors.purple,
    },
    restoreButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: colors.purple,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white'
    },
    streakRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginTop: spacing[2],
        flexWrap: 'wrap'
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: 'white',
        borderRadius: radii.full,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.charcoal
    },
    usageButton: {
        backgroundColor: colors.mint,
        padding: spacing[4],
        borderRadius: radii.lg,
        alignItems: 'center',
        marginBottom: spacing[4],
        shadowColor: colors.mint,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2
    },
    usageButtonDisabled: {
        backgroundColor: '#F0F0F0',
        elevation: 0,
        shadowOpacity: 0
    },
    usageButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
    usageButtonTextDisabled: {
        color: '#999'
    },

});
