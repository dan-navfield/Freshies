# Freshies App - Route Structure Documentation

**Last Updated:** January 17, 2026
**Version:** Post-cleanup (Phase 2 complete)

## Overview

This document clarifies the Expo Router file-based routing structure, explaining what might appear to be "duplicate" routes but actually serve different purposes.

---

## Route Organization

### 1. Role-Based Route Groups

#### `app/(child)/` - Child User Routes
Routes accessible only to child users (ages 8-16). Features kid-friendly UX.

**Tabs:**
- `(tabs)/home.tsx` - Child dashboard
- `(tabs)/learn.tsx` - Learning hub
- `(tabs)/routine.tsx` - Routine execution
- `(tabs)/scan.tsx` - Product scanner (child UX)
- `(tabs)/shelf.tsx` - Product shelf
- `(tabs)/history.tsx` - **Routine completion calendar**

**Standalone Screens:**
- `achievements-enhanced.tsx` - Gamification/badges
- `freshie-gallery.tsx` - Product photo gallery
- `routine-builder-enhanced.tsx` - Visual routine builder
- `product-result.tsx` - **Child-friendly product details (simplified)**
- `history.tsx` - **Product archive (finished shelf items)**
- And 40+ other child-specific screens

**Nested Groups:**
- `learn/` - Learning subsections (tips, ingredients, stats)
- `onboarding/` - Child onboarding flow
- `collection/`, `groups/`, `products/`, etc.

#### `app/(parent)/` - Parent User Routes
Routes for parent/guardian accounts with oversight features.

- `family/` - Family member management
- `approvals/` - Product approval requests
- `routine/` - Child routine monitoring
- `account.tsx` - Parent settings

#### `app/(shared)/` - Shared Routes
Accessible by both child and parent users.

- `product-result.tsx` - **Full-featured product details (comprehensive, 2,870 lines)**
- `products/` - Product browsing

#### `app/(auth)/` - Authentication Routes
Login, signup, terms acceptance, welcome screens.

#### `app/(onboarding)/` - Role Selection & Onboarding
Initial onboarding flow before role-specific onboarding.

#### `app/(tabs)/` - Generic Tab Routes
Used when no role-specific route exists. Falls back for shared functionality.

- `index.tsx` - Generic home
- `scan.tsx` - **Parent/generic scanner**
- `history.tsx` - **Scanned products history (all users)**
- And other generic versions

---

### 2. Top-Level Routes (No Group)

#### `app/learn/` - Article Detail System
**Purpose:** Display full article content from learning database.

- `[id].tsx` - Article detail with FAQs, bookmarking, sharing
- `topic/[id].tsx` - Topic-specific articles

**Why separate from `app/(child)/learn/`?**
- `(child)/learn/` = Learning hub sections (tips, ingredients subsections)
- `app/learn/` = Individual article pages (content delivery)

#### `app/routines/` - Parent Routine Viewing
**Purpose:** Parents viewing/managing child routines.

- `[childId].tsx` - Child's routine list
- `[childId]/[routineId].tsx` - Routine detail
- `[childId]/create.tsx` - Create routine for child

**Why separate from `(child)/(tabs)/routine.tsx`?**
- Child route = Execute own routine
- Parent route = View/manage child's routines

#### Other Top-Level Routes
- `app/freshies-chat.tsx` - AI chat interface
- `app/notifications/` - Notifications center
- `app/activity/` - Activity feed
- `app/search/` - Global search
- `app/product-not-found/` - Product not found flow

---

## Clarifying "Duplicate" Routes

### Learn Routes (NOT Duplicates)

| Route | Purpose | Lines |
|-------|---------|-------|
| `app/(child)/(tabs)/learn.tsx` | Learning hub homepage (tips, quizzes, categories) | 1,180 |
| `app/(child)/learn/[id].tsx` | **Placeholder** - Should use `app/learn/[id].tsx` | 60 |
| `app/(child)/learn/tips.tsx` | Daily tips section | - |
| `app/(child)/learn/ingredients.tsx` | Ingredient database | - |
| `app/(child)/learn/stats.tsx` | Learning stats | - |
| `app/(tabs)/learn.tsx` | Generic learn tab | 488 |
| **`app/learn/[id].tsx`** | **Full article detail implementation** | 481 |

**Note:** `app/(child)/learn/[id].tsx` is a stub. Real article viewing uses `app/learn/[id].tsx`.

### History Routes (NOT Duplicates - 3 Different Concepts!)

| Route | Purpose | What It Shows |
|-------|---------|---------------|
| `app/(child)/(tabs)/history.tsx` | **Routine completion calendar** | Daily routine completions, streaks, calendar view |
| `app/(child)/history.tsx` | **Product archive** | Finished/archived shelf items |
| `app/(tabs)/history.tsx` | **Scanned products history** | All previously scanned products |

