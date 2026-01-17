# Module Migration Plan

> Step-by-step plan to restructure Freshies codebase from flat service structure to module-based organization

**Status**: ✅ Mostly Complete (13/15 modules migrated)
**Started**: 2026-01-18
**Completed**: 2026-01-18
**Approach**: Gradual migration, one module at a time

---

## Migration Strategy

### Principles
1. **Non-breaking changes first** - Move files, then update imports gradually
2. **One module at a time** - Complete each module before moving to next
3. **Test after each module** - Ensure app works after each migration
4. **Create barrel exports** - Use `index.ts` for clean imports
5. **Update DEVELOPER_GUIDE.md** - Document new structure

### Order of Migration
We'll migrate in this order (easiest to hardest):

1. ✅ **Module Structure Created** - Directories ready
2. ✅ **Module 9: Gamification** - Self-contained, clear boundaries
3. ✅ **Module 6: Routines** - Remove duplicates, consolidate
4. ✅ **Module 11: Notifications** - Consolidate scattered logic
5. ✅ **Module 4: Safety** - Already well-organized, just move
6. ✅ **Module 10: Learning** - Already well-organized, just move
7. ✅ **Module 2: Product Discovery** - Complex, many dependencies
8. ✅ **Module 3: Product Library** - Moderate complexity
9. ✅ **Module 5: Ingredients** - Moderate complexity
10. ✅ **Module 1: Identity** - Core auth, careful migration
11. ✅ **Module 8: Recommendations** - Depends on products
12. ✅ **Module 12: Parent Controls** - Depends on approvals
13. ⬜ **Module 7: Outcomes** - New module, build from scratch (placeholder created)
14. ✅ **Module 13: Admin** - Already organized, just move
15. ✅ **Module 14: Settings** - Simple, just organize
16. ⬜ **Module 15: Subscription** - New module, build from scratch (placeholder created)

---

## Module Definitions

### MODULE 1: Identity & Onboarding
**What**: User authentication, household setup, child profiles, permissions
**Routes**: `(auth)/*`, `(onboarding)/*`
**Current Services**: `familyService.ts`, `approvalService.ts` (permissions)
**Target Structure**:
```
src/modules/identity/
├── auth/
│   ├── authService.ts
│   └── sessionService.ts
├── household/
│   ├── householdService.ts
│   └── invitationService.ts
├── profiles/
│   ├── childProfileService.ts
│   └── caregiverProfileService.ts
├── permissions/
│   ├── permissionsService.ts
│   └── ageBasedDefaults.ts
└── index.ts (barrel export)
```

---

### MODULE 2: Product Discovery & Capture
**What**: Finding and adding products via barcode, OCR, AI, search
**Current Services**: `barcode/*`, `ocr/*`, `camera/*`, `ai/aiVisionProductIdentifier.ts`, `productsService.ts`, `searchService.ts`
**Target Structure**:
```
src/modules/product-discovery/
├── barcode/
│   ├── cloudVisionScanner.ts
│   ├── eanSearch.ts
│   ├── imageScanner.ts
│   └── upcitemdb.ts
├── ocr/
│   └── ingredientScanner.ts
├── vision/
│   └── aiProductIdentifier.ts
├── search/
│   ├── searchService.ts
│   └── filterService.ts
├── manual/
│   ├── manualEntryService.ts
│   └── draftProductsService.ts (NEW)
├── captureOrchestrator.ts
└── index.ts
```

---

### MODULE 3: Product Library ("My Shelf")
**What**: Managing owned products, collections, usage tracking
**Current Services**: `shelfService.ts`, `usageService.ts`, `expiryNotificationService.ts`
**Target Structure**:
```
src/modules/product-library/
├── inventoryService.ts (merge shelfService + usageService)
├── collectionsService.ts (NEW)
├── notesService.ts (NEW)
├── expiryService.ts
└── index.ts
```

---

### MODULE 4: Safety & Scoring
**What**: fresh_score calculation, safety warnings, risk assessment
**Current Services**: `safety/*` (already well-organized!)
**Target Structure**:
```
src/modules/safety/
├── calculator.ts (existing)
├── profileCalculator.ts (existing)
├── safetyService.ts (existing)
├── warningsService.ts (merge productWarningsService.ts)
├── explanationService.ts (NEW)
├── types.ts
└── index.ts
```

