import { supabase } from '../lib/supabase';
import { ShelfItem } from '../types/shelf';

export interface SearchResult {
    id: string;
    type: 'product' | 'shelf' | 'routine' | 'learn' | 'ingredient';
    title: string;
    subtitle?: string;
    image_url?: string;
    route?: string; // Where to navigate
    score?: number; // Relevance score
    metadata?: any;
}

export interface SearchGroup {
    type: 'product' | 'shelf' | 'routine' | 'learn' | 'ingredient';
    title: string;
    items: SearchResult[];
}

export const searchService = {
    /**
     * Perform a global search across all domains
     */
    async searchGlobal(query: string, userId: string, profileId?: string): Promise<SearchGroup[]> {
        if (!query || query.length < 2) return [];

        const normalizedQuery = query.toLowerCase().trim();
        const promises: Promise<SearchGroup | null>[] = [];

        // 1. Shelf Items (My Collection)
        if (userId) {
            promises.push(this.searchShelf(query, userId));
        }

        // 2. Custom Routines (My Routines)
        if (profileId) {
            promises.push(this.searchRoutines(query, profileId));
        }

        // 3. Learn Articles (Education)
        promises.push(this.searchLearn(query));

        // 4. Ingredients (Glossary)
        promises.push(this.searchIngredients(query));

        // 5. Global Products (Discovery)
        promises.push(this.searchGlobalProducts(query));

        const results = await Promise.allSettled(promises);

        return results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => (r as PromiseFulfilledResult<SearchGroup>).value);
    },

    async searchShelf(query: string, userId: string): Promise<SearchGroup | null> {
        try {
            const { data: shelfItems } = await supabase
                .from('shelf_items')
                .select('*')
                .eq('user_id', userId)
                .ilike('product_name', `%${query}%`)
                .limit(3);

            if (shelfItems && shelfItems.length > 0) {
                return {
                    type: 'shelf',
                    title: 'My Shelf',
                    items: shelfItems.map((item: ShelfItem) => ({
                        id: item.id,
                        type: 'shelf',
                        title: item.product_name,
                        subtitle: item.product_brand,
                        image_url: item.product_image_url,
                        route: `/(shelf)/${item.id}`,
                    })),
                };
            }
        } catch (e) {
            console.error('Error searching shelf:', e);
        }
        return null;
    },

    async searchRoutines(query: string, profileId: string): Promise<SearchGroup | null> {
        try {
            // Note: querying 'custom_routines' table
            const { data: routines } = await supabase
                .from('custom_routines')
                .select('id, name, segment, total_duration')
                .eq('child_profile_id', profileId)
                .ilike('name', `%${query}%`)
                .limit(3);

            if (routines && routines.length > 0) {
                return {
                    type: 'routine',
                    title: 'My Routines',
                    items: routines.map((r: any) => ({
                        id: r.id,
                        type: 'routine',
                        title: r.name,
                        subtitle: `${r.segment ? r.segment.charAt(0).toUpperCase() + r.segment.slice(1) : 'Routine'} · ${Math.floor(r.total_duration / 60)} min`,
                        route: `/routine`, // Navigates to routine tab
                    }))
                };
            }
        } catch (e) {
            console.error('Error searching routines:', e);
        }
        return null;
    },

    async searchLearn(query: string): Promise<SearchGroup | null> {
        try {
            const { data: articles } = await supabase
                .from('learn_articles')
                .select('id, title, category, reading_time_minutes')
                .ilike('title', `%${query}%`)
                .limit(2);

            if (articles && articles.length > 0) {
                return {
                    type: 'learn',
                    title: 'Learn',
                    items: articles.map((a: any) => ({
                        id: a.id,
                        type: 'learn',
                        title: a.title,
                        subtitle: `${a.category} · ${a.reading_time_minutes} min read`,
                        route: `/(child)/learn/${a.id}`,
                    }))
                };
            }
        } catch (e) {
            console.error('Error searching learn content:', e);
        }
        return null;
    },

    async searchIngredients(query: string): Promise<SearchGroup | null> {
        // Mock Ingredient Database (Glossary)
        // TODO: Replace with real 'ingredients' table query
        const mockIngredients = [
            { id: 'ing1', name: 'Retinol', description: 'Vitamin A derivative for anti-aging' },
            { id: 'ing2', name: 'Vitamin C', description: 'Brightening antioxidant' },
            { id: 'ing3', name: 'Hyaluronic Acid', description: 'Hydrating molecule' },
            { id: 'ing4', name: 'Salicylic Acid', description: 'BHA for acne' },
            { id: 'ing5', name: 'Niacinamide', description: 'Vitamin B3 for pores and texture' },
            { id: 'ing6', name: 'Ceramides', description: 'Restores skin barrier' },
        ];

        const matches = mockIngredients.filter(i =>
            i.name.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length > 0) {
            return {
                type: 'ingredient',
                title: 'Ingredients',
                items: matches.map(i => ({
                    id: i.id,
                    type: 'ingredient',
                    title: i.name,
                    subtitle: i.description,
                    route: `/(child)/learn/ingredients/${i.id}`, // Assuming this route exists or will exist
                }))
            };
        }
        return null;
    },

    async searchGlobalProducts(query: string): Promise<SearchGroup | null> {
        // Mock Global Products
        // TODO: Connect to OpenBeautyFacts API or internal product DB
        const normalizedQuery = query.toLowerCase();
        const mockProducts: SearchResult[] = [];

        if (normalizedQuery.includes('cer') || normalizedQuery.includes('clean')) {
            mockProducts.push({
                id: 'p1',
                type: 'product',
                title: 'CeraVe Hydrating Cleanser',
                subtitle: 'CeraVe',
                route: '/(shelf)/add?product=p1',
                image_url: 'https://images.unsplash.com/photo-1556228720-19de77156968?auto=format&fit=crop&q=80&w=200&h=200',
            });
        }
        if (normalizedQuery.includes('sun') || normalizedQuery.includes('goop')) {
            mockProducts.push({
                id: 'p2',
                type: 'product',
                title: 'Supergoop! Unseen Sunscreen',
                subtitle: 'Supergoop!',
                route: '/(shelf)/add?product=p2',
                image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=200&h=200',
            });
        }
        if (normalizedQuery.includes('ord') || normalizedQuery.includes('nia')) {
            mockProducts.push({
                id: 'p3',
                type: 'product',
                title: 'The Ordinary Niacinamide 10%',
                subtitle: 'The Ordinary',
                route: '/(shelf)/add?product=p3',
                image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200&h=200',
            });
        }
        if (normalizedQuery.includes('neu') || normalizedQuery.includes('hyd')) {
            mockProducts.push({
                id: 'p4',
                type: 'product',
                title: 'Neutrogena Hydro Boost',
                subtitle: 'Neutrogena',
                route: '/(shelf)/add?product=p4',
                image_url: 'https://images.unsplash.com/photo-1617220828111-eb241eb6eb2c?auto=format&fit=crop&q=80&w=200&h=200',
            });
        }

        if (mockProducts.length > 0) {
            return {
                type: 'product',
                title: 'New Products',
                items: mockProducts,
            };
        }
        return null;
    },

    /**
     * Get recent searches (Mocked for now, usually stored in AsyncStorage or DB)
     */
    async getRecentSearches(): Promise<string[]> {
        return ['Sunscreen', 'Moisturizer', 'Vitamin C', 'CeraVe'];
    }
};
