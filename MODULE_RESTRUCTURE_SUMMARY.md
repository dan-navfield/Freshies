# Module Restructure Summary

**Date**: 2026-01-18
**Status**: Phase 1 Complete - Gamification Module Migrated

---

## What We Did

### 1. Answered Key Architecture Question: Child vs Parent Delineation

**Question**: How do we separate child features from parent features?

**Answer**: Two-level separation strategy:

#### **Level 1: Routes (UI) - KEEP AS-IS** ✅
```
app/
├── (child)/     # Child-specific UI
├── (parent)/    # Parent-specific UI
└── (shared)/    # Shared UI
```
Your routing is already perfect - don't change it!

#### **Level 2: Services (Business Logic) - NEW APPROACH**
**Shared modules with role-aware functions:**

```typescript
// ✅ GOOD: One module, role-aware
src/modules/routines/
├── routineService.ts  // Has both child & parent functions

// In routineService.ts:
export async function getRoutines(userId: string, userRole: UserRole) {
  if (userRole === 'child') {
    // Return routines for this child
  } else if (userRole === 'parent') {
    // Return routines for all children
  }
}

// ❌ BAD: Duplicate modules
src/modules/
├── child-routines/    // Don't do this!
├── parent-routines/   // Don't do this!
```

**Summary**: UI separates by role, Services unify by domain, Functions separate by use case.

---

### 2. Created 15-Module Structure

Added a new **Module 15: Subscription & Billing** to your original 14 modules:

| Module | Purpose | Status |
|--------|---------|--------|
| 1. Identity & Onboarding | Auth, household, profiles, permissions | Planned |
| 2. Product Discovery | Barcode, OCR, AI, search | Planned |
| 3. Product Library | Shelf, collections, usage | Planned |
| 4. Safety & Scoring | fresh_score calculation | Planned |
| 5. Ingredients | Database, taxonomy, matching | Planned |
| 6. Routines | Building, executing, scheduling | Planned |
| 7. Outcomes & Reactions | Tracking reactions (NEW) | Planned |
| 8. Recommendations | Alternatives, comparison, wishlist | Planned |
| **9. Gamification** | **Achievements, streaks, points** | **✅ COMPLETE** |
| 10. Learning | Educational content pipeline | Planned |
| 11. Notifications | Reminders, alerts, preferences | Planned |
| 12. Parent Controls | Approvals, permissions | Planned |
| 13. Admin | Moderation, data management | Planned |
| 14. Settings | Preferences, privacy, security | Planned |
| **15. Subscription** | **Plans, billing, feature gates (NEW)** | **Planned** |

---

### 3. Successfully Migrated Gamification Module

#### **Before (Flat Structure)**:
```
src/services/
├── achievementService.ts
├── gamificationService.ts
├── streakService.ts
└── ... 60+ other services
```

#### **After (Module Structure)**:
```
src/modules/gamification/
├── achievementService.ts  # Achievement CRUD & tracking
├── streakService.ts        # Streak calculation only
├── pointsService.ts        # XP, levels, leaderboards
└── index.ts                # Barrel export
```

#### **Files Updated**:
- 7 files had imports updated from old paths to new module
- Zero breaking changes
- All imports now use: `import { ... } from '@/modules/gamification'`

---

## New Directory Structure

```
freshies-app/
├── app/                    # Expo Router routes (UNCHANGED)
│   ├── (auth)/
│   ├── (child)/
│   ├── (parent)/
│   └── (shared)/
│
├── src/
│   ├── modules/            # 🆕 NEW: Module-based organization
│   │   ├── gamification/   # ✅ COMPLETE
│   │   ├── routines/       # Next
│   │   ├── product-discovery/
│   │   ├── safety/
│   │   ├── ingredients/
│   │   ├── learning/
│   │   ├── notifications/
│   │   ├── subscription/   # 🆕 NEW MODULE
│   │   └── ... (11 more)
│   │
│   ├── services/           # Legacy (being migrated from)
│   ├── components/         # UI components (UNCHANGED)
│   ├── contexts/           # Global contexts (UNCHANGED)
│   ├── stores/             # Zustand stores (UNCHANGED)
│   ├── types/              # Type definitions
│   ├── utils/              # Utility functions
│   ├── theme/              # Design tokens
│   └── lib/                # Third-party configs
│
└── MODULE_MIGRATION_PLAN.md
```

