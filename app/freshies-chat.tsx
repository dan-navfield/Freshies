import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii } from '../src/theme/tokens';
import { Brain, X, Sparkles } from 'lucide-react-native';
import { useChatContextStore } from '../src/stores/chatContextStore';
import { useChat } from '../src/hooks/useChat';

// Components
import { MessageBubble } from '../src/components/chat/MessageBubble';
import { ChatInput } from '../src/components/chat/ChatInput';
import { ChatActionSheet } from '../src/components/chat/ChatActionSheet';

const SUGGESTED_QUESTIONS = [
  "What's a good starter routine for my 10-year-old?",
  "Is retinol safe for teens?",
  "How do I know if a product is too harsh?",
  "What ingredients should I avoid for sensitive skin?",
];

export default function FreshiesChatScreen() {
  const params = useLocalSearchParams();
  const autoSubmitQuestion = params.autoSubmit as string | undefined;

  const [showActionSheet, setShowActionSheet] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastMessageRef = useRef<View>(null);
  const [scrollToLastMessage, setScrollToLastMessage] = useState(false);

  // Get context from store
  const {
    activeChildProfile,
    lastScannedProduct,
    currentRoutineProducts,
  } = useChatContextStore();

  // Initialize chat hook
  const {
    messages,
    inputText,
    setInputText,
    isLoading,
    handleSend,
    handleSuggestedQuestion
  } = useChat({
    activeChildProfile,
    autoSubmitQuestion
  });

  useEffect(() => {
    // Trigger scroll after messages update
    if (messages.length > 1) {
      setScrollToLastMessage(true);
    }
  }, [messages.length]);

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
        {messages.map((message, index) => {
          const isLastAssistantMessage =
            message.role === 'assistant' &&
            message.id === messages.filter(m => m.role === 'assistant').slice(-1)[0]?.id;

          return (
            <View
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : null}
            >
              <MessageBubble
                message={message}
                isLastAssistantMessage={isLastAssistantMessage}
                onSend={handleSend}
                isLoading={isLoading}
              />
            </View>
          );
        })}

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

      {/* Input Area */}
      <ChatInput
        inputText={inputText}
        onChangeText={setInputText}
        onSend={() => handleSend()}
        isLoading={isLoading}
        onActionPress={() => setShowActionSheet(true)}
      />

      {/* Action Sheet Modal */}
      <ChatActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onTakePhoto={handleTakePhoto}
        onUploadImage={handleUploadImage}
        onUploadDocument={handleUploadDocument}
      />
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
  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[4],
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
  // Suggested Questions
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
});
