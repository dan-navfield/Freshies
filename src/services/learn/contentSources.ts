/**
 * Learn Content Pipeline - Content Source Configuration
 * Defines all reputable sources for content ingestion
 */

import { ContentSource, SelectorConfig } from './types';

// ============================================================================
// HTML Selector Configurations
// ============================================================================

const DERMNETNZ_SELECTORS: SelectorConfig = {
  title_selector: 'h1.page-title',
  content_selector: 'div.article-content',
  exclude_selectors: [
    'nav',
    'footer',
    '.advertisement',
    '.sidebar',
    '.related-links',
    '.references',
  ],
  date_selector: 'time.published-date',
  author_selector: '.author-name',
};

const RCH_SELECTORS: SelectorConfig = {
  title_selector: 'h1.fact-sheet-title',
  content_selector: 'div.fact-sheet-content',
  exclude_selectors: [
    'nav',
    'footer',
    '.breadcrumb',
    '.share-buttons',
    '.related-topics',
  ],
  date_selector: '.last-updated',
};

const RCN_SELECTORS: SelectorConfig = {
  title_selector: 'h1.article-title',
  content_selector: 'article.main-content',
  exclude_selectors: [
    'nav',
    'footer',
    '.sidebar',
    '.advertisement',
    '.newsletter-signup',
  ],
  date_selector: '.publication-date',
};

const ACD_SELECTORS: SelectorConfig = {
  title_selector: 'h1',
  content_selector: 'main.content',
  exclude_selectors: [
    'nav',
    'footer',
    '.sidebar',
    '.related-content',
  ],
};

const BETTER_HEALTH_SELECTORS: SelectorConfig = {
  title_selector: 'h1.page-title',
  content_selector: 'div.page-content',
  exclude_selectors: [
    'nav',
    'footer',
    '.breadcrumb',
    '.share-tools',
    '.related-pages',
  ],
  date_selector: '.last-reviewed',
};

// ============================================================================
// Content Source Definitions
// ============================================================================

