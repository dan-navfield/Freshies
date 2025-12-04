/**
 * Learn Content Sync API
 * POST /api/learn/sync - Trigger manual content sync
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_ids, job_type = 'manual' } = body;

    // TODO: Implement actual sync
    // import { runSyncJob } from '@/src/services/learn/pipelineOrchestrator';
    // const result = await runSyncJob(`manual-sync-${Date.now()}`, source_ids);

    const mockResult = {
      job_id: `manual-sync-${Date.now()}`,
      started_at: new Date().toISOString(),
      completed_at: new Date(Date.now() + 60000).toISOString(),
      sources_processed: source_ids?.length || 5,
      articles_created: 3,
      articles_updated: 1,
      errors: [],
      success: true,
    };

    return Response.json(mockResult);

  } catch (error) {
    console.error('Error running sync:', error);
    return Response.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learn/sync - Get sync status
 */
export async function GET() {
  try {
    // TODO: Get actual pipeline status
    // import { getPipelineStatus } from '@/src/services/learn/pipelineOrchestrator';
    // const status = await getPipelineStatus();

    const mockStatus = {
      enabled_sources: 20,
      pending_reviews: 5,
      published_articles: 45,
      last_sync: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      next_sync: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    };

    return Response.json(mockStatus);

  } catch (error) {
    console.error('Error getting sync status:', error);
    return Response.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
