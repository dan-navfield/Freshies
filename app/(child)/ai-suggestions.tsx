import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, Check, X, AlertCircle } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useAuth } from '../../src/contexts/AuthContext';
import { StyleSheet } from 'react-native';
import {
  generateRoutineSuggestions,
  getSuggestionEmoji,
  getPriorityColor,
  type RoutineSuggestion,
} from '../../src/modules/recommendations';
import { supabase } from '../../src/lib/supabase';

export default function AISuggestionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [suggestions, setSuggestions] = useState<RoutineSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from('child_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const aiSuggestions = await generateRoutineSuggestions(profile.id);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestion: RoutineSuggestion) => {
    setApplying(suggestion.id);
    
    // Here you would implement the actual logic to apply the suggestion
    // For now, we'll just simulate it
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Remove the applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    setApplying(null);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
          <Text style={styles.loadingText}>Analyzing your routine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Suggestions</Text>
        <TouchableOpacity onPress={loadSuggestions} style={styles.refreshButton}>
          <Sparkles size={20} color={colors.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introEmoji}>✨</Text>
          <Text style={styles.introTitle}>Personalized for You</Text>
          <Text style={styles.introText}>
            Based on your skin type, concerns, and routine habits, here are some suggestions to make your routine even better!
          </Text>
        </View>

        {/* Suggestions */}
        {suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>You're all set!</Text>
            <Text style={styles.emptyText}>
              Your routine looks great! We'll let you know if we have any new suggestions.
            </Text>
          </View>
        ) : (
          suggestions.map((suggestion) => (
            <View
              key={suggestion.id}
              style={[
                styles.suggestionCard,
                { borderLeftColor: getPriorityColor(suggestion.priority) },
              ]}
            >
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionTitleRow}>
                  <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                  <View style={styles.suggestionTitleContainer}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={styles.badges}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: `${getPriorityColor(suggestion.priority)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: getPriorityColor(suggestion.priority) },
                          ]}
                        >
                          {suggestion.priority.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {suggestion.confidence}% confident
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.suggestionDescription}>
                {suggestion.description}
              </Text>

              <View style={styles.reasoningCard}>
                <AlertCircle size={16} color={colors.purple} />
                <Text style={styles.reasoningText}>{suggestion.reasoning}</Text>
              </View>

              <View style={styles.suggestionActions}>
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    applying === suggestion.id && styles.applyButtonDisabled,
                  ]}
                  onPress={() => applySuggestion(suggestion)}
                  disabled={applying === suggestion.id}
                >
                  {applying === suggestion.id ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Check size={18} color={colors.white} />
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => dismissSuggestion(suggestion.id)}
                  disabled={applying === suggestion.id}
                >
                  <X size={18} color={colors.charcoal} />
                  <Text style={styles.dismissButtonText}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Sparkles size={20} color={colors.purple} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Our AI analyzes your skin profile, routine completion patterns, and seasonal factors to provide personalized suggestions. These recommendations are based on dermatological best practices for your age group.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
  },
  loadingText: {
    fontSize: 16,
    color: colors.charcoal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Intro
  intro: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  introText: {
    fontSize: 14,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoal,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Suggestion Card
  suggestionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionHeader: {
    marginBottom: spacing[3],
  },
  suggestionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  suggestionEmoji: {
    fontSize: 32,
  },
  suggestionTitleContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  badges: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confidenceBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.charcoal,
  },
  suggestionDescription: {
    fontSize: 15,
    color: colors.black,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  reasoningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: 'rgba(139, 122, 184, 0.1)',
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  reasoningText: {
    flex: 1,
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.purple,
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.charcoal,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[5],
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: colors.mist,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 18,
  },
});
