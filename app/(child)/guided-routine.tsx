import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Sparkles, Clock, Check } from 'lucide-react-native';
import { colors, spacing, radii } from '../../src/theme/tokens';
import { useChildProfile } from '../../src/contexts/ChildProfileContext';
import {
  startGuidedRoutine,
  processGoals,
  processConcerns,
  generateRoutineSuggestions,
  askFollowUp,
  ROUTINE_GOALS,
  GuidedRoutineState,
  SuggestedStep,
  RoutineGoal
} from '../../src/services/ai/guidedRoutineService';

type Segment = 'morning' | 'afternoon' | 'evening';

const SKIN_CONCERNS = [
  { id: 'dry', label: 'Dry or flaky', emoji: '🏜️' },
  { id: 'oily', label: 'Oily or shiny', emoji: '✨' },
  { id: 'sensitive', label: 'Sensitive', emoji: '🌸' },
  { id: 'acne', label: 'Acne-prone', emoji: '🎯' },
  { id: 'none', label: 'Feels pretty good!', emoji: '😊' }
];

const TIME_OPTIONS = [
  { minutes: 3, label: 'Quick', emoji: '⚡', description: '2-3 minutes' },
  { minutes: 6, label: 'Normal', emoji: '✨', description: '5-7 minutes' },
  { minutes: 12, label: 'Thorough', emoji: '🌟', description: '10+ minutes' }
];

