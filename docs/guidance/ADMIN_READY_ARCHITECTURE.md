# Freshies - Admin-Ready Architecture Implementation Plan

## Overview
This document outlines the backend architecture changes needed to support a future Management app without refactoring. The mobile app will consume only "published" or "active" versions, while all configuration lives in the backend.

---

## 1. Core Principles

### Single Source of Truth
- ✅ No hard-coded AI prompts in mobile app
- ✅ No hard-coded content rules or thresholds
- ✅ App reads "live" config from APIs
- ✅ Everything controllable has a model + API

### Shared Domain Services
- Mobile: read-only or self-service endpoints
- Management: elevated admin endpoints over same services
- Same business logic, different access levels

### Audit Everything
- Version history for all changes
- Track who, what, when, why
- Rollback capability

---

## 2. Current State Analysis

### ✅ Already Admin-Ready
1. **Learn Content** - Stored in Supabase with proper schema
2. **AI Services** - Abstracted through service layer
3. **Supabase Backend** - Centralized data storage

### ❌ Needs Work
1. **AI Prompts** - Currently hard-coded in `/src/services/ai/metaPrompt.ts`
2. **Safety Rules** - Embedded in code
3. **Content States** - No draft/review/published workflow
4. **Feature Flags** - Not implemented
5. **Ingredient Rules** - Not externalized
6. **Audit Logging** - Not implemented
7. **Admin APIs** - Not defined

---

## 3. Implementation Roadmap

### Phase 1: Database Schema Updates

#### 3.1 Learn Content Enhancement
```sql
-- Add to existing learn_articles table
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'retired'));
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('human_written', 'ai_generated', 'mixed'));
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS source_refs JSONB DEFAULT '[]';
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id);
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Article version history
CREATE TABLE learn_article_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES learn_articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_sections JSONB,
  faqs JSONB,
  tags TEXT[],
  age_bands TEXT[],
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);
```

#### 3.2 AI Configuration Tables
```sql
-- AI Prompt Templates
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_name TEXT NOT NULL, -- 'coach_parent', 'assess_routine', etc.
  role TEXT NOT NULL CHECK (role IN ('system', 'user')),
  content TEXT NOT NULL,
  model_preferences JSONB DEFAULT '{}', -- { "provider": "openai", "model": "gpt-4-turbo" }
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_name, role, version)
);

-- AI Prompt Version History
CREATE TABLE ai_prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES ai_prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

-- AI Safety Policies
CREATE TABLE ai_safety_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  allow_free_form_qa BOOLEAN DEFAULT true,
  max_answer_length INTEGER DEFAULT 2000,
  forbidden_phrases TEXT[] DEFAULT '{}',
  forbidden_patterns TEXT[] DEFAULT '{}',
  require_disclaimer_for TEXT[] DEFAULT '{}', -- ['medical', 'severe_reaction', 'prescription']
  is_active BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3 Product & Ingredient Rules
```sql
-- Ingredient Rules
CREATE TABLE ingredient_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('avoid', 'caution', 'info', 'ok')),
  match_type TEXT NOT NULL CHECK (match_type IN ('exact_inci', 'category', 'pattern')),
  match_value TEXT NOT NULL, -- INCI name, category, or regex pattern
  applies_to_age_min INTEGER,
  applies_to_age_max INTEGER,
  reason TEXT NOT NULL,
  recommendation TEXT,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Rules
