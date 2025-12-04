import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOnboarding() {
  console.log('🔍 Checking onboarding status for childtest@test.com...\n');

  // Get user by email
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'childtest@test.com')
    .single();

  if (error) {
    console.error('❌ Error fetching profile:', error);
    return;
  }

  if (!profile) {
    console.log('❌ No profile found for childtest@test.com');
    return;
  }

  console.log('📋 Profile Details:');
  console.log('   ID:', profile.id);
  console.log('   Email:', profile.email);
  console.log('   First Name:', profile.first_name);
  console.log('   Role:', profile.role);
  console.log('   Onboarding Completed:', profile.onboarding_completed);
  console.log('   Created At:', profile.created_at);
  console.log('\n');

  // Ask if we should update
  if (!profile.onboarding_completed) {
    console.log('⚠️  Onboarding is NOT completed for this user.');
    console.log('💡 To mark onboarding as complete, run:');
    console.log('   node scripts/update-onboarding.ts');
  } else {
    console.log('✅ Onboarding is already completed!');
  }
}

checkOnboarding().catch(console.error);
