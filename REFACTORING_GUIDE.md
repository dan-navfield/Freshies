# Freshies App - Refactoring Guide

**Created:** January 17, 2026
**Purpose:** Guide for refactoring large, complex files into maintainable components

---

## 🎯 Overview

This guide identifies files exceeding 1,500 lines and provides concrete refactoring strategies. These files are functional but difficult to maintain, test, and understand.

---

## 📊 Files Requiring Refactoring

### Priority 1: Critical (>2,000 lines)

| File | Lines | Complexity | Priority |
|------|-------|------------|----------|
| `app/(child)/freshie-gallery.tsx` | 2,920 | Very High | Critical |
| `app/(shared)/product-result.tsx` | 2,870 | Very High | Critical |

### Priority 2: High (1,500-2,000 lines)

| File | Lines | Complexity | Priority |
|------|-------|------------|----------|
| `app/(child)/routine-builder-enhanced.tsx` | 1,625 | High | High |
| `app/(child)/(tabs)/routine.tsx` | 1,325 | High | High |

### Priority 3: Medium (1,000-1,500 lines)

| File | Lines | Complexity | Priority |
|------|-------|------------|----------|
| `app/(child)/(tabs)/learn.tsx` | 1,180 | Medium | Medium |
| `app/(child)/account.tsx` | 1,086 | Medium | Medium |
| `app/(tabs)/routine.tsx` | 1,075 | Medium | Medium |
| `app/(tabs)/index.tsx` | 1,059 | Medium | Low |

**Total Lines to Refactor:** ~12,000+ lines across 8 files

---

## 🔍 Detailed Analysis

### 1. `app/(child)/freshie-gallery.tsx` (2,920 lines)

**Current Issues:**
- **State Explosion:** 20+ useState hooks
- **Multiple Responsibilities:** Upload, display, filter, search, edit, delete
- **Monolithic Component:** Everything in one file

**State Management (20+ variables):**
```typescript
- freshies, loading, selectedFreshie, showUploadMenu
- uploadStep, pendingUploadUri, selectedMood, selectedCollections
- moods, collections, isSelectMode, selectedFreshieIds
- showFilterMenu, searchQuery, showSearchSuggestions, recentSearches
- filterMoods, filterCollections, filterTags, showFavoritesOnly
- sortBy, refreshing, ...and more
```

**Recommended Refactoring:**

#### Step 1: Extract State Management
Create a custom hook to manage gallery state:

```typescript
// src/hooks/useFreshieGallery.ts
export function useFreshieGallery() {
  // All state logic here
  return {
    freshies,
    loading,
    actions: {
      loadFreshies,
      deleteFreshie,
      updateFreshie,
    },
    filters: {
      searchQuery,
      setSearchQuery,
      filterMoods,
      applyFilters,
    }
  };
}
```

#### Step 2: Extract Components
Break into smaller components:

```
src/components/gallery/
├── FreshieGalleryGrid.tsx          (~200 lines)
│   └── Displays grid of freshies
├── FreshieCard.tsx                 (~150 lines)
│   └── Individual freshie card
├── FreshieDetailModal.tsx          (~300 lines)
│   └── Full freshie view with actions
├── FreshieUploadWizard.tsx         (~400 lines)
│   ├── MoodSelector.tsx
│   ├── CollectionSelector.tsx
│   └── NoteEditor.tsx
├── FreshieFilters.tsx              (~250 lines)
│   ├── SearchBar.tsx
│   ├── FilterMenu.tsx
│   └── SortOptions.tsx
├── FreshieMultiSelect.tsx          (~200 lines)
│   └── Bulk actions toolbar
└── FreshieGroupedView.tsx          (~150 lines)
    └── Grouped by date/segment/tags
```

#### Step 3: Extract Business Logic
Create service layer:

```typescript
// src/services/freshieGalleryService.ts
export const freshieGalleryService = {
  async loadFreshies(userId: string): Promise<Freshie[]> {},
  async uploadFreshie(data: UploadData): Promise<Freshie> {},
  async deleteFreshie(id: string): Promise<void> {},
  async updateFreshie(id: string, updates: Partial<Freshie>): Promise<Freshie> {},
  filterFreshies(freshies: Freshie[], filters: Filters): Freshie[] {},
  searchFreshies(freshies: Freshie[], query: string): Freshie[] {},
  groupFreshies(freshies: Freshie[], groupBy: GroupBy): GroupedFreshies {},
};
```

