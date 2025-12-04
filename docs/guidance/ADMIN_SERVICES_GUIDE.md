# Admin Services Guide

## Overview

The admin services layer provides all the functionality needed for the future Management app. These services handle content workflow, AI configuration, and feature flags - all with proper audit logging and version control.

---

## Service Architecture

```
/src/services/admin/
├── contentManagement.ts    # Learn content workflow
├── aiManagement.ts          # AI prompts & safety
├── featureManagement.ts     # Feature flags
└── index.ts                 # Central exports
```

---

## 1. Content Management Service

### Article Workflow Functions

#### `getArticlesByStatus(status, options)`
Get paginated list of articles by status (draft/review/published/retired).

```typescript
const result = await getArticlesByStatus('review', {
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  sortOrder: 'desc'
});

// Returns: { articles, total, page, pageSize }
```

#### `moveToReview(articleId, adminId?)`
Move article from draft to review queue.

```typescript
const result = await moveToReview(articleId, adminId);
// Returns: { success, articleId, message }
```

#### `publishArticle(articleId, adminId?)`
Publish article (makes visible to mobile app users).

```typescript
const result = await publishArticle(articleId, adminId);
// Logs audit event
// Clears from review queue
// Sets published_at timestamp
```

#### `retireArticle(articleId, reason, adminId?)`
Remove article from public view.

```typescript
const result = await retireArticle(articleId, 'Outdated information', adminId);
```

#### `rejectArticle(articleId, feedback, adminId?)`
Reject article and send back to draft.

```typescript
const result = await rejectArticle(articleId, 'Needs better sources', adminId);
```

#### `flagArticle(articleId, reason, flaggedBy?)`
Flag article for admin review.

```typescript
const result = await flagArticle(articleId, 'Inappropriate content', userId);
```

### Content Editing Functions

#### `getArticleForEdit(articleId)`
Get full article details for editing.

#### `updateArticleContent(articleId, updates, adminId?)`
Update article content (increments version).

```typescript
const result = await updateArticleContent(articleId, {
  title: 'Updated Title',
  summary: 'New summary',
  tags: ['new', 'tags']
}, adminId);
// Increments version number
// Logs audit event
```

### Bulk Operations

#### `bulkPublishArticles(articleIds, adminId?)`
Publish multiple articles at once.

#### `bulkRetireArticles(articleIds, reason, adminId?)`
Retire multiple articles at once.

### Statistics

#### `getContentStatistics()`
Get content overview statistics.

```typescript
const stats = await getContentStatistics();
// Returns: {
//   total, 
//   byStatus: { draft: 5, review: 3, published: 42 },
//   byTopic: { 'Acne': 10, 'Sunscreen': 8 },
//   flagged: 2,
//   recentlyUpdated: 7
// }
```

#### `getReviewQueueSummary()`
Get review queue summary.

```typescript
const summary = await getReviewQueueSummary();
// Returns: {
//   draft: 5,
//   review: 3,
//   flagged: 2,
//   oldestDraft: Date,
//   oldestReview: Date
// }
```

---

## 2. AI Management Service

### Prompt Management

#### `getAllPromptTemplates()`
Get all prompt templates (all versions).

#### `getActivePrompt(toolName)`
Get currently active prompt for a tool.

```typescript
const prompt = await getActivePrompt('coach_parent');
```

#### `updatePromptTemplate(toolName, newContent, changeReason, adminId?)`
Update prompt (creates new version, deactivates old).

```typescript
const result = await updatePromptTemplate(
  'coach_parent',
  'New improved prompt...',
  'Added more safety guidelines',
  adminId
);
// Increments version
// Saves old version to history
// Clears prompt cache
// Logs audit event
```

#### `rollbackPrompt(toolName, targetVersion, adminId?)`
Rollback to previous prompt version.

```typescript
const result = await rollbackPrompt('coach_parent', 2, adminId);
```

#### `getPromptHistory(toolName)`
Get all versions of a prompt.

### Safety Policy Management

#### `getActiveSafetyPolicy()`
Get current active safety policy.

#### `updateSafetyPolicy(updates, adminId?)`
Update safety policy settings.

```typescript
const result = await updateSafetyPolicy({
  max_answer_length: 2500,
  forbidden_phrases: ['guaranteed', 'cure', 'diagnose'],
  require_disclaimer_for: ['medical', 'prescription']
}, adminId);
```

### AI Analytics

#### `getAIUsageStats(startDate?, endDate?)`
Get AI usage statistics.

