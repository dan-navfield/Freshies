/**
 * Activity Timeline Service
 * Handles activity tracking, retrieval, and statistics
 */

import { supabase } from '../lib/supabase';
import { 
  Activity, 
  ActivityWithChild, 
  ActivityGroup,
  ActivityStats,
  ActivityFilter 
} from '../types/activity';

/**
 * Get activities for a parent (all children)
 */
export async function getParentActivities(
  parentId: string,
  filter?: ActivityFilter,
  limit: number = 50
): Promise<ActivityWithChild[]> {
  try {
    let query = supabase
      .from('child_activities')
      .select(`
        *,
        children (
          first_name,
          age,
          avatar_url,
          parent_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (filter?.child_id) {
      query = query.eq('child_id', filter.child_id);
    }
    if (filter?.category) {
      query = query.eq('category', filter.category);
    }
    if (filter?.activity_type) {
      query = query.eq('activity_type', filter.activity_type);
    }
    if (filter?.date_from) {
      query = query.gte('created_at', filter.date_from);
    }
    if (filter?.date_to) {
      query = query.lte('created_at', filter.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by parent_id (RLS should handle this, but double-check)
    return (data || [])
      .filter((activity: any) => activity.children?.parent_id === parentId)
      .map((activity: any) => ({
        ...activity,
        child_name: activity.children?.first_name || 'Unknown',
        child_age: activity.children?.age || 0,
        child_avatar_url: activity.children?.avatar_url,
      }));
  } catch (error) {
    console.error('Error fetching parent activities:', error);
    return [];
  }
}

/**
 * Get activities for a specific child
 */
export async function getChildActivities(
  childId: string,
  limit: number = 50
): Promise<ActivityWithChild[]> {
  try {
    const { data, error } = await supabase
      .from('child_activities')
      .select(`
        *,
        children (
          first_name,
          age,
          avatar_url
        )
      `)
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((activity: any) => ({
      ...activity,
      child_name: activity.children?.first_name || 'Unknown',
      child_age: activity.children?.age || 0,
      child_avatar_url: activity.children?.avatar_url,
    }));
  } catch (error) {
    console.error('Error fetching child activities:', error);
    return [];
  }
}

/**
 * Group activities by date
 */
export function groupActivitiesByDate(activities: ActivityWithChild[]): ActivityGroup[] {
  const groups: Record<string, ActivityWithChild[]> = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });

  return Object.entries(groups).map(([date, activities]) => ({
    date,
    display_date: formatDisplayDate(date),
    activities,
    count: activities.length,
  })).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Format date for display
 */
function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateKey = date.toISOString().split('T')[0];
  const todayKey = today.toISOString().split('T')[0];
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  // Format as "Jan 15" or "Jan 15, 2024" if not current year
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get activity statistics for parent dashboard
 */
export async function getActivityStats(parentId: string): Promise<ActivityStats> {
  try {
    const { data, error } = await supabase.rpc('get_parent_activity_stats', {
      p_parent_id: parentId
    });

    if (error) throw error;

    const stats: ActivityStats = {
      total_today: 0,
      total_week: 0,
      by_child: {},
      by_category: {
        product: 0,
        routine: 0,
        learning: 0,
        approval: 0,
        profile: 0,
      },
    };

    if (data && data.length > 0) {
      stats.total_today = Number(data[0].total_today) || 0;
      stats.total_week = Number(data[0].total_week) || 0;

      let maxCount = 0;
      data.forEach((row: any) => {
        const childCount = Number(row.child_count) || 0;
        stats.by_child[row.child_id] = childCount;
        
        if (childCount > maxCount) {
          maxCount = childCount;
          stats.most_active_child = row.child_name;
        }
      });
    }

    // Get category breakdown
    const { data: categoryData } = await supabase
      .from('child_activities')
      .select('category, children!inner(parent_id)')
      .eq('children.parent_id', parentId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (categoryData) {
      categoryData.forEach((row: any) => {
        if (row.category in stats.by_category) {
          stats.by_category[row.category as keyof typeof stats.by_category]++;
        }
      });
    }

    return stats;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return {
      total_today: 0,
      total_week: 0,
      by_child: {},
      by_category: {
        product: 0,
        routine: 0,
        learning: 0,
        approval: 0,
        profile: 0,
      },
    };
  }
}

/**
 * Create a new activity
 */
export async function createActivity(activity: Omit<Activity, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('child_activities')
      .insert({
        child_id: activity.child_id,
        activity_type: activity.activity_type,
        category: activity.category,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating activity:', error);
    return false;
  }
}

/**
 * Get time ago string
 */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