export default function GuidedRoutineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { childProfile } = useChildProfile();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const segment = (params.segment as Segment) || 'morning';
  const existingRoutineId = params.routineId as string;
  const existingRoutineName = params.routineName as string;
  
  const [state, setState] = useState<GuidedRoutineState | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeRoutine();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state?.conversationHistory]);

  const initializeRoutine = async () => {
    if (!childProfile) {
      console.log('No child profile available');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Starting guided routine for segment:', segment);
      const { message, state: newState } = await startGuidedRoutine(segment, childProfile);
      console.log('Got state:', newState);
      setState(newState);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error starting guided routine:', error);
      // Show error to user
      setState({
        segment,
        currentStep: 'goals',
        goals: [],
        concerns: [],
        availableTime: 0,
        suggestedSteps: [],
        conversationHistory: [
          {
            role: 'assistant',
            content: `Oops! Something went wrong. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleGoalsSubmit = async () => {
    if (!state || !childProfile || selectedGoals.length === 0) return;
    
    setLoading(true);
    try {
      const { message, state: newState } = await processGoals(state, selectedGoals);
      setState(newState);
    } catch (error) {
      console.error('Error processing goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConcernToggle = (concernId: string) => {
    if (concernId === 'none') {
      setSelectedConcerns(['none']);
    } else {
      setSelectedConcerns(prev => {
        const filtered = prev.filter(id => id !== 'none');
        return filtered.includes(concernId)
          ? filtered.filter(id => id !== concernId)
          : [...filtered, concernId];
      });
    }
  };

  const handleConcernsSubmit = async () => {
    if (!state || !childProfile) return;
    
    setLoading(true);
    try {
      const concerns = selectedConcerns.filter(id => id !== 'none')
        .map(id => SKIN_CONCERNS.find(c => c.id === id)?.label || id);
      const { message, state: newState } = await processConcerns(state, concerns);
      setState(newState);
    } catch (error) {
      console.error('Error processing concerns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = async (minutes: number) => {
    if (!state || !childProfile) return;
    
    setLoading(true);
    try {
      const { message, steps, state: newState } = await generateRoutineSuggestions(
        state,
        minutes,
        childProfile
      );
      setState(newState);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!state || !childProfile || !userInput.trim()) return;
    
    const message = userInput.trim();
    setUserInput('');
    setLoading(true);
    
    try {
      const { message: response, state: newState } = await askFollowUp(
        state,
        message,
        childProfile
      );
      setState(newState);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBuilding = () => {
    if (!state) return;
    
    // Navigate back to routine builder with suggested steps
    // If we came from an existing routine, return to it; otherwise create new
    router.push({
      pathname: '/(child)/routine-builder-enhanced',
      params: {
        segment,
        suggestedSteps: JSON.stringify(state.suggestedSteps),
        routineId: existingRoutineId || '',
        routineName: existingRoutineName || ''
      }
    });
  };

  const renderGoalSelection = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.optionsGrid}>
        {ROUTINE_GOALS.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.optionCard,
              selectedGoals.includes(goal.id) && styles.optionCardSelected
            ]}
            onPress={() => handleGoalToggle(goal.id)}
          >
            <Text style={styles.optionEmoji}>{goal.emoji}</Text>
            <Text style={[
              styles.optionLabel,
              selectedGoals.includes(goal.id) && styles.optionLabelSelected
            ]}>
              {goal.label}
            </Text>
            {selectedGoals.includes(goal.id) && (
              <View style={styles.checkBadge}>
                <Check size={16} color={colors.white} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[
          styles.continueButton,
          selectedGoals.length === 0 && styles.continueButtonDisabled
        ]}
        onPress={handleGoalsSubmit}
        disabled={selectedGoals.length === 0 || loading}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <Sparkles size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderConcernSelection = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.optionsGrid}>
        {SKIN_CONCERNS.map(concern => (
          <TouchableOpacity
            key={concern.id}
            style={[
              styles.optionCard,
              selectedConcerns.includes(concern.id) && styles.optionCardSelected
            ]}
            onPress={() => handleConcernToggle(concern.id)}
          >
            <Text style={styles.optionEmoji}>{concern.emoji}</Text>
            <Text style={[
              styles.optionLabel,
              selectedConcerns.includes(concern.id) && styles.optionLabelSelected
            ]}>
              {concern.label}
            </Text>
            {selectedConcerns.includes(concern.id) && (
              <View style={styles.checkBadge}>
                <Check size={16} color={colors.white} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            setSelectedConcerns([]);
            handleConcernsSubmit();
          }}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.continueButton, { flex: 1 }]}
          onPress={handleConcernsSubmit}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Sparkles size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeSelection = () => (
    <View style={styles.selectionContainer}>
      <View style={styles.timeOptionsContainer}>
        {TIME_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.minutes}
            style={styles.timeOption}
            onPress={() => handleTimeSelect(option.minutes)}
            disabled={loading}
          >
            <Text style={styles.timeEmoji}>{option.emoji}</Text>
            <Text style={styles.timeLabel}>{option.label}</Text>
            <Text style={styles.timeDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSuggestedSteps = () => (
    <View style={styles.stepsContainer}>
      {state?.suggestedSteps.map((step, index) => (
        <View key={index} style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>{index + 1}</Text>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <View style={styles.stepMeta}>
                <Clock size={14} color={colors.charcoal} />
                <Text style={styles.stepDuration}>{step.duration}s</Text>
              </View>
            </View>
          </View>
          <Text style={styles.stepReasoning}>{step.reasoning}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={styles.startBuildingButton}
        onPress={handleStartBuilding}
      >
        <Sparkles size={20} color={colors.white} />
        <Text style={styles.startBuildingText}>Start Building</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !state) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.loadingText}>Setting up your guided routine...</Text>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No state available. Please try again.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: colors.white + '20', borderRadius: 8 }}>
          <Text style={{ color: colors.white }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guided Routine</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationScroll}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {state?.conversationHistory.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.role === 'user' && styles.userMessageText
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Interactive selections based on current step */}
          {state?.currentStep === 'goals' && renderGoalSelection()}
          {state?.currentStep === 'concerns' && renderConcernSelection()}
          {state?.currentStep === 'time' && renderTimeSelection()}
          {state?.currentStep === 'review' && renderSuggestedSteps()}

          {loading && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={colors.purple} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Input (for follow-up questions) */}
      {state?.currentStep === 'review' && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.charcoal + '60'}
            value={userInput}
            onChangeText={setUserInput}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !userInput.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!userInput.trim() || loading}
          >
            <Send size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.purple,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.purple,
  },
  loadingText: {
    marginTop: spacing[4],
    color: colors.white,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.purple,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  conversationScroll: {
    flex: 1,
    backgroundColor: colors.purple,
  },
  conversationContent: {
    padding: spacing[4],
    paddingBottom: 120,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[3],
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white + '20',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  userMessageText: {
    color: colors.purple,
  },
  selectionContainer: {
    marginTop: spacing[4],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  optionCard: {
    width: '47%',
    backgroundColor: colors.white + '20',
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: colors.white,
    borderColor: colors.mint,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: colors.purple,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.full,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  skipButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.white + '40',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  timeOptionsContainer: {
    gap: spacing[3],
  },
  timeOption: {
    backgroundColor: colors.white + '20',
    borderRadius: radii.lg,
    padding: spacing[5],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeEmoji: {
    fontSize: 40,
    marginBottom: spacing[2],
  },
  timeLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[1],
  },
  timeDescription: {
    fontSize: 14,
    color: colors.white + '80',
  },
  stepsContainer: {
    marginTop: spacing[4],
    gap: spacing[3],
  },
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.purple,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: spacing[3],
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.purple,
    marginBottom: spacing[1],
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  stepDuration: {
    fontSize: 14,
    color: colors.charcoal,
    opacity: 0.7,
  },
  stepReasoning: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.charcoal,
    marginLeft: 44,
  },
  startBuildingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.mint,
    paddingVertical: spacing[4],
    borderRadius: radii.full,
    marginTop: spacing[2],
  },
  startBuildingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'flex-start',
    backgroundColor: colors.white + '20',
    padding: spacing[3],
    borderRadius: radii.lg,
    marginTop: spacing[2],
  },
  typingText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.purple,
    borderTopWidth: 1,
    borderTopColor: colors.white + '20',
  },
  input: {
    flex: 1,
    backgroundColor: colors.white + '20',
    borderRadius: radii.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.white,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