---

### MODULE 5: Ingredients & Analysis
**What**: Ingredient database, taxonomy, matching, details
**Current Services**: `ingredientsService.ts`, `ocr/ingredientScanner.ts`
**Target Structure**:
```
src/modules/ingredients/
├── ingredientsService.ts
├── taxonomyService.ts (NEW)
├── matchingService.ts (from ocr)
├── detailsService.ts (NEW)
├── cosingImporter.ts
└── index.ts
```

---

### MODULE 6: Routines & Scheduling
**What**: Building, executing, scheduling skincare routines
**Current Services**: `routineService.ts`, `routineTemplateService.ts`, `routineHistoryService.ts`, `routineNotificationScheduler.ts`, `routinesService.ts` (DUPLICATE)
**Target Structure**:
```
src/modules/routines/
├── routineService.ts (CRUD only)
├── schedulerService.ts (scheduling + notifications)
├── completionService.ts (history + tracking)
├── templateService.ts
└── index.ts
```
**Actions**: DELETE `routinesService.ts`

---

### MODULE 7: Outcomes & Reactions (NEW)
**What**: Tracking reactions, outcomes, photos, insights
**Current Services**: None (partially in `activityService.ts`)
**Target Structure**:
```
src/modules/outcomes/
├── reactionService.ts (NEW)
├── photosService.ts (NEW)
├── insightsService.ts (NEW)
├── exportService.ts (NEW)
└── index.ts
```

---

### MODULE 8: Recommendations & Decision Support
**What**: Safer alternatives, product comparison, wishlist
**Current Services**: `wishlistService.ts`, comparison logic scattered
**Target Structure**:
```
src/modules/recommendations/
├── alternativesService.ts (NEW)
├── comparisonService.ts (NEW)
├── wishlistService.ts (existing)
├── retailerLinksService.ts (NEW)
└── index.ts
```

---

### MODULE 9: Gamification & Engagement ⏳ CURRENT
**What**: Streaks, achievements, points, levels, badges
**Current Services**: `achievementService.ts`, `gamificationService.ts`, `streakService.ts`
**Target Structure**:
```
src/modules/gamification/
├── achievementService.ts (achievements only)
├── streakService.ts (calculation only)
├── pointsService.ts (XP, levels)
├── leaderboardService.ts
└── index.ts
```

---

### MODULE 10: Learning & Content
**What**: Educational articles, content pipeline, AI tools
**Current Services**: `learn/*` (already well-organized!)
**Target Structure**:
```
src/modules/learning/
├── aiTools.ts (existing)
├── database.ts (existing)
├── contentFetcher.ts (existing)
├── contentSources.ts (existing)
├── safetyChecker.ts (existing)
├── pipelineOrchestrator.ts (existing)
├── types.ts
└── index.ts
```

---

### MODULE 11: Notifications & Messaging
**What**: Reminders, alerts, notification preferences
**Current Services**: `notificationsService.ts`, `routineNotificationScheduler.ts`, `expiryNotificationService.ts`
**Target Structure**:
```
src/modules/notifications/
├── notificationService.ts (core dispatch)
├── schedulerService.ts (scheduling logic)
├── preferencesService.ts
├── templates/
└── index.ts
```

---

### MODULE 12: Parent Controls & Approvals
**What**: Approval queue, permission management, parent-child linking
**Current Services**: `approvalService.ts`, `familyService.ts` (permissions)
**Target Structure**:
```
src/modules/parent-controls/
├── approvalService.ts
├── permissionsService.ts
├── guardianshipService.ts
└── index.ts
```

---

### MODULE 13: Admin & Data Operations
**What**: Product moderation, ingredient management, scoring rules, audit
**Current Services**: `admin/*` (already organized)
**Target Structure**:
```
src/modules/admin/
├── moderation/
├── ingredients/
├── scoring/
├── audit/
├── support/
└── index.ts
```

---

### MODULE 14: Settings & Privacy
**What**: User preferences, data controls, security settings
**Current Services**: `preferencesStore.ts` (Zustand)
**Target Structure**:
```
src/modules/settings/
├── preferencesService.ts
├── privacyService.ts (NEW)
├── securityService.ts (NEW)
└── index.ts
```

---

