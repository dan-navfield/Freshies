# CosIng Ingredient Import

Import ingredients from the EU CosIng (Cosmetic Ingredient Database).

## Data Source

**CosIng** is the European Commission's database of cosmetic ingredients. It contains:
- INCI names (International Nomenclature of Cosmetic Ingredients)
- Common names
- Functions (moisturizer, preservative, etc.)
- CAS numbers
- Descriptions

## How to Import

### Option 1: Kaggle Dataset (Recommended)

1. **Download the dataset:**
   - Go to: https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list
   - Click "Download" (you may need a Kaggle account)
   - Extract the CSV file

2. **Place the CSV:**
   ```bash
   mv ~/Downloads/cosing-ingredients.csv freshies-app/scripts/
   ```

3. **Run the import:**
   ```bash
   cd freshies-app
   npx tsx scripts/import-cosing-ingredients.ts
   ```

### Option 2: GitHub BioBricks

Alternatively, you can use the BioBricks dataset:
- https://github.com/biobricks-ai/cosing-kg

This is a knowledge graph format that would need a different parser.

## What Gets Imported

For each ingredient, we import:
- ✅ **INCI Name** - Official ingredient name
- ✅ **Common Name** - Consumer-friendly name
- ✅ **Description** - What the ingredient does
- ✅ **Function/Family** - Category (moisturizer, preservative, etc.)
- ✅ **CAS Number** - Chemical registry number
- ✅ **ISI Score** - Estimated safety score (0-100)
- ✅ **Safety Flags** - Allergen, fragrance, sensitiser flags

## ISI Score Estimation

Since CosIng doesn't provide safety scores, we estimate them based on:

| Score Range | Category | Examples |
|-------------|----------|----------|
| 90-100 | Excellent | Hyaluronic acid, Glycerin, Ceramides |
| 80-89 | Very Good | Preservatives, Fatty alcohols |
| 70-79 | Good | Most standard ingredients |
| 60-69 | Fair | Fragrances, Some alcohols |
| 40-59 | Caution | Acids, Strong actives |
| 0-39 | Avoid | Retinoids, Harsh chemicals |

## Import Limits

The script imports **1000 ingredients** by default to avoid overwhelming the database.

To change this, edit the script:
```typescript
await importIngredients(ingredients, 1000); // Change this number
```

## After Import

1. **Review imported ingredients** in the admin panel
2. **Manually adjust ISI scores** for important ingredients
3. **Add kid-friendly descriptions** for common ingredients
4. **Set proper flags** for allergens and restricted ingredients

## Expected Results

After importing 1000 ingredients, you should have:
- ~1000 total ingredients in the database
- Automatic ISI scores based on ingredient type
- Basic safety flags set
- Ready for manual curation and refinement

## Next Steps

1. Import the base dataset (1000 ingredients)
2. Review and adjust scores for common ingredients
3. Add detailed descriptions for top 100 ingredients
4. Set up manual review workflow for new ingredients
