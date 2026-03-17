/**
 * vaccineStore.ts — Zustand store for vaccination records
 * Mirrors Supabase vaccination_records table schema
 * Auto-populates from DOH EPI schedule on child profile creation
 */
import { create } from 'zustand';
import {
  DOH_EPI_SCHEDULE,
  VACCINE_MAX_CATCHUP_WEEKS,
  calcScheduledDate,
  calcReminderDate,
} from '../constants/vaccines-doh-epi';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VaccineStatus = 'given' | 'upcoming' | 'overdue' | 'skipped' | 'not_applicable';
export type AdministeredRole = 'pediatrician' | 'nurse' | 'midwife';
export type VaccineSite = 'left_thigh' | 'right_thigh' | 'left_arm' | 'right_arm' | 'oral';

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
  isCustom?: boolean;     // true for vaccines added manually (not in DOH EPI schedule)

  // Status
  status: VaccineStatus;
  scheduledDate: string;  // ISO date YYYY-MM-DD (birthday + recommendedAgeWeeks)
  givenDate?: string;     // ISO date — set when status = 'given'
  nextDueDate?: string;   // ISO date — for multi-dose vaccines

  // Vaccine brand
  brand?: string;

  // Administration details
  clinicName?: string;
  administeredBy?: string;
  administeredRole?: AdministeredRole;
  site?: VaccineSite;     // injection site

  // Batch / lot info
  lotNumber?: string;
  expiryDate?: string;    // ISO date — warn if <30 days from givenDate
  doseNumber?: number;    // e.g. 1, 2, 3

  // Notes & attachments
  reactionNotes?: string;
  notes?: string;
  certificateUrl?: string; // photo of vaccination certificate

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

  /**
   * Add a custom vaccine record (not in DOH EPI schedule).
   * Caller provides at minimum: childId, nameEN, scheduledDate.
   */
  addCustomRecord: (partial: {
    childId: string;
    nameEN: string;
    nameFIL?: string;
    nameZH?: string;
    scheduledDate: string;
    brand?: string;
    doseNumber?: number;
    notes?: string;
  }) => void;

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

  /** Recalculate overdue/not_applicable status for a child based on today's date + birthday */
  refreshStatuses: (childId: string, birthday: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute the vaccine status given its scheduled date, the child's birthday,
 * and whether it was already given or skipped.
 *
 * not_applicable: vaccine's catch-up window has closed (child is older than
 *   VACCINE_MAX_CATCHUP_WEEKS for that vaccine code). Shows "N/A" instead of
 *   "overdue" for vaccines the child can no longer safely receive.
 */
function computeStatus(
  scheduledDate: string,
  birthday: string,
  code: string,
  given: boolean,
  skipped: boolean,
): VaccineStatus {
  if (given)   return 'given';
  if (skipped) return 'skipped';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Age of child in weeks today
  const bd = new Date(birthday);
  bd.setHours(0, 0, 0, 0);
  const ageWeeks = Math.floor((today.getTime() - bd.getTime()) / (7 * 24 * 60 * 60 * 1000));

  // Check catch-up window — if the child is older than the max catch-up age,
  // the vaccine window has passed and it's no longer applicable
  const maxCatchup = VACCINE_MAX_CATCHUP_WEEKS[code];
  if (maxCatchup !== undefined && ageWeeks > maxCatchup) {
    return 'not_applicable';
  }

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
        const reminderDate  = calcReminderDate(scheduledDate);
        const status        = computeStatus(scheduledDate, birthday, vaccine.code, false, false);

        newRecords.push({
          id: `${childId}-${vaccine.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          childId,
          code: vaccine.code,
          nameEN: vaccine.nameEN,
          nameFIL: vaccine.nameFIL,
          nameZH: vaccine.nameZH,
          isFreeEPI: vaccine.isFreeEPI,
          recommendedAgeWeeks: group.recommendedAgeWeeks,
          isCustom: false,
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

  addCustomRecord: (partial) => {
    const now = new Date().toISOString();
    const reminderDate = calcReminderDate(partial.scheduledDate);
    const record: VaccineRecord = {
      id:                 `${partial.childId}-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      childId:            partial.childId,
      code:               `custom-${Date.now()}`,
      nameEN:             partial.nameEN,
      nameFIL:            partial.nameFIL ?? partial.nameEN,
      nameZH:             partial.nameZH ?? partial.nameEN,
      isFreeEPI:          false,
      recommendedAgeWeeks: 0,
      isCustom:           true,
      status:             'upcoming',
      scheduledDate:      partial.scheduledDate,
      brand:              partial.brand,
      doseNumber:         partial.doseNumber,
      notes:              partial.notes,
      reminderEnabled:    true,
      reminderDate,
      createdAt:          now,
      updatedAt:          now,
    };
    set((state) => ({ records: [...state.records, record] }));
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
    return filtered.sort((a, b) => {
      const statusOrder = (s: VaccineStatus) =>
        s === 'overdue' ? 0 : s === 'upcoming' ? 1 : 2;
      const so = statusOrder(a.status) - statusOrder(b.status);
      if (so !== 0) return so;
      if (a.status === 'overdue' || a.status === 'upcoming') {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      }
      return a.recommendedAgeWeeks - b.recommendedAgeWeeks;
    });
  },

  getNextUpcoming: (childId) => {
    const upcoming = get()
      .records.filter((r) => r.childId === childId && r.status === 'upcoming')
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    return upcoming[0] ?? null;
  },

  refreshStatuses: (childId, birthday) =>
    set((state) => ({
      records: state.records.map((r) => {
        if (r.childId !== childId) return r;
        if (r.status === 'given' || r.status === 'skipped') return r;
        if (r.isCustom) return r; // custom records don't auto-expire
        const newStatus = computeStatus(r.scheduledDate, birthday, r.code, false, false);
        if (newStatus === r.status) return r;
        return { ...r, status: newStatus, updatedAt: new Date().toISOString() };
      }),
    })),
}));

// ── Dev helper ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  (window as any).__vaccineStore = useVaccineStore;
}
