# Child Onboarding Flows

## Entry Points

### 1. **Parent Invitation Link** (Age Known)
- Parent sends invite link with child's age
- Child clicks link → Auto-creates account with age
- Goes directly to age-appropriate onboarding

### 2. **Direct Child Signup** (Age Unknown)
- Child signs up independently
- **First screen: Age selection**
- Then routes to age-appropriate onboarding

## Age-Based Onboarding Versions

**Note:** Age bands align with existing learn content system: `'5-8' | '9-12' | '13-16' | '17-18'`

### **Ages 9-12 (Tweens)**
**Tone:** Very simple, fun, emoji-heavy
**Complexity:** Basic choices only
**Flow:**
1. Age confirmation (if direct signup)
2. Skin type (5 simple options with pictures)
3. "Any problems?" (3-4 basic concerns: pimples, dry, oily, sensitive)
4. "What do you want?" (2-3 simple goals: clear skin, soft skin, feel good)
5. Avatar builder (fun, colorful)
6. Complete!

**Features:**
- Larger text and buttons
- More emojis and illustrations
- Simpler language
- Fewer options
- Parent must approve everything

### **Ages 13-16 (Teens)**
**Tone:** Friendly, encouraging, relatable
**Complexity:** Moderate detail
**Flow:**
1. Age confirmation (if direct signup)
2. Skin type (5 options with detailed descriptions)
3. Skin concerns (7 options with explanations)
4. Goals (5-7 options, pick up to 3)
5. Lifestyle questions (makeup use, sports, environment)
6. Avatar/theme selection
7. Complete!

**Features:**
- Teen-friendly language
- More detailed explanations
- Optional selfie analysis (parent-approved)
- Can request products with parent approval

### **Ages 17-18 (Older Teens)**
**Tone:** Mature, informative, empowering
**Complexity:** Full detail
**Flow:**
1. Age confirmation (if direct signup)
2. Detailed skin assessment
   - Skin type
   - Sensitivity level (1-5 scale)
   - Specific concerns with severity
   - Oiliness zones (T-zone, cheeks, etc.)
3. Lifestyle & environment
   - Makeup frequency
   - Sports/activities
   - Climate/environment
   - Current routine (if any)
4. Goals & priorities (pick up to 5, rank them)
5. Ingredient preferences
   - Known sensitivities
   - Texture preferences
   - Fragrance tolerance
6. Optional: AI selfie analysis
7. Profile customization
8. Complete!

**Features:**
- More autonomy
- Detailed ingredient info
- Can build routines independently
- Parent approval for purchases only
- Educational content unlocked

## Implementation Structure

```
app/(child)/onboarding/
├── entry.tsx              # Determines entry point
├── age-select.tsx         # For direct signups
├── 
├── (10-12)/              # Tween flow
│   ├── welcome.tsx
│   ├── skin-type.tsx
│   ├── problems.tsx
│   ├── goals.tsx
│   ├── avatar.tsx
│   └── complete.tsx
│
├── (13-15)/              # Early teen flow
│   ├── welcome.tsx
│   ├── skin-type.tsx
│   ├── concerns.tsx
│   ├── goals.tsx
│   ├── lifestyle.tsx
│   ├── avatar.tsx
│   └── complete.tsx
│
└── (16-18)/              # Older teen flow
    ├── welcome.tsx
    ├── skin-assessment.tsx
    ├── concerns-detailed.tsx
    ├── lifestyle.tsx
    ├── goals.tsx
    ├── preferences.tsx
    ├── selfie-analysis.tsx (optional)
    ├── customize.tsx
    └── complete.tsx
```

## Data Collection by Age

### 10-12 (Minimal)
- Age band
- Skin type (basic)
- 2-3 concerns max
- 2-3 goals max
- Avatar config

### 13-15 (Moderate)
- Age band
- Skin type
- Concerns (up to 5)
- Goals (up to 3)
- Makeup frequency
- Environmental factors
- Avatar/theme

### 16-18 (Detailed)
- Age band
- Skin type + sensitivity level
- Detailed concerns with zones
- Goals (up to 5) with priorities
- Full lifestyle assessment
- Ingredient preferences
- Texture preferences
- Optional selfie data

## Parent Controls by Age

### 10-12
- ✅ Parent must approve ALL products
- ✅ Parent sees all scans
- ✅ Parent controls all settings
- ✅ No direct messaging
- ✅ No selfie analysis

### 13-15
- ✅ Parent approves new products
- ✅ Parent can view scans (child can hide)
- ⚠️ Child can adjust some settings
- ✅ No direct messaging
- ⚠️ Selfie analysis with parent permission

### 16-18
- ⚠️ Parent approves purchases only
- ⚠️ Scans are private by default
- ✅ Child controls most settings
- ⚠️ Moderated reviews allowed
- ⚠️ Selfie analysis with consent

## Next Steps

1. Create entry point router
2. Build age selection screen
3. Create 3 separate onboarding flows
4. Add age-appropriate UI components
5. Implement parent permission checks
