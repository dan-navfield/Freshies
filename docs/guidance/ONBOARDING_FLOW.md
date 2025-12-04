# Onboarding Flow Documentation

## Overview
The onboarding flow guides new users through account setup based on their role (parent or child).

## Flow Diagram

```
New User Login
    ↓
Check Profile
    ↓
No Role? → Role Selection
    ↓
Parent Selected → Parent Welcome → Parent Profile Setup → Main App
    ↓
Child Selected → Child Welcome → Child Approval Request → Pending/Main App
```

## Detailed Flow

### 1. Initial Login/Signup
- User signs up or logs in
- AuthContext fetches user profile
- Checks `role` and `onboarding_completed` fields

### 2. Routing Logic (`app/index.tsx`)

```typescript
// Not authenticated → Welcome screen
if (!session || !user) → /(auth)/welcome

// No role → Role selection
if (!userRole) → /(onboarding)/role-select

// Has role but not onboarded
if (!onboardingCompleted) {
  if (userRole === 'parent') → /(onboarding)/parent-welcome
  if (userRole === 'child') → /(onboarding)/child-welcome
}

// Fully onboarded → Main app
→ /(tabs)
```

### 3. Role Selection (`/(onboarding)/role-select`)
**Purpose**: User chooses between Parent or Child role

**Actions**:
- Creates/updates profile with selected role
- Sets `onboarding_completed: false`
- Navigates to role-specific welcome screen

**Database Update**:
```sql
UPDATE profiles SET
  role = 'parent' | 'child',
  onboarding_completed = false
WHERE id = user_id
```

### 4. Parent Onboarding Flow

#### 4a. Parent Welcome (`/(onboarding)/parent-welcome`)
**Purpose**: Introduce parent features

**Content**:
- Family management capabilities
- Product scanning features
- Routine creation
- Child account management

**Actions**:
- "Get Started" button → Parent Profile Setup

#### 4b. Parent Profile Setup (`/(onboarding)/parent-profile`)
**Purpose**: Collect parent's basic information

**Fields**:
- First Name
- Last Name
- (Future: Additional preferences)

**Actions**:
- Saves profile data
- Sets `onboarding_completed: true`
- Navigates to main app

**Database Update**:
```sql
UPDATE profiles SET
  first_name = ?,
  last_name = ?,
  onboarding_completed = true
WHERE id = user_id
```

### 5. Child Onboarding Flow

#### 5a. Child Welcome (`/(onboarding)/child-welcome`)
**Purpose**: Introduce child features

**Content**:
- Age-appropriate features
- Learning about skincare
- Parental approval system
- Safe exploration

**Actions**:
- "Get Started" button → Child Approval Request

#### 5b. Child Approval (`/(onboarding)/child-approval`)
**Purpose**: Request parent approval

**Content**:
- Explains parental approval requirement
- Generates approval code
- Instructions for parent

**Actions**:
- Creates approval request
- Navigates to pending screen

#### 5c. Child Pending (`/(onboarding)/child-pending`)
**Purpose**: Wait for parent approval

**Content**:
- Waiting message
- Approval code display
- What happens next

**Actions**:
- Polls for approval status
- Once approved → Sets `onboarding_completed: true`
- Navigates to main app

## Database Schema

### profiles table
```sql
- id: UUID (references auth.users)
- email: TEXT
- role: TEXT ('parent' | 'child')
- onboarding_completed: BOOLEAN
- first_name: TEXT
- last_name: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Auth Context

### State Management
```typescript
{
  session: Session | null
  user: User | null
  userRole: 'parent' | 'child' | null
  onboardingCompleted: boolean
  loading: boolean
}
```

### Key Functions
- `fetchUserRole()`: Fetches role and onboarding status
- `refreshSession()`: Refreshes user data after updates
- `signOut()`: Clears session and returns to welcome

## Testing the Flow

### Test Parent Flow:
1. Sign up with new email
2. Select "I'm a Parent"
3. See parent welcome screen
4. Click "Get Started"
5. Fill in first/last name
6. Click "Complete Setup"
7. Should land on main app (tabs)

### Test Child Flow:
1. Sign up with new email
2. Select "I'm a Child"
3. See child welcome screen
4. Click "Get Started"
5. See approval request screen
6. Get approval code
7. Wait for parent approval
8. Once approved → main app

### Test Returning User:
1. Sign in with existing account
2. If onboarding complete → main app
3. If onboarding incomplete → resume at last step

## Future Enhancements

### Potential Additions:
1. **Skip/Save for Later**: Allow users to skip optional steps
2. **Progress Indicator**: Show onboarding progress (Step 1 of 3)
3. **Profile Pictures**: Add avatar upload during setup
4. **Preferences**: Collect skin type, concerns, goals
5. **Tutorial**: Interactive app tour after onboarding
6. **Email Verification**: Require email confirmation
7. **Parent Linking**: Allow child to input parent's email
8. **Multi-step Forms**: Break parent profile into multiple screens

## Error Handling

### Common Scenarios:
- **Network Error**: Show retry button
- **Database Error**: Log error, show friendly message
- **Missing Data**: Validate required fields
- **Session Expired**: Redirect to login

## Navigation Guards

### Protected Routes:
- Main app (`/(tabs)`) requires `onboarding_completed: true`
- Onboarding screens require authenticated user
- Role-specific screens check user role

## Notes

- Onboarding state is stored in database, not local storage
- Refreshing the app resumes onboarding where user left off
- Changing roles requires admin action (not self-service)
- Child accounts require parent approval before full access

---

**Status**: ✅ Onboarding flow fully implemented and functional
**Last Updated**: 2025-11-14