CREATE TABLE routine_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT UNIQUE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('conflict', 'frequency', 'age_restriction', 'combination')),
  description TEXT NOT NULL,
  conditions JSONB NOT NULL, -- { "ingredients": ["retinol", "aha"], "age_max": 13 }
  severity TEXT CHECK (severity IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.4 Feature Flags
```sql
-- Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'cohort', 'user')),
  target_cohort TEXT[], -- ['beta_testers', 'premium_users']
  target_users UUID[], -- specific user IDs
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.5 Audit Logging
```sql
-- Audit Events
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system')),
  actor_id UUID, -- user ID or admin ID
  action TEXT NOT NULL, -- 'publish_article', 'change_prompt', 'suspend_user'
  target_type TEXT NOT NULL, -- 'learn_article', 'ai_prompt', 'user'
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX idx_audit_events_actor ON audit_events(actor_type, actor_id);
CREATE INDEX idx_audit_events_target ON audit_events(target_type, target_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
```

#### 3.6 User/Content Moderation
```sql
-- Add moderation fields to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE learn_articles ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id);
```

---

### Phase 2: API Endpoints Structure

#### 2.1 Public APIs (Mobile App)
```
GET  /v1/learn/topics
GET  /v1/learn/articles?topic=...&status=published
GET  /v1/learn/articles/{slug}
GET  /v1/config/features
GET  /v1/config/ai/active-policy
```

#### 2.2 Internal APIs (MCP Servers)
```
GET  /v1/config/ai/prompts?tool=assess_routine
GET  /v1/config/ai/safety
GET  /v1/config/rules/ingredients
GET  /v1/config/rules/routines
```

#### 2.3 Admin APIs (Future Management App)
```
# Learn Content
GET    /v1/admin/learn/articles?status=draft|review|published
GET    /v1/admin/learn/articles/{id}
PATCH  /v1/admin/learn/articles/{id}
POST   /v1/admin/learn/articles/{id}/publish
GET    /v1/admin/learn/articles/{id}/versions

# AI Configuration
GET    /v1/admin/ai/prompts
GET    /v1/admin/ai/prompts/{id}
PATCH  /v1/admin/ai/prompts/{id}
POST   /v1/admin/ai/prompts/{id}/activate
GET    /v1/admin/ai/prompts/{id}/history
GET    /v1/admin/ai/safety-policies
PATCH  /v1/admin/ai/safety-policies/{id}

# Rules Management
GET    /v1/admin/rules/ingredients
POST   /v1/admin/rules/ingredients
PATCH  /v1/admin/rules/ingredients/{id}
DELETE /v1/admin/rules/ingredients/{id}
GET    /v1/admin/rules/routines
POST   /v1/admin/rules/routines
PATCH  /v1/admin/rules/routines/{id}

# Feature Flags
GET    /v1/admin/features
POST   /v1/admin/features
PATCH  /v1/admin/features/{id}
DELETE /v1/admin/features/{id}

# Audit & Moderation
GET    /v1/admin/audit-events?actor_id=...&target_type=...
GET    /v1/admin/users/{id}/suspend
POST   /v1/admin/users/{id}/unsuspend
GET    /v1/admin/content/flagged
```

---

### Phase 3: Code Refactoring

#### 3.1 Move AI Meta Prompt to Database
**Current**: `/src/services/ai/metaPrompt.ts` (hard-coded)
**Target**: Load from `ai_prompt_templates` table

```typescript
// New: /src/services/ai/promptLoader.ts
export async function loadActivePrompt(toolName: string, role: 'system' | 'user'): Promise<string> {
  const { data, error } = await supabase
    .from('ai_prompt_templates')
    .select('content')
    .eq('tool_name', toolName)
    .eq('role', role)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    console.error('Failed to load prompt, using fallback');
    return FALLBACK_PROMPTS[toolName][role];
  }
  
  return data.content;
}
```

#### 3.2 Feature Flag Service
```typescript
// /src/services/featureFlags.ts
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const { data } = await supabase
    .from('feature_flags')
    .select('key, is_enabled')
    .eq('scope', 'global');
  
  return data?.reduce((acc, flag) => {
    acc[flag.key] = flag.is_enabled;
    return acc;
  }, {} as Record<string, boolean>) || {};
}

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    getFeatureFlags().then(flags => setEnabled(flags[key] || false));
  }, [key]);
  
  return enabled;
}
```

#### 3.3 Audit Logger
```typescript
// /src/services/auditLogger.ts
export async function logAuditEvent(event: {
  actorType: 'user' | 'admin' | 'system';
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
}) {
  await supabase.from('audit_events').insert({
    actor_type: event.actorType,
    actor_id: event.actorId,
    action: event.action,
    target_type: event.targetType,
    target_id: event.targetId,
    metadata: event.metadata || {},
  });
}
```

---

### Phase 4: Row Level Security (RLS)

```sql
-- Learn Articles: Public can only see published
CREATE POLICY "Public can view published articles"
  ON learn_articles FOR SELECT
  USING (status = 'published');

-- Learn Articles: Admins can see all
CREATE POLICY "Admins can view all articles"
  ON learn_articles FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- AI Prompts: Only system/admin can read
CREATE POLICY "System can read active prompts"
  ON ai_prompt_templates FOR SELECT
  USING (is_active = true);

-- Feature Flags: Public can read global flags
CREATE POLICY "Public can read global feature flags"
  ON feature_flags FOR SELECT
  USING (scope = 'global');

-- Audit Events: Only admins can read
CREATE POLICY "Admins can read audit events"
  ON audit_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 4. Migration Strategy

### Step 1: Database Setup (Week 1)
- [ ] Create all new tables
- [ ] Add columns to existing tables
- [ ] Set up RLS policies
- [ ] Create indexes

### Step 2: Data Migration (Week 1-2)
- [ ] Migrate existing Learn content to new schema
- [ ] Set all existing articles to `status='published'`
- [ ] Import current AI meta prompt to `ai_prompt_templates`
- [ ] Mark imported prompt as `is_active=true`

### Step 3: Code Refactoring (Week 2-3)
- [ ] Create prompt loader service
- [ ] Update AI providers to use prompt loader
- [ ] Implement feature flag service
- [ ] Add audit logging to key actions
- [ ] Update Learn content queries to filter by status

### Step 4: API Endpoints (Week 3-4)
- [ ] Implement internal config endpoints
- [ ] Stub out admin endpoints (return 403)
- [ ] Add authentication middleware for admin routes
- [ ] Document all endpoints

### Step 5: Testing & Validation (Week 4)
- [ ] Test mobile app with new backend
- [ ] Verify prompts load from database
- [ ] Test feature flags
- [ ] Verify audit logging
- [ ] Performance testing

---

## 5. Benefits

### Immediate
- ✅ AI prompts can be updated without code deployment
- ✅ Content workflow supports review process
- ✅ Feature flags enable safe rollouts
- ✅ Audit trail for compliance

### Future
- ✅ Management app is "just another client"
- ✅ No mobile app changes needed for admin features
- ✅ A/B testing capabilities
- ✅ Rollback capabilities
- ✅ Multi-tenant ready

---

## 6. Risks & Mitigation

### Risk: Performance Impact
**Mitigation**: Cache prompts and config in memory, refresh periodically

### Risk: Database Complexity
**Mitigation**: Start simple, add complexity as needed

### Risk: Breaking Changes
**Mitigation**: Keep fallback values in code during transition

---

## 7. Success Criteria

- [ ] Mobile app loads AI prompts from database
- [ ] Learn content has draft/review/published workflow
- [ ] Feature flags control app behavior
- [ ] All admin actions are audited
- [ ] Admin API structure is defined
- [ ] Zero hard-coded configuration in mobile app

---

## Next Steps

1. Review and approve this architecture
2. Create database migration scripts
3. Implement Phase 1 (Database Schema)
4. Begin Phase 2 (Code Refactoring)
5. Document admin API contracts
