import { supabase } from '../lib/supabase';

export interface UsageStats {
    totalCount: number;
    currentStreak: number;
    lastUsedAt: string | null;
    usedToday: boolean;
}

export const usageService = {
    /**
     * Track usage of an item for a profile
     */
    async trackUsage(shelfItemId: string, profileId: string) {
        const { data, error } = await supabase
            .from('product_usage')
            .insert({
                shelf_item_id: shelfItemId,
                profile_id: profileId,
                used_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get usage stats for an item
     */
    async getUsageStats(shelfItemId: string, profileId: string): Promise<UsageStats> {
        // 1. Get total count
        const { count, error: countError } = await supabase
            .from('product_usage')
            .select('*', { count: 'exact', head: true })
            .eq('shelf_item_id', shelfItemId)
            .eq('profile_id', profileId);

        if (countError) throw countError;

        // 2. Get recent usages to calculate streak
        const { data: usageHistory, error: listError } = await supabase
            .from('product_usage')
            .select('used_at')
            .eq('shelf_item_id', shelfItemId)
            .eq('profile_id', profileId)
            .order('used_at', { ascending: false })
            .limit(30);

        if (listError) throw listError;

        if (!usageHistory || usageHistory.length === 0) {
            return {
                totalCount: 0,
                currentStreak: 0,
                lastUsedAt: null,
                usedToday: false
            };
        }

        const lastUsed = new Date(usageHistory[0].used_at);
        const today = new Date();
        const isUsedToday = lastUsed.toDateString() === today.toDateString();

        // Calculate Streak
        let streak = 0;
        if (usageHistory.length > 0) {
            // Normalize dates to midnight for comparison
            const uniqueDates = Array.from(new Set(
                usageHistory.map(u => new Date(u.used_at).toDateString())
            )).map(d => new Date(d));

            // Check if sequence is unbroken from today or yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const lastDate = uniqueDates[0];
            const isToday = lastDate.toDateString() === today.toDateString();
            const isYesterday = lastDate.toDateString() === yesterday.toDateString();

            if (isToday || isYesterday) {
                streak = 1;
                let currentDate = lastDate;

                for (let i = 1; i < uniqueDates.length; i++) {
                    const prevDate = uniqueDates[i];
                    const expectedPrev = new Date(currentDate);
                    expectedPrev.setDate(expectedPrev.getDate() - 1);

                    if (prevDate.toDateString() === expectedPrev.toDateString()) {
                        streak++;
                        currentDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }

        return {
            totalCount: count || 0,
            currentStreak: streak,
            lastUsedAt: usageHistory[0].used_at,
            usedToday: isUsedToday
        };
    }
};
