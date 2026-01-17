# Freshies Architecture Overview

> Visual guide to the restructured codebase

---

## 🎯 Module Map (15 Modules)

```
┌─────────────────────────────────────────────────────────────┐
│                     FRESHIES APP                            │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   IDENTITY  │  │   PRODUCTS   │  │   ROUTINES      │  │
│  │             │  │              │  │                 │  │
│  │ • Auth      │  │ • Discovery  │  │ • Builder       │  │
│  │ • Profiles  │  │ • Library    │  │ • Scheduler     │  │
│  │ • Household │  │ • Safety     │  │ • Completion    │  │
│  │ • Sharing   │  │ • Ingredients│  │ • Templates     │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ ENGAGEMENT  │  │   INSIGHTS   │  │   CONTROLS      │  │
│  │             │  │              │  │                 │  │
│  │ • Gamify    │  │ • Outcomes*  │  │ • Parent        │  │
│  │ • Learning  │  │ • Recommends │  │ • Approvals     │  │
│  │ • Notifs    │  │ • AI Chat    │  │ • Permissions   │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  PLATFORM   │  │    ADMIN     │  │  SUBSCRIPTION*  │  │
│  │             │  │              │  │                 │  │
│  │ • Settings  │  │ • Content    │  │ • Plans         │  │
│  │ • Prefs     │  │ • AI Config  │  │ • Billing       │  │
│  │ • Themes    │  │ • Features   │  │ • Gates         │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘

* = Placeholder for future implementation
```

---

## 📂 Directory Structure (Visual)

```
freshies-app/
│
├── 📱 app/                          # React Native Routes (Expo Router)
│   ├── (auth)/                      # Login, signup, welcome
│   ├── (onboarding)/                # Account setup flow
│   ├── (child)/                     # Child interface
│   │   ├── (tabs)/                  # Bottom tab navigation
│   │   │   ├── home.tsx
│   │   │   ├── scan.tsx
│   │   │   ├── routine.tsx
│   │   │   ├── learn.tsx
│   │   │   └── shelf.tsx
│   │   └── achievements-enhanced.tsx
│   ├── (parent)/                    # Parent interface
│   │   ├── (tabs)/
│   │   ├── approvals/
│   │   └── family/
│   └── (shared)/                    # Shared routes
│
├── 🧩 src/
│   │
│   ├── 🎁 modules/                  # Feature Modules (Domain-Driven Design)
│   │   │
│   │   ├── identity/                # Module 1: User Identity & Household
│   │   │   ├── household/
│   │   │   │   └── familyCircleService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── product-discovery/       # Module 2: Finding & Scanning Products
│   │   │   ├── barcode/
│   │   │   │   ├── cloudVisionScanner.ts
│   │   │   │   ├── eanSearch.ts
│   │   │   │   ├── imageScanner.ts
│   │   │   │   └── upcitemdb.ts
│   │   │   ├── ocr/
│   │   │   │   └── ingredientScanner.ts
│   │   │   ├── vision/
│   │   │   │   └── aiProductIdentifier.ts
│   │   │   ├── camera/
│   │   │   ├── productsService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── product-library/         # Module 3: Shelf, Usage, Wishlist
│   │   │   ├── shelfService.ts
│   │   │   ├── usageService.ts
│   │   │   ├── wishlistService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── safety/                  # Module 4: Safety Scoring
│   │   │   ├── calculator.ts
│   │   │   ├── profileCalculator.ts
│   │   │   ├── safetyService.ts
│   │   │   ├── warningsService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── ingredients/             # Module 5: Ingredient Database
│   │   │   ├── ingredientsService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── routines/                # Module 6: Skincare Routines
│   │   │   ├── routineService.ts
│   │   │   ├── templateService.ts
│   │   │   ├── completionService.ts
│   │   │   ├── schedulerService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── outcomes/                # Module 7: Outcomes* (Placeholder)
│   │   │   └── (future implementation)
│   │   │
│   │   ├── recommendations/         # Module 8: AI Recommendations
│   │   │   ├── routineSuggestions.ts
│   │   │   ├── careSuggestions.ts
│   │   │   ├── templateGeneration.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── gamification/            # Module 9: Achievements & Streaks
│   │   │   ├── achievementService.ts
│   │   │   ├── streakService.ts
│   │   │   ├── pointsService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── learning/                # Module 10: Educational Content
│   │   │   ├── aiTools.ts
│   │   │   ├── database.ts
│   │   │   ├── contentFetcher.ts
│   │   │   ├── pipelineOrchestrator.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── notifications/           # Module 11: Notifications & Reminders
│   │   │   ├── notificationService.ts
│   │   │   ├── expiryService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── parent-controls/         # Module 12: Parent Approvals
│   │   │   ├── approvalService.ts
│   │   │   ├── familyService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── admin/                   # Module 13: Admin Tools
│   │   │   ├── aiManagement.ts
│   │   │   ├── contentManagement.ts
│   │   │   ├── featureManagement.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── settings/                # Module 14: User Settings
│   │   │   ├── preferencesStore.ts
│   │   │   └── index.ts
│   │   │
│   │   └── subscription/            # Module 15: Subscription* (Placeholder)
│   │       └── (future implementation)
│   │
│   ├── 🎨 components/               # UI Components
│   │   ├── ui/                      # Primitives (Button, Card)
│   │   ├── gamification/
│   │   ├── routine/
│   │   ├── product/
│   │   └── navigation/
│   │
│   ├── 🔄 contexts/                 # React Contexts
│   │   ├── AuthContext.tsx
│   │   └── ChildProfileContext.tsx
│   │
│   ├── 📦 stores/                   # Zustand Stores
│   │   ├── familyStore.ts
│   │   ├── preferencesStore.ts
│   │   ├── chatContextStore.ts
│   │   └── uiStore.ts
│   │
│   ├── 📝 types/                    # TypeScript Types
│   ├── 🛠️  utils/                    # Helper Functions
│   ├── 🎨 theme/                    # Design Tokens
│   └── 📚 lib/                      # Third-party Configs
│
└── 📖 docs/
    ├── DEVELOPER_GUIDE.md
    ├── MODULE_MIGRATION_PLAN.md
    ├── MODULE_RESTRUCTURE_SUMMARY.md
    └── ARCHITECTURE_OVERVIEW.md (this file)
```

