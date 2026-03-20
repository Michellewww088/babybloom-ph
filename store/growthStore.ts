/**
 * growthStore.ts — Zustand store for growth measurement records
 * Per CLAUDE.md: local state (mirrors Supabase growth_records table schema)
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GrowthRecord {
  id:                   string;
  childId:              string;
  measuredAt:           string;   // ISO date YYYY-MM-DD
  weightKg?:            number;
  heightCm?:            number;
  headCircumferenceCm?: number;
  notes?:               string;
  createdAt:            string;
}

interface GrowthStore {
  records: GrowthRecord[];

  addRecord:    (record: GrowthRecord) => void;
  updateRecord: (id: string, updates: Partial<GrowthRecord>) => void;
  deleteRecord: (id: string) => void;

  /** All records for a child, sorted oldest→newest */
  getRecords: (childId: string) => GrowthRecord[];

  /** Most recent record for a child */
  getLatest: (childId: string) => GrowthRecord | null;

  /** Last N weight records for sparkline (newest last) */
  getLastNWeights: (childId: string, n?: number) => { date: string; kg: number }[];
}

export const useGrowthStore = create<GrowthStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set((state) => ({
          records: [...state.records, record].sort(
            (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime(),
          ),
        })),

      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      deleteRecord: (id) =>
        set((state) => ({ records: state.records.filter((r) => r.id !== id) })),

      getRecords: (childId) =>
        get().records
          .filter((r) => r.childId === childId)
          .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()),

      getLatest: (childId) => {
        const sorted = get().getRecords(childId);
        return sorted.length > 0 ? sorted[sorted.length - 1] : null;
      },

      getLastNWeights: (childId, n = 5) => {
        return get()
          .getRecords(childId)
          .filter((r) => r.weightKg !== undefined)
          .slice(-n)
          .map((r) => ({ date: r.measuredAt, kg: r.weightKg! }));
      },
    }),
    {
      name: 'growth-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Dev console access
if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__growthStore = useGrowthStore;
}
