/**
 * AI Services - Main Export
 * 
 * This module provides AI-powered analysis and coaching for children's skincare.
 * All tools use MCP (Model Context Protocol) with OpenAI and Claude providers.
 */

// Main service methods
export {
  analyseProductForChild,
  getProductSummaryForParent,
  assessRoutineForChild,
  proposeRoutineForChild,
  coachParent,
  analyseProductComplete,
} from './aiCareService';

// Types
export type {
  ChildProfile,
  ProductData,
  ProductWithFlags,
  ProductFlags,
  AnalyseIngredientsInput,
  AnalyseIngredientsOutput,
  SummariseRiskInput,
  SummariseRiskOutput,
  AssessRoutineInput,
  AssessRoutineOutput,
  ProposeRoutineInput,
  ProposeRoutineOutput,
  CoachParentInput,
  CoachParentOutput,
  AIOptions,
  AIProvider,
  RoutineStep,
  RoutineTimeSlot,
} from './types';

// Constants
export { AI_TOOLS } from './types';
