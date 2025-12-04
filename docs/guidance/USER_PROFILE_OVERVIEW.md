# Freshies User Profile Database Schema

## Overview

Comprehensive database design for managing users, families, preferences, and personalization in the Freshies skincare app.

---

## Table Structure

### 1. **profiles** (Core User Table)
**Purpose**: Main user profile linked to auth.users

**Key Fields**:
- Identity: `id`, `email`
- Role: `role` (parent/child), `account_type` (free/premium/family)
- Personal: `first_name`, `last_name`, `display_name`, `avatar_url`, `date_of_birth`
- Preferences: `language`, `timezone`, `theme`
- Notifications: `email_notifications`, `push_notifications`, `sms_notifications`
- Status: `onboarding_completed`, `account_status`, `last_active_at`
- Privacy: `profile_visibility`, `data_sharing_consent`, `marketing_consent`

**Relationships**:
- Links to `auth.users` (1:1)
- Parent to `parent_profiles` (1:1)
- Parent to `child_profiles` (1:1)

---

### 2. **parent_profiles** (Parent-Specific Data)
**Purpose**: Extended information for parent users

**Key Fields**:
- Contact: `phone_number`, `emergency_contact_name`, `emergency_contact_phone`
- Address: Full address fields
- Parenting: `number_of_children`, `parenting_style`
- Subscription: `subscription_tier`, `subscription_status`, `stripe_customer_id`
- Preferences: `content_filtering_level`, `auto_approve_products`, `require_approval_for_scans`
- Interests: `skin_concerns[]`, `ingredient_preferences[]`

**Use Cases**:
- Billing and subscription management
- Parental control settings
- Emergency contact information
- Personalized content filtering

---

### 3. **child_profiles** (Child-Specific Data)
**Purpose**: Extended information for child users with safety features

**Key Fields**:
- Child Info: `age`, `grade_level`, `gender`
- Parental Control: `parent_user_id`, `requires_approval`, `screen_time_limit_minutes`, `allowed_features[]`
- Skin Profile: `skin_type`, `skin_concerns[]`, `allergies[]`
- Learning: `education_level`, `learning_style`, `favorite_topics[]`
- Gamification: `points_earned`, `level`, `badges_earned[]`, `streak_days`
- Safety: `chat_enabled`, `can_share_scans`, `content_filter_enabled`

**Use Cases**:
- Age-appropriate content
- Parental approval workflows
- Gamification and engagement
- Safety and privacy controls
- Personalized learning paths

---

### 4. **households** (Family Groups)
**Purpose**: Group family members together

**Key Fields**:
- Identity: `id`, `name`, `household_code`
- Primary Contact: `primary_parent_id`
- Settings: `shared_product_library`, `shared_routines`
- Subscription: `subscription_tier`, `max_members`

**Use Cases**:
- Family subscription management
- Shared product libraries
- Shared routines and recommendations
- Multi-user households

---

### 5. **household_members** (Family Membership)
**Purpose**: Link users to households with roles

**Key Fields**:
- Links: `household_id`, `user_id`
- Role: `role` (parent/child/guardian/caregiver), `status`
- Permissions: `can_manage_household`, `can_approve_products`, `can_manage_children`
- Invitation: `invited_by`, `invited_at`, `joined_at`

**Use Cases**:
- Multi-parent households
- Guardians and caregivers
- Permission management
- Invitation system

---

### 6. **user_preferences** (Detailed Settings)
**Purpose**: Store all user preferences and app settings

**Key Fields**:
- App: `default_scan_mode`, `auto_save_scans`, `show_ingredient_details`
- Notifications: Granular notification preferences, quiet hours
- Display: `show_scientific_names`, `ingredient_rating_system`
- Privacy: `allow_anonymous_data`, `allow_personalized_recommendations`
- Accessibility: `font_size`, `high_contrast_mode`, `reduce_animations`, `screen_reader_optimized`

**Use Cases**:
- Personalized app experience
- Accessibility features
- Notification management
- Privacy controls

---

### 7. **user_skin_profiles** (Skin Data)
**Purpose**: Detailed skin information for personalization

**Key Fields**:
- Characteristics: `skin_type`, `skin_tone`, `undertone`
- Concerns: `primary_concerns[]`, `secondary_concerns[]`, `skin_conditions[]`
- Allergies: `known_allergies[]`, `ingredient_sensitivities[]`, `avoid_ingredients[]`
- Environment: `climate`, `sun_exposure`
- Goals: `skincare_goals[]`
- History: `previous_reactions` (JSONB)

