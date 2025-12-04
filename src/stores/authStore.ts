import { create } from 'zustand';

export type UserRole = 'parent' | 'child' | 'admin' | null;

interface Profile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  role?: UserRole;
  onboarding_completed?: boolean;
}

interface Family {
  id: string;
  name: string;
  created_by: string;
}

interface AuthState {
  // User & Role
  userId: string | null;
  userRole: UserRole;
  profile: Profile | null;
  
  // Family/Community context
  currentFamily: Family | null;
  currentFamilyId: string | null;
  
  // Selected child (for parent viewing child's perspective)
  selectedChildId: string | null;
  selectedChildProfile: Profile | null;
  
  // Actions
  setUser: (userId: string | null, role: UserRole, profile: Profile | null) => void;
  setCurrentFamily: (family: Family | null) => void;
  setSelectedChild: (childId: string | null, childProfile: Profile | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  userId: null,
  userRole: null,
  profile: null,
  currentFamily: null,
  currentFamilyId: null,
  selectedChildId: null,
  selectedChildProfile: null,
  
  // Actions
  setUser: (userId, role, profile) => set({ 
    userId, 
    userRole: role, 
    profile 
  }),
  
  setCurrentFamily: (family) => set({ 
    currentFamily: family,
    currentFamilyId: family?.id || null,
  }),
  
  setSelectedChild: (childId, childProfile) => set({
    selectedChildId: childId,
    selectedChildProfile: childProfile,
  }),
  
  clearAuth: () => set({
    userId: null,
    userRole: null,
    profile: null,
    currentFamily: null,
    currentFamilyId: null,
    selectedChildId: null,
    selectedChildProfile: null,
  }),
}));