```typescript
const stats = await getAIUsageStats(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);
// Returns: {
//   totalQueries: 1234,
//   byTool: { coach_parent: 800, assess_routine: 434 }
// }
```

#### `getCommonQueries(limit)`
Get most recent AI queries.

---

## 3. Feature Management Service

### Feature Flag CRUD

#### `getAllFeatureFlags()`
Get all feature flags.

#### `getFeatureFlag(key)`
Get specific feature flag.

#### `createFeatureFlag(flag, adminId?)`
Create new feature flag.

```typescript
const result = await createFeatureFlag({
  key: 'new_feature',
  name: 'New Feature',
  description: 'Description of feature',
  is_enabled: false,
  scope: 'global'
}, adminId);
```

#### `updateFeatureFlag(key, updates, adminId?)`
Update feature flag.

#### `toggleFeatureFlag(key, enabled, adminId?)`
Quick enable/disable toggle.

```typescript
const result = await toggleFeatureFlag('routine_builder', true, adminId);
// Clears feature flag cache
// Logs audit event
```

#### `deleteFeatureFlag(key, adminId?)`
Delete feature flag.

### Feature Targeting

#### `addUserToFeature(key, userId, adminId?)`
Add specific user to feature.

```typescript
const result = await addUserToFeature('beta_feature', userId, adminId);
```

#### `removeUserFromFeature(key, userId, adminId?)`
Remove user from feature.

### Feature Analytics

#### `getFeatureFlagStats()`
Get feature flag statistics.

```typescript
const stats = await getFeatureFlagStats();
// Returns: {
//   total: 10,
//   enabled: 7,
//   disabled: 3,
//   byScope: { global: 8, user: 2 }
// }
```

---

## Audit Logging

All admin actions are automatically logged to the `audit_events` table:

```typescript
// Automatically logged:
- Article published
- Article retired
- Prompt updated
- Feature toggled
- Content edited
- etc.

// Query audit logs:
import { getAuditEvents } from '@/services/config/auditLogger';

const events = await getAuditEvents({
  actorType: 'admin',
  actorId: adminId,
  targetType: 'learn_article',
  limit: 50
});
```

---

## Usage in Future Management App

### Example: Content Review Dashboard

```typescript
import { 
  getReviewQueueSummary,
  getArticlesByStatus,
  publishArticle,
  rejectArticle 
} from '@/services/admin';

// Get queue summary
const summary = await getReviewQueueSummary();

// Get articles needing review
const { articles } = await getArticlesByStatus('review', { page: 1 });

// Approve article
await publishArticle(articleId, adminId);

// Reject article
await rejectArticle(articleId, 'Needs more sources', adminId);
```

### Example: AI Configuration Dashboard

```typescript
import {
  getAllPromptTemplates,
  updatePromptTemplate,
  getAIUsageStats
} from '@/services/admin';

// Get all prompts
const prompts = await getAllPromptTemplates();

// Update a prompt
await updatePromptTemplate(
  'coach_parent',
  newPromptContent,
  'Improved safety guidelines',
  adminId
);

// Get usage stats
const stats = await getAIUsageStats();
```

### Example: Feature Flag Dashboard

```typescript
import {
  getAllFeatureFlags,
  toggleFeatureFlag,
  getFeatureFlagStats
} from '@/services/admin';

// Get all flags
const flags = await getAllFeatureFlags();

// Toggle a flag
await toggleFeatureFlag('new_feature', true, adminId);

// Get stats
const stats = await getFeatureFlagStats();
```

---

## Security Considerations

1. **Authentication**: All admin functions should be called via authenticated API endpoints
2. **Authorization**: Verify admin role before allowing access
3. **Audit Logging**: All actions are automatically logged
4. **Version Control**: Content and prompts maintain version history
5. **Rollback**: Can revert to previous versions if needed

---

## Testing the Services

You can test these services directly in the mobile app during development:

```typescript
// In a test screen or script
import * as AdminServices from '@/services/admin';

// Test content workflow
const result = await AdminServices.publishArticle(articleId);
console.log(result);

// Test AI management
const prompt = await AdminServices.getActivePrompt('coach_parent');
console.log(prompt);

// Test feature flags
const flags = await AdminServices.getAllFeatureFlags();
console.log(flags);
```

---

## Next Steps

1. **Run Database Migration**: Apply the admin-ready schema
2. **Seed Initial Data**: Run seed scripts for prompts and flags
3. **Test Services**: Verify all functions work correctly
4. **Build API Endpoints**: Create REST/GraphQL endpoints that call these services
5. **Build Management UI**: Create admin dashboard that uses the API

The services are ready - the Management app just needs to call them! 🚀
