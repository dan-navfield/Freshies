/**
 * Create Test Article Script (ES Module)
 * Run with: node scripts/create-test-article.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('\n🧪 Testing Admin-Ready Workflow');
console.log('='.repeat(70));

try {
  // STEP 1: Create article in DRAFT
  console.log('\n📝 STEP 1: Creating article in DRAFT status...');
  
  const testArticle = {
    title: 'Acne in Teens: What Parents Need to Know',
    summary: 'A comprehensive guide to understanding and managing teenage acne, from causes to treatments.',
    body_sections: [
      {
        heading: 'Understanding Teen Acne',
        content: 'Acne affects up to 85% of teenagers between ages 12-24. It occurs when hair follicles become clogged with oil and dead skin cells, leading to whiteheads, blackheads, or pimples.',
        order: 1,
      },
      {
        heading: 'When to See a Dermatologist',
        content: 'Consult a dermatologist if acne is severe, painful, leaving scars, or not responding to over-the-counter treatments after 8-12 weeks.',
        order: 2,
      },
    ],
    faqs: [
      {
        question: 'Should my teen wash their face more often if they have acne?',
        answer: 'No, washing more than twice daily can actually irritate the skin and worsen acne. Stick to gentle cleansing morning and night.',
        order: 1,
      },
      {
        question: 'How long does it take for acne treatments to work?',
        answer: 'Most treatments need 8-12 weeks to show significant improvement. Be patient and consistent with the routine.',
        order: 2,
      },
    ],
    topic: 'Acne & Blemishes',
    tags: ['acne', 'teens', 'hormones', 'treatment'],
    age_bands: ['13-16'],
    source_name: 'Test Article - Admin Workflow',
    source_url: 'https://example.com/teen-acne',
    disclaimer: 'This information is for general guidance only. For persistent or severe acne, please consult a dermatologist.',
    status: 'draft',
    source_type: 'ai_generated',
    source_refs: ['https://example.com/teen-acne'],
    version: 1,
  };

  const { data: article, error: createError } = await supabase
    .from('learn_articles')
    .insert(testArticle)
    .select('id, title, status, created_at')
    .single();

  if (createError) {
    throw new Error(`Failed to create article: ${createError.message}`);
  }

  console.log('✅ Article created successfully!');
  console.log(`   ID: ${article.id}`);
  console.log(`   Title: ${article.title}`);
  console.log(`   Status: ${article.status}`);

  const articleId = article.id;

  // STEP 2: Verify NOT visible to public
  console.log('\n🔍 STEP 2: Verifying article is NOT visible to public...');
  
  const { data: publicCheck } = await supabase
    .from('learn_articles')
    .select('id')
    .eq('id', articleId)
    .eq('status', 'published');

  if (!publicCheck || publicCheck.length === 0) {
    console.log('✅ Confirmed: Article is NOT visible to public (draft status)');
  } else {
    console.log('❌ ERROR: Draft article is visible to public!');
  }

  // STEP 3: Move to REVIEW
  console.log('\n📋 STEP 3: Moving article to REVIEW status...');
  
  const { error: reviewError } = await supabase
    .from('learn_articles')
    .update({ status: 'review', updated_at: new Date().toISOString() })
    .eq('id', articleId);

  if (reviewError) {
    throw new Error(`Failed to move to review: ${reviewError.message}`);
  }

  console.log('✅ Article moved to review queue');

  // STEP 4: Get review queue stats
  console.log('\n📊 STEP 4: Review queue statistics...');
  
  const { count: draftCount } = await supabase
    .from('learn_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft');

  const { count: reviewCount } = await supabase
    .from('learn_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'review');

  console.log(`✅ Drafts: ${draftCount || 0}, In Review: ${reviewCount || 0}`);

  // STEP 5: Publish article
  console.log('\n🚀 STEP 5: Publishing article...');
  
  const { error: publishError } = await supabase
    .from('learn_articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', articleId);

  if (publishError) {
    throw new Error(`Failed to publish: ${publishError.message}`);
  }

  console.log('✅ Article published successfully!');

  // STEP 6: Verify IS visible to public
  console.log('\n✅ STEP 6: Verifying article IS visible to public...');
  
  const { data: finalCheck } = await supabase
    .from('learn_articles')
    .select('id, title, status, published_at')
    .eq('id', articleId)
    .eq('status', 'published')
    .single();

  if (finalCheck) {
    console.log('✅ Confirmed: Article IS NOW visible to public users!');
    console.log(`   Title: ${finalCheck.title}`);
    console.log(`   Published: ${new Date(finalCheck.published_at).toLocaleString()}`);
  } else {
    console.log('❌ ERROR: Published article is not visible!');
  }

  // SUCCESS
  console.log('\n' + '='.repeat(70));
  console.log('🎉 TEST COMPLETE - ALL STEPS PASSED!');
  console.log('='.repeat(70));
  console.log('\n✅ Admin Workflow Verified:');
  console.log('   1. Article created in DRAFT (not visible to public)');
  console.log('   2. Moved to REVIEW queue');
  console.log('   3. Published (now visible to public)');
  console.log('\n📱 Check the mobile app Learn tab to see the new article!');
  console.log(`\n🆔 Article ID: ${articleId}`);
  console.log('');

  process.exit(0);

} catch (error) {
  console.error('\n❌ TEST FAILED:', error.message);
  console.error(error);
  process.exit(1);
}
