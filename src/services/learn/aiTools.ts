/**
 * Learn Content Pipeline - AI Transformation Tools
 * MCP-powered tools for content transformation
 */

import OpenAI from 'openai';
import {
  SummariseInput,
  SummariseOutput,
  RewriteInput,
  RewriteOutput,
  ExtractQAsInput,
  ExtractQAsOutput,
  ClassifyInput,
  ClassifyOutput,
} from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

// ============================================================================
// Tool Definitions for MCP
// ============================================================================

export const LEARN_AI_TOOLS = {
  summarise_source_content: {
    name: 'summarise_source_content',
    description: 'Transform raw factual text into Freshies-style parent-friendly article content',
    inputSchema: {
      type: 'object',
      properties: {
        source_text: {
          type: 'string',
          description: 'Raw text content from the source',
        },
        source_url: {
          type: 'string',
          description: 'URL of the original source',
        },
        source_name: {
          type: 'string',
          description: 'Name of the source (e.g., "DermNet NZ", "RCH")',
        },
        topic: {
          type: 'string',
          enum: ['skin-basics', 'ingredients', 'products', 'routines', 'safety', 'mental-health'],
          description: 'Primary topic category',
        },
        target_reading_level: {
          type: 'string',
          const: 'Year 7-8',
          description: 'Australian reading level',
        },
        needs_age_banding: {
          type: 'boolean',
          description: 'Whether to include age band recommendations',
        },
      },
      required: ['source_text', 'source_url', 'source_name', 'topic', 'target_reading_level', 'needs_age_banding'],
    },
  },

  rewrite_for_parents: {
    name: 'rewrite_for_parents',
    description: 'Refine tone and ensure consistency with Freshies brand voice',
    inputSchema: {
      type: 'object',
      properties: {
        draft_text: {
          type: 'string',
          description: 'Draft article text to refine',
        },
        tone: {
          type: 'string',
          const: 'warm, balanced, reassuring',
          description: 'Target tone for the content',
        },
        australian_english: {
          type: 'boolean',
          const: true,
          description: 'Use Australian English spelling and terminology',
        },
        avoid_medical_language: {
          type: 'boolean',
          const: true,
          description: 'Avoid medical diagnosis language',
        },
      },
      required: ['draft_text', 'tone', 'australian_english', 'avoid_medical_language'],
    },
  },

  extract_facts_and_qas: {
    name: 'extract_facts_and_qas',
    description: 'Generate FAQ-style content from article text',
    inputSchema: {
      type: 'object',
      properties: {
        article_text: {
          type: 'string',
          description: 'Article content to extract FAQs from',
        },
        topic: {
          type: 'string',
          enum: ['skin-basics', 'ingredients', 'products', 'routines', 'safety', 'mental-health'],
          description: 'Article topic',
        },
        max_questions: {
          type: 'number',
          description: 'Maximum number of FAQs to generate',
          minimum: 1,
          maximum: 10,
        },
        age_context: {
          type: 'string',
          enum: ['5-8', '9-12', '13-16'],
          description: 'Optional age context for questions',
        },
      },
      required: ['article_text', 'topic', 'max_questions'],
    },
  },

  classify_article_topic: {
    name: 'classify_article_topic',
    description: 'Classify article into Learn categories and suggest tags',
    inputSchema: {
      type: 'object',
      properties: {
        article_text: {
          type: 'string',
          description: 'Article content to classify',
        },
        article_title: {
          type: 'string',
          description: 'Article title',
        },
        allowed_topics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['skin-basics', 'ingredients', 'products', 'routines', 'safety', 'mental-health'],
          },
          description: 'Allowed topic categories',
        },
      },
      required: ['article_text', 'article_title', 'allowed_topics'],
    },
  },
};

// ============================================================================
// Prompt Templates
// ============================================================================