#### Refactored Structure:
```typescript
// app/(child)/freshie-gallery.tsx (now ~400 lines)
export default function FreshieGalleryScreen() {
  const {
    freshies,
    loading,
    actions,
    filters
  } = useFreshieGallery();

  return (
    <View>
      <DetailPageHeader />
      <FreshieFilters {...filters} />
      <FreshieGalleryGrid
        freshies={freshies}
        loading={loading}
        onSelect={setSelectedFreshie}
      />
      {selectedFreshie && (
        <FreshieDetailModal
          freshie={selectedFreshie}
          onClose={() => setSelectedFreshie(null)}
          onDelete={actions.deleteFreshie}
        />
      )}
      <FreshieUploadWizard
        visible={showUploadMenu}
        onComplete={actions.uploadFreshie}
      />
    </View>
  );
}
```

**Benefits:**
- Main file: 2,920 → ~400 lines (85% reduction)
- Testable components
- Reusable logic
- Clear separation of concerns

---

### 2. `app/(shared)/product-result.tsx` (2,870 lines)

**Current Issues:**
- **Feature Overload:** Safety info, ingredients, reviews, sharing, wishlist, approval
- **Multiple UI States:** Loading, error, success, detail views
- **Embedded Components:** Many small components defined inline

**Recommended Refactoring:**

#### Extract Major Sections:
```
src/components/product-detail/
├── ProductDetailHeader.tsx         (~200 lines)
│   ├── Product image, name, brand
│   └── Quick actions (share, wishlist, approve)
├── SafetySection.tsx              (~350 lines)
│   ├── SafetyScore.tsx
│   ├── SafetyFlags.tsx
│   └── AgeAppropriateness.tsx
├── IngredientsSection.tsx         (~400 lines)
│   ├── IngredientsList.tsx
│   ├── IngredientCard.tsx
│   └── IngredientSearchBar.tsx
├── ReviewsSection.tsx             (~350 lines)
│   ├── ReviewsList.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewForm.tsx
│   └── ReviewStatistics.tsx
├── UsageSection.tsx               (~200 lines)
│   └── How to use, frequency, tips
├── ApprovalSection.tsx            (~250 lines)
│   ├── Parent approval request
│   └── Approval status badge
├── SimilarProducts.tsx            (~200 lines)
│   └── Recommendations
└── WishlistActions.tsx            (~150 lines)
    └── Add to wishlist, notes
```

#### Create Product Detail Hook:
```typescript
// src/hooks/useProductDetail.ts
export function useProductDetail(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Load all data
  useEffect(() => {
    loadProduct();
    loadSafetyAnalysis();
    loadReviews();
  }, [productId]);

  return {
    product,
    loading,
    safetyAnalysis,
    reviews,
    actions: {
      addToWishlist,
      requestApproval,
      submitReview,
      shareProduct,
    }
  };
}
```

#### Refactored Structure:
```typescript
// app/(shared)/product-result.tsx (now ~500 lines)
export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams();
  const {
    product,
    loading,
    safetyAnalysis,
    reviews,
    actions
  } = useProductDetail(productId as string);

  if (loading) return <LoadingState />;
  if (!product) return <ErrorState />;

  return (
    <ScrollView>
      <ProductDetailHeader
        product={product}
        onShare={actions.shareProduct}
        onWishlist={actions.addToWishlist}
      />

      <SafetySection
        product={product}
        analysis={safetyAnalysis}
      />

      <IngredientsSection
        ingredients={product.ingredients}
      />

      <UsageSection
        product={product}
      />

      <ReviewsSection
        reviews={reviews}
        onSubmit={actions.submitReview}
      />

      {needsApproval && (
        <ApprovalSection
          product={product}
          onRequest={actions.requestApproval}
        />
      )}

      <SimilarProducts
        currentProduct={product}
      />
    </ScrollView>
  );
}
```

**Benefits:**
- Main file: 2,870 → ~500 lines (82% reduction)
- Each section independently testable
- Easier to add/modify features
- Better code navigation

---

### 3. `app/(child)/routine-builder-enhanced.tsx` (1,625 lines)

**Current Issues:**
- **Step Management:** Complex drag-and-drop, reordering
- **Product Integration:** Product selection and assignment
- **Template System:** Template loading and application
- **Multiple Modals:** Step editor, product selector, template picker

