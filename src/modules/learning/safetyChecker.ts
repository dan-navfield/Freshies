/**
 * Learn Content Pipeline - Safety Checker
 * Validates content for safety, tone, and compliance
 */

import { LearnArticle, SafetyCheckResult, SafetyIssue, SafetyWarning } from './types';

// ============================================================================
// Safety Check Patterns
// ============================================================================

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\b(diagnose|diagnosis|treat|treatment|cure|cures|curing)\b/i,
  /\byou (have|need|must|should) see a doctor\b/i,
  /\bthis (is|indicates|means) (a )?(serious|medical) (condition|disease)\b/i,
  /\b(prescribe|prescription|medication)\b/i,
];

const ABSOLUTE_CLAIM_PATTERNS = [
  /\b(will|always|never|must|guaranteed|definitely) (cause|prevent|cure|fix|solve)\b/i,
  /\ball (children|kids|people) (will|should|must)\b/i,
  /\bthis (will|always) (work|help)\b/i,
  /\b(completely|totally|absolutely) (safe|effective|harmless)\b/i,
];

const AMERICAN_ENGLISH_PATTERNS = [
  /\b(moisturizer|color|flavor|center|fiber|analyze)\b/i,
];

const COMPLEX_MEDICAL_TERMS = [
  /\b(dermatological|epidermal|subcutaneous|pathological)\b/i,
  /\b(etiology|pathogenesis|prognosis)\b/i,
];

const REQUIRED_DISCLAIMER_PHRASES = [
  'general guidance',
  'consult',
  'healthcare professional',
];

// ============================================================================
// Main Safety Check Function
// ============================================================================

/**
 * Perform comprehensive safety check on article
 */
export function checkContentSafety(article: Partial<LearnArticle>): SafetyCheckResult {
  const issues: SafetyIssue[] = [];
  const warnings: SafetyWarning[] = [];

  // Combine all text for checking
  const allText = [
    article.title || '',
    article.summary || '',
    ...(article.body_sections?.map(s => s.content) || []),
    ...(article.faqs?.map(f => f.answer) || []),
  ].join(' ');

  // Check 1: Medical Diagnosis Language
  const medicalIssues = checkMedicalDiagnosis(allText);
  issues.push(...medicalIssues);

  // Check 2: Absolute Claims
  const absoluteWarnings = checkAbsoluteClaims(allText);
  warnings.push(...absoluteWarnings);

  // Check 3: Disclaimer
  const disclaimerIssues = checkDisclaimer(article.disclaimer || '');
  issues.push(...disclaimerIssues);

  // Check 4: Australian English
  const englishWarnings = checkAustralianEnglish(allText);
  warnings.push(...englishWarnings);

  // Check 5: Reading Level
  const complexityWarnings = checkReadingLevel(allText);
  warnings.push(...complexityWarnings);

  // Check 6: Age Appropriateness
  if (article.age_bands && article.age_bands.length === 0) {
    warnings.push({
      type: 'missing_age_context',
      description: 'No age bands specified',
      suggestion: 'Consider adding age-specific guidance',
    });
  }

  // Calculate overall safety score (0-100)
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  
  let score = 100;
  score -= criticalIssues * 30;
  score -= highIssues * 15;
  score -= mediumIssues * 5;
  score -= warnings.length * 2;
  score = Math.max(0, score);

  return {
    passed: issues.length === 0,
    issues,
    warnings,
    score,
  };
}

// ============================================================================
// Individual Check Functions
// ============================================================================

/**
 * Check for medical diagnosis language
 */
function checkMedicalDiagnosis(text: string): SafetyIssue[] {
  const issues: SafetyIssue[] = [];

  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      issues.push({
        type: 'medical_diagnosis',
        description: `Contains medical diagnosis language: "${matches[0]}"`,
        severity: 'critical',
        location: matches[0],
      });
    }
  }

  return issues;
}

/**
 * Check for absolute claims
 */
function checkAbsoluteClaims(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      warnings.push({
        type: 'absolute_claim',
        description: `Contains absolute claim: "${matches[0]}"`,
        suggestion: 'Use softer language like "may", "can", "might help"',
      });
    }
  }

  return warnings;
}

