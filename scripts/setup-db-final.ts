import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql: string) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function setupDatabase() {
  console.log('🚀 Setting up Freshies database...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing SQL schema...\n');

    // Try to create a helper function first
    console.log('Creating SQL execution helper...');
    try {
      await supabase.rpc('exec', {
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `
      });
      console.log('✅ Helper function created\n');
    } catch (err) {
      console.log('Helper function may already exist, continuing...\n');
    }

    // Execute the full schema
    console.log('Executing database schema...');
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.log('Direct execution failed, trying statement by statement...\n');
      
      // Split and execute one by one
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        try {
          await supabase.rpc('exec_sql', { sql: statement + ';' });
          successCount++;
          process.stdout.write(`\r✅ Executed ${successCount}/${statements.length} statements`);
        } catch (err: any) {
          // Skip errors for things that might already exist
          if (err.message?.includes('already exists')) {
            skipCount++;
          } else {
            console.log(`\n⚠️  Statement ${i + 1}: ${err.message?.substring(0, 100)}`);
          }
        }
      }
      
      console.log(`\n\n✅ Completed: ${successCount} successful, ${skipCount} skipped\n`);
    } else {
      console.log('✅ Schema executed successfully!\n');
    }

    // Verify tables
    console.log('🔍 Verifying tables...\n');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (!tablesError && tables) {
      console.log('✅ Tables created:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    }

    console.log('\n✨ Database setup complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. RLS is DISABLED for development');
    console.log('   2. Test the authentication flow');
    console.log('   3. Enable RLS when ready for production\n');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nTrying alternative method with raw SQL...\n');
    
    // Last resort: try using the REST API directly
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    
    if (projectRef) {
      const schemaPath = path.join(__dirname, '../supabase/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: schema }),
        }
      );

      if (response.ok) {
        console.log('✅ Schema executed via REST API!\n');
      } else {
        const errorText = await response.text();
        console.error('REST API also failed:', errorText);
        console.error('\n📋 Please copy supabase/schema.sql and paste it into:');
        console.error(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
      }
    }
  }
}

setupDatabase();
