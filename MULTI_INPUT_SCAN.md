# Multi-Input Product Scanning

## 🎯 Overview

The new scan screen captures **multiple inputs from one scanning session** to maximize product identification accuracy and ingredient analysis.

## 📸 Three-Step Scanning Process

### Step 1: Barcode Scan
**Purpose**: Quick product identification
- **Method**: Live camera barcode detection
- **Target**: Line up barcode in mint-colored rectangle
- **Auto-capture**: Automatically detects and captures barcode
- **Fallback**: Can skip if barcode not available

**What it provides**:
- Exact product match from database
- UPC/EAN/ISBN identification
- Fast lookup

### Step 2: Product Photo
**Purpose**: Visual product identification + backup barcode detection
- **Method**: Camera capture with cropping
- **Target**: Front of product (brand, name, packaging)
- **Aspect ratio**: 3:4 (portrait)
- **Can skip**: Optional if barcode worked

**What it provides**:
- Product name OCR
- Brand identification
- Backup barcode detection (if missed in Step 1)
- Visual confirmation
- Future: Image-based product matching

### Step 3: Ingredients List
**Purpose**: Comprehensive ingredient analysis
- **Method**: Camera capture (no cropping for full list)
- **Target**: Ingredients text on back of product
- **OCR**: Extracts all ingredient names
- **Can skip**: Optional but reduces accuracy

**What it provides**:
- Complete ingredient list
- Ingredient normalization (30K+ database)
- Safety scoring
- Allergen detection
- Personalized analysis

## 🔄 Data Flow

```
┌─────────────────┐
│  Step 1: Scan   │
│    Barcode      │ → Captures: "123456789012"
└────────┬────────┘
         ↓
┌─────────────────┐
│  Step 2: Photo  │
│    Product      │ → Captures: Image URI + OCR text
└────────┬────────┘   Extracts: "CeraVe Hydrating Cleanser"
         ↓            Backup: Detects barcode if missed
┌─────────────────┐
│  Step 3: Photo  │
│   Ingredients   │ → Captures: Image URI + OCR text
└────────┬────────┘   Extracts: "Aqua, Glycerin, Cetearyl Alcohol..."
         ↓
┌─────────────────┐
│  Backend API    │
│  POST /scan     │ → Sends all captured data
└────────┬────────┘
         ↓
┌─────────────────┐
│   Orchestrator  │ → Processes in parallel:
│                 │   - Barcode lookup
│                 │   - Product name fuzzy search
│                 │   - Ingredient normalization
│                 │   - Safety scoring
└────────┬────────┘
         ↓
┌─────────────────┐
│  Scan Result    │ → Returns:
│                 │   - Product details
│                 │   - Normalized ingredients
│                 │   - Risk score
│                 │   - Safety rating
│                 │   - Detailed reasons
└─────────────────┘
```

## 🎨 UI/UX Features

### Progress Indicator
- **3-step progress bar** at top
- Shows: Barcode (1) → Product (2) → Ingredients (3)
- Completed steps turn mint green
- Current step pulses

### Scan Areas
Each step has a distinct colored frame:
- **Barcode**: Mint rectangle (120px height)
- **Product**: Purple rectangle (200px height)
- **Ingredients**: Yellow rectangle (150px height)

### Corner Brackets
- Animated corners on each scan area
- Pulse animation on active area
- Visual guide for alignment

### Skip Functionality
- Can skip any step
- "Skip This Step" button at bottom
- Final step shows "Finish & Analyze"
- Processes with whatever data captured

### Start Over
- Reset button appears after first capture
- Clears all captured data
- Returns to Step 1

## 🔧 Technical Implementation

### State Management
```typescript
const [scanMode, setScanMode] = useState<'barcode' | 'product' | 'ingredients'>('barcode');
const [capturedData, setCapturedData] = useState<{
  barcode?: string;
  productImage?: string;
  ingredientsText?: string;
}>({});
```

