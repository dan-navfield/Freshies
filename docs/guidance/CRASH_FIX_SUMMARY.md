# Content Creation Pipeline Crash - Fix Summary

## Problem
The AI content creation test crashed when trying to save the generated article to the database with the error:
```
Could not find the 'source_refs' column of 'learn_articles' in the schema cache
```

## Root Cause
The `database.ts` file attempts to insert columns that don't exist in the database schema:
- `source_type` - Type of content source (human_written, ai_generated, mixed)
- `source_refs` - Array of source URLs referenced
- `version` - Content version number
- `published_at` - Timestamp when article was published

## What Worked
The AI content generation pipeline worked perfectly:
1. ✅ Fetched content from Royal Children's Hospital
2. ✅ Parsed HTML content
3. ✅ AI transformation - summarised content
4. ✅ AI transformation - extracted FAQs
5. ✅ AI transformation - classified topic
6. ✅ Assembled article structure
7. ✅ Ran safety checks
8. ❌ **CRASHED** when saving to database

## Solution

### Option 1: Run SQL in Supabase Dashboard (RECOMMENDED)
1. Go to: https://supabase.com/dashboard/project/citlmjwylnpxfhopkkjj/sql
2. Copy and paste the contents of `FIX_SCHEMA.sql`
3. Click "Run"
4. Verify columns were added

### Option 2: Apply Migration (if Supabase CLI is working)
The migration file has been updated:
- `supabase/migrations/20251115164923_learn_content_pipeline.sql`

Run:
```bash
npx supabase db push --linked
```

## Files Modified
1. ✅ Removed duplicate migrations:
   - `20241115_learn_content_tables.sql` (duplicate)
   - `20241114_user_profiles.sql` (duplicate)
   - `20241114_recreate_profiles.sql` (duplicate)
   - `20251116_add_missing_learn_columns.sql` (superseded)

2. ✅ Updated main migration:
   - `supabase/migrations/20251115164923_learn_content_pipeline.sql`
   - Added missing columns to `learn_articles` table
   - Added indexes for new columns

3. ✅ Created fix script:
   - `FIX_SCHEMA.sql` - Ready to run in Supabase SQL Editor

## After Fix
Once the SQL is run, test again:
```bash
npm run test:pipeline
```

Expected result:
- Article will be created successfully
- Will be saved with status: 'draft'
- Can be reviewed and published through admin workflow

## Additional Note
The safety checker flagged one issue:
- Contains medical diagnosis language: "cure"
- Safety score: 70/100 (threshold is 85)

This is expected behavior - the AI-generated content will need human review before publishing.
