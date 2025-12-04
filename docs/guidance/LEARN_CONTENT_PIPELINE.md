# Freshies Learn Area - AI-Powered Content Pipeline

## Overview
Automated content ingestion, transformation, and publishing system for evidence-based parenting guidance.

## Architecture Flow
```
Source → Fetch → Parse → AI Transform → Safety Check → Classification → Store → Publish
```

## 1. Content Sources

### Primary Authoritative Sources
- **DermNet NZ** - Dermatology explanations
- **Royal Children's Hospital Melbourne (RCH)** - Child health fact sheets
- **Raising Children Network (RCN)** - Australian parenting content
- **Australasian College of Dermatologists (ACD)** - Patient information
- **Better Health Channel (VicHealth)** - Skin care, sun safety

### Ingredient & Cosmetic Science
- **EU CosIng** - Ingredient names + functions
- **COSMILE Europe** - Ingredient explanations
- **AICIS (Australia)** - Cosmetic ingredient regulations
- **Open Beauty Facts** - Ingredients in context

### Contextual / Trend Sources
- Expert journalism on "Sephora Kids" and teen trends
- Skin cancer council / sun safety sites

## 2. Data Models

### Article Schema
```typescript
interface LearnArticle {
  id: string;
  title: string;
  summary: string; // 5 bullet points
  body_sections: ArticleSection[];
  faqs: FAQ[];
  topic: LearnTopic;
  tags: string[];
  age_bands: AgeBand[];
  source_url: string;
  source_name: string;
  last_synced_at: Date;
  llm_version: string;
  disclaimer: string;
  status: 'draft' | 'review' | 'published';
  created_at: Date;
  updated_at: Date;
}

interface ArticleSection {
  heading: string;
  content: string;
  order: number;
}

interface FAQ {
  question: string;
  answer: string;
  order: number;
}

type LearnTopic = 
  | 'skin-basics'
  | 'ingredients'
  | 'products'
  | 'routines'
  | 'safety'
  | 'mental-health';

type AgeBand = '5-8' | '9-12' | '13-16';
```

### Source Snapshot Schema
```typescript
interface SourceSnapshot {
  id: string;
  source_url: string;
  source_name: string;
  raw_text: string;
  hash_of_text: string;
  processed_at: Date;
  fetch_status: 'success' | 'failed';
  error_message?: string;
}
```

## 3. MCP Tools for AI Transformation

### Tool 1: summarise_source_content
**Purpose:** Transform raw factual text into Freshies-style article content

**Input:**
```typescript
interface SummariseInput {
  source_text: string;
  source_url: string;
  topic: LearnTopic;
  target_reading_level: 'Year 7-8';
  needs_age_banding: boolean;
}
```

**Output:**
```typescript
interface SummariseOutput {
  title: string;
  summary: string[]; // 5 bullet points
  body_sections: ArticleSection[];
  age_bands: AgeBand[];
  disclaimer: string;
}
```

**Prompt Template:**
```
You are a content writer for Freshies, an Australian app helping parents understand kids' skincare.

Transform the following source content into a parent-friendly article:

SOURCE: {source_url}
TOPIC: {topic}
READING LEVEL: Year 7-8 (Australian)

CONTENT:
{source_text}

REQUIREMENTS:
- Use Australian English (moisturiser, colour, etc)
- Plain language, warm and reassuring tone
- No medical diagnosis or absolute claims
- Include age-appropriate guidance where relevant
- 5 bullet point summary at top
- 2-4 main sections with clear headings
- Always include disclaimer: "This is general guidance only. For specific concerns about your child's skin, please consult a healthcare professional."

OUTPUT FORMAT:
{
  "title": "...",
  "summary": ["...", "...", "...", "...", "..."],
  "body_sections": [
    {"heading": "...", "content": "..."},
    ...
  ],
  "age_bands": ["5-8", "9-12", "13-16"],
  "disclaimer": "..."
}
```

### Tool 2: rewrite_for_parents
**Purpose:** Refine tone and ensure consistency

