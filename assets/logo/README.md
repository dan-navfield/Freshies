# Freshies Logo Assets

This folder contains all Freshies logo files in various formats and colors.

## Structure

```
logo/
├── SVG (Root Level)
│   ├── freshies-logo-main-black.svg
│   ├── freshies-logo-main-colours-responsive.svg ⭐ Primary
│   ├── freshies-logo-main-colours.svg
│   └── freshies-logo-main-white.svg
│
├── Black/
│   └── PNG/
│       ├── freshies-logo-main-black.png
│       ├── freshies-logo-main-black@2x.png
│       └── freshies-logo-main-black@3x.png
│
├── White/
│   └── PNG/
│       ├── freshies-logo-main-white.png
│       ├── freshies-logo-main-white@2x.png
│       └── freshies-logo-main-white@3x.png
│
├── Colour/
│   ├── freshies-logo-main-colour.png
│   ├── freshies-logo-main-colour@2x.png
│   └── freshies-logo-main-colour@3x.png
│
└── PNG/ (Duplicates - can be cleaned up)
    ├── Black/
    ├── White/
    └── Colour/
```

## Usage in App

### Import SVG (Recommended)
```tsx
import FreshiesLogo from '../../assets/logo/freshies-logo-main-colours-responsive.svg';

<FreshiesLogo width={180} height={60} />
```

### Import PNG (Fallback)
```tsx
import { Image } from 'react-native';

<Image 
  source={require('../../assets/logo/White/PNG/freshies-logo-main-white.png')}
  style={{ width: 180, height: 60 }}
  resizeMode="contain"
/>
```

## Color Variants

| Variant | Use Case | Background |
|---------|----------|------------|
| **Colour** | Primary branding, light backgrounds | White/Light |
| **White** | Dark backgrounds, photos | Dark/Photos |
| **Black** | Light backgrounds, print | White/Light |

## File Formats

- **SVG**: Vector format, scales perfectly, recommended for app
- **PNG**: Raster format with @2x/@3x for retina displays

## Notes

- SVG files require `react-native-svg-transformer` (already configured)
- PNG files automatically use @2x/@3x based on device pixel ratio
- Responsive SVG adjusts to container size
