import { searchService } from '../src/services/searchService';
import { supabase } from '../src/lib/supabase';

async function testSearch() {
    console.log("Testing Global Search Service...");

    // 1. Test Mock Products (CeraVe)
    console.log("\nSearching for 'cera'...");
    const ceraResults = await searchService.searchGlobal('cera', 'test-user-id');
    console.log("Results count:", ceraResults.length);
    if (ceraResults.find(g => g.type === 'product')) {
        console.log("✅ Found Mock Products");
    } else {
        console.log("❌ Mock Products NOT found");
    }

    // 2. Test Recent Searches
    const recents = await searchService.getRecentSearches();
    console.log("\nRecent searches:", recents);
    if (recents.length > 0) console.log("✅ Recents fetched");

    // 3. Test Shelf (Requires real user ID, skipping real DB query if userId is fake, but function runs)
    // We mock the return in the service if no DB connection, but here we actually hit Supabase?
    // The service imports 'supabase'.
    console.log("\nDone.");
}

testSearch();