**Input:**
```typescript
interface RewriteInput {
  draft_text: string;
  tone: 'warm, balanced, reassuring';
  australian_english: true;
}
```

**Output:**
```typescript
interface RewriteOutput {
  rewritten_text: string;
  changes_made: string[];
}
```

### Tool 3: extract_facts_and_qas
**Purpose:** Create FAQ-style content automatically

**Input:**
```typescript
interface ExtractQAsInput {
  article_text: string;
  topic: LearnTopic;
  max_questions: number;
}
```

**Output:**
```typescript
interface ExtractQAsOutput {
  faqs: FAQ[];
}
```

**Prompt Template:**
```
Based on this article about {topic}, generate {max_questions} frequently asked questions that Australian parents might have about kids' skincare.

ARTICLE:
{article_text}

REQUIREMENTS:
- Questions should be practical and specific
- Answers should be balanced and non-medical
- Use Australian English
- Include age context where relevant
- Keep answers to 2-3 sentences

OUTPUT FORMAT:
{
  "faqs": [
    {
      "question": "Can an 11-year-old use exfoliants?",
      "answer": "..."
    }
  ]
}
```

### Tool 4: classify_article_topic
**Purpose:** Tag articles into Learn categories

**Input:**
```typescript
interface ClassifyInput {
  article_text: string;
  allowed_topics: LearnTopic[];
}
```

**Output:**
```typescript
interface ClassifyOutput {
  primary_topic: LearnTopic;
  secondary_topics: LearnTopic[];
  suggested_tags: string[];
}
```

## 4. Pipeline Implementation

### Step 1: Content Fetcher
```typescript
// src/services/learn/contentFetcher.ts
interface FetchResult {
  source_url: string;
  source_name: string;
  raw_text: string;
  title: string;
  publication_date?: Date;
  author?: string;
}

async function fetchSourceContent(url: string): Promise<FetchResult> {
  // Fetch HTML
  // Parse with cheerio or similar
  // Extract main content
  // Remove ads, navigation, disclaimers
  // Return structured data
}
```

### Step 2: Content Parser
```typescript
// src/services/learn/contentParser.ts
interface ParsedContent {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  metadata: {
    source: string;
    date: Date;
  };
}

function parseRawContent(raw: string, sourceType: string): ParsedContent {
  // Remove HTML layout
  // Keep headings
  // Extract key sections
  // Return clean structure
}
```

### Step 3: AI Transformation
```typescript
// src/services/learn/aiTransformer.ts
import { aiCareService } from '../ai/aiCareService';

async function transformToArticle(
  parsed: ParsedContent,
  topic: LearnTopic
): Promise<LearnArticle> {
  // Call summarise_source_content tool
  const summary = await aiCareService.processRequest({
    tool: 'summarise_source_content',
    input: {
      source_text: parsed.sections.map(s => s.content).join('\n\n'),
      source_url: parsed.metadata.source,
      topic,
      target_reading_level: 'Year 7-8',
      needs_age_banding: true,
    },
  });

  // Call extract_facts_and_qas tool
  const faqs = await aiCareService.processRequest({
    tool: 'extract_facts_and_qas',
    input: {
      article_text: summary.body_sections.map(s => s.content).join('\n\n'),
      topic,
      max_questions: 5,
    },
  });

  // Call classify_article_topic tool
  const classification = await aiCareService.processRequest({
    tool: 'classify_article_topic',
    input: {
      article_text: summary.body_sections.map(s => s.content).join('\n\n'),
      allowed_topics: ['skin-basics', 'ingredients', 'products', 'routines', 'safety', 'mental-health'],
    },
  });

  return {
    ...summary,
    faqs: faqs.faqs,
    topic: classification.primary_topic,
    tags: classification.suggested_tags,
    status: 'draft',
  };
}
```

