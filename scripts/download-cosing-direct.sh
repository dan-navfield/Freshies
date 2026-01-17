#!/bin/bash

# Direct download from GitHub mirror (BioBricks)
# This uses the public GitHub repository as an alternative

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CSV_FILE="$SCRIPT_DIR/cosing-ingredients.csv"

echo "📥 Downloading CosIng from GitHub (BioBricks)..."
echo ""

# Check if already exists
if [ -f "$CSV_FILE" ]; then
    echo "✅ CSV already exists: $CSV_FILE"
    exit 0
fi

# Download from BioBricks GitHub
echo "🔗 Fetching from: https://github.com/biobricks-ai/cosing-kg"
echo ""

# Try to download the raw data
curl -L -o "$CSV_FILE" \
  "https://raw.githubusercontent.com/biobricks-ai/cosing-kg/main/brick/cosing.parquet" \
  || curl -L -o "$CSV_FILE" \
  "https://github.com/biobricks-ai/cosing-kg/releases/latest/download/cosing.csv" \
  || {
    echo "❌ Direct download failed"
    echo ""
    echo "📥 Please download manually from one of these sources:"
    echo "   1. Kaggle: https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list"
    echo "   2. GitHub: https://github.com/biobricks-ai/cosing-kg"
    echo ""
    echo "   Save as: $CSV_FILE"
    exit 1
  }

echo ""
echo "✅ Download complete!"
echo "📊 CSV ready at: $CSV_FILE"
