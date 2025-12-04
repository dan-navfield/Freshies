# Freshies Zustand Stores

Global state management for the Freshies app using Zustand.

## Stores Overview

### 1. `authStore` - Authentication & Role Context
Manages user identity, role, and family/community context.

**Use cases:**
- Navigation guards based on role
- Header UI showing current user/family
- Profile screens
- Role-based feature access

**Example:**
```typescript
import { useAuthStore } from '@/stores';

function MyComponent() {
  const { userRole, currentFamily, selectedChildProfile } = useAuthStore();
  const setSelectedChild = useAuthStore((state) => state.setSelectedChild);
  
  if (userRole === 'parent') {
    // Show parent-specific UI
  }
}
```

### 2. `onboardingStore` - Onboarding Flow State
Tracks onboarding progress and first-time user flags.

**Use cases:**
- Onboarding step navigation
- Permission request tracking
- First-time experience flags

**Example:**
```typescript
import { useOnboardingStore } from '@/stores';

function OnboardingScreen() {
  const { currentStep, completedSteps } = useOnboardingStore();
  const markStepComplete = useOnboardingStore((state) => state.markStepComplete);
  
  const handleNext = () => {
    markStepComplete(currentStep);
    // Navigate to next step
  };
}
```

### 3. `uiStore` - Global UI State
Manages global UI elements like loading overlays, snackbars, and modals.

**Use cases:**
- Show/hide global loading
- Display snackbars/toasts
- Trigger bottom sheets from anywhere
- Track scanner state

**Example:**
```typescript
import { useUIStore } from '@/stores';

function MyComponent() {
  const showSnackbar = useUIStore((state) => state.showSnackbar);
  const setGlobalLoading = useUIStore((state) => state.setGlobalLoading);
  
  const handleAction = async () => {
    setGlobalLoading(true, 'Processing...');
    try {
      await doSomething();
      showSnackbar('Success!', 'success');
    } catch (error) {
      showSnackbar('Error occurred', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };
}
```

### 4. `preferencesStore` - User Preferences (Persisted)
Stores user preferences with AsyncStorage persistence.

**Use cases:**
- Theme selection
- Sort order for lists
- Feature toggles
- Notification settings

**Example:**
```typescript
import { usePreferencesStore } from '@/stores';

function SettingsScreen() {
  const { theme, scanHistorySortOrder } = usePreferencesStore();
  const setTheme = usePreferencesStore((state) => state.setTheme);
  
  return (
    <View>
      <Button onPress={() => setTheme('dark')}>Dark Mode</Button>
    </View>
  );
}
```

## Best Practices

### 1. Selector Pattern
Use selectors to avoid unnecessary re-renders:

```typescript
// ❌ Bad - component re-renders on any store change
const store = useAuthStore();

// ✅ Good - only re-renders when userRole changes
const userRole = useAuthStore((state) => state.userRole);
```

### 2. Action Extraction
Extract actions separately when you don't need state:

```typescript
const setUser = useAuthStore((state) => state.setUser);
```

### 3. Multiple Selectors
Use multiple selectors for better performance:

```typescript
const userRole = useAuthStore((state) => state.userRole);
const currentFamily = useAuthStore((state) => state.currentFamily);
```

## Integration with Existing Code

### Replace AuthContext Usage
The `authStore` can gradually replace the React Context for auth state:

```typescript
// Old (Context)
const { user, userRole } = useAuth();

// New (Zustand)
const { userId, userRole } = useAuthStore();
```

### Snackbar Integration
Replace the current snackbar implementation with the UI store:

```typescript
// Old
setShowSnackbar(true);

// New
showSnackbar('Profile updated!', 'success');
```

## State Persistence

Only `preferencesStore` is persisted to AsyncStorage. Auth state is managed by Supabase session, and UI/onboarding state is ephemeral.

To clear persisted data:
```typescript
usePreferencesStore.getState().resetPreferences();
```
