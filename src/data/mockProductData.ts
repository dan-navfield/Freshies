/**
 * Mock Product Data for Product Detail Page Variants
 * Comprehensive sample data showcasing all available product fields
 */

import { colors } from '../theme/tokens';

// ============================================
// TYPES
// ============================================

export interface MockIngredient {
    id: string;
    name: string;
    inci_name: string;
    position: number;
    isi_score: number;
    what_it_does: string;
    is_flagged: boolean;
    flag_reason?: string;
    safety_level: 'safe' | 'caution' | 'avoid';
}

export interface MockProductFlag {
    type: 'fragrance' | 'allergen' | 'harsh' | 'age' | 'sensitive' | 'hormonal';
    severity: 'info' | 'caution' | 'warning' | 'danger';
    title: string;
    description: string;
    icon: string;
}

export interface MockProduct {
    // Core Info
    id: string;
    name: string;
    brand: string;
    category: string;
    barcode: string;
    image_url: string;
    description: string;
    form_factor: string;
    target_age_band: string;
    leave_on: boolean;
    price: string;
    size: string;

    // Safety Scoring (0-100, higher = safer)
    safety_score: number;
    safety_tier: 'A' | 'B' | 'C' | 'D' | 'E';

    // AI Generated Content
    ai_summary: string;
    kid_friendly_message: string;
    parent_message: string;

    // Flags & Concerns
    flags: MockProductFlag[];
    benefits: string[];
    concerns: string[];

    // Ingredients
    ingredients: MockIngredient[];
    ingredients_count: number;

    // Profile Match
    profile_match: 'great_match' | 'ok_with_care' | 'not_recommended';
    match_reasons: string[];

