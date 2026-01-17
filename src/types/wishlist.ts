/**
 * Wishlist Types
 * Types for wishlist items, groups, and approval workflow
 */

export type WishlistStatus =
    | 'saved'              // Just saved/liked
    | 'awaiting_approval'  // Child requested parent review
    | 'approved'           // Parent approved
    | 'not_approved'       // Parent declined
    | 'on_shelf';          // Converted to shelf item

export interface WishlistItem {
    id: string;

    // Ownership
    profile_id: string;
    user_id: string;

    // Product Details
    product_id?: string;
    product_barcode?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    product_category?: string;

    // Status & Approval
    status: WishlistStatus;
    child_note?: string;
    parent_note?: string;
    approval_rules?: ApprovalRules;

    // Approval Timestamps
    requested_at?: string;
    reviewed_at?: string;
    reviewed_by?: string;

    // Conversion to Shelf
    shelf_item_id?: string;
    moved_to_shelf_at?: string;

    // Safety Data
    safety_score?: number;      // Risk score 0-100
    safety_rating?: string;     // SUPER_GENTLE, GENTLE, etc.

    // Priority
    priority: number;

    // Timestamps
    created_at: string;
    updated_at: string;

    // Joined data (from queries)
    groups?: WishlistGroup[];
}

export interface ApprovalRules {
    usage_frequency?: string;   // "max 2x/week"
    time_of_day?: string;       // "nights only"
    must_use_with?: string;     // "only with moisturiser"
    expires_at?: string;        // Approval expiry date
    custom_note?: string;
}

export interface WishlistGroup {
    id: string;
    profile_id: string;
    user_id: string;

    name: string;
    emoji?: string;
    description?: string;
    color?: string;

    sort_order: number;
    shared_with_parent: boolean;

    created_at: string;
    updated_at: string;

    // Joined data
    item_count?: number;
    items?: WishlistItem[];
}

export interface WishlistItemGroup {
    id: string;
    wishlist_item_id: string;
    wishlist_group_id: string;
    added_at: string;
}

export interface CreateWishlistItemDTO {
    profile_id: string;
    user_id: string;

    product_id?: string;
    product_barcode?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    product_category?: string;

    child_note?: string;
    safety_score?: number;
    safety_rating?: string;
    priority?: number;
}

export interface CreateWishlistGroupDTO {
    profile_id: string;
    user_id: string;

    name: string;
    emoji?: string;
    description?: string;
    color?: string;
}

export interface WishlistStats {
    total: number;
    saved: number;
    awaiting_approval: number;
    approved: number;
    not_approved: number;
    on_shelf: number;
}

// Preset reasons for children requesting approval
export const APPROVAL_REQUEST_REASONS = [
    { id: 'friends', label: 'My friends use it', emoji: '👯' },
    { id: 'acne', label: 'For pimples/acne', emoji: '✨' },
    { id: 'dry_skin', label: 'For dry skin', emoji: '💧' },
    { id: 'routine', label: 'For my routine', emoji: '📋' },
    { id: 'smells_good', label: 'It smells good', emoji: '🌸' },
    { id: 'saw_ad', label: 'Saw it advertised', emoji: '📱' },
    { id: 'sunscreen', label: 'Need sun protection', emoji: '☀️' },
    { id: 'other', label: 'Other reason', emoji: '💭' },
] as const;

// Preset reasons for parents declining
export const DECLINE_REASONS = [
    { id: 'too_strong', label: 'Too strong for your skin', emoji: '⚠️' },
    { id: 'already_have', label: 'You already have something similar', emoji: '📦' },
    { id: 'too_expensive', label: 'Too expensive right now', emoji: '💰' },
    { id: 'not_needed', label: "Don't need this yet", emoji: '⏳' },
    { id: 'ingredients', label: 'Concerning ingredients', emoji: '🔬' },
    { id: 'age', label: 'Better suited for older teens', emoji: '📅' },
    { id: 'alternative', label: "Let's find an alternative", emoji: '🔄' },
    { id: 'other', label: 'Other reason', emoji: '💭' },
] as const;
