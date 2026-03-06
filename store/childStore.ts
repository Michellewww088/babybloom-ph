import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export type Sex       = 'male' | 'female' | 'unspecified';
export type BirthType = 'vaginal' | 'cesarean';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export interface Child {
  id: string;

  // Basic
  firstName:  string;
  middleName?: string;
  lastName:   string;
  nickname?:  string;

  // Personal
  sex:         Sex;
  birthday:    string;          // ISO date  YYYY-MM-DD
  birthTime?:  string;          // HH:MM (12-hour with AM/PM stored separately)
  bloodType?:  BloodType;

  // Birth details
  birthType?:       BirthType;
  birthWeight?:     number;     // kg
  birthHeight?:     number;     // cm
  gestationalAge?:  number;     // weeks

  // Health
  allergies?:        string[];
  pediatricianName?: string;
  clinicHospital?:   string;

  // Government records
  philhealthNumber?: string;
  mchBookletNumber?: string;

  // Photo
  photoUri?:     string;        // user-picked URI
  avatarIndex?:  number;        // 0–3 default illustrated avatar

  // Meta
  createdAt: string;            // ISO datetime
}

// ── Store ────────────────────────────────────────────────────────────────────

interface ChildStore {
  children:         Child[];
  activeChild:      Child | null;
  showWelcomeModal: boolean;   // true after first child is saved → triggers welcome overlay

  setChildren:        (children: Child[]) => void;
  setActiveChild:     (child: Child | null) => void;
  addChild:           (child: Child) => void;
  updateChild:        (id: string, updates: Partial<Child>) => void;
  removeChild:        (id: string) => void;
  clearWelcomeModal:  () => void;
}

export const useChildStore = create<ChildStore>((set) => ({
  children:         [],
  activeChild:      null,
  showWelcomeModal: false,

  setChildren: (children) => set({ children }),

  setActiveChild: (activeChild) => set({ activeChild }),

  // Auto-select first child and trigger welcome animation
  addChild: (child) =>
    set((state) => ({
      children:         [...state.children, child],
      activeChild:      state.activeChild ?? child,
      showWelcomeModal: true,
    })),

  clearWelcomeModal: () => set({ showWelcomeModal: false }),

  updateChild: (id, updates) =>
    set((state) => ({
      children: state.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      activeChild:
        state.activeChild?.id === id
          ? { ...state.activeChild, ...updates }
          : state.activeChild,
    })),

  removeChild: (id) =>
    set((state) => {
      const children = state.children.filter((c) => c.id !== id);
      return {
        children,
        activeChild:
          state.activeChild?.id === id ? (children[0] ?? null) : state.activeChild,
      };
    }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Display name: nickname → firstName → 'Baby' */
export function getChildDisplayName(child: Child): string {
  return child.nickname || child.firstName || 'Baby';
}

/**
 * Compact age for switcher chips: "3mo", "1y 2mo"
 */
export function getChildAge(birthday: string): string {
  const birth = new Date(birthday);
  const now   = new Date();
  let months  = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months <= 0) return 'newborn';
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return rem ? `${years}y ${rem}mo` : `${years}y`;
}

/**
 * Verbose age per docs/02-profile.md spec:
 * Under 2 years → "X months, Y days"
 * 2 years+ → "X years, Y months"
 */
export function getChildAgeVerbose(birthday: string): string {
  const birth = new Date(birthday);
  const now   = new Date();

  // Calculate total days difference
  const diffMs   = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Newborn';

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  if (months < 24) {
    // Show months + days
    const monthStart = new Date(birth);
    monthStart.setMonth(monthStart.getMonth() + months);
    const remDays = Math.floor((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    if (months === 0) return `${remDays} day${remDays !== 1 ? 's' : ''}`;
    return remDays > 0
      ? `${months} month${months !== 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''}`
      : `${months} month${months !== 1 ? 's' : ''}`;
  }

  // 2 years+ → years + months
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0
    ? `${years} year${years !== 1 ? 's' : ''}, ${remMonths} month${remMonths !== 1 ? 's' : ''}`
    : `${years} year${years !== 1 ? 's' : ''}`;
}

/**
 * Corrected age for preterm babies.
 * If gestationalAge < 37 weeks, corrected = actual - (40 - gestationalAge) weeks.
 */
export function getCorrectedAge(birthday: string, gestationalAgeWeeks?: number): string {
  if (!gestationalAgeWeeks || gestationalAgeWeeks >= 37) {
    return getChildAgeVerbose(birthday);
  }
  const correctionDays = (40 - gestationalAgeWeeks) * 7;
  const adjustedBirthday = new Date(birthday);
  adjustedBirthday.setDate(adjustedBirthday.getDate() + correctionDays);
  return getChildAgeVerbose(adjustedBirthday.toISOString().split('T')[0]);
}