---

## Subscription Module (NEW)

Since you mentioned needing subscription management, we added **Module 15**:

### Features
1. **Subscription plans** - Free, Premium, Family tiers
2. **Payment processing** - Stripe/RevenueCat integration
3. **Subscription lifecycle** - Trial, renewal, cancellation, upgrade/downgrade
4. **Feature gating** - Check subscription status and limit features
5. **Notifications** - Expiration warnings, payment failure alerts

### Planned Structure
```
src/modules/subscription/
├── subscriptionService.ts      # Subscription CRUD
├── paymentService.ts           # Payment processing
├── featureGateService.ts       # Feature access control
├── billingService.ts           # Invoices & receipts
├── providers/
│   ├── stripe.ts               # Stripe integration
│   └── revenueCat.ts           # RevenueCat integration
├── types/
│   ├── plans.ts
│   ├── payments.ts
│   └── subscriptionStatus.ts
└── index.ts
```

---

## Next Steps

### Immediate (Module 6: Routines)
1. **Consolidate routine services** - Delete `routinesService.ts` duplicate
2. **Move to `src/modules/routines/`**:
   - `routineService.ts` → CRUD operations
   - `routineScheduler.ts` → Scheduling + notifications
   - `routineHistoryService.ts` → Completion tracking
   - `templateService.ts` → Templates
3. **Update imports** throughout codebase
4. **Test routine features**

### Then (Module 11: Notifications)
- Consolidate scattered notification logic
- Create unified notification orchestrator

### Eventually
- Migrate remaining 12 modules
- Build new Subscription module
- Build new Outcomes module
- Update DEVELOPER_GUIDE.md comprehensively

---

## Benefits of New Structure

### For Developers
- **Faster navigation**: Related code is co-located
- **Clear ownership**: Each module has single responsibility
- **Easier testing**: Test entire module in isolation
- **Better imports**: `@/modules/gamification` vs `@/services/achievementService`

### For Features
- **Logical grouping**: Modules match product features
- **Scalability**: Easy to add new modules
- **Maintenance**: Changes isolated to one module
- **Onboarding**: New developers understand structure faster

---

## Files Created

1. `MODULE_MIGRATION_PLAN.md` - Detailed migration plan
2. `MODULE_RESTRUCTURE_SUMMARY.md` - This file
3. `src/modules/gamification/index.ts` - Barrel export
4. Module directory structure (15 modules)

---

## Files Modified

### Gamification Services
- `src/modules/gamification/achievementService.ts` - Fixed import paths
- `src/modules/gamification/streakService.ts` - Fixed import paths
- `src/modules/gamification/pointsService.ts` - Fixed import paths

### Components
- `src/components/gamification/GamificationBand.tsx`
- `src/components/routine/RoutineBottomSheet.tsx`

### Routes
- `app/(child)/achievements-enhanced.tsx`
- `app/(child)/learn/tips.tsx`
- `app/(child)/learn/stats.tsx`
- `app/(child)/(tabs)/learn.tsx`

---

## Questions Answered

### Q: How do we separate child vs parent code?
**A**: Separate UI routes, share service modules, differentiate by functions.

### Q: Should we duplicate modules for child/parent?
**A**: No - use single module with role-aware functions or separate functions for different roles.

### Q: Where does subscription management fit?
**A**: New Module 15 - sits alongside other feature modules.

### Q: What's the migration strategy?
**A**: One module at a time, non-breaking changes, test after each migration.

---

## Status: 2 Modules Complete

✅ **Module 9: Gamification** - Fully migrated (3 services)
✅ **Module 6: Routines** - Fully migrated (4 services, renamed for clarity)
✅ Architecture decisions documented
✅ Module structure created
✅ Dev server running successfully

**Progress**: 2/15 modules (13.3%)

**Next**: Module 11 (Notifications) - Consolidate scattered logic