/**
 * Check disclaimer is present and appropriate
 */
function checkDisclaimer(disclaimer: string): SafetyIssue[] {
  const issues: SafetyIssue[] = [];

  if (!disclaimer || disclaimer.length < 20) {
    issues.push({
      type: 'missing_disclaimer',
      description: 'Disclaimer is missing or too short',
      severity: 'critical',
    });
    return issues;
  }

  // Check for required phrases
  const lowerDisclaimer = disclaimer.toLowerCase();
  for (const phrase of REQUIRED_DISCLAIMER_PHRASES) {
    if (!lowerDisclaimer.includes(phrase)) {
      issues.push({
        type: 'missing_disclaimer',
        description: `Disclaimer missing required phrase: "${phrase}"`,
        severity: 'high',
      });
    }
  }

  return issues;
}

/**
 * Check for Australian English
 */
function checkAustralianEnglish(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  for (const pattern of AMERICAN_ENGLISH_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      const american = matches[0];
      const australian = convertToAustralianEnglish(american);
      
      warnings.push({
        type: 'non_australian_english',
        description: `American spelling detected: "${american}"`,
        suggestion: `Use Australian spelling: "${australian}"`,
      });
    }
  }

  return warnings;
}

/**
 * Check reading level complexity
 */
function checkReadingLevel(text: string): SafetyWarning[] {
  const warnings: SafetyWarning[] = [];

  for (const pattern of COMPLEX_MEDICAL_TERMS) {
    const matches = text.match(pattern);
    if (matches) {
      warnings.push({
        type: 'complex_language',
        description: `Complex medical term: "${matches[0]}"`,
        suggestion: 'Consider using simpler language for Year 7-8 reading level',
      });
    }
  }

  // Check average sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  if (avgWords > 25) {
    warnings.push({
      type: 'complex_language',
      description: `Average sentence length is ${avgWords.toFixed(1)} words`,
      suggestion: 'Aim for 15-20 words per sentence for better readability',
    });
  }

  return warnings;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert American English to Australian English
 */
function convertToAustralianEnglish(word: string): string {
  const conversions: Record<string, string> = {
    'moisturizer': 'moisturiser',
    'color': 'colour',
    'flavor': 'flavour',
    'center': 'centre',
    'fiber': 'fibre',
    'analyze': 'analyse',
  };

  return conversions[word.toLowerCase()] || word;
}

/**
 * Generate safety report summary
 */
export function generateSafetyReport(result: SafetyCheckResult): string {
  const lines: string[] = [];
  
  lines.push(`Safety Score: ${result.score}/100`);
  lines.push(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('ISSUES:');
    result.issues.forEach((issue, i) => {
      lines.push(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach((warning, i) => {
      lines.push(`${i + 1}. ${warning.description}`);
      if (warning.suggestion) {
        lines.push(`   Suggestion: ${warning.suggestion}`);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Auto-fix common issues
 */
export function autoFixContent(text: string): {
  fixed: string;
  changes: string[];
} {
  let fixed = text;
  const changes: string[] = [];

  // Fix American English
  const americanToAustralian: Record<string, string> = {
    'moisturizer': 'moisturiser',
    'color': 'colour',
    'flavor': 'flavour',
    'center': 'centre',
    'fiber': 'fibre',
    'analyze': 'analyse',
  };

  for (const [american, australian] of Object.entries(americanToAustralian)) {
    const regex = new RegExp(`\\b${american}\\b`, 'gi');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, australian);
      changes.push(`Changed "${american}" to "${australian}"`);
    }
  }

  // Soften absolute claims
  const absoluteReplacements: Record<string, string> = {
    'will cause': 'may cause',
    'will prevent': 'may help prevent',
    'will cure': 'may help with',
    'always works': 'often works',
    'never fails': 'is generally effective',
    'must use': 'should consider using',
  };

  for (const [absolute, softened] of Object.entries(absoluteReplacements)) {
    const regex = new RegExp(absolute, 'gi');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, softened);
      changes.push(`Softened "${absolute}" to "${softened}"`);
    }
  }

  return { fixed, changes };
}
