import { useState, useEffect } from 'react';
import { Message } from '../components/chat/types';
import { coachParent } from '../modules/recommendations';
import { useChatContextStore, getChatContext } from '../stores/chatContextStore';

interface UseChatOptions {
    activeChildProfile: any; // Using any for now to match the component, but strictly should be ChildProfile
    autoSubmitQuestion?: string;
}

export function useChat({ activeChildProfile, autoSubmitQuestion }: UseChatOptions) {
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
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

    // Get context from store
    const {
        addMessage
    } = useChatContextStore();

    const childProfile = activeChildProfile || {
        name: 'Child',
        age_years: 10,
        has_eczema: false,
        known_allergies: [],
    };

    // Auto-submit question if provided
    useEffect(() => {
        if (autoSubmitQuestion && !hasAutoSubmitted && !isLoading) {
            setHasAutoSubmitted(true);
            // Small delay to let the screen render first, though in hook logic this is less relevant than UI
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

    return {
        messages,
        inputText,
        setInputText,
        isLoading,
        handleSend,
        handleSuggestedQuestion
    };
}
