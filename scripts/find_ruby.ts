
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Key:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRuby() {
    console.log('🔍 Searching for "Ruby" in child_profiles...');

    const { data, error } = await supabase
        .from('child_profiles')
        .select('*')
        .ilike('display_name', '%Ruby%');

    if (error) {
        console.error('Error querying DB:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} profile(s) matching "Ruby":`);
        data.forEach(profile => {
            console.log('---');
            console.log(`ID: ${profile.id}`);
            console.log(`User ID: ${profile.user_id}`);
            console.log(`Display Name: ${profile.display_name}`);
            console.log(`Username: ${profile.username}`);
            console.log(`Bio: ${profile.bio}`);
            console.log(`Created At: ${profile.created_at}`);
        });
    } else {
        console.log('❌ No profiles found matching "Ruby".');

        // List all to see what's there
        console.log('\n📋 Listing first 5 profiles instead:');
        const { data: allData } = await supabase.from('child_profiles').select('id, display_name, bio').limit(5);
        console.table(allData);
    }
}

findRuby();
