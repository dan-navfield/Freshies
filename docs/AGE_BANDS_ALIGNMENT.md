# Age Bands Alignment

## ✅ Unified Age Band System

All age bands across the app now use the same system:

```typescript
type AgeBand = '5-8' | '9-12' | '13-16' | '17-18';
```

## Where Age Bands Are Used

### 1. **Learn Content** (`src/services/learn/types.ts`)
- Educational articles filtered by age appropriateness
- Content complexity adjusted per age band
- Original system: `'5-8' | '9-12' | '13-16'`
- **Extended to include**: `'17-18'`

### 2. **Child Profiles** (`src/types/child.ts`)
- User profile age classification
- Determines onboarding flow
- Controls feature access
- **Now aligned**: `'5-8' | '9-12' | '13-16' | '17-18'`

### 3. **Database Schema** (`database/CREATE_CHILD_PROFILES_CLEAN.sql`)
- `child_profiles.age_band` column
- CHECK constraint enforces valid values
- **Updated to**: `('5-8', '9-12', '13-16', '17-18')`

## Age Band Characteristics

### **5-8 (Young Children)**
- **Not currently used for child app**
- Reserved for future parent-managed profiles
- Learn content only

### **9-12 (Tweens)**
- Simple, fun interface
- Basic skincare concepts
- Heavy parent oversight
- Limited autonomy

### **13-16 (Teens)**
- Moderate complexity
- Building independence
- Parent approval for purchases
- Can hide some data from parents

### **17-18 (Older Teens)**
- Full detail and autonomy
- Mature content
- Parent approval for purchases only
- Most privacy controls

## Migration Impact

### ✅ **Completed:**
- TypeScript types updated
- Database schema updated
- Onboarding screens updated
- Documentation updated

### 🔄 **To Update (if needed):**
- Existing child profiles in database (if any)
- Parent invitation links
- Learn content filtering logic

## Benefits of Alignment

1. **Consistency** - One age system across entire app
2. **Content Matching** - Learn articles match user age automatically
3. **Simpler Logic** - No conversion between systems needed
4. **Future-Proof** - Easy to add new age bands if needed

## Code Examples

### Creating a Child Profile
```typescript
const profile: ChildProfile = {
  age_band: '13-16', // ✅ Valid
  // age_band: '13-15', // ❌ Invalid - old system
  ...
};
```

### Filtering Learn Content
```typescript
const articles = await getArticles({
  age_bands: ['13-16'], // ✅ Matches user's age_band
});
```

### Routing Onboarding
```typescript
switch (ageBand) {
  case '9-12':
    return 'tween';
  case '13-16':
    return 'teen';
  case '17-18':
    return 'older-teen';
}
```
