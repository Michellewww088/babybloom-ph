import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MilestoneRef {
  id: string;
  age_months_min: number;
  age_months_max: number;
  category: string;
  milestone_text: string;
  stage_name: string;
  is_who_standard: boolean;
}

export interface ChildMilestone {
  id: string;
  child_id: string;
  milestone_ref_id: string;
  achieved_date: string; // YYYY-MM-DD
  notes?: string;
  created_at: string;
}

// ── Local milestone reference data (offline-first) ───────────────────────────

export const MILESTONES_DATA: MilestoneRef[] = [
  // NEWBORN (0–3 months)
  { id: 'n-01', age_months_min: 0, age_months_max: 3,  category: 'motor',   milestone_text: 'Lifts head briefly during tummy time',      stage_name: 'Newborn',      is_who_standard: true },
  { id: 'n-02', age_months_min: 0, age_months_max: 3,  category: 'vision',  milestone_text: 'Follows moving objects with eyes',           stage_name: 'Newborn',      is_who_standard: true },
  { id: 'n-03', age_months_min: 0, age_months_max: 3,  category: 'hearing', milestone_text: 'Startles at loud sounds',                    stage_name: 'Newborn',      is_who_standard: true },
  { id: 'n-04', age_months_min: 0, age_months_max: 3,  category: 'social',  milestone_text: "Recognizes caregiver's face and voice",      stage_name: 'Newborn',      is_who_standard: false },
  { id: 'n-05', age_months_min: 1, age_months_max: 3,  category: 'social',  milestone_text: 'First social smile (6–8 weeks)',             stage_name: 'Newborn',      is_who_standard: true },
  { id: 'n-06', age_months_min: 1, age_months_max: 3,  category: 'language',milestone_text: 'Coos and makes soft vowel sounds',           stage_name: 'Newborn',      is_who_standard: true },
  // YOUNG INFANT (3–6 months)
  { id: 'yi-01', age_months_min: 3, age_months_max: 6, category: 'motor',   milestone_text: 'Rolls front to back and back to front',      stage_name: 'Young Infant', is_who_standard: true },
  { id: 'yi-02', age_months_min: 3, age_months_max: 6, category: 'motor',   milestone_text: 'Reaches for and grasps objects',             stage_name: 'Young Infant', is_who_standard: true },
  { id: 'yi-03', age_months_min: 3, age_months_max: 6, category: 'social',  milestone_text: 'Laughs and squeals with delight',            stage_name: 'Young Infant', is_who_standard: true },
  { id: 'yi-04', age_months_min: 4, age_months_max: 6, category: 'motor',   milestone_text: 'Sits with support (tripod position)',        stage_name: 'Young Infant', is_who_standard: true },
  { id: 'yi-05', age_months_min: 3, age_months_max: 6, category: 'language',milestone_text: 'Babbles: ba, da, ma sounds',                 stage_name: 'Young Infant', is_who_standard: true },
  { id: 'yi-06', age_months_min: 4, age_months_max: 6, category: 'social',  milestone_text: 'Recognizes own name when called',            stage_name: 'Young Infant', is_who_standard: true },
  // OLDER INFANT (6–12 months)
  { id: 'oi-01', age_months_min: 6,  age_months_max: 9,  category: 'motor',   milestone_text: 'Sits independently without support',         stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-02', age_months_min: 7,  age_months_max: 10, category: 'motor',   milestone_text: 'Crawls on hands and knees',                  stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-03', age_months_min: 9,  age_months_max: 12, category: 'motor',   milestone_text: 'Pulls to stand and cruises along furniture',  stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-04', age_months_min: 9,  age_months_max: 12, category: 'language',milestone_text: 'First meaningful words (mama, dada)',         stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-05', age_months_min: 9,  age_months_max: 12, category: 'motor',   milestone_text: 'Pincer grasp (thumb and index finger)',       stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-06', age_months_min: 8,  age_months_max: 12, category: 'social',  milestone_text: 'Stranger anxiety begins',                    stage_name: 'Older Infant', is_who_standard: false },
  { id: 'oi-07', age_months_min: 9,  age_months_max: 12, category: 'social',  milestone_text: 'Waves bye-bye on cue',                       stage_name: 'Older Infant', is_who_standard: true },
  { id: 'oi-08', age_months_min: 10, age_months_max: 12, category: 'feeding', milestone_text: 'Drinks from a cup with help',                 stage_name: 'Older Infant', is_who_standard: false },
  // TODDLER I (12–18 months)
  { id: 't1-01', age_months_min: 12, age_months_max: 15, category: 'motor',    milestone_text: 'Walks independently',                       stage_name: 'Toddler I',    is_who_standard: true },
  { id: 't1-02', age_months_min: 12, age_months_max: 18, category: 'language', milestone_text: 'Uses 5–20 words',                           stage_name: 'Toddler I',    is_who_standard: true },
  { id: 't1-03', age_months_min: 12, age_months_max: 18, category: 'social',   milestone_text: 'Points to communicate desires',             stage_name: 'Toddler I',    is_who_standard: true },
  { id: 't1-04', age_months_min: 12, age_months_max: 18, category: 'motor',    milestone_text: 'Stacks 2–3 blocks',                         stage_name: 'Toddler I',    is_who_standard: false },
  { id: 't1-05', age_months_min: 15, age_months_max: 18, category: 'play',     milestone_text: 'Shows pretend play (feeds doll)',            stage_name: 'Toddler I',    is_who_standard: false },
  { id: 't1-06', age_months_min: 12, age_months_max: 18, category: 'cognitive',milestone_text: 'Follows simple one-step instructions',       stage_name: 'Toddler I',    is_who_standard: true },
  // TODDLER II (18–24 months)
  { id: 't2-01', age_months_min: 18, age_months_max: 24, category: 'motor',    milestone_text: 'Runs (though still unsteady)',               stage_name: 'Toddler II',   is_who_standard: true },
  { id: 't2-02', age_months_min: 18, age_months_max: 24, category: 'language', milestone_text: '50+ words; begins 2-word phrases',           stage_name: 'Toddler II',   is_who_standard: true },
  { id: 't2-03', age_months_min: 18, age_months_max: 24, category: 'cognitive',milestone_text: 'Follows 2-step instructions',                stage_name: 'Toddler II',   is_who_standard: true },
  { id: 't2-04', age_months_min: 18, age_months_max: 24, category: 'motor',    milestone_text: 'Scribbles with crayon',                      stage_name: 'Toddler II',   is_who_standard: false },
  { id: 't2-05', age_months_min: 18, age_months_max: 24, category: 'motor',    milestone_text: 'Kicks and throws a ball',                    stage_name: 'Toddler II',   is_who_standard: false },
  { id: 't2-06', age_months_min: 18, age_months_max: 24, category: 'social',   milestone_text: 'Begins showing empathy',                     stage_name: 'Toddler II',   is_who_standard: false },
  // TODDLER III (24–36 months)
  { id: 't3-01', age_months_min: 24, age_months_max: 36, category: 'language', milestone_text: '3+ word sentences; asks why constantly',     stage_name: 'Toddler III',  is_who_standard: true },
  { id: 't3-02', age_months_min: 24, age_months_max: 36, category: 'self-care',milestone_text: 'Daytime toilet training',                    stage_name: 'Toddler III',  is_who_standard: false },
  { id: 't3-03', age_months_min: 24, age_months_max: 36, category: 'self-care',milestone_text: 'Dresses and undresses with help',             stage_name: 'Toddler III',  is_who_standard: false },
  { id: 't3-04', age_months_min: 24, age_months_max: 36, category: 'motor',    milestone_text: 'Climbs stairs alternating feet',             stage_name: 'Toddler III',  is_who_standard: true },
  { id: 't3-05', age_months_min: 24, age_months_max: 36, category: 'social',   milestone_text: 'Parallel play with other children',          stage_name: 'Toddler III',  is_who_standard: false },
  { id: 't3-06', age_months_min: 24, age_months_max: 36, category: 'cognitive',milestone_text: 'Names familiar people in photos',             stage_name: 'Toddler III',  is_who_standard: false },
  // PRESCHOOL (36–60 months)
  { id: 'ps-01', age_months_min: 36, age_months_max: 60, category: 'language', milestone_text: 'Complex sentences and questions',            stage_name: 'Preschool',    is_who_standard: true },
  { id: 'ps-02', age_months_min: 36, age_months_max: 60, category: 'motor',    milestone_text: 'Draws circles, crosses, and basic faces',    stage_name: 'Preschool',    is_who_standard: false },
  { id: 'ps-03', age_months_min: 48, age_months_max: 60, category: 'motor',    milestone_text: 'Hops on one foot',                          stage_name: 'Preschool',    is_who_standard: true },
  { id: 'ps-04', age_months_min: 36, age_months_max: 60, category: 'cognitive',milestone_text: 'Understands counting to 10',                 stage_name: 'Preschool',    is_who_standard: false },
  { id: 'ps-05', age_months_min: 36, age_months_max: 60, category: 'play',     milestone_text: 'Imaginative role play (doctor, chef)',       stage_name: 'Preschool',    is_who_standard: false },
  { id: 'ps-06', age_months_min: 48, age_months_max: 60, category: 'literacy', milestone_text: 'Recognizes letters in own name',             stage_name: 'Preschool',    is_who_standard: false },
  // SCHOOL AGE I (60–96 months)
  { id: 'sa1-01', age_months_min: 60, age_months_max: 96, category: 'literacy', milestone_text: 'Reads simple words and short sentences',    stage_name: 'School Age I', is_who_standard: false },
  { id: 'sa1-02', age_months_min: 60, age_months_max: 96, category: 'cognitive',milestone_text: 'Adds and subtracts small numbers',          stage_name: 'School Age I', is_who_standard: false },
  { id: 'sa1-03', age_months_min: 72, age_months_max: 96, category: 'motor',    milestone_text: 'Rides a bicycle without training wheels',   stage_name: 'School Age I', is_who_standard: false },
  { id: 'sa1-04', age_months_min: 72, age_months_max: 84, category: 'physical', milestone_text: 'Loses first baby tooth',                    stage_name: 'School Age I', is_who_standard: false },
  { id: 'sa1-05', age_months_min: 60, age_months_max: 96, category: 'social',   milestone_text: 'Forms strong peer friendships',            stage_name: 'School Age I', is_who_standard: false },
  { id: 'sa1-06', age_months_min: 60, age_months_max: 96, category: 'cognitive',milestone_text: 'Understands rules, fairness, consequences', stage_name: 'School Age I', is_who_standard: false },
  // SCHOOL AGE II (96–120 months)
  { id: 'sa2-01', age_months_min: 96, age_months_max: 120, category: 'cognitive', milestone_text: 'Multi-step reasoning and problem-solving',  stage_name: 'School Age II', is_who_standard: false },
  { id: 'sa2-02', age_months_min: 96, age_months_max: 120, category: 'literacy',  milestone_text: 'Reads chapter books independently',         stage_name: 'School Age II', is_who_standard: false },
  { id: 'sa2-03', age_months_min: 96, age_months_max: 120, category: 'physical',  milestone_text: 'Participates in team sports',               stage_name: 'School Age II', is_who_standard: false },
  { id: 'sa2-04', age_months_min: 96, age_months_max: 120, category: 'cognitive', milestone_text: 'Longer attention span for focused tasks',    stage_name: 'School Age II', is_who_standard: false },
  { id: 'sa2-05', age_months_min: 96, age_months_max: 120, category: 'emotional', milestone_text: 'More complex emotional regulation',          stage_name: 'School Age II', is_who_standard: false },
  // PRETEEN (120–144 months)
  { id: 'pt-01', age_months_min: 120, age_months_max: 144, category: 'physical',  milestone_text: 'Early puberty signs begin (vary by child)', stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-02', age_months_min: 120, age_months_max: 144, category: 'cognitive', milestone_text: 'Logical planning and self-organization',     stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-03', age_months_min: 120, age_months_max: 144, category: 'social',    milestone_text: 'Increasing independence and privacy needs',  stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-04', age_months_min: 120, age_months_max: 144, category: 'health',    milestone_text: 'HPV vaccine eligibility',                    stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-05', age_months_min: 132, age_months_max: 144, category: 'health',    milestone_text: 'Tdap booster due',                          stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-06', age_months_min: 120, age_months_max: 144, category: 'social',    milestone_text: 'Interest in social identity and peer groups',stage_name: 'Preteen', is_who_standard: false },
  { id: 'pt-07', age_months_min: 120, age_months_max: 144, category: 'digital',   milestone_text: 'Digital literacy and online safety awareness',stage_name: 'Preteen', is_who_standard: false },
];

// ── Stage definitions ─────────────────────────────────────────────────────────

export const STAGES = [
  { name: 'Newborn',      minMonths: 0,   maxMonths: 3   },
  { name: 'Young Infant', minMonths: 3,   maxMonths: 6   },
  { name: 'Older Infant', minMonths: 6,   maxMonths: 12  },
  { name: 'Toddler I',    minMonths: 12,  maxMonths: 18  },
  { name: 'Toddler II',   minMonths: 18,  maxMonths: 24  },
  { name: 'Toddler III',  minMonths: 24,  maxMonths: 36  },
  { name: 'Preschool',    minMonths: 36,  maxMonths: 60  },
  { name: 'School Age I', minMonths: 60,  maxMonths: 96  },
  { name: 'School Age II',minMonths: 96,  maxMonths: 120 },
  { name: 'Preteen',      minMonths: 120, maxMonths: 144 },
] as const;

export type StageName = typeof STAGES[number]['name'];

/** Returns the stage name for the given age in months */
export function getStageForAge(ageMonths: number): StageName {
  for (const stage of STAGES) {
    if (ageMonths >= stage.minMonths && ageMonths < stage.maxMonths) {
      return stage.name;
    }
  }
  // Cap at Preteen for children over 12 years
  return 'Preteen';
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface MilestoneStore {
  childMilestones: ChildMilestone[];

  markAchieved: (childId: string, milestoneRefId: string) => void;
  unmarkAchieved: (childId: string, milestoneRefId: string) => void;
  getMilestonesForStage: (stageName: string) => MilestoneRef[];
  getAchievedForChild: (childId: string) => ChildMilestone[];
}

export const useMilestoneStore = create<MilestoneStore>((set, get) => ({
  childMilestones: [],

  markAchieved: (childId, milestoneRefId) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: ChildMilestone = {
      id:               `${childId}-${milestoneRefId}-${Date.now()}`,
      child_id:         childId,
      milestone_ref_id: milestoneRefId,
      achieved_date:    today,
      created_at:       new Date().toISOString(),
    };
    set((state) => ({
      childMilestones: [...state.childMilestones, newEntry],
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  unmarkAchieved: (childId, milestoneRefId) => {
    set((state) => ({
      childMilestones: state.childMilestones.filter(
        (m) => !(m.child_id === childId && m.milestone_ref_id === milestoneRefId)
      ),
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  getMilestonesForStage: (stageName) =>
    MILESTONES_DATA.filter((m) => m.stage_name === stageName),

  getAchievedForChild: (childId) =>
    get().childMilestones.filter((m) => m.child_id === childId),
}));

// Expose in dev mode
if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof window !== 'undefined') {
  (window as any).__milestoneStore = useMilestoneStore;
}
