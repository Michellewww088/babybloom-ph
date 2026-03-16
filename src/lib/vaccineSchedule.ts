/**
 * vaccineSchedule.ts — EPI Philippines schedule helper
 *
 * Takes a child's birthDate and returns a sorted, status-tagged list of
 * every vaccine they need from birth through adolescence.
 *
 * Works fully offline using the local schedule data (mirrors the
 * vaccines_schedule Supabase table seeded in supabase/seed/vaccines_schedule.sql).
 *
 * Usage:
 *   import { getVaccineSchedule } from '@/src/lib/vaccineSchedule';
 *   const schedule = getVaccineSchedule(new Date(child.birthday));
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VaccineStatus = 'done' | 'upcoming' | 'overdue';

export interface ScheduledVaccine {
  /** Unique key: vaccine_name + dose_number */
  key: string;
  vaccineName: string;
  doseNumber: number | null;
  /** ISO date string (YYYY-MM-DD) — birthDate + age_weeks_min * 7 */
  dueDate: string;
  /** Window end date — birthDate + age_weeks_max * 7 (may equal dueDate) */
  dueByDate: string;
  isRequired: boolean;
  notes: string;
  status: VaccineStatus;
  /** Days from today: negative = overdue, 0 = today, positive = upcoming */
  daysFromToday: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local schedule data (mirrors vaccines_schedule table)
// Keeps the helper fully offline-capable.
// ─────────────────────────────────────────────────────────────────────────────

interface ScheduleRow {
  vaccineName: string;
  ageWeeksMin: number;
  ageWeeksMax: number;
  doseNumber: number | null;
  isRequired: boolean;
  notes: string;
}

