
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphans() {
    console.log("Searching for 'Neutrogena'...");
    const { data: items, error } = await supabase
        .from('shelf_items')
        .select('*')
        .ilike('product_name', '%Neutrogena%');

    if (error) {
        console.error("Error searching items:", error);
        return;
    }

    console.log(`Found ${items?.length} items matching 'Neutrogena'.`);
    items?.forEach(i => {
        console.log(`- Item: ${i.product_name}, ID: ${i.id}, ProfileID: ${i.profile_id}, UserID: ${i.user_id}`);
    });

    // Target Child Profile ID (from previous step)
    const targetProfileId = '3fad3eff-878e-4c81-85a8-b3f765d33752';
    const targetUserId = 'b82a79c4-ce5f-4be0-994e-8c520ed545f0';

    if (items && items.length > 0) {
        const itemToFix = items[0];
        console.log(`\nRelinking item ${itemToFix.id} to Profile ${targetProfileId}...`);

        const { error: updateError } = await supabase
            .from('shelf_items')
            .update({
                profile_id: targetProfileId,
                user_id: targetUserId
            })
            .eq('id', itemToFix.id);

        if (updateError) console.error("Update failed:", updateError);
        else console.log("Success! Item relinked.");
    } else {
        console.log("No items found to fix. Creating a test item...");
        const { data: newItem, error: createError } = await supabase
            .from('shelf_items')
            .insert({
                user_id: targetUserId,
                profile_id: targetProfileId,
                product_name: "Neutrogena Hydro Boost Water Gel",
                product_brand: "Neutrogena",
                product_category: "Moisturizers",
                status: "active",
                quantity: 1,
                is_approved: true
            })
            .select()
            .single();

        if (createError) console.error("Create failed:", createError);
        else console.log("Created test item:", newItem);
    }
}

fixOrphans();
