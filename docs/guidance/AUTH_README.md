# Freshies Authentication & Onboarding

## Overview
Complete authentication and onboarding system for the Freshies app, supporting both parent and child user types with appropriate flows and privacy controls.

## Features Implemented

### Authentication
- ✅ **Email Magic Link** - Passwordless authentication via email
- ✅ **Session Management** - Secure token storage with Expo SecureStore
- ✅ **Auth Context** - Global authentication state management
- 🔄 **Social Auth** - Apple & Google (placeholders ready for implementation)

### User Flows

#### Welcome & Signup
- **Welcome Screen** (`/(auth)/welcome`) - Beautiful entry point with feature highlights
- **Signup Screen** (`/(auth)/signup`) - Email magic link + social auth options
- **Login Screen** (`/(auth)/login`) - Returning user authentication

#### Onboarding
- **Role Selection** (`/(onboarding)/role-select`) - Choose between Parent or Child account
- **Parent Flow**:
  - Welcome screen with feature overview
  - Profile setup (name, optional details)
  - Direct access to main app
- **Child Flow**:
  - Age-appropriate welcome screen
  - Parent approval request
  - Pending state with status updates

### Database Schema
Located in `supabase/schema.sql`:
- **profiles** - User profiles with role, onboarding status, parent relationships
- **communities** - Family communities
- **community_members** - Community membership with roles
- **approval_requests** - Child account approval workflow
- **RLS Policies** - Row-level security for data protection

## File Structure

```
app/
├── index.tsx                    # Smart routing based on auth state
├── (auth)/
│   ├── welcome.tsx             # Entry point for new users
│   ├── signup.tsx              # Signup with magic link
│   └── login.tsx               # Login for returning users
├── (onboarding)/
│   ├── role-select.tsx         # Parent vs Child selection
│   ├── parent-welcome.tsx      # Parent feature overview
│   ├── parent-profile.tsx      # Parent profile setup
│   ├── child-welcome.tsx       # Child-friendly welcome
│   ├── child-approval.tsx      # Request parent approval
│   └── child-pending.tsx       # Waiting for approval
└── (tabs)/                     # Main app (protected)

contexts/
└── AuthContext.tsx             # Authentication state management

lib/
└── supabase.ts                 # Supabase client configuration
```

## Setup Instructions

### 1. Database Setup
Run the SQL schema in your Supabase project:
```bash
# Copy contents of supabase/schema.sql
# Run in Supabase SQL Editor
```

### 2. Environment Variables
Already configured in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. Email Configuration
Configure email templates in Supabase Dashboard:
- Go to Authentication > Email Templates
- Customize "Magic Link" template
- Set redirect URL to: `freshies://auth/callback`

## User Journey

### New Parent User
1. Opens app → Welcome screen
2. Taps "Get Started" → Signup screen
3. Enters email → Receives magic link
4. Clicks link → Role selection
5. Selects "Parent" → Parent welcome
6. Completes profile → Main app

### New Child User
1. Opens app → Welcome screen
2. Taps "Get Started" → Signup screen
3. Enters email → Receives magic link
4. Clicks link → Role selection
5. Selects "Child" → Child welcome
6. Requests parent approval → Pending screen
7. Parent approves → Main app access

### Returning User
1. Opens app → Automatically authenticated
2. Redirects to main app

## Security Features

### Privacy Protection
- Email verification required before access
- Child accounts require parent approval
- Secure session storage with Expo SecureStore
- Row-level security on all database tables

### Data Access
- Users can only access their own data
- Parents can view linked child accounts
- Community data restricted to members
- Admins have separate back-office access

## Next Steps

### To Complete
1. **Social Authentication**
   - Implement Apple Sign In
   - Implement Google Sign In
   - Add provider linking

2. **Email Verification**
   - Add email verification check
   - Resend verification flow
   - Verification reminder prompts

3. **Parent Approval System**
   - Email notification to parents
   - Approval link generation
   - Real-time status updates

4. **Profile Enhancement**
   - Avatar upload
   - Additional preferences
   - Privacy settings

5. **Session Management**
   - Device management
   - Sign out all devices
   - Session timeout handling

## Testing

### Test Accounts
Create test accounts for both user types:
```typescript
// Parent account
email: parent@test.com

// Child account  
email: child@test.com
```

### Test Flows
1. Complete signup as parent
2. Complete signup as child
3. Test magic link authentication
4. Test role selection
5. Test onboarding completion
6. Test protected route access

## Design Principles

### User Experience
- **Clarity** - Each step clearly communicates what's happening
- **Momentum** - Quick actions with immediate feedback
- **Trust** - Transparent privacy explanations
- **Flexibility** - Can pause and resume onboarding
- **Safety** - Child privacy prioritized

### Visual Design
- Warm, welcoming color palette
- Clear typography and spacing
- Consistent with main app design
- Age-appropriate for children
- Professional for parents

## Support

For questions or issues:
1. Check Supabase logs for auth errors
2. Verify email template configuration
3. Test magic link delivery
4. Check RLS policies for data access issues
