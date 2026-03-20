/**
 * pregnancyStore.ts — Pregnancy Hub State
 * Manages the active pregnancy profile, current gestational week, due date,
 * and the toggle between Baby mode and Pregnancy mode.
 *
 * Source: BabyBloom PH — Pregnancy Hub DB & Schema spec
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { PregnancyProfileRow } from '../src/types/supabase';

// ── Re-export for convenience ──────────────────────────────────────────────
export type PregnancyProfile = PregnancyProfileRow;

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Calculate current gestational week from LMP date.
 * Returns 0 if lmp_date is invalid or in the future.
 */
export function calcCurrentWeek(lmpDate: string): number {
  if (!lmpDate) return 0;
  const lmp  = new Date(lmpDate);
  const now  = new Date();
  const diff = now.getTime() - lmp.getTime();
  if (diff < 0) return 0;
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  return Math.min(weeks, 42); // cap at 42 weeks
}

/**
 * Parse due_date string → Date object, or null if invalid.
 */
export function parseDueDate(dueDateStr: string | null): Date | null {
  if (!dueDateStr) return null;
  const d = new Date(dueDateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate days remaining until due date.
 * Returns null if due date is not set or has passed.
 */
export function calcDaysRemaining(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const now  = new Date();
  const diff = dueDate.getTime() - now.getTime();
  if (diff < 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Store Interface ───────────────────────────────────────────────────────

interface PregnancyStore {
  // ── State ──────────────────────────────────────────────────────────────
  activePregnancy:   PregnancyProfile | null;
  currentWeek:       number;       // calculated from lmp_date
  dueDate:           Date | null;
  daysRemaining:     number | null;
  isPregnancyMode:   boolean;      // toggles between Baby mode and Pregnancy mode

  // ── Actions ────────────────────────────────────────────────────────────

  /**
   * Set (or clear) the active pregnancy.
   * Automatically recalculates currentWeek, dueDate, and daysRemaining.
   */
  setActivePregnancy: (pregnancy: PregnancyProfile | null) => void;

  /**
   * Toggle Pregnancy mode on / off.
   * When true, the app shows Pregnancy Hub features instead of Baby tracking.
   */
  setIsPregnancyMode: (value: boolean) => void;

  /**
   * Recalculate derived fields (week, dueDate, daysRemaining)
   * from the currently stored activePregnancy.
   * Call this on app resume to keep values fresh.
   */
  refreshDerivedFields: () => void;

  /**
   * Clear all pregnancy state (e.g., on sign-out).
   */
  clearPregnancy: () => void;
}

// ── Store Implementation ──────────────────────────────────────────────────

export const usePregnancyStore = create<PregnancyStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ─────────────────────────────────────────────────
      activePregnancy:  null,
      currentWeek:      0,
      dueDate:          null,
      daysRemaining:    null,
      isPregnancyMode:  false,

      // ── setActivePregnancy ────────────────────────────────────────────
      setActivePregnancy: (pregnancy) => {
        if (!pregnancy) {
          set({
            activePregnancy: null,
            currentWeek:     0,
            dueDate:         null,
            daysRemaining:   null,
          });
          return;
        }

        const week          = calcCurrentWeek(pregnancy.lmp_date);
        const dueDate       = parseDueDate(pregnancy.due_date);
        const daysRemaining = calcDaysRemaining(dueDate);

        set({
          activePregnancy: pregnancy,
          currentWeek:     week,
          dueDate,
          daysRemaining,
        });
      },

      // ── setIsPregnancyMode ────────────────────────────────────────────
      setIsPregnancyMode: (value) => {
        set({ isPregnancyMode: value });
      },

      // ── refreshDerivedFields ──────────────────────────────────────────
      refreshDerivedFields: () => {
        const { activePregnancy } = get();
        if (!activePregnancy) return;

        const week          = calcCurrentWeek(activePregnancy.lmp_date);
        const dueDate       = parseDueDate(activePregnancy.due_date);
        const daysRemaining = calcDaysRemaining(dueDate);

        set({ currentWeek: week, dueDate, daysRemaining });
      },

      // ── clearPregnancy ────────────────────────────────────────────────
      clearPregnancy: () => {
        set({
          activePregnancy:  null,
          currentWeek:      0,
          dueDate:          null,
          daysRemaining:    null,
          isPregnancyMode:  false,
        });
      },
    }),
    {
      name:    'pregnancy-store',
      storage: zustandStorage,
      // Only persist non-derived fields; dueDate as ISO string for serialization
      partialize: (state) => ({
        activePregnancy: state.activePregnancy,
        isPregnancyMode: state.isPregnancyMode,
      }),
      // Re-hydrate derived fields after rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.activePregnancy) {
          state.refreshDerivedFields();
        }
      },
    }
  )
);
