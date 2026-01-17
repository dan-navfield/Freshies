import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { shelfService } from '../../src/services/shelfService';
import { ShelfItem } from '../../src/types/shelf';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { Plus, AlertCircle, Package, User, Baby, Heart, Clock, CheckCircle, ArrowUpDown, Check, ShoppingBag } from 'lucide-react-native';
import PageHeader from '../../src/components/PageHeader';
import WishlistCard from '../../src/components/WishlistCard';
import WishlistStatusBadge from '../../src/components/WishlistStatusBadge';
import ApprovalRequestModal from '../../src/components/ApprovalRequestModal';
import { getWishlistItems, getWishlistStats, removeFromWishlist, requestApproval } from '../../src/services/wishlistService';
import type { WishlistItem, WishlistStats, WishlistStatus } from '../../src/types/wishlist';

interface ProfileOption {
    id: string; // 'parent' or childUUID
    name: string;
    avatar_url?: string;
    type: 'parent' | 'child';
}

export default function ShelfScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [items, setItems] = useState<ShelfItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Profile Selection
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string>('parent');

    // Inventory Tabs (Shelf vs Wishlist)
    const [inventoryTab, setInventoryTab] = useState<'shelf' | 'wishlist'>('shelf');
    const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'alpha'>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Wishlist State
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [wishlistStats, setWishlistStats] = useState<WishlistStats | null>(null);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistStatusFilter, setWishlistStatusFilter] = useState<WishlistStatus | 'all'>('all');
    const [approvalModalItem, setApprovalModalItem] = useState<WishlistItem | null>(null);
    const [requestingApproval, setRequestingApproval] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, [user]);

    useEffect(() => {
        if (inventoryTab === 'shelf') {
            loadShelf();
        } else {
            loadWishlist();
        }
    }, [user, activeProfileId, inventoryTab]);

    // Reload on focus
    useFocusEffect(
        useCallback(() => {
            if (inventoryTab === 'shelf') {
                loadShelf();
            } else {
                loadWishlist();
            }
        }, [user, activeProfileId, inventoryTab])
    );

    const loadProfiles = async () => {
        if (!user?.id) return;

        try {
            // 1. Fetch Parent Avatar
            const { data: parentData } = await supabase
                .from('profiles')
                .select('avatar_url, first_name')
                .eq('id', user.id)
                .single();

            if (parentData?.avatar_url) {
                setAvatarUrl(parentData.avatar_url);
            }

            // 2. Setup Parent Profile Option
            const parentProfile: ProfileOption = {
                id: 'parent',
                name: parentData?.first_name || 'My Shelf',
                type: 'parent',
                avatar_url: parentData?.avatar_url
            };

            // 3. Fetch Children from managed_children
            const { data: children, error } = await supabase
                .from('managed_children')
                .select('id, first_name, avatar_url, child_profile_id')
                .eq('parent_id', user.id)
                .eq('status', 'active');

            if (error) throw error;

            const childProfiles: ProfileOption[] = (children || []).map(child => ({
                id: child.child_profile_id || child.id,
                name: child.first_name,
                avatar_url: child.avatar_url,
                type: 'child'
            }));

            setProfiles([parentProfile, ...childProfiles]);
        } catch (e) {
            console.error('Error loading profiles:', e);
            // Fallback
            setProfiles([{
                id: 'parent',
                name: 'My Shelf',
                type: 'parent'
            }]);
        }
    };

    const getSortedItems = () => {
        let sorted = [...items];
        switch (sortBy) {
            case 'alpha':
                sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
                break;
            case 'expiring':
                sorted.sort((a, b) => {
                    const getDaysLeft = (item: ShelfItem) => {
                        if (!item.opened_at || !item.pao_months) return 9999;
                        const daysOpen = Math.floor((new Date().getTime() - new Date(item.opened_at).getTime()) / (1000 * 60 * 60 * 24));
                        return (item.pao_months * 30) - daysOpen;
                    };
                    return getDaysLeft(a) - getDaysLeft(b);
                });
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
        }
        return sorted;
    };

    const loadShelf = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const targetProfileId = activeProfileId === 'parent' ? undefined : activeProfileId;
            const data = await shelfService.getShelfItems(user.id, targetProfileId);
            setItems(data);
        } catch (error) {
            console.error('Error loading shelf:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWishlist = async () => {
        if (!user?.id) return;
        try {
            setWishlistLoading(true);
            const targetProfileId = activeProfileId === 'parent' ? undefined : activeProfileId;
            const statusFilter = wishlistStatusFilter === 'all' ? undefined : wishlistStatusFilter;

            const [itemsData, statsData] = await Promise.all([
                getWishlistItems(user.id, targetProfileId, statusFilter),
                getWishlistStats(user.id, targetProfileId),
            ]);

            setWishlistItems(itemsData);
            setWishlistStats(statsData);
        } catch (error) {
            console.error('Error loading wishlist:', error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleRequestApproval = async (reason: string) => {
        if (!approvalModalItem) return;
        try {
            setRequestingApproval(true);
            await requestApproval(approvalModalItem.id, reason);
            Alert.alert('Sent!', 'Your request has been sent to your parent.');
            setApprovalModalItem(null);
            loadWishlist();
        } catch (error) {
            console.error('Error requesting approval:', error);
            Alert.alert('Error', 'Failed to send request. Please try again.');
        } finally {
            setRequestingApproval(false);
        }
    };

    const handleRemoveFromWishlist = async (item: WishlistItem) => {
        Alert.alert(
            'Remove from Wishlist',
            `Remove ${item.product_name} from your wishlist?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFromWishlist(item.id);
                        loadWishlist();
                    },
                },
            ]
        );
    };

    const handleMoveToShelf = (item: WishlistItem) => {
        router.push({
            pathname: '/(shelf)/add',
            params: {
                fromWishlist: item.id,
                productName: item.product_name,
                productBrand: item.product_brand,
                productImage: item.product_image_url,
                productCategory: item.product_category,
            },
        } as any);
    };

    const renderShelfItem = (item: ShelfItem) => {
        const expiryStatus = shelfService.getExpiryStatus(item);

        return (
            <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`/(shelf)/${item.id}` as any)}
            >
                <Image
                    source={{ uri: item.product_image_url || 'https://via.placeholder.com/150' }}
                    style={styles.cardImage}
                />
                <View style={styles.cardContent}>
                    <Text style={styles.cardBrand} numberOfLines={1}>{item.product_brand}</Text>
                    <Text style={styles.cardName} numberOfLines={2}>{item.product_name}</Text>

                    <View style={styles.badges}>
                        {expiryStatus === 'expiring_soon' && (
                            <View style={[styles.badge, { backgroundColor: colors.red + '20' }]}>
                                <AlertCircle size={10} color={colors.red} />
                                <Text style={[styles.badgeText, { color: colors.red }]}>Expiring</Text>
                            </View>
                        )}
                        {item.status === 'running_low' && (
                            <View style={[styles.badge, { backgroundColor: colors.orange + '20' }]}>
                                <Text style={[styles.badgeText, { color: colors.orange }]}>Low</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <PageHeader
                title="My Shelf"
                subtitle="Manage your products"
                showSearch={true}
                searchPlaceholder="Search shelf..."
                avatarUrl={avatarUrl}
            />

            {/* Profile Selector & Add Button Row */}
            <View style={styles.profileSelectorRow}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.profileSelectorContent}
                    style={styles.profileScrollView}
                >
                    {profiles.map(profile => {
                        const isActive = activeProfileId === profile.id;
                        return (
                            <Pressable
                                key={profile.id}
                                style={[styles.profileChip, isActive && styles.profileChipActive]}
                                onPress={() => setActiveProfileId(profile.id)}
                            >
                                <View style={[styles.profileIcon, isActive && { backgroundColor: 'white' }]}>
                                    {profile.avatar_url ? (
                                        <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
                                    ) : (
                                        profile.type === 'parent' ? <User size={14} color={isActive ? colors.purple : colors.charcoal} /> : <Baby size={14} color={isActive ? colors.purple : colors.charcoal} />
                                    )}
                                </View>
                                <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                                    {profile.name}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                        style={styles.sortButton}
                        onPress={() => setShowSortMenu(!showSortMenu)}
                    >
                        <ArrowUpDown color="white" size={20} />
                    </Pressable>
                    <Pressable
                        style={styles.inlineAddButton}
                        onPress={() => router.push({
                            pathname: '/(shelf)/add',
                            params: { profileId: activeProfileId === 'parent' ? undefined : activeProfileId }
                        } as any)}
                    >
                        <Plus color="white" size={20} />
                    </Pressable>
                </View>

                {/* Sort Dropdown */}
                {showSortMenu && (
                    <View style={styles.sortMenu}>
                        {[
                            { id: 'newest', label: 'Newest First' },
                            { id: 'expiring', label: 'Expiring Soon' },
                            { id: 'alpha', label: 'Name (A-Z)' },
                        ].map((option) => (
                            <Pressable
                                key={option.id}
                                style={styles.sortMenuItem}
                                onPress={() => {
                                    setSortBy(option.id as any);
                                    setShowSortMenu(false);
                                }}
                            >
                                <Text style={[styles.sortMenuText, sortBy === option.id && styles.sortMenuTextActive]}>
                                    {option.label}
                                </Text>
                                {sortBy === option.id && <Check size={14} color={colors.purple} />}
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>

            {/* Inventory Tabs: Shelf / Wishlist */}
            <View style={styles.inventoryTabs}>
                <Pressable
                    style={[styles.inventoryTab, inventoryTab === 'shelf' && styles.inventoryTabActive]}
                    onPress={() => setInventoryTab('shelf')}
                >
                    <ShoppingBag size={18} color={inventoryTab === 'shelf' ? colors.purple : colors.charcoal} />
                    <Text style={[styles.inventoryTabText, inventoryTab === 'shelf' && styles.inventoryTabTextActive]}>
                        Shelf ({items.length})
                    </Text>
                </Pressable>

                <Pressable
                    style={[styles.inventoryTab, inventoryTab === 'wishlist' && styles.inventoryTabActive]}
                    onPress={() => setInventoryTab('wishlist')}
                >
                    <Heart size={18} color={inventoryTab === 'wishlist' ? colors.purple : colors.charcoal} />
                    <Text style={[styles.inventoryTabText, inventoryTab === 'wishlist' && styles.inventoryTabTextActive]}>
                        Wishlist ({wishlistStats ? wishlistStats.total : 0})
                    </Text>
                </Pressable>
            </View>

            {/* Wishlist Summary Stats */}
            {inventoryTab === 'wishlist' && wishlistStats && (wishlistStats.awaiting_approval > 0 || wishlistStats.approved > 0) && (
                <View style={styles.wishlistSummary}>
                    {wishlistStats.awaiting_approval > 0 && (
                        <View style={styles.summaryChip}>
                            <Clock size={14} color={colors.orange} />
                            <Text style={[styles.summaryChipText, { color: colors.orange }]}>
                                {wishlistStats.awaiting_approval} awaiting
                            </Text>
                        </View>
                    )}
                    {wishlistStats.approved > 0 && (
                        <View style={styles.summaryChip}>
                            <CheckCircle size={14} color={colors.mint} />
                            <Text style={[styles.summaryChipText, { color: colors.mint }]}>
                                {wishlistStats.approved} approved
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Filter Tabs - For Shelf: Category, For Wishlist: Status */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {inventoryTab === 'shelf' ? (
                        // Category filters for shelf
                        ['All', 'Cleansers', 'Moisturizers', 'Sunscreen', 'Serums', 'Masks'].map((tab) => (
                            <Pressable
                                key={tab}
                                style={[styles.tab, activeTab === tab.toLowerCase() && styles.activeTab]}
                                onPress={() => setActiveTab(tab.toLowerCase() as any)}
                            >
                                <Text style={[styles.tabText, activeTab === tab.toLowerCase() && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </Pressable>
                        ))
                    ) : (
                        // Status filters for wishlist
                        [
                            { key: 'all', label: 'All' },
                            { key: 'saved', label: 'Saved' },
                            { key: 'awaiting_approval', label: 'Awaiting' },
                            { key: 'approved', label: 'Approved' },
                            { key: 'not_approved', label: 'Declined' },
                        ].map((filter) => (
                            <Pressable
                                key={filter.key}
                                style={[styles.tab, wishlistStatusFilter === filter.key && styles.activeTab]}
                                onPress={() => {
                                    setWishlistStatusFilter(filter.key as any);
                                    loadWishlist();
                                }}
                            >
                                <Text style={[styles.tabText, wishlistStatusFilter === filter.key && styles.activeTabText]}>
                                    {filter.label}
                                </Text>
                            </Pressable>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Content Area */}
            {inventoryTab === 'shelf' ? (
                // Shelf Content
                loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.purple} />
                    </View>
                ) : items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={64} color={colors.lavender} />
                        <Text style={styles.emptyTitle}>
                            {activeProfileId === 'parent' ? 'Your shelf is empty' : 'This shelf is empty'}
                        </Text>
                        <Text style={styles.emptyText}>Tap the + button to add products.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
                        <View style={styles.row}>
                            {getSortedItems()
                                .filter(item => {
                                    if (activeTab === 'all') return true;
                                    const itemCat = (item.product_category || '').toLowerCase();
                                    const tabCat = activeTab.toLowerCase();
                                    return itemCat.includes(tabCat.replace(/s$/, '')) || tabCat.includes(itemCat);
                                })
                                .map(renderShelfItem)}

                            {items.filter(item => activeTab === 'all' || (item.product_category || '').toLowerCase().includes(activeTab.toLowerCase().replace(/s$/, ''))).length === 0 && items.length > 0 && (
                                <View style={{ width: '100%', alignItems: 'center', padding: 20 }}>
                                    <Text style={{ color: colors.charcoal, opacity: 0.6 }}>No {activeTab} found</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                )
            ) : (
                // Wishlist Content
                wishlistLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.purple} />
                    </View>
                ) : wishlistItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Heart size={64} color={colors.lavender} />
                        <Text style={styles.emptyTitle}>No saved products yet</Text>
                        <Text style={styles.emptyText}>
                            Save products you want to try by tapping the heart icon.
                        </Text>
                        <Pressable
                            style={styles.emptyButton}
                            onPress={() => router.push('/(tabs)/scan' as any)}
                        >
                            <Text style={styles.emptyButtonText}>Search Products</Text>
                        </Pressable>
                    </View>
                ) : (
                    <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
                        <View style={styles.row}>
                            {wishlistItems
                                .filter(item => item.status !== 'on_shelf')
                                .map((item) => (
                                    <WishlistCard
                                        key={item.id}
                                        item={item}
                                        onPress={() => router.push(`/(shelf)/wishlist/${item.id}` as any)}
                                        onRequestApproval={() => setApprovalModalItem(item)}
                                        onMoveToShelf={() => handleMoveToShelf(item)}
                                        onRemove={() => handleRemoveFromWishlist(item)}
                                        showActions={true}
                                        isChildView={false}
                                    />
                                ))}
                        </View>
                    </ScrollView>
                )
            )}

            {/* Approval Request Modal */}
            <ApprovalRequestModal
                visible={!!approvalModalItem}
                item={approvalModalItem}
                onClose={() => setApprovalModalItem(null)}
                onSubmit={handleRequestApproval}
                loading={requestingApproval}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    headerContainer: {
        backgroundColor: colors.cream,
        zIndex: 10,
        paddingBottom: spacing[2],
    },
    // New Row Layout for Profile + Add
    profileSelectorRow: {
        marginTop: spacing[4],
        marginBottom: spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: spacing[6], // Right padding for the button
        gap: spacing[3],
    },
    profileScrollView: {
        flex: 1,
    },
    profileSelectorContent: {
        paddingLeft: spacing[6], // Left padding inside scroll
        paddingRight: spacing[3], // Gap before button
        gap: spacing[3],
    },
    inlineAddButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.purple,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.purple,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sortButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    sortMenu: {
        position: 'absolute',
        top: 60,
        right: 24,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 100,
        minWidth: 160,
    },
    sortMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    sortMenuText: {
        fontSize: 14,
        color: colors.charcoal,
        fontWeight: '500',
    },
    sortMenuTextActive: {
        color: colors.purple,
        fontWeight: '700',
    },
    // Chips
    profileChip: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingRight: 12,
        backgroundColor: 'white',
        borderRadius: radii.full,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    profileChipActive: {
        backgroundColor: colors.purple,
        borderColor: colors.purple,
    },
    profileIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.cream,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    profileImage: {
        width: 28,
        height: 28,
    },
    profileName: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.charcoal,
    },
    profileNameActive: {
        color: 'white',
    },
    tabsWrapper: {
        marginBottom: spacing[2],
    },
    tabsContent: {
        paddingHorizontal: spacing[6],
        gap: spacing[2],
        paddingBottom: spacing[2],
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: radii.lg,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    activeTab: {
        backgroundColor: colors.black,
        borderColor: colors.black,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.charcoal,
    },
    activeTabText: {
        color: 'white',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        flex: 1,
    },
    gridContent: {
        padding: spacing[6],
        paddingTop: spacing[2],
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[4],
    },
    card: {
        width: '47%',
        backgroundColor: 'white',
        borderRadius: radii.lg,
        overflow: 'hidden',
        marginBottom: spacing[4],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardImage: {
        width: '100%',
        height: 140,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: spacing[3],
    },
    cardBrand: {
        fontSize: 11,
        color: colors.charcoal,
        opacity: 0.6,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    cardName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.black,
        paddingBottom: 4,
        height: 48,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[8],
        marginTop: -100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    emptyText: {
        fontSize: 14,
        color: colors.charcoal,
        textAlign: 'center',
        opacity: 0.7,
    },
    // Inventory Tabs (Shelf / Wishlist)
    inventoryTabs: {
        flexDirection: 'row',
        marginHorizontal: spacing[6],
        marginBottom: spacing[3],
        backgroundColor: colors.cream,
        borderRadius: radii.lg,
        padding: 4,
    },
    inventoryTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[2],
        borderRadius: radii.md,
        gap: 6,
    },
    inventoryTabActive: {
        backgroundColor: colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    inventoryTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.charcoal,
    },
    inventoryTabTextActive: {
        color: colors.purple,
    },
    // Wishlist Summary Strip
    wishlistSummary: {
        flexDirection: 'row',
        paddingHorizontal: spacing[6],
        marginBottom: spacing[2],
        gap: spacing[3],
    },
    summaryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radii.full,
        gap: spacing[2],
    },
    summaryChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Empty State Button
    emptyButton: {
        marginTop: spacing[4],
        backgroundColor: colors.purple,
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[3],
        borderRadius: radii.lg,
    },
    emptyButtonText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
});
