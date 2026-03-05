// ── USER ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  language: 'en' | 'fil' | 'zh';
  onboarding_completed: boolean;
  created_at: string;
}

// ── CHILD PROFILE ──────────────────────────────────────────────────────
export type BirthType  = 'vaginal' | 'csection';
export type BabyType   = 'normal' | 'premature' | 'twins';
export type GenderType = 'male' | 'female' | 'unknown';
export type BloodType  = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface ChildProfile {
  id: string;
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  nickname?: string;
  gender: GenderType;
  birthday: string;           // ISO date string
  birth_time?: string;        // HH:MM 12hr
  blood_type: BloodType;
  birth_type: BirthType;
  baby_type: BabyType;
  birth_weight_kg?: number;
  birth_height_cm?: number;
  gestational_age_weeks?: number;
  weeks_premature?: number;
  allergies?: string[];
  pediatrician_name?: string;
  pediatrician_clinic?: string;
  philhealth_number?: string;
  mch_booklet_number?: string;
  photo_url?: string;
  is_pregnant: boolean;       // true = tracking pregnancy instead
  due_date?: string;          // ISO date — for pregnancy mode
  created_at: string;
}

// ── FEEDING LOG ────────────────────────────────────────────────────────
export type FeedType    = 'breastfeed' | 'bottle' | 'solids';
export type BreastSide  = 'left' | 'right' | 'both';
export type BottleType  = 'formula' | 'pumped_milk';

export interface FeedingLog {
  id: string;
  child_id: string;
  user_id: string;
  feed_type: FeedType;
  breast_side?: BreastSide;
  bottle_type?: BottleType;
  formula_brand?: string;
  duration_minutes?: number;   // breastfeed / bottle session duration
  volume_ml?: number;          // bottle amount
  food_name?: string;          // solids
  food_texture?: string;       // puree / mashed / finger food
  food_amount_g?: number;
  notes?: string;
  fed_at: string;              // ISO datetime
  created_at: string;
}

// ── SLEEP LOG ──────────────────────────────────────────────────────────
export type SleepType    = 'night' | 'nap';
export type SleepQuality = 'restful' | 'restless' | 'frequent_wakeups';

export interface SleepLog {
  id: string;
  child_id: string;
  user_id: string;
  sleep_type: SleepType;
  started_at: string;          // ISO datetime
  ended_at?: string;           // null = currently sleeping
  duration_minutes?: number;   // computed from start/end
  quality?: SleepQuality;
  notes?: string;
  created_at: string;
}

// ── GROWTH LOG ─────────────────────────────────────────────────────────
export type GrowthMetric = 'weight' | 'height' | 'head_circumference';

export interface GrowthLog {
  id: string;
  child_id: string;
  user_id: string;
  metric: GrowthMetric;
  value: number;
  unit: 'kg' | 'cm';
  age_months?: number;         // computed at time of entry
  who_percentile?: number;     // computed by backend
  logged_at: string;           // ISO date
  notes?: string;
  created_at: string;
}

// ── VACCINATION ────────────────────────────────────────────────────────
export interface VaccinationRecord {
  id: string;
  child_id: string;
  user_id: string;
  vaccine_code: string;        // e.g. 'BCG', 'DPTHEPBHIB_1'
  vaccine_name: string;
  dose_number: number;
  scheduled_date: string;      // ISO date
  given_date?: string;         // null = not yet given
  given_at_facility?: string;  // BHS / RHU / private clinic name
  is_epi_free: boolean;
  notes?: string;
  created_at: string;
}

// ── REMINDER ───────────────────────────────────────────────────────────
export type ReminderCategory = 'vaccine' | 'checkup' | 'feeding' | 'sleep' | 'medication' | 'custom';

export interface Reminder {
  id: string;
  child_id: string;
  user_id: string;
  category: ReminderCategory;
  title: string;
  notes?: string;
  scheduled_at: string;        // ISO datetime
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  is_completed: boolean;
  created_at: string;
}

// ── MILESTONE ──────────────────────────────────────────────────────────
export interface Milestone {
  id: string;
  child_id: string;
  user_id: string;
  title_en: string;
  title_fil: string;
  title_zh: string;
  category: 'motor' | 'language' | 'social' | 'cognitive' | 'first_time' | 'custom';
  expected_age_months?: number;
  achieved_at?: string;        // ISO date — null = not yet achieved
  photo_url?: string;
  notes?: string;
  created_at: string;
}

// ── AUTH STATE ─────────────────────────────────────────────────────────
export interface AuthState {
  user: UserProfile | null;
  activeChild: ChildProfile | null;
  children: ChildProfile[];
  isLoading: boolean;
}