---

## 🔄 Import Flow (Before vs After)

### Before (Flat Services)
```typescript
// ❌ OLD: Hard to navigate
import { achievementService } from '@/services/achievementService'
import { calculateStreak } from '@/services/streakService'
import { getUserPoints } from '@/services/gamificationService'

// Services scattered across 70+ files
```

### After (Module-Based)
```typescript
// ✅ NEW: Clear module boundaries
import {
  achievementService,
  calculateStreak,
  getUserPoints
} from '@/modules/gamification'

// Everything gamification-related in one module
```

---

## 🎭 Role-Based Architecture

### UI Layer (Routes)
```
SEPARATE by role:
  app/(child)/     → Child screens
  app/(parent)/    → Parent screens
  app/(shared)/    → Shared screens
```

### Service Layer (Modules)
```
UNIFIED by domain:
  modules/routines/ → Handles BOTH child & parent routines

Example:
  ├── routineService.ts
  │   ├── childGetRoutines(childId)
  │   └── parentGetRoutines(parentId) → Returns all children's routines
```

### Database Layer (Supabase)
```
PROTECTED by RLS (Row-Level Security):
  • Children can only access their own data
  • Parents can access their children's data
  • Policies enforce access control
```

---

## 🔐 Subscription Module (NEW)

### Feature Tiers
```
┌─────────────────────────────────────────────────────────┐
│                    FREE TIER                            │
│ • 1 child profile                                       │
│ • 10 scans/month                                        │
│ • Basic AI suggestions                                  │
│ • No custom routines                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  PREMIUM TIER                           │
│ • 3 child profiles                                      │
│ • Unlimited scans                                       │
│ • Advanced AI chat                                      │
│ • Custom routine builder                                │
│ • Product comparison                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  FAMILY PLAN                            │
│ • Unlimited children                                    │
│ • Multi-caregiver access                                │
│ • Priority AI responses                                 │
│ • Export reports                                        │
│ • Family leaderboard                                    │
└─────────────────────────────────────────────────────────┘
```

