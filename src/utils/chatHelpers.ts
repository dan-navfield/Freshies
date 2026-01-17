/**
 * Chat Helper Functions
 * Utilities for managing chat context and navigation
 */

import { router } from 'expo-router';
import { useChatContextStore } from '../stores/chatContextStore';
import { ProductData, ProductWithFlags } from '../services/ai/types';

/**
 * Navigate to chat with a scanned product in context
 */
export function openChatWithProduct(product: ProductData) {
  useChatContextStore.getState().setLastScannedProduct(product);
  router.push('/freshies-chat');
}

/**
 * Navigate to chat with a routine in context
 */
export function openChatWithRoutine(products: ProductWithFlags[]) {
  useChatContextStore.getState().setCurrentRoutineProducts(products);
  router.push('/freshies-chat');
}

/**
 * Navigate to chat (child profile will come from ChildProfileContext)
 */
export function openChat() {
  router.push('/freshies-chat');
}

/**
 * Navigate to chat with a concern/question
 */
export function openChatWithConcern(concern: string) {
  useChatContextStore.getState().addConcern(concern);
  router.push('/freshies-chat');
}

/**
 * Navigate to chat and auto-submit a question
 */
export function openChatWithQuestion(question: string) {
  router.push({
    pathname: '/freshies-chat',
    params: { autoSubmit: question }
  });
}

/**
 * Start a fresh chat session (clears context)
 */
export function startFreshChat() {
  useChatContextStore.getState().clearAllContext();
  router.push('/freshies-chat');
}
