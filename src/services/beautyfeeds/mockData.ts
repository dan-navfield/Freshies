/**
 * Mock BeautyFeeds Data
 * Temporary fallback data while we verify API endpoints
 */

export const mockBeautyFeedsProducts = [
  {
    id: 'B07B327LMY',
    name: 'TONYMOLY The Chok Chok Green Tea Watery Moisturizer Cream',
    brand: 'TONYMOLY',
    category: 'Face Moisturizers',
    description: 'Intense Skin Hydration with Green Tea Extract and Antioxidants',
    price: { amount: 33.0, currency: 'USD' },
    images: ['https://m.media-amazon.com/images/I/41Gnk4X8qxL._SX342_SY445_QL70_FMwebp_.jpg'],
    asin: 'B07B327LMY',
    barcode: null,
    upc: null,
    ingredients: 'Green Tea Extract, Hyaluronic Acid, Glycerin',
    availability: { inStock: true, retailers: ['Amazon'] },
    rating: 4.4,
    reviewCount: 434,
    url: 'https://www.amazon.com/dp/B07B327LMY',
  },
  {
    id: 'B0060KV89G',
    name: 'bellapierre Compact Mineral Blush - Autumn Glow',
    brand: 'bellapierre',
    category: 'Face Blush',
    description: 'Warm Dewy Glow | Non-Toxic and Paraben Free',
    price: { amount: 29.98, currency: 'USD' },
    images: ['https://m.media-amazon.com/images/I/513EBx5HQmL._SY300_SX300_QL70_FMwebp_.jpg'],
    asin: 'B0060KV89G',
    upc: '812267010476',
    barcode: '812267010476',
    ingredients: 'Mica, Zinc Stearate, Simmondsia Chinensis (Jojoba) Seed Oil, Lauroyl Lysine, Lonicera Caprifolium (Honeysuckle) Flower Extract, Titanium Dioxide, Iron Oxides',
    availability: { inStock: true, retailers: ['Amazon'] },
    rating: 3.6,
    reviewCount: 74,
    url: 'https://www.amazon.com/dp/B0060KV89G',
  },
  {
    id: 'B09SBH873H',
    name: 'Labello Caring Beauty Pink Lip Balm',
    brand: 'Labello',
    category: 'Lip Balms',
    description: 'Lippenpflegestift mit Vitamin E, Sheabutter und Mandelöl',
    price: { amount: 0, currency: 'GBP' },
    images: ['https://m.media-amazon.com/images/I/51uedD2kBfL.__AC_SX300_SY300_QL70_ML2_.jpg'],
    asin: 'B09SBH873H',
    barcode: null,
    upc: null,
    ingredients: 'Sheabutter, Bio-Mandelöl, Vitamin E',
    availability: { inStock: false, retailers: ['Amazon UK'] },
    rating: 4.4,
    reviewCount: 822,
    url: 'https://www.amazon.co.uk/dp/B09SBH873H',
  },
  {
    id: 'B09YH5LQM4',
    name: 'ISOI Moisture Dr. Ampoule',
    brand: 'ISOI',
    category: 'Facial Serums',
    description: 'Deep Hydration and Barrier Repair Serum with Tea Tree Ceramide',
    price: { amount: 27.0, currency: 'USD' },
    images: ['https://m.media-amazon.com/images/I/41Vab8iKK7L._SY300_SX300_QL70_FMwebp_.jpg'],
    asin: 'B09YH5LQM4',
    barcode: null,
    upc: null,
    ingredients: 'Water, Glycerin, Betaine, Trehalose, Squalane, Sodium Hyaluronate, Tea Tree Extract, Ceramide NP',
    availability: { inStock: true, retailers: ['Amazon'] },
    rating: 4.9,
    reviewCount: 11,
    url: 'https://www.amazon.com/dp/B09YH5LQM4',
  },
];

/**
 * Search mock products by code (ASIN, UPC, barcode, or name)
 */
export function searchMockProducts(query: string) {
  const lowerQuery = query.toLowerCase();
  
  return mockBeautyFeedsProducts.filter(p => 
    p.asin?.toLowerCase() === lowerQuery ||
    p.upc?.toLowerCase() === lowerQuery ||
    p.barcode?.toLowerCase() === lowerQuery ||
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery)
  );
}
