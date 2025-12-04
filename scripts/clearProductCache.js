/**
 * Clear Product Cache
 * This clears AsyncStorage for scanned products
 * Run this to force re-analysis of products
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const STORAGE_KEY = '@freshies_scanned_products';

async function clearProductCache() {
  try {
    console.log('🧹 Clearing scanned products cache...');
    
    // For this to work in Node, we need to mock AsyncStorage
    // In reality, this needs to be done from within the app
    
    console.log('\n⚠️  AsyncStorage can only be cleared from within the React Native app.');
    console.log('\n📝 To clear the cache and force re-analysis:');
    console.log('\n   Option 1: Clear from device');
    console.log('   • iOS: Settings → Freshies → Clear Data');
    console.log('   • Android: Settings → Apps → Freshies → Clear Storage');
    console.log('\n   Option 2: Delete specific product');
    console.log('   • Go to History tab');
    console.log('   • Swipe left on the product');
    console.log('   • Tap Delete');
    console.log('\n   Option 3: Use the barcode to scan a different product');
    console.log('   • The new scan will overwrite the old analysis');
    console.log('\n✅ After clearing, re-scan the product to get updated analysis!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearProductCache();
