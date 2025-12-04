# Logo Integration Summary

**Date:** November 16, 2024

## Logo Assets Location

All logo files are organized in: `assets/logo/`

### Available Formats

**SVG Files (Root)**
- `freshies-logo-main-black.svg`
- `freshies-logo-main-colours-responsive.svg` ✅ **Used in app**
- `freshies-logo-main-colours.svg`
- `freshies-logo-main-white.svg`

**PNG Files (Organized by Color)**
- `PNG/Black/` - Black logo variants (@1x, @2x, @3x)
- `PNG/White/` - White logo variants (@1x, @2x, @3x)
- `PNG/Colour/` - Color logo variants (@1x, @2x, @3x)

## Implementation

### SVG Support Setup

**Installed Package:**
```bash
npm install react-native-svg-transformer
```

**Metro Configuration** (`metro.config.js`)
- Configured to handle SVG files as components
- SVG files are treated as source files, not assets
- Uses `react-native-svg-transformer` for transformation

**TypeScript Declaration** (`svg.d.ts`)
- Added type definitions for SVG imports
- Allows importing SVG files as React components

### Welcome Screen Integration

**File:** `app/(auth)/welcome.tsx`

**Usage:**
```tsx
import FreshiesLogo from '../../assets/logo/freshies-logo-main-colours-responsive.svg';

<FreshiesLogo 
  width={180}
  height={60}
/>
```

**Styling:**
- Logo positioned above tagline in hero section
- 24px margin bottom (spacing[6])
- 180x60 dimensions for optimal visibility

## Logo Usage Guidelines

### When to Use Each Variant

**Colored Logo** (`freshies-logo-main-colours-responsive.svg`)
- ✅ Light backgrounds
- ✅ Welcome/splash screens with dark overlays
- ✅ Marketing materials

**White Logo** (`freshies-logo-main-white.svg`)
- ✅ Dark backgrounds
- ✅ Photos with dark overlays
- ✅ Currently used on welcome screen

**Black Logo** (`freshies-logo-main-black.svg`)
- ✅ White/light backgrounds
- ✅ Print materials
- ✅ Documentation

### Responsive Sizes

For different screen sizes, adjust the width/height props:
- **Small screens:** width={140} height={47}
- **Medium screens:** width={180} height={60} (current)
- **Large screens:** width={220} height={73}

## Technical Notes

### SVG vs PNG

**SVG Advantages:**
- ✅ Scales perfectly at any size
- ✅ Smaller file size
- ✅ Can be styled/colored dynamically
- ✅ Better for responsive design

**PNG Advantages:**
- ✅ Better compatibility (fallback)
- ✅ No transformer needed
- ✅ Automatic @2x/@3x handling

### Current Implementation
Using SVG for best quality and flexibility. PNG versions available as fallback if needed.

## Next Steps

1. ✅ Logo integrated on welcome screen
2. Consider adding logo to:
   - App header/navigation
   - Loading screens
   - Email templates
   - Push notifications
3. Create logo component variants for different use cases
