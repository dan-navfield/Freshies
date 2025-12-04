/**
 * Settings Store
 * Global app settings including AI provider preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIProvider } from '../services/ai/types';

interface SettingsState {
  // AI Provider Settings
  preferredAIProvider: AIProvider;
  setPreferredAIProvider: (provider: AIProvider) => void;
  
  // Admin Settings (can be locked down later)
  adminAIProvider?: AIProvider;
  setAdminAIProvider: (provider?: AIProvider) => void;
  
  // Other app settings
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // AI Provider defaults
      preferredAIProvider: 'auto',
      setPreferredAIProvider: (provider) => set({ preferredAIProvider: provider }),
      
      adminAIProvider: undefined,
      setAdminAIProvider: (provider) => set({ adminAIProvider: provider }),
      
      // Other defaults
      theme: 'auto',
      setTheme: (theme) => set({ theme }),
      
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'freshies-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Get the effective AI provider to use
 * Admin override takes precedence over user preference
 */
export function getEffectiveAIProvider(): AIProvider {
  const { adminAIProvider, preferredAIProvider } = useSettingsStore.getState();
  return adminAIProvider || preferredAIProvider;
}
