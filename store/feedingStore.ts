import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FeedType      = 'breastfeed' | 'bottle' | 'solids';
export type BreastSide    = 'left' | 'right' | 'both';
export type MilkType      = 'breast_milk' | 'formula';
export type SolidsTexture = 'puree' | 'mashed' | 'soft_lumps' | 'finger_food';
export type SolidsReaction = 'none' | 'mild' | 'allergic';

/** A single pause/resume event recorded during a breastfeed timer session */
export interface PauseInterval {
  pausedAt:   string;   // ISO datetime — when pause was pressed
  resumedAt?: string;   // ISO datetime — when resume was pressed (absent if currently paused)
}

export interface FeedingEntry {
  id:        string;
  childId:   string;
  feedType:  FeedType;
  startedAt: string;   // ISO datetime
  endedAt?:  string;   // ISO datetime

  // Breastfeed
  breastSide?:      BreastSide;
  durationMinutes?: number;
  pauseIntervals?:  PauseInterval[];  // recorded pause/resume events from timer

  // Bottle
  milkType?:     MilkType;
  formulaBrand?: string;
  volumeMl?:     number;

  // Solids
  foodItem?:    string;
  amount?:      string;
  texture?:     SolidsTexture;
  reaction?:    SolidsReaction;
  isFirstFood?: boolean;

  // Common
  notes?:    string;
  createdAt: string;
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface FeedingStore {
  entries: FeedingEntry[];

  /** Active nursing timer — persists while the modal is closed */
  timerActive:    boolean;
  timerStartedAt: string | null;   // ISO datetime
  timerSide:      BreastSide | null;
  timerPaused:    boolean;
  timerPauseLog:  PauseInterval[];

  addEntry:    (entry: FeedingEntry) => void;
  updateEntry: (id: string, updates: Partial<FeedingEntry>) => void;
  deleteEntry: (id: string) => void;

  startTimer:  (side: BreastSide) => void;
  stopTimer:   () => void;
  pauseTimer:  () => void;
  resumeTimer: () => void;
}

export const useFeedingStore = create<FeedingStore>()(
  persist(
    (set) => ({
      entries: [],

      timerActive:    false,
      timerStartedAt: null,
      timerSide:      null,
      timerPaused:    false,
      timerPauseLog:  [],

      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      startTimer: (side) =>
        set({
          timerActive:    true,
          timerStartedAt: new Date().toISOString(),
          timerSide:      side,
          timerPaused:    false,
          timerPauseLog:  [],
        }),

      stopTimer: () =>
        set({ timerActive: false, timerStartedAt: null, timerSide: null, timerPaused: false, timerPauseLog: [] }),

      pauseTimer: () =>
        set((state) => ({
          timerPaused:   true,
          timerPauseLog: [
            ...state.timerPauseLog,
            { pausedAt: new Date().toISOString() },
          ],
        })),

      resumeTimer: () =>
        set((state) => ({
          timerPaused:   false,
          timerPauseLog: state.timerPauseLog.map((interval, idx) =>
            idx === state.timerPauseLog.length - 1 && !interval.resumedAt
              ? { ...interval, resumedAt: new Date().toISOString() }
              : interval
          ),
        })),
    }),
    {
      name: 'feeding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Expose store in dev for browser preview testing
if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__feedingStore = useFeedingStore;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns entries for a specific child, newest first */
export function getEntriesForChild(entries: FeedingEntry[], childId: string): FeedingEntry[] {
  return entries
    .filter((e) => e.childId === childId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

/** Last feed entry for a child */
export function getLastFeed(entries: FeedingEntry[], childId: string): FeedingEntry | null {
  const childEntries = getEntriesForChild(entries, childId);
  return childEntries[0] ?? null;
}

/** Today's entries for a child */
export function getTodayEntries(entries: FeedingEntry[], childId: string): FeedingEntry[] {
  const today = new Date().toDateString();
  return getEntriesForChild(entries, childId).filter(
    (e) => new Date(e.startedAt).toDateString() === today,
  );
}

/** Minutes since a date */
export function minutesSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
}

/** Human-readable "X h Y m ago" */
export function timeAgoShort(isoDate: string): string {
  const mins = minutesSince(isoDate);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m ago` : `${h}h ago`;
}

/** All unique foods ever tried by a child */
export function getFoodsTriedByChild(entries: FeedingEntry[], childId: string): string[] {
  const foods = entries
    .filter((e) => e.childId === childId && e.feedType === 'solids' && e.foodItem)
    .map((e) => e.foodItem!);
  return [...new Set(foods)];
}

/** Last breast side used (for suggesting the other side) */
export function getLastBreastSide(entries: FeedingEntry[], childId: string): BreastSide | null {
  const last = getEntriesForChild(entries, childId).find(
    (e) => e.feedType === 'breastfeed' && (e.breastSide === 'left' || e.breastSide === 'right'),
  );
  return last?.breastSide ?? null;
}

/** Suggested next breast side */
export function getSuggestedSide(entries: FeedingEntry[], childId: string): BreastSide {
  const last = getLastBreastSide(entries, childId);
  if (last === 'left')  return 'right';
  if (last === 'right') return 'left';
  return 'left';
}

/** Format duration in minutes as "X min" or "X h Y min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Compute active (non-paused) elapsed seconds from a running timer.
 * Subtracts all pause durations from total wall-clock time.
 */
export function getActiveElapsedSeconds(
  timerStartedAt: string,
  pauseIntervals: PauseInterval[],
  timerPaused: boolean,
): number {
  const now      = Date.now();
  const startMs  = new Date(timerStartedAt).getTime();
  const totalMs  = now - startMs;

  const pausedMs = pauseIntervals.reduce((acc, interval) => {
    if (!interval.resumedAt) {
      // Still paused — count from pausedAt to now
      return acc + (now - new Date(interval.pausedAt).getTime());
    }
    return acc + (new Date(interval.resumedAt).getTime() - new Date(interval.pausedAt).getTime());
  }, 0);

  return Math.max(0, Math.floor((totalMs - pausedMs) / 1000));
}

/** Format a timer event ISO timestamp as MM:SS relative to timerStartedAt */
export function formatTimerMark(eventIso: string, timerStartedAt: string): string {
  const secs = Math.max(0, Math.floor(
    (new Date(eventIso).getTime() - new Date(timerStartedAt).getTime()) / 1000,
  ));
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
