
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkChild() {
    const childUserId = 'b82a79c4-ce5f-4be0-994e-8c520ed545f0'; // childtest@test.com

    console.log('Linking Ruby to User:', childUserId);

    // Find Ruby
    const { data: children } = await supabase
        .from('managed_children')
        .select('*')
        .eq('first_name', 'Ruby');

    if (children && children.length > 0) {
        const ruby = children[0];
        console.log('Found Ruby:', ruby.id);

        const { error } = await supabase
            .from('managed_children')
            .update({ user_id: childUserId })
            .eq('id', ruby.id);

        if (error) console.error('Link error:', error);
        else console.log('Successfully linked Ruby to childtest user.');
    } else {
        console.log('Ruby not found');
    }
}

linkChild();
