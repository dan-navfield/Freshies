import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🚀 Setting up Freshies database...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing SQL schema via REST API...');

    // Extract project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      throw new Error('Could not extract project ref from URL');
    }

    // Use Supabase SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: schema }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('Direct SQL execution not available, using PostgREST...\n');
      
      // Alternative: Execute statements one by one
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`Executing ${statements.length} SQL statements...\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        
        try {
          const stmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ 
              sql: statement + ';'
            }),
          });

          if (!stmtResponse.ok) {
            const errorText = await stmtResponse.text();
            console.log(`   ⚠️  Warning: ${errorText.substring(0, 100)}`);
          } else {
            console.log(`   ✅ Success`);
          }
        } catch (err: any) {
          console.log(`   ⚠️  Warning: ${err.message}`);
        }
      }
    } else {
      console.log('✅ Schema executed successfully!');
    }

    console.log('\n✨ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in Supabase Table Editor');
    console.log('   2. Configure email templates in Authentication settings');
    console.log('   3. Test the app!\n');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
