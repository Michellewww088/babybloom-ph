/**
 * pregnancyStore.ts — Pregnancy Hub state (Zustand + persist)
 *
 * Manages:
 *   - activePregnancy  : the user's current pregnancy profile
 *   - currentWeek      : calculated from LMP date (1–40)
 *   - dueDate          : Date | null
 *   - isPregnancyMode  : whether the Mama tab is visible in the nav
 *
 * Persisted across sessions via localStorage (web) or AsyncStorage (native).
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { PregnancyProfileRow } from '@/src/types/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PregnancyProfile = PregnancyProfileRow;

export interface PregnancyState {
  // ── State ──────────────────────────────────────────────────────────────────
  activePregnancy:  PregnancyProfile | null;
  currentWeek:      number;           // 0 = not pregnant / not yet calculated
  dueDate:          string | null;    // ISO date string (YYYY-MM-DD)
  isPregnancyMode:  boolean;          // controls Mama tab visibility

  // ── Actions ────────────────────────────────────────────────────────────────
  setActivePregnancy:  (pregnancy: PregnancyProfile | null) => void;
  setIsPregnancyMode:  (enabled: boolean) => void;
  clearPregnancy:      () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Calculate the current gestational week from LMP date.
 * Returns a value from 1–40, clamped within that range.
 * Returns 0 if lmpDate is null/undefined.
 */
function calcCurrentWeek(lmpDate: string | null | undefined): number {
  if (!lmpDate) return 0;
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffMs = today.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 40);
}

// ── Store ──────────────────────────────────────────────────────────────────────

export const usePregnancyStore = create<PregnancyState>()(
  persist(
    (set) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      activePregnancy:  null,
      currentWeek:      0,
      dueDate:          null,
      isPregnancyMode:  false,

      // ── setActivePregnancy ──────────────────────────────────────────────────
      // Sets the pregnancy profile and recomputes derived values (week, dueDate).
      setActivePregnancy: (pregnancy) => {
        if (!pregnancy) {
          set({
            activePregnancy: null,
            currentWeek:     0,
            dueDate:         null,
          });
          return;
        }
        set({
          activePregnancy: pregnancy,
          currentWeek:     calcCurrentWeek(pregnancy.lmp_date),
          dueDate:         pregnancy.due_date,
        });
      },

      // ── setIsPregnancyMode ──────────────────────────────────────────────────
      // Toggles the Mama tab in bottom navigation.
      setIsPregnancyMode: (enabled) => set({ isPregnancyMode: enabled }),

      // ── clearPregnancy ──────────────────────────────────────────────────────
      // Called after user confirms birth — resets all pregnancy state.
      clearPregnancy: () =>
        set({
          activePregnancy: null,
          currentWeek:     0,
          dueDate:         null,
          isPregnancyMode: false,
        }),
    }),
    {
      name:    'pregnancy-store',
      storage: zustandStorage,
      // Only persist user-controlled toggles and profile reference.
      // currentWeek is re-derived on hydration via setActivePregnancy.
      partialize: (state) => ({
        activePregnancy: state.activePregnancy,
        isPregnancyMode: state.isPregnancyMode,
        dueDate:         state.dueDate,
      }),
      // After hydration, recompute currentWeek from the persisted LMP date.
      onRehydrateStorage: () => (state) => {
        if (state?.activePregnancy) {
          state.currentWeek = calcCurrentWeek(state.activePregnancy.lmp_date);
        }
      },
    }
  )
);

// ── Convenience selectors ──────────────────────────────────────────────────────

/** Returns the trimester label ('first' | 'second' | 'third') for a given week */
export function getTrimester(week: number): 'first' | 'second' | 'third' {
  if (week <= 13) return 'first';
  if (week <= 26) return 'second';
  return 'third';
}

/** Returns days remaining until due date. Negative = overdue. */
export function getDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
