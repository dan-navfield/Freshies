import { create } from 'zustand';

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'household'
  | 'preferences'
  | 'tour'
  | 'complete';

interface OnboardingState {
  // Current step
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  
  // Permissions
  cameraPermissionGranted: boolean;
  notificationPermissionGranted: boolean;
  
  // First-time flags
  hasCompletedFirstScan: boolean;
  hasSeenTour: boolean;
  
  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  markStepComplete: (step: OnboardingStep) => void;
  setCameraPermission: (granted: boolean) => void;
  setNotificationPermission: (granted: boolean) => void;
  setFirstScanComplete: () => void;
  setTourSeen: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  // Initial state
  currentStep: 'welcome',
  completedSteps: [],
  cameraPermissionGranted: false,
  notificationPermissionGranted: false,
  hasCompletedFirstScan: false,
  hasSeenTour: false,
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  
  markStepComplete: (step) => set((state) => ({
    completedSteps: state.completedSteps.includes(step)
      ? state.completedSteps
      : [...state.completedSteps, step],
  })),
  
  setCameraPermission: (granted) => set({ cameraPermissionGranted: granted }),
  
  setNotificationPermission: (granted) => set({ notificationPermissionGranted: granted }),
  
  setFirstScanComplete: () => set({ hasCompletedFirstScan: true }),
  
  setTourSeen: () => set({ hasSeenTour: true }),
  
  resetOnboarding: () => set({
    currentStep: 'welcome',
    completedSteps: [],
    hasCompletedFirstScan: false,
    hasSeenTour: false,
  }),
}));