### Step 4: Safety Check
```typescript
// src/services/learn/safetyChecker.ts
interface SafetyCheckResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
}

function checkContentSafety(article: LearnArticle): SafetyCheckResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for medical diagnosis language
  if (containsMedicalDiagnosis(article)) {
    issues.push('Contains medical diagnosis language');
  }

  // Check for absolute claims
  if (containsAbsoluteClaims(article)) {
    warnings.push('Contains absolute claims');
  }

  // Check for disclaimer
  if (!article.disclaimer) {
    issues.push('Missing disclaimer');
  }

  // Check for Australian English
  if (!isAustralianEnglish(article)) {
    warnings.push('May contain non-Australian English');
  }

  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}
```

### Step 5: Storage
```typescript
// src/services/learn/articleStorage.ts
async function saveArticle(article: LearnArticle): Promise<string> {
  // Save to Supabase/database
  // Return article ID
}

async function saveSourceSnapshot(snapshot: SourceSnapshot): Promise<void> {
  // Save raw source for traceability
}
```

## 5. Scheduled Jobs

### Weekly Ingestion
```typescript
// src/jobs/weeklyContentSync.ts
async function syncAllSources() {
  const sources = [
    { url: 'https://dermnetnz.org/topics/...', name: 'DermNet NZ', topic: 'skin-basics' },
    { url: 'https://www.rch.org.au/kidsinfo/...', name: 'RCH', topic: 'skin-basics' },
    // ... more sources
  ];

  for (const source of sources) {
    try {
      // Fetch content
      const fetched = await fetchSourceContent(source.url);
      
      // Check if changed (hash comparison)
      const existingSnapshot = await getLatestSnapshot(source.url);
      const newHash = hashContent(fetched.raw_text);
      
      if (existingSnapshot?.hash_of_text === newHash) {
        console.log(`No changes for ${source.name}`);
        continue;
      }

      // Save snapshot
      await saveSourceSnapshot({
        source_url: source.url,
        source_name: source.name,
        raw_text: fetched.raw_text,
        hash_of_text: newHash,
        processed_at: new Date(),
        fetch_status: 'success',
      });

      // Parse
      const parsed = parseRawContent(fetched.raw_text, source.name);

      // Transform
      const article = await transformToArticle(parsed, source.topic);

      // Safety check
      const safety = checkContentSafety(article);
      
      if (!safety.passed) {
        console.error(`Safety check failed for ${source.name}:`, safety.issues);
        continue;
      }

      // Save article
      await saveArticle(article);
      
      console.log(`Successfully processed ${source.name}`);
    } catch (error) {
      console.error(`Error processing ${source.name}:`, error);
    }
  }
}
```

### Stale Content Flagging
```typescript
// src/jobs/flagStaleContent.ts
async function flagStaleArticles() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const staleArticles = await getArticlesOlderThan(sixMonthsAgo);
  
  for (const article of staleArticles) {
    await updateArticleStatus(article.id, 'review');
    await notifyReviewTeam(article);
  }
}
```

## 6. Human Review Workflow

### Review Dashboard
- List of articles in 'draft' or 'review' status
- Side-by-side view: original source vs transformed article
- Checklist:
  - [ ] Factually accurate
  - [ ] Tone matches brand
  - [ ] Disclaimers correct
  - [ ] No medical advice
  - [ ] Australian English
  - [ ] Age-appropriate
- Approve → status = 'published'
- Reject → back to 'draft' with notes

## 7. Content Mapping to UI

### Topic Tiles
- **Skin Basics** → RCH, DermNet articles
- **Ingredients Explained** → CosIng, Cosmile, AICIS
- **Product Types** → RCH, Better Health Channel
- **Routines & Layering** → RCH, ACD
- **Safety & Regulation** → AICIS, TGA
- **Teens & Social Media** → Journalism + expert summaries

### Article Display
- Summary bullets at top
- Clean section structure
- AI-generated FAQs
- Source attribution
- Related articles
- "Ask Freshies AI about this" button

## 8. Benefits

✅ Huge content library with minimal manual production
✅ Based on trusted medical and educational sources
✅ Consistent tone + clarity
✅ Safe, disclaimered, non-medical
✅ Perfectly structured for UI
✅ Always up-to-date with fresh source content
✅ Scalable to all topics
✅ Full traceability to sources
✅ Australian English throughout