**Recommendation:** Rename for clarity:
- Keep: `(tabs)/history.tsx` as routine history (good location)
- Rename: `(child)/history.tsx` → `(child)/archive.tsx` or `product-archive.tsx`
- Rename: `(tabs)/history.tsx` → `(tabs)/scan-history.tsx` or `scanned-products.tsx`

### Product Result Routes (NOT Duplicates - Different UX)

| Route | Purpose | Lines | UX Level |
|-------|---------|-------|----------|
| `app/(child)/product-result.tsx` | Child-friendly product view | 703 | Simplified, gamified, kid-appropriate |
| `app/(shared)/product-result.tsx` | Full-featured product view | 2,870 | Comprehensive, clinical, all features |

**Why both?**
- Children need simplified, fun UX without overwhelming detail
- Parents need complete safety info, ingredient analysis, comparison tools

### Scan Routes (NOT Duplicates - Role-Based)

| Route | Purpose |
|-------|---------|
| `app/(child)/(tabs)/scan.tsx` | Child scanner with kid-friendly UI |
| `app/(tabs)/scan.tsx` | Generic/parent scanner |

---

## Route Resolution Rules

Expo Router resolves routes by checking groups in this order:

1. **Most specific group first** - e.g., `(child)/product-result` when navigating from child context
2. **Shared group next** - e.g., `(shared)/product-result` accessible from anywhere
3. **Generic/tabs fallback** - e.g., `(tabs)/scan` when no role-specific route exists

**Example:**
```tsx
// From child screen:
router.push('/(child)/product-result') // → app/(child)/product-result.tsx

// From parent screen:
router.push('/(shared)/product-result') // → app/(shared)/product-result.tsx

// Using bare path (resolves to shared):
router.push('/product-result') // → app/(shared)/product-result.tsx
```

---

## Special Directories

### `app/(child)/product-detail/`
Contains 10 **experimental product view variants** for UX testing:
- `child1-fun.tsx` through `child5-quick.tsx` - Child UX experiments
- `parent1-clinical.tsx` through `parent5-editorial.tsx` - Parent UX experiments

**Status:** These are design explorations, not production routes (yet).

---

## Navigation Best Practices

### 1. Always Use Full Paths
```tsx
// Good ✓
router.push('/(child)/product-result')

// Avoid (ambiguous)
router.push('/product-result')
```

### 2. Role-Aware Navigation
```tsx
const role = userProfile.role;

if (role === 'child') {
  router.push('/(child)/product-result');
} else {
  router.push('/(shared)/product-result');
}
```

### 3. Type-Safe Routes
```tsx
import { Href } from 'expo-router';

const route: Href = '/(child)/achievements-enhanced';
router.push(route);
```

---

## Cleanup Summary (Phase 2)

### ✅ Completed
1. Fixed `mockProductData.ts` route warning (moved to `src/data/`)
2. Analyzed all "duplicate" routes - confirmed they serve different purposes
3. Documented route structure for future maintainers

### ❌ NOT Duplicates (Keep All)
- Learn routes - Different purposes (hub vs articles vs subsections)
- History routes - Three different concepts (routine/product/scan)
- Product result routes - Different UX levels (child vs full)
- Scan routes - Role-based implementations

### 📝 Recommendations (Future)
1. **Rename history routes** for clarity:
   - `(child)/history.tsx` → `(child)/product-archive.tsx`
   - `(tabs)/history.tsx` → `(tabs)/scan-history.tsx`

2. **Consolidate article routing**:
   - Replace `(child)/learn/[id].tsx` stub with redirect to `/learn/[id]`

3. **Add route aliases** in `_layout.tsx` for clarity

---

## Route Count Summary

- **Total app/ files:** ~165
- **Route groups:** 7 (`(child)`, `(parent)`, `(shared)`, `(tabs)`, `(auth)`, `(onboarding)`, `(shelf)`)
- **Top-level routes:** 6 (`learn/`, `routines/`, `notifications/`, `activity/`, `search/`, `product-not-found/`)
- **Child tab screens:** 6 (home, learn, routine, scan, shelf, history)
- **Experimental variants:** 10 (product-detail UX tests)

---

## Maintenance Notes

- ✅ All routes are intentional, not accidental duplicates
- ✅ File-based routing enables role-specific UX
- ✅ Route groups provide clean separation of concerns
- ⚠️ Some naming could be clearer (history vs archive vs scan-history)
- ⚠️ One stub file exists: `(child)/learn/[id].tsx` (use `/learn/[id]` instead)

---

*This structure supports the app's dual-audience design (children + parents) while maintaining code organization and avoiding true duplication.*
