#!/bin/bash

# Complete CosIng Setup Script
# Downloads and imports CosIng ingredients in one command

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 CosIng Ingredient Import Setup"
echo "=================================="
echo ""

# Step 1: Download
echo "📥 Step 1: Downloading dataset..."
bash "$SCRIPT_DIR/download-cosing.sh"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Download failed. Please download manually:"
    echo "   https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list"
    echo ""
    echo "   Save as: $SCRIPT_DIR/cosing-ingredients.csv"
    exit 1
fi

# Step 2: Import
echo ""
echo "📊 Step 2: Importing ingredients..."
cd "$SCRIPT_DIR/.."
npx tsx scripts/import-cosing-ingredients.ts

echo ""
echo "✅ CosIng import complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. View ingredients in admin panel: http://localhost:3000/ingredients"
echo "   2. Review and adjust ISI scores for common ingredients"
echo "   3. Add detailed descriptions for top ingredients"
