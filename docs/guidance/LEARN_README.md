# Learn Content Pipeline - Quick Start Guide 🚀

## Overview

The Learn content pipeline automatically ingests, transforms, and publishes educational content from trusted Australian health sources. It uses AI to convert medical content into parent-friendly articles with Australian English, safety checks, and age-appropriate guidance.

---

## 🎯 Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install cheerio @types/cheerio ts-node
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.learn.example .env

# Edit .env and add your API keys:
# - OPENAI_API_KEY (required)
# - SUPABASE_URL (required)
# - SUPABASE_ANON_KEY (required)
```

### 3. Run Setup Script

```bash
npm run setup:learn
```

This will verify all files are in place and check your configuration.

### 4. Apply Database Migration

```bash
# If you have Supabase CLI installed:
supabase db push

# Or manually run the SQL file in Supabase Studio:
# supabase/migrations/20241115_learn_content_tables.sql
```

### 5. Test the Pipeline

```bash
npm run test:pipeline
```

This will process a single article from Royal Children's Hospital and show you the results.

---

## 📚 What Gets Created

### Content Flow

```
Source Website → Fetch HTML → Parse Content → AI Transform → Safety Check → Review → Publish
```

### Example Output

**Input:** Medical article about eczema from RCH  
**Output:** Parent-friendly article with:
- ✅ Plain language summary
- ✅ 3-5 body sections
- ✅ 5-7 FAQs
- ✅ Age band tags (5-8, 9-12, 13-16)
- ✅ Topic classification
- ✅ Safety disclaimers
- ✅ Australian English

---

## 🔧 Configuration

### Environment Variables

Key variables in `.env`:

```env
# Required
OPENAI_API_KEY=sk-...                    # Your OpenAI API key
SUPABASE_URL=https://...supabase.co      # Your Supabase project URL
SUPABASE_ANON_KEY=eyJ...                 # Your Supabase anon key

# Optional
LEARN_PIPELINE_ENABLED=true              # Enable/disable pipeline
LEARN_MIN_SAFETY_SCORE=85                # Minimum score to auto-publish
LEARN_REQUIRE_MANUAL_REVIEW=true         # Require human review
```

### Content Sources

20+ sources configured in `src/services/learn/contentSources.ts`:

- **DermNet NZ** - Dermatology information
- **Royal Children's Hospital** - Child health
- **Raising Children Network** - Parenting guidance
- **Australasian College of Dermatologists** - Professional guidance
- **Better Health Channel** - Victorian health info

Enable/disable sources in `.env` or by editing the source config.

---

## 🎮 Usage

### Process a Single Source

```typescript
import { processSourceOnDemand } from './src/services/learn/pipelineOrchestrator';

const result = await processSourceOnDemand('rch-eczema');
console.log('Created:', result?.article.title);
```

### Run Weekly Sync

```typescript
import { runWeeklySync } from './src/services/learn/pipelineOrchestrator';

const jobResult = await runWeeklySync();
console.log(`Processed ${jobResult.sources_processed} sources`);
console.log(`Created ${jobResult.articles_created} articles`);
```

### Check Safety

```typescript
import { checkContentSafety } from './src/services/learn/safetyChecker';

const safetyCheck = checkContentSafety(article);
console.log(`Safety score: ${safetyCheck.score}/100`);
console.log(`Issues: ${safetyCheck.issues.length}`);
```

### Search Articles

```typescript
import { searchArticles } from './src/services/learn/database';

const results = await searchArticles('eczema', 10);
console.log(`Found ${results.length} articles`);
```

---

## 📊 Database Schema

### Main Tables

1. **learn_articles** - Published articles
2. **source_snapshots** - Raw content from sources
3. **content_sources** - Source configuration
4. **review_tasks** - Articles pending review
5. **sync_jobs** - Sync job history
6. **user_saved_articles** - User favorites
7. **article_views** - Analytics

### Key Queries

```sql
-- Get all published articles
SELECT * FROM learn_articles WHERE status = 'published';

-- Get articles by topic
SELECT * FROM learn_articles WHERE topic = 'skin-basics';

-- Get pending reviews
SELECT * FROM review_tasks WHERE status = 'pending';

