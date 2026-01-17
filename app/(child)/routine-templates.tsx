import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Sparkles, Droplets, Shield } from 'lucide-react-native';
import { colors } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { templateStyles as styles } from '../../src/styles/child/routine-templates-styles';

interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  age_band: string;
  skin_type: string;
  step_count?: number;
}

interface TemplateStep {
  segment: string;
  step_type: string;
  title: string;
  description: string;
  is_required: boolean;
}

export default function RoutineTemplatesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateSteps, setTemplateSteps] = useState<TemplateStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [childProfile, setChildProfile] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    if (!user?.id) return;

    try {
      // Get child profile
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id, age_band, skin_type')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        Alert.alert('Error', 'Child profile not found');
        return;
      }

      setChildProfile(profile);

      // Get templates matching age band and skin type
      const { data: templatesData, error } = await supabase
        .from('routine_templates')
        .select(`
          id,
          name,
          description,
          age_band,
          skin_type,
          routine_template_steps(count)
        `)
        .eq('age_band', profile.age_band || '10-12')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Format templates with step count
      const formattedTemplates = templatesData.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        age_band: t.age_band,
        skin_type: t.skin_type,
        step_count: t.routine_template_steps?.[0]?.count || 0,
      }));

      setTemplates(formattedTemplates);

      // Auto-select first matching template
      if (formattedTemplates.length > 0) {
        const matchingSkinType = formattedTemplates.find(
          (t) => t.skin_type === profile.skin_type
        );
        const defaultTemplate = matchingSkinType || formattedTemplates[0];
        setSelectedTemplate(defaultTemplate.id);
        loadTemplateSteps(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load routine templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateSteps = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('routine_template_steps')
        .select('segment, step_type, title, description, is_required')
        .eq('template_id', templateId)
        .order('segment')
        .order('step_order');

      if (error) throw error;
      setTemplateSteps(data || []);
    } catch (error) {
      console.error('Error loading template steps:', error);
    }
  };

  const createRoutineFromTemplate = async () => {
    if (!selectedTemplate || !childProfile) return;

    setCreating(true);
    try {
      // Create child routine
      const { data: routine, error: routineError } = await supabase
        .from('child_routines')
        .insert({
          child_profile_id: childProfile.id,
          template_id: selectedTemplate,
          name: 'My Skincare Routine',
          is_active: true,
          parent_approved: false,
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Get template steps
      const { data: templateSteps, error: stepsError } = await supabase
        .from('routine_template_steps')
        .select('*')
        .eq('template_id', selectedTemplate)
        .order('step_order');

      if (stepsError) throw stepsError;

      // Create routine steps from template
      const routineSteps = templateSteps.map((step: any) => ({
        routine_id: routine.id,
        segment: step.segment,
        step_order: step.step_order,
        step_type: step.step_type,
        title: step.title,
        notes: step.description,
        parent_approved: false,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('routine_steps')
        .insert(routineSteps);

      if (insertError) throw insertError;

      Alert.alert(
        'Success! 🎉',
        'Your routine has been created! Time to start your skincare journey.',
        [
          {
            text: 'Let\'s Go!',
            onPress: () => router.replace('/(child)/routine'),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getTemplateIcon = (skinType: string) => {
    switch (skinType) {
      case 'dry':
        return Droplets;
      case 'sensitive':
        return Shield;
      default:
        return Sparkles;
    }
  };

  const groupStepsBySegment = () => {
    const grouped: Record<string, TemplateStep[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    templateSteps.forEach((step) => {
      if (grouped[step.segment]) {
        grouped[step.segment].push(step);
      }
    });

    return grouped;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading templates...</Text>
      </SafeAreaView>
    );
  }

  const groupedSteps = groupStepsBySegment();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Routine</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introEmoji}>✨</Text>
          <Text style={styles.introTitle}>Let's build your perfect routine!</Text>
          <Text style={styles.introText}>
            Choose a template that matches your skin type. You can customize it later!
          </Text>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          {templates.map((template) => {
            const Icon = getTemplateIcon(template.skin_type);
            const isSelected = selectedTemplate === template.id;
            const isRecommended = template.skin_type === childProfile?.skin_type;

            return (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  isSelected && styles.templateCardSelected,
                ]}
                onPress={() => {
                  setSelectedTemplate(template.id);
                  loadTemplateSteps(template.id);
                }}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateIconContainer}>
                    <Icon size={24} color={isSelected ? colors.white : colors.purple} />
                  </View>
                  <View style={styles.templateInfo}>
                    <View style={styles.templateTitleRow}>
                      <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                        {template.name}
                      </Text>
                      {isRecommended && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.templateDescription, isSelected && styles.templateDescriptionSelected]}>
                      {template.description}
                    </Text>
                    <Text style={[styles.templateSteps, isSelected && styles.templateStepsSelected]}>
                      {template.step_count} steps
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Check size={20} color={colors.white} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview Steps */}
        {selectedTemplate && templateSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>

            {Object.entries(groupedSteps).map(([segment, steps]) => {
              if (steps.length === 0) return null;
              return (
                <View key={segment} style={styles.segmentGroup}>
                  <Text style={styles.segmentTitle}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)} Routine
                  </Text>
                  {steps.map((step, index) => (
                    <View key={index} style={styles.stepPreview}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.stepPreviewInfo}>
                        <Text style={styles.stepPreviewTitle}>{step.title}</Text>
                        <Text style={styles.stepPreviewDescription}>{step.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={createRoutineFromTemplate}
          disabled={creating || !selectedTemplate}
        >
          <Text style={styles.createButtonText}>
            {creating ? 'Creating...' : 'Create My Routine'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/(child)/routine')}
        >
          <Text style={styles.skipButtonText}>I'll build my own later</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
