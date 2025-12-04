# AI Integration - Freshies

## Overview

Freshies uses AI to help parents make informed decisions about their children's skincare products and routines. The system is built on **MCP (Model Context Protocol)** with support for both **OpenAI** and **Claude** providers.

## Architecture

### Three AI Domains

1. **Product Intelligence** - Single product analysis
2. **Routine Intelligence** - Multiple products together
3. **Coaching & Education** - Parent Q&A and guidance

### Provider System

- **Dual Provider Support:** OpenAI GPT-4 and Claude 3.5 Sonnet
- **Automatic Fallback:** If primary provider fails, automatically tries the other
- **Provider Selection:** Manual selection or automatic load balancing

---

## 🛠️ AI Tools

### 1. **analyse_ingredients**

Analyses product ingredients for child safety.

**Input:**
```typescript
{
  product: {
    name: "Kids Gentle Face Wash",
    brand: "Example Brand",
    category: "cleanser",
    ingredients_raw: "Aqua, Glycerin, Sodium Laureth Sulfate, ...",
    country_code: "AU"
  },
  child_profile: {
    age_years: 10,
    has_eczema: true,
    known_allergies: ["fragrance"]
  }
}
```

**Output:**
```typescript
{
  normalised_ingredients: ["AQUA", "GLYCERIN", "SODIUM LAURETH SULFATE"],
  flags: {
    contains_fragrance: true,
    contains_common_allergens: ["FRAGRANCE"],
    contains_potential_irritants: ["SODIUM LAURETH SULFATE"],
    suitable_for_children_in_general: "caution"
  },
  ingredient_details: [
    {
      name: "SODIUM LAURETH SULFATE",
      purpose: "Surfactant/cleanser",
      safety_level: "caution",
      notes: "Can be drying for sensitive skin"
    }
  ]
}
```

---

### 2. **summarise_risk_for_parent**

Explains product safety in parent-friendly language.

**Input:**
```typescript
{
  product: { name: "...", brand: "..." },
  usage_context: "daily face cleanser",
  normalised_ingredients: ["..."],
  flags: { ... },
  child_profile: { age_years: 10, has_eczema: true }
}
```

**Output:**
```typescript
{
  overall_risk_level: "caution",
  summary_text: "This cleanser contains some ingredients that may be drying for sensitive skin...",
  bullet_points: [
    "Contains sulfates which can be harsh for eczema-prone skin",
    "Fragrance may cause irritation"
  ],
  practical_tips: [
    "Use only once daily",
    "Follow with a gentle moisturizer"
  ],
  disclaimer: "This is general guidance only. Consult a healthcare professional..."
}
```

---

### 3. **assess_routine**

Analyses multiple products used together.

**Input:**
```typescript
{
  child_profile: {
    name: "Ruby",
    age_years: 11,
    has_eczema: true
  },
  products: [
    {
      name: "Kids Gentle Face Wash",
      category: "cleanser",
      time_of_day: "morning",
      frequency: "daily",
      flags: { ... }
    },
    {
      name: "Brightening Serum",
      category: "treatment",
      time_of_day: "morning",
      frequency: "daily",
      flags: { ... }
    }
  ]
}
```

**Output:**
```typescript
{
  overall_assessment: "caution",
  headline: "Routine may be too complex for daily use",
  key_points: [
    "Two active products in morning routine may be too much",
    "Consider alternating days for the serum"
  ],
  recommendations: {
    simplify: ["Use serum every second night instead of daily"],
    sequence: [
      "Morning: Cleanser → Moisturiser → Sunscreen",
      "Evening: Cleanser → Treatment → Moisturiser"
    ]
  },
  compatibility_issues: [
    {
      product_a: "Face Wash",
      product_b: "Brightening Serum",
      issue: "Both contain active ingredients",
      suggestion: "Space them out or alternate days"
    }
  ],
  disclaimer: "General skincare guidance only. Not medical advice."
}
```

---

### 4. **propose_routine**

Designs a starter routine from scratch.

