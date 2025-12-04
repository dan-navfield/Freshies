# Database Setup Guide - Family Management

## The Error You're Seeing

```
Error fetching children:
Could not find the table 'public.children' in the schema cache
```

**Cause:** The family management tables don't exist in your Supabase database yet.

## How to Fix It

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the SQL**
   - Open: `database/SETUP_FAMILY_TABLES.sql`
   - Copy ALL the contents

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify Tables Created**
   - Go to "Table Editor" in sidebar
   - You should see new tables:
     - `family_groups`
     - `children`
     - `child_permissions`
     - `child_devices`
     - `child_invitations`
     - `family_activity`

6. **Reload Your App**
   - The error should be gone!
   - Family management will now work

### Option 2: Use Supabase CLI (If Docker is Running)

```bash
# Make sure Docker Desktop is running first!

# Reset and apply all migrations
cd freshies-app
supabase db reset

# Or push just the new migration
supabase db push
```

## What Gets Created

### Tables

1. **family_groups** - Family organization
2. **children** - Child profiles
3. **child_permissions** - What each child can do
4. **child_devices** - Linked devices
5. **child_invitations** - Device link codes
6. **family_activity** - Activity tracking

### Security

- Row Level Security (RLS) enabled on all tables
- Parents can only see their own children
- Children can only see their own profile
- Proper access controls for all operations

### Indexes

- Optimized for fast queries
- Indexes on parent_id, child_id, etc.
- Performance-tuned for the app

## Troubleshooting

### "Table already exists" Error

If you see this, the tables are already created. Just reload your app.

### "Permission denied" Error

Make sure you're logged in to Supabase and have the right project selected.

### Still Getting Errors?

1. Check you're in the right Supabase project
2. Verify your `.env` has the correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Make sure you're logged in as a parent user (not child)
4. Try logging out and back in

## After Setup

Once tables are created:

1. ✅ Family management will work
2. ✅ You can add children
3. ✅ Child switcher will appear
4. ✅ All family features enabled

## Files Location

- **SQL File:** `database/SETUP_FAMILY_TABLES.sql`
- **Migration:** `supabase/migrations/20241116_family_management.sql`

## Quick Test

After running the SQL:

1. Open the app
2. Go to Home screen
3. Tap "Manage Family" button
4. Should see "No children added yet" (not an error!)
5. Tap "Add a Child"
6. Fill out the form
7. Submit
8. Child should appear in family overview

Success! 🎉
