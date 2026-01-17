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
import { isCapabilityPaused, loadActivePromptTemplate } from '../config/promptLoader';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.EXPO_PUBLIC_MISTRAL_API_KEY;
const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1/chat/completions';

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    const re = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, 'g');
    out = out.replace(re, value);
  }
  return out;
}

async function callMistralJSON<T>(args: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
}): Promise<T> {
  if (!MISTRAL_API_KEY) {
    throw new Error('Mistral API key not configured');
  }

  const response = await fetch(MISTRAL_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: args.model || 'mistral-small-latest',
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
      temperature: args.temperature ?? 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Mistral API error: ${response.status} - ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from Mistral');
  return JSON.parse(content) as T;
}

async function callLearnTool<T>(opts: {
  toolName: string;
  userPrompt: string;
  systemFallback: string;
  temperature: number;
}): Promise<T> {
  if (await isCapabilityPaused(opts.toolName)) {
    throw new Error(`AI capability is paused: ${opts.toolName}`);
  }

  const systemTpl = await loadActivePromptTemplate(opts.toolName, 'system');
  const provider = systemTpl.model_preferences?.provider || 'openai';
  const model = systemTpl.model_preferences?.model;

  const systemPrompt = systemTpl.content || opts.systemFallback;

  if (provider === 'mistral') {
    return callMistralJSON<T>({ systemPrompt, userPrompt: opts.userPrompt, model, temperature: opts.temperature });
  }

  if (provider !== 'openai') {
    throw new Error(`Unsupported provider for Learn tools: ${provider}`);
  }

  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    temperature: opts.temperature,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content || '{}';
  return JSON.parse(content) as T;
}

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
  const dbUser = await loadActivePromptTemplate('summarise_source_content', 'user');
  const base = dbUser.content && dbUser.content.trim().length > 0 ? dbUser.content : SUMMARISE_PROMPT_TEMPLATE;

  const prompt = renderTemplate(base, {
    source_url: input.source_url,
    source_name: input.source_name,
    topic: input.topic,
    source_text: input.source_text,
  });

  void aiProvider;

  return callLearnTool<SummariseOutput>({
    toolName: 'summarise_source_content',
    userPrompt: prompt,
    systemFallback: 'You are a content writer for Freshies, transforming medical content into parent-friendly articles.',
    temperature: 0.7,
  });
}

/**
 * Execute rewrite_for_parents tool
 */
export async function rewriteForParents(
  input: RewriteInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<RewriteOutput> {
  const dbUser = await loadActivePromptTemplate('rewrite_for_parents', 'user');
  const base = dbUser.content && dbUser.content.trim().length > 0 ? dbUser.content : REWRITE_PROMPT_TEMPLATE;

  const prompt = renderTemplate(base, {
    draft_text: input.draft_text,
    tone: input.tone,
    australian_english: String(input.australian_english),
    avoid_medical_language: String(input.avoid_medical_language),
  });

  void aiProvider;

  return callLearnTool<RewriteOutput>({
    toolName: 'rewrite_for_parents',
    userPrompt: prompt,
    systemFallback: 'You are refining content for Freshies to match brand voice.',
    temperature: 0.5,
  });
}

/**
 * Execute extract_facts_and_qas tool
 */
export async function extractFactsAndQAs(
  input: ExtractQAsInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<ExtractQAsOutput> {
  const dbUser = await loadActivePromptTemplate('extract_facts_and_qas', 'user');
  const base = dbUser.content && dbUser.content.trim().length > 0 ? dbUser.content : EXTRACT_QAS_PROMPT_TEMPLATE;

  let prompt = renderTemplate(base, {
    topic: input.topic,
    max_questions: String(input.max_questions),
    article_text: input.article_text,
    age_context: input.age_context || '',
  });

  if (!input.age_context) {
    prompt = prompt.replace(/{{#if age_context}}[\s\S]*?{{\/if}}/g, '');
  } else {
    prompt = prompt.replace('{{#if age_context}}', '').replace('{{/if}}', '');
  }

  void aiProvider;

  return callLearnTool<ExtractQAsOutput>({
    toolName: 'extract_facts_and_qas',
    userPrompt: prompt,
    systemFallback: 'You are generating FAQs for Freshies Learn articles.',
    temperature: 0.7,
  });
}

/**
 * Execute classify_article_topic tool
 */
export async function classifyArticleTopic(
  input: ClassifyInput,
  aiProvider: 'openai' | 'claude' = 'openai'
): Promise<ClassifyOutput> {
  const dbUser = await loadActivePromptTemplate('classify_article_topic', 'user');
  const base = dbUser.content && dbUser.content.trim().length > 0 ? dbUser.content : CLASSIFY_PROMPT_TEMPLATE;

  const prompt = renderTemplate(base, {
    article_title: input.article_title,
    article_text: input.article_text,
    allowed_topics: input.allowed_topics.map((t) => `- ${t}`).join('\n'),
  })
    .replace('{{#each allowed_topics}}', input.allowed_topics.map((t) => `- ${t}`).join('\n'))
    .replace('{{/each}}', '');

  void aiProvider;

  return callLearnTool<ClassifyOutput>({
    toolName: 'classify_article_topic',
    userPrompt: prompt,
    systemFallback: 'You are classifying articles for Freshies Learn categories.',
    temperature: 0.3,
  });
}