### MODULE 15: Subscription & Billing (NEW)
**What**: Subscription plans, payment processing, feature gating
**Current Services**: None
**Target Structure**:
```
src/modules/subscription/
├── subscriptionService.ts (NEW)
├── paymentService.ts (NEW)
├── featureGateService.ts (NEW)
├── billingService.ts (NEW)
├── providers/
│   ├── stripe.ts (NEW)
│   └── revenueCat.ts (NEW)
├── types/
│   ├── plans.ts (NEW)
│   ├── payments.ts (NEW)
│   └── subscriptionStatus.ts (NEW)
└── index.ts
```

---

## Migration Checklist Template

For each module:

- [ ] Create module directory structure
- [ ] Move service files to module
- [ ] Create barrel export (`index.ts`)
- [ ] Update imports in moved files (relative paths)
- [ ] Create/update type definitions
- [ ] Move related components (if applicable)
- [ ] Update all import paths throughout codebase
- [ ] Test the app (run dev server, test key flows)
- [ ] Update DEVELOPER_GUIDE.md
- [ ] Commit changes

---

## Current Progress

### ✅ Step 1: Module Structure Created
- All module directories created
- Subdirectories for complex modules created
- `src/shared/` directory created for cross-module code

### ✅ Step 2: Migrate Module 9 - Gamification (COMPLETED)

**Completed Actions:**
- ✅ Created `src/modules/gamification/` directory
- ✅ Copied services to module:
  - `achievementService.ts` (10KB)
  - `streakService.ts` (4.3KB)
  - `pointsService.ts` (renamed from `gamificationService.ts`, 7.3KB)
- ✅ Created barrel export (`index.ts`)
- ✅ Updated all import paths from `@/services/*` to `@/modules/gamification`
- ✅ Fixed relative imports within module files (`../../lib/supabase`)
- ✅ Updated 7 files importing gamification services:
  1. `src/components/gamification/GamificationBand.tsx`
  2. `src/components/routine/RoutineBottomSheet.tsx`
  3. `app/(child)/achievements-enhanced.tsx`
  4. `app/(child)/learn/tips.tsx`
  5. `app/(child)/learn/stats.tsx`
  6. `app/(child)/(tabs)/learn.tsx` (2 imports: static + dynamic)

**Result**: All gamification services successfully migrated. No breaking imports remaining.

---

### ✅ Step 3: Migrate Module 6 - Routines (COMPLETED)

**Completed Actions:**
- ✅ Created `src/modules/routines/` directory
- ✅ Moved and renamed services:
  - `routineService.ts` → Core CRUD operations (9.8KB)
  - `routineHistoryService.ts` → `completionService.ts` (10KB)
  - `routineTemplateService.ts` → `templateService.ts` (6.6KB)
  - `routineNotificationScheduler.ts` → `schedulerService.ts` (8.6KB)
- ✅ Created barrel export (`index.ts`)
- ✅ Fixed all relative import paths (`../../lib/`, `../../types/`)
- ✅ Updated all imports throughout codebase
- ✅ Updated 8 files with new import paths

**Note**: `routinesService.ts` remains in `src/services/` as legacy code used by old route files. Will be removed when those routes are updated.

**Result**: Routines module successfully migrated. All active imports updated.

---

### ✅ Step 4: Migrate Modules 11, 4, 10, 5, 13 (COMPLETED)

**Completed Actions:**
- ✅ Module 11: Notifications
  - Migrated `notificationsService.ts` → `notificationService.ts`
  - Migrated `expiryNotificationService.ts` → `expiryService.ts`
  - Created barrel export
- ✅ Module 4: Safety
  - Copied entire `services/safety/` directory (already well-organized)
  - Added `productWarningsService.ts` → `warningsService.ts`
  - Created barrel export
- ✅ Module 10: Learning
  - Copied entire `services/learn/` directory (already well-organized)
  - Includes 8 files: aiTools, database, contentFetcher, pipelineOrchestrator, etc.
  - Created barrel export
- ✅ Module 5: Ingredients
  - Migrated `ingredientsService.ts`
  - Created barrel export
- ✅ Module 13: Admin
  - Copied entire `services/admin/` directory (already well-organized)
  - Includes aiManagement, contentManagement, featureManagement
  - Created barrel export

---

