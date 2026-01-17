/**
 * Family Store
 *
 * PURPOSE: Manages family context and parent-child view switching
 *
 * WHEN TO USE:
 * - Parent viewing specific child's perspective
 * - Multi-family user context
 *
 * DO NOT USE FOR:
 * - User authentication (use AuthContext)
 * - Child profile data (use ChildProfileContext)
 */

import { create } from 'zustand';

interface Family {
  id: string;
  name: string;
  created_by: string;
}

interface ChildProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
}

interface FamilyState {
  // Family/Community context
  currentFamily: Family | null;
  currentFamilyId: string | null;

  // Selected child (for parent viewing child's perspective)
  selectedChildId: string | null;
  selectedChildProfile: ChildProfile | null;

  // Actions
  setCurrentFamily: (family: Family | null) => void;
  setSelectedChild: (childId: string | null, childProfile: ChildProfile | null) => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>((set) => ({
  // Initial state
  currentFamily: null,
  currentFamilyId: null,
  selectedChildId: null,
  selectedChildProfile: null,

  // Actions
  setCurrentFamily: (family) => set({
    currentFamily: family,
    currentFamilyId: family?.id || null,
  }),

  setSelectedChild: (childId, childProfile) => set({
    selectedChildId: childId,
    selectedChildProfile: childProfile,
  }),

  clearFamily: () => set({
    currentFamily: null,
    currentFamilyId: null,
    selectedChildId: null,
    selectedChildProfile: null,
  }),
}));
