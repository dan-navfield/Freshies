# State Management Analysis & Consolidation Guide

**Generated:** 2026-01-17
**Purpose:** Document current state management patterns, identify duplication, and provide consolidation recommendations

---

## Table of Contents

1. [Current State Overview](#current-state-overview)
2. [Duplication Analysis](#duplication-analysis)
3. [Usage Statistics](#usage-statistics)
4. [Architectural Issues](#architectural-issues)
5. [Consolidation Recommendations](#consolidation-recommendations)
6. [Decision Matrix: Context vs Zustand](#decision-matrix-context-vs-zustand)
7. [Migration Strategy](#migration-strategy)
8. [Best Practices](#best-practices)

---

## Current State Overview

### Context API (React Context)

Located in `src/contexts/`:

#### 1. **AuthContext** (`src/contexts/AuthContext.tsx` - 156 lines)
- **Purpose:** User authentication, session management, role determination
- **State Managed:**
  - `session: Session | null` - Supabase session
  - `user: User | null` - Authenticated user
  - `userRole: UserRole` - 'parent' | 'child' | 'admin' | null
  - `onboardingCompleted: boolean`
  - `loading: boolean`
- **Actions:**
  - `signOut()` - Clear session and user data
  - `refreshSession()` - Reload session from Supabase
- **Usage:** 74 files across the codebase
- **Special Features:**
  - Listens to Supabase auth state changes
  - 5-second timeout to prevent infinite loading
  - **CRITICAL: Syncs with authStore (Zustand) via `setAuthStoreUser()`**

#### 2. **ChildProfileContext** (`src/contexts/ChildProfileContext.tsx` - 213 lines)
- **Purpose:** Child profile data for authenticated child users
- **State Managed:**
  - `childProfile: ChildProfile | null` - Full child profile from child_profiles table
  - `goals: ChildGoal[]` - Active goals from child_goals table
  - `loading: boolean`
  - `error: string | null`
  - `isChildMode: boolean` - Computed: true if childProfile exists
- **Actions:**
  - `refreshProfile()` - Reload profile from database
  - `updateProfile()` - Update child profile
  - `addGoal()`, `removeGoal()`, `updateGoal()` - Goal management
- **Usage:** 27 files (child-specific features)
- **Dependencies:** Depends on AuthContext's `user`

### Zustand Stores

Located in `src/stores/`:

#### 1. **authStore** (`src/stores/authStore.ts` - 80 lines)
- **Purpose:** DUPLICATE of AuthContext + additional family/child selection features
- **State Managed:**
  - `userId: string | null` - **DUPLICATE**
  - `userRole: UserRole` - **DUPLICATE**
  - `profile: Profile | null` - **DUPLICATE** (similar to AuthContext.user)
  - `currentFamily: Family | null` - **UNIQUE**
  - `currentFamilyId: string | null` - **UNIQUE**
  - `selectedChildId: string | null` - **UNIQUE** (for parent viewing child perspective)
  - `selectedChildProfile: Profile | null` - **UNIQUE**
- **Actions:**
  - `setUser()` - Set user/role/profile
  - `setCurrentFamily()` - Set family context
  - `setSelectedChild()` - Set child being viewed by parent
  - `clearAuth()` - Clear all auth state
- **Usage:** 4 files only (very low adoption)
- **Persistence:** None (in-memory only)

#### 2. **onboardingStore** (`src/stores/onboardingStore.ts` - 67 lines)
- **Purpose:** Onboarding flow state and permissions
- **State Managed:**
  - `currentStep: OnboardingStep` - Current onboarding step
  - `completedSteps: OnboardingStep[]` - Steps completed
  - `cameraPermissionGranted: boolean`
  - `notificationPermissionGranted: boolean`
  - `hasCompletedFirstScan: boolean`
  - `hasSeenTour: boolean`
- **Actions:** Step management, permission tracking
- **Persistence:** None (session-only)
- **Purpose:** Legitimate use case (transient onboarding state)

#### 3. **uiStore** (`src/stores/uiStore.ts` - 82 lines)
- **Purpose:** Global UI state (loading, snackbars, modals, scanner)
- **State Managed:**
  - `isGlobalLoading: boolean` + `loadingMessage: string | null`
  - `snackbars: Snackbar[]` - Toast notifications
  - `activeBottomSheet: BottomSheet | null` - Modal management
  - `isScannerActive: boolean` - Scanner state
- **Actions:** Show/dismiss snackbars, bottom sheets, loading states
- **Persistence:** None (UI state is transient)
- **Purpose:** Legitimate use case (cross-cutting UI concerns)

#### 4. **settingsStore** (`src/stores/settingsStore.ts` - 60 lines)
- **Purpose:** Global app settings (AI provider, theme, notifications)
- **State Managed:**
  - `preferredAIProvider: AIProvider` - User's AI preference
  - `adminAIProvider?: AIProvider` - Admin override
  - `theme: 'light' | 'dark' | 'auto'`
  - `notificationsEnabled: boolean`
- **Persistence:** YES - AsyncStorage via Zustand persist middleware
- **Purpose:** Legitimate use case (persistent app settings)
- **Issue:** Theme duplicated in preferencesStore

#### 5. **preferencesStore** (`src/stores/preferencesStore.ts` - 67 lines)
- **Purpose:** User preferences (display, sorting, notifications)
- **State Managed:**
  - `theme: Theme` - **DUPLICATE with settingsStore**
  - `showSimplifiedViews: boolean`
  - `scanHistorySortOrder: SortOrder`
  - `showScanTutorial: boolean`
  - `enablePushNotifications: boolean` - **POTENTIAL DUPLICATE with settingsStore**
  - `enableScanReminders: boolean`
- **Persistence:** YES - AsyncStorage via Zustand persist middleware
- **Purpose:** Legitimate, but overlaps with settingsStore

#### 6. **chatContextStore** (`src/stores/chatContextStore.ts` - 103 lines)
- **Purpose:** FreshiesAI conversation context
- **State Managed:**
  - `activeChildProfile?: ChildProfile` - **POTENTIAL DUPLICATE with ChildProfileContext**
  - `lastScannedProduct?: ProductData`
  - `currentRoutineProducts: ProductWithFlags[]`
  - `conversationHistory: ConversationMessage[]` (last 10)
  - `recentConcerns: string[]` (last 5)
- **Actions:** Add messages, set context, clear history
- **Persistence:** None (conversation state is transient)
- **Purpose:** Legitimate use case (AI chat context)
- **Issue:** Duplicates child profile from ChildProfileContext

---

## Duplication Analysis

### 🔴 CRITICAL: AuthContext ↔ authStore

**Overlap:**
- Both store `userId`, `userRole`, `profile`
- Both have `clearAuth()` functionality
- AuthContext syncs TO authStore (lines 26, 103, 108, 129 in AuthContext.tsx)

**Unique to authStore:**
- `currentFamily` / `currentFamilyId` - Family context for multi-family users
- `selectedChildId` / `selectedChildProfile` - Parent viewing child perspective

**Current Sync Pattern:**
```typescript
// AuthContext.tsx line 103
setAuthStoreUser(userId, role, data);

// AuthContext.tsx line 129
useAuthStore.getState().clearAuth();
```

**Problems:**
1. **Unidirectional sync** - AuthContext writes to authStore, but authStore changes don't sync back
2. **Race conditions** - State can be inconsistent between the two sources
3. **Confusion** - Developers don't know which source of truth to use
4. **Low adoption** - authStore only used in 4 files despite duplication

**Files Using authStore:**
- `src/contexts/AuthContext.tsx` - Syncs data to it
- `src/stores/index.ts` - Exports it
- `src/stores/authStore.ts` - Defines it
- `src/components/navigation/PageHeader.tsx` - Actually uses it (2 occurrences)

### 🟡 MODERATE: settingsStore ↔ preferencesStore

**Overlap:**
- Both have `theme` setting
- Both have notification-related settings (enablePushNotifications vs notificationsEnabled)

**Unique to settingsStore:**
- AI provider preferences (preferredAIProvider, adminAIProvider)

**Unique to preferencesStore:**
- Display preferences (showSimplifiedViews, scanHistorySortOrder)
- Tutorial flags (showScanTutorial)
- Specific notification types (enableScanReminders)

**Problems:**
1. **No clear separation** - Settings vs Preferences is ambiguous
2. **Theme duplication** - Both stores manage theme independently
3. **Notification confusion** - Two boolean flags for similar purposes

### 🟡 MODERATE: ChildProfileContext ↔ chatContextStore

**Overlap:**
- Both store child profile data
- chatContextStore has `activeChildProfile: ChildProfile`
- ChildProfileContext has `childProfile: ChildProfile`

**Unique to ChildProfileContext:**
- Goals management
- Profile CRUD operations
- Loading/error states
- Database sync

**Unique to chatContextStore:**
- Last scanned product
- Routine products
- Conversation history
- Recent concerns

**Problems:**
1. **Duplication** - Child profile stored in both places
2. **Sync risk** - No synchronization mechanism between them
3. **Unclear intent** - When to use which?

---

## Usage Statistics

### Context API Usage

```
useAuth():          74 files (PRIMARY AUTH SOURCE)
useChildProfile():  27 files (CHILD-SPECIFIC FEATURES)
```

**High adoption** - Context API is the established pattern in this codebase.

### Zustand Store Usage

```
useAuthStore:       4 files only (1 actual usage, 3 internal)
useOnboardingStore: Not measured (likely <10 files)
useUIStore:         Not measured (likely cross-cutting, 10-20 files)
useSettingsStore:   Not measured (likely 5-15 files)
usePreferencesStore: Not measured (likely 5-15 files)
useChatContextStore: Not measured (likely 3-8 files for AI features)
```

**Mixed adoption** - Zustand stores introduced later, uneven usage.

---

## Architectural Issues

### Issue 1: No Clear Pattern

**Problem:**
- Some state in Context (auth, child profile)
- Some state in Zustand (settings, UI)
- No documented decision framework

**Impact:**
- Developers guess which to use
- Inconsistent patterns across features
- Duplication when uncertainty arises

### Issue 2: Unidirectional Sync

**Problem:**
- AuthContext syncs to authStore
- authStore changes don't propagate back
- One-way data flow creates inconsistency

**Example:**
```typescript
// If code updates authStore directly:
useAuthStore.getState().setUser(userId, role, profile);

// AuthContext doesn't know about it
// Two sources of truth diverge
```

### Issue 3: Abandoned Migration

**Evidence:**
- authStore was created (likely for migration)
- Only 1 file actually uses it (PageHeader.tsx)
- Migration never completed
- Old Context system still dominates (74 files)

**Timeline:**
1. Started with Context API (AuthContext, ChildProfileContext)
2. Decided to introduce Zustand (authStore created)
3. Added sync code to maintain compatibility
4. Migration stalled
5. New Zustand stores added (settings, UI, preferences)
6. Pattern became inconsistent

### Issue 4: Feature-Driven Duplication

**Pattern:**
- New feature needs state (e.g., AI chat)
- Developer uncertain: Context or Zustand?
- Creates new store with overlapping concerns (chatContextStore duplicates child profile)
- Duplication compounds

---

## Consolidation Recommendations

### Option A: Full Context API (Conservative)

**Description:** Remove Zustand entirely, consolidate into Context

**Pros:**
- Matches current codebase reality (74 files already use Context)
- Minimal migration (only 4 files use authStore)
- Single, clear pattern
- React idiomatic

**Cons:**
- Lose Zustand benefits (persistence, DevTools, simplicity)
- settingsStore/preferencesStore persistence would need manual AsyncStorage
- More boilerplate for new state

**Effort:** Low (1-2 days)

**Recommendation:** ❌ Not recommended - Loses valuable Zustand features

---

### Option B: Full Zustand Migration (Aggressive)

**Description:** Remove Context, migrate everything to Zustand

**Pros:**
- Modern, lightweight
- Built-in persistence (settingsStore pattern)
- Zustand DevTools
- Simpler selectors (no `useContext` boilerplate)
- No Provider wrapping needed

**Cons:**
- High migration cost (74 files using `useAuth()`)
- Risk of breaking auth flows
- React Query + Zustand might be better for server state
- Large PR, high risk

**Effort:** High (1-2 weeks, high risk)

**Recommendation:** ❌ Not recommended - Too risky, not worth disruption

---

### Option C: Hybrid Pattern with Clear Rules (Pragmatic) ✅ RECOMMENDED

**Description:** Keep both, but define clear boundaries and eliminate duplication

**Pattern:**

#### Use Context for:
- **Authentication** (AuthContext)
  - Session management
  - User identity
  - Role determination
  - Auth state changes (Supabase listener)
- **Server-state-heavy features** (ChildProfileContext)
  - Data fetched from database
  - CRUD operations
  - Loading/error states
  - Features with complex data sync

#### Use Zustand for:
- **Client-side settings** (consolidate settingsStore + preferencesStore)
  - User preferences
  - Theme, AI provider, notifications
  - **Requires persistence**
- **UI state** (uiStore)
  - Snackbars, modals, loading indicators
  - **Transient, cross-cutting**
- **Feature-specific client state** (chatContextStore, onboardingStore)
  - **Transient, feature-scoped**
  - Conversation history, onboarding flow

**Decision Rule:**
```
Does state need to:
├─ Listen to Supabase auth changes? → Context (AuthContext)
├─ Fetch from database with CRUD? → Context (ChildProfileContext)
├─ Persist to AsyncStorage? → Zustand (with persist middleware)
├─ Control UI (modals, snackbars)? → Zustand (uiStore)
└─ Manage transient feature state? → Zustand (feature store)
```

**Consolidation Steps:**

1. **Eliminate authStore duplication:**
   - Remove `userId`, `userRole`, `profile` from authStore
   - Keep only `currentFamily`, `selectedChildId`, `selectedChildProfile`
   - Rename to `familyStore` (reflects actual purpose)
   - Update PageHeader.tsx to use `useAuth()` for role, `familyStore` for selectedChild

2. **Consolidate settings stores:**
   - Merge settingsStore + preferencesStore into single `settingsStore`
   - Single source of truth for theme, notifications, preferences
   - Keep persistence (AsyncStorage)

3. **Fix chatContextStore duplication:**
   - Remove `activeChildProfile` from chatContextStore
   - Use `useChildProfile()` hook instead
   - Keep other chat-specific state (scanned product, conversation history)

4. **Document the pattern:**
   - Add comments to each store/context explaining when to use
   - Update ARCHITECTURE.md or similar

**Pros:**
- Minimal disruption (works with existing code)
- Eliminates duplication without full rewrite
- Clear decision framework for future development
- Keeps best aspects of both approaches

**Cons:**
- Two patterns to understand (but with clear rules)
- Slight learning curve for new developers

**Effort:** Medium (3-5 days, low risk)

**Recommendation:** ✅ **RECOMMENDED** - Best balance of improvement vs risk

---

## Decision Matrix: Context vs Zustand

| Criteria | Use Context | Use Zustand |
|----------|-------------|-------------|
| **Needs Supabase listener** | ✅ YES | ❌ NO |
| **Database CRUD operations** | ✅ YES | ❌ NO |
| **Needs persistence** | ❌ NO (manual AsyncStorage) | ✅ YES (persist middleware) |
| **Cross-cutting UI state** | ❌ NO (Provider hell) | ✅ YES |
| **Server state** | ✅ YES (or React Query) | ❌ NO |
| **Client state** | ❌ Verbose | ✅ YES |
| **Transient feature state** | ❌ Overkill | ✅ YES |
| **Requires SSR** (N/A for RN) | ✅ YES | ❌ NO |
| **DevTools** | ⚠️ React DevTools | ✅ Zustand DevTools |
| **Boilerplate** | ⚠️ High (Provider, Context, hook) | ✅ Low (create + use) |

---

## Migration Strategy

### Phase 1: Eliminate authStore Duplication (1 day)

**Goal:** Remove duplicate auth state from authStore, rename to familyStore

**Steps:**

1. **Rename authStore to familyStore:**
   ```bash
   mv src/stores/authStore.ts src/stores/familyStore.ts
   ```

2. **Remove duplicate state:**
   ```typescript
   // Before (authStore.ts):
   interface AuthState {
     userId: string | null;  // ❌ Remove
     userRole: UserRole;     // ❌ Remove
     profile: Profile | null; // ❌ Remove
     currentFamily: Family | null; // ✅ Keep
     currentFamilyId: string | null; // ✅ Keep
     selectedChildId: string | null; // ✅ Keep
     selectedChildProfile: Profile | null; // ✅ Keep
   }

   // After (familyStore.ts):
   interface FamilyState {
     currentFamily: Family | null;
     currentFamilyId: string | null;
     selectedChildId: string | null;
     selectedChildProfile: Profile | null;

     setCurrentFamily: (family: Family | null) => void;
     setSelectedChild: (childId: string | null, childProfile: Profile | null) => void;
     clearFamily: () => void;
   }
   ```

3. **Remove sync code from AuthContext:**
   ```typescript
   // Remove lines 26, 103, 108, 129 from AuthContext.tsx
   // Delete all `setAuthStoreUser()` and `useAuthStore.getState().clearAuth()` calls
   ```

4. **Update PageHeader.tsx:**
   ```typescript
   // Before:
   const userRole = useAuthStore((state) => state.userRole);

   // After:
   const { userRole } = useAuth();
   const selectedChildId = useFamilyStore((state) => state.selectedChildId);
   ```

5. **Update exports:**
   ```typescript
   // src/stores/index.ts
   export { useFamilyStore } from './familyStore';
   ```

**Files to update:**
- `src/stores/authStore.ts` → `src/stores/familyStore.ts`
- `src/contexts/AuthContext.tsx` (remove sync code)
- `src/components/navigation/PageHeader.tsx` (update imports)
- `src/stores/index.ts` (update exports)

**Testing:**
- Login/logout flows
- Role-based routing
- Parent viewing child perspective (if implemented)

---

### Phase 2: Consolidate Settings Stores (1-2 days)

**Goal:** Merge settingsStore + preferencesStore into single store

**Steps:**

1. **Create consolidated settingsStore:**
   ```typescript
   // src/stores/settingsStore.ts (updated)
   interface SettingsState {
     // AI Settings
     preferredAIProvider: AIProvider;
     adminAIProvider?: AIProvider;

     // Display Settings
     theme: 'light' | 'dark' | 'auto';
     showSimplifiedViews: boolean;

     // Notifications
     enablePushNotifications: boolean;
     enableScanReminders: boolean;

     // Scan Preferences
     scanHistorySortOrder: 'recent' | 'alphabetical' | 'category';
     showScanTutorial: boolean;

     // Actions...
   }
   ```

2. **Migrate all preferencesStore usage:**
   ```bash
   # Find all files using preferencesStore
   grep -r "usePreferencesStore" app/ src/

   # Update imports:
   # Before:
   import { usePreferencesStore } from '../stores/preferencesStore';

   # After:
   import { useSettingsStore } from '../stores/settingsStore';
   ```

3. **Delete preferencesStore:**
   ```bash
   rm src/stores/preferencesStore.ts
   ```

4. **Update exports:**
   ```typescript
   // src/stores/index.ts
   // Remove: export { usePreferencesStore } from './preferencesStore';
   ```

**Files to update:**
- `src/stores/settingsStore.ts` (merge logic)
- All files using `usePreferencesStore()` (find with grep)
- `src/stores/index.ts` (update exports)
- Delete `src/stores/preferencesStore.ts`

**Testing:**
- Theme changes persist
- Notification settings work
- Scan tutorial toggle
- Sort order preferences

---

### Phase 3: Fix chatContextStore Duplication (1 day)

**Goal:** Remove child profile duplication from chatContextStore

**Steps:**

1. **Update chatContextStore:**
   ```typescript
   // Before:
   interface ChatContextState {
     activeChildProfile?: ChildProfile; // ❌ Remove
     lastScannedProduct?: ProductData; // ✅ Keep
     // ...
   }

   // After:
   interface ChatContextState {
     // Remove activeChildProfile entirely
     lastScannedProduct?: ProductData;
     currentRoutineProducts: ProductWithFlags[];
     conversationHistory: ConversationMessage[];
     recentConcerns: string[];
     // Actions...
   }
   ```

2. **Update getChatContext helper:**
   ```typescript
   // Before:
   export function getChatContext() {
     const state = useChatContextStore.getState();
     return {
       child_profile: state.activeChildProfile, // ❌ Remove
       // ...
     };
   }

   // After:
   export function getChatContext(childProfile?: ChildProfile) {
     const state = useChatContextStore.getState();
     return {
       child_profile: childProfile, // ✅ Pass as parameter
       last_scanned_product: state.lastScannedProduct,
       // ...
     };
   }
   ```

3. **Update AI service calls:**
   ```typescript
   // Before:
   const context = getChatContext();

   // After:
   const { childProfile } = useChildProfile(); // Get from Context
   const context = getChatContext(childProfile); // Pass explicitly
   ```

**Files to update:**
- `src/stores/chatContextStore.ts` (remove activeChildProfile)
- `src/services/ai/aiCareService.ts` (update getChatContext calls)
- Any other AI service files using getChatContext

**Testing:**
- FreshiesAI chat still includes child profile
- AI suggestions work correctly
- Conversation history persists during session

---

### Phase 4: Documentation (1 day)

**Goal:** Document the pattern for future developers

**Steps:**

1. **Add comments to each store:**
   ```typescript
   /**
    * Family Store
    *
    * PURPOSE: Manages family context and parent-child view switching
    *
    * WHEN TO USE:
    * - Parent viewing child's perspective
    * - Multi-family user context
    *
    * DO NOT USE FOR:
    * - User authentication (use AuthContext)
    * - Child profile data (use ChildProfileContext)
    */
   export const useFamilyStore = create<FamilyState>(...)
   ```

2. **Add comments to contexts:**
   ```typescript
   /**
    * AuthContext
    *
    * PURPOSE: User authentication and session management
    *
    * WHEN TO USE:
    * - Check if user is logged in
    * - Get user role (parent/child)
    * - Sign out
    * - Supabase session
    *
    * DO NOT USE FOR:
    * - UI state (use uiStore)
    * - User preferences (use settingsStore)
    * - Family context (use familyStore)
    */
   ```

3. **Create ARCHITECTURE.md section:**
   ```markdown
   ## State Management Pattern

   ### Context API (React Context)
   Use for:
   - Authentication (AuthContext)
   - Server state with CRUD (ChildProfileContext)

   ### Zustand
   Use for:
   - Persistent settings (settingsStore with persist)
   - UI state (uiStore)
   - Transient feature state (chatContextStore, onboardingStore)
   - Family context (familyStore)

   ### Decision Tree
   [Include decision matrix from this guide]
   ```

4. **Update this guide:**
   - Mark completed phases
   - Add "Current State After Migration" section

---

## Best Practices

### Do's ✅

1. **Use AuthContext for all authentication:**
   ```typescript
   const { user, userRole, loading, signOut } = useAuth();
   ```

2. **Use ChildProfileContext for child data:**
   ```typescript
   const { childProfile, goals, updateProfile } = useChildProfile();
   ```

3. **Use Zustand for settings with persistence:**
   ```typescript
   const { theme, setTheme } = useSettingsStore();
   ```

4. **Use Zustand for UI state:**
   ```typescript
   const { showSnackbar, dismissBottomSheet } = useUIStore();
   ```

5. **Add comments to new stores:**
   ```typescript
   /**
    * Feature Store
    * PURPOSE: [What this manages]
    * WHEN TO USE: [Clear criteria]
    * DO NOT USE FOR: [What to avoid]
    */
   ```

### Don'ts ❌

1. **Don't duplicate state between Context and Zustand:**
   ```typescript
   // ❌ Bad: Same data in two places
   const { userId } = useAuth();
   const userId2 = useAuthStore((s) => s.userId);
   ```

2. **Don't sync between Context and Zustand:**
   ```typescript
   // ❌ Bad: Manual sync creates race conditions
   const { user } = useAuth();
   useEffect(() => {
     userStore.setUser(user);
   }, [user]);
   ```

3. **Don't use Context for transient UI state:**
   ```typescript
   // ❌ Bad: Context overkill for UI flag
   <ModalContext.Provider value={{ isOpen, setIsOpen }}>

   // ✅ Good: Use Zustand
   const { activeBottomSheet, showBottomSheet } = useUIStore();
   ```

4. **Don't create store without clear purpose:**
   ```typescript
   // ❌ Bad: Generic "data" store
   const useDataStore = create((set) => ({
     data: {},
     setData: (data) => set({ data }),
   }));

   // ✅ Good: Specific purpose
   const useProductCacheStore = create((set) => ({
     cachedProducts: {},
     cacheProduct: (id, product) => ...
   }));
   ```

5. **Don't use Zustand for server state:**
   ```typescript
   // ❌ Bad: Duplicating database data
   const useProductsStore = create((set) => ({
     products: [],
     fetchProducts: async () => {
       const products = await supabase.from('products').select();
       set({ products });
     },
   }));

   // ✅ Good: Use Context with DB sync or React Query
   const { products, loading } = useProducts(); // Fetches from DB
   ```

---

## Summary

### Current Problems
1. ✅ **authStore duplicates AuthContext** (userId, userRole, profile)
2. ✅ **settingsStore ↔ preferencesStore overlap** (theme, notifications)
3. ✅ **chatContextStore duplicates ChildProfileContext** (activeChildProfile)
4. ✅ **No clear pattern** for when to use Context vs Zustand
5. ✅ **Abandoned migration** from Context to Zustand (authStore has 1 usage)

### Recommended Solution
**Option C: Hybrid Pattern with Clear Rules** ✅

- Keep Context for auth and server state
- Keep Zustand for settings, UI, and transient state
- Eliminate all duplication (authStore → familyStore, merge settings, fix chat store)
- Document clear decision framework

### Implementation Effort
- **Phase 1 (authStore):** 1 day
- **Phase 2 (settings):** 1-2 days
- **Phase 3 (chat):** 1 day
- **Phase 4 (docs):** 1 day
- **Total:** 4-5 days, low risk

### Migration Priority
1. **High:** Phase 1 (authStore) - Eliminates most critical duplication
2. **High:** Phase 2 (settings) - Simplifies persistent settings
3. **Medium:** Phase 3 (chat) - Fixes minor duplication
4. **Medium:** Phase 4 (docs) - Prevents future issues

---

**Next Steps:**
1. Review this guide with team
2. Get approval for Option C (Hybrid Pattern)
3. Execute Phase 1 (authStore → familyStore)
4. Execute Phase 2 (consolidate settings)
5. Execute Phase 3 (fix chat store)
6. Execute Phase 4 (documentation)