### ✅ Step 5: Migrate Modules 2, 3, 12, 1 (COMPLETED)

**Completed Actions:**
- ✅ Module 2: Product Discovery
  - Migrated `productsService.ts`
  - Copied `services/barcode/*` directory
  - Copied `ocr/ingredientScanner.ts`
  - Copied `ai/aiVisionProductIdentifier.ts`
  - Copied `searchService.ts`
  - Copied `camera/*` directory
  - Created barrel export
- ✅ Module 3: Product Library
  - Migrated `shelfService.ts`
  - Migrated `usageService.ts`
  - Migrated `wishlistService.ts`
  - Created barrel export
- ✅ Module 12: Parent Controls
  - Migrated `approvalService.ts`
  - Migrated `familyService.ts`
  - Created barrel export
- ✅ Module 1: Identity
  - Migrated `familyCircleService.ts` to `household/`
  - Created barrel export

**Import Updates:** All imports throughout the codebase updated to use new module paths.

---

### ✅ Step 6: Migrate Modules 8, 14 (COMPLETED)

**Completed Actions:**
- ✅ Module 8: Recommendations
  - Migrated `utils/aiRoutineSuggestions.ts` → `routineSuggestions.ts`
  - Migrated `services/ai/aiCareService.ts` → `careSuggestions.ts`
  - Migrated `services/ai/templateGenerationService.ts` → `templateGeneration.ts`
  - Created barrel export
  - Updated all imports
- ✅ Module 14: Settings
  - Migrated `stores/preferencesStore.ts`
  - Created barrel export
  - Updated all imports

---

## Migration Summary

### ✅ Completed Modules (13/15)

1. ✅ **Module 1: Identity** - familyCircleService migrated to household/
2. ✅ **Module 2: Product Discovery** - All barcode, OCR, vision, search services migrated
3. ✅ **Module 3: Product Library** - shelf, usage, wishlist services migrated
4. ✅ **Module 4: Safety** - All safety calculation and warning services migrated
5. ✅ **Module 5: Ingredients** - ingredientsService migrated
6. ✅ **Module 6: Routines** - All routine services migrated and renamed
7. ⬜ **Module 7: Outcomes** - Placeholder created (new feature, not yet implemented)
8. ✅ **Module 8: Recommendations** - AI recommendation services migrated
9. ✅ **Module 9: Gamification** - achievement, streak, points services migrated
10. ✅ **Module 10: Learning** - All learning content pipeline services migrated
11. ✅ **Module 11: Notifications** - notification and expiry services migrated
12. ✅ **Module 12: Parent Controls** - approval and family services migrated
13. ✅ **Module 13: Admin** - All admin management services migrated
14. ✅ **Module 14: Settings** - preferencesStore migrated
15. ⬜ **Module 15: Subscription** - Placeholder created (new feature, not yet implemented)

### Files Migrated

- **Total Services Migrated**: ~40+ service files
- **Total Import Updates**: ~100+ files updated throughout codebase
- **Modules with Barrel Exports**: All 13 completed modules

### Import Pattern Changes

**Before:**
```typescript
import { routineService } from '../../services/routineService';
import { shelfService } from '../../../src/services/shelfService';
import { achievementService } from '@/services/achievementService';
```

**After:**
```typescript
import { routineService } from '../../modules/routines';
import { shelfService } from '../../../src/modules/product-library';
import { achievementService } from '@/modules/gamification';
```

---

## Next Steps

1. ✅ **Test all functionality** - Ensure all migrated modules work correctly
2. ⬜ **Implement Module 7: Outcomes** - When reaction tracking feature is built
3. ⬜ **Implement Module 15: Subscription** - When subscription feature is built
4. ⬜ **Clean up legacy `src/services/`** - Remove old service files once verified
5. ⬜ **Update DEVELOPER_GUIDE.md** - Document new module structure
6. ⬜ **Update import aliases in tsconfig.json** - Add `@/modules/*` alias

---

## Notes

- ✅ All active service files migrated to modules
- ✅ All imports updated throughout codebase
- Keep `src/services/` intact for now for reference
- Legacy `routinesService.ts` remains for old route files (4 files)
- Use TypeScript compiler to verify: `npx tsc --noEmit`
- Module 7 (Outcomes) and Module 15 (Subscription) are placeholders for future features
