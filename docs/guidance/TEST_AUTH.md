# Authentication Testing Guide

## Quick Test: Email Magic Link (Available Now)

### Test Signup Flow

1. **Start the app**
   ```bash
   npm run ios
   ```

2. **Navigate to signup**
   - Tap "Get Started" on welcome screen
   - You should see the Create Account screen

3. **Enter your email**
   - Type a valid email address
   - Tap "Continue with Email"

4. **Check your email**
   - Look for email from Supabase
   - Subject: "Confirm your signup"
   - Click the magic link

5. **Expected behavior**
   - App should open automatically
   - You should be redirected to role selection
   - Select "Parent" or "Child"
   - Complete onboarding flow

### Test Login Flow

1. **From welcome screen**
   - Tap "I Already Have an Account"

2. **Enter same email**
   - Type the email you signed up with
   - Tap "Continue with Email"

3. **Check email again**
   - Click the magic link

4. **Expected behavior**
   - App opens
   - You're logged in
   - Redirected to main app (if onboarding complete)
   - Or continue onboarding (if not complete)

---

## Test OAuth Providers (After Configuration)

### Prerequisites
- OAuth provider configured in Supabase
- Provider credentials added to Supabase Dashboard
- Redirect URLs configured

### Test Apple Sign In

1. **Tap "Continue with Apple"**
2. **Browser opens** with Apple login
3. **Sign in with Apple ID**
4. **Authorize the app**
5. **Expected**: Redirect back to app, logged in

### Test Google Sign In

1. **Tap "Continue with Google"**
2. **Browser opens** with Google login
3. **Select Google account**
4. **Authorize the app**
5. **Expected**: Redirect back to app, logged in

### Test Meta Sign In

1. **Tap "Continue with Meta"**
2. **Browser opens** with Facebook login
3. **Sign in with Facebook**
4. **Authorize the app**
5. **Expected**: Redirect back to app, logged in

---

## Verify User in Supabase

### Check Authentication

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. You should see your user listed
4. Check the provider column (email, apple, google, facebook)

### Check Profile Creation

1. Go to **Table Editor** → **profiles**
2. Find your user by ID
3. Verify:
   - `id` matches auth user ID
   - `email` is populated
   - `role` is set (after role selection)
   - `onboarding_completed` updates after onboarding

---

## Test User Flow Scenarios

### Scenario 1: New User (Email)
```
Welcome → Get Started → Enter Email → Check Email → 
Click Link → Role Selection → Onboarding → Main App
```

### Scenario 2: New User (OAuth)
```
Welcome → Get Started → Click OAuth → Authorize → 
Role Selection → Onboarding → Main App
```

### Scenario 3: Returning User
```
Welcome → I Already Have an Account → Enter Email/OAuth → 
Main App (if onboarding complete)
```

### Scenario 4: User with Role, No Onboarding
```
Login → Redirected to onboarding flow → Complete → Main App
```

---

## Common Issues & Solutions

### Issue: Email not received
**Solution:**
- Check spam folder
- Verify email in Supabase settings
- Check Supabase logs for email errors

### Issue: OAuth browser doesn't open
**Solution:**
- Check Supabase provider is enabled
- Verify credentials are correct
- Check console for errors

### Issue: Redirect doesn't work
**Solution:**
- Verify URL scheme: `freshies`
- Rebuild app after app.json changes
- Test deep linking: `npx uri-scheme open freshies://auth/callback --ios`

### Issue: User stuck in loading
**Solution:**
- Check network connection
- Verify Supabase URL and keys
- Check callback.tsx for errors

### Issue: Profile not created
**Solution:**
- Check profiles table exists
- Verify RLS policies
- Check Supabase logs

---

## Debug Mode

### Enable Detailed Logging

Add to your auth handlers:

```typescript
const handleEmailSignup = async () => {
  console.log('Starting email signup...');
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
    });
    console.log('Signup response:', { data, error });
    // ... rest of code
  } catch (error) {
    console.error('Signup error:', error);
  }
};
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Filter by your email/user ID
4. Look for errors or warnings

---

## Success Criteria

✅ Email magic link works
✅ OAuth providers open browser
✅ Redirects work correctly
✅ User profile created in database
✅ Role selection works
✅ Onboarding flow completes
✅ User can access main app
✅ User can sign out and sign back in

---

## Next Steps After Testing

1. ✅ Verify all auth methods work
2. ✅ Test on both iOS and Android
3. ✅ Test edge cases (network errors, etc.)
4. ✅ Add analytics/monitoring
5. ✅ Configure production OAuth credentials
6. ✅ Update email templates in Supabase
7. ✅ Add error tracking (Sentry)

---

**Ready to test!** Start with email authentication, then configure and test OAuth providers one by one.
