/**
 * Learn Articles API - Single Article
 * GET /api/learn/articles/[id]
 */

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual Supabase query
    // const article = await getArticleById(id);
    
    const mockArticle = {
      id,
      title: 'Understanding Eczema in Children',
      summary: '• Eczema is common in children\n• It causes dry, itchy skin\n• Most children outgrow it\n• Gentle moisturisers help\n• See a GP if concerned',
      body_sections: [
        {
          heading: 'What is Eczema?',
          content: 'Eczema, also called atopic dermatitis, is a common skin condition that affects many Australian children. It causes patches of skin to become dry, itchy, and inflamed. While it can be uncomfortable, it\'s not contagious and most children outgrow it as they get older.',
          order: 0,
        },
        {
          heading: 'Common Signs and Symptoms',
          content: 'You might notice red, dry patches on your child\'s skin, particularly on the face, hands, feet, or in the creases of elbows and knees. The skin may look scaly or crusty, and your child might scratch frequently, especially at night. Some children develop small bumps that may weep fluid when scratched.',
          order: 1,
        },
        {
          heading: 'Managing Eczema at Home',
          content: 'Regular moisturising is key to managing eczema. Apply a gentle, fragrance-free moisturiser at least twice daily, especially after bathing. Keep baths short and use lukewarm water. Pat skin dry gently and apply moisturiser within three minutes. Choose soft, breathable fabrics like cotton and avoid harsh soaps or detergents.',
          order: 2,
        },
      ],
      faqs: [
        {
          question: 'Will my child outgrow eczema?',
          answer: 'Many children do see improvement as they get older. About half of children with eczema will see it clear up by their teenage years. However, some may continue to have sensitive skin into adulthood.',
          order: 0,
        },
        {
          question: 'Can certain foods trigger eczema?',
          answer: 'While food allergies can sometimes worsen eczema, they\'re not the cause. If you suspect a food trigger, chat with your GP before making dietary changes. Removing foods without guidance can affect your child\'s nutrition.',
          order: 1,
        },
        {
          question: 'When should I see a doctor?',
          answer: 'See your GP if the eczema is severe, not responding to moisturisers, showing signs of infection (yellow crusting, weeping), or significantly affecting your child\'s sleep or daily activities.',
          order: 2,
        },
      ],
      topic: 'skin-basics',
      secondary_topics: ['products'],
      tags: ['Eczema', 'Ages 5-8', 'Ages 9-12', 'Dry skin', 'Moisturisers'],
      age_bands: ['5-8', '9-12'],
      source_url: 'https://www.rch.org.au/kidsinfo/fact_sheets/Eczema/',
      source_name: 'Royal Children\'s Hospital Melbourne',
      disclaimer: 'This is general guidance only. For specific concerns about your child\'s skin, please consult a healthcare professional.',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 245,
      save_count: 32,
    };

    // TODO: Increment view count
    // await incrementArticleViewCount(id);

    return Response.json(mockArticle);

  } catch (error) {
    console.error('Error fetching article:', error);
    return Response.json(
      { error: 'Article not found' },
      { status: 404 }
    );
  }
}

/**
 * POST /api/learn/articles/[id] - Record article view
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { user_id, reading_time_seconds } = body;

    // TODO: Record view in database
    // await recordArticleView(id, user_id, reading_time_seconds);

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error recording view:', error);
    return Response.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
