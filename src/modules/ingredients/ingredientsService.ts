import { supabase } from '../../lib/supabase';

export interface IngredientDetail {
    id: string; // db ID
    name: string; // match_value
    commonName?: string; // Not in DB, optional
    description: string; // Mapped from decision reason/recommendation
    function: string; // Mapped from reason
    safetyStatus: 'safe' | 'caution' | 'avoid'; // Mapped from rule_type ('ok', 'info' -> 'safe')
    safetyReason?: string;
    category: string[]; // Mapped from match_type being 'category' or inferred
    benefits: string[]; // Inferred from recommendation or empty
    watchOuts?: string[];
    goodToKnow?: string[];
    productsCount: number; // From product_count
    score: number; // isi_score
    mythBuster?: {
        myth: string;
        reality: string;
    };
}

const mapDatabaseToDetail = (item: any): IngredientDetail => {
    // Determine safety status based on child_safe flag and score
    let safetyStatus: 'safe' | 'caution' | 'avoid' = 'safe';

    // Logic: If explicitly not child safe, it's avoid. 
    // If it's safe but has high score (bad), caution? 
    // For now, trust the boolean.
    if (item.child_safe === false) {
        safetyStatus = item.isi_score && item.isi_score > 5 ? 'avoid' : 'caution';
    } else if (item.isi_score && item.isi_score > 3) {
        safetyStatus = 'caution';
    }

    // Parse array fields if they come as strings (unlikely in Supabase JS but good safety)
    const benefits = Array.isArray(item.ai_benefits) ? item.ai_benefits :
        (item.ai_benefits ? [item.ai_benefits] : []);

    return {
        id: item.id,
        name: item.common_name || item.inci_name || 'Unknown Ingredient',
        commonName: item.inci_name !== item.common_name ? item.inci_name : undefined,
        description: item.ai_child_friendly_summary || item.kid_friendly_summary || item.description || 'No description available.',
        function: item.ai_what_it_does || item.what_it_does || 'Used in skincare.',
        safetyStatus,
        safetyReason: item.ai_concerns || item.concerns,
        category: item.family ? [item.family] : [],
        benefits: benefits,
        watchOuts: safetyStatus !== 'safe' ? [item.ai_concerns || item.concerns] : [],
        goodToKnow: item.ai_fun_fact ? [item.ai_fun_fact] : [],
        productsCount: item.product_count || 0,
        score: item.isi_score || 0,
    };
};

export const getPopularIngredients = async (): Promise<IngredientDetail[]> => {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('child_safe', true)
        .order('popularity_tier', { ascending: true }) // Assuming 1 is most popular
        .limit(10);

    if (error) {
        console.error('Error fetching popular ingredients:', error);
        return [];
    }
    return data.map(mapDatabaseToDetail);
};

export const getIngredientsByFilter = async (filter: string): Promise<IngredientDetail[]> => {
    let query = supabase.from('ingredients').select('*');

    if (filter === 'caution') query = query.eq('child_safe', true).gt('isi_score', 3); // Example logic
    else if (filter === 'avoid') query = query.eq('child_safe', false);
    else if (filter === 'safe') query = query.eq('child_safe', true).lte('isi_score', 3);
    else if (filter === 'hydration') query = query.textSearch('ai_what_it_does', 'hydra', { config: 'english' });

    const { data, error } = await query.limit(20);

    if (error) {
        console.error('Error filtering ingredients:', error);
        return [];
    }
    return data.map(mapDatabaseToDetail);
};

export const searchIngredients = async (query: string): Promise<IngredientDetail[]> => {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .or(`common_name.ilike.%${query}%,inci_name.ilike.%${query}%`)
        .limit(20);

    if (error) {
        console.error('Error searching ingredients:', error);
        return [];
    }
    return data.map(mapDatabaseToDetail);
};

export const getIngredientById = async (id: string): Promise<IngredientDetail | undefined> => {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return mapDatabaseToDetail(data);
};

/**
 * Result of matching an OCR-extracted ingredient against the database
 */
export interface IngredientMatchResult {
    rawName: string; // The OCR-extracted name
    matched: boolean;
    matchedIngredient?: IngredientDetail;
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Match multiple OCR-extracted ingredients against the database
 * Returns match results for each ingredient
 */
export const matchIngredientsToDatabase = async (
    ocrIngredients: string[]
): Promise<IngredientMatchResult[]> => {
    const results: IngredientMatchResult[] = [];

    for (const rawName of ocrIngredients) {
        try {
            // Clean up the ingredient name
            const cleanName = rawName
                .replace(/^\d+\s*[-–]\s*/g, '') // Remove leading numbers/codes
                .replace(/\([^)]*\)/g, '') // Remove parentheses content
                .replace(/\d+%?/g, '') // Remove percentages
                .replace(/[•·]/g, '') // Remove bullet points
                .trim();

            if (cleanName.length < 3) {
                // Skip very short strings
                results.push({
                    rawName,
                    matched: false,
                    confidence: 'low',
                });
                continue;
            }

            // Search for exact or close match
            const { data, error } = await supabase
                .from('ingredients')
                .select('*')
                .or(`common_name.ilike.${cleanName},inci_name.ilike.${cleanName}`)
                .limit(1);

            if (error) {
                console.warn(`DB error matching "${cleanName}":`, error.message);
            }

            if (!data || data.length === 0) {
                // Try fuzzy search
                const { data: fuzzyData, error: fuzzyError } = await supabase
                    .from('ingredients')
                    .select('*')
                    .or(`common_name.ilike.%${cleanName}%,inci_name.ilike.%${cleanName}%`)
                    .limit(1);

                if (fuzzyError) {
                    console.warn(`Fuzzy search error for "${cleanName}":`, fuzzyError.message);
                }

                if (fuzzyData && fuzzyData.length > 0) {
                    results.push({
                        rawName,
                        matched: true,
                        matchedIngredient: mapDatabaseToDetail(fuzzyData[0]),
                        confidence: 'medium', // Fuzzy match
                    });
                } else {
                    results.push({
                        rawName,
                        matched: false,
                        confidence: 'low',
                    });
                }
            } else {
                results.push({
                    rawName,
                    matched: true,
                    matchedIngredient: mapDatabaseToDetail(data[0]),
                    confidence: 'high', // Exact match
                });
            }
        } catch (err) {
            // If any error occurs for this ingredient, add it as unmatched but don't crash
            console.error(`Error matching ingredient "${rawName}":`, err);
            results.push({
                rawName,
                matched: false,
                confidence: 'low',
            });
        }
    }

    return results;
};
