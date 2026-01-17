import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { shelfService } from '../../../src/services/shelfService';
import { routineService } from '../../../src/services/routineService';
import { getWishlistItems, removeFromWishlist, getWishlistStats, requestApproval, getWishlistGroups } from '../../../src/services/wishlistService';
import { ShelfItem } from '../../../src/types/shelf';
import { WishlistItem, WishlistStats, WishlistStatus, WishlistGroup } from '../../../src/types/wishlist';
import { colors, spacing, radii } from '../../../src/theme/tokens';
import { Plus, AlertCircle, Package, Heart, ShoppingBag, FolderHeart, ChevronRight, AlertTriangle, ArrowUpDown, Check, X } from 'lucide-react-native';
import { usageService } from '../../../src/services/usageService';
import PageHeader from '../../../src/components/PageHeader';
import WishlistCard from '../../../src/components/WishlistCard';
import ApprovalRequestModal from '../../../src/components/ApprovalRequestModal';
import AddToGroupModal from '../../../src/components/AddToGroupModal';
import ExpiryRing from '../../../src/components/ExpiryRing';
import { useChildProfile } from '../../../src/contexts/ChildProfileContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { expiryNotificationService } from '../../../src/services/expiryNotificationService';

export default function ChildShelfScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { childProfile } = useChildProfile();

    // Shelf state
    const [items, setItems] = useState<ShelfItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [productRoutineMap, setProductRoutineMap] = useState<Record<string, string[]>>({});
    const [sortBy, setSortBy] = useState<'newest' | 'expiring' | 'alpha'>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Inventory tab (Shelf vs Wishlist)
    const [inventoryTab, setInventoryTab] = useState<'shelf' | 'wishlist'>('shelf');

    // Wishlist state
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [wishlistGroups, setWishlistGroups] = useState<WishlistGroup[]>([]);
    const [wishlistStats, setWishlistStats] = useState<WishlistStats | null>(null);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistStatusFilter, setWishlistStatusFilter] = useState<WishlistStatus | 'all'>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Approval modal state
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [selectedItemForApproval, setSelectedItemForApproval] = useState<WishlistItem | null>(null);
    const [approvalLoading, setApprovalLoading] = useState(false);

    // Add to Group modal state
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [selectedItemForGroup, setSelectedItemForGroup] = useState<WishlistItem | null>(null);

    // Reload data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (childProfile?.id) {
                loadShelf();
                loadWishlist();
            }
        }, [childProfile?.id])
    );

    useEffect(() => {
        if (childProfile?.id) {
            loadShelf();
            loadWishlist();
            loadRoutines();
        }
    }, [childProfile?.id]);

    const loadRoutines = async () => {
        if (!childProfile?.id) return;
        try {
            const result = await routineService.getRoutines(childProfile.id);
            if (result.ok && result.value) {
                const map: Record<string, ('morning' | 'evening')[]> = {};

                result.value.forEach(routine => {
                    if (!routine.is_active) return;
                    routine.steps.forEach(step => {
                        if (step.product_id) {
                            if (!map[step.product_id]) map[step.product_id] = [];
                            if (!map[step.product_id].includes(routine.segment as any)) {
                                map[step.product_id].push(routine.segment as any);
                            }
                        }
                    });
                });
                setProductRoutineMap(map);
            }
        } catch (e) {
            console.warn('Failed to load routines for badges', e);
        }
    };

    const loadShelf = async () => {
        if (!childProfile?.id) return;

        console.log('ChildShelf: Loading items for profile:', childProfile.id);

        try {
            setLoading(true);
            const userId = childProfile.user_id || user?.id || 'unknown';
            const data = await shelfService.getShelfItems(userId, childProfile.id);
            console.log('ChildShelf: Loaded', data?.length, 'items');
            setItems(data || []);

            // Schedule expiry notifications
            if (data && data.length > 0) {
                expiryNotificationService.scheduleExpiryNotifications(childProfile.id, data)
                    .catch(e => console.error('Error scheduling expiry notifications:', e));
            }
        } catch (error) {
            console.error('ChildShelf: Error loading shelf:', error);
        } finally {
            setLoading(false);
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

    const handleQuickAction = (item: ShelfItem) => {
        Alert.alert(
            item.product_name,
            'Quick Actions',
            [
                {
                    text: 'Mark as Used Today 🧴',
                    onPress: async () => {
                        try {
                            if (!childProfile?.id) return;
                            await usageService.trackUsage(item.id, childProfile.id);
                            Alert.alert('Tracked!', 'Good job sticking to your routine! 🔥');
                        } catch (e) {
                            Alert.alert('Error', 'Failed to track usage');
                        }
                    }
                },
                {
                    text: 'Product Details',
                    onPress: () => router.push(`/(shelf)/${item.id}`)
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    const loadWishlist = async () => {
        if (!childProfile?.id) return;

        try {
            setWishlistLoading(true);
            setWishlistLoading(true);
            const userId = childProfile.user_id || user?.id || 'unknown';
            const [itemsData, statsData, groupsData] = await Promise.all([
                getWishlistItems(userId, childProfile.id),
                getWishlistStats(userId, childProfile.id),
                getWishlistGroups(childProfile.id),
            ]);
            setWishlistItems(itemsData);
            setWishlistStats(statsData);
            setWishlistGroups(groupsData);
        } catch (error) {
            console.error('ChildShelf: Error loading wishlist:', error);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleRemoveFromWishlist = async (itemId: string) => {
        try {
            await removeFromWishlist(itemId);
            setWishlistItems(prev => prev.filter(i => i.id !== itemId));
            Alert.alert('Removed', 'Item removed from your wishlist.');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            Alert.alert('Error', 'Failed to remove item.');
        }
    };

    const handleMoveToShelf = (item: WishlistItem) => {
        router.push({
            pathname: '/(shelf)/add',
            params: {
                fromWishlist: 'true',
                wishlistItemId: item.id,
                productName: item.product_name,
                productBrand: item.product_brand,
                productImage: item.product_image_url,
                productCategory: item.product_category,
            }
        } as any);
    };

    const renderShelfItem = (item: ShelfItem) => {
        const daysOpen = item.opened_at ? Math.floor((new Date().getTime() - new Date(item.opened_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const isExpired = item.pao_months && daysOpen > item.pao_months * 30;

        return (
            <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`/(shelf)/${item.id}`)}
                onLongPress={() => handleQuickAction(item)}
                delayLongPress={500}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.product_image_url || 'https://via.placeholder.com/150' }}
                        style={styles.cardImage}
                    />
                    {/* Routine Badges */}
                    {(productRoutineMap[item.id] || []).length > 0 && (
                        <View style={{ position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 4 }}>
                            {(productRoutineMap[item.id] || []).includes('morning') && (
                                <View style={{ backgroundColor: '#FFD700', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                                    <Text style={{ fontSize: 14 }}>☀️</Text>
                                </View>
                            )}
                            {(productRoutineMap[item.id] || []).includes('afternoon') && (
                                <View style={{ backgroundColor: '#FFA500', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                                    <Text style={{ fontSize: 14 }}>🌤️</Text>
                                </View>
                            )}
                            {(productRoutineMap[item.id] || []).includes('evening') && (
                                <View style={{ backgroundColor: '#4B0082', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                                    <Text style={{ fontSize: 14 }}>🌙</Text>
                                </View>
                            )}
                            {(productRoutineMap[item.id] || []).some(r => r !== 'morning' && r !== 'evening' && r !== 'afternoon') && (
                                <View style={{ backgroundColor: '#9C27B0', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                                    <Text style={{ fontSize: 14 }}>✨</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Low Stock Badge */}
                    {item.is_low && (
                        <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: '#FFF3E0', borderRadius: 12, padding: 4, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
                            <AlertTriangle size={12} color={colors.orange} />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.orange }}>Low</Text>
                        </View>
                    )}

                    {item.pao_months && item.opened_at && (
                        <View style={styles.expiryRing}>
                            <ExpiryRing
                                paoMonths={item.pao_months}
                                daysOpen={daysOpen}
                                size={40}
                            />
                        </View>
                    )}

                    {/* User Submitted Badge - bottom right */}
                    {item.is_approved === false && (
                        <View style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            backgroundColor: colors.purple,
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2
                        }}>
                            <Text style={{ fontSize: 10, color: 'white' }}>⏳</Text>
                            <Text style={{ fontSize: 8, fontWeight: '700', color: 'white' }}>Pending</Text>
                        </View>
                    )}
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardBrand} numberOfLines={1}>{item.product_brand || 'Brand'}</Text>
                    <Text style={styles.cardName} numberOfLines={2}>{item.product_name}</Text>
                </View>
            </Pressable >
        );
    };

    const handleAddProduct = () => {
        router.push('/(shelf)/add');
    };

    // Request approval handlers
    const handleRequestApproval = (item: WishlistItem) => {
        setSelectedItemForApproval(item);
        setApprovalModalVisible(true);
    };

    const handleApprovalSubmit = async (reason: string) => {
        if (!selectedItemForApproval) return;

        setApprovalLoading(true);
        try {
            const success = await requestApproval(selectedItemForApproval.id, reason);
            if (success) {
                // Update local state to reflect the new status
                setWishlistItems(prev =>
                    prev.map(item =>
                        item.id === selectedItemForApproval.id
                            ? { ...item, status: 'awaiting_approval' as WishlistStatus, child_note: reason }
                            : item
                    )
                );
                Alert.alert(
                    'Request Sent! 💜',
                    'Your parent will review your request.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', 'Failed to send request. Please try again.');
            }
        } catch (error) {
            console.error('Error requesting approval:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setApprovalLoading(false);
            setApprovalModalVisible(false);
            setSelectedItemForApproval(null);
        }
    };

    // Add to Group handler
    const handleAddToGroup = (item: WishlistItem) => {
        setSelectedItemForGroup(item);
        setGroupModalVisible(true);
    };

    // Filter wishlist items
    let filteredWishlistItems = wishlistItems;

    // 1. Filter by status if not 'all'
    if (wishlistStatusFilter !== 'all') {
        filteredWishlistItems = filteredWishlistItems.filter(item => item.status === wishlistStatusFilter);
    }

    // 2. Filter by group if selected
    if (selectedGroupId) {
        filteredWishlistItems = filteredWishlistItems.filter(item =>
            item.groups?.some(g => g.id === selectedGroupId)
        );
    }

    return (
        <View style={styles.container}>
            <PageHeader
                title="My Shelf"
                subtitle="Your personal collection 🧴"
                showSearch={true}
                searchPlaceholder="Search all products..."
                showAvatar={true}
            />

            <View style={styles.contentHeader}>
                {/* Profile Row */}
                <View style={styles.profileRow}>
                    <View style={styles.activeProfileChip}>
                        {childProfile?.avatar_url ? (
                            <Image source={{ uri: childProfile.avatar_url }} style={styles.profileAvatar} />
                        ) : childProfile?.avatar_config?.emoji ? (
                            <View style={[
                                styles.profileEmoji,
                                { backgroundColor: childProfile.avatar_config.backgroundColor || colors.purple }
                            ]}>
                                <Text style={styles.profileEmojiText}>{childProfile.avatar_config.emoji}</Text>
                            </View>
                        ) : (
                            <View style={styles.profileEmoji}>
                                <Text style={styles.profileEmojiText}>
                                    {childProfile?.display_name?.[0] || '👤'}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.profileName}>{childProfile?.display_name || 'Me'}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                            style={[styles.iconButton, { marginRight: 8, backgroundColor: '#000', borderWidth: 0 }]}
                            onPress={() => setShowSortMenu(!showSortMenu)}
                        >
                            <ArrowUpDown color="white" size={20} />
                        </Pressable>
                        <Pressable style={styles.iconButton} onPress={handleAddProduct}>
                            <Plus color="white" size={24} />
                        </Pressable>
                    </View>

                    {/* Sort Dropdown */}
                    {showSortMenu && (
                        <View style={{
                            position: 'absolute',
                            top: 50,
                            right: 24,
                            backgroundColor: 'white',
                            borderRadius: radii.md,
                            padding: 4,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 5,
                            zIndex: 1000,
                            minWidth: 150,
                        }}>
                            {[
                                { id: 'newest', label: 'Newest First' },
                                { id: 'expiring', label: 'Expiring Soon' },
                                { id: 'alpha', label: 'Name (A-Z)' },
                            ].map((option) => (
                                <Pressable
                                    key={option.id}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                        // borderBottomWidth: option.id !== 'alpha' ? 1 : 0,
                                        // borderBottomColor: 'rgba(0,0,0,0.05)',
                                    }}
                                    onPress={() => {
                                        setSortBy(option.id as any);
                                        setShowSortMenu(false);
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 14,
                                        fontWeight: sortBy === option.id ? '600' : '400',
                                        color: sortBy === option.id ? colors.purple : colors.charcoal
                                    }}>
                                        {option.label}
                                    </Text>
                                    {sortBy === option.id && <Check size={14} color={colors.purple} />}
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                {/* Inventory Tabs (Shelf / Wishlist) */}
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
                            Wishlist ({wishlistItems.length})
                        </Text>
                    </Pressable>
                </View>

                {/* Category Filter Tabs - Only show for Shelf */}
                {inventoryTab === 'shelf' ? (
                    <View style={styles.tabsWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabsContent}
                        >
                            {['All', 'Cleansers', 'Moisturizers', 'Sunscreen', 'Serums', 'Masks'].map((tab) => (
                                <Pressable
                                    key={tab}
                                    style={[styles.tab, activeTab === tab.toLowerCase() && styles.activeTab]}
                                    onPress={() => setActiveTab(tab.toLowerCase())}
                                >
                                    <Text style={[styles.tabText, activeTab === tab.toLowerCase() && styles.activeTabText]}>
                                        {tab}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    /* Wishlist Filters (Dynamic Groups) */
                    <View style={styles.tabsWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabsContent}
                        >
                            {/* All Items Pill */}
                            <Pressable
                                style={[styles.tab, selectedGroupId === null && styles.activeTab]}
                                onPress={() => setSelectedGroupId(null)}
                            >
                                <Text style={[styles.tabText, selectedGroupId === null && styles.activeTabText]}>
                                    All Items
                                </Text>
                            </Pressable>

                            {/* Dynamic Group Pills */}
                            {wishlistGroups.map(group => (
                                <Pressable
                                    key={group.id}
                                    style={[styles.tab, selectedGroupId === group.id && styles.activeTab]}
                                    onPress={() => setSelectedGroupId(group.id)}
                                >
                                    <Text style={[styles.tabText, selectedGroupId === group.id && styles.activeTabText]}>
                                        {group.emoji || '📁'} {group.name}
                                    </Text>
                                </Pressable>
                            ))}

                            {/* See All Groups Link */}
                            <Pressable
                                style={[styles.tab, { flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => router.push('/(child)/groups/' as any)}
                            >
                                <Text style={styles.tabText}>
                                    See All
                                </Text>
                                <FolderHeart size={14} color={colors.charcoal} style={{ marginLeft: 6 }} />
                            </Pressable>
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Content */}
            {inventoryTab === 'shelf' ? (
                // Shelf Content
                loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.purple} />
                    </View>
                ) : items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Package size={64} color={colors.lavender} />
                        <Text style={styles.emptyTitle}>Your shelf is empty</Text>
                        <Text style={styles.emptyText}>Tap the + button to add products.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
                        <View style={styles.row}>
                            {getSortedItems()
                                .filter(item => {
                                    // Hide finished items from main shelf
                                    if (item.status === 'finished') return false;

                                    let matchesTab = true;
                                    if (activeTab !== 'all') {
                                        const itemCat = (item.product_category || '').toLowerCase();
                                        const tabCat = activeTab.toLowerCase();
                                        matchesTab = itemCat.includes(tabCat.replace(/s$/, '')) || tabCat.includes(itemCat);
                                    }
                                    let matchesSearch = true;
                                    if (searchQuery) {
                                        const query = searchQuery.toLowerCase();
                                        matchesSearch = item.product_name.toLowerCase().includes(query) ||
                                            (item.product_brand || '').toLowerCase().includes(query);
                                    }
                                    return matchesTab && matchesSearch;
                                })
                                .map(renderShelfItem)}
                        </View>

                        <Pressable
                            style={styles.archiveLink}
                            onPress={() => router.push('/(child)/history' as any)}
                        >
                            <Text style={styles.archiveLinkText}>View Finished Products</Text>
                            <ChevronRight size={16} color={colors.purple} opacity={0.6} />
                        </Pressable>
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
                        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                        <Text style={styles.emptyText}>Add products you want from the Products hub.</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
                        <View style={styles.row}>
                            {filteredWishlistItems.map(item => (
                                <WishlistCard
                                    key={item.id}
                                    item={item}
                                    onPress={() => {
                                        // Navigate to product detail - use barcode or product name
                                        const productId = item.product_barcode || item.product_id;
                                        if (productId) {
                                            router.push(`/(child)/products/${productId}` as any);
                                        } else {
                                            Alert.alert('Product Details', `${item.product_name}\n\nBrand: ${item.product_brand || 'Unknown'}`);
                                        }
                                    }}
                                    onRemove={() => handleRemoveFromWishlist(item.id)}
                                    onMoveToShelf={() => handleMoveToShelf(item)}
                                    onRequestApproval={() => handleRequestApproval(item)}
                                    onAddToGroup={() => handleAddToGroup(item)}
                                    isChildView={true}
                                />
                            ))}
                        </View>
                    </ScrollView>
                )
            )
            }

            {/* Approval Request Modal */}
            <ApprovalRequestModal
                visible={approvalModalVisible}
                item={selectedItemForApproval}
                onClose={() => {
                    setApprovalModalVisible(false);
                    setSelectedItemForApproval(null);
                }}
                onSubmit={handleApprovalSubmit}
                loading={approvalLoading}
            />

            {/* Add to Group Modal */}
            <AddToGroupModal
                visible={groupModalVisible}
                item={selectedItemForGroup}
                userId={user?.id || ''}
                profileId={childProfile?.id || ''}
                onClose={() => {
                    setGroupModalVisible(false);
                    setSelectedItemForGroup(null);
                }}
                onUpdated={() => loadWishlist()}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    contentHeader: {
        paddingTop: spacing[4],
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[6],
        marginBottom: spacing[4],
    },
    activeProfileChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.purple,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: radii.full,
        gap: 8,
    },
    profileAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    profileEmoji: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileEmojiText: {
        fontSize: 14,
    },
    profileName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.purple,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.purple,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
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
        backgroundColor: colors.black, // Parent uses black for active tab
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
        paddingBottom: 80, // Space for FAB
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
    imageContainer: {
        position: 'relative',
    },
    expiryRing: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    archiveLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[6],
        gap: 8,
        opacity: 0.8
    },
    archiveLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.purple
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
        marginTop: -50,
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
});