    // Status
    in_routine: boolean;
    on_shelf: boolean;
    is_favorite: boolean;
    usage_count: number;
    last_used?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getScoreColor = (score: number): string => {
    if (score >= 75) return colors.mint;
    if (score >= 50) return '#FBBF24';
    if (score >= 25) return '#F59E0B';
    return '#EF4444';
};

export const getTierColor = (tier: 'A' | 'B' | 'C' | 'D' | 'E'): string => {
    switch (tier) {
        case 'A': return colors.mint;
        case 'B': return '#4ADE80';
        case 'C': return '#FBBF24';
        case 'D': return '#F59E0B';
        case 'E': return '#EF4444';
    }
};

export const getSeverityColor = (severity: 'info' | 'caution' | 'warning' | 'danger'): string => {
    switch (severity) {
        case 'info': return '#3B82F6';
        case 'caution': return '#FBBF24';
        case 'warning': return '#F59E0B';
        case 'danger': return '#EF4444';
    }
};

// ============================================
// SAMPLE PRODUCTS
// ============================================

export const sampleProductExcellent: MockProduct = {
    id: 'prod-001',
    name: 'Gentle Foaming Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    barcode: '3606000537828',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800',
    description: 'A gentle, foaming cleanser that effectively removes dirt and oil without disrupting the skin barrier.',
    form_factor: 'Foam',
    target_age_band: '3+',
    leave_on: false,
    price: '$14.99',
    size: '473ml',

    safety_score: 92,
    safety_tier: 'A',

    ai_summary: 'This CeraVe cleanser is an excellent choice for children\'s skin. It contains three essential ceramides that help maintain the skin\'s natural barrier, along with niacinamide to calm and soothe. The fragrance-free, non-comedogenic formula is developed with dermatologists and is suitable for sensitive skin.',
    kid_friendly_message: '🌟 This is a super gentle face wash! It cleans your face without any yucky stinging. The bubbles are fun and it rinses off easily!',
    parent_message: 'CeraVe Foaming Cleanser scored 92/100 in our safety analysis. It contains no fragrance, no harsh sulfates, and includes skin-barrier supporting ceramides. Suitable for daily use on children 3 years and older.',

    flags: [
        {
            type: 'sensitive',
            severity: 'info',
            title: 'Gentle Formula',
            description: 'Suitable for sensitive and eczema-prone skin',
            icon: '✨',
        },
    ],

    benefits: [
        'Fragrance-free',
        'Contains 3 essential ceramides',
        'Non-comedogenic',
        'Developed with dermatologists',
        'Supports skin barrier',
    ],
    concerns: [],

    ingredients: [
        { id: 'ing-1', name: 'Ceramide NP', inci_name: 'CERAMIDE NP', position: 1, isi_score: 95, what_it_does: 'Protects skin barrier', is_flagged: false, safety_level: 'safe' },
        { id: 'ing-2', name: 'Ceramide AP', inci_name: 'CERAMIDE AP', position: 2, isi_score: 95, what_it_does: 'Locks in moisture', is_flagged: false, safety_level: 'safe' },
        { id: 'ing-3', name: 'Ceramide EOP', inci_name: 'CERAMIDE EOP', position: 3, isi_score: 95, what_it_does: 'Repairs skin', is_flagged: false, safety_level: 'safe' },
        { id: 'ing-4', name: 'Niacinamide', inci_name: 'NIACINAMIDE', position: 4, isi_score: 90, what_it_does: 'Calms and soothes', is_flagged: false, safety_level: 'safe' },
        { id: 'ing-5', name: 'Hyaluronic Acid', inci_name: 'SODIUM HYALURONATE', position: 5, isi_score: 92, what_it_does: 'Hydrates deeply', is_flagged: false, safety_level: 'safe' },
    ],
    ingredients_count: 24,

    profile_match: 'great_match',
    match_reasons: ['Age appropriate', 'No known allergens', 'Gentle for sensitive skin'],

    in_routine: true,
    on_shelf: true,
    is_favorite: true,
    usage_count: 47,
    last_used: '2024-12-23',
};

export const sampleProductCaution: MockProduct = {
    id: 'prod-002',
    name: 'Vitamin C Brightening Serum',
    brand: 'Paula\'s Choice',
    category: 'Serum',
    barcode: '0655439077101',
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=800',
    description: 'A potent vitamin C serum with 15% L-ascorbic acid for brightening and anti-aging benefits.',
    form_factor: 'Serum',
    target_age_band: '12+',
    leave_on: true,
    price: '$49.00',
    size: '15ml',

    safety_score: 54,
    safety_tier: 'C',

    ai_summary: 'This serum contains 15% L-ascorbic acid, a powerful active that requires careful introduction for young skin. While effective for brightening, the acidic pH (2.8) may cause sensitivity. We recommend patch testing and using only 2-3 times per week initially.',
    kid_friendly_message: '⚠️ This is a special serum for older kids. It\'s very strong and your parent should help you use it carefully!',
    parent_message: 'Paula\'s Choice C15 Booster scored 54/100 for children. While generally safe, it contains potent actives (15% ascorbic acid at pH 2.8) that may be too strong for young or sensitive skin. Recommended for teens 12+ with parent supervision.',

    flags: [
        {
            type: 'harsh',
            severity: 'caution',
            title: 'Strong Active',
            description: '15% L-ascorbic acid may cause tingling or sensitivity',
            icon: '⚡',
        },
        {
            type: 'age',
            severity: 'warning',
            title: 'Age Recommendation',
            description: 'Best suited for ages 12 and up',
            icon: '🔞',
        },
    ],

    benefits: [
        'Brightens skin',
        'Antioxidant protection',
        'Reduces dark spots',
    ],
    concerns: [
        'May cause tingling',
        'Requires sun protection',
        'Not for daily use initially',
    ],

    ingredients: [
        { id: 'ing-1', name: 'Vitamin C', inci_name: 'ASCORBIC ACID', position: 1, isi_score: 60, what_it_does: 'Brightens skin', is_flagged: true, flag_reason: 'May irritate sensitive skin', safety_level: 'caution' },
        { id: 'ing-2', name: 'Vitamin E', inci_name: 'TOCOPHEROL', position: 2, isi_score: 88, what_it_does: 'Protects from damage', is_flagged: false, safety_level: 'safe' },
        { id: 'ing-3', name: 'Ferulic Acid', inci_name: 'FERULIC ACID', position: 3, isi_score: 75, what_it_does: 'Boosts vitamin C', is_flagged: false, safety_level: 'safe' },
    ],
    ingredients_count: 12,

    profile_match: 'ok_with_care',
    match_reasons: ['Contains strong actives', 'Suitable with supervision'],

    in_routine: false,
    on_shelf: false,
    is_favorite: false,
    usage_count: 0,
};

export const sampleProductAvoid: MockProduct = {
    id: 'prod-003',
    name: 'Retinol Night Cream 1%',
    brand: 'RoC',
    category: 'Treatment',
    barcode: '0381370047391',
    image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=800',
    description: 'A powerful retinol night cream with 1% retinol for anti-aging benefits.',
    form_factor: 'Cream',
    target_age_band: '18+',
    leave_on: true,
    price: '$32.99',
    size: '30ml',

    safety_score: 18,
    safety_tier: 'E',

    ai_summary: 'This product contains 1% retinol, which is NOT recommended for children or teens under 18. Retinol can cause significant skin irritation, peeling, and sun sensitivity. It may also affect developing skin in ways not fully studied in younger populations.',
    kid_friendly_message: '🚫 Sorry, this product is NOT for kids! It has special ingredients that are only for grown-ups.',
    parent_message: 'RoC Retinol Night Cream scored just 18/100 for children. Retinol is contraindicated for children and adolescents due to potential for irritation, photosensitivity, and unknown effects on developing skin. This product should not be used by anyone under 18.',

    flags: [
        {
            type: 'age',
            severity: 'danger',
            title: 'Adults Only',
            description: 'Contains retinol - not suitable for under 18',
            icon: '🚫',
        },
        {
            type: 'harsh',
            severity: 'danger',
            title: 'Strong Irritant',
            description: 'Can cause peeling, redness, and sensitivity',
            icon: '⚠️',
        },
        {
            type: 'hormonal',
            severity: 'warning',
            title: 'Hormonal Concern',
            description: 'Vitamin A derivatives may affect developing skin',
            icon: '⚡',
        },
    ],

    benefits: [
        'Reduces fine lines (adults)',
        'Improves skin texture (adults)',
    ],
    concerns: [
        'NOT for children',
        'Causes sun sensitivity',
        'Can cause irritation',
        'May affect developing skin',
    ],

    ingredients: [
        { id: 'ing-1', name: 'Retinol', inci_name: 'RETINOL', position: 1, isi_score: 15, what_it_does: 'Anti-aging (adults only)', is_flagged: true, flag_reason: 'Not recommended for children', safety_level: 'avoid' },
    ],
    ingredients_count: 18,

    profile_match: 'not_recommended',
    match_reasons: ['Contains retinol', 'Age-inappropriate', 'May cause harm'],

    in_routine: false,
    on_shelf: false,
    is_favorite: false,
    usage_count: 0,
};

// Export all sample products
export const allSampleProducts = [
    sampleProductExcellent,
    sampleProductCaution,
    sampleProductAvoid,
];
