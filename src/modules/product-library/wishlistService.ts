/**
 * Wishlist Service
 * Handles wishlist CRUD, approval workflow, and group management
 */

import { supabase } from '../../../lib/supabase';
import {
    WishlistItem,
    WishlistGroup,
    WishlistStats,
    WishlistStatus,
    CreateWishlistItemDTO,
    CreateWishlistGroupDTO,
    ApprovalRules,
} from '../../../types/wishlist';

// ============================================
// WISHLIST ITEMS
// ============================================

/**
 * Get all wishlist items for a profile
 */
export async function getWishlistItems(
    userId: string,
    profileId?: string,
    status?: WishlistStatus
): Promise<WishlistItem[]> {
    try {
        let query = supabase
            .from('wishlist_items')
            .select(`
        *,
        wishlist_item_groups (
          wishlist_group_id,
          wishlist_groups (
            id, name, emoji, color
          )
        )
      `)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (profileId) {
            query = query.eq('profile_id', profileId);
        } else {
            query = query.eq('user_id', userId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform joined data
        return (data || []).map(item => ({
            ...item,
            groups: item.wishlist_item_groups?.map((ig: any) => ig.wishlist_groups) || [],
        }));
    } catch (error) {
        console.error('Error fetching wishlist items:', error);
        return [];
    }
}

/**
 * Get a single wishlist item by ID
 */
export async function getWishlistItem(id: string): Promise<WishlistItem | null> {
    try {
        const { data, error } = await supabase
            .from('wishlist_items')
            .select(`
        *,
        wishlist_item_groups (
          wishlist_group_id,
          wishlist_groups (
            id, name, emoji, color
          )
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            ...data,
            groups: data.wishlist_item_groups?.map((ig: any) => ig.wishlist_groups) || [],
        };
    } catch (error) {
        console.error('Error fetching wishlist item:', error);
        return null;
    }
}

/**
 * Check if product is already in wishlist
 */
export async function isInWishlist(
    profileId: string,
    productBarcode?: string,
    productName?: string
): Promise<WishlistItem | null> {
    try {
        let query = supabase
            .from('wishlist_items')
            .select('*')
            .eq('profile_id', profileId)
            .neq('status', 'on_shelf'); // Don't count converted items

        if (productBarcode) {
            query = query.eq('product_barcode', productBarcode);
        } else if (productName) {
            query = query.eq('product_name', productName);
        } else {
            return null;
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return null;
    }
}

/**
 * Add a product to the wishlist
 * Prevents duplicates by checking if product already exists
 */
export async function addToWishlist(
    item: CreateWishlistItemDTO
): Promise<WishlistItem | null> {
    try {
        // Check if already in wishlist to prevent duplicates
        const existing = await isInWishlist(
            item.profile_id,
            item.product_barcode,
            item.product_name
        );

        if (existing) {
            console.log('Product already in wishlist, returning existing item');
            return existing;
        }

        const { data, error } = await supabase
            .from('wishlist_items')
            .insert({
                ...item,
                status: 'saved',
                priority: item.priority || 0,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return null;
    }
}

/**
 * Remove a product from the wishlist
 */
export async function removeFromWishlist(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return false;
    }
}

/**
 * Update wishlist item priority
 */
export async function updateWishlistPriority(
    id: string,
    priority: number
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({ priority })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error updating priority:', error);
        return false;
    }
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

/**
 * Request approval from parent (child action)
 */
export async function requestApproval(
    id: string,
    childNote?: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({
                status: 'awaiting_approval',
                child_note: childNote,
                requested_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;

        // TODO: Trigger parent notification
        // await sendParentNotification(...)

        return true;
    } catch (error) {
        console.error('Error requesting approval:', error);
        return false;
    }
}

/**
 * Approve a wishlist item (parent action)
 */
export async function approveWishlistItem(
    id: string,
    reviewerId: string,
    parentNote?: string,
    rules?: ApprovalRules
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({
                status: 'approved',
                parent_note: parentNote,
                approval_rules: rules,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId,
            })
            .eq('id', id);

        if (error) throw error;

        // TODO: Notify child of approval

        return true;
    } catch (error) {
        console.error('Error approving wishlist item:', error);
        return false;
    }
}

/**
 * Decline a wishlist item (parent action)
 */
export async function declineWishlistItem(
    id: string,
    reviewerId: string,
    parentNote?: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({
                status: 'not_approved',
                parent_note: parentNote,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewerId,
            })
            .eq('id', id);

        if (error) throw error;

        // TODO: Notify child of decline

        return true;
    } catch (error) {
        console.error('Error declining wishlist item:', error);
        return false;
    }
}

/**
 * Get pending approvals for a parent
 */
export async function getPendingWishlistApprovals(
    parentId: string
): Promise<WishlistItem[]> {
    try {
        // Get all managed children IDs
        const { data: children, error: childError } = await supabase
            .from('managed_children')
            .select('id')
            .eq('parent_id', parentId);

        if (childError) throw childError;

        const childIds = (children || []).map(c => c.id);
        if (childIds.length === 0) return [];

        const { data, error } = await supabase
            .from('wishlist_items')
            .select('*')
            .in('profile_id', childIds)
            .eq('status', 'awaiting_approval')
            .order('requested_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
    }
}

// ============================================
// MOVE TO SHELF
// ============================================

/**
 * Move a wishlist item to the shelf (convert to owned product)
 */
export async function moveToShelf(
    wishlistItemId: string,
    shelfItemId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_items')
            .update({
                status: 'on_shelf',
                shelf_item_id: shelfItemId,
                moved_to_shelf_at: new Date().toISOString(),
            })
            .eq('id', wishlistItemId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error moving to shelf:', error);
        return false;
    }
}

// ============================================
// STATS
// ============================================

/**
 * Get wishlist statistics for a profile
 */
export async function getWishlistStats(
    userId: string,
    profileId?: string
): Promise<WishlistStats> {
    try {
        let query = supabase
            .from('wishlist_items')
            .select('status');

        if (profileId) {
            query = query.eq('profile_id', profileId);
        } else {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const stats: WishlistStats = {
            total: data?.length || 0,
            saved: 0,
            awaiting_approval: 0,
            approved: 0,
            not_approved: 0,
            on_shelf: 0,
        };

        (data || []).forEach(item => {
            if (item.status in stats) {
                stats[item.status as keyof Omit<WishlistStats, 'total'>]++;
            }
        });

        return stats;
    } catch (error) {
        console.error('Error fetching wishlist stats:', error);
        return {
            total: 0,
            saved: 0,
            awaiting_approval: 0,
            approved: 0,
            not_approved: 0,
            on_shelf: 0,
        };
    }
}

// ============================================
// GROUPS
// ============================================

/**
 * Get all groups for a profile
 */
export async function getWishlistGroups(profileId: string): Promise<WishlistGroup[]> {
    try {
        const { data, error } = await supabase
            .from('wishlist_groups')
            .select(`
        *,
        wishlist_item_groups (count)
      `)
            .eq('profile_id', profileId)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        return (data || []).map(group => ({
            ...group,
            item_count: group.wishlist_item_groups?.[0]?.count || 0,
        }));
    } catch (error) {
        console.error('Error fetching wishlist groups:', error);
        return [];
    }
}

/**
 * Create a new wishlist group
 */
export async function createWishlistGroup(
    group: CreateWishlistGroupDTO
): Promise<WishlistGroup | null> {
    try {
        const { data, error } = await supabase
            .from('wishlist_groups')
            .insert(group)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating wishlist group:', error);
        return null;
    }
}

/**
 * Delete a wishlist group
 */
export async function deleteWishlistGroup(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_groups')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting wishlist group:', error);
        return false;
    }
}

/**
 * Add item to a group
 */
export async function addItemToGroup(
    wishlistItemId: string,
    groupId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_item_groups')
            .insert({
                wishlist_item_id: wishlistItemId,
                wishlist_group_id: groupId,
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error adding item to group:', error);
        return false;
    }
}

/**
 * Remove item from a group
 */
export async function removeItemFromGroup(
    wishlistItemId: string,
    groupId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('wishlist_item_groups')
            .delete()
            .eq('wishlist_item_id', wishlistItemId)
            .eq('wishlist_group_id', groupId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error removing item from group:', error);
        return false;
    }
}

/**
 * Get items in a specific group
 */
export async function getGroupItems(groupId: string): Promise<WishlistItem[]> {
    try {
        const { data, error } = await supabase
            .from('wishlist_item_groups')
            .select(`
        wishlist_items (*)
      `)
            .eq('wishlist_group_id', groupId);

        if (error) throw error;

        return (data || []).map((ig: any) => ig.wishlist_items).filter(Boolean);
    } catch (error) {
        console.error('Error fetching group items:', error);
        return [];
    }
}

/**
 * Bulk request approval for all items in a group
 */
export async function requestGroupApproval(
    groupId: string,
    childNote?: string
): Promise<number> {
    try {
        // Get all saved items in the group
        const items = await getGroupItems(groupId);
        const savedItems = items.filter(item => item.status === 'saved');

        let successCount = 0;
        for (const item of savedItems) {
            const success = await requestApproval(item.id, childNote);
            if (success) successCount++;
        }

        return successCount;
    } catch (error) {
        console.error('Error requesting group approval:', error);
        return 0;
    }
}