**Input:**
```typescript
{
  child_profile: {
    age_years: 11,
    has_eczema: true,
    skin_type: "dry"
  },
  goals: ["simple", "everyday use"],
  available_products: [
    { name: "Kids Gentle Face Wash", category: "cleanser" },
    { name: "Basic Moisturiser", category: "moisturiser" }
  ],
  budget: "medium"
}
```

**Output:**
```typescript
{
  routine: [
    {
      time_of_day: "morning",
      steps: [
        {
          step_type: "cleanser",
          product_reference: "Kids Gentle Face Wash",
          instructions: "Use a small amount, rinse with lukewarm water"
        },
        {
          step_type: "moisturiser",
          product_reference: "Basic Moisturiser",
          instructions: "Apply pea-sized amount to damp skin"
        }
      ]
    }
  ],
  explanations: [
    "Simple two-step routine suitable for 11-year-old with eczema",
    "Morning cleanse helps remove overnight oils without over-stripping"
  ],
  missing_products: [
    {
      type: "sunscreen",
      why_needed: "Daily sun protection is important",
      suggestions: ["Look for mineral-based SPF 30+"]
    }
  ],
  introduction_plan: {
    week_1: ["Start with cleanser only, once daily"],
    week_2: ["Add moisturiser after cleansing"],
    week_3_onwards: ["Continue routine, add sunscreen if going outdoors"]
  },
  disclaimer: "General guidance only. Not a treatment plan."
}
```

---

### 5. **coach_parent**

Answers parent questions with practical guidance.

**Input:**
```typescript
{
  child_profile: {
    age_years: 11,
    has_eczema: true
  },
  question: "Is it okay to use a scrub on my 11-year-old?",
  context: {
    current_routine_products: [...]
  }
}
```

**Output:**
```typescript
{
  answer_text: "For an 11-year-old with eczema, physical scrubs are generally not recommended...",
  key_points: [
    "Physical scrubs can irritate eczema-prone skin",
    "Gentle chemical exfoliation may be better",
    "A soft washcloth is often sufficient"
  ],
  suggested_actions: [
    "Try using a soft washcloth instead of grainy scrubs",
    "If skin gets irritated, stop and speak to a healthcare professional"
  ],
  related_topics: [
    "Gentle cleansing for eczema",
    "Age-appropriate skincare"
  ],
  must_show_disclaimer: true,
  disclaimer: "This is general guidance. Always consult a healthcare professional..."
}
```

---

## 📁 File Structure

```
src/services/ai/
├── index.ts                      # Main exports
├── types.ts                      # TypeScript interfaces
├── aiCareService.ts             # Orchestration layer
└── providers/
    ├── openai.ts                # OpenAI implementation
    └── claude.ts                # Claude implementation
```

---

## 🚀 Usage Examples

### Basic Product Analysis

```typescript
import { analyseProductForChild } from '@/services/ai';

const product = {
  name: "Kids Gentle Face Wash",
  brand: "CeraVe",
  category: "cleanser",
  ingredients_raw: "Aqua, Glycerin, Ceramides...",
};

const childProfile = {
  name: "Ruby",
  age_years: 11,
  has_eczema: true,
  known_allergies: ["fragrance"],
};

const analysis = await analyseProductForChild(product, childProfile);
console.log(analysis.flags);
```

### Complete Product Analysis with Summary

```typescript
import { analyseProductComplete } from '@/services/ai';

const { analysis, summary } = await analyseProductComplete(
  product,
  childProfile,
  "daily face cleanser"
);

console.log(summary.summary_text);
console.log(summary.bullet_points);
```

### Assess Existing Routine

```typescript
import { assessRoutineForChild } from '@/services/ai';

const routine = [
  {
    name: "Face Wash",
    brand: "CeraVe",
    category: "cleanser",
    time_of_day: "morning",
    frequency: "daily",
  },
  {
    name: "Moisturizer",
    brand: "Cetaphil",
    category: "moisturiser",
    time_of_day: "both",
    frequency: "twice_daily",
  },
];

const assessment = await assessRoutineForChild(routine, childProfile);
console.log(assessment.headline);
console.log(assessment.recommendations);
```

