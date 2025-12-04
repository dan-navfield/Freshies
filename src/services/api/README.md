# 🔍 Product & Ingredient Lookup APIs

Comprehensive API services for product scanning, ingredient analysis, and safety assessment.

## 📁 Architecture

```
src/services/api/
├── index.ts                    # Central exports
├── productLookup.ts            # Multi-source product lookup (orchestrator)
├── openBeautyFacts.ts          # Open Beauty Facts API integration
├── ingredientsLookup.ts        # Ingredient parsing & safety analysis
└── README.md                   # This file
```

## 🎯 Core Services

### 1. **Product Lookup** (`productLookup.ts`)

Main orchestrator that cascades through multiple data sources.

```typescript
import { lookupProduct } from '@/services/api';

const result = await lookupProduct('5060879820548');
// Returns: ProductData with source, confidence, and analysis
```

**Features:**
- Multi-source cascade (Open Beauty Facts → BeautyFeeds → Cosmethics)
- Automatic ingredient analysis
- Confidence scoring
- Error handling & fallbacks

**Current Sources:**
- ✅ Open Beauty Facts (primary)
- 🔜 BeautyFeeds.io (planned)
- 🔜 Cosmethics API (planned, requires API key)

---

### 2. **Open Beauty Facts** (`openBeautyFacts.ts`)

Free, open-source cosmetics database.

```typescript
import { lookupProductByBarcode, searchProductsByName } from '@/services/api';

// Barcode lookup
const product = await lookupProductByBarcode('5060879820548');

// Name search
const results = await searchProductsByName('moisturizer', 1);
```

**API Endpoint:** `https://world.openbeautyfacts.org/api/v2`

**Data Returned:**
- Product name, brand, category
- Images (front, ingredients, packaging)
- Full ingredient list (INCI format)
- Allergens, labels, packaging info
- Quantity, manufacturing details

**License:** Open Database License (ODbL)

---

### 3. **Ingredients Analysis** (`ingredientsLookup.ts`)

Parses and analyzes ingredient lists for safety concerns.

```typescript
import { analyzeIngredients, parseIngredientText } from '@/services/api';

const analysis = await analyzeIngredients(ingredientsText);
// Returns: IngredientAnalysis with safety score, flags, recommendations
```

**Features:**
- INCI name parsing
- Allergen detection
- Restricted ingredient flagging
- Banned substance identification
- Safety scoring (0-100)
- Age-specific concerns
- Parent-friendly recommendations

**Current Detection:**
- ✅ Common allergens (fragrance, parabens, SLS, etc.)
- ✅ Restricted ingredients (EU/AU regulations)
- ✅ Banned substances
- 🔜 INCI database integration
- 🔜 CosIng (EU) integration
- 🔜 Cosmethics API integration

---

## 🔄 Data Flow

```
User scans barcode
    ↓
lookupProduct(barcode)
    ↓
┌─────────────────────────────┐
│ Try Open Beauty Facts       │ ← Primary source
│ - Product metadata          │
│ - Ingredient list           │
└─────────────────────────────┘
    ↓ (if found)
┌─────────────────────────────┐
│ analyzeIngredients()        │ ← Automatic analysis
│ - Parse INCI names          │
│ - Check allergens           │
│ - Flag concerns             │
│ - Calculate safety score    │
└─────────────────────────────┘
    ↓
Return ProductData with analysis
```

---

## 📊 Data Structures

### ProductData
```typescript
interface ProductData {
  found: boolean;
  barcode?: string;
  source?: 'open_beauty_facts' | 'beauty_feeds' | 'cosmethics' | 'manual';
  product?: {
    name: string;
    brand: string;
    category: string;
    imageUrl?: string;
    ingredientsText?: string;
    ingredients?: Array<{...}>;
    allergens?: string[];
    labels?: string[];
    // ... more fields
  };
  analysis?: IngredientAnalysis;  // Automatic safety analysis
  confidence?: 'high' | 'medium' | 'low';
  error?: string;
}
```

### IngredientAnalysis
```typescript
interface IngredientAnalysis {
  totalIngredients: number;
  parsed: Ingredient[];
  safetyScore?: number;  // 0-100
  flags: {
    allergens: string[];
    restricted: string[];
    banned: string[];
    concerns: string[];
  };
  childSafe?: boolean;
  recommendations?: string[];
}
```

---

## 🔮 Planned Integrations

### BeautyFeeds.io
- **Purpose:** Retail product data, pricing, availability
- **Use Case:** E-commerce features, product recommendations
- **Status:** 🔜 Planned

### Cosmethics API
- **Purpose:** Deep ingredient intelligence, INCI decoding, regulatory data
- **Use Case:** Professional-grade ingredient analysis
- **Status:** 🔜 Planned (requires API key)
- **Regions:** EU-centric, global coverage

### CosIng Database (EU)
- **Purpose:** Official EU cosmetic ingredient database
- **Use Case:** Regulatory compliance, banned/restricted lists
- **Status:** 🔜 Planned (dataset download or wrapper API)

---

## 🧪 Testing

```typescript
// Test product lookup
const testBarcode = '5060879820548'; // Example cosmetic product
const result = await lookupProduct(testBarcode);
console.log(result);

// Test ingredient analysis
const testIngredients = 'Aqua, Glycerin, Parfum, Sodium Lauryl Sulfate';
const analysis = await analyzeIngredients(testIngredients);
console.log(analysis.safetyScore, analysis.flags);
```

---

## 🔒 Safety & Privacy

- All API calls are client-side (no data stored on our servers)
- Open Beauty Facts is GDPR-compliant
- No personal data sent to external APIs
- Barcode lookups are anonymous

---

## 📝 Contributing

To add a new data source:

1. Create new service file (e.g., `beautyFeeds.ts`)
2. Implement lookup function matching `ProductData` interface
3. Add to cascade in `productLookup.ts`
4. Update this README

---

## 🐛 Known Limitations

- Open Beauty Facts coverage varies by region
- Ingredient analysis is rule-based (not ML)
- Some products may have incomplete data
- INCI parsing may miss complex formulations

---

## 📚 References

- [Open Beauty Facts API](https://world.openbeautyfacts.org/data)
- [BeautyFeeds.io](https://beautyfeeds.io)
- [Cosmethics API](https://cosmethics.com)
- [CosIng Database](https://ec.europa.eu/growth/tools-databases/cosing/)
- [INCI Nomenclature](https://www.personalcarecouncil.org/science-safety/inci-nomenclature/)
