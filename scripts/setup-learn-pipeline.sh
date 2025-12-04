#!/bin/bash

# Learn Content Pipeline - Setup Script
# This script sets up the Learn content pipeline

set -e

echo "========================================="
echo "Learn Content Pipeline Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Step 1: Check dependencies
echo "📦 Step 1: Checking dependencies..."
if ! grep -q "cheerio" package.json; then
    echo "Installing cheerio..."
    npm install cheerio @types/cheerio
else
    echo "✅ cheerio already installed"
fi

if ! grep -q "@supabase/supabase-js" package.json; then
    echo "Installing @supabase/supabase-js..."
    npm install @supabase/supabase-js
else
    echo "✅ @supabase/supabase-js already installed"
fi

echo ""

# Step 2: Check environment variables
echo "🔐 Step 2: Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env.example..."
    cat > .env.example << 'EOF'
# OpenAI API Key (for AI transformations)
OPENAI_API_KEY=your_openai_key_here

# Claude API Key (alternative AI provider)
CLAUDE_API_KEY=your_claude_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Pipeline Configuration
LEARN_PIPELINE_ENABLED=true
LEARN_SYNC_SCHEDULE=0 2 * * 0
EOF
    echo "✅ Created .env.example - please copy to .env and fill in values"
else
    echo "✅ .env file exists"
fi

echo ""

# Step 3: Check Supabase setup
echo "🗄️  Step 3: Checking Supabase setup..."
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI installed"
    
    if [ -d "supabase" ]; then
        echo "✅ Supabase directory exists"
        
        if [ -f "supabase/migrations/20241115_learn_content_tables.sql" ]; then
            echo "✅ Learn content migration file exists"
            echo ""
            echo "To apply migration, run:"
            echo "  supabase db push"
        else
            echo "⚠️  Warning: Migration file not found"
        fi
    else
        echo "⚠️  Warning: supabase directory not found"
        echo "Initialize with: supabase init"
    fi
else
    echo "⚠️  Supabase CLI not installed"
    echo "Install with: npm install -g supabase"
fi

echo ""

# Step 4: Verify file structure
echo "📁 Step 4: Verifying file structure..."
REQUIRED_FILES=(
    "src/services/learn/types.ts"
    "src/services/learn/aiTools.ts"
    "src/services/learn/contentSources.ts"
    "src/services/learn/contentFetcher.ts"
    "src/services/learn/safetyChecker.ts"
    "src/services/learn/pipelineOrchestrator.ts"
    "src/services/learn/database.ts"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

# Step 5: Summary
echo "========================================="
echo "Setup Summary"
echo "========================================="
if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ All pipeline files present"
else
    echo "⚠️  $MISSING_FILES file(s) missing"
fi

echo ""
echo "Next Steps:"
echo "1. Configure .env with your API keys"
echo "2. Run: supabase db push (to apply migrations)"
echo "3. Test with: npm run test:pipeline"
echo ""
echo "========================================="
