import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIProvider } from '../services/ai/types';

export type SortOrder = 'recent' | 'alphabetical' | 'category';
export type Theme = 'light' | 'dark' | 'auto';

interface PreferencesState {
  // Display preferences
  theme: Theme;
  showSimplifiedViews: boolean; // For children

  // Scan history preferences
  scanHistorySortOrder: SortOrder;
  showScanTutorial: boolean;

  // Notifications
  enablePushNotifications: boolean;
  enableScanReminders: boolean;

  // AI Provider Settings (consolidated from settingsStore)
  preferredAIProvider: AIProvider;
  adminAIProvider?: AIProvider;

  // Actions
  setTheme: (theme: Theme) => void;
  setShowSimplifiedViews: (show: boolean) => void;
  setScanHistorySortOrder: (order: SortOrder) => void;
  setShowScanTutorial: (show: boolean) => void;
  setEnablePushNotifications: (enable: boolean) => void;
  setEnableScanReminders: (enable: boolean) => void;
  setPreferredAIProvider: (provider: AIProvider) => void;
  setAdminAIProvider: (provider?: AIProvider) => void;
  resetPreferences: () => void;
}

const initialState = {
  theme: 'auto' as Theme,
  showSimplifiedViews: false,
  scanHistorySortOrder: 'recent' as SortOrder,
  showScanTutorial: true,
  enablePushNotifications: true,
  enableScanReminders: false,
  preferredAIProvider: 'auto' as AIProvider,
  adminAIProvider: undefined,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      
      setShowSimplifiedViews: (show) => set({ showSimplifiedViews: show }),
      
      setScanHistorySortOrder: (order) => set({ scanHistorySortOrder: order }),
      
      setShowScanTutorial: (show) => set({ showScanTutorial: show }),
      
      setEnablePushNotifications: (enable) => set({ enablePushNotifications: enable }),

      setEnableScanReminders: (enable) => set({ enableScanReminders: enable }),

      setPreferredAIProvider: (provider) => set({ preferredAIProvider: provider }),

      setAdminAIProvider: (provider) => set({ adminAIProvider: provider }),

      resetPreferences: () => set(initialState),
    }),
    {
      name: 'freshies-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Get the effective AI provider to use
 * Admin override takes precedence over user preference
 */
export function getEffectiveAIProvider(): AIProvider {
  const { adminAIProvider, preferredAIProvider } = usePreferencesStore.getState();
  return adminAIProvider || preferredAIProvider;
}
