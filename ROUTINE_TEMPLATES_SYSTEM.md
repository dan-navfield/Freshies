# Routine Step Templates System

## Overview
The routine step templates have been migrated from hardcoded constants to a **database-driven, AI-generatable system** similar to the Learn articles system. This allows for:

- ✅ **Admin management** via future admin app
- ✅ **AI generation** of new templates
- ✅ **Scalability** - unlimited template variations
- ✅ **Filtering** by age, skin type, concerns, time of day
- ✅ **Search** with full-text search capabilities

## Architecture

### 1. Database Layer
**File:** `/supabase/migrations/20241202_routine_step_templates.sql`

**Table:** `routine_step_templates`

**Key Fields:**
- `type` - Step category (cleanser, moisturizer, serum, sunscreen, treatment)
- `title` - Display name
- `slug` - URL-friendly identifier
- `icon_name` - Lucide icon name
- `color_hex` - Hex color code
- `default_duration` - Time in seconds
- `default_instructions` - JSON array of step-by-step instructions
- `tips` - Helpful advice with emoji
- `benefits` - Array of benefits
- `age_appropriate_min/max` - Age range
- `skin_types` - Array of compatible skin types
- `concerns` - Array of skin concerns addressed
- `time_of_day` - morning, evening, or both
- `generated_by_ai` - Boolean flag
- `ai_prompt` - Original prompt used for generation
- `is_active` - Soft delete flag
- `is_featured` - Featured template flag

**Features:**
- Full-text search with `search_vector`
- RLS policies for public read, admin write
- Auto-updated `updated_at` timestamp
- Includes 5 default templates migrated from hardcoded ones

### 2. Service Layer
**File:** `/src/services/routineTemplateService.ts`

**Class:** `RoutineTemplateService`

**Methods:**
- `getTemplates(filters?)` - Get all active templates with optional filtering
- `getTemplateById(id)` - Get single template
- `getTemplateBySlug(slug)` - Get by URL slug
- `getTemplatesByType(type)` - Filter by type
- `searchTemplates(searchTerm)` - Full-text search
- `getFeaturedTemplates()` - Get featured only
- `createTemplate(template)` - Create new (admin)
- `updateTemplate(id, updates)` - Update existing (admin)
- `deleteTemplate(id)` - Soft delete (admin)
- `getTemplateStats()` - Get statistics

**Filtering Options:**
```typescript
interface TemplateFilters {
  type?: string;
  age?: number;
  skinType?: string;
  concern?: string;
  timeOfDay?: 'morning' | 'evening' | 'both';
  isFeatured?: boolean;
}
```

### 3. AI Generation Layer
**File:** `/src/services/ai/templateGenerationService.ts`

**Class:** `TemplateGenerationService`

**Methods:**
- `generateTemplate(request)` - Generate single template with AI
- `generateAndSaveTemplate(request, createdBy?)` - Generate and save to DB
- `generateBatchTemplates(requests[], createdBy?)` - Batch generation
- `regenerateTemplate(templateId, customPrompt?)` - Regenerate existing

**Generation Request:**
```typescript
interface TemplateGenerationRequest {
  type: string;
  targetAge?: number;
  skinType?: string;
  concern?: string;
  timeOfDay?: 'morning' | 'evening' | 'both';
  customPrompt?: string;
}
```

**AI Model:** GPT-4o-mini
**Temperature:** 0.7
**Output:** Structured JSON with title, description, instructions, tips, benefits, etc.

### 4. Integration Layer
**File:** `/app/(child)/routine-builder-enhanced.tsx`

**Changes:**
- Added `routineTemplateService` import
- Added `dbTemplates` state to store loaded templates
- Added `loadTemplates()` function to fetch from database
- Templates loaded on component mount
- Filtered by `timeOfDay` (morning/evening)

**Usage:**
```typescript
const templates = await routineTemplateService.getTemplates({
  timeOfDay: segment
});
```

## Migration Path

### Old System (Hardcoded)
```typescript
const STEP_TEMPLATES: Record<StepType, StepTemplate> = {
  cleanser: { /* hardcoded data */ },
  // ...
};
```

### New System (Database)
```typescript
// Load from database
const templates = await routineTemplateService.getTemplates();

// Or generate with AI
const template = await templateGenerationService.generateAndSaveTemplate({
  type: 'cleanser',
  targetAge: 12,
  skinType: 'oily',
  concern: 'acne'
});
```

## Admin App Integration (Future)

The system is designed for easy admin management:

1. **Template Library View**
   - List all templates
   - Filter by type, age, skin type
   - Search functionality
   - View stats (total, by type, AI-generated count)

2. **Template Editor**
   - Create new templates manually
   - Edit existing templates
   - Preview before saving
   - Set active/featured status

3. **AI Generator Interface**
   - Form to input generation parameters
   - Batch generation capability
   - Review and edit AI output before saving
   - Regenerate with different prompts

4. **Template Analytics**
   - Usage statistics
   - Popular templates
   - AI vs manual creation ratio
   - User feedback integration

## Benefits

### For Users
- More diverse template options
- Age-appropriate content
- Personalized to skin type and concerns
- Better guidance and tips

### For Admins
- Easy content management
- No code deployments needed
- AI-assisted content creation
- A/B testing capabilities
- Quick updates and fixes

### For Developers
- Scalable architecture
- Clean separation of concerns
- Type-safe interfaces
- Easy to extend
- Consistent with Learn system

## Next Steps

1. **Run Migration**
   ```bash
   # Apply the migration to create the table
   supabase db push
   ```

2. **Test Template Loading**
   - Open routine builder
   - Verify templates load from database
   - Check filtering works correctly

3. **Generate More Templates**
   ```typescript
   // Example: Generate templates for different scenarios
   await templateGenerationService.generateBatchTemplates([
     { type: 'cleanser', targetAge: 8, skinType: 'sensitive' },
     { type: 'moisturizer', targetAge: 14, concern: 'acne' },
     { type: 'sunscreen', targetAge: 10, timeOfDay: 'morning' }
   ]);
   ```

4. **Build Admin Interface**
   - Template CRUD operations
   - AI generation UI
   - Analytics dashboard

## API Examples

### Get Templates for Morning Routine
```typescript
const morningTemplates = await routineTemplateService.getTemplates({
  timeOfDay: 'morning'
});
```

### Search Templates
```typescript
const results = await routineTemplateService.searchTemplates('acne treatment');
```

### Generate Custom Template
```typescript
const template = await templateGenerationService.generateAndSaveTemplate({
  type: 'serum',
  targetAge: 13,
  skinType: 'combination',
  concern: 'dark spots',
  customPrompt: 'Focus on vitamin C and niacinamide'
});
```

### Get Template Stats
```typescript
const stats = await routineTemplateService.getTemplateStats();
// { total: 25, byType: { cleanser: 5, moisturizer: 8, ... }, aiGenerated: 15 }
```

## Database Schema

```sql
CREATE TABLE routine_step_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  description TEXT,
  default_duration INTEGER DEFAULT 60,
  default_instructions JSONB DEFAULT '[]'::jsonb,
  tips TEXT,
  benefits TEXT[],
  recommended_order INTEGER DEFAULT 0,
  age_appropriate_min INTEGER DEFAULT 0,
  age_appropriate_max INTEGER DEFAULT 18,
  skin_types TEXT[],
  concerns TEXT[],
  time_of_day TEXT[],
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (...) STORED
);
```

## Conclusion

The routine step templates system is now fully database-driven and AI-generatable, providing a scalable foundation for content management and personalization. The architecture mirrors the successful Learn articles system and is ready for admin interface development.
