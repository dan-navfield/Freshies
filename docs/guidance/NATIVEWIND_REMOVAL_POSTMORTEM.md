# NativeWind Removal Postmortem

## Date
November 16, 2025

## Issue Summary
The app failed to load after commit `9a1ae3d` which removed NativeWind and converted the codebase to use React Native StyleSheet API.

## Root Cause
The commit that removed NativeWind (`9a1ae3d: fix: remove NativeWind, fix tsconfig jsxImportSource, use StyleSheet with Fabric`) successfully converted most files but **missed 3 files** that still contained Tailwind `className` attributes:

1. `app/(onboarding)/child-approval.tsx` - 23 className instances
2. `components/ui/Button.tsx` - 2 className instances  
3. `components/ui/Card.tsx` - 1 className instance

## What Happened

### The Breaking Change
```
Commit: 9a1ae3d
Changes:
- Removed NativeWind and Tailwind dependencies from package.json
- Removed tailwind.config.js
- Removed nativewind-env.d.ts
- Updated tsconfig.json to remove jsxImportSource: "nativewind"
- Converted index.tsx and _layout.tsx to StyleSheet
- Created src/theme/styles.ts with StyleSheet utilities
```

### Why It Failed
React Native doesn't recognize the `className` prop without NativeWind. When the app tried to render components with `className` attributes:
- React Native ignored the className prop (it's not a valid prop)
- Components rendered without any styling
- The app got stuck on the splash screen showing "New update available, downloading..."
- Metro bundler couldn't serve the bundle because the app was looking for the wrong server

## Files That Were Fixed

### 1. child-approval.tsx
**Problem:** All 23 View, Text, and TouchableOpacity components still used className
**Solution:** Converted to StyleSheet with proper theme tokens

### 2. Button.tsx  
**Problem:** Used className for button container and text styling
**Solution:** Converted to StyleSheet with variant-based styling using dynamic style arrays

### 3. Card.tsx
**Problem:** Used className for card variants
**Solution:** Converted to StyleSheet with variant-based styling

## Prevention Steps

### 1. Pre-commit Checks
Add a git pre-commit hook to check for className usage:

```bash
#!/bin/sh
# .git/hooks/pre-commit

if git diff --cached --name-only | grep -E '\.(tsx|ts)$' | xargs grep -l 'className=' > /dev/null; then
  echo "❌ Error: Found 'className' usage in staged files"
  echo "NativeWind has been removed. Use StyleSheet instead."
  git diff --cached --name-only | grep -E '\.(tsx|ts)$' | xargs grep -n 'className='
  exit 1
fi
```

### 2. Linting Rule
Add ESLint rule to catch className usage:

```json
{
  "rules": {
    "react/forbid-component-props": ["error", {
      "forbid": [{
        "propName": "className",
        "message": "Use 'style' prop with StyleSheet instead of className"
      }]
    }]
  }
}
```

### 3. Search Before Major Refactors
Before removing a styling system:
```bash
# Find all className usage
grep -r "className=" app components --include="*.tsx" --include="*.ts"

# Count instances
grep -r "className=" app components --include="*.tsx" --include="*.ts" | wc -l
```

### 4. Incremental Migration
When removing a dependency that affects many files:
1. Create a migration checklist of all affected files
2. Convert files in small batches
3. Test after each batch
4. Use TypeScript to catch prop mismatches

## Lessons Learned

1. **Complete the migration** - Don't leave any files unconverted when removing a core dependency
2. **Search thoroughly** - Use grep to find ALL instances before considering migration complete
3. **Test immediately** - Don't commit large refactors without testing the app loads
4. **UI components matter** - Shared components (Button, Card) affect many screens
5. **Metro cache issues** - Sometimes need to clear cache and rebuild native code after major changes

## Recovery Steps Taken

1. Killed all Metro bundler processes on ports 8081 and 8082
2. Cleared Metro cache with `npx expo start --clear`
3. Ran `npx expo prebuild --clean` to regenerate native iOS/Android code
4. Converted the 3 remaining files to StyleSheet
5. Rebuilt and relaunched the app

## Current Status
✅ All files converted to StyleSheet
✅ No remaining className usage in codebase
✅ App loading successfully
✅ Theme tokens properly imported and used

## Files Modified in Fix
- `app/(onboarding)/child-approval.tsx` - Converted to StyleSheet
- `components/ui/Button.tsx` - Converted to StyleSheet with variant system
- `components/ui/Card.tsx` - Converted to StyleSheet with variant system
