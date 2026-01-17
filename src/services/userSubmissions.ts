/**
 * User Submissions Service
 * Handles creating and managing user-submitted products
 */

import { supabase } from '../lib/supabase';

export interface UserSubmission {
    id: string;
    user_id: string;
    front_image_url: string;
    ingredients_image_url: string;
    product_name: string | null;
    brand_name: string | null;
    ingredients_text: string;
    ocr_raw_text: string | null;
    barcode: string | null;
    category: string | null;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    promoted_product_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateSubmissionParams {
    front_image_url: string;
    ingredients_image_url: string;
    product_name?: string;
    brand_name?: string;
    ingredients_text: string;
    ocr_raw_text?: string;
    barcode?: string;
    category?: string;
    profile_id?: string; // For child accounts, to add to their shelf
}

/**
 * Create a new user-submitted product
 * Also adds the product to the user's shelf immediately (with pending approval status)
 */
export async function createSubmission(params: CreateSubmissionParams): Promise<UserSubmission> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Must be logged in to submit products');
    }

    // Auto-detect child profile if not provided
    // Child accounts have a record in child_profiles where user_id matches auth user
    let profileId = params.profile_id;
    if (!profileId) {
        const { data: childProfile } = await supabase
            .from('child_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (childProfile) {
            profileId = childProfile.id;
            console.log('📱 Auto-detected child profile:', profileId);
        }
    }

    // 1. Create the submission record for admin review
    const { data, error } = await supabase
        .from('user_submitted_products')
        .insert({
            user_id: user.id,
            front_image_url: params.front_image_url,
            ingredients_image_url: params.ingredients_image_url,
            product_name: params.product_name || null,
            brand_name: params.brand_name || null,
            ingredients_text: params.ingredients_text,
            ocr_raw_text: params.ocr_raw_text || null,
            barcode: params.barcode || null,
            category: params.category || null,
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating submission:', error);
        throw error;
    }

    // 2. Also add to shelf_items so it shows on user's shelf immediately
    // is_approved = false indicates it's a user-submitted product pending review
    console.log('📦 Adding to shelf with profileId:', profileId, 'user_id:', user.id);
    try {
        const { error: shelfError } = await supabase
            .from('shelf_items')
            .insert({
                user_id: user.id,
                profile_id: profileId || null, // Include auto-detected profile for child accounts
                product_barcode: params.barcode || null,
                product_name: params.product_name || 'Unknown Product',
                product_brand: params.brand_name || null,
                product_image_url: params.front_image_url || null,
                product_category: params.category || null,
                status: 'active',
                quantity: 1,
                is_approved: false, // Mark as user-submitted, pending admin approval
                notes: 'User-submitted product - pending review',
            });

        if (shelfError) {
            console.error('Warning: Could not add to shelf:', shelfError);
            // Don't throw - the submission was still created successfully
        } else {
            console.log('✅ Product added to shelf');
        }
    } catch (shelfErr) {
        console.error('Warning: Error adding to shelf:', shelfErr);
        // Don't throw - the submission was still created successfully
    }

    return data as UserSubmission;
}

/**
 * Get all submissions for the current user
 */
export async function getMySubmissions(): Promise<UserSubmission[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from('user_submitted_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
    }

    return (data || []) as UserSubmission[];
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(id: string): Promise<UserSubmission | null> {
    const { data, error } = await supabase
        .from('user_submitted_products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return null; // Not found
        }
        console.error('Error fetching submission:', error);
        throw error;
    }

    return data as UserSubmission;
}

/**
 * Get pending submissions for admin review
 */
export async function getPendingSubmissions(): Promise<UserSubmission[]> {
    const { data, error } = await supabase
        .from('user_submitted_products')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending submissions:', error);
        throw error;
    }

    return (data || []) as UserSubmission[];
}
