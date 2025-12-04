import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // Actions
  setTheme: (theme: Theme) => void;
  setShowSimplifiedViews: (show: boolean) => void;
  setScanHistorySortOrder: (order: SortOrder) => void;
  setShowScanTutorial: (show: boolean) => void;
  setEnablePushNotifications: (enable: boolean) => void;
  setEnableScanReminders: (enable: boolean) => void;
  resetPreferences: () => void;
}

const initialState = {
  theme: 'light' as Theme,
  showSimplifiedViews: false,
  scanHistorySortOrder: 'recent' as SortOrder,
  showScanTutorial: true,
  enablePushNotifications: true,
  enableScanReminders: false,
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
      
      resetPreferences: () => set(initialState),
    }),
    {
      name: 'freshies-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