export const SUMMARISE_PROMPT_TEMPLATE = `You are a content writer for Freshies, an Australian app helping parents understand kids' skincare.

Transform the following source content into a parent-friendly article:

SOURCE: {{source_url}}
SOURCE NAME: {{source_name}}
TOPIC: {{topic}}
READING LEVEL: Year 7-8 (Australian)

CONTENT:
{{source_text}}

REQUIREMENTS:
- Use Australian English (moisturiser, colour, sunscreen, etc)
- Plain language, warm and reassuring tone
- No medical diagnosis or absolute claims (avoid "will", "always", "never")
- Include age-appropriate guidance where relevant
- 5 bullet point summary at top (key takeaways)
- 2-4 main sections with clear, practical headings
- Each section should be 2-3 paragraphs maximum
- Always include disclaimer: "This is general guidance only. For specific concerns about your child's skin, please consult a healthcare professional."
- If age-specific advice is relevant, suggest age bands: 5-8, 9-12, 13-16
- IMPORTANT: Add a final section called "Learn More" with a link to the original source article

TONE EXAMPLES:
✓ "Many children experience dry skin, especially in winter"
✗ "All children will get dry skin"
✓ "Consider trying a gentle moisturiser"
✗ "You must use this treatment"
✓ "If you notice persistent redness, chat with your GP"
✗ "This indicates a serious condition"

OUTPUT FORMAT (JSON):
{
  "title": "Clear, practical title (e.g., 'Understanding Dry Skin in Children')",
  "summary": [
    "First key point...",
    "Second key point...",
    "Third key point...",
    "Fourth key point...",
    "Fifth key point..."
  ],
  "body_sections": [
    {
      "heading": "Practical heading (e.g., 'What causes dry skin?')",
      "content": "2-3 paragraphs of clear, warm content..."
    },
    {
      "heading": "Another practical heading",
      "content": "More helpful content..."
    },
    {
      "heading": "Learn More",
      "content": "This article is based on information from {{source_name}}. For the full medical details, you can read the original article at: {{source_url}}"
    }
  ],
  "age_bands": ["5-8", "9-12", "13-16"],
  "disclaimer": "This is general guidance only. For specific concerns about your child's skin, please consult a healthcare professional."
}`;

export const REWRITE_PROMPT_TEMPLATE = `You are refining content for Freshies, ensuring it matches our brand voice.

DRAFT TEXT:
{{draft_text}}

REQUIREMENTS:
- Tone: {{tone}}
- Australian English: {{australian_english}}
- Avoid medical diagnosis language: {{avoid_medical_language}}

SPECIFIC CHECKS:
1. Replace American spellings (moisturizer → moisturiser, color → colour)
2. Remove absolute language ("will", "always", "never", "must")
3. Replace medical jargon with plain language
4. Ensure warm, reassuring tone (not clinical or alarmist)
5. Use "your child" or "children" instead of "patients"
6. Replace "treatment" with "care" or "routine" where appropriate

OUTPUT FORMAT (JSON):
{
  "rewritten_text": "Refined version...",
  "changes_made": [
    "Changed 'moisturizer' to 'moisturiser'",
    "Replaced 'will cause' with 'may contribute to'",
    "Simplified 'dermatological condition' to 'skin concern'"
  ],
  "tone_score": 8
}`;

export const EXTRACT_QAS_PROMPT_TEMPLATE = `Based on this article about {{topic}}, generate {{max_questions}} frequently asked questions that Australian parents might have about kids' skincare.

ARTICLE:
{{article_text}}

{{#if age_context}}
AGE CONTEXT: Focus on questions relevant to ages {{age_context}}
{{/if}}

REQUIREMENTS:
- Questions should be practical and specific
- Questions should sound like real parent concerns
- Answers should be balanced and non-medical
- Use Australian English
- Include age context where relevant (e.g., "for an 11-year-old")
- Keep answers to 2-3 sentences
- Avoid absolute claims
- End with "consult a healthcare professional" for medical concerns

QUESTION EXAMPLES:
✓ "Can my 11-year-old use a face scrub?"
✓ "How often should I moisturise my child's skin?"
✓ "Is fragrance in products safe for kids?"
✗ "What is the chemical composition of moisturiser?"
✗ "Will this cure eczema?"

OUTPUT FORMAT (JSON):
{
  "faqs": [
    {
      "question": "Can an 11-year-old use exfoliants?",
      "answer": "Gentle exfoliation can be suitable for tweens and teens, but it's best to start with mild products once or twice a week. Look for gentle chemical exfoliants (like lactic acid) rather than harsh scrubs. If you're unsure, chat with your GP or dermatologist."
    }
  ]
}`;

