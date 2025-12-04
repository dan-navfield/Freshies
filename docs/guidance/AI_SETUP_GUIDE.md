# AI Setup Guide - Quick Start

## 🚀 Getting Started

### Step 1: Get API Keys

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

#### Claude (Anthropic)
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key (starts with `sk-ant-`)

### Step 2: Add Keys to .env

Open `.env` file and replace placeholders:

```bash
# AI Provider API Keys
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-openai-key-here
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-actual-claude-key-here
```

**Note:** You need at least ONE key for the system to work. Having both enables automatic fallback.

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm start
```

---

## ✅ Test the Integration

### Quick Test Script

Create a test file: `testAI.ts`

```typescript
import { analyseProductForChild } from './src/services/ai';

const testProduct = {
  name: "CeraVe Hydrating Cleanser",
  brand: "CeraVe",
  category: "cleanser",
  ingredients_raw: "Aqua, Glycerin, Ceramides, Hyaluronic Acid",
};

const testChild = {
  name: "Ruby",
  age_years: 11,
  has_eczema: true,
  known_allergies: [],
};

async function test() {
  try {
    console.log('🧪 Testing AI integration...');
    
    const result = await analyseProductForChild(testProduct, testChild);
    
    console.log('✅ Success!');
    console.log('Flags:', result.flags);
    console.log('Ingredients:', result.normalised_ingredients);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Run it:
```bash
npx ts-node testAI.ts
```

---

## 🎯 Integration Checklist

- [ ] OpenAI API key added to `.env`
- [ ] Claude API key added to `.env` (optional but recommended)
- [ ] Development server restarted
- [ ] Test script runs successfully
- [ ] No console errors about missing API keys

---

## 💡 Usage in Your App

### Example: Product Detail Screen

```typescript
import { analyseProductComplete } from '@/services/ai';
import { useState, useEffect } from 'react';

function ProductDetailScreen({ product, childProfile }) {
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function analyse() {
      try {
        const { analysis, summary } = await analyseProductComplete(
          product,
          childProfile,
          "daily face cleanser"
        );
        setAiSummary(summary);
      } catch (error) {
        console.error('AI analysis failed:', error);
      } finally {
        setLoading(false);
      }
    }
    
    analyse();
  }, [product, childProfile]);

  if (loading) return <Text>Analysing product...</Text>;

  return (
    <View>
      <Text style={styles.riskLevel}>
        {aiSummary.overall_risk_level.toUpperCase()}
      </Text>
      <Text>{aiSummary.summary_text}</Text>
      
      {aiSummary.bullet_points.map((point, i) => (
        <Text key={i}>• {point}</Text>
      ))}
      
      <Text style={styles.disclaimer}>
        {aiSummary.disclaimer}
      </Text>
    </View>
  );
}
```

---

## 🔧 Configuration Options

### Choose Provider

```typescript
// Use OpenAI only
await analyseProductForChild(product, child, { provider: 'openai' });

// Use Claude only
await analyseProductForChild(product, child, { provider: 'claude' });

// Auto-select with fallback (recommended)
await analyseProductForChild(product, child, { provider: 'auto' });
```

### Adjust Response Style

```typescript
await analyseProductForChild(product, child, {
  temperature: 0.5,    // More focused (0-1, default: 0.7)
  max_tokens: 1500,    // Shorter response
  timeout_ms: 20000,   // 20 second timeout
});
```

---

## 🛡️ Safety Features

All AI responses automatically:
- ✅ Avoid medical diagnosis
- ✅ Use cautious language ("may", "can")
- ✅ Include disclaimers
- ✅ Encourage professional consultation
- ✅ Maintain calm, supportive tone

These cannot be disabled - they're built into system prompts.

---

## 💰 Cost Management

### Estimated Costs (as of Nov 2024)

**OpenAI GPT-4 Turbo:**
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- ~$0.05-0.15 per analysis

**Claude 3.5 Sonnet:**
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- ~$0.02-0.08 per analysis

### Tips to Reduce Costs

1. **Cache Results** - Store analyses for products
2. **Batch Requests** - Analyse multiple products together
3. **Use Claude First** - Generally cheaper
4. **Set Token Limits** - Use `max_tokens` option
5. **Monitor Usage** - Check provider dashboards

---

## 🐛 Common Issues

### "No AI provider configured"
**Fix:** Add at least one API key to `.env`

### "API key invalid"
**Fix:** 
- Check key is correct
- Ensure no extra spaces
- Verify key hasn't expired
- Check billing is active on provider account

### Slow Responses
**Fix:**
- Reduce `max_tokens`
- Use Claude (generally faster)
- Check network connection

### JSON Parse Errors
**Fix:** Already handled automatically, but if persists:
- Check API key permissions
- Verify model has JSON mode enabled

---

## 📊 Monitoring

### Check Logs

All AI calls are logged:
```
🤖 AI Call: analyse_ingredients via openai - ✅ (1234ms)
```

### Track Usage

Monitor in provider dashboards:
- OpenAI: https://platform.openai.com/usage
- Claude: https://console.anthropic.com/settings/usage

---

## 🎓 Next Steps

1. **Test all 5 tools** with sample data
2. **Integrate into product scan flow**
3. **Add to routine builder**
4. **Create coaching Q&A screen**
5. **Implement result caching**
6. **Add usage analytics**

---

## 📚 Full Documentation

See `AI_INTEGRATION.md` for:
- Complete API reference
- All tool inputs/outputs
- Advanced usage examples
- Architecture details

---

**Need Help?**
- Check console logs for errors
- Verify API keys are active
- Test with simple examples first
- Review `AI_INTEGRATION.md` for details

**Status:** ✅ Ready to Use  
**Last Updated:** November 15, 2024
