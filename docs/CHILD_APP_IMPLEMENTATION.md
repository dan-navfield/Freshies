# Child App Implementation Guide

## Overview
Single app with role-based features for parent and child users. Child experience is age-appropriate, empowering, and parent-controlled.

## ✅ Completed (Phase 1)

### 1. Route Structure
```
app/
├── (parent)/          - Parent-only routes
│   ├── family/
│   ├── approvals/
│   ├── account.tsx
│   ├── settings/
│   └── compare.tsx
├── (child)/           - Child-only routes
│   ├── home.tsx
│   ├── scan.tsx
│   ├── favorites.tsx
│   ├── routine.tsx
│   └── approved-products.tsx
└── (shared)/          - Both can access
    ├── product-result.tsx
    └── scanned-products.tsx
```

### 2. Database Schema
**Tables Created:**
- `child_profiles` - Core child profile with skin data
- `child_goals` - Skincare goals (reduce breakouts, etc.)
- `child_wishlist` - Products pending parent approval
- `child_routines` - Daily skincare routines
- `child_routine_completions` - Tracking completions
- `child_product_expiry` - Expiry date tracking
- `child_favorites` - Favorited products
- `child_scan_history` - Scan history

**Key Features:**
- Skin profile (type, sensitivity, concerns)
- Goals system with priorities
- Parent guardrails (banned ingredients, price limits)
- Approval workflow
- Privacy controls

### 3. TypeScript Types
- Complete type definitions in `src/types/child.ts`
- Skin profile types
- Goal types
- Wishlist and approval types
- Routine types
- Helper constants and labels

### 4. Context & State Management
- `ChildProfileContext` for managing child profile state
- Hooks for profile, goals, and preferences
- Real-time updates via Supabase

### 5. Child Screens (UI)
- **Home** - Colorful dashboard with quick actions
- **Scan** - Simple barcode scanner
- **Favorites** - Products they love
- **Routine** - Daily routine tracker with streaks
- **Approved Products** - Parent-approved list

## 🚧 In Progress (Phase 2)

### Next Steps:
1. **Skin Profile Onboarding**
   - Friendly quiz for skin type
   - Goal selection
   - Optional selfie analysis

2. **Enhanced Product Scanning**
   - Child-friendly ingredient explanations
   - Skin match scoring
   - "Better alternatives" section

3. **Wishlist & Approval Flow**
   - Add to wishlist from scan
   - Parent notification
   - Approval/decline with notes

4. **Routine Builder**
   - Drag-and-drop steps
   - Streak tracking
   - Reminders

## 📋 Backlog (Phase 3)

### Recommendation Engine
- Ingredient-level matching
- Skin profile-based filtering
- Goal-aligned suggestions
- Alternative product ranking

### Education Hub
- Bite-sized lessons
- Age-appropriate content
- Quizzes and badges
- Safe browsing mode

### Reviews (Moderated)
- Mood emoji + one sentence
- Parent moderation
- No usernames
- No child-to-child interaction

### Expiry Tracking
- Visual badges
- Alerts to child and parent
- Suggest replacements

## 🔒 Safety & Privacy

### Implemented:
- Row Level Security (RLS) on all tables
- Parent can view child data
- Child can only see own data
- No sibling visibility

### To Implement:
- Selfie analysis opt-in (parent controlled)
- Review moderation pipeline
- Content filtering
- Privacy explanations for teens

## 🎨 Design Principles

### Child UI:
- Bright, friendly colors
- Large touch targets
- Simple language
- Emoji and icons
- Positive reinforcement
- No prices shown
- No medical claims

### Parent UI:
- Professional design
- Detailed information
- Control panels
- Approval workflows
- Analytics and insights

## 🔄 Parent-Child Interaction Points

1. **Profile Setup** - Parent creates child profile
2. **Wishlist Approval** - Child requests, parent approves
3. **Routine Oversight** - Parent sees adherence (if enabled)
4. **Expiry Alerts** - Both get notified
5. **Goal Setting** - Collaborative or parent-set
6. **Privacy Controls** - Parent manages visibility

## 📊 Data Flow

```
Child Scans Product
    ↓
Product analyzed against skin profile
    ↓
Score + insights generated
    ↓
Child can:
- Add to favorites
- Add to routine (if approved)
- Request approval (if new)
    ↓
Parent sees approval request
    ↓
Parent approves/declines
    ↓
Approved products available to child
```

## 🛠️ Technical Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (for avatars/images)
- **AI**: GPT-4 for ingredient analysis

## 📝 Next Session TODO

1. Run database migration (`CREATE_CHILD_PROFILES.sql`)
2. Add ChildProfileProvider to app root
3. Create skin profile onboarding flow
4. Implement wishlist approval in parent app
5. Build recommendation engine basics
6. Test parent-child data sync

## 🎯 Success Metrics

- Child engagement (scans per week)
- Routine completion rate
- Approval request turnaround time
- Parent satisfaction with controls
- Child understanding of ingredients
