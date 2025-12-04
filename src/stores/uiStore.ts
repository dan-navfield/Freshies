import { create } from 'zustand';

export interface Snackbar {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface BottomSheet {
  id: string;
  content: React.ReactNode;
  height?: number | string;
}

interface UIState {
  // Loading
  isGlobalLoading: boolean;
  loadingMessage: string | null;
  
  // Snackbars/Toasts
  snackbars: Snackbar[];
  
  // Bottom sheets / Modals
  activeBottomSheet: BottomSheet | null;
  
  // Scanner
  isScannerActive: boolean;
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  showSnackbar: (message: string, type?: Snackbar['type'], duration?: number) => void;
  dismissSnackbar: (id: string) => void;
  showBottomSheet: (content: React.ReactNode, height?: number | string) => void;
  dismissBottomSheet: () => void;
  setScannerActive: (active: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isGlobalLoading: false,
  loadingMessage: null,
  snackbars: [],
  activeBottomSheet: null,
  isScannerActive: false,
  
  // Actions
  setGlobalLoading: (loading, message) => set({
    isGlobalLoading: loading,
    loadingMessage: message || null,
  }),
  
  showSnackbar: (message, type = 'info', duration = 3000) => {
    const id = `snackbar-${Date.now()}`;
    set((state) => ({
      snackbars: [...state.snackbars, { id, message, type, duration }],
    }));
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          snackbars: state.snackbars.filter((s) => s.id !== id),
        }));
      }, duration);
    }
  },
  
  dismissSnackbar: (id) => set((state) => ({
    snackbars: state.snackbars.filter((s) => s.id !== id),
  })),
  
  showBottomSheet: (content, height) => {
    const id = `sheet-${Date.now()}`;
    set({ activeBottomSheet: { id, content, height } });
  },
  
  dismissBottomSheet: () => set({ activeBottomSheet: null }),
  
  setScannerActive: (active) => set({ isScannerActive: active }),
}));
