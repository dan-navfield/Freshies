# OAuth Setup Guide for Freshies

This guide will help you configure OAuth authentication with Apple, Google, and Meta (Facebook) in your Supabase project.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard
- Developer accounts for Apple, Google, and Meta

## Supabase Configuration

### 1. Get Your Redirect URL

Your app's redirect URL is:
```
freshies://auth/callback
```

For web testing, you may also need:
```
http://localhost:8081/auth/callback
```

### 2. Configure OAuth Providers in Supabase

Go to your Supabase Dashboard → Authentication → Providers

---

## Apple Sign In

### Step 1: Apple Developer Setup

1. Go to [Apple Developer](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new **App ID** (if not already created):
   - Bundle ID: `com.freshies.app`
   - Enable "Sign in with Apple" capability

4. Create a **Services ID**:
   - Identifier: `com.freshies.app.auth`
   - Enable "Sign in with Apple"
   - Configure:
     - Primary App ID: Select your app's Bundle ID
     - Return URLs: Add your Supabase callback URL (found in Supabase Dashboard)

5. Create a **Key**:
   - Enable "Sign in with Apple"
   - Download the key file (.p8)
   - Note the Key ID

### Step 2: Supabase Configuration

In Supabase Dashboard → Authentication → Providers → Apple:

1. Enable Apple provider
2. Enter:
   - **Services ID**: `com.freshies.app.auth`
   - **Team ID**: Your Apple Team ID
   - **Key ID**: From the key you created
   - **Private Key**: Contents of the .p8 file
3. Add redirect URL: `freshies://auth/callback`
4. Save

---

## Google Sign In

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → Create Credentials → OAuth 2.0 Client ID

5. Configure OAuth consent screen:
   - User Type: External
   - App name: Freshies
   - User support email: Your email
   - Developer contact: Your email

6. Create OAuth 2.0 Client IDs:

   **For iOS:**
   - Application type: iOS
   - Bundle ID: `com.freshies.app`
   
   **For Android:**
   - Application type: Android
   - Package name: `com.freshies.app`
   - SHA-1 certificate fingerprint: (Get from your keystore)
   
   **For Web (testing):**
   - Application type: Web application
   - Authorized redirect URIs: Add Supabase callback URL

### Step 2: Supabase Configuration

In Supabase Dashboard → Authentication → Providers → Google:

1. Enable Google provider
2. Enter:
   - **Client ID (for OAuth)**: From Google Cloud Console (Web client)
   - **Client Secret (for OAuth)**: From Google Cloud Console
3. Add redirect URL: `freshies://auth/callback`
4. Save

---

## Meta (Facebook) Sign In

### Step 1: Meta Developer Setup

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app or select existing
3. Add **Facebook Login** product
4. Configure Facebook Login:
   - Valid OAuth Redirect URIs: Add your Supabase callback URL
   - Add `freshies://auth/callback`

5. Get your credentials:
   - App ID
   - App Secret (in Settings → Basic)

### Step 2: Supabase Configuration

In Supabase Dashboard → Authentication → Providers → Facebook:

1. Enable Facebook provider
2. Enter:
   - **Facebook client ID**: Your App ID
   - **Facebook secret**: Your App Secret
3. Add redirect URL: `freshies://auth/callback`
4. Save

---

## Email Magic Link (Already Configured)

The email magic link authentication is already implemented and will work out of the box with your Supabase configuration.

### How it works:

1. User enters email
2. Supabase sends magic link to email
3. User clicks link
4. App handles authentication via callback
5. User is redirected to appropriate screen

---

## Testing

### Test Email Authentication:
1. Open the app
2. Click "Get Started"
3. Enter your email
4. Check your email for the magic link
5. Click the link
6. You should be redirected to the app and logged in

### Test OAuth Providers:
1. Open the app
2. Click "Get Started"
3. Click on Apple/Google/Meta button
4. Complete OAuth flow in browser
5. You should be redirected back to the app

---

## Troubleshooting

### OAuth not working:
- Verify redirect URLs match exactly in all platforms
- Check that providers are enabled in Supabase
- Ensure credentials are correct
- Check Supabase logs for errors

### Deep linking not working:
- Verify URL scheme in app.json: `"scheme": "freshies"`
- Test with: `npx uri-scheme open freshies://auth/callback --ios`
- Rebuild the app after changing app.json

### Email magic link not working:
- Check Supabase email templates
- Verify email service is configured
- Check spam folder
- Verify redirect URL in email template

---

## Database Setup

Make sure you have the `profiles` table with the following structure:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('parent', 'child')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## Next Steps

1. Configure each OAuth provider in Supabase Dashboard
2. Test each authentication method
3. Monitor Supabase logs for any errors
4. Update production redirect URLs when deploying

---

## Support

If you encounter issues:
- Check Supabase Dashboard → Logs
- Review provider-specific documentation
- Verify all credentials and URLs are correct
