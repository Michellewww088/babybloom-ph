/**
 * vitaminStore.ts — Vitamins, Supplements & Medications Zustand store
 * Tracks: vitamins, supplements, medications, GP visits, adherence
 */

import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EntryType = 'vitamin' | 'supplement' | 'mineral' | 'medication';
export type Frequency =
  | 'once_daily' | 'twice_daily' | 'three_daily'
  | 'every_other' | 'weekly' | 'as_needed';

export interface DoseLog {
  date:   string;  // ISO date 'YYYY-MM-DD'
  taken:  boolean;
  time?:  string;  // 'HH:MM' when actually taken
}

export interface VitaminEntry {
  id:               string;
  childId:          string;
  name:             string;
  type:             EntryType;
  dose:             string;
  frequency:        Frequency;
  reminderTime:     string | null;   // 'HH:MM' e.g. '08:00'
  reminderEnabled:  boolean;
  startDate:        string;          // ISO date
  endDate:          string | null;   // null = ongoing
  notes:            string;
  // medication-only fields
  prescribedBy?:    string;
  diagnosis?:       string;
  isAntibiotic?:    boolean;
  // tracking
  doseLogs:         DoseLog[];
  createdAt:        string;
}

export interface GPVisit {
  id:             string;
  childId:        string;
  date:           string;          // ISO date
  bhsName:        string;
  vitaminA:       boolean;
  deworming:      boolean;
  notes:          string;
  createdAt:      string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface VitaminState {
  entries:  VitaminEntry[];
  gpVisits: GPVisit[];

  // CRUD — entries
  addEntry:    (entry: Omit<VitaminEntry, 'id' | 'createdAt' | 'doseLogs'>) => void;
  updateEntry: (id: string, patch: Partial<VitaminEntry>) => void;
  deleteEntry: (id: string) => void;

  // Dose logging (today)
  logDose:    (id: string, taken: boolean) => void;

  // CRUD — GP visits
  addGPVisit:    (visit: Omit<GPVisit, 'id' | 'createdAt'>) => void;
  deleteGPVisit: (id: string) => void;

  // Selectors
  getEntriesForChild:   (childId: string) => VitaminEntry[];
  getActiveEntries:     (childId: string) => VitaminEntry[];
  getPastEntries:       (childId: string) => VitaminEntry[];
  getGPVisitsForChild:  (childId: string) => GPVisit[];
  getTodayDoseStatus:   (id: string) => DoseLog | undefined;
  getAdherencePercent:  (id: string, days?: number) => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data (for dev preview)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_ENTRIES: VitaminEntry[] = [
  {
    id:              'seed-vit-001',
    childId:         'test-sofia-001',
    name:            'Vitamin D',
    type:            'vitamin',
    dose:            '400 IU',
    frequency:       'once_daily',
    reminderTime:    '08:00',
    reminderEnabled: true,
    startDate:       '2025-12-10',
    endDate:         null,
    notes:           'Give with morning feed',
    doseLogs:        [
      { date: todayISO(), taken: true,  time: '08:05' },
    ],
    createdAt: '2025-12-10T08:00:00Z',
  },
];

const SEED_GP: GPVisit[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// Store creation
// ─────────────────────────────────────────────────────────────────────────────

export const useVitaminStore = create<VitaminState>((set, get) => ({
  entries:  SEED_ENTRIES,
  gpVisits: SEED_GP,

  // ── Entry CRUD ─────────────────────────────────────────────────────────────

  addEntry: (entry) => set(s => ({
    entries: [
      {
        ...entry,
        id:        uuid(),
        doseLogs:  [],
        createdAt: new Date().toISOString(),
      },
      ...s.entries,
    ],
  })),

  updateEntry: (id, patch) => set(s => ({
    entries: s.entries.map(e => e.id === id ? { ...e, ...patch } : e),
  })),

  deleteEntry: (id) => set(s => ({
    entries: s.entries.filter(e => e.id !== id),
  })),

  // ── Dose logging ───────────────────────────────────────────────────────────

  logDose: (id, taken) => set(s => ({
    entries: s.entries.map(e => {
      if (e.id !== id) return e;
      const today = todayISO();
      const existing = e.doseLogs.findIndex(d => d.date === today);
      const log: DoseLog = { date: today, taken, time: new Date().toTimeString().slice(0,5) };
      if (existing >= 0) {
        const logs = [...e.doseLogs];
        logs[existing] = log;
        return { ...e, doseLogs: logs };
      }
      return { ...e, doseLogs: [...e.doseLogs, log] };
    }),
  })),

  // ── GP Visits ──────────────────────────────────────────────────────────────

  addGPVisit: (visit) => set(s => ({
    gpVisits: [
      { ...visit, id: uuid(), createdAt: new Date().toISOString() },
      ...s.gpVisits,
    ],
  })),

  deleteGPVisit: (id) => set(s => ({
    gpVisits: s.gpVisits.filter(v => v.id !== id),
  })),

  // ── Selectors ──────────────────────────────────────────────────────────────

  getEntriesForChild: (childId) =>
    get().entries.filter(e => e.childId === childId),

  getActiveEntries: (childId) => {
    const today = todayISO();
    return get().entries.filter(e =>
      e.childId === childId &&
      (!e.endDate || e.endDate >= today),
    );
  },

  getPastEntries: (childId) => {
    const today = todayISO();
    return get().entries.filter(e =>
      e.childId === childId &&
      e.endDate !== null &&
      e.endDate < today,
    );
  },

  getGPVisitsForChild: (childId) =>
    get().gpVisits.filter(v => v.childId === childId).sort(
      (a, b) => b.date.localeCompare(a.date),
    ),

  getTodayDoseStatus: (id) => {
    const today = todayISO();
    const entry = get().entries.find(e => e.id === id);
    return entry?.doseLogs.find(d => d.date === today);
  },

  getAdherencePercent: (id, days = 7) => {
    const entry = get().entries.find(e => e.id === id);
    if (!entry) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = entry.doseLogs.filter(d => new Date(d.date) >= cutoff);
    if (recent.length === 0) return 0;
    const taken = recent.filter(d => d.taken).length;
    return Math.round((taken / days) * 100);
  },
}));

// Expose on window for dev tools
if (typeof window !== 'undefined') {
  (window as any).__vitaminStore = useVitaminStore;
}
