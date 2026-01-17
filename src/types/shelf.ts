export type ShelfStatus = 'active' | 'archived' | 'finished' | 'running_low';

export interface ShelfItem {
    id: string;
    user_id: string;
    profile_id?: string; // If assigned to a specific child profile

    // Product Details
    product_barcode?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    product_category?: string;

    // Lifecycle
    status: ShelfStatus;
    opened_at?: string | null; // ISO Date string
    expiry_date?: string | null; // ISO Date string
    pao_months?: number; // Period After Opening

    // Metadata
    location?: string;
    quantity: number;
    notes?: string;
    is_approved: boolean;
    is_low?: boolean; // Restock flag

    created_at: string;
    updated_at: string;
}

export interface CreateShelfItemDTO {
    user_id: string;
    profile_id?: string;
    product_barcode?: string;
    product_name: string;
    product_brand?: string;
    product_image_url?: string;
    product_category?: string;

    opened_at?: string | null;
    expiry_date?: string | null;
    pao_months?: number;

    location?: string;
    quantity?: number;
    notes?: string;
    is_approved?: boolean;
}
