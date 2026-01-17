/**
 * Learn Articles API - List and Search
 * GET /api/learn/articles
 */

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const topic = searchParams.get('topic');
    const status = searchParams.get('status') || 'published';
    const tags = searchParams.get('tags')?.split(',');
    const ageBand = searchParams.get('age_band');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // TODO: Replace with actual Supabase query
    // For now, return mock data
    const mockArticles = [
      {
        id: '1',
        title: 'Understanding Eczema in Children',
        summary: '• Eczema is common in children\n• It causes dry, itchy skin\n• Most children outgrow it\n• Gentle moisturisers help\n• See a GP if concerned',
        topic: 'skin-basics',
        tags: ['Eczema', 'Ages 5-8', 'Ages 9-12', 'Dry skin'],
        age_bands: ['5-8', '9-12'],
        source_name: 'Royal Children\'s Hospital',
        created_at: new Date().toISOString(),
        view_count: 245,
        save_count: 32,
      },
      {
        id: '2',
        title: 'Sunscreen for Kids: What Parents Need to Know',
        summary: '• Use SPF 30+ for children\n• Apply 20 minutes before sun\n• Reapply every 2 hours\n• Choose broad spectrum\n• Check expiry dates',
        topic: 'products',
        tags: ['Sunscreen', 'Sun safety', 'Ages 5-8', 'Ages 9-12'],
        age_bands: ['5-8', '9-12', '13-16'],
        source_name: 'Better Health Channel',
        created_at: new Date().toISOString(),
        view_count: 512,
        save_count: 89,
      },
    ];

    // Apply filters
    let filtered = mockArticles;
    
    if (topic) {
      filtered = filtered.filter(a => a.topic === topic);
    }
    
    if (tags) {
      filtered = filtered.filter(a => 
        tags.some((tag: string) => a.tags.includes(tag))
      );
    }
    
    if (ageBand) {
      filtered = filtered.filter(a => a.age_bands.includes(ageBand));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchLower) ||
        a.summary.toLowerCase().includes(searchLower)
      );
    }

    return Response.json({
      articles: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    return Response.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
