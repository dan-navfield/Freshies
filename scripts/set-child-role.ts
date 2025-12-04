import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setChildRole() {
  console.log('🔄 Setting role to "child" for childtest@test.com...\n');

  // Update the profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      role: 'child',
      onboarding_completed: true 
    })
    .eq('email', 'childtest@test.com')
    .select()
    .single();

  if (error) {
    console.error('❌ Error updating profile:', error);
    return;
  }

  console.log('✅ Successfully updated role to child!');
  console.log('\n📋 Updated Profile:');
  console.log('   ID:', data.id);
  console.log('   Email:', data.email);
  console.log('   First Name:', data.first_name);
  console.log('   Role:', data.role);
  console.log('   Onboarding Completed:', data.onboarding_completed);
  console.log('\n🎉 The user will now see the child welcome splash screen on next login!');
}

setChildRole().catch(console.error);