const EPI_SCHEDULE: ScheduleRow[] = [
  // At Birth
  { vaccineName: 'BCG',                               ageWeeksMin: 0,    ageWeeksMax: 0,    doseNumber: 1, isRequired: true,  notes: 'At birth' },
  { vaccineName: 'Hepatitis B',                       ageWeeksMin: 0,    ageWeeksMax: 0,    doseNumber: 1, isRequired: true,  notes: 'At birth — within 24 hours' },
  // 6 Weeks
  { vaccineName: 'Hepatitis B',                       ageWeeksMin: 6,    ageWeeksMax: 6,    doseNumber: 2, isRequired: true,  notes: '6 weeks' },
  { vaccineName: 'Pentavalent (DPT-HepB-Hib)',        ageWeeksMin: 6,    ageWeeksMax: 6,    doseNumber: 1, isRequired: true,  notes: '6 weeks' },
  { vaccineName: 'Oral Polio Vaccine (OPV)',           ageWeeksMin: 6,    ageWeeksMax: 6,    doseNumber: 1, isRequired: true,  notes: '6 weeks' },
  { vaccineName: 'Pneumococcal (PCV)',                 ageWeeksMin: 6,    ageWeeksMax: 6,    doseNumber: 1, isRequired: true,  notes: '6 weeks' },
  { vaccineName: 'Rotavirus',                         ageWeeksMin: 6,    ageWeeksMax: 6,    doseNumber: 1, isRequired: true,  notes: '6 weeks' },
  // 10 Weeks
  { vaccineName: 'Hepatitis B',                       ageWeeksMin: 10,   ageWeeksMax: 10,   doseNumber: 3, isRequired: true,  notes: '10 weeks' },
  { vaccineName: 'Pentavalent (DPT-HepB-Hib)',        ageWeeksMin: 10,   ageWeeksMax: 10,   doseNumber: 2, isRequired: true,  notes: '10 weeks' },
  { vaccineName: 'Oral Polio Vaccine (OPV)',           ageWeeksMin: 10,   ageWeeksMax: 10,   doseNumber: 2, isRequired: true,  notes: '10 weeks' },
  { vaccineName: 'Pneumococcal (PCV)',                 ageWeeksMin: 10,   ageWeeksMax: 10,   doseNumber: 2, isRequired: true,  notes: '10 weeks' },
  { vaccineName: 'Rotavirus',                         ageWeeksMin: 10,   ageWeeksMax: 10,   doseNumber: 2, isRequired: true,  notes: '10 weeks' },
  // 14 Weeks
  { vaccineName: 'Hepatitis B',                       ageWeeksMin: 14,   ageWeeksMax: 14,   doseNumber: 4, isRequired: true,  notes: '14 weeks' },
  { vaccineName: 'Pentavalent (DPT-HepB-Hib)',        ageWeeksMin: 14,   ageWeeksMax: 14,   doseNumber: 3, isRequired: true,  notes: '14 weeks' },
  { vaccineName: 'Oral Polio Vaccine (OPV)',           ageWeeksMin: 14,   ageWeeksMax: 14,   doseNumber: 3, isRequired: true,  notes: '14 weeks' },
  { vaccineName: 'Inactivated Polio Vaccine (IPV)',    ageWeeksMin: 14,   ageWeeksMax: 14,   doseNumber: 1, isRequired: true,  notes: '14 weeks' },
  { vaccineName: 'Pneumococcal (PCV)',                 ageWeeksMin: 14,   ageWeeksMax: 14,   doseNumber: 3, isRequired: true,  notes: '14 weeks' },
  // 12–15 Months
  { vaccineName: 'MMR',                               ageWeeksMin: 52,   ageWeeksMax: 65,   doseNumber: 1, isRequired: true,  notes: '12–15 months' },
  { vaccineName: 'Varicella',                         ageWeeksMin: 52,   ageWeeksMax: 65,   doseNumber: 1, isRequired: true,  notes: '12–15 months' },
  { vaccineName: 'Hepatitis A',                       ageWeeksMin: 52,   ageWeeksMax: 104,  doseNumber: 1, isRequired: false, notes: '12–23 months' },
  // 18 Months
  { vaccineName: 'Hepatitis A',                       ageWeeksMin: 78,   ageWeeksMax: 78,   doseNumber: 2, isRequired: false, notes: '18 months (6 months after first dose)' },
  // 2 Years
  { vaccineName: 'Typhoid',                           ageWeeksMin: 104,  ageWeeksMax: 104,  doseNumber: 1, isRequired: false, notes: '2 years — repeat every 3 years' },
  // 4–6 Years
  { vaccineName: 'MMR',                               ageWeeksMin: 208,  ageWeeksMax: 312,  doseNumber: 2, isRequired: true,  notes: '4–6 years booster' },
  { vaccineName: 'Varicella',                         ageWeeksMin: 208,  ageWeeksMax: 312,  doseNumber: 2, isRequired: true,  notes: '4–6 years booster' },
  // 9–14 Years
  { vaccineName: 'HPV (Gardasil 9)',                  ageWeeksMin: 468,  ageWeeksMax: 728,  doseNumber: 1, isRequired: false, notes: '9–14 years — dose 1' },
  { vaccineName: 'HPV (Gardasil 9)',                  ageWeeksMin: 494,  ageWeeksMax: 754,  doseNumber: 2, isRequired: false, notes: '6 months after dose 1' },
  // 11–12 Years
  { vaccineName: 'Tdap',                              ageWeeksMin: 572,  ageWeeksMax: 624,  doseNumber: 1, isRequired: false, notes: '11–12 years' },
  // Annual from 6 months
  { vaccineName: 'Influenza',                         ageWeeksMin: 26,   ageWeeksMax: 9999, doseNumber: 1, isRequired: false, notes: 'Annual from 6 months — give every year' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Add weeks to a Date and return a new Date (does not mutate) */
function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** Format a Date as YYYY-MM-DD */
function toISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Midnight today — for accurate day-diff comparisons */
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Difference in whole calendar days (positive = future, negative = past) */
function daysDiff(target: Date): number {
  const t = today();
  return Math.round((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getVaccineSchedule
 *
 * @param birthDate  Child's date of birth (Date object)
 * @param givenKeys  Optional set of keys already marked as done
 *                   (format: "VaccineName|doseNumber", e.g. "BCG|1")
 * @returns          Sorted array of ScheduledVaccine, ascending by dueDate
 */
export function getVaccineSchedule(
  birthDate: Date,
  givenKeys: Set<string> = new Set(),
): ScheduledVaccine[] {
  const todayDate = today();

  const results: ScheduledVaccine[] = EPI_SCHEDULE.map((row) => {
    const dueDate   = addWeeks(birthDate, row.ageWeeksMin);
    const dueByDate = addWeeks(birthDate, Math.min(row.ageWeeksMax, 9999));

    const key = `${row.vaccineName}|${row.doseNumber ?? 0}`;
    const days = daysDiff(dueDate);

    let status: VaccineStatus;
    if (givenKeys.has(key)) {
      status = 'done';
    } else if (dueDate <= todayDate) {
      status = 'overdue';
    } else {
      status = 'upcoming';
    }

    return {
      key,
      vaccineName:  row.vaccineName,
      doseNumber:   row.doseNumber,
      dueDate:      toISO(dueDate),
      dueByDate:    toISO(dueByDate),
      isRequired:   row.isRequired,
      notes:        row.notes,
      status,
      daysFromToday: days,
    };
  });

  // Sort: overdue first (most overdue at top), then upcoming (soonest first), done last
  return results.sort((a, b) => {
    const order: Record<VaccineStatus, number> = { overdue: 0, upcoming: 1, done: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.daysFromToday - b.daysFromToday;
  });
}

/**
 * getUpcomingVaccines
 * Convenience wrapper — returns only upcoming + overdue vaccines,
 * optionally limited to the next N days.
 */
export function getUpcomingVaccines(
  birthDate: Date,
  givenKeys: Set<string> = new Set(),
  withinDays = 90,
): ScheduledVaccine[] {
  return getVaccineSchedule(birthDate, givenKeys).filter(
    (v) => v.status !== 'done' && v.daysFromToday <= withinDays,
  );
}

/**
 * getNextVaccine
 * Returns the single soonest upcoming/overdue vaccine.
 */
export function getNextVaccine(
  birthDate: Date,
  givenKeys: Set<string> = new Set(),
): ScheduledVaccine | null {
  const list = getVaccineSchedule(birthDate, givenKeys).filter(
    (v) => v.status !== 'done',
  );
  return list[0] ?? null;
}

/**
 * buildGivenKeys
 * Builds the givenKeys Set from an array of VaccineRecord objects
 * (works with both the local store format and the Supabase DB format).
 */
export function buildGivenKeys(
  givenRecords: Array<{ vaccineName?: string; vaccine_name?: string; doseNumber?: number | null; dose_number?: number | null }>,
): Set<string> {
  const keys = new Set<string>();
  for (const rec of givenRecords) {
    const name = rec.vaccineName ?? rec.vaccine_name ?? '';
    const dose = rec.doseNumber ?? rec.dose_number ?? 0;
    if (name) keys.add(`${name}|${dose}`);
  }
  return keys;
}
