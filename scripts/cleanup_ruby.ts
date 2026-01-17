
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupRuby() {
    console.log('🧹 Cleaning up "Ruby" profile...');

    // Find the Ruby profile(s)
    const { data: profiles, error: searchError } = await supabase
        .from('child_profiles')
        .select('*')
        .ilike('display_name', '%Ruby%');

    if (searchError) {
        console.error('Error finding Ruby:', searchError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.log('✨ No "Ruby" profiles found. Already clean?');
        return;
    }

    console.log(`Found ${profiles.length} profile(s) to clean.`);

    for (const profile of profiles) {
        console.log(`Updating profile ${profile.id}...`);

        const { error: updateError } = await supabase
            .from('child_profiles')
            .update({
                display_name: 'Freshie',
                bio: 'Ready to start my skin journey! ✨',
                // Keep other fields as is, or reset if needed
            })
            .eq('id', profile.id);

        if (updateError) {
            console.error(`Failed to update profile ${profile.id}:`, updateError);
        } else {
            console.log(`✅ Profile ${profile.id} cleaned.`);
        }
    }
}

cleanupRuby();