**Use Cases**:
- Personalized product recommendations
- Ingredient warnings
- Routine suggestions
- Safety alerts

---

### 8. **user_activity_log** (Analytics & Audit)
**Purpose**: Track user actions for analytics and support

**Key Fields**:
- Activity: `activity_type`, `activity_category`
- Context: `metadata` (JSONB), `ip_address`, `user_agent`, `device_type`, `app_version`
- Location: `country_code`, `city`

**Use Cases**:
- User behavior analytics
- Support and debugging
- Security monitoring
- Feature usage tracking

---

### 9. **user_achievements** (Gamification)
**Purpose**: Track user accomplishments and progress

**Key Fields**:
- Achievement: `achievement_code`, `title`, `description`, `icon_name`, `category`
- Progress: `progress`, `target`, `completed`
- Rewards: `points_awarded`, `badge_unlocked`

**Use Cases**:
- Engagement and retention
- Learning motivation
- Progress tracking
- Reward system

---

### 10. **user_sessions** (Security)
**Purpose**: Track active sessions for security

**Key Fields**:
- Session: `session_token`, `device_id`, `device_name`, `device_type`
- Location: `ip_address`, `country_code`, `city`
- Status: `is_active`, `last_activity_at`, `expires_at`

**Use Cases**:
- Multi-device management
- Security monitoring
- Session management
- Device tracking

---

## Data Flow Examples

### New Parent Signup
```
1. Create auth.users entry (Supabase Auth)
2. Create profiles entry (role: 'parent')
3. Create parent_profiles entry
4. Create user_preferences entry (defaults)
5. Create household entry
6. Create household_members entry (link user to household)
```

### Adding a Child
```
1. Parent creates child account
2. Create auth.users entry
3. Create profiles entry (role: 'child')
4. Create child_profiles entry (parent_user_id set)
5. Create user_preferences entry (child-safe defaults)
6. Create household_members entry (link to parent's household)
```

### Product Scan Flow
```
1. Child scans product
2. Log activity in user_activity_log
3. Check child_profiles.requires_approval
4. If true, create approval request
5. Notify parent via preferences
6. Parent approves/denies
7. Update child's product library
8. Award achievement points
```

---

## Security Features

### Row Level Security (RLS)
- ✅ Users can only access their own data
- ✅ Parents can access their children's data
- ✅ Household members can see each other (limited)
- ✅ Activity logs are user-specific
- ✅ Sessions are user-specific

### Privacy Controls
- Profile visibility settings
- Data sharing consent
- Marketing consent
- Anonymous analytics option
- Content filtering levels

---

## Helper Functions

### `create_parent_profile()`
Creates a complete parent profile with all related tables

### `create_child_profile()`
Creates a complete child profile linked to a parent

---

## Indexes for Performance

- Email lookups
- Role-based queries
- Household member queries
- Activity log searches
- Session management

---

## Future Enhancements

### Potential Additions:
1. **user_connections** - Social features (friends, follows)
2. **user_badges** - Detailed badge system
3. **user_streaks** - Daily streak tracking
4. **user_goals** - Personal skincare goals
5. **user_notes** - Personal notes on products/ingredients
6. **user_favorites** - Saved products, routines, lessons
7. **user_reviews** - Product reviews and ratings
8. **user_photos** - Before/after photos, progress tracking

---

## Migration Strategy

### Phase 1: Core Tables
- profiles
- parent_profiles
- child_profiles

### Phase 2: Household Management
- households
- household_members

### Phase 3: Preferences & Personalization
- user_preferences
- user_skin_profiles

### Phase 4: Analytics & Gamification
- user_activity_log
- user_achievements
- user_sessions

---

## TypeScript Types

Generate TypeScript types from this schema using:
```bash
npx supabase gen types typescript --project-id citlmjwylnpxfhopkkjj > types/database.types.ts
```

---

## Testing Data

Use the helper functions to create test users:
```sql
-- Create test parent
SELECT create_parent_profile(
  '84e9df6e-a914-4e2d-bd7f-10193dc38ea8',
  'parenttest@freshies.com',
  'Test',
  'Parent'
);

-- Create test child
SELECT create_child_profile(
  gen_random_uuid(),
  'childtest@freshies.com',
  '84e9df6e-a914-4e2d-bd7f-10193dc38ea8',
  'Test Child',
  12
);
```

---

## Maintenance

### Regular Tasks:
- Clean up expired sessions
- Archive old activity logs
- Update achievement progress
- Sync subscription status
- Verify household memberships

### Monitoring:
- Track table sizes
- Monitor query performance
- Check RLS policy effectiveness
- Audit data access patterns
