# Product Reviews & Ratings System

## Overview

Complete implementation of user-generated reviews and ratings for products in Freshies.

---

## ✅ What's Been Built

### 1. Database Schema (`database/CREATE_REVIEWS_RATINGS.sql`)

**Three main tables:**

#### `product_reviews`
- Stores detailed parent reviews
- Links to user and optionally to specific child
- Captures child context at review time (age, skin type, allergies)
- Experience rating: `worked_well`, `somewhat`, `no_irritation`
- Optional review text (280 char limit)
- Helpfulness tracking (upvotes/downvotes)
- Moderation flags

#### `product_ratings`
- Simple 1-5 star ratings
- One rating per user per product (or per child)
- Used for aggregate scoring

#### `review_helpfulness`
- Tracks which users found reviews helpful
- Prevents duplicate votes
- Automatically updates helpful counts via trigger

**Features:**
- ✅ Row Level Security (RLS) policies
- ✅ Automatic helpful count updates via triggers
- ✅ Indexes for performance
- ✅ Duplicate prevention (UNIQUE constraints)
- ✅ Soft moderation (flagging system)

### 2. TypeScript Types (`src/types/reviews.ts`)

```typescript
- ProductReview
- ProductRating
- ReviewHelpfulness
- CreateReviewRequest
- CreateRatingRequest
- ReviewWithContext (includes user's helpfulness vote)
- ProductReviewSummary (aggregated stats)
```

### 3. Service Layer (`src/services/reviewsService.ts`)

**Complete CRUD operations:**

```typescript
// Reviews
getProductReviews(barcode, userId?) → ReviewWithContext[]
createReview(review, userId) → ProductReview
updateReview(reviewId, updates) → ProductReview
deleteReview(reviewId) → void

// Helpfulness
markReviewHelpful(reviewId, userId, isHelpful) → void
removeHelpfulnessVote(reviewId, userId) → void

// Ratings
getUserProductRating(barcode, userId, childId?) → ProductRating | null
rateProduct(rating, userId) → ProductRating

// Statistics
getProductReviewSummary(barcode) → ProductReviewSummary
hasUserReviewedProduct(barcode, userId, childId?) → boolean
```

---

## 🎯 Key Features

### Anonymous but Accountable
- Reviews are linked to users but displayed anonymously
- Shows context: "Parent • Sensitive skin" instead of names
- Prevents spam while maintaining privacy

### Child-Specific Context
- Reviews can be linked to a specific child
- Captures child's age, skin type, allergies at review time
- Snapshot approach - doesn't change if child profile updates

### Helpfulness Voting
- Parents can mark reviews as helpful or not helpful
- Automatic count updates via database triggers
- Reviews sorted by helpfulness first

### Experience-Based (Not Star-Based)
- Three simple options: worked well, somewhat, no irritation
- More meaningful than arbitrary star ratings
- Aligned with Freshies' calm, factual tone

### Moderation Ready
- `is_flagged` and `is_approved` fields
- Can hide inappropriate content
- Auto-approve by default for good UX

---

## 📊 Data Flow

### Creating a Review

```
User taps "Share your experience"
  ↓
Modal opens with:
  - Experience rating (3 options)
  - Optional comment (280 chars)
  - Which child? (auto-fills context)
  ↓
createReview(reviewData, userId)
  ↓
Saved to database
  ↓
Appears in product reviews list
```

### Marking Helpful

```
User taps 👍 on a review
  ↓
markReviewHelpful(reviewId, userId, true)
  ↓
Upserted to review_helpfulness table
  ↓
Trigger updates helpful_count on product_reviews
  ↓
Review re-sorts to top
```

### Rating a Product

```
User selects 1-5 stars
  ↓
rateProduct({ barcode, rating, childId }, userId)
  ↓
Upserted (updates if already rated)
  ↓
Aggregate stats recalculated
```

---

## 🔒 Security & Privacy

### RLS Policies

**Reviews:**
- ✅ Anyone can read approved, non-flagged reviews
- ✅ Users can only create/update/delete their own reviews
- ✅ User ID automatically set from auth.uid()

**Ratings:**
- ✅ Anyone can read (for aggregates)
- ✅ Users can only modify their own ratings

**Helpfulness:**
- ✅ Anyone can read counts
- ✅ Users can only vote once per review
- ✅ Users can change or remove their vote

### Data Protection
- User IDs stored but not exposed in UI
- Child profiles linked but optional
- Review text length limited (280 chars)
- Moderation system in place

---

## 📱 UI Integration (Next Steps)

### Product Page
- [x] Mock reviews displayed
- [ ] Real reviews from database
- [ ] "Share your experience" modal
- [ ] Helpful voting buttons
- [ ] Star rating display

### Review Submission Modal
- [ ] Experience rating selector
- [ ] Text input (280 char limit)
- [ ] Child selector
- [ ] Auto-fill child context
- [ ] Submit button

### Review Card
- [ ] Experience badge
- [ ] Review text
- [ ] Context line (age, skin type, allergies)
- [ ] Helpful count + vote buttons
- [ ] Timestamp

---

## 🚀 Next Implementation Steps

1. **Create Review Submission Modal Component**
   - Experience rating buttons
   - Text input with character count
   - Child selector dropdown
   - Submit handler

2. **Integrate Real Reviews into Product Page**
   - Replace mock data with `getProductReviews()`
   - Add loading states
   - Handle empty state

3. **Add Helpful Voting**
   - Thumbs up/down buttons
   - Optimistic UI updates
   - Disable if user already voted

4. **Add Star Rating Widget**
   - 1-5 star selector
   - Display average rating
   - Show rating distribution

5. **Add Review Management**
   - Edit own reviews
   - Delete own reviews
   - Flag inappropriate reviews

---

## 📈 Future Enhancements

### Phase 2
- Photo uploads with reviews
- Verified purchase badges
- Sort/filter options (most recent, most helpful, by rating)
- Review replies/comments

### Phase 3
- AI-powered review summaries
- Sentiment analysis
- Duplicate review detection
- Review quality scoring

### Phase 4
- Review rewards/gamification
- Expert reviews (dermatologists, etc.)
- Product comparison based on reviews
- Personalized review recommendations

---

## 🗄️ Database Schema Summary

```sql
product_reviews
├── id (UUID, PK)
├── product_barcode (TEXT)
├── product_name (TEXT)
├── user_id (UUID, FK → auth.users)
├── child_id (UUID, FK → children)
├── experience_rating (TEXT: worked_well|somewhat|no_irritation)
├── review_text (TEXT, ≤280 chars)
├── child_age (INTEGER)
├── child_skin_type (TEXT)
├── child_allergies (TEXT[])
├── helpful_count (INTEGER)
├── not_helpful_count (INTEGER)
├── is_flagged (BOOLEAN)
├── is_approved (BOOLEAN)
└── created_at, updated_at (TIMESTAMPTZ)

product_ratings
├── id (UUID, PK)
├── product_barcode (TEXT)
├── user_id (UUID, FK → auth.users)
├── child_id (UUID, FK → children)
├── rating (INTEGER, 1-5)
└── UNIQUE(product_barcode, user_id, child_id)

review_helpfulness
├── id (UUID, PK)
├── review_id (UUID, FK → product_reviews)
├── user_id (UUID, FK → auth.users)
├── is_helpful (BOOLEAN)
└── UNIQUE(review_id, user_id)
```

---

## ✅ Status

- [x] Database schema created
- [x] TypeScript types defined
- [x] Service layer implemented
- [ ] UI components (next)
- [ ] Integration with product page (next)
- [ ] Testing & validation (next)

**Ready for UI implementation!** 🎉
