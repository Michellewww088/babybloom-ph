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
  getVaccineByCode,
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
    givenDate?: string;      // set → status becomes 'given'
    nextDueDate?: string;
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
 * For recurring vaccines (e.g. annual Flu, Typhoid every 3 years),
 * roll the initial scheduledDate forward to the most recent past due date.
 * E.g. a 5-year-old child: Flu first due 2021-09 → rolls to 2025-09.
 */
function rollForwardScheduledDate(
  initialScheduledDate: string,
  intervalYears: number,
  today: Date,
): string {
  const initial = new Date(initialScheduledDate);
  if (initial >= today) return initialScheduledDate; // not yet first due
  let current = new Date(initial);
  for (;;) {
    const next = new Date(current);
    next.setFullYear(next.getFullYear() + intervalYears);
    if (next > today) break;
    current = next;
  }
  return current.toISOString().split('T')[0];
}

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

/**
 * Auto-generate the next occurrence record for a recurring vaccine after it is marked given.
 * Returns a new VaccineRecord for the next cycle, or null if:
 * - The vaccine has no recurrence field
 * - The recurrence type is 'once-series'
 * - A record for the same code with the same scheduled year already exists in existingRecords
 */
export function autoGenerateNextOccurrence(
  record: VaccineRecord,
  givenDate: string,
  existingRecords: VaccineRecord[],
): VaccineRecord | null {
  const vaccineEntry = getVaccineByCode(record.code);
  if (!vaccineEntry?.recurrence) return null;
  const { recurrence } = vaccineEntry;
  if (recurrence.type === 'once-series') return null;

  const intervalYears = recurrence.type === 'annual' ? 1 : (recurrence.intervalYears ?? 1);

  const given = new Date(givenDate);
  const nextDate = new Date(given);
  nextDate.setFullYear(nextDate.getFullYear() + intervalYears);
  const nextScheduledDate = nextDate.toISOString().split('T')[0];
  const nextYear = nextDate.getFullYear();

  // Dedup: don't create if a record for this code+year already exists
  const alreadyExists = existingRecords.some((r) => {
    if (r.childId !== record.childId || r.code !== record.code) return false;
    if (r.status === 'given') return false; // already given records are historical, not future
    const rYear = new Date(r.scheduledDate).getFullYear();
    return rYear === nextYear;
  });
  if (alreadyExists) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);
  const status: VaccineStatus = nextDate <= today ? 'overdue' : 'upcoming';

  const reminderDate = calcReminderDate(nextScheduledDate);
  const now = new Date().toISOString();

  return {
    id: `${record.childId}-${record.code}-${nextYear}-${Math.random().toString(36).slice(2, 7)}`,
    childId: record.childId,
    code: record.code,
    nameEN: record.nameEN,
    nameFIL: record.nameFIL,
    nameZH: record.nameZH,
    isFreeEPI: record.isFreeEPI,
    recommendedAgeWeeks: record.recommendedAgeWeeks,
    isCustom: record.isCustom,
    status,
    scheduledDate: nextScheduledDate,
    reminderEnabled: true,
    reminderDate,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Store Implementation ───────────────────────────────────────────────────────

export const useVaccineStore = create<VaccineStore>((set, get) => ({
  records: [],

  autoPopulate: (childId, birthday) => {
    const now   = new Date().toISOString();
    const today = new Date();
    const newRecords: VaccineRecord[] = [];

    for (const group of DOH_EPI_SCHEDULE) {
      for (const vaccine of group.vaccines) {
        // Check if record already exists for this child+code
        const existing = get().records.find(
          (r) => r.childId === childId && r.code === vaccine.code
        );
        if (existing) continue;

        let scheduledDate = calcScheduledDate(birthday, group.recommendedAgeWeeks);
        // For recurring vaccines, roll forward to the most recent past due date
        if (vaccine.recurrence && vaccine.recurrence.type !== 'once-series') {
          const intervalYears = vaccine.recurrence.type === 'annual'
            ? 1
            : (vaccine.recurrence.intervalYears ?? 1);
          scheduledDate = rollForwardScheduledDate(scheduledDate, intervalYears, today);
        }
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
      status:             partial.givenDate
        ? 'given'
        : (() => {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            // If nextDueDate is set and is in the future → upcoming (recurring vaccine)
            if (partial.nextDueDate) {
              const nd = new Date(partial.nextDueDate);
              nd.setHours(0, 0, 0, 0);
              if (nd > now) return 'upcoming';
            }
            const sd = new Date(partial.scheduledDate);
            sd.setHours(0, 0, 0, 0);
            return sd <= now ? 'overdue' : 'upcoming';
          })(),
      givenDate:          partial.givenDate,
      scheduledDate:      partial.scheduledDate,
      brand:              partial.brand,
      doseNumber:         partial.doseNumber,
      nextDueDate:        partial.nextDueDate,
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
    set((state) => {
      const updatedRecords = state.records.map((r) =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      );

      // Auto-generate next occurrence for recurring vaccines when marked as given
      if (updates.status === 'given' && updates.givenDate) {
        const updatedRecord = updatedRecords.find((r) => r.id === id);
        if (updatedRecord) {
          const nextRecord = autoGenerateNextOccurrence(updatedRecord, updates.givenDate, updatedRecords);
          if (nextRecord) {
            return { records: [...updatedRecords, nextRecord] };
          }
        }
      }

      return { records: updatedRecords };
    }),

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
    set((state) => {
      const today = new Date();
      return {
        records: state.records.map((r) => {
          if (r.childId !== childId) return r;
          if (r.status === 'given' || r.status === 'skipped') return r;
          if (r.isCustom) {
            // For custom records: if nextDueDate is set and in the future → upcoming
            if (r.nextDueDate) {
              const nd = new Date(r.nextDueDate);
              nd.setHours(0, 0, 0, 0);
              const newStatus: VaccineStatus = nd > today ? 'upcoming' : 'overdue';
              if (newStatus === r.status) return r;
              return { ...r, status: newStatus, updatedAt: new Date().toISOString() };
            }
            return r;
          }

          // For recurring vaccines, roll the scheduledDate forward before computing status
          let scheduledDate = r.scheduledDate;
          const vaccineData = getVaccineByCode(r.code);
          if (vaccineData?.recurrence && vaccineData.recurrence.type !== 'once-series') {
            const intervalYears = vaccineData.recurrence.type === 'annual'
              ? 1
              : (vaccineData.recurrence.intervalYears ?? 1);
            scheduledDate = rollForwardScheduledDate(r.scheduledDate, intervalYears, today);
          }

          const newStatus = computeStatus(scheduledDate, birthday, r.code, false, false);
          if (newStatus === r.status && scheduledDate === r.scheduledDate) return r;
          return {
            ...r,
            scheduledDate,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }),
}));

// ── Dev helper ────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  (window as any).__vaccineStore = useVaccineStore;
}