**Recommended Refactoring:**

```
src/components/routine-builder/
├── RoutineBuilderCanvas.tsx       (~300 lines)
│   └── Main drag-and-drop area
├── RoutineStepList.tsx            (~250 lines)
│   └── List of steps with reorder
├── RoutineStepCard.tsx            (~200 lines)
│   └── Individual step display
├── RoutineStepEditor.tsx          (~300 lines)
│   ├── Step type selector
│   ├── Product assignment
│   └── Instructions editor
├── RoutineTemplateSelector.tsx   (~200 lines)
│   └── Template browser and picker
├── RoutineProductPicker.tsx       (~200 lines)
│   └── Product selection modal
└── RoutinePreview.tsx             (~150 lines)
    └── Preview mode display
```

#### Create Routine Builder Hook:
```typescript
// src/hooks/useRoutineBuilder.ts
export function useRoutineBuilder(initialRoutine?: Routine) {
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<RoutineStep | null>(null);

  const actions = {
    addStep: (step: RoutineStep) => {},
    removeStep: (id: string) => {},
    reorderSteps: (from: number, to: number) => {},
    updateStep: (id: string, updates: Partial<RoutineStep>) => {},
    applyTemplate: (template: RoutineTemplate) => {},
    saveRoutine: async () => {},
  };

  return { steps, selectedStep, actions };
}
```

#### Refactored Structure:
```typescript
// app/(child)/routine-builder-enhanced.tsx (now ~400 lines)
export default function RoutineBuilderScreen() {
  const { steps, selectedStep, actions } = useRoutineBuilder();
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  return (
    <View>
      <Header />

      <RoutineBuilderCanvas>
        <RoutineStepList
          steps={steps}
          onReorder={actions.reorderSteps}
          onSelect={setSelectedStep}
        />
      </RoutineBuilderCanvas>

      {selectedStep && (
        <RoutineStepEditor
          step={selectedStep}
          onUpdate={actions.updateStep}
          onSelectProduct={() => setShowProductPicker(true)}
        />
      )}

      <RoutineTemplateSelector
        visible={showTemplatePicker}
        onSelect={actions.applyTemplate}
      />

      <RoutineProductPicker
        visible={showProductPicker}
        onSelect={(product) => {
          actions.updateStep(selectedStep!.id, { product });
          setShowProductPicker(false);
        }}
      />

      <ActionBar onSave={actions.saveRoutine} />
    </View>
  );
}
```

**Benefits:**
- Main file: 1,625 → ~400 lines (75% reduction)
- Drag-and-drop logic isolated
- Template system modular
- Easier to test step logic

---

### 4. `app/(child)/(tabs)/routine.tsx` (1,325 lines)

**Current Issues:**
- **Multiple Views:** Calendar, list, execution mode
- **State Management:** Completion tracking, streak calculation
- **Embedded Components:** Calendar cells, progress indicators

**Recommended Refactoring:**

```
src/components/routine-display/
├── RoutineCalendarView.tsx        (~300 lines)
│   ├── MonthGrid.tsx
│   ├── DayCell.tsx
│   └── CompletionIndicator.tsx
├── RoutineListView.tsx            (~250 lines)
│   └── List of routines for day
├── RoutineExecutionMode.tsx       (~400 lines)
│   ├── StepProgress.tsx
│   ├── StepInstructions.tsx
│   └── CompletionButton.tsx
└── RoutineStatsCard.tsx           (~150 lines)
    ├── Streak display
    └── Completion rate
```

---

## 🎯 General Refactoring Patterns

### Pattern 1: Extract State Management
**Before:**
```typescript
// 20+ useState hooks in component
const [state1, setState1] = useState();
const [state2, setState2] = useState();
// ... 18 more
```

**After:**
```typescript
// Custom hook
const { state, actions, filters } = useFeatureState();
```

### Pattern 2: Component Extraction
**Identify extraction candidates:**
- JSX blocks >100 lines
- Repeated UI patterns
- Independent functionality
- Modals and dialogs

**Before:**
```typescript
export default function MassiveComponent() {
  return (
    <View>
      {/* 500 lines of JSX */}
      <View>
        {/* 300 lines for one section */}
      </View>
      {/* Another 500 lines */}
    </View>
  );
}
```

