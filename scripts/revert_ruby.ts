
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

async function revertRuby() {
    console.log('🔙 Reverting "Ruby" profile...');

    const profileId = '3fad3eff-878e-4c81-85a8-b3f765d33752';

    const { error: updateError } = await supabase
        .from('child_profiles')
        .update({
            display_name: 'Ruby',
            bio: 'I’m 11 and love Sephora #gwirlies',
        })
        .eq('id', profileId);

    if (updateError) {
        console.error(`Failed to revert profile ${profileId}:`, updateError);
    } else {
        console.log(`✅ Profile ${profileId} reverted to Ruby.`);
    }
}

revertRuby();