-- Get most viewed articles
SELECT * FROM learn_articles ORDER BY view_count DESC LIMIT 10;
```

---

## 🔒 Safety Checks

The pipeline performs 6 safety checks on every article:

1. **Medical Diagnosis** - Detects and blocks medical diagnosis language
2. **Absolute Claims** - Flags absolute statements ("will cure", "always works")
3. **Disclaimer** - Ensures required disclaimers are present
4. **Australian English** - Checks for American spellings
5. **Reading Level** - Analyzes complexity (target: Year 7-8)
6. **Age Appropriateness** - Validates age band assignments

### Safety Score

- **90-100:** Excellent - Auto-publish
- **80-89:** Good - Review recommended
- **70-79:** Fair - Review required
- **<70:** Poor - Major revisions needed

---

## 🎨 UI Components

### Learn Tab (`app/(tabs)/learn.tsx`)

Main Learn section with:
- Search bar
- Guided learning tracks
- Topic pillars (6 categories)
- AI assistant section

### Topic List (`app/learn/topic/[id].tsx`)

Shows all articles for a topic:
- Color-coded headers
- Article cards with metadata
- Filter by age band
- Reading time estimates

### Article Detail (`app/learn/[id].tsx`)

Full article view with:
- Key takeaways summary
- Body sections
- FAQ section
- Save/share buttons
- Source attribution
- Disclaimer

---

## 🔄 Scheduled Jobs

### Weekly Sync (Recommended)

Processes all enabled sources once per week:

```bash
# Cron: Every Sunday at 2am
0 2 * * 0
```

### Daily Sync (High-Priority Sources)

Processes sources marked as `daily`:

```bash
# Cron: Every day at 3am
0 3 * * *
```

### Stale Content Check

Flags articles older than 6 months:

```bash
# Cron: First of every month
0 0 1 * *
```

---

## 📈 Metrics & Analytics

### Content Metrics

- Total articles by status
- Articles by topic
- Total views/saves
- Average safety score
- Review pass rate

### User Metrics

- Most viewed articles
- Most saved articles
- Average reading time
- Topic popularity
- Search queries

### Pipeline Metrics

- Sources processed
- Success rate
- Average processing time
- Error rate
- Articles created per sync

---

## 🐛 Troubleshooting

### "Cannot find module 'cheerio'"

```bash
npm install cheerio @types/cheerio
```

### "Supabase client not configured"

Check your `.env` file has:
```env
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

### "OpenAI API error"

Verify your API key:
```env
OPENAI_API_KEY=sk-...
```

Check you have credits: https://platform.openai.com/usage

### "Safety check failed"

Review the safety report:
```typescript
const report = generateSafetyReport(safetyCheck);
console.log(report);
```

Common issues:
- Missing disclaimer
- Medical diagnosis language
- American English spelling

### "Database migration failed"

1. Check Supabase connection
2. Verify migration file exists
3. Run manually in Supabase Studio
4. Check for table name conflicts

---

## 🚀 Deployment

### Development

```bash
npm run test:pipeline
```

### Staging

1. Set up staging Supabase project
2. Update `.env` with staging credentials
3. Run migration
4. Test with 5-10 sources
5. Review generated content

### Production

1. Set up production Supabase project
2. Update `.env` with production credentials
3. Run migration
4. Configure cron jobs (Vercel Cron or similar)
5. Enable monitoring
6. Process all sources
7. Launch to users

---

## 📞 Support

### Documentation

- `LEARN_CONTENT_PIPELINE.md` - Architecture overview
- `LEARN_PIPELINE_IMPLEMENTATION.md` - Implementation details
- `LEARN_PIPELINE_COMPLETE.md` - Complete feature list

### Common Tasks

**Add a new source:**
1. Edit `src/services/learn/contentSources.ts`
2. Add source config with URL and selectors
3. Test with `processSourceOnDemand('source-id')`

**Customize AI prompts:**
1. Edit `src/services/learn/aiTools.ts`
2. Update prompt templates
3. Test with sample content

**Modify safety checks:**
1. Edit `src/services/learn/safetyChecker.ts`
2. Add/remove patterns
3. Adjust scoring weights

---

## ✅ Checklist

### Before First Run

- [ ] Dependencies installed
- [ ] `.env` configured with API keys
- [ ] Database migration applied
- [ ] Test script runs successfully
- [ ] Safety checks pass

### Before Production

- [ ] All sources tested
- [ ] Review workflow tested
- [ ] Cron jobs configured
- [ ] Monitoring set up
- [ ] Content team trained
- [ ] Legal review complete

---

## 🎉 Success Criteria

Your pipeline is working when:

1. ✅ Test script completes without errors
2. ✅ Safety score averages 85+
3. ✅ 80%+ of articles pass review
4. ✅ Processing time < 60s per source
5. ✅ No medical/legal issues
6. ✅ Users engage with content

---

**Ready to go? Run:**

```bash
npm run setup:learn
npm run test:pipeline
```

🚀 **Happy content generation!**
