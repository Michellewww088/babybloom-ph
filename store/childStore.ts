import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export type Sex       = 'boy' | 'girl' | 'other';
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
  children:    Child[];
  activeChild: Child | null;

  setChildren:   (children: Child[]) => void;
  setActiveChild:(child: Child | null) => void;
  addChild:      (child: Child) => void;
  updateChild:   (id: string, updates: Partial<Child>) => void;
  removeChild:   (id: string) => void;
}

export const useChildStore = create<ChildStore>((set) => ({
  children:    [],
  activeChild: null,

  setChildren: (children) => set({ children }),

  setActiveChild: (activeChild) => set({ activeChild }),

  addChild: (child) =>
    set((state) => ({
      children:    [...state.children, child],
      activeChild: state.activeChild ?? child,   // auto-select first child
    })),

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

/** Age string: "3 months" or "1 year 2 months" */
export function getChildAge(birthday: string): string {
  const birth = new Date(birthday);
  const now   = new Date();
  let months  = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return 'newborn';
  if (months === 0) return 'newborn';
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  return rem ? `${years}y ${rem}mo` : `${years}y`;
}