**After:**
```typescript
export default function RefactoredComponent() {
  return (
    <View>
      <SectionOne />
      <SectionTwo />
      <SectionThree />
    </View>
  );
}
```

### Pattern 3: Service Layer Extraction
**Move business logic out of components:**

```typescript
// ❌ Bad: Logic in component
export default function Component() {
  const handleSave = async () => {
    const response = await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    // ... complex logic
  };
}

// ✅ Good: Logic in service
import { dataService } from '../services/dataService';

export default function Component() {
  const handleSave = async () => {
    await dataService.save(data);
  };
}
```

---

## 📏 Refactoring Guidelines

### File Size Targets

| Type | Target Lines | Maximum Lines |
|------|--------------|---------------|
| Screen Component | 200-400 | 600 |
| Reusable Component | 100-200 | 300 |
| Custom Hook | 50-150 | 250 |
| Service File | 100-300 | 500 |

### Complexity Metrics

**When to refactor:**
- ✅ File exceeds 600 lines
- ✅ More than 10 useState hooks
- ✅ More than 5 useEffect hooks
- ✅ JSX nesting >5 levels deep
- ✅ Function has >50 lines
- ✅ Difficult to understand purpose

### Testing Strategy

**Before refactoring:**
1. Document current behavior
2. Create integration test
3. Take screenshots of UI states

**During refactoring:**
1. Extract one piece at a time
2. Test after each extraction
3. Keep git commits small

**After refactoring:**
1. Verify all UI states work
2. Check performance
3. Update documentation

---

## 🚀 Implementation Plan

### Phase 1: Low-Risk Extractions (Week 1)
1. Extract simple components (cards, headers, footers)
2. Create service layer for API calls
3. Test thoroughly

### Phase 2: State Management (Week 2)
1. Create custom hooks for each large file
2. Move state logic out of components
3. Test state transitions

### Phase 3: Major Refactoring (Weeks 3-4)
1. Refactor freshie-gallery.tsx
2. Refactor product-result.tsx
3. Full testing cycle

### Phase 4: Polish (Week 5)
1. Refactor routine-builder-enhanced.tsx
2. Refactor routine display screens
3. Performance optimization
4. Documentation updates

---

## 📊 Expected Impact

### Before Refactoring:
- **4 files over 1,500 lines:** 8,740 total lines
- **Average file size:** 2,185 lines
- **Maintainability:** Low
- **Testability:** Very difficult
- **Onboarding time:** Very high

### After Refactoring:
- **Main files:** ~1,700 total lines (400-500 each)
- **New extracted components:** ~40-50 files
- **Maintainability:** High
- **Testability:** Good
- **Onboarding time:** Low

**Total reduction:** ~7,000 lines moved to smaller, focused files

---

## ✅ Success Criteria

A refactoring is successful when:
1. Main file <600 lines
2. Each component has single responsibility
3. State management is centralized
4. Business logic is in services
5. Components are independently testable
6. No functionality is lost
7. Performance is maintained or improved

---

## 🛠️ Tools & Resources

### Recommended Tools:
- **ESLint:** Enforce complexity rules
- **TypeScript:** Type safety during refactor
- **React DevTools:** Monitor component tree
- **Storybook:** Isolated component development (optional)

### Useful ESLint Rules:
```json
{
  "rules": {
    "max-lines": ["warn", 600],
    "max-lines-per-function": ["warn", 100],
    "complexity": ["warn", 15],
    "max-depth": ["warn", 4]
  }
}
```

---

## 💡 Tips & Best Practices

1. **Start Small:** Extract one component at a time
2. **Test Frequently:** Run app after each change
3. **Use Git:** Commit after each successful extraction
4. **Document:** Add comments explaining complex logic
5. **Ask for Review:** Have another developer review extractions
6. **Performance:** Profile before and after
7. **Don't Over-Engineer:** Balance simplicity vs. abstraction

---

## 📝 Conclusion

These large files are functional but pose maintenance challenges. Refactoring them will:
- Improve code readability
- Enable better testing
- Speed up development
- Reduce bugs
- Make onboarding easier

**Estimated Time:** 4-6 weeks for complete refactoring
**Estimated ROI:** 300%+ (time saved in future maintenance)

Start with the smallest, lowest-risk extractions and build momentum!

---

*For questions or assistance with refactoring, refer to this guide and the component organization established in Phase 3.*
