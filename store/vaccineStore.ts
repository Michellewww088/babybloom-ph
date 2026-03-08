/**
 * vaccineStore.ts — Zustand store for vaccination records
 * Mirrors Supabase vaccination_records table schema
 * Auto-populates from DOH EPI schedule on child profile creation
 */
import { create } from 'zustand';
import {
  DOH_EPI_SCHEDULE,
  calcScheduledDate,
  calcReminderDate,
} from '../constants/vaccines-doh-epi';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VaccineStatus = 'given' | 'upcoming' | 'overdue' | 'skipped';

export interface VaccineRecord {
  id: string;
  childId: string;

  // Vaccine identity
  code: string;           // e.g. 'BCG', 'Penta1'
  nameEN: string;
  nameFIL: string;
  nameZH: string;
  isFreeEPI: boolean;
  recommendedAgeWeeks: number;

  // Status
  status: VaccineStatus;
  scheduledDate: string;  // ISO date YYYY-MM-DD (birthday + recommendedAgeWeeks)
  givenDate?: string;     // ISO date — set when status = 'given'

  // Record details
  clinicName?: string;
  lotNumber?: string;
  administeredBy?: string;
  reactionNotes?: string;
  notes?: string;

  // Reminder
  reminderEnabled: boolean;
  reminderDate?: string;  // 7 days before scheduledDate by default

  createdAt: string;
  updatedAt: string;
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface VaccineStore {
  records: VaccineRecord[];

  /** Auto-populate all vaccines for a child from DOH EPI schedule */
  autoPopulate: (childId: string, birthday: string) => void;

  /** Add or upsert a record */
  addRecord: (record: VaccineRecord) => void;

  /** Update specific fields on a record */
  updateRecord: (id: string, updates: Partial<VaccineRecord>) => void;

  /** Delete a record */
  deleteRecord: (id: string) => void;

  /** Get all records for a child, sorted by scheduledDate */
  getRecords: (childId: string, status?: VaccineStatus) => VaccineRecord[];

  /** Get next upcoming vaccine for a child */
  getNextUpcoming: (childId: string) => VaccineRecord | null;

  /** Recalculate overdue status for a child based on today's date */
  refreshStatuses: (childId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeStatus(scheduledDate: string, given: boolean, skipped: boolean): VaccineStatus {
  if (given) return 'given';
  if (skipped) return 'skipped';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sd = new Date(scheduledDate);
  sd.setHours(0, 0, 0, 0);
  return sd <= today ? 'overdue' : 'upcoming';
}

// ── Store Implementation ───────────────────────────────────────────────────────

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  records: [],

  autoPopulate: (childId, birthday) => {
    const now = new Date().toISOString();
    const newRecords: VaccineRecord[] = [];

    for (const group of DOH_EPI_SCHEDULE) {
      for (const vaccine of group.vaccines) {
        // Check if record already exists for this child+code
        const existing = get().records.find(
          (r) => r.childId === childId && r.code === vaccine.code
        );
        if (existing) continue;

        const scheduledDate = calcScheduledDate(birthday, group.recommendedAgeWeeks);
        const reminderDate = calcReminderDate(scheduledDate);
        const status = computeStatus(scheduledDate, false, false);

        newRecords.push({
          id: `${childId}-${vaccine.code}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          childId,
          code: vaccine.code,
          nameEN: vaccine.nameEN,
          nameFIL: vaccine.nameFIL,
          nameZH: vaccine.nameZH,
          isFreeEPI: vaccine.isFreeEPI,
          recommendedAgeWeeks: group.recommendedAgeWeeks,
          status,
          scheduledDate,
          reminderEnabled: true,
          reminderDate,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (newRecords.length > 0) {
      set((state) => ({ records: [...state.records, ...newRecords] }));
    }
  },

  addRecord: (record) =>
    set((state) => {
      const idx = state.records.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        const updated = [...state.records];
        updated[idx] = record;
        return { records: updated };
      }
      return { records: [...state.records, record] };
    }),

  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      ),
    })),

  deleteRecord: (id) =>
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    })),

  getRecords: (childId, status) => {
    const records = get().records.filter((r) => r.childId === childId);
    const filtered = status ? records.filter((r) => r.status === status) : records;
    return filtered.sort((a, b) => a.recommendedAgeWeeks - b.recommendedAgeWeeks);
  },

  getNextUpcoming: (childId) => {
    const upcoming = get()
      .records.filter((r) => r.childId === childId && r.status === 'upcoming')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return upcoming[0] ?? null;
  },

  refreshStatuses: (childId) =>
    set((state) => ({
      records: state.records.map((r) => {
        if (r.childId !== childId) return r;
        if (r.status === 'given' || r.status === 'skipped') return r;
        const newStatus = computeStatus(r.scheduledDate, false, false);
        if (newStatus === r.status) return r;
        return { ...r, status: newStatus, updatedAt: new Date().toISOString() };
      }),
    })),
}));

// ── Dev helper ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  (window as any).__vaccineStore = useVaccineStore;
}
