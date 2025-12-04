# Family Management Implementation

**Date:** November 16, 2024

## Overview

Comprehensive family management system for parents to manage children, safety settings, permissions, and monitor activity.

## Files Created

### Type Definitions
**`src/types/family.ts`**
- `Child` - Child profile data
- `ChildProfile` - Extended profile with computed fields
- `FamilyGroup` - Family grouping
- `ChildPermissions` - What child can do
- `ChildInvitation` - Device linking codes
- `SafetyTier` - Strict, Moderate, Relaxed
- `IndependenceLevel` - 1-5 supervision levels

### Services
**`src/services/familyService.ts`**
- `getOrCreateFamilyGroup()` - Get/create family
- `getChildren()` - Fetch all children
- `addChild()` - Add new child
- `updateChild()` - Update child profile
- `deleteChild()` - Remove child
- `getChildPermissions()` - Get permissions
- `updateChildPermissions()` - Update permissions
- `generateChildInvitation()` - Create link code

### Screens Created

#### 1. Family Overview (`app/family/index.tsx`)
**Features:**
- List all children with avatars
- Show safety tier and device status
- Display activity summary (approvals, scans, flags)
- Add child button
- Quick actions for reviewing pending items
- Family settings access

**UI Elements:**
- Child cards with avatar, name, age
- Safety tier badges (color-coded)
- Device link status
- Activity counters
- Alert banners for pending approvals

#### 2. Add Child Flow (`app/family/add-child.tsx`)
**Features:**
- Basic info form (name, nickname, DOB)
- Age calculation from DOB
- Safety tier selection (Strict/Moderate/Relaxed)
- Independence level selection (1-5)
- Age-appropriate defaults

**Safety Tiers:**
- **Strict:** All products need approval, auto-flag risky
- **Moderate:** Auto-approve safe, flag concerning
- **Relaxed:** More independence, notify on major concerns

**Independence Levels:**
1. **Full Supervision** (6-8 years) - Parent reviews everything
2. **Guided** (9-11 years) - Browse but need approval
3. **Monitored** (12-14 years) - Add safe products, parent notified
4. **Semi-Independent** (15-16 years) - Manage routine, parent sees summary
5. **Independent** (17+ years) - Full access, alerts only

## Database Schema Needed

### Tables to Create

```sql
-- Family Groups
CREATE TABLE family_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- If child has account
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  nickname TEXT,
  date_of_birth DATE NOT NULL,
  age INTEGER NOT NULL,
  avatar_url TEXT,
  status TEXT DEFAULT 'active', -- active, pending, paused
  safety_tier TEXT DEFAULT 'moderate', -- strict, moderate, relaxed
  independence_level INTEGER DEFAULT 2, -- 1-5
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Permissions
CREATE TABLE child_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  can_scan_without_approval BOOLEAN DEFAULT FALSE,
  can_add_to_routine BOOLEAN DEFAULT FALSE,
  can_search_products BOOLEAN DEFAULT TRUE,
  can_view_ingredients BOOLEAN DEFAULT TRUE,
  can_access_learn BOOLEAN DEFAULT TRUE,
  can_chat_with_ai BOOLEAN DEFAULT FALSE,
  requires_approval_for_flagged BOOLEAN DEFAULT TRUE,
  max_daily_scans INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Devices
CREATE TABLE child_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- ios, android, web
  device_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- linked, pending, unlinked
  last_active TIMESTAMPTZ,
  linked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child Invitations
CREATE TABLE child_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES auth.users(id) NOT NULL,
  child_email TEXT,
  child_phone TEXT,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Activity (for tracking)
CREATE TABLE family_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- scan, search, routine_add, approval_request, flag
  product_id TEXT,
  product_name TEXT,
  description TEXT,
  requires_attention BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Features Implemented

### ✅ Completed
1. **Type System** - Complete family management types
2. **Service Layer** - CRUD operations for children
3. **Family Overview** - Dashboard showing all children
4. **Add Child Flow** - Complete onboarding for new child
5. **Safety Tiers** - Three-level safety system
6. **Independence Levels** - Five-level supervision system
7. **Age-Appropriate Defaults** - Auto-set permissions by age

### 🚧 To Implement Next
1. **Child Profile Screen** - View/edit individual child
2. **Child Switcher Component** - Quick switch between children
3. **Family Settings** - Manage family-wide preferences
4. **Device Linking** - Generate and validate invitation codes
5. **Permissions Editor** - Granular permission controls
6. **Activity Feed** - View child's recent activity
7. **Approval Queue** - Review pending product approvals

## User Flow

### Adding a Child
1. Parent taps "Add a Child" on family screen
2. Enters basic info (name, DOB)
3. Selects safety tier (Strict/Moderate/Relaxed)
4. Chooses independence level (1-5)
5. System creates child profile with age-appropriate defaults
6. Parent can generate invitation code to link child's device

### Managing Children
1. Parent views all children on family overview
2. Taps child card to view detailed profile
3. Can edit settings, permissions, safety tier
4. Views activity summary and pending approvals
5. Can pause or remove child if needed

### Safety System
- **Strict:** Everything requires approval
- **Moderate:** Safe products auto-approved, risky flagged
- **Relaxed:** Child has more freedom, major concerns flagged

### Independence System
- **Level 1-2:** Heavy supervision (6-11 years)
- **Level 3:** Monitored independence (12-14 years)
- **Level 4-5:** Semi to full independence (15+ years)

## Next Steps

1. **Create child profile detail screen**
2. **Build child switcher component**
3. **Implement device linking flow**
4. **Add approval queue screen**
5. **Create activity timeline**
6. **Build permissions editor**
7. **Add family settings screen**

## Navigation Structure

```
/family
  /index - Family overview
  /add-child - Add new child
  /child/[id] - Child profile detail
  /child/[id]/edit - Edit child
  /child/[id]/permissions - Edit permissions
  /child/[id]/activity - View activity
  /settings - Family settings
  /approvals - Approval queue
```

## Testing Checklist

- [ ] Add child with all required fields
- [ ] Age calculation works correctly
- [ ] Safety tier selection persists
- [ ] Independence level selection persists
- [ ] Default permissions set based on age
- [ ] Child appears in family overview
- [ ] Activity counters display correctly
- [ ] Device status shows correctly
- [ ] Edit child profile works
- [ ] Delete child works with confirmation
