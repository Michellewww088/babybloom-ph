/**
 * sleepStore.ts — Zustand store for Sleep Tracker
 * Handles timer state, sleep entries, background persistence via AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SleepType    = 'night' | 'nap';
export type SleepQuality = 'restful' | 'restless' | 'frequent_waking';

export interface SleepEntry {
  id:             string;
  childId:        string;
  startedAt:      string;   // ISO timestamp
  endedAt?:       string;   // ISO timestamp — undefined = in-progress
  sleepType:      SleepType;
  quality?:       SleepQuality;
  notes?:         string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMER_KEY = 'babybloom_sleep_timer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getDurationMinutes = (start: string, end?: string): number => {
  if (!end) return 0;
  return Math.max(0, Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
  ));
};

const isSameDay = (isoA: string, isoB: string): boolean => {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
};

const isToday = (iso: string) => isSameDay(iso, new Date().toISOString());

export const formatSleepDuration = (minutes: number): string => {
  if (minutes < 60)  return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface SleepStore {
  entries:         SleepEntry[];
  timerActive:     boolean;
  timerStartedAt:  string | null;
  timerSleepType:  SleepType;

  // Actions
  addEntry:      (entry: SleepEntry)                         => void;
  updateEntry:   (id: string, updates: Partial<SleepEntry>)  => void;
  deleteEntry:   (id: string)                                => void;
  startTimer:    (type: SleepType)                           => void;
  stopTimer:     () => { startedAt: string; sleepType: SleepType } | null;
  restoreTimer:  ()                                          => Promise<void>;

  // Selectors
  getEntriesForChild:     (childId: string) => SleepEntry[];
  getTodayEntries:        (childId: string) => SleepEntry[];
  getTodaySleepMinutes:   (childId: string) => number;
  getWeekEntries:         (childId: string) => SleepEntry[];
  getWeeklyData:          (childId: string) => WeekDay[];
  getActiveElapsedSeconds:() => number;
  getLastSleepEnd:        (childId: string) => string | null;
}

export interface WeekDay {
  label:         string;   // "Mon", "Tue" …
  date:          string;   // "YYYY-MM-DD"
  nightMinutes:  number;
  napMinutes:    number;
  totalMinutes:  number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSleepStore = create<SleepStore>((set, get) => ({
  entries:        [],
  timerActive:    false,
  timerStartedAt: null,
  timerSleepType: 'nap',

  // ── mutations ──────────────────────────────────────────────────────────────

  addEntry: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries] })),

  updateEntry: (id, updates) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  startTimer: (type) => {
    const startedAt = new Date().toISOString();
    AsyncStorage.setItem(TIMER_KEY, JSON.stringify({ startedAt, sleepType: type })).catch(() => {});
    set({ timerActive: true, timerStartedAt: startedAt, timerSleepType: type });
  },

  stopTimer: () => {
    const { timerActive, timerStartedAt, timerSleepType } = get();
    if (!timerActive || !timerStartedAt) return null;
    AsyncStorage.removeItem(TIMER_KEY).catch(() => {});
    set({ timerActive: false, timerStartedAt: null });
    return { startedAt: timerStartedAt, sleepType: timerSleepType };
  },

  restoreTimer: async () => {
    try {
      const raw = await AsyncStorage.getItem(TIMER_KEY);
      if (raw) {
        const { startedAt, sleepType } = JSON.parse(raw) as { startedAt: string; sleepType: SleepType };
        set({ timerActive: true, timerStartedAt: startedAt, timerSleepType: sleepType });
      }
    } catch { /* ignore */ }
  },

  // ── selectors ─────────────────────────────────────────────────────────────

  getEntriesForChild: (childId) =>
    get().entries.filter((e) => e.childId === childId),

  getTodayEntries: (childId) =>
    get().entries.filter((e) => e.childId === childId && isToday(e.startedAt) && !!e.endedAt),

  getTodaySleepMinutes: (childId) =>
    get()
      .getTodayEntries(childId)
      .reduce((sum, e) => sum + getDurationMinutes(e.startedAt, e.endedAt), 0),

  getWeekEntries: (childId) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    return get().entries.filter(
      (e) => e.childId === childId && !!e.endedAt && new Date(e.startedAt) >= cutoff,
    );
  },

  getWeeklyData: (childId) => {
    const days: WeekDay[] = [];
    const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date  = d.toISOString().split('T')[0];
      const label = LABELS[d.getDay()];
      const dayEntries = get().entries.filter(
        (e) => e.childId === childId && !!e.endedAt && e.startedAt.startsWith(date),
      );
      const nightMinutes = dayEntries
        .filter((e) => e.sleepType === 'night')
        .reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
      const napMinutes = dayEntries
        .filter((e) => e.sleepType === 'nap')
        .reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
      days.push({ label, date, nightMinutes, napMinutes, totalMinutes: nightMinutes + napMinutes });
    }
    return days;
  },

  getActiveElapsedSeconds: () => {
    const { timerActive, timerStartedAt } = get();
    if (!timerActive || !timerStartedAt) return 0;
    return Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1_000);
  },

  getLastSleepEnd: (childId) => {
    const entries = get()
      .getEntriesForChild(childId)
      .filter((e) => !!e.endedAt)
      .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime());
    return entries[0]?.endedAt ?? null;
  },
}));

// ─── Dev window exposure ──────────────────────────────────────────────────────

if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__sleepStore = useSleepStore;
}
