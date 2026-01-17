
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

async function debug() {
    console.log("Listing all child_profiles...");
    const { data: profiles, error } = await supabase
        .from('child_profiles')
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles?.length} profiles.`);
    profiles?.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.display_name || p.first_name}, UserID: ${p.user_id}`);
    });

    if (profiles && profiles.length > 0) {
        const targetId = profiles[0].id;
        console.log(`\nChecking shelf items for Profile ${targetId}...`);
        const { data: items, error: itemsError } = await supabase
            .from('shelf_items')
            .select('id, product_name, user_id, profile_id')
            .eq('profile_id', targetId);

        if (itemsError) console.error("Error fetching items:", itemsError);
        else {
            console.log(`Found ${items?.length} shelf items.`);
            items?.forEach(i => console.log(`  - Item: ${i.product_name}, Owner: ${i.user_id}`));

            if (items && items.length > 0 && items[0].user_id !== profiles[0].user_id) {
                console.log("Ownership mismatch detected! Attempting fix...");
                const { error: fixError } = await supabase
                    .from('shelf_items')
                    .update({ user_id: profiles[0].user_id })
                    .eq('profile_id', targetId);
                if (fixError) console.error("Fix failed:", fixError);
                else console.log("Fix applied successfully!");
            }
        }
    }
}

debug();
