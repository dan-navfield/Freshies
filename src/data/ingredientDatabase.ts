/**
 * Comprehensive Ingredient Information Database
 * Provides detailed, educational information about common skincare ingredients
 */

export interface IngredientInfo {
  name: string;
  alternateNames?: string[];
  category: string;
  description: string;
  whatItDoes: string;
  benefits: string[];
  concerns?: string[];
  childSafety: {
    rating: 'safe' | 'caution' | 'avoid';
    ageRestrictions?: string;
    notes: string;
  };
  commonUses: string[];
  funFact?: string;
}

export const INGREDIENT_DATABASE: Record<string, IngredientInfo> = {
  // ===== HUMECTANTS & MOISTURIZERS =====
  'glycerin': {
    name: 'Glycerin',
    alternateNames: ['Glycerol', 'Glycerine'],
    category: 'Humectant',
    description: 'A natural humectant that attracts water from the air and deeper skin layers to hydrate the outer layer of skin.',
    whatItDoes: 'Glycerin is a powerful moisturizing ingredient that draws moisture into the skin and helps maintain the skin barrier. It\'s one of the most effective and gentle hydrating ingredients available.',
    benefits: [
      'Deeply hydrates skin by attracting and retaining moisture',
      'Strengthens the skin\'s natural moisture barrier',
      'Suitable for all skin types, including sensitive skin',
      'Non-comedogenic (won\'t clog pores)',
      'Helps other ingredients penetrate better'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Glycerin is extremely safe for children of all ages. It\'s gentle, non-irritating, and commonly used in baby products. It\'s actually one of the best ingredients for children\'s sensitive skin.'
    },
    commonUses: [
      'Moisturizers and lotions',
      'Cleansers',
      'Serums',
      'Baby products',
      'Lip balms'
    ],
    funFact: 'Glycerin has been used in skincare for over 150 years and is found naturally in our skin!'
  },

  'hyaluronic acid': {
    name: 'Hyaluronic Acid',
    alternateNames: ['Sodium Hyaluronate', 'HA'],
    category: 'Humectant',
    description: 'A powerful humectant that can hold up to 1000 times its weight in water, providing intense hydration.',
    whatItDoes: 'Hyaluronic acid is like a moisture magnet for your skin. It pulls water from the environment and deeper skin layers to plump and hydrate the outer skin, reducing the appearance of fine lines.',
    benefits: [
      'Provides intense, long-lasting hydration',
      'Plumps skin and reduces fine lines',
      'Lightweight and non-greasy',
      'Suitable for all skin types',
      'Helps skin look dewy and fresh'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Hyaluronic acid is very safe for children. It\'s naturally found in the body and is gentle enough for sensitive young skin.'
    },
    commonUses: [
      'Hydrating serums',
      'Moisturizers',
      'Eye creams',
      'Sheet masks'
    ],
    funFact: 'Your body naturally produces hyaluronic acid, but production decreases as we age!'
  },

  // ===== EMOLLIENTS =====
  'ceramide np': {
    name: 'Ceramide NP',
    alternateNames: ['Ceramide 3'],
    category: 'Emollient / Skin-Identical Ingredient',
    description: 'A lipid molecule that\'s naturally found in skin and helps form the skin\'s protective barrier.',
    whatItDoes: 'Ceramides are like the "mortar" between skin cells, helping to keep the skin barrier strong and preventing moisture loss. They\'re essential for healthy, protected skin.',
    benefits: [
      'Strengthens the skin\'s protective barrier',
      'Prevents moisture loss',
      'Reduces sensitivity and irritation',
      'Helps repair damaged skin',
      'Improves skin texture'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Ceramides are excellent for children, especially those with eczema or dry skin. They\'re identical to what\'s naturally in skin, making them very safe and effective.'
    },
    commonUses: [
      'Moisturizers for dry/eczema-prone skin',
      'Barrier repair creams',
      'Sensitive skin products'
    ],
    funFact: 'Ceramides make up about 50% of the skin\'s outer layer!'
  },

  'ceramide ap': {
    name: 'Ceramide AP',
    alternateNames: ['Ceramide 6-II'],
    category: 'Emollient / Skin-Identical Ingredient',
    description: 'A type of ceramide that helps maintain skin barrier function and promotes natural exfoliation.',
    whatItDoes: 'Ceramide AP not only strengthens the skin barrier like other ceramides, but also helps with gentle exfoliation and skin renewal.',
    benefits: [
      'Strengthens skin barrier',
      'Promotes healthy skin cell turnover',
      'Reduces water loss',
      'Improves skin smoothness',
      'Helps with eczema and dry skin'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Very safe for children. Particularly beneficial for kids with eczema or very dry skin.'
    },
    commonUses: [
      'Eczema creams',
      'Barrier repair products',
      'Moisturizers'
    ]
  },

  'ceramide eop': {
    name: 'Ceramide EOP',
    alternateNames: ['Ceramide 1'],
    category: 'Emollient / Skin-Identical Ingredient',
    description: 'A unique ceramide that plays a crucial role in maintaining the skin\'s water barrier.',
    whatItDoes: 'Ceramide EOP is essential for creating a strong, water-resistant barrier in the outer layer of skin. It works with other ceramides to keep skin protected and hydrated.',
    benefits: [
      'Creates water-resistant skin barrier',
      'Prevents dehydration',
      'Reduces skin sensitivity',
      'Helps with barrier-impaired conditions',
      'Works synergistically with other ceramides'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Excellent for children with compromised skin barriers, eczema, or very dry skin. Completely safe and beneficial.'
    },
    commonUses: [
      'Eczema treatments',
      'Intensive moisturizers',
      'Barrier repair formulas'
    ]
  },

  // ===== ACTIVES =====
  'niacinamide': {
    name: 'Niacinamide',
    alternateNames: ['Vitamin B3', 'Nicotinamide'],
    category: 'Active Ingredient / Vitamin',
    description: 'A form of Vitamin B3 that offers multiple skin benefits including brightening, pore refining, and barrier strengthening.',
    whatItDoes: 'Niacinamide is a multi-tasking ingredient that helps with almost every skin concern. It strengthens the skin barrier, reduces redness, minimizes pores, and evens skin tone.',
    benefits: [
      'Strengthens skin barrier',
      'Reduces redness and irritation',
      'Minimizes appearance of pores',
      'Evens out skin tone',
      'Controls oil production',
      'Reduces fine lines'
    ],
    concerns: [
      'May cause mild flushing in sensitive individuals at high concentrations (>10%)'
    ],
    childSafety: {
      rating: 'safe',
      ageRestrictions: 'Best for ages 8+',
      notes: 'Niacinamide is generally safe for children, especially at lower concentrations (2-5%). It\'s particularly helpful for kids with acne-prone skin or uneven tone. Start with lower concentrations for younger children.'
    },
    commonUses: [
      'Serums',
      'Moisturizers',
      'Acne treatments',
      'Brightening products'
    ],
    funFact: 'Niacinamide is one of the few ingredients that works well with almost all other skincare ingredients!'
  },

  // ===== CLEANSING AGENTS =====
  'sodium methyl cocoyl taurate': {
    name: 'Sodium Methyl Cocoyl Taurate',
    category: 'Gentle Surfactant',
    description: 'A mild, coconut-derived cleansing agent that\'s much gentler than traditional sulfates.',
    whatItDoes: 'This ingredient helps remove dirt, oil, and makeup from skin without stripping away natural moisture. It creates a light foam and is very gentle on the skin barrier.',
    benefits: [
      'Gentle, non-stripping cleansing',
      'Derived from coconut oil',
      'Suitable for sensitive skin',
      'Maintains skin\'s pH balance',
      'Creates a pleasant, light foam'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'This is one of the gentlest cleansing agents available and is excellent for children. Much better than harsh sulfates like SLS.'
    },
    commonUses: [
      'Gentle cleansers',
      'Baby washes',
      'Sensitive skin cleansers'
    ],
    funFact: 'This ingredient is often used as a gentler alternative to SLS in baby products!'
  },

  'cocamidopropyl hydroxysultaine': {
    name: 'Cocamidopropyl Hydroxysultaine',
    category: 'Gentle Surfactant / Foam Booster',
    description: 'A mild, coconut-derived ingredient that helps create foam and enhances the gentleness of cleansers.',
    whatItDoes: 'This ingredient boosts foam in cleansers while actually making them gentler and less irritating. It\'s often added to balance out stronger cleansing agents.',
    benefits: [
      'Makes cleansers gentler',
      'Boosts foam and lather',
      'Reduces irritation from other surfactants',
      'Conditions skin while cleansing',
      'Biodegradable and eco-friendly'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Very safe for children. It\'s commonly used in baby shampoos and gentle cleansers because it reduces irritation.'
    },
    commonUses: [
      'Gentle cleansers',
      'Baby shampoos',
      'Facial washes'
    ]
  },

  'sodium lauryl sulfate': {
    name: 'Sodium Lauryl Sulfate',
    alternateNames: ['SLS'],
    category: 'Harsh Surfactant',
    description: 'A strong cleansing agent that creates lots of foam but can be drying and irritating.',
    whatItDoes: 'SLS is a powerful detergent that removes oil and dirt very effectively, but it can strip the skin of natural oils and disrupt the skin barrier.',
    benefits: [
      'Very effective at removing oil and dirt',
      'Creates rich foam',
      'Inexpensive'
    ],
    concerns: [
      'Can strip natural oils from skin',
      'May cause dryness and irritation',
      'Can disrupt skin barrier',
      'Not ideal for sensitive or dry skin'
    ],
    childSafety: {
      rating: 'caution',
      notes: 'Not recommended for children, especially those with sensitive or eczema-prone skin. Can be too harsh and drying for young skin. Look for gentler alternatives like Sodium Methyl Cocoyl Taurate.'
    },
    commonUses: [
      'Budget cleansers',
      'Body washes',
      'Shampoos'
    ],
    funFact: 'SLS is also used in industrial cleaning products - that\'s how strong it is!'
  },

  // ===== PRESERVATIVES & STABILIZERS =====
  'phenoxyethanol': {
    name: 'Phenoxyethanol',
    category: 'Preservative',
    description: 'A widely-used preservative that prevents bacterial and fungal growth in skincare products.',
    whatItDoes: 'This ingredient keeps your skincare products fresh and safe by preventing harmful bacteria and mold from growing. It\'s a gentler alternative to parabens.',
    benefits: [
      'Prevents bacterial contamination',
      'Extends product shelf life',
      'Gentler than many other preservatives',
      'Effective at low concentrations'
    ],
    concerns: [
      'Can cause irritation in very sensitive individuals at high concentrations'
    ],
    childSafety: {
      rating: 'safe',
      ageRestrictions: 'Avoid in products for babies under 3 months',
      notes: 'Generally safe for children when used at approved concentrations (up to 1%). Some parents prefer to avoid it in products for very young babies. It\'s considered safer than parabens.'
    },
    commonUses: [
      'Moisturizers',
      'Serums',
      'Cleansers',
      'Most water-based products'
    ]
  },

  'fragrance': {
    name: 'Fragrance',
    alternateNames: ['Parfum', 'Perfume'],
    category: 'Fragrance',
    description: 'A mixture of scent chemicals used to make products smell pleasant.',
    whatItDoes: 'Fragrance makes products smell nice, but it\'s one of the most common causes of skin irritation and allergic reactions.',
    benefits: [
      'Makes products smell pleasant',
      'Can enhance user experience'
    ],
    concerns: [
      'Common allergen and irritant',
      'Can trigger eczema flare-ups',
      'May cause contact dermatitis',
      'Ingredients not required to be disclosed',
      'Can be sensitizing over time'
    ],
    childSafety: {
      rating: 'avoid',
      notes: 'Not recommended for children, especially those with sensitive skin, eczema, or allergies. Children\'s skin is more permeable and reactive. Always choose fragrance-free products for kids when possible.'
    },
    commonUses: [
      'Lotions',
      'Creams',
      'Cleansers',
      'Most scented products'
    ],
    funFact: 'The term "fragrance" can hide over 3,000 different chemicals - companies don\'t have to disclose what\'s in it!'
  },

  // ===== SOLVENTS & BASES =====
  'aqua': {
    name: 'Aqua',
    alternateNames: ['Water', 'Eau'],
    category: 'Solvent / Base',
    description: 'Purified water that serves as the base for most skincare products.',
    whatItDoes: 'Water is the foundation of most skincare products. It dissolves other ingredients and helps them spread evenly on skin. It also provides light hydration.',
    benefits: [
      'Universal solvent for other ingredients',
      'Provides light hydration',
      'Helps products spread easily',
      'Essential for product texture'
    ],
    childSafety: {
      rating: 'safe',
      notes: 'Completely safe. Water is the most basic and essential ingredient in skincare.'
    },
    commonUses: [
      'Almost all water-based products',
      'Lotions',
      'Serums',
      'Cleansers'
    ],
    funFact: 'Water is usually the first ingredient listed because it\'s typically the highest percentage in formulas!'
  },

  // ===== ACIDS & EXFOLIANTS =====
  'salicylic acid': {
    name: 'Salicylic Acid',
    alternateNames: ['BHA', 'Beta Hydroxy Acid'],
    category: 'Chemical Exfoliant / Active',
    description: 'An oil-soluble acid that penetrates pores to unclog them and reduce acne.',
    whatItDoes: 'Salicylic acid goes deep into pores to dissolve oil and dead skin cells. It\'s especially good for acne-prone and oily skin.',
    benefits: [
      'Unclogs pores',
      'Reduces acne and blackheads',
      'Exfoliates inside pores',
      'Anti-inflammatory',
      'Reduces oil production'
    ],
    concerns: [
      'Can cause dryness if overused',
      'May increase sun sensitivity',
      'Can be irritating at high concentrations'
    ],
    childSafety: {
      rating: 'caution',
      ageRestrictions: 'Best for ages 10+ with acne',
      notes: 'Can be used for children with acne, but start with low concentrations (0.5-1%) and use sparingly. Not recommended for children under 10 unless directed by a dermatologist. Always use sunscreen when using this ingredient.'
    },
    commonUses: [
      'Acne treatments',
      'Pore-clearing products',
      'Exfoliating toners',
      'Spot treatments'
    ],
    funFact: 'Salicylic acid was originally derived from willow bark, which has been used medicinally for thousands of years!'
  }
};

