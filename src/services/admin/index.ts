/**
 * Admin Services Index
 * Central export point for all admin management services
 * These services will be called by future Management app API endpoints
 */

// Content Management
export {
  getArticlesByStatus,
  moveToReview,
  publishArticle,
  retireArticle,
  rejectArticle,
  flagArticle,
  unflagArticle,
  getArticleForEdit,
  updateArticleContent,
  deleteArticle,
  bulkPublishArticles,
  bulkRetireArticles,
  getContentStatistics,
  getReviewQueueSummary,
  type ArticleWorkflowResult,
  type ArticleListResult,
} from './contentManagement';

// AI Management
export {
  getAllPromptTemplates,
  getActivePrompt,
  updatePromptTemplate,
  rollbackPrompt,
  getPromptHistory,
  getActiveSafetyPolicy,
  updateSafetyPolicy,
  getAIUsageStats,
  getCommonQueries,
  type AIManagementResult,
} from './aiManagement';

// Feature Management
export {
  getAllFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
  addUserToFeature,
  removeUserFromFeature,
  getFeatureFlagStats,
  type FeatureManagementResult,
} from './featureManagement';
