/**
 * Learn Content Pipeline - Type Definitions
 * AI-powered content ingestion and transformation for Freshies Learn area
 */

// ============================================================================
// Core Types
// ============================================================================

export type LearnTopic = 
  | 'skin-basics'
  | 'ingredients'
  | 'products'
  | 'routines'
  | 'safety'
  | 'mental-health';

export type AgeBand = '5-8' | '9-12' | '13-16';

export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived';

export type FetchStatus = 'success' | 'failed';

// ============================================================================
// Article Schema
// ============================================================================

export interface LearnArticle {
  id: string;
  title: string;
  summary: string; // 5 bullet points as markdown list
  body_sections: ArticleSection[];
  faqs: FAQ[];
  topic: LearnTopic;
  secondary_topics: LearnTopic[];
  tags: string[];
  age_bands: AgeBand[];
  source_url: string;
  source_name: string;
  last_synced_at: Date;
  llm_version: string; // e.g., "gpt-4-turbo-2024-04-09"
  llm_provider: 'openai' | 'claude';
  disclaimer: string;
  status: ArticleStatus;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
  view_count: number;
  save_count: number;
}

export interface ArticleSection {
  heading: string;
  content: string; // Markdown formatted
  order: number;
}

export interface FAQ {
  question: string;
  answer: string;
  order: number;
}

// ============================================================================
// Source Snapshot Schema
// ============================================================================

export interface SourceSnapshot {
  id: string;
  source_url: string;
  source_name: string;
  source_type: SourceType;
  raw_text: string;
  raw_html?: string;
  hash_of_text: string;
  processed_at: Date;
  fetch_status: FetchStatus;
  error_message?: string;
  metadata: SourceMetadata;
}

export interface SourceMetadata {
  title?: string;
  author?: string;
  publication_date?: Date;
  last_modified?: Date;
  content_type?: string;
}

export type SourceType = 
  | 'dermnetnz'
  | 'rch'
  | 'rcn'
  | 'acd'
  | 'better-health'
  | 'cosing'
  | 'cosmile'
  | 'aicis'
  | 'journalism'
  | 'other';

// ============================================================================
// Content Source Configuration
// ============================================================================

export interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  topic: LearnTopic;
  enabled: boolean;
  fetch_frequency: 'daily' | 'weekly' | 'monthly';
  last_fetched?: Date;
  next_fetch?: Date;
  selector_config?: SelectorConfig; // For HTML parsing
}

export interface SelectorConfig {
  title_selector: string;
  content_selector: string;
  exclude_selectors: string[];
  date_selector?: string;
  author_selector?: string;
}

// ============================================================================
// AI Tool Inputs/Outputs
// ============================================================================

// Tool 1: Summarise Source Content
export interface SummariseInput {
  source_text: string;
  source_url: string;
  source_name: string;
  topic: LearnTopic;
  target_reading_level: 'Year 7-8';
  needs_age_banding: boolean;
}

export interface SummariseOutput {
  title: string;
  summary: string[]; // 5 bullet points
  body_sections: Omit<ArticleSection, 'order'>[];
  age_bands: AgeBand[];
  disclaimer: string;
}

// Tool 2: Rewrite for Parents
export interface RewriteInput {
  draft_text: string;
  tone: 'warm, balanced, reassuring';
  australian_english: true;
  avoid_medical_language: true;
}

export interface RewriteOutput {
  rewritten_text: string;
  changes_made: string[];
  tone_score: number; // 1-10, how well it matches target tone
}

// Tool 3: Extract FAQs
export interface ExtractQAsInput {
  article_text: string;
  topic: LearnTopic;
  max_questions: number;
  age_context?: AgeBand;
}

export interface ExtractQAsOutput {
  faqs: Omit<FAQ, 'order'>[];
}

// Tool 4: Classify Article
export interface ClassifyInput {
  article_text: string;
  article_title: string;
  allowed_topics: LearnTopic[];
}

export interface ClassifyOutput {
  primary_topic: LearnTopic;
  secondary_topics: LearnTopic[];
  suggested_tags: string[];
  confidence_score: number; // 0-1
}

// ============================================================================
// Pipeline Processing
// ============================================================================

export interface FetchResult {
  source_url: string;
  source_name: string;
  source_type: SourceType;
  raw_text: string;
  raw_html?: string;
  title: string;
  publication_date?: Date;
  author?: string;
  success: boolean;
  error?: string;
}

export interface ParsedContent {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  metadata: {
    source: string;
    source_type: SourceType;
    date?: Date;
    author?: string;
  };
}

export interface TransformResult {
  article: Omit<LearnArticle, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'save_count'>;
  safety_check: SafetyCheckResult;
  processing_time_ms: number;
}

export interface SafetyCheckResult {
  passed: boolean;
  issues: SafetyIssue[];
  warnings: SafetyWarning[];
  score: number; // 0-100
}

export interface SafetyIssue {
  type: 'medical_diagnosis' | 'absolute_claim' | 'missing_disclaimer' | 'inappropriate_content';
  description: string;
  severity: 'critical' | 'high' | 'medium';
  location?: string; // Section or line reference
}

export interface SafetyWarning {
  type: 'non_australian_english' | 'complex_language' | 'missing_age_context' | 'weak_source' | 'absolute_claim';
  description: string;
  suggestion?: string;
}

// ============================================================================
// Sync Job Configuration
// ============================================================================

export interface SyncJobConfig {
  job_id: string;
  name: string;
  sources: string[]; // ContentSource IDs
  schedule: string; // Cron expression
  enabled: boolean;
  last_run?: Date;
  next_run?: Date;
  status: 'idle' | 'running' | 'failed';
}

export interface SyncJobResult {
  job_id: string;
  started_at: Date;
  completed_at: Date;
  sources_processed: number;
  articles_created: number;
  articles_updated: number;
  errors: SyncError[];
  success: boolean;
}

export interface SyncError {
  source_url: string;
  error_type: 'fetch_failed' | 'parse_failed' | 'transform_failed' | 'safety_failed';
  error_message: string;
  timestamp: Date;
}

// ============================================================================
// Review Workflow
// ============================================================================

export interface ReviewTask {
  id: string;
  article_id: string;
  article: LearnArticle;
  original_source: SourceSnapshot;
  assigned_to?: string;
  created_at: Date;
  due_date?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  checklist: ReviewChecklistItem[];
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  required: boolean;
}

export interface ReviewDecision {
  task_id: string;
  decision: 'approve' | 'reject' | 'request_changes';
  notes: string;
  reviewer_id: string;
  reviewed_at: Date;
  changes_requested?: string[];
}

// ============================================================================
// Analytics & Metrics
// ============================================================================

export interface ContentMetrics {
  total_articles: number;
  by_status: Record<ArticleStatus, number>;
  by_topic: Record<LearnTopic, number>;
  total_views: number;
  total_saves: number;
  avg_reading_time_seconds: number;
  most_viewed: LearnArticle[];
  most_saved: LearnArticle[];
  stale_articles: LearnArticle[]; // > 6 months old
}

export interface SourceMetrics {
  source_name: string;
  total_fetches: number;
  successful_fetches: number;
  failed_fetches: number;
  articles_generated: number;
  avg_processing_time_ms: number;
  last_fetch_date?: Date;
  reliability_score: number; // 0-100
}