### Implementation
```typescript
// Check subscription before feature use
import { featureGateService } from '@/modules/subscription'

async function startAIChat() {
  const hasAccess = await featureGateService.checkFeature('ai_chat')
  
  if (!hasAccess) {
    showUpgradeModal('Premium Plan')
    return
  }
  
  // Proceed with AI chat
}
```

---

## 📊 Module Dependencies

```
                    ┌──────────────┐
                    │   Identity   │
                    │  (Core Auth) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌───▼────┐  ┌───▼────────┐
         │ Parent  │  │ Child  │  │Subscription│
         │Controls │  │Profile │  │            │
         └────┬────┘  └───┬────┘  └───┬────────┘
              │           │            │
         ┌────▼───────────▼────────────▼─────┐
         │                                    │
    ┌────▼────┐  ┌──────────┐  ┌────────────▼┐
    │Products │  │ Routines │  │Gamification │
    └────┬────┘  └────┬─────┘  └──────┬──────┘
         │            │                │
    ┌────▼────┐  ┌───▼──────┐  ┌─────▼──────┐
    │ Safety  │  │  Notifs  │  │  Learning  │
    └─────────┘  └──────────┘  └────────────┘
```

**Key**: 
- Identity is foundational (everyone depends on auth)
- Product/Routine/Gamification are independent domains
- Safety is a utility module (no dependencies)

---

## 📦 Complete Module List

### Core User Modules
1. **Identity** - User auth, profiles, household management, family circle sharing
2. **Product Discovery** - Barcode scanning, OCR, AI vision, product search
3. **Product Library** - Personal shelf, usage tracking, wishlist management
4. **Safety** - Fresh score calculation, safety warnings, risk assessment
5. **Ingredients** - Ingredient database, COSING data, ingredient analysis

### Feature Modules
6. **Routines** - Skincare routine builder, scheduler, completion tracking, templates
7. **Outcomes** - *Placeholder for reaction tracking and outcome monitoring (future)*
8. **Recommendations** - AI-powered routine suggestions, product recommendations, care advice
9. **Gamification** - Achievements, streaks, points/XP, badges, levels
10. **Learning** - Educational content pipeline, articles, tips, AI-generated content

### System Modules
11. **Notifications** - Push notifications, reminders, expiry alerts
12. **Parent Controls** - Approval workflows, family management, guardian oversight
13. **Admin** - Content management, AI configuration, feature flags
14. **Settings** - User preferences, theme settings, notification preferences
15. **Subscription** - *Placeholder for billing and subscription management (future)*

---

## 📋 Quick Reference

### Add New Feature to Module
```bash
# 1. Create service file
touch src/modules/gamification/leaderboardService.ts

# 2. Implement service
# (write your code)

# 3. Export from module
echo "export * from './leaderboardService';" >> src/modules/gamification/index.ts

# 4. Import in component
import { getLeaderboard } from '@/modules/gamification'
```

### Create New Module
```bash
# 1. Create directory
mkdir -p src/modules/my-new-module

# 2. Create service
touch src/modules/my-new-module/myService.ts

# 3. Create barrel export
cat > src/modules/my-new-module/index.ts << 'EXPORT'
export * from './myService';
EXPORT

# 4. Use in app
import { myFunction } from '@/modules/my-new-module'
```

---

## 🎓 Best Practices

### ✅ DO
- Keep modules focused on single domain
- Use barrel exports (`index.ts`)
- Co-locate related code
- Separate by feature, not by role
- Write role-aware functions when needed

### ❌ DON'T
- Duplicate modules for child/parent
- Create circular dependencies
- Mix multiple domains in one module
- Skip barrel exports
- Use absolute paths within module

---

## 📞 Contact & Help

- **Migration Plan**: See `MODULE_MIGRATION_PLAN.md`
- **Developer Guide**: See `DEVELOPER_GUIDE.md`
- **Summary**: See `MODULE_RESTRUCTURE_SUMMARY.md`
- **This Document**: Architecture visualization

**Questions?** Check these docs or ask the team!
