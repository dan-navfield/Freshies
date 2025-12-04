# Age Bands - Final Specification

## ✅ Official Age Band System

```typescript
type AgeBand = '0-4' | '5-9' | '10-12' | '13-15' | '16-18';
```

## Age Band Breakdown

### **0-4 years** - Parent-Only Mode
**No Child App Access**
- Parent scans all products
- Parent checks safety
- Parent manages routines
- Child profile exists but no login
- All features in parent app

**Features:**
- ✅ Parent can create profile for tracking
- ✅ Product safety checking
- ✅ Routine management
- ❌ No child login
- ❌ No child interface

---

### **5-9 years** - Parent-Only Mode
**No Child App Access**
- Parents manage everything
- Products, routines, safety
- Child profile for tracking only
- Educational content for parents

**Features:**
- ✅ Parent manages products
- ✅ Parent manages routines
- ✅ Safety checking
- ✅ Age-appropriate learn content (for parents)
- ❌ No child login
- ❌ No child interface

---

### **10-12 years** - First Child App Tier
**Simple, Parent-Controlled**
- Child can scan products
- See simple insights
- Follow routines
- Wishlist items (parent approval required)
- Very limited autonomy

**Features:**
- ✅ Child login and profile
- ✅ Simple scan interface
- ✅ Basic product insights
- ✅ Routine following (parent-created)
- ✅ Wishlist with approval
- ✅ Favorites
- ⚠️ Parent sees ALL activity
- ⚠️ Parent approves EVERYTHING
- ❌ No selfie analysis
- ❌ No reviews
- ❌ Limited learn content

**Parent Controls:**
- Full visibility
- Approve all products
- Approve all routine changes
- See all scans
- Control all settings

---

### **13-15 years** - Full Child App
**Moderate Autonomy**
- Full scanning and insights
- Routines (can create own)
- Learning hub access
- Safe reviews (moderated)
- Wishlisting with parent approval
- Optional selfie analysis (parent permission)

**Features:**
- ✅ Full scan interface
- ✅ Detailed insights
- ✅ Create own routines
- ✅ Learning hub
- ✅ Moderated reviews (read & write)
- ✅ Wishlist with approval
- ✅ Favorites
- ✅ Expiry tracking
- ⚠️ Selfie analysis (parent opt-in)
- ⚠️ Can hide some scans from parent
- ⚠️ Parent approval for purchases

**Parent Controls:**
- Can view activity (child can hide some)
- Approve purchases
- Control selfie analysis
- Set ingredient restrictions
- Moderate review submissions

---

### **16-18 years** - Most Autonomous
**Lighter Parent Controls**
- All features active
- Most privacy controls
- Parent approval for purchases only
- Full learning hub
- Full review access
- Selfie analysis available

**Features:**
- ✅ All scanning features
- ✅ Full insights and recommendations
- ✅ Complete routine management
- ✅ Full learning hub
- ✅ Reviews (read & write, moderated)
- ✅ Wishlist with approval
- ✅ Selfie analysis
- ✅ Ingredient preferences
- ✅ Privacy controls
- ✅ Most data hidden from parent by default

**Parent Controls:**
- Approve purchases only
- Set budget limits
- Emergency override
- Minimal visibility (unless child shares)

---

## Feature Matrix

| Feature | 0-4 | 5-9 | 10-12 | 13-15 | 16-18 |
|---------|-----|-----|-------|-------|-------|
| Child Login | ❌ | ❌ | ✅ | ✅ | ✅ |
| Scan Products | ❌ | ❌ | ✅ | ✅ | ✅ |
| Simple Insights | ❌ | ❌ | ✅ | ✅ | ✅ |
| Detailed Insights | ❌ | ❌ | ❌ | ✅ | ✅ |
| Follow Routines | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create Routines | ❌ | ❌ | ❌ | ✅ | ✅ |
| Wishlist | ❌ | ❌ | ✅ | ✅ | ✅ |
| Learning Hub | ❌ | ❌ | Limited | ✅ | ✅ |
| Reviews (Read) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Reviews (Write) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Selfie Analysis | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Privacy Controls | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Parent Approval | N/A | N/A | All | Purchases | Purchases |
| Parent Visibility | Full | Full | Full | High | Low |

## Onboarding Flows

### 10-12 (Tween)
1. Welcome
2. Simple skin type (5 options with pictures)
3. Any problems? (3-4 basic options)
4. What do you want? (2-3 simple goals)
5. Avatar builder
6. Complete!

### 13-15 (Teen)
1. Welcome
2. Skin type (detailed)
3. Skin concerns (7 options)
4. Goals (pick up to 3)
5. Lifestyle questions
6. Avatar/theme
7. Complete!

### 16-18 (Older Teen)
1. Welcome
2. Detailed skin assessment
3. Concerns with severity
4. Lifestyle & environment
5. Goals with priorities (up to 5)
6. Ingredient preferences
7. Optional selfie analysis
8. Profile customization
9. Complete!

## Database Schema

```sql
age_band TEXT CHECK (age_band IN ('0-4', '5-9', '10-12', '13-15', '16-18'))
```

## Implementation Notes

- **0-4 and 5-9**: Profile exists in database but `user_id` is NULL (parent-managed only)
- **10-12+**: Profile has `user_id` (child can login)
- Age band determines feature flags throughout app
- Parent controls adjust automatically based on age