### Auto-Progression
1. **Barcode detected** → Auto-advance to Product
2. **Product photo taken** → Auto-advance to Ingredients
3. **Ingredients photo taken** → Auto-process all data

### Barcode Detection
- **Live scanning** for Step 1
- **Image analysis** for Step 2 (backup)
- Uses expo-camera barcode scanner
- Supports: EAN13, EAN8, UPC-A, UPC-E, Code128, Code39, etc.

### OCR Processing
- **Product photo**: Extract brand + product name
- **Ingredients photo**: Extract full ingredient list
- Uses Google Cloud Vision API
- Handles multi-line text
- Cleans and normalizes output

### Backend Integration
```typescript
const scanResult = await scanProduct({
  barcodeHint: capturedData.barcode,
  imageUrl: capturedData.productImage,
  // Ingredients text passed in result
  childProfile: {
    age: 8,
    skinType: 'normal',
    allergies: [],
  },
});
```

## 📊 Data Prioritization

Backend uses this priority for product identification:

1. **Barcode** (highest confidence)
   - Exact match from database
   - Confidence: 1.0

2. **Product Image + OCR**
   - Brand + name fuzzy search
   - Confidence: 0.7-0.9

3. **Ingredients List**
   - Ingredient-based matching
   - Confidence: 0.5-0.7

4. **Combined Analysis**
   - Cross-reference all inputs
   - Highest confidence match wins

## 🎯 Benefits

### For Users:
- **Higher accuracy**: Multiple data points
- **Flexibility**: Can skip unavailable steps
- **Guidance**: Clear visual instructions
- **Fast**: Auto-progression between steps
- **Forgiving**: Works even with partial data

### For System:
- **Better matching**: More data = better results
- **Fallback options**: Multiple identification methods
- **Richer data**: Captures product images for future ML
- **Ingredient analysis**: Direct OCR of ingredients
- **Quality**: Visual confirmation of products

## 🚀 Future Enhancements

### Phase 1 (Current):
- ✅ Multi-step capture flow
- ✅ Barcode + Product + Ingredients
- ✅ OCR text extraction
- ✅ Backend integration

### Phase 2:
- 🔄 Image-based product matching (ML)
- 🔄 Smart crop suggestions
- 🔄 Real-time OCR preview
- 🔄 Confidence indicators per step

### Phase 3:
- 🔄 Batch scanning (multiple products)
- 🔄 History/recent scans
- 🔄 Product image gallery
- 🔄 Community contributions

### Phase 4:
- 🔄 AR overlay for ingredient highlighting
- 🔄 Voice guidance
- 🔄 Accessibility features
- 🔄 Offline mode with sync

## 📱 Usage Example

```typescript
// User flow:
1. Opens scan screen
2. Lines up barcode → Auto-captured
3. Alert: "Barcode captured! Now take product photo"
4. Takes product photo → Auto-advance
5. Alert: "Product photo captured! Now take ingredients"
6. Takes ingredients photo → Auto-process
7. Loading: "Analyzing..."
8. Navigate to results with full safety analysis
```

## 🔄 Migration from Old Scan Screen

### Old Flow:
- Single barcode scan
- Manual search option
- Separate ingredient camera

### New Flow:
- Guided 3-step process
- All inputs in one session
- Comprehensive analysis

### To Switch:
1. Rename `scan.tsx` to `scan-old.tsx`
2. Rename `scan-new.tsx` to `scan.tsx`
3. Test full flow
4. Update product-result screen to handle new params

## ✅ Testing Checklist

- [ ] Barcode detection works
- [ ] Product photo capture works
- [ ] Ingredients photo capture works
- [ ] OCR extracts text correctly
- [ ] Skip buttons work
- [ ] Start over resets state
- [ ] Progress indicator updates
- [ ] Auto-progression works
- [ ] Backend receives all data
- [ ] Results screen displays correctly
- [ ] Error handling works
- [ ] Permissions handled properly

---

**Status**: ✅ Ready for testing
**File**: `app/(tabs)/scan-new.tsx`
**Next**: Test and migrate to main scan screen
