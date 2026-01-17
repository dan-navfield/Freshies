#!/bin/bash

# Download CosIng Ingredients Dataset
# This script downloads the dataset from Kaggle and prepares it for import

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOWNLOAD_DIR="$SCRIPT_DIR"
ZIP_FILE="$DOWNLOAD_DIR/cosing-ingredients-inci-list.zip"
CSV_FILE="$DOWNLOAD_DIR/cosing-ingredients.csv"

echo "📥 Downloading CosIng Ingredients Dataset..."
echo ""

# Check if CSV already exists
if [ -f "$CSV_FILE" ]; then
    echo "✅ CSV file already exists: $CSV_FILE"
    echo "🗑️  Delete it first if you want to re-download"
    exit 0
fi

# Try Kaggle CLI first (if installed and configured)
if command -v kaggle &> /dev/null; then
    echo "🔧 Using Kaggle CLI..."
    echo ""
    
    # Check if Kaggle is configured
    if [ -f ~/.kaggle/kaggle.json ]; then
        echo "✅ Kaggle credentials found"
        cd "$DOWNLOAD_DIR"
        kaggle datasets download -d amaboh/cosing-ingredients-inci-list
        
        if [ $? -eq 0 ]; then
            echo "✅ Download complete!"
        else
            echo "❌ Kaggle CLI download failed"
            exit 1
        fi
    else
        echo "⚠️  Kaggle credentials not found"
        echo "📝 To use Kaggle CLI:"
        echo "   1. Go to https://www.kaggle.com/settings/account"
        echo "   2. Click 'Create New API Token'"
        echo "   3. Save kaggle.json to ~/.kaggle/"
        echo ""
        echo "Falling back to manual download..."
        exit 1
    fi
else
    echo "⚠️  Kaggle CLI not installed"
    echo "📦 Install with: pip install kaggle"
    echo ""
    echo "❌ Cannot download automatically"
    echo ""
    echo "📥 Please download manually:"
    echo "   1. Go to: https://www.kaggle.com/datasets/amaboh/cosing-ingredients-inci-list"
    echo "   2. Click 'Download'"
    echo "   3. Move the ZIP to: $DOWNLOAD_DIR"
    echo ""
    exit 1
fi

# Extract the ZIP file
if [ -f "$ZIP_FILE" ]; then
    echo ""
    echo "📦 Extracting ZIP file..."
    unzip -o "$ZIP_FILE" -d "$DOWNLOAD_DIR"
    
    # Find the CSV file (it might have a different name)
    EXTRACTED_CSV=$(find "$DOWNLOAD_DIR" -maxdepth 1 -name "*.csv" -type f | head -n 1)
    
    if [ -n "$EXTRACTED_CSV" ]; then
        # Rename to expected filename
        mv "$EXTRACTED_CSV" "$CSV_FILE"
        echo "✅ CSV extracted: $CSV_FILE"
        
        # Clean up ZIP
        rm "$ZIP_FILE"
        echo "🗑️  Cleaned up ZIP file"
    else
        echo "❌ No CSV found in ZIP"
        exit 1
    fi
else
    echo "❌ ZIP file not found"
    exit 1
fi

echo ""
echo "✅ Download complete!"
echo "📊 CSV ready at: $CSV_FILE"
echo ""
echo "🚀 Next step: Run the import script"
echo "   npx tsx scripts/import-cosing-ingredients.ts"
