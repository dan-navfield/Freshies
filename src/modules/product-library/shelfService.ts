import { supabase } from '../../../lib/supabase';
import { ShelfItem, CreateShelfItemDTO } from '../../../types/shelf';

export const shelfService = {
    /**
     * Get all shelf items for a specific profile (e.g. a child) or general user items
     */
    async getShelfItems(userId: string, profileId?: string) {
        let query = supabase
            .from('shelf_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileId) {
            // If profileId is provided, get items for that profile regardless of who added them (parent or child)
            query = query.eq('profile_id', profileId);
        } else {
            // Otherwise get items owned by the user
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as ShelfItem[];
    },

    /**
     * Add a new item to the shelf
     */
    async addShelfItem(item: CreateShelfItemDTO) {
        const { data, error } = await supabase
            .from('shelf_items')
            .insert([item])
            .select()
            .single();

        if (error) throw error;
        return data as ShelfItem;
    },

    /**
     * Update an existing shelf item
     */
    async updateShelfItem(id: string, updates: Partial<ShelfItem>) {
        const { data, error } = await supabase
            .from('shelf_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ShelfItem;
    },

    /**
     * Delete a shelf item
     */
    async deleteShelfItem(id: string) {
        const { error } = await supabase
            .from('shelf_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Calculate expiry status
     */
    getExpiryStatus(item: ShelfItem): 'expired' | 'expiring_soon' | 'ok' {
        const today = new Date();
        let expiryDate: Date | null = null;

        // 1. Check Hard Expiry
        if (item.expiry_date) {
            expiryDate = new Date(item.expiry_date);
        }

        // 2. Check PAO (if opened)
        if (item.opened_at && item.pao_months) {
            const openedDate = new Date(item.opened_at);
            const paoExpiry = new Date(openedDate.setMonth(openedDate.getMonth() + item.pao_months));

            // Use the earlier of the two dates if both exist
            if (expiryDate) {
                expiryDate = paoExpiry < expiryDate ? paoExpiry : expiryDate;
            } else {
                expiryDate = paoExpiry;
            }
        }

        if (!expiryDate) return 'ok';

        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (daysDiff < 0) return 'expired';
        if (daysDiff <= 30) return 'expiring_soon'; // Warn if within 30 days
        return 'ok';
    }
};