export const CONTENT_SOURCES: ContentSource[] = [
  // ========================================
  // Skin Basics Sources
  // ========================================
  {
    id: 'dermnetnz-child-skin',
    name: 'DermNet NZ - Child Skin',
    url: 'https://dermnetnz.org/topics/skin-in-children',
    type: 'dermnetnz',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: DERMNETNZ_SELECTORS,
  },
  {
    id: 'dermnetnz-eczema',
    name: 'DermNet NZ - Eczema',
    url: 'https://dermnetnz.org/topics/atopic-dermatitis',
    type: 'dermnetnz',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: DERMNETNZ_SELECTORS,
  },
  {
    id: 'dermnetnz-acne',
    name: 'DermNet NZ - Acne',
    url: 'https://dermnetnz.org/topics/acne',
    type: 'dermnetnz',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: DERMNETNZ_SELECTORS,
  },
  {
    id: 'rch-skincare-babies',
    name: 'RCH - Skincare for Babies',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Skincare_for_babies_and_young_children/',
    type: 'rch',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: RCH_SELECTORS,
  },
  {
    id: 'rch-eczema',
    name: 'RCH - Eczema',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Eczema/',
    type: 'rch',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: RCH_SELECTORS,
  },
  {
    id: 'rch-acne-teens',
    name: 'RCH - Acne in Teens',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Acne/',
    type: 'rch',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: RCH_SELECTORS,
  },
  {
    id: 'rcn-dry-skin',
    name: 'Raising Children Network - Dry Skin',
    url: 'https://raisingchildren.net.au/guides/a-z-health-reference/dry-skin',
    type: 'rcn',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: RCN_SELECTORS,
  },
  {
    id: 'better-health-sun-safety',
    name: 'Better Health - Sun Safety for Children',
    url: 'https://www.betterhealth.vic.gov.au/health/healthyliving/sun-safety-and-children',
    type: 'better-health',
    topic: 'skin-basics',
    enabled: true,
    fetch_frequency: 'weekly',
    selector_config: BETTER_HEALTH_SELECTORS,
  },

  // ========================================
  // Ingredients Sources
  // ========================================
  {
    id: 'aicis-cosmetic-ingredients',
    name: 'AICIS - Cosmetic Ingredients',
    url: 'https://www.industrialchemicals.gov.au/consumers/cosmetics-and-toiletries',
    type: 'aicis',
    topic: 'ingredients',
    enabled: true,
    fetch_frequency: 'monthly',
  },
  {
    id: 'dermnetnz-fragrance',
    name: 'DermNet NZ - Fragrance Allergy',
    url: 'https://dermnetnz.org/topics/fragrance-allergy',
    type: 'dermnetnz',
    topic: 'ingredients',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: DERMNETNZ_SELECTORS,
  },
  {
    id: 'dermnetnz-preservatives',
    name: 'DermNet NZ - Preservative Allergy',
    url: 'https://dermnetnz.org/topics/preservative-allergy',
    type: 'dermnetnz',
    topic: 'ingredients',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: DERMNETNZ_SELECTORS,
  },

  // ========================================
  // Product Types Sources
  // ========================================
  {
    id: 'rch-moisturisers',
    name: 'RCH - Moisturisers for Children',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Moisturisers/',
    type: 'rch',
    topic: 'products',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: RCH_SELECTORS,
  },
  {
    id: 'better-health-sunscreen',
    name: 'Better Health - Sunscreen',
    url: 'https://www.betterhealth.vic.gov.au/health/healthyliving/sunscreen',
    type: 'better-health',
    topic: 'products',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: BETTER_HEALTH_SELECTORS,
  },

  // ========================================
  // Routines & Layering Sources
  // ========================================
  {
    id: 'rch-skincare-routine',
    name: 'RCH - Daily Skincare Routine',
    url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Skincare_routine/',
    type: 'rch',
    topic: 'routines',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: RCH_SELECTORS,
  },
  {
    id: 'acd-skincare-basics',
    name: 'ACD - Skincare Basics',
    url: 'https://www.dermcoll.edu.au/atoz/skincare-basics/',
    type: 'acd',
    topic: 'routines',
    enabled: true,
    fetch_frequency: 'monthly',
    selector_config: ACD_SELECTORS,
  },

  // ========================================
  // Safety & Regulation Sources
  // ========================================
  {
    id: 'aicis-cosmetic-safety',
    name: 'AICIS - Cosmetic Safety',
    url: 'https://www.industrialchemicals.gov.au/consumers/cosmetics-safety',
    type: 'aicis',
    topic: 'safety',
    enabled: true,
    fetch_frequency: 'monthly',
  },
  {
    id: 'tga-cosmetics-regulation',
    name: 'TGA - Cosmetics Regulation',
    url: 'https://www.tga.gov.au/products/cosmetics',
    type: 'other',
    topic: 'safety',
    enabled: true,
    fetch_frequency: 'monthly',
  },
  {
    id: 'sa-health-cosmetics',
    name: 'SA Health - Cosmetics and Your Health',
    url: 'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/healthy+living/protecting+your+health/cosmetics+and+your+health',
    type: 'other',
    topic: 'safety',
    enabled: true,
    fetch_frequency: 'monthly',
  },

  // ========================================
  // Mental Health & Social Media Sources
  // ========================================
  // Note: These would be curated journalism pieces
  // URLs are examples - would need actual article URLs
  {
    id: 'sephora-kids-context',
    name: 'Sephora Kids Trend Analysis',
    url: 'https://example.com/sephora-kids-trend', // Placeholder
    type: 'journalism',
    topic: 'mental-health',
    enabled: false, // Disabled until real URLs added
    fetch_frequency: 'monthly',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all enabled sources
 */
export function getEnabledSources(): ContentSource[] {
  return CONTENT_SOURCES.filter(source => source.enabled);
}

/**
 * Get sources by topic
 */
export function getSourcesByTopic(topic: string): ContentSource[] {
  return CONTENT_SOURCES.filter(source => source.topic === topic && source.enabled);
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): ContentSource | undefined {
  return CONTENT_SOURCES.find(source => source.id === id);
}

/**
 * Get sources due for fetch
 */
export function getSourcesDueForFetch(): ContentSource[] {
  const now = new Date();
  
  return CONTENT_SOURCES.filter(source => {
    if (!source.enabled) return false;
    if (!source.next_fetch) return true; // Never fetched
    return source.next_fetch <= now;
  });
}

/**
 * Calculate next fetch date based on frequency
 */
export function calculateNextFetch(frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  const next = new Date(now);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next;
}
