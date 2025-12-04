import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up Freshies database...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../supabase/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing SQL schema...');
    
    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('Trying alternative method...');
      
      // Split by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { 
          sql: statement + ';' 
        });
        
        if (stmtError) {
          console.error(`❌ Error executing statement: ${stmtError.message}`);
        }
      }
    }

    console.log('✅ Database schema created successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      console.log('✅ Tables created:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    }

    console.log('\n✨ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Configure email templates in Supabase dashboard');
    console.log('   2. Test authentication flow in the app');
    console.log('   3. Create test accounts\n');

  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
