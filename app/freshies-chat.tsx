import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii } from '../src/theme/tokens';
import { Brain, Send, X, Sparkles, Plus, Camera, Image as ImageIcon, FileText } from 'lucide-react-native';
import { coachParent } from '../src/services/ai/aiCareService';
import { useChatContextStore, getChatContext } from '../src/stores/chatContextStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  keyPoints?: string[];
  suggestedActions?: string[];
  relatedTopics?: string[];
  followUpPrompts?: string[];
}

const SUGGESTED_QUESTIONS = [
  "What's a good starter routine for my 10-year-old?",
  "Is retinol safe for teens?",
  "How do I know if a product is too harsh?",
  "What ingredients should I avoid for sensitive skin?",
];

export default function FreshiesChatScreen() {
  const params = useLocalSearchParams();
  const autoSubmitQuestion = params.autoSubmit as string | undefined;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm FreshiesAI, here to help you navigate kids' skincare. Ask me anything about ingredients, routines, or products for your child.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastMessageRef = useRef<View>(null);
  const [scrollToLastMessage, setScrollToLastMessage] = useState(false);

  // Get context from store
  const { 
    activeChildProfile, 
    lastScannedProduct,
    currentRoutineProducts,
    addMessage 
  } = useChatContextStore();

  // Use active child profile or create a default one
  const childProfile = activeChildProfile || {
    name: 'Child',
    age_years: 10,
    has_eczema: false,
    known_allergies: [],
  };

  useEffect(() => {
    // Trigger scroll after messages update
    if (messages.length > 1) {
      setScrollToLastMessage(true);
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to show the start of the last message
    if (scrollToLastMessage && lastMessageRef.current) {
      setTimeout(() => {
        lastMessageRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => {
            // Fallback to scrollToEnd if measure fails
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
        setScrollToLastMessage(false);
      }, 300);
    }
  }, [scrollToLastMessage]);

  // Auto-submit question if provided via navigation params
  useEffect(() => {
    if (autoSubmitQuestion && !hasAutoSubmitted && !isLoading) {
      setHasAutoSubmitted(true);
      // Small delay to let the screen render first
      setTimeout(() => {
        handleSend(autoSubmitQuestion);
      }, 500);
    }
  }, [autoSubmitQuestion, hasAutoSubmitted, isLoading]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Track in conversation history
    addMessage('user', messageText);

    try {
      // Get full context for AI call
      const context = getChatContext();

      // Call AI service with context
      const response = await coachParent(messageText, childProfile, {
        current_routine_products: context.current_routine_products,
        recent_concerns: context.recent_concerns,
        last_scanned_product: context.last_scanned_product,
      });

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer_text,
        timestamp: new Date(),
        keyPoints: response.key_points,
        suggestedActions: response.suggested_actions,
        relatedTopics: response.related_topics,
        followUpPrompts: response.follow_up_prompts,
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Track AI response in conversation history
      addMessage('assistant', response.answer_text);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  const handleTakePhoto = () => {
    setShowActionSheet(false);
    // TODO: Implement camera functionality
    console.log('Take photo');
  };

  const handleUploadImage = () => {
    setShowActionSheet(false);
    // TODO: Implement image picker
    console.log('Upload image');
  };

  const handleUploadDocument = () => {
    setShowActionSheet(false);
    // TODO: Implement document picker
    console.log('Upload document');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIconContainer}>
            <Brain size={24} color={colors.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>FreshiesAI</Text>
            <Text style={styles.headerSubtitle}>
              {activeChildProfile ? `Chatting about ${activeChildProfile.name}` : 'Your skincare guide'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Context Indicator */}
      {(lastScannedProduct || currentRoutineProducts.length > 0) && (
        <View style={styles.contextBanner}>
          {lastScannedProduct && (
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>📦 Last scanned:</Text>
              <Text style={styles.contextValue}>{lastScannedProduct.name}</Text>
            </View>
          )}
          {currentRoutineProducts.length > 0 && (
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>✨ Routine:</Text>
              <Text style={styles.contextValue}>{currentRoutineProducts.length} products</Text>
            </View>
          )}
        </View>
      )}

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View 
            key={message.id} 
            style={styles.messageWrapper}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            {message.role === 'assistant' && (
              <View style={styles.assistantMessageContainer}>
                <View style={styles.assistantAvatar}>
                  <Sparkles size={16} color={colors.purple} />
                </View>
                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantText}>{message.content}</Text>
                  
                  {message.keyPoints && message.keyPoints.length > 0 && (
                    <View style={styles.keyPointsContainer}>
                      <Text style={styles.keyPointsTitle}>Key Points:</Text>
                      {message.keyPoints.map((point, index) => (
                        <Text key={index} style={styles.keyPoint}>• {point}</Text>
                      ))}
                    </View>
                  )}

                  {message.suggestedActions && message.suggestedActions.length > 0 && (
                    <View style={styles.actionsContainer}>
                      <Text style={styles.actionsTitle}>Suggested Actions:</Text>
                      {message.suggestedActions.map((action, index) => (
                        <View key={index} style={styles.actionChip}>
                          <Text style={styles.actionText}>{action}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {message.relatedTopics && message.relatedTopics.length > 0 && (
                    <View style={styles.relatedContainer}>
                      <Text style={styles.relatedTitle}>Related Topics:</Text>
                      <View style={styles.relatedChips}>
                        {message.relatedTopics.map((topic, index) => (
                          <TouchableOpacity key={index} style={styles.relatedChip}>
                            <Text style={styles.relatedText}>{topic}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Follow-up Prompts (only show for last assistant message) */}
            {message.role === 'assistant' && 
             message.followUpPrompts && 
             message.followUpPrompts.length > 0 && 
             message.id === messages.filter(m => m.role === 'assistant').slice(-1)[0]?.id && (
              <View style={styles.followUpContainer}>
                <Text style={styles.followUpTitle}>You might also ask:</Text>
                <View style={styles.followUpChips}>
                  {message.followUpPrompts.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.followUpChip}
                      onPress={() => handleSend(prompt)}
                      disabled={isLoading}
                    >
                      <Text style={styles.followUpText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {message.role === 'user' && (
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{message.content}</Text>
              </View>
            )}
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.assistantAvatar}>
              <Sparkles size={16} color={colors.purple} />
            </View>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={colors.purple} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Suggested Questions (show when no messages yet) */}
        {messages.length === 1 && !isLoading && (
          <View style={styles.suggestedContainer}>
            <Text style={styles.suggestedTitle}>Try asking:</Text>
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestedButton}
                onPress={() => handleSuggestedQuestion(question)}
              >
                <Text style={styles.suggestedText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Area - ChatGPT Style */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          {/* Plus Button */}
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => setShowActionSheet(true)}
            disabled={isLoading}
          >
            <Plus size={22} color="#666666" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message FreshiesAI"
            placeholderTextColor="#999999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={18} color={colors.white} fill={inputText.trim() && !isLoading ? colors.white : 'transparent'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          FreshiesAI provides general guidance. Always consult a healthcare professional for medical advice.
        </Text>
      </View>

      {/* Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowActionSheet(false)}
        >
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />
            
            {/* Title */}
            <Text style={styles.actionSheetTitle}>FreshiesAI</Text>

            {/* Options */}
            <TouchableOpacity style={styles.actionOption} onPress={handleTakePhoto}>
              <View style={styles.actionIconContainer}>
                <Camera size={24} color="#666666" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Take Photo</Text>
                <Text style={styles.actionSubtitle}>Scan a product label</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={handleUploadImage}>
              <View style={styles.actionIconContainer}>
                <ImageIcon size={24} color="#666666" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Upload Image</Text>
                <Text style={styles.actionSubtitle}>Choose from your photos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={handleUploadDocument}>
              <View style={styles.actionIconContainer}>
                <FileText size={24} color="#666666" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Upload Document</Text>
                <Text style={styles.actionSubtitle}>Share ingredient lists or reports</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: 60,
    paddingBottom: spacing[4],
    backgroundColor: colors.black, // Black header
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.purple,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white, // White text on black header
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)', // Light grey subtitle
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBanner: {
    backgroundColor: colors.purple + '15',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.purple + '30',
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
    marginRight: spacing[2],
  },
  contextValue: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing[4],
    paddingBottom: spacing[6],
  },
  messageWrapper: {
    marginBottom: spacing[4],
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#E8E8E8', // Light grey avatar background
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assistantText: {
    fontSize: 15,
    color: '#1A1A1A', // Dark grey text
    lineHeight: 22,
  },
  keyPointsContainer: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  keyPointsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666', // Medium grey
    marginBottom: spacing[2],
  },
  keyPoint: {
    fontSize: 14,
    color: '#4A4A4A', // Dark grey
    lineHeight: 20,
    marginBottom: spacing[1],
  },
  actionsContainer: {
    marginTop: spacing[3],
  },
  actionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    marginBottom: spacing[2],
  },
  actionChip: {
    backgroundColor: '#F5F5F5', // Light grey background
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionText: {
    fontSize: 13,
    color: '#1A1A1A',
  },
  relatedContainer: {
    marginTop: spacing[3],
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    marginBottom: spacing[2],
  },
  relatedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  relatedChip: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  relatedText: {
    fontSize: 12,
    color: colors.purple,
    fontWeight: '600',
  },
  followUpContainer: {
    marginTop: spacing[3],
    marginLeft: 40, // Align with assistant messages (avatar width + gap)
  },
  followUpTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: spacing[2],
  },
  followUpChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  followUpChip: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.purple + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  followUpText: {
    fontSize: 13,
    color: colors.purple,
    fontWeight: '500',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.purple, // Purple accent for user messages
    padding: spacing[4],
    borderRadius: radii.lg,
    borderTopRightRadius: 4,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userText: {
    fontSize: 15,
    color: colors.white,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.white,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderTopLeftRadius: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  suggestedContainer: {
    marginTop: spacing[4],
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: spacing[3],
  },
  suggestedButton: {
    backgroundColor: colors.white,
    padding: spacing[4],
    borderRadius: radii.lg,
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestedText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  plusButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    maxHeight: 100,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
  },
  sendButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.purple,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  disclaimer: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Action Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: spacing[4],
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
});
