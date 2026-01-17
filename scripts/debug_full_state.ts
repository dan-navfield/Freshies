
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

async function debugState() {
    console.log('=== DEBUG STATE ===');

    // 1. Check Ruby's Record
    console.log('\n1. Checking Ruby in managed_children:');
    const { data: ruby, error: rubyError } = await supabase
        .from('managed_children')
        .select('*')
        .eq('first_name', 'Ruby')
        .single();

    if (rubyError) {
        console.error('Error finding Ruby:', rubyError);
    } else {
        console.log('Ruby Record:', JSON.stringify(ruby, null, 2));

        if (ruby) {
            // 2. Check Items for this Profile
            console.log(`\n2. Checking Shelf Items for Profile ID: ${ruby.id}`);

            const { data: items, error: itemsError } = await supabase
                .from('shelf_items')
                .select('id, product_name, user_id, profile_id')
                .eq('profile_id', ruby.id);

            if (itemsError) {
                console.error('Error finding items:', itemsError);
            } else {
                console.log(`Found ${items.length} items:`);
                console.log(items);
            }
        }
    }

    // 3. Check Auth Link
    console.log('\n3. Checking Child User Link');
    // We know childtest ID is b82...
    const childUserId = 'b82a79c4-ce5f-4be0-994e-8c520ed545f0';

    const { data: linkedChild, error: linkError } = await supabase
        .from('managed_children')
        .select('*')
        .eq('user_id', childUserId);

    if (linkError) console.error('Link check error:', linkError);
    else {
        console.log(`Children linked to Auth User ${childUserId}:`, linkedChild?.length);
        if (linkedChild?.length === 0) console.warn('WARNING: No child linked to this Auth ID!');
    }
}

debugState();