### Build New Routine

```typescript
import { proposeRoutineForChild } from '@/services/ai';

const proposal = await proposeRoutineForChild(
  childProfile,
  ["simple", "everyday use", "eczema-friendly"],
  undefined, // no existing products
  "medium"   // budget
);

console.log(proposal.routine);
console.log(proposal.introduction_plan);
```

### Ask Questions

```typescript
import { coachParent } from '@/services/ai';

const answer = await coachParent(
  "How often should my 11-year-old wash their face?",
  childProfile,
  { current_routine_products: routine }
);

console.log(answer.answer_text);
console.log(answer.suggested_actions);
```

---

## ⚙️ Configuration

### Environment Variables

Add to `.env`:

```bash
# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=sk-...

# Claude (Anthropic)
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...
```

### Provider Selection

```typescript
// Use specific provider
const analysis = await analyseProductForChild(product, childProfile, {
  provider: 'openai'  // or 'claude'
});

// Auto-select (with fallback)
const analysis = await analyseProductForChild(product, childProfile, {
  provider: 'auto'  // tries both if one fails
});
```

### Custom Options

```typescript
const options = {
  provider: 'auto',
  temperature: 0.7,      // creativity (0-1)
  max_tokens: 2000,      // response length
  timeout_ms: 30000,     // 30 second timeout
};

const analysis = await analyseProductForChild(product, childProfile, options);
```

---

## 🛡️ Safety Guardrails

All AI responses follow strict safety rules:

1. **No Diagnosis** - Never diagnose medical conditions
2. **Cautious Language** - Use "may", "can", "often" not absolutes
3. **Disclaimers** - Always include appropriate disclaimers
4. **Professional Referral** - Encourage seeking professional advice when needed
5. **Non-Alarmist Tone** - Calm, supportive, practical guidance

These are enforced in system prompts and cannot be overridden.

---

## 📊 Logging & Analytics

All AI calls are automatically logged:

```typescript
{
  tool: 'analyse_ingredients',
  provider: 'openai',
  timestamp: '2024-11-15T10:00:00Z',
  duration_ms: 1234,
  success: true
}
```

Logs include:
- Tool name
- Provider used
- Duration
- Success/failure
- Error messages (if any)

---

## 🧪 Testing

### Test with Mock Data

```typescript
const testProduct = {
  name: "Test Face Wash",
  brand: "Test Brand",
  category: "cleanser",
  ingredients_raw: "Aqua, Glycerin, Sodium Laureth Sulfate",
};

const testChild = {
  name: "Test Child",
  age_years: 10,
  has_eczema: false,
  known_allergies: [],
};

const result = await analyseProductForChild(testProduct, testChild);
```

---

## 🔄 Integration Points

### Product Screen
- Show AI-derived summary after scanning
- "Explain this product" button → `summarise_risk_for_parent`

### Child Routine Screen
- "Check this routine" → `assess_routine`
- "Build a simpler routine" → `propose_routine`

### Coaching Entry Point
- "Ask Freshies AI" → `coach_parent`
- Contextual help throughout app

---

## 📝 Next Steps

1. **Add API Keys** to `.env` file
2. **Test Each Tool** with sample data
3. **Integrate into UI** at key touchpoints
4. **Add Analytics** tracking for AI usage
5. **Implement Caching** for repeated queries
6. **Add Rate Limiting** to manage API costs

---

## 🆘 Troubleshooting

### "No AI provider configured"
- Check `.env` file has at least one API key
- Ensure keys are prefixed with `EXPO_PUBLIC_`

### Timeout Errors
- Increase `timeout_ms` in options
- Check network connection
- Verify API keys are valid

### JSON Parse Errors
- Claude sometimes wraps JSON in markdown - this is handled automatically
- If persists, check system prompts enforce JSON-only responses

---

**Status:** ✅ Fully Implemented  
**Providers:** OpenAI GPT-4, Claude 3.5 Sonnet  
**Last Updated:** November 15, 2024
