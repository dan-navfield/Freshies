import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_API_KEY!;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_API_KEY are set in .env');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Setting up Freshies database...\n');
  console.log(`📍 Project: ${projectRef}\n`);

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing SQL schema via Management API...\n');

    // Use the Management API to run SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseSecretKey}`,
        },
        body: JSON.stringify({
          query: schema,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Database schema executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const verifyResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseSecretKey}`,
        },
        body: JSON.stringify({
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
          `,
        }),
      }
    );

    if (verifyResponse.ok) {
      const tables = await verifyResponse.json();
      console.log('✅ Tables created:');
      if (tables.result && Array.isArray(tables.result)) {
        tables.result.forEach((row: any) => {
          console.log(`   - ${row.table_name}`);
        });
      }
    }

    console.log('\n✨ Database setup complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Go to Supabase Dashboard → Table Editor to verify');
    console.log('   2. Configure email templates in Authentication → Email Templates');
    console.log('   3. Test the authentication flow in your app\n');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Verify your service_role key is correct');
    console.error('   - Check that the project ref matches your Supabase project');
    console.error('   - Ensure you have database write permissions\n');
    process.exit(1);
  }
}

setupDatabase();