/**
 * Get detailed information about an ingredient
 */
export function getIngredientInfo(ingredientName: string): IngredientInfo | null {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Direct match
  if (INGREDIENT_DATABASE[normalizedName]) {
    return INGREDIENT_DATABASE[normalizedName];
  }
  
  // Check alternate names
  for (const [key, info] of Object.entries(INGREDIENT_DATABASE)) {
    if (info.alternateNames?.some(alt => alt.toLowerCase() === normalizedName)) {
      return info;
    }
  }
  
  return null;
}

/**
 * Get a generic description for unknown ingredients based on their flags
 */
export function getGenericIngredientInfo(flags?: string[]): Partial<IngredientInfo> {
  if (!flags || flags.length === 0) {
    return {
      category: 'Cosmetic Ingredient',
      description: 'A cosmetic ingredient used in skincare formulations.',
      whatItDoes: 'This ingredient serves a specific function in the product formula, helping to create the desired texture, stability, or effect.',
      childSafety: {
        rating: 'safe',
        notes: 'This ingredient is generally considered safe when used in cosmetic products at approved concentrations.'
      }
    };
  }
  
  // Provide info based on flags
  if (flags.includes('FRAGRANCE')) {
    return {
      category: 'Fragrance',
      description: 'A fragrance component used to add scent to the product.',
      whatItDoes: 'Provides scent to the product. Fragrance ingredients can sometimes cause sensitivity in individuals with reactive skin.',
      concerns: ['May cause irritation in sensitive individuals'],
      childSafety: {
        rating: 'caution',
        notes: 'Fragrance ingredients can be irritating for some children, especially those with sensitive skin or eczema. Consider fragrance-free alternatives when possible.'
      }
    };
  }
  
  if (flags.includes('SULFATE_SURFACTANT') || flags.includes('STRONG_SURFACTANT')) {
    return {
      category: 'Cleansing Agent',
      description: 'A surfactant that helps remove dirt, oil, and impurities from skin.',
      whatItDoes: 'Creates foam and helps cleanse the skin by removing oil and dirt. Some surfactants can be drying if used too frequently.',
      concerns: ['May be drying for some skin types'],
      childSafety: {
        rating: 'caution',
        notes: 'Strong cleansing agents can be harsh on children\'s delicate skin. Look for gentler alternatives for daily use.'
      }
    };
  }
  
  if (flags.includes('PARABEN')) {
    return {
      category: 'Preservative',
      description: 'A preservative that prevents bacterial and fungal growth in products.',
      whatItDoes: 'Keeps products fresh and safe by preventing microbial contamination.',
      concerns: ['Some people prefer to avoid parabens'],
      childSafety: {
        rating: 'caution',
        notes: 'Parabens are approved for use in cosmetics, but some parents prefer paraben-free products for children. The safety debate continues, though they\'re used at very low concentrations.'
      }
    };
  }
  
  return {
    category: 'Cosmetic Ingredient',
    description: 'A functional ingredient in the product formulation.',
    whatItDoes: 'Contributes to the product\'s effectiveness, texture, or stability.',
    childSafety: {
      rating: 'safe',
      notes: 'Generally considered safe for use in cosmetic products.'
    }
  };
}
