/**
 * vitamins-guide.ts — DOH Philippines / WHO / AAP Vitamin & Supplement Guide
 * Source: AAP 2023, DOH Philippines IYCF Guidelines, Garantisadong Pambata Program
 */

export type Priority = 'high' | 'medium' | 'low';
export type VitaminType = 'vitamin' | 'supplement' | 'mineral';

export interface VitaminRec {
  name:              string;
  nameZH?:           string;
  nameFIL?:          string;
  type:              VitaminType;
  dose:              string;
  reason:            { en: string; fil: string; zh: string };
  form:              string;
  source:            string;
  priority:          Priority;
  condition?:        string;        // conditional recommendation
  isFreeGovProgram?: boolean;       // free at BHS/RHU
  whenToTake?:       string;        // e.g. "with morning feed"
  sideEffects?:      string;        // brief notes for parents
}

export interface AgeRangeRec {
  ageRangeMonths: [number, number];
  label:          { en: string; fil: string; zh: string };
  recommendations: VitaminRec[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Master recommendation table  (0–36 months)
// ─────────────────────────────────────────────────────────────────────────────

export const VITAMIN_RECOMMENDATIONS: AgeRangeRec[] = [
  {
    ageRangeMonths: [0, 6],
    label: {
      en:  '0–6 months',
      fil: '0–6 na buwan',
      zh:  '0–6个月',
    },
    recommendations: [
      {
        name:    'Vitamin D',
        nameFIL: 'Bitamina D',
        nameZH:  '维生素D',
        type:    'vitamin',
        dose:    '400 IU per day',
        reason: {
          en:  'Breastfed babies need Vitamin D supplementation as breast milk contains very little. Essential for bone health and immune support.',
          fil: 'Ang mga sanggol na breastfed ay kailangan ng Bitamina D dahil mababa ang nilalaman nito sa gatas ng ina. Mahalaga para sa kalusugan ng buto.',
          zh:  '母乳中维生素D含量极低，纯母乳喂养的宝宝需要额外补充，对骨骼发育和免疫系统至关重要。',
        },
        form:        'Liquid drops (e.g., D-Vi-Sol)',
        source:      'AAP 2023, DOH Philippines',
        priority:    'high',
        whenToTake:  'Daily with morning feed',
        sideEffects: 'Generally safe at recommended dose',
      },
      {
        name:    'Iron Supplement',
        nameFIL: 'Iron (Bakal)',
        nameZH:  '铁补充剂',
        type:    'mineral',
        dose:    '1 mg/kg/day',
        reason: {
          en:  'For preterm babies or exclusively breastfed babies from 4 months — breast milk is low in iron. Critical for brain development.',
          fil: 'Para sa mga premature o exclusively breastfed na sanggol mula 4 na buwan. Mahalaga para sa pag-unlad ng utak.',
          zh:  '早产儿或纯母乳喂养4个月以上的婴儿需要补铁，对大脑发育至关重要。',
        },
        form:      'Liquid iron drops',
        source:    'AAP 2023, DOH Philippines',
        priority:  'medium',
        condition: 'preterm OR exclusively_breastfed_after_4_months',
        whenToTake: 'Between feeds (best absorbed on empty stomach)',
        sideEffects: 'May cause dark stools — this is normal',
      },
    ],
  },
  {
    ageRangeMonths: [6, 12],
    label: {
      en:  '6–12 months',
      fil: '6–12 na buwan',
      zh:  '6–12个月',
    },
    recommendations: [
      {
        name:    'Vitamin D',
        nameFIL: 'Bitamina D',
        nameZH:  '维生素D',
        type:    'vitamin',
        dose:    '400 IU per day',
        reason: {
          en:  'Continue Vitamin D even after solids start. WHO and AAP recommend continuing through the first year.',
          fil: 'Ituloy ang Bitamina D kahit nagsimula na ng solid foods. Inirerekomenda ng WHO at AAP hanggang sa unang taon.',
          zh:  '即使开始添加辅食后，仍应继续补充维生素D，WHO和AAP建议补充至一周岁。',
        },
        form:       'Liquid drops or infant formula',
        source:     'AAP 2023',
        priority:   'high',
        whenToTake: 'Daily with morning feed',
      },
      {
        name:             'Vitamin A (Garantisadong Pambata)',
        nameFIL:          'Bitamina A (GP Program)',
        nameZH:           '维生素A（GP项目）',
        type:             'vitamin',
        dose:             '100,000 IU (free from DOH)',
        reason: {
          en:  'DOH\'s Garantisadong Pambata provides free Vitamin A every 6 months at BHS. Critical for vision, immune function, and growth.',
          fil: 'Ang GP ng DOH ay nagbibigay ng libreng Bitamina A tuwing Enero at Hulyo sa BHS. Mahalaga para sa paningin at immune system.',
          zh:  '菲律宾卫生部GP项目每年1月和7月在社区卫生站免费提供维生素A，对视力和免疫系统至关重要。',
        },
        form:             'Capsule at BHS (free)',
        source:           'DOH Philippines Garantisadong Pambata',
        priority:         'high',
        isFreeGovProgram: true,
        whenToTake:       'January and July at your local BHS/RHU',
      },
      {
        name:    'Iron (from food + supplement if needed)',
        nameFIL: 'Iron mula sa pagkain',
        nameZH:  '铁（食物来源为主）',
        type:    'mineral',
        dose:    '11 mg/day (from all sources)',
        reason: {
          en:  'After 6 months, iron from complementary foods (e.g., malunggay, beef, fortified cereals) becomes critical. Supplement only if dietary intake is low.',
          fil: 'Pagkatapos ng 6 buwan, ang iron mula sa solid foods (tulad ng malunggay, karne) ay napakahalaga.',
          zh:  '6个月后，通过辅食（如马伦嘎木叶、牛肉、强化谷物）补铁变得至关重要。',
        },
        form:      'Iron-rich foods first; drops if needed',
        source:    'WHO IYCF, DOH Philippines',
        priority:  'medium',
        condition: 'dietary_iron_inadequate',
      },
    ],
  },
  {
    ageRangeMonths: [12, 36],
    label: {
      en:  '12–36 months (Toddler)',
      fil: '12–36 na buwan (Batang Maliit)',
      zh:  '12–36个月（幼儿）',
    },
    recommendations: [
      {
        name:    'Vitamin D',
        nameFIL: 'Bitamina D',
        nameZH:  '维生素D',
        type:    'vitamin',
        dose:    '600 IU per day',
        reason: {
          en:  'Higher dose needed for toddlers. Especially important if child has limited sun exposure or drinks non-fortified milk.',
          fil: 'Mas mataas na dosis ang kailangan ng mga batang maliit. Lalo na kung limitado ang araw o hindi fortified ang gatas na inumin.',
          zh:  '幼儿需要更高剂量。如果日晒不足或主要喝非强化奶，尤为重要。',
        },
        form:       'Drops or chewable',
        source:     'AAP 2023',
        priority:   'medium',
        whenToTake: 'With any meal',
      },
      {
        name:             'Vitamin A (Garantisadong Pambata)',
        nameFIL:          'Bitamina A (GP Program)',
        nameZH:           '维生素A（GP项目）',
        type:             'vitamin',
        dose:             '200,000 IU (free from DOH)',
        reason: {
          en:  'Higher dose after age 1. Free at BHS every January and July. Visit with your MCH Booklet.',
          fil: 'Mas mataas na dosis pagkatapos ng 1 taon. Libre sa BHS tuwing Enero at Hulyo. Magdala ng MCH Booklet.',
          zh:  '1岁后剂量增加。每年1月和7月在社区卫生站免费提供。请携带MCH手册前往。',
        },
        form:             'Capsule at BHS (free)',
        source:           'DOH Philippines Garantisadong Pambata',
        priority:         'high',
        isFreeGovProgram: true,
        whenToTake:       'January and July at your local BHS/RHU',
      },
      {
        name:    'Multivitamin (optional)',
        nameFIL: 'Multivitamin',
        nameZH:  '复合维生素',
        type:    'vitamin',
        dose:    'As per product label',
        reason: {
          en:  'If child is a picky eater, a children\'s multivitamin can help fill nutritional gaps. Not a substitute for a balanced diet.',
          fil: 'Kung mahilig pumili ng pagkain ang bata, makakatulong ang multivitamin. Hindi kapalit ng balanseng pagkain.',
          zh:  '如果孩子挑食，儿童复合维生素有助于补充营养缺口，但不能替代均衡饮食。',
        },
        form:      'Liquid or chewable',
        source:    'AAP',
        priority:  'low',
        condition: 'picky_eater',
      },
      {
        name:    'Zinc',
        nameFIL: 'Zinc',
        nameZH:  '锌',
        type:    'mineral',
        dose:    '3 mg/day',
        reason: {
          en:  'For toddlers with frequent colds or poor appetite. Zinc supports immunity and growth. Found in meat, legumes, and fortified cereals.',
          fil: 'Para sa mga batang madalas nagkasakit o mahirap kumain. Ang zinc ay nagpapatibay ng immune system.',
          zh:  '对于经常感冒或食欲不振的幼儿，锌有助于增强免疫力和促进生长。',
        },
        form:      'Liquid or chewable',
        source:    'WHO, DOH Philippines',
        priority:  'low',
        condition: 'frequent_illness OR poor_appetite',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Garantisadong Pambata schedule
// ─────────────────────────────────────────────────────────────────────────────

export const GP_SCHEDULE = {
  months:       [1, 7],   // January and July
  reminderDay:  15,       // reminder on Dec 15 and June 15
  ageEligible:  { minMonths: 6, maxMonths: 72 },  // 6 months to 5 years
  vitaminsGiven: ['Vitamin A', 'Deworming (Albendazole)'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Quick-select name chips (for Add modal)
// ─────────────────────────────────────────────────────────────────────────────

export const VITAMIN_QUICK_OPTIONS = [
  'Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin B12',
  'Iron', 'Zinc', 'Calcium', 'Omega-3 / DHA',
  'Multivitamin', 'Probiotics', 'Folate',
];

export const MEDICATION_QUICK_OPTIONS = [
  'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin',
  'Salbutamol', 'Cetirizine', 'ORS', 'Zinc (for diarrhea)',
];

export const FREQUENCY_OPTIONS = [
  { key: 'once_daily',     label: { en: 'Once daily',     fil: 'Isang beses sa isang araw', zh: '每日一次' } },
  { key: 'twice_daily',    label: { en: 'Twice daily',    fil: 'Dalawang beses sa isang araw', zh: '每日两次' } },
  { key: 'three_daily',    label: { en: 'Three times daily', fil: 'Tatlong beses sa isang araw', zh: '每日三次' } },
  { key: 'every_other',    label: { en: 'Every other day', fil: 'Isang araw oo, isang araw hindi', zh: '隔日一次' } },
  { key: 'weekly',         label: { en: 'Weekly',         fil: 'Linggunal',      zh: '每周一次' } },
  { key: 'as_needed',      label: { en: 'As needed',      fil: 'Kung kailangan', zh: '按需服用' } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getRecommendationsForAge(ageMonths: number): VitaminRec[] {
  const matching = VITAMIN_RECOMMENDATIONS.filter(
    r => ageMonths >= r.ageRangeMonths[0] && ageMonths < r.ageRangeMonths[1],
  );
  return matching.flatMap(r => r.recommendations);
}

export function isGPEligible(ageMonths: number): boolean {
  return ageMonths >= GP_SCHEDULE.ageEligible.minMonths
    && ageMonths <= GP_SCHEDULE.ageEligible.maxMonths;
}

export function getNextGPMonth(): { month: number; name: string } {
  const now   = new Date();
  const month = now.getMonth() + 1; // 1-based
  // GP months are 1 (January) and 7 (July)
  if (month <= 1)  return { month: 1,  name: 'January' };
  if (month <= 7)  return { month: 7,  name: 'July' };
  return { month: 1, name: 'January (next year)' };
}

export function getDaysUntilNextGP(): number {
  const now       = new Date();
  const year      = now.getFullYear();
  const month     = now.getMonth() + 1;
  // Find next GP month
  let   targetMonth = month <= 1 ? 1 : month <= 7 ? 7 : 1;
  let   targetYear  = year;
  if (targetMonth === 1 && month > 1) targetYear = year + 1;

  const target = new Date(targetYear, targetMonth - 1, 1);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
