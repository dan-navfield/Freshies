/**
 * Safety System - Main Export
 * Comprehensive product safety rating system for Freshies
 */

// Main service
export { safetyService, SafetyService } from './safetyService';

// Calculators
export { calculateProductSafety } from './calculator';
export { calculateProfileSafety } from './profileCalculator';

// Types
export * from './types';

// Re-export for convenience
export { safetyService as default } from './safetyService';
