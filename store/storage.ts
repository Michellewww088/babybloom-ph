/**
 * storage.ts — Cross-platform Zustand persist storage
 * Uses AsyncStorage on native (iOS/Android) and localStorage on web.
 */
import { Platform } from 'react-native';
import { createJSONStorage } from 'zustand/middleware';

const webStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(name);
    } catch { return null; }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    } catch {}
  },
};

export const zustandStorage = createJSONStorage(() =>
  Platform.OS === 'web' ? webStorage : webStorage  // use webStorage for now; swap to AsyncStorage when Supabase configured
);
