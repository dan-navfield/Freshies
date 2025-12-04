import { supabase } from '../../lib/supabase';

export interface RoutineStepTemplate {
  id: string;
  type: string;
  title: string;
  slug: string;
  icon_name: string;
  color_hex: string;
  description?: string;
  default_duration: number;
  default_instructions: string[];
  tips?: string;
  benefits?: string[];
  recommended_order: number;
  age_appropriate_min: number;
  age_appropriate_max: number;
  skin_types?: string[];
  concerns?: string[];
  time_of_day?: string[];
  generated_by_ai: boolean;
  ai_prompt?: string;
  ai_model?: string;
  is_active: boolean;
  is_featured: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateFilters {
  type?: string;
  age?: number;
  skinType?: string;
  concern?: string;
  timeOfDay?: 'morning' | 'evening' | 'both';
  isFeatured?: boolean;
}

class RoutineTemplateService {
  /**
   * Get all active templates with optional filters
   */
  async getTemplates(filters?: TemplateFilters): Promise<RoutineStepTemplate[]> {
    try {
      let query = supabase
        .from('routine_step_templates')
        .select('*')
        .eq('is_active', true)
        .order('recommended_order', { ascending: true });

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.age) {
        query = query
          .lte('age_appropriate_min', filters.age)
          .gte('age_appropriate_max', filters.age);
      }

      if (filters?.skinType) {
        query = query.contains('skin_types', [filters.skinType]);
      }

      if (filters?.concern) {
        query = query.contains('concerns', [filters.concern]);
      }

      if (filters?.timeOfDay) {
        query = query.contains('time_of_day', [filters.timeOfDay]);
      }

      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<RoutineStepTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Get a template by slug
   */
  async getTemplateBySlug(slug: string): Promise<RoutineStepTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template by slug:', error);
      return null;
    }
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(type: string): Promise<RoutineStepTemplate[]> {
    return this.getTemplates({ type });
  }

  /**
   * Search templates by text
   */
  async searchTemplates(searchTerm: string): Promise<RoutineStepTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .select('*')
        .eq('is_active', true)
        .textSearch('search_vector', searchTerm)
        .order('recommended_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(): Promise<RoutineStepTemplate[]> {
    return this.getTemplates({ isFeatured: true });
  }

  /**
   * Create a new template (admin only)
   */
  async createTemplate(
    template: Omit<RoutineStepTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<RoutineStepTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  /**
   * Update a template (admin only)
   */
  async updateTemplate(
    id: string,
    updates: Partial<RoutineStepTemplate>
  ): Promise<RoutineStepTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  /**
   * Delete a template (soft delete by setting is_active to false)
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('routine_step_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    aiGenerated: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('routine_step_templates')
        .select('type, generated_by_ai')
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        aiGenerated: 0,
      };

      data?.forEach((template) => {
        stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
        if (template.generated_by_ai) {
          stats.aiGenerated++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching template stats:', error);
      return { total: 0, byType: {}, aiGenerated: 0 };
    }
  }
}

export const routineTemplateService = new RoutineTemplateService();
