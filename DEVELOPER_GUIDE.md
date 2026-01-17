# Freshies App - Developer Guide

> Complete architectural overview and developer reference for the Freshies React Native skincare app

**Last Updated**: January 2026
**Version**: 1.0.0
**Tech Stack**: React Native + Expo SDK 54 + TypeScript + Supabase

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Routing Architecture](#routing-architecture)
3. [State Management](#state-management)
4. [Key Services](#key-services)
5. [Authentication & Onboarding](#authentication--onboarding)
6. [Major Features](#major-features)
7. [Architecture Patterns](#architecture-patterns)
8. [Database Schema](#database-schema)
9. [Developer Quick Reference](#developer-quick-reference)

---

## Tech Stack

### Core Technologies
- **Framework**: Expo SDK 54 + React Native 0.81.5
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript 5.9.2
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Context API + Zustand stores
- **UI Icons**: Lucide React Native
- **AI Services**: OpenAI GPT-4, Anthropic Claude, Mistral (multi-provider)

### Key Dependencies
```json
{
  "expo": "~54.0.0",
  "react-native": "0.81.5",
  "expo-router": "~4.0.0",
  "@supabase/supabase-js": "^2.39.0",
  "zustand": "^4.4.7",
  "lucide-react-native": "^0.344.0"
}
```

---

## Routing Architecture

### File-Based Routing with Expo Router

The app uses **Expo Router's file-based routing** with route groups for role-based navigation.

#### Root Layout (`app/_layout.tsx`)

Wraps the entire app with core providers:

```typescript
<GestureHandlerRootView style={{ flex: 1 }}>
  <AuthProvider>
    <ChildProfileProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ChildProfileProvider>
  </AuthProvider>
</GestureHandlerRootView>
```

**Configuration:**
- Ignores style files: `**/*-styles.tsx`
- Ignores API routes: `**/api/**/*`
- Initial route name: `(auth)`

#### Entry Point Logic (`app/index.tsx`)

Role-based routing on app launch:

```typescript
if (session && userRole) {
  if (userRole === 'child') {
    return <Redirect href="/(child)/(tabs)/home" />
  } else if (userRole === 'parent') {
    return <Redirect href="/(parent)/(tabs)/home" />
  }
} else {
  return <Redirect href="/(auth)/welcome" />
}
```

### Route Groups

#### **(auth)** - Authentication
- `welcome.tsx` - Landing page
- `login.tsx` - Email/password login
- `signup.tsx` - New account creation
- `callback.tsx` - OAuth callback
- `terms-acceptance.tsx` - Privacy policy

#### **(onboarding)** - User Onboarding

**Parent Flow:**
```
parent-welcome → parent-profile → parent-success
```

**Child Flow:**
```
child-welcome → child-profile → child-dob → child-connect →
child-pending → child-approved → [age-specific] → child-success
```

**Age-Specific Paths:**
- `tween/` (10-12 years)
- `teen/` (13-15 years)
- `older-teen/` (16-18 years)

#### **(child)** - Child Interface

**Tab Navigation** (`(tabs)/_layout.tsx`):
- `home.tsx` - Dashboard
- `scan.tsx` - Product scanning
- `routine.tsx` - Routines
- `shelf.tsx` - Product library
- `history.tsx` - Activity history (hidden from tab bar)

**Modal Screens:**
- Profile: `account.tsx`, `edit-profile.tsx`, `avatar-selector.tsx`
- Products: `freshie-gallery.tsx`, `approved-products.tsx`
- Collections: `collections.tsx`, `collection/[id].tsx`, `create-collection.tsx`
- Routines: `routines.tsx`, `routine-builder.tsx`, `routine-templates.tsx`
- Learning: `learn/[id].tsx`, `learn/ingredients.tsx`
- Gamification: `achievements-enhanced.tsx`, `progress.tsx`
- Settings: `notification-settings.tsx`, `reminder-settings.tsx`

#### **(parent)** - Parent Interface

**Tab Navigation:**
- `home.tsx` - Dashboard
- `learn.tsx` - Learning resources
- `scan.tsx` - Product scanning
- `routine.tsx` - Routine management
- `shelf.tsx` - Product library

**Modal Screens:**
- `account.tsx` - Account settings
- `family/index.tsx` - Family management
- `family/add-child.tsx` - Add child
- `approvals/index.tsx` - Approval queue
- `approvals/[id].tsx` - Review approval

#### **(shared)** - Shared Routes
- `products/index.tsx` - Product catalog
- `product-result.tsx` - Product details

#### Standalone Routes
- `freshies-chat.tsx` - AI chat
- `search.tsx` - Global search
- `notifications/index.tsx` - Notifications

---

## State Management

### React Contexts (Global App State)

#### AuthContext (`src/contexts/AuthContext.tsx`)

**Purpose**: Core authentication and session management

**State:**
```typescript
{
  session: Session | null
  user: User | null
  userRole: 'parent' | 'child' | 'admin' | null
  onboardingCompleted: boolean
  loading: boolean
}
```

**Key Functions:**
```typescript
signOut(): Promise<void>
refreshSession(): Promise<void>
```

**When to use:**
- Checking if user is authenticated
- Getting current user ID/email
- Determining user role for navigation
- Logging out

**Example:**
```typescript
import { useAuth } from '@/contexts/AuthContext'

const { user, userRole, loading } = useAuth()

if (loading) return <LoadingScreen />
if (!user) return <LoginScreen />
if (userRole === 'parent') return <ParentDashboard />
```

#### ChildProfileContext (`src/contexts/ChildProfileContext.tsx`)

**Purpose**: Child profile data and skincare goals

**State:**
```typescript
{
  childProfile: ChildProfile | null
  goals: ChildGoal[]
  loading: boolean
  error: string | null
  isChildMode: boolean
}
```

**Key Functions:**
```typescript
refreshProfile(): Promise<void>
updateProfile(updates: Partial<ChildProfile>): Promise<void>
addGoal(goalType: string, priority: number): Promise<void>
removeGoal(goalId: string): Promise<void>
updateGoal(goalId: string, updates: Partial<ChildGoal>): Promise<void>
```

**When to use:**
- Displaying child's name, avatar, age
- Accessing skin profile (skin type, concerns)
- Managing skincare goals
- Checking if in child mode

**Example:**
```typescript
import { useChildProfile } from '@/contexts/ChildProfileContext'

const { childProfile, goals, updateProfile } = useChildProfile()

const updateSkinType = async (skinType: string) => {
  await updateProfile({ skin_type: skinType })
}
```

### Zustand Stores (Feature-Specific State)

#### familyStore (`src/stores/familyStore.ts`)

**Purpose**: Family context and parent-child view switching

```typescript
{
  currentFamily: Family | null
  currentFamilyId: string | null
  selectedChildId: string | null
  selectedChildProfile: ChildProfile | null
}
```

**When to use:**
- Parent viewing specific child's perspective
- Multi-family user context

**Do NOT use for:**
- User authentication (use AuthContext)
- Child profile data (use ChildProfileContext)

#### preferencesStore (`src/stores/preferencesStore.ts`)

**Purpose**: User preferences and settings (persisted to AsyncStorage)

```typescript
{
  // Display
  theme: 'light' | 'dark' | 'auto'
  showSimplifiedViews: boolean

  // Scan settings
  scanHistorySortOrder: 'recent' | 'alphabetical' | 'category'
  showScanTutorial: boolean

  // Notifications
  enablePushNotifications: boolean
  enableScanReminders: boolean

  // AI Provider
  preferredAIProvider: AIProvider
  adminAIProvider?: AIProvider
}
```

**When to use:**
- Theme preferences
- Tutorial flags
- Notification settings
- AI provider configuration

**Example:**
```typescript
import { usePreferencesStore } from '@/stores'

const { theme, setTheme } = usePreferencesStore()
```

#### chatContextStore (`src/stores/chatContextStore.ts`)

**Purpose**: FreshiesAI chat conversation context

```typescript
{
  lastScannedProduct?: ProductData
  currentRoutineProducts: ProductWithFlags[]
  conversationHistory: ConversationMessage[] // last 10
  recentConcerns: string[] // last 5
}
```

**Key Functions:**
```typescript
setLastScannedProduct(product?: ProductData)
setCurrentRoutineProducts(products: ProductWithFlags[])
addMessage(role: 'user' | 'assistant', content: string)
clearAllContext()
```

**Helper:**
```typescript
getChatContext() // Returns full context object for AI calls
```

**When to use:**
- Providing context to AI chat
- Tracking conversation history
- Linking scanned products to chat

**Do NOT use for:**
- Child profile (use ChildProfileContext)

#### onboardingStore (`src/stores/onboardingStore.ts`)

**Purpose**: Onboarding flow progress tracking

```typescript
{
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  cameraPermissionGranted: boolean
  notificationPermissionGranted: boolean
  hasCompletedFirstScan: boolean
  hasSeenTour: boolean
}
```

#### uiStore (`src/stores/uiStore.ts`)

**Purpose**: Global UI state and modals

```typescript
{
  isGlobalLoading: boolean
  loadingMessage: string | null
  snackbars: Snackbar[]
  activeBottomSheet: BottomSheet | null
  isScannerActive: boolean
}
```

**Key Functions:**
```typescript
showSnackbar(message: string, type: 'success' | 'error' | 'info', duration?: number)
showBottomSheet(content: React.ReactNode, height?: number)
setGlobalLoading(loading: boolean, message?: string)
```

**Example:**
```typescript
import { useUIStore } from '@/stores'

const { showSnackbar } = useUIStore()
showSnackbar('Product added!', 'success', 3000)
```

---

## Key Services

> **Note**: The Freshies app uses a **module-based architecture**. All services are organized into 15 feature modules located in `src/modules/`. Each module has a barrel export (`index.ts`) for clean imports.

### Module Structure Overview

```
src/modules/
├── identity/                # Module 1: User auth & household
├── product-discovery/       # Module 2: Scanning & finding products
├── product-library/         # Module 3: Shelf, usage, wishlist
├── safety/                  # Module 4: Safety scoring
├── ingredients/             # Module 5: Ingredient database
├── routines/                # Module 6: Skincare routines
├── outcomes/                # Module 7: Reaction tracking (future)
├── recommendations/         # Module 8: AI recommendations
├── gamification/            # Module 9: Achievements & streaks
├── learning/                # Module 10: Educational content
├── notifications/           # Module 11: Reminders & alerts
├── parent-controls/         # Module 12: Approvals & family
├── admin/                   # Module 13: Admin tools
├── settings/                # Module 14: User preferences
└── subscription/            # Module 15: Billing (future)
```

**Import Pattern:**
```typescript
// ✅ New module imports
import { routineService } from '@/modules/routines'
import { shelfService } from '@/modules/product-library'
import { achievementService } from '@/modules/gamification'

// ❌ Old flat imports (deprecated)
import { routineService } from '@/services/routineService'
```

### AI & Recommendation Services (Module 8)

#### careSuggestions (`src/modules/recommendations/careSuggestions.ts`)

**Purpose**: Main orchestration layer for all AI tools

**Architecture:**
- Multi-provider support: OpenAI, Claude, Mistral
- Automatic fallback on provider failure
- Configurable via settings or prompt templates
- Logging and error handling

**Core Functions:**

**1. Product Analysis**
```typescript
analyseProductForChild(
  product: ProductData,
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<AnalyseIngredientsOutput>
```

Returns:
```typescript
{
  normalized_ingredients: NormalizedIngredient[]
  safety_flags: ProductFlag[]
  overall_safety_score: number
  age_appropriate: boolean
  comedogenic_rating: number
  allergen_warnings: string[]
}
```

**2. Parent Summary**
```typescript
getProductSummaryForParent(
  product: ProductData,
  usageContext: string,
  ingredients: NormalizedIngredient[],
  flags: ProductFlag[],
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<SummariseRiskOutput>
```

Returns parent-friendly risk summary and recommendations.

**3. Routine Assessment**
```typescript
assessRoutineForChild(
  routine: CustomRoutine,
  childProfile: ChildProfile,
  options?: AIOptions
): Promise<AssessRoutineOutput>
```

Evaluates complete routine for safety and effectiveness.

**4. Routine Proposal**
```typescript
proposeRoutineForChild(
  childProfile: ChildProfile,
  goals: string[],
  availableProducts?: ProductData[],
  budget?: number,
  options?: AIOptions
): Promise<ProposeRoutineOutput>
```

AI-generated routine recommendations.

**5. Parent Coaching**
```typescript
coachParent(
  question: string,
  childProfile: ChildProfile,
  context?: CoachingContext,
  options?: AIOptions
): Promise<CoachParentOutput>
```

Answer parent questions about skincare.

**Provider Selection:**
1. Explicit `options.provider`
2. Prompt template configuration
3. `preferencesStore` setting
4. Auto-select based on available API keys

#### guidedRoutineService (`src/services/ai/guidedRoutineService.ts`)

**Purpose**: Conversational routine builder for kids

**Flow:**
```typescript
1. startGuidedRoutine(segment, childProfile) → GuidedRoutineState
2. processGoals(state, selectedGoals) → Updated state
3. processConcerns(state, concerns) → Updated state
4. generateRoutineSuggestions(state, availableTime, childProfile) → Suggested routine
5. askFollowUp(state, userMessage, childProfile) → Answer + updated state
```

**State:**
```typescript
{
  segment: 'morning' | 'afternoon' | 'evening'
  currentStep: 'goals' | 'concerns' | 'time' | 'review' | 'customize'
  goals: string[]
  concerns: string[]
  availableTime: number
  suggestedSteps: SuggestedStep[]
  conversationHistory: ConversationMessage[]
}
```

### Product Discovery Services (Module 2)

#### productsService (`src/modules/product-discovery/productsService.ts`)

**Key Functions:**

**Browse & Search:**
```typescript
getPopularProducts(): ProductDetail[]
getProductsByFilter(filter: string): ProductDetail[]
searchProducts(query: string): ProductDetail[]
getProductById(id: string): ProductDetail | undefined
```

**Child Products:**
```typescript
getChildProducts(childId: string, status?: string): ChildProduct[]
logProductUsage(childId: string, childProductId: string): boolean
removeChildProduct(childProductId: string): boolean
```

**Product Structure:**
```typescript
{
  id, name, brand, category
  imageUrl, description
  safetyScore: number // 0-100
  safetyTier: 'A' | 'B' | 'C' | 'D' | 'E'
  barcode, formFactor, targetAge
  benefits, concerns, aiSummary
}
```

### Ingredient Services (Module 5)

#### ingredientsService (`src/modules/ingredients/ingredientsService.ts`)

**Features:**
- COSING database integration (EU ingredient registry)
- Safety scoring per ingredient
- Age-appropriate restrictions
- Allergen detection
- Comedogenic ratings

#### OCR Scanner (`src/modules/product-discovery/ocr/ingredientScanner.ts`)

**Functions:**
```typescript
extractTextFromImage(imageUri: string): Promise<OCRResult>
parseIngredients(text: string): string[]
createSearchQueryFromIngredients(ingredients: string[]): string
extractProductName(text: string): string | null
```

Uses Google Cloud Vision API to extract and parse ingredient lists from photos.

### Routine Services (Module 6)

#### routineService (`src/modules/routines/routineService.ts`)

**Pattern**: Uses Result type for explicit error handling

**CRUD Operations:**
```typescript
createRoutine(routine: CustomRoutineInput): Result<CustomRoutine>
getRoutines(childProfileId: string): Result<CustomRoutine[]>
getActiveRoutine(childProfileId: string, segment: string): Result<CustomRoutine | null>
updateRoutine(routineId: string, updates: Partial<CustomRoutine>): Result<void>
deleteRoutine(routineId: string): Result<void>
```

**Activation:**
```typescript
setActiveRoutine(
  childProfileId: string,
  routineId: string,
  segment: 'morning' | 'afternoon' | 'evening'
): Result<void>
```

Deactivates all other routines for that segment, then activates the selected one.

**Completion:**
```typescript
completeRoutine(
  routineId: string,
  childProfileId: string,
  completionData: {
    steps_completed: number
    total_time: number
    notes?: string
  }
): Result<RoutineCompletion>
```

**XP Calculation:**
```typescript
xp_earned = steps_completed * 10 + Math.floor(total_time / 60) * 5
```

**Scheduling:**
```typescript
updateActiveDays(routineId: string, activeDays: number[]): Result<void>
// activeDays: [0=Monday, 1=Tuesday, ..., 6=Sunday]

getRoutinesForToday(childProfileId: string): Result<CustomRoutine[]>
```

#### completionService (`src/modules/routines/completionService.ts`)

**Functions:**
- Completion logging
- Streak calculation
- Historical statistics
- Calendar view data

**Note:** Previously named `routineHistoryService.ts`

#### schedulerService (`src/modules/routines/schedulerService.ts`)

**Features:**
- Time-based notifications
- Streak preservation alerts
- Smart scheduling (avoids school/sleep hours)

**Default Times:**
- Morning: 7-9 AM
- Afternoon: 3-5 PM
- Evening: 8-10 PM

**Note:** Previously named `routineNotificationScheduler.ts`

### Gamification Services (Module 9)

#### achievementService (`src/modules/gamification/achievementService.ts`)

**Achievement Management:**
```typescript
getAllAchievements(): Achievement[]
getUserAchievements(childProfileId: string): UserAchievement[]
updateProgress(childProfileId: string, achievementId: string, progress: number): UserAchievement | null
unlockAchievement(childProfileId: string, achievementId: string): boolean
```

**Auto-checking:**
```typescript
checkAchievements(
  childProfileId: string,
  action: {
    type: 'routine_completed' | 'product_scanned' | 'lesson_completed' | 'friend_added' | 'streak_maintained'
    value?: number
  }
): UserAchievement[] // Returns newly unlocked achievements
```

**Leaderboard:**
```typescript
getLeaderboard(timeframe: 'weekly' | 'monthly' | 'all'): LeaderboardEntry[]
```

**Stats:**
```typescript
getAchievementStats(childProfileId: string): {
  total_unlocked: number
  total_points: number
  completion_percentage: number
  rarity_breakdown: Record<AchievementRarity, number>
}
```

**Categories:**
- `routine` - Routine completion milestones
- `products` - Scanning achievements
- `learning` - Educational content
- `social` - Family engagement
- `special` - Rare/hidden achievements

**Rarity Levels:**
- `common` (10-25 points)
- `rare` (50-100 points)
- `epic` (100-200 points)
- `legendary` (200+ points)

#### streakService (`src/modules/gamification/streakService.ts`)

**Features:**
- Consecutive day tracking
- Streak freeze (1 per week)
- Milestone celebrations
- Recovery grace period (6 hours into next day)

**Calculation:**
```typescript
// Pseudocode
1. Get all completions ordered by date DESC
2. If last completion is today, streak = 1
3. Loop through completions:
   - If day difference is 1, increment streak
   - Else, break
4. Return current_streak
```

### Parent Controls Services (Module 12)

#### familyService (`src/modules/parent-controls/familyService.ts`)

**Family Setup:**
```typescript
getOrCreateFamilyGroup(parentId: string): FamilyGroup | null
```

**Child Management:**
```typescript
getChildren(parentId: string): ChildProfile[]
addChild(parentId: string, childData: ChildInput): Child | null
updateChild(childId: string, updates: Partial<Child>): boolean
deleteChild(childId: string): boolean
getChildById(childId: string): ChildProfile | null
```

**Permissions:**
```typescript
getChildPermissions(childId: string): ChildPermissions | null
updateChildPermissions(childId: string, permissions: Partial<ChildPermissions>): boolean
```

**Child Permissions Structure:**
```typescript
{
  can_scan_without_approval: boolean
  can_add_to_routine: boolean
  can_search_products: boolean
  can_view_ingredients: boolean
  can_access_learn: boolean
  can_chat_with_ai: boolean
  requires_approval_for_flagged: boolean
  max_daily_scans?: number
}
```

**Age-Based Defaults:**
```typescript
age < 10:
  - can_scan_without_approval: false
  - can_add_to_routine: false
  - can_chat_with_ai: false
  - max_daily_scans: 10

age 10-12:
  - can_scan_without_approval: false
  - can_add_to_routine: true

age 13+:
  - can_scan_without_approval: true (unless flagged)
  - can_add_to_routine: true
  - can_chat_with_ai: true
```

**Invitations:**
```typescript
generateChildInvitation(parentId: string, childEmail?: string): ChildInvitation | null
// Generates 6-digit code, expires in 7 days
```

#### approvalService (`src/modules/parent-controls/approvalService.ts`)

**Queue Management:**
```typescript
getPendingApprovals(parentId: string): ApprovalWithDetails[]
getChildApprovals(childId: string, status?: string): ApprovalWithDetails[]
getApprovalStats(parentId: string): ApprovalStats
```

**Actions:**
```typescript
approveProduct(action: ApprovalAction): boolean
// - Updates approval status
// - Adds to child's product library
// - Optionally adds to routine
// - Sends notification to child
// - Creates approval history

declineProduct(action: ApprovalAction): boolean
// - Updates status
// - Sends notification with reason
```

**Creation:**
```typescript
createApprovalRequest(childId: string, parentId: string, productData: ProductData): string | null
addProductFlags(approvalId: string, flags: ProductFlag[]): boolean
```

**Approval Workflow:**
```
1. Child scans product
2. System analyzes and flags if needed
3. Creates ProductApproval record
4. Parent receives notification
5. Parent reviews in approval queue
6. Parent approves/declines with notes
7. Child receives notification
8. If approved, product added to library
```

### Complete Module Reference

Here's a comprehensive list of all 15 modules and their key services:

| Module | Location | Key Services | Description |
|--------|----------|--------------|-------------|
| **1. Identity** | `src/modules/identity/` | `familyCircleService` | User auth, household management, family circle sharing |
| **2. Product Discovery** | `src/modules/product-discovery/` | `productsService`, barcode scanners, OCR, AI vision | Product scanning and identification |
| **3. Product Library** | `src/modules/product-library/` | `shelfService`, `usageService`, `wishlistService` | Personal product shelf and collections |
| **4. Safety** | `src/modules/safety/` | `calculator`, `safetyService`, `warningsService` | Fresh score calculation and safety warnings |
| **5. Ingredients** | `src/modules/ingredients/` | `ingredientsService` | COSING database and ingredient analysis |
| **6. Routines** | `src/modules/routines/` | `routineService`, `templateService`, `completionService`, `schedulerService` | Skincare routine builder and tracking |
| **7. Outcomes*** | `src/modules/outcomes/` | *(future)* | Reaction tracking and outcome monitoring |
| **8. Recommendations** | `src/modules/recommendations/` | `routineSuggestions`, `careSuggestions`, `templateGeneration` | AI-powered product and routine recommendations |
| **9. Gamification** | `src/modules/gamification/` | `achievementService`, `streakService`, `pointsService` | Achievements, streaks, XP, and leveling |
| **10. Learning** | `src/modules/learning/` | `aiTools`, `database`, `contentFetcher`, `pipelineOrchestrator` | Educational content pipeline |
| **11. Notifications** | `src/modules/notifications/` | `notificationService`, `expiryService` | Push notifications and reminders |
| **12. Parent Controls** | `src/modules/parent-controls/` | `approvalService`, `familyService` | Parental approval workflows |
| **13. Admin** | `src/modules/admin/` | `aiManagement`, `contentManagement`, `featureManagement` | Admin tools and configuration |
| **14. Settings** | `src/modules/settings/` | `preferencesStore` | User preferences and app settings |
| **15. Subscription*** | `src/modules/subscription/` | *(future)* | Subscription and billing management |

*\* Placeholder modules for future implementation*

**Quick Import Reference:**
```typescript
// Module imports (new pattern)
import { routineService, templateService } from '@/modules/routines'
import { shelfService, wishlistService } from '@/modules/product-library'
import { achievementService, streakService } from '@/modules/gamification'
import { familyService, approvalService } from '@/modules/parent-controls'
import { notificationService } from '@/modules/notifications'
```

---

## Authentication & Onboarding

### User Roles

Three roles stored in `profiles.role`:
- **`parent`** - Full control, family management, approvals
- **`child`** - Restricted access, gamified experience
- **`admin`** - System administration (future)

### Authentication Methods

#### 1. Email/Password
- Supabase Auth with email verification
- Password strength requirements
- Email confirmation before login
- Magic link option available

#### 2. Apple Sign In (iOS)
- Native authentication
- Automatic email retrieval
- Fallback to manual email if not provided

### Session Management

**Supabase Configuration:**
```typescript
{
  auth: {
    storage: ExpoSecureStoreAdapter, // iOS device
    // AsyncStorage for simulator
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
}
```

**Session Flow:**
1. User authenticates
2. Supabase creates session token
3. Token stored in SecureStore/AsyncStorage
4. AuthContext fetches user role from `profiles`
5. Auto-refresh every 60 minutes
6. Auth state listener triggers on changes

### Onboarding Flows

#### Parent Onboarding

```
1. Role Selection → Select "Parent"
2. Parent Welcome → Introduction to features
3. Parent Profile → Name, avatar, number of children
4. Parent Success → Complete, navigate to dashboard
```

**After Onboarding:**
- Parent can add children
- Generate invite codes
- Set initial permissions

#### Child Onboarding

```
1. Role Selection → Select "Child"
2. Child Welcome → Introduction to app
3. Child Profile → Display name, avatar
4. Date of Birth → Age verification (COPPA compliance)
5. Connection → Enter parent email or invite code
6. Pending → Wait for parent approval
7. Approved → Parent has approved connection
8. Age-Specific Onboarding:
   - Tween (10-12): Simplified skin profile
   - Teen (13-15): Full skin profile
   - Older Teen (16-18): Advanced options
9. Child Success → Complete, navigate to dashboard
```

**Age-Specific Content:**

**Tween (10-12):**
- Simplified goals (clean, hydrate, protect)
- Limited product categories
- Heavy parent oversight

**Teen (13-15):**
- Comprehensive skin profile
- All product categories
- Moderate parent oversight
- Acne/puberty focus

**Older Teen (16-18):**
- Advanced skincare options
- More autonomy
- Anti-aging prevention options

### Parent-Child Linking

**Child Side:**
1. Enter parent email during onboarding
2. Creates `managed_children` record with `status: 'pending'`
3. Wait for approval
4. Limited access until approved

**Parent Side:**
1. Receive notification
2. Review child's profile (name, age, avatar)
3. Approve or decline
4. Set initial permissions
5. Child gains full access

---

## Major Features

### Product Scanning & Analysis

#### Scanning Methods

**1. Barcode Scanning**
- Uses `expo-camera` with barcode detection
- Supported formats: UPC, EAN-13, EAN-8, Code128
- Real-time detection with visual overlay
- Haptic feedback on successful scan

**2. AI Vision Scanning**
- OpenAI GPT-4 Vision API
- Identifies product from photo
- Extracts brand, name, category
- Detects packaging type

**3. Ingredient OCR**
- Google Cloud Vision API
- Extracts text from ingredient list
- Parses and normalizes ingredients
- Creates search queries

#### Analysis Pipeline

```
1. Scan/capture product
2. Get product data (barcode lookup or AI ID)
3. Extract/fetch ingredient list
4. Run safety analysis (aiCareService.analyseProductForChild):
   - Flag age-inappropriate ingredients
   - Detect allergens
   - Check comedogenic rating
   - Assess sensitivity issues
5. Check approval requirements:
   - Age restrictions
   - Flagged ingredients
   - Parent guardrails
6. If approval needed:
   - Create approval request
   - Notify parent
   - Wait for decision
7. If approved or no approval needed:
   - Add to child's library
   - Option to add to routine
   - Create "Freshie" (saved product)
```

**Safety Flags:**
```typescript
{
  age_inappropriate: boolean
  allergen_detected: boolean
  comedogenic_high: boolean
  sensitivity_warning: boolean
  parent_banned_ingredient: boolean
  flagged_ingredients: Array<{
    name: string
    reason: string
    severity: 'info' | 'caution' | 'warning' | 'danger'
  }>
}
```

### Routine Building

#### Routine Builder

**Features:**
- Multi-segment (morning/afternoon/evening)
- Drag-and-drop step reordering
- Product assignment to steps
- Custom notes per step
- Time estimation
- Template selection
- Draft/active status

**Step Types:**
```typescript
'cleanser' | 'toner' | 'serum' | 'treatment' |
'moisturizer' | 'sunscreen' | 'mask' | 'exfoliant'
```

**Templates:**
- Age-appropriate
- Skin-type specific (oily, dry, combination, sensitive)
- Concern-based (acne, hydration, sensitivity)
- Seasonal variations
- Beginner/intermediate/advanced

#### Routine Execution

**Interactive Flow:**
```
1. Start routine from dashboard
2. Display current step with product photo
3. Show instructions and timer
4. User marks step complete
5. Progress to next step
6. Completion celebration
7. XP and achievement unlocks
```

**Completion Tracking:**
```typescript
{
  routine_id, child_profile_id
  completed_at: timestamp
  steps_completed: number
  total_steps: number
  total_time: number // seconds
  xp_earned: number
  notes?: string
}
```

**XP Calculation:**
```typescript
xp_earned = steps_completed * 10 + Math.floor(total_time / 60) * 5
```

#### Notifications

**Smart Scheduling:**
- Morning: 7-9 AM
- Afternoon: 3-5 PM
- Evening: 8-10 PM
- Avoids school hours (8 AM - 3 PM weekdays)
- Avoids late night (10 PM - 6 AM)

**Notification Types:**
- Daily reminder (scheduled time)
- Streak preservation (missed yesterday)
- Completion celebration (after finish)
- Weekly summary (achievements)

### FreshiesAI Chat

#### Architecture

**Components:**
- `useChat` hook - Conversation state management
- `MessageBubble` - Message display
- `ChatInput` - User input
- `ChatActionSheet` - Attachments (planned)

**Context Integration:**
```typescript
// From chatContextStore
{
  lastScannedProduct
  currentRoutineProducts
  conversationHistory // last 10 messages
  recentConcerns
}

// From ChildProfileContext
{
  skin_profile
  goals
  preferences
}
```

**AI Backend:**
- `coachParent` for parent questions
- `routeQuestion` for intelligent routing
- Multi-provider (OpenAI, Claude, Mistral)

**Features:**
- Conversational Q&A
- Product recommendations
- Ingredient explanations
- Routine advice
- Skin concern guidance
- Context-aware responses

### Achievements & Gamification

#### XP Sources

```typescript
Complete routine: 50 XP
Scan product: 25 XP
Complete quiz: 30 XP
Read article: 20 XP
Maintain streak: 10 XP/day
Share achievement: 15 XP
```

#### Leveling

```typescript
level = Math.floor(totalPoints / 100) + 1
```

**Unlocks per Level:**
- New avatar items
- Special badges
- Advanced routine templates
- Exclusive content
- Profile themes

#### Streaks

**Features:**
- Daily tracking
- Streak freeze (1 per week)
- Milestones (7, 30, 100, 365 days)
- Grace period (6 hours into next day)

**Leaderboard:**
- Family circle ranking
- Weekly/monthly/all-time views
- Points + level + achievements
- Avatar display
- Rank badges

---

## Architecture Patterns

### Service Layer Pattern

All business logic lives in `src/services/`:
- Services encapsulate database access
- No direct Supabase queries in components
- Services return typed data structures
- Consistent error handling

**Example:**
```typescript
// ❌ Don't do this in components
const { data } = await supabase.from('products').select('*')

// ✅ Do this
import { getProducts } from '@/services/productsService'
const products = await getProducts()
```

### Result Pattern

Used in critical services for explicit error handling:

```typescript
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error }

// Usage
const result = await createRoutine(routineData)
if (!result.ok) {
  showSnackbar(result.error.message, 'error')
  return
}
const routine = result.value
```

### Context + Hooks Pattern

- Global state in React Context
- Custom hooks for component logic
- Separation of concerns

**Example:**
```typescript
// Context provides state
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Hook provides logic
export function useProductScan() {
  const { childProfile } = useChildProfile()
  const { showSnackbar } = useUIStore()

  const scanProduct = async (barcode: string) => {
    // Business logic
  }

  return { scanProduct }
}
```

### Component Composition

- Small, reusable components
- Screen components compose feature components
- Shared UI in `src/components/ui/`

**Structure:**
```
src/components/
  ui/           # Shared UI components (Button, Card, etc.)
  navigation/   # Navigation components (TabBar, Header)
  product/      # Product-specific components
  routine/      # Routine-specific components
  chat/         # Chat components
  gamification/ # Achievement components
```

### Type Safety

- Comprehensive types in `src/types/`
- Strict TypeScript checking
- No `any` in production code
- Shared types across services

---

## Database Schema

### Key Tables

#### User & Profile
- `profiles` - User accounts (role, email, onboarding)
- `child_profiles` - Child data (skin profile, goals)
- `managed_children` - Parent-child relationships
- `family_groups` - Family organization

#### Products
- `products` - Product catalog
- `child_products` - Child's product library
- `product_approvals` - Approval queue
- `product_flags` - Safety warnings
- `ingredients` - Ingredient database (COSING)

#### Routines
- `custom_routines` - User-created routines
- `routine_completions` - Completion history
- `routine_steps` - Individual routine steps

#### Gamification
- `achievements` - Achievement definitions
- `user_achievements` - User progress
- `streaks` - Streak tracking
- `leaderboard` - Rankings

#### Permissions
- `child_permissions` - Permission settings
- `child_invitations` - Invite codes

### Row-Level Security (RLS)

**Policies:**
- Parents can only access their own children's data
- Children can only access their own data
- Products are public read
- Approvals enforce parent-child relationship
- Family data accessible only to family members

**Example Policy:**
```sql
-- Children can only see their own products
CREATE POLICY "child_products_select" ON child_products
FOR SELECT USING (
  auth.uid() = user_id
);

-- Parents can see their children's products
CREATE POLICY "parent_view_child_products" ON child_products
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM managed_children mc
    WHERE mc.child_id = child_products.user_id
    AND mc.parent_id = auth.uid()
    AND mc.status = 'approved'
  )
);
```

---

## Developer Quick Reference

### Adding a New Screen

1. Create file in appropriate route group:
```typescript
// app/(child)/new-screen.tsx
export default function NewScreen() {
  return <View>...</View>
}
```

2. Navigate to it:
```typescript
import { router } from 'expo-router'
router.push('/(child)/new-screen')
```

3. Add to tab navigator (if needed):
```typescript
// app/(child)/(tabs)/_layout.tsx
<Tabs.Screen
  name="new-screen"
  options={{ title: 'New Screen' }}
/>
```

### Adding State Management

**Global auth/user state:**
```typescript
// Use AuthContext or ChildProfileContext
import { useAuth } from '@/contexts/AuthContext'
const { user, userRole } = useAuth()
```

**Persisted settings:**
```typescript
// Use Zustand with persist
import { usePreferencesStore } from '@/stores'
const { theme, setTheme } = usePreferencesStore()
```

**Temporary UI state:**
```typescript
// Use uiStore or local useState
import { useUIStore } from '@/stores'
const { showSnackbar } = useUIStore()
```

### Calling AI Services

```typescript
import { analyseProductForChild } from '@/services/ai/aiCareService'

const result = await analyseProductForChild(
  product,
  childProfile,
  {
    provider: 'openai', // optional
    model: 'gpt-4o-mini' // optional
  }
)
```

### Database Queries

```typescript
import { supabase } from '@/lib/supabase'

// Select
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('field', value)

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value })

// Update
const { error } = await supabase
  .from('table_name')
  .update({ field: newValue })
  .eq('id', id)

// Delete
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

### Navigation

```typescript
import { router } from 'expo-router'

router.push('/path')        // Navigate forward
router.replace('/path')     // Replace current
router.back()               // Go back
router.push({               // With params
  pathname: '/path',
  params: { id: '123' }
})
```

### Showing Notifications

```typescript
import { useUIStore } from '@/stores'

const { showSnackbar } = useUIStore()
showSnackbar('Success!', 'success', 3000)
showSnackbar('Error occurred', 'error', 5000)
showSnackbar('Info message', 'info')
```

### Common Imports

```typescript
// Navigation
import { router, useLocalSearchParams } from 'expo-router'

// State
import { useAuth } from '@/contexts/AuthContext'
import { useChildProfile } from '@/contexts/ChildProfileContext'
import { useUIStore, usePreferencesStore } from '@/stores'

// Services
import { supabase } from '@/lib/supabase'
import { analyseProductForChild } from '@/services/ai/aiCareService'
import { getProducts } from '@/services/productsService'
import { createRoutine } from '@/services/routineService'

// UI
import { colors, spacing, radii } from '@/theme/tokens'
import { Button } from '@/components/ui/Button'
```

---

## Environment Variables

Required in `.env`:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
EXPO_PUBLIC_OPENAI_API_KEY=sk-xxx
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxx
EXPO_PUBLIC_MISTRAL_API_KEY=xxx

# Google Cloud
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=xxx
```

---

## Common Workflows

### Adding a New Product

```typescript
import { supabase } from '@/lib/supabase'

const addProduct = async (productData: ProductInput) => {
  // 1. Insert product
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      brand: productData.brand,
      barcode: productData.barcode,
      // ... other fields
    })
    .select()
    .single()

  if (error) throw error

  // 2. Analyze ingredients (if child)
  if (childProfile) {
    const analysis = await analyseProductForChild(
      product,
      childProfile
    )

    // 3. Check if approval needed
    if (analysis.safety_flags.length > 0) {
      await createApprovalRequest(
        childProfile.id,
        parentId,
        product
      )
    } else {
      // 4. Add to child's library
      await supabase
        .from('child_products')
        .insert({
          child_id: childProfile.id,
          product_id: product.id,
          status: 'approved'
        })
    }
  }

  return product
}
```

### Creating a Routine

```typescript
import { createRoutine } from '@/services/routineService'

const routine = {
  name: "Morning Routine",
  segment: "morning" as const,
  child_profile_id: childProfile.id,
  steps: [
    {
      step_type: "cleanser",
      product_id: "xxx",
      instructions: "Wet face, apply cleanser, rinse",
      duration: 120 // seconds
    },
    {
      step_type: "moisturizer",
      product_id: "yyy",
      instructions: "Apply to damp skin",
      duration: 60
    }
  ]
}

const result = await createRoutine(routine)
if (!result.ok) {
  showSnackbar(result.error.message, 'error')
  return
}

// Activate the routine
await setActiveRoutine(
  childProfile.id,
  result.value.id,
  "morning"
)
```

### Checking Achievements

```typescript
import { checkAchievements } from '@/services/achievementService'

// After routine completion
const newAchievements = await checkAchievements(
  childProfile.id,
  {
    type: 'routine_completed',
    value: 1
  }
)

// Show celebration for new unlocks
if (newAchievements.length > 0) {
  showBadgeUnlockModal(newAchievements)
}
```

---

## Troubleshooting

### Common Issues

**1. "useAuth must be used within AuthProvider"**
- Ensure component is inside `<AuthProvider>` in `app/_layout.tsx`
- Check that you're not calling `useAuth()` outside component body

**2. Routes not found**
- Check file naming (no spaces, lowercase)
- Verify route group structure
- Clear Metro cache: `npx expo start --clear`

**3. Database queries failing**
- Check RLS policies in Supabase
- Verify user is authenticated
- Check if user has permission for that resource

**4. AI services timing out**
- Check API keys in `.env`
- Verify network connection
- Check provider is available (OpenAI, Claude, Mistral)

**5. State not persisting**
- Zustand stores with persist middleware require AsyncStorage
- Check storage permissions
- Verify store name is unique

---

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

---

## Deployment

### iOS (TestFlight)
```bash
# Build
eas build --platform ios

# Submit
eas submit --platform ios
```

### Android (Play Store)
```bash
# Build
eas build --platform android

# Submit
eas submit --platform android
```

---

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Router Docs](https://expo.github.io/router/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)

---

**Questions?** Check the codebase comments or reach out to the team!
