import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';



// Captures onboarding answers so child-profile can pre-fill matching fields
export interface OnboardingSnapshot {
  status:    'pregnant' | 'parenting' | null;
  birthType: 'vaginal'  | 'cesarean'  | null;
  babyCount: 'single'   | 'twins'     | 'triplets' | null;
  date:      string;   // ISO date — birthday (parenting) or EDD (pregnant)
  language:  string;
}

interface OnboardingStore {
  data:      OnboardingSnapshot;
  setData:   (data: Partial<OnboardingSnapshot>) => void;
  clearData: () => void;
}

const EMPTY: OnboardingSnapshot = {
  status:    null,
  birthType: null,
  babyCount: null,
  date:      '',
  language:  'en',
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      data:      { ...EMPTY },
      setData:   (data) => set((s) => ({ data: { ...s.data, ...data } })),
      clearData: () => set({ data: { ...EMPTY } }),
    }),
    {
      name: 'onboarding-store',
      storage: zustandStorage,
    }
  )
);
