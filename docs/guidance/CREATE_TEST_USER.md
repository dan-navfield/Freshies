# Create Test User - Easy Method

## Option 1: Using Supabase Dashboard (Easiest)

### Step 1: Create Auth User
1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** (or "Invite user")
4. Choose **"Create new user"**
5. Enter:
   - **Email**: `test@freshies.app` (or any email you want)
   - **Password**: `TestPassword123!` (or any password)
   - **Auto Confirm User**: ✅ Check this box (so you don't need to verify email)
6. Click **"Create user"**
7. **Copy the User ID** (UUID) that appears

### Step 2: Create Profile
1. Go to **Table Editor** → **profiles** table
2. Click **"Insert"** → **"Insert row"**
3. Fill in:
   - **id**: Paste the User ID from Step 1
   - **email**: `test@freshies.app` (same as above)
   - **role**: `parent`
   - **onboarding_completed**: `true` (or `false` if you want to test onboarding)
4. Click **"Save"**

### Step 3: Test Login
1. Open your app
2. Go to Login screen
3. Enter:
   - Email: `test@freshies.app`
   - Password: `TestPassword123!`
4. You should be logged in! 🎉

---

## Option 2: Using SQL (Advanced)

If you prefer SQL, run this in **SQL Editor**:

```sql
-- This creates both the auth user and profile in one go
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@freshies.app',
    crypt('TestPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO profiles (
    id,
    email,
    role,
    onboarding_completed,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'test@freshies.app',
    'parent',
    true,
    NOW(),
    NOW()
  );

  -- Show the created user
  RAISE NOTICE 'Created user with ID: %', new_user_id;
END $$;

-- Verify
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.onboarding_completed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@freshies.app';
```

---

## Test User Credentials

After creation, you can log in with:
- **Email**: `test@freshies.app`
- **Password**: `TestPassword123!`

---

## Notes

- If `onboarding_completed` is `false`, the user will be directed to onboarding flow
- If `onboarding_completed` is `true`, the user will go straight to the main app
- The `role` field should be either `'parent'` or `'child'`
- You can create multiple test users with different emails

---

## Troubleshooting

**User can't log in?**
- Make sure `email_confirmed_at` is set (check "Auto Confirm User" in dashboard)
- Verify the password is correct
- Check that the profile exists in the profiles table

**Profile not found error?**
- Make sure the profile `id` matches the auth user `id` exactly
- Check that the profile was created in the profiles table