export const CLASSIFY_PROMPT_TEMPLATE = `Classify this article into the appropriate Freshies Learn categories and suggest relevant tags.

TITLE: {{article_title}}

ARTICLE:
{{article_text}}

ALLOWED TOPICS:
{{#each allowed_topics}}
- {{this}}
{{/each}}

TOPIC DEFINITIONS:
- skin-basics: How skin works at different ages, common conditions, skin types
- ingredients: Specific ingredients explained (acids, preservatives, actives, etc)
- products: Product types and when kids need them (cleansers, moisturisers, sunscreens)
- routines: Building routines, layering, morning/evening care
- safety: Regulations, recalls, product safety, when to see a doctor
- mental-health: Body image, social media, Sephora kids, peer pressure

TAG SUGGESTIONS:
- Age bands: "Ages 5-8", "Ages 9-12", "Ages 13-16"
- Conditions: "Eczema", "Acne", "Dry skin", "Sensitive skin"
- Ingredients: "Fragrance", "Acids", "Retinoids", "Preservatives"
- Product types: "Cleansers", "Moisturisers", "Sunscreens"
- Concerns: "Sun safety", "Layering", "TikTok trends"

OUTPUT FORMAT (JSON):
{
  "primary_topic": "skin-basics",
  "secondary_topics": ["routines"],
  "suggested_tags": ["Ages 9-12", "Dry skin", "Moisturisers"],
  "confidence_score": 0.95
}`;

// ============================================================================
// Tool Execution Functions
// ============================================================================

/**
 * Execute summarise_source_content tool
 */
export async function summariseSourceContent(
  input: SummariseInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<SummariseOutput> {
  const prompt = SUMMARISE_PROMPT_TEMPLATE
    .replace('{{source_url}}', input.source_url)
    .replace('{{source_name}}', input.source_name)
    .replace('{{topic}}', input.topic)
    .replace('{{source_text}}', input.source_text);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a content writer for Freshies, transforming medical content into parent-friendly articles.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{}';
  return JSON.parse(content) as SummariseOutput;
}

/**
 * Execute rewrite_for_parents tool
 */
export async function rewriteForParents(
  input: RewriteInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<RewriteOutput> {
  const prompt = REWRITE_PROMPT_TEMPLATE
    .replace('{{draft_text}}', input.draft_text)
    .replace('{{tone}}', input.tone)
    .replace('{{australian_english}}', String(input.australian_english))
    .replace('{{avoid_medical_language}}', String(input.avoid_medical_language));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are refining content for Freshies to match brand voice.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{}';
  return JSON.parse(content) as RewriteOutput;
}

/**
 * Execute extract_facts_and_qas tool
 */
export async function extractFactsAndQAs(
  input: ExtractQAsInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<ExtractQAsOutput> {
  let prompt = EXTRACT_QAS_PROMPT_TEMPLATE
    .replace('{{topic}}', input.topic)
    .replace('{{max_questions}}', String(input.max_questions))
    .replace('{{article_text}}', input.article_text);

  if (input.age_context) {
    prompt = prompt.replace('{{#if age_context}}', '')
      .replace('{{age_context}}', input.age_context)
      .replace('{{/if}}', '');
  } else {
    prompt = prompt.replace(/{{#if age_context}}[\s\S]*?{{\/if}}/g, '');
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are generating FAQs for Freshies Learn articles.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{}';
  return JSON.parse(content) as ExtractQAsOutput;
}

/**
 * Execute classify_article_topic tool
 */
export async function classifyArticleTopic(
  input: ClassifyInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<ClassifyOutput> {
  const prompt = CLASSIFY_PROMPT_TEMPLATE
    .replace('{{article_title}}', input.article_title)
    .replace('{{article_text}}', input.article_text)
    .replace('{{#each allowed_topics}}', input.allowed_topics.map(t => `- ${t}`).join('\n'))
    .replace('{{/each}}', '');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are classifying articles for Freshies Learn categories.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{}';
  return JSON.parse(content) as ClassifyOutput;
}
