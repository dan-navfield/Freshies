/**
 * Chat Context Store
 * Manages context for FreshiesAI conversations
 * Tracks last scanned product, active child, and conversation history
 */

import { create } from 'zustand';
import { ProductData, ProductWithFlags, ChildProfile } from '../services/ai/types';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContextState {
  // Active child profile
  activeChildProfile?: ChildProfile;
  setActiveChildProfile: (profile?: ChildProfile) => void;
  
  // Last scanned product
  lastScannedProduct?: ProductData;
  setLastScannedProduct: (product?: ProductData) => void;
  
  // Current routine products
  currentRoutineProducts: ProductWithFlags[];
  setCurrentRoutineProducts: (products: ProductWithFlags[]) => void;
  
  // Conversation history (last 10 messages)
  conversationHistory: ConversationMessage[];
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearConversationHistory: () => void;
  
  // Recent concerns (for context)
  recentConcerns: string[];
  addConcern: (concern: string) => void;
  clearConcerns: () => void;
  
  // Clear all context
  clearAllContext: () => void;
}

export const useChatContextStore = create<ChatContextState>((set) => ({
  // Active child
  activeChildProfile: undefined,
  setActiveChildProfile: (profile) => set({ activeChildProfile: profile }),
  
  // Last scanned product
  lastScannedProduct: undefined,
  setLastScannedProduct: (product) => set({ lastScannedProduct: product }),
  
  // Routine products
  currentRoutineProducts: [],
  setCurrentRoutineProducts: (products) => set({ currentRoutineProducts: products }),
  
  // Conversation history
  conversationHistory: [],
  addMessage: (role, content) =>
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        { role, content, timestamp: new Date() },
      ].slice(-10), // Keep only last 10 messages
    })),
  clearConversationHistory: () => set({ conversationHistory: [] }),
  
  // Recent concerns
  recentConcerns: [],
  addConcern: (concern) =>
    set((state) => ({
      recentConcerns: [...state.recentConcerns, concern].slice(-5), // Keep last 5
    })),
  clearConcerns: () => set({ recentConcerns: [] }),
  
  // Clear all
  clearAllContext: () =>
    set({
      activeChildProfile: undefined,
      lastScannedProduct: undefined,
      currentRoutineProducts: [],
      conversationHistory: [],
      recentConcerns: [],
    }),
}));

/**
 * Helper to get full context for AI calls
 */
export function getChatContext() {
  const state = useChatContextStore.getState();
  
  return {
    child_profile: state.activeChildProfile,
    last_scanned_product: state.lastScannedProduct,
    current_routine_products: state.currentRoutineProducts,
    conversation_history: state.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    recent_concerns: state.recentConcerns,
  };
}
