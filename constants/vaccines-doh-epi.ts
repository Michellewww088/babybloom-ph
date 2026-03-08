/**
 * vaccines-doh-epi.ts — DOH Philippines EPI Schedule (Complete)
 * Source: Department of Health Philippines Expanded Program on Immunization
 * Always reference this file — never hardcode vaccine data inline.
 */

export interface VaccineEntry {
  code: string;
  nameEN: string;
  nameFIL: string;
  nameZH: string;
  protectsAgainst: { en: string; fil: string; zh: string };
  doses: number;
  route: string;
  isFreeEPI: boolean;
  sideEffects: string;
  postVaccineCare: string;
  whereToGet: { en: string; fil: string; zh: string };
}

export interface AgeGroup {
  ageLabel: { en: string; fil: string; zh: string };
  recommendedAgeWeeks: number;
  vaccines: VaccineEntry[];
}

export const DOH_EPI_SCHEDULE: AgeGroup[] = [
  {
    ageLabel: { en: 'At Birth', fil: 'Sa Kapanganakan', zh: '出生时' },
    recommendedAgeWeeks: 0,
    vaccines: [
      {
        code: 'BCG',
        nameEN: 'BCG (Bacillus Calmette-Guérin)',
        nameFIL: 'BCG (Bakuna laban sa Tuberculosis)',
        nameZH: '卡介苗（BCG）',
        protectsAgainst: { en: 'Tuberculosis (TB)', fil: 'Tuberculosis (TB)', zh: '结核病' },
        doses: 1,
        route: 'Intradermal injection (left upper arm)',
        isFreeEPI: true,
        sideEffects:
          'Small raised bump at injection site → forms a scar after 2–3 months. Normal.',
        postVaccineCare:
          'Do not apply anything to the injection site. The scar is expected and normal.',
        whereToGet: {
          en: 'Free at hospital maternity ward or Barangay Health Station (BHS)',
          fil: 'Libre sa ospital o Barangay Health Station (BHS)',
          zh: '在医院产房或社区卫生站免费接种',
        },
      },
      {
        code: 'HepB1',
        nameEN: 'Hepatitis B (1st dose)',
        nameFIL: 'Hepatitis B (Unang Dosis)',
        nameZH: '乙型肝炎疫苗（第1剂）',
        protectsAgainst: {
          en: 'Hepatitis B (liver disease)',
          fil: 'Hepatitis B (sakit sa atay)',
          zh: '乙型肝炎（肝病）',
        },
        doses: 3,
        route: 'Intramuscular injection (thigh)',
        isFreeEPI: true,
        sideEffects: 'Mild soreness at injection site. Low-grade fever possible.',
        postVaccineCare:
          'Paracetamol if fever develops. Consult Pedia if fever > 38.5°C.',
        whereToGet: {
          en: 'Free at hospital maternity ward or BHS',
          fil: 'Libre sa ospital o BHS',
          zh: '在医院产房或社区卫生站免费接种',
        },
      },
    ],
  },
  {
    ageLabel: { en: '6 Weeks (1.5 Months)', fil: '6 Linggo (1.5 Buwan)', zh: '6周（1.5个月）' },
    recommendedAgeWeeks: 6,
    vaccines: [
      {
        code: 'Penta1',
        nameEN: 'Pentavalent / DPT-HepB-Hib (1st dose)',
        nameFIL: 'Pentavalent (Unang Dosis)',
        nameZH: '五联疫苗（第1剂）',
        protectsAgainst: {
          en: 'Diphtheria, Pertussis (whooping cough), Tetanus, Hepatitis B, Hib meningitis',
          fil: 'Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib meningitis',
          zh: '白喉、百日咳、破伤风、乙肝、Hib脑膜炎',
        },
        doses: 3,
        route: 'Intramuscular injection (thigh)',
        isFreeEPI: true,
        sideEffects: 'Mild fever, fussiness, soreness at injection site for 1–2 days.',
        postVaccineCare: 'Paracetamol (per weight) if fever. Cool compress on injection site.',
        whereToGet: {
          en: 'Free at BHS or RHU',
          fil: 'Libre sa BHS o RHU',
          zh: '在社区卫生站或农村卫生所免费接种',
        },
      },
      {
        code: 'OPV1',
        nameEN: 'OPV (Oral Polio Vaccine) 1st dose',
        nameFIL: 'OPV (Oral na Bakuna laban sa Polio) Unang Dosis',
        nameZH: '口服脊髓灰质炎疫苗（第1剂）',
        protectsAgainst: { en: 'Polio', fil: 'Polio', zh: '脊髓灰质炎（小儿麻痹症）' },
        doses: 3,
        route: 'Oral (2 drops by mouth)',
        isFreeEPI: true,
        sideEffects: 'Generally none. Rarely: mild stomach upset.',
        postVaccineCare: 'Do not feed or give water for 30 minutes after.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'PCV1',
        nameEN: 'PCV (Pneumococcal Conjugate Vaccine) 1st dose',
        nameFIL: 'PCV (Bakuna laban sa Pneumonia) Unang Dosis',
        nameZH: '肺炎球菌疫苗（第1剂）',
        protectsAgainst: {
          en: 'Pneumonia, meningitis caused by Streptococcus pneumoniae',
          fil: 'Pneumonia at meningitis',
          zh: '肺炎、脑膜炎',
        },
        doses: 3,
        route: 'Intramuscular (thigh)',
        isFreeEPI: true,
        sideEffects: 'Mild fever, soreness.',
        postVaccineCare: 'Paracetamol if needed.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'Rota1',
        nameEN: 'Rotavirus Vaccine (1st dose)',
        nameFIL: 'Rotavirus (Unang Dosis)',
        nameZH: '轮状病毒疫苗（第1剂）',
        protectsAgainst: {
          en: 'Severe rotavirus diarrhea',
          fil: 'Mabigat na pagtatae dahil sa Rotavirus',
          zh: '轮状病毒性腹泻',
        },
        doses: 2,
        route: 'Oral',
        isFreeEPI: true,
        sideEffects: 'Mild irritability, temporary diarrhea.',
        postVaccineCare:
          'Watch for signs of intussusception (severe crying, blood in stool) — rare but call Pedia if occurs.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
    ],
  },
  {
    ageLabel: { en: '10 Weeks (2.5 Months)', fil: '10 Linggo (2.5 Buwan)', zh: '10周（2.5个月）' },
    recommendedAgeWeeks: 10,
    vaccines: [
      {
        code: 'Penta2',
        nameEN: 'Pentavalent (2nd dose)',
        nameFIL: 'Pentavalent (Ikalawang Dosis)',
        nameZH: '五联疫苗（第2剂）',
        protectsAgainst: {
          en: 'Same as 1st dose',
          fil: 'Katulad ng unang dosis',
          zh: '同第1剂',
        },
        doses: 3,
        route: 'IM injection (thigh)',
        isFreeEPI: true,
        sideEffects: 'Same as 1st dose.',
        postVaccineCare: 'Same as 1st dose.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'OPV2',
        nameEN: 'OPV (2nd dose)',
        nameFIL: 'OPV (Ikalawang Dosis)',
        nameZH: '口服脊髓灰质炎疫苗（第2剂）',
        protectsAgainst: { en: 'Polio', fil: 'Polio', zh: '脊髓灰质炎' },
        doses: 3,
        route: 'Oral',
        isFreeEPI: true,
        sideEffects: 'None expected.',
        postVaccineCare: 'No food/water for 30 min.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'PCV2',
        nameEN: 'PCV (2nd dose)',
        nameFIL: 'PCV (Ikalawang Dosis)',
        nameZH: '肺炎球菌疫苗（第2剂）',
        protectsAgainst: { en: 'Pneumonia, meningitis', fil: 'Pneumonia at meningitis', zh: '肺炎、脑膜炎' },
        doses: 3,
        route: 'IM injection',
        isFreeEPI: true,
        sideEffects: 'Mild fever, soreness.',
        postVaccineCare: 'Paracetamol if needed.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'Rota2',
        nameEN: 'Rotavirus (2nd dose)',
        nameFIL: 'Rotavirus (Ikalawang Dosis)',
        nameZH: '轮状病毒疫苗（第2剂）',
        protectsAgainst: {
          en: 'Severe rotavirus diarrhea',
          fil: 'Pagtatae dahil sa Rotavirus',
          zh: '轮状病毒性腹泻',
        },
        doses: 2,
        route: 'Oral',
        isFreeEPI: true,
        sideEffects: 'Mild irritability.',
        postVaccineCare: 'Watch for intussusception signs.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
    ],
  },
  {
    ageLabel: { en: '14 Weeks (3.5 Months)', fil: '14 Linggo (3.5 Buwan)', zh: '14周（3.5个月）' },
    recommendedAgeWeeks: 14,
    vaccines: [
      {
        code: 'Penta3',
        nameEN: 'Pentavalent (3rd dose)',
        nameFIL: 'Pentavalent (Ikatlong Dosis)',
        nameZH: '五联疫苗（第3剂）',
        protectsAgainst: { en: 'DPT, Hep B, Hib', fil: 'DPT, Hep B, Hib', zh: '白破百、乙肝、Hib' },
        doses: 3,
        route: 'IM injection',
        isFreeEPI: true,
        sideEffects: 'Same as previous doses.',
        postVaccineCare: 'Paracetamol if fever.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'OPV3',
        nameEN: 'OPV (3rd dose)',
        nameFIL: 'OPV (Ikatlong Dosis)',
        nameZH: '口服脊髓灰质炎疫苗（第3剂）',
        protectsAgainst: { en: 'Polio', fil: 'Polio', zh: '脊髓灰质炎' },
        doses: 3,
        route: 'Oral',
        isFreeEPI: true,
        sideEffects: 'None expected.',
        postVaccineCare: 'No food/water for 30 min.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'IPV1',
        nameEN: 'IPV (Inactivated Polio Vaccine) 1st dose',
        nameFIL: 'IPV (Iniksyon na Bakuna laban sa Polio) Unang Dosis',
        nameZH: '灭活脊髓灰质炎疫苗（第1剂）',
        protectsAgainst: {
          en: 'Polio (inactivated, injected — stronger protection)',
          fil: 'Polio (iniksyon)',
          zh: '脊髓灰质炎（注射型）',
        },
        doses: 1,
        route: 'Subcutaneous injection',
        isFreeEPI: true,
        sideEffects: 'Mild soreness.',
        postVaccineCare: 'Cool compress if needed.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'PCV3',
        nameEN: 'PCV (3rd dose)',
        nameFIL: 'PCV (Ikatlong Dosis)',
        nameZH: '肺炎球菌疫苗（第3剂）',
        protectsAgainst: { en: 'Pneumonia, meningitis', fil: 'Pneumonia at meningitis', zh: '肺炎、脑膜炎' },
        doses: 3,
        route: 'IM injection',
        isFreeEPI: true,
        sideEffects: 'Mild fever.',
        postVaccineCare: 'Paracetamol if needed.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
    ],
  },
  {
    ageLabel: { en: '6 Months', fil: '6 Buwan', zh: '6个月' },
    recommendedAgeWeeks: 26,
    vaccines: [
      {
        code: 'Flu1',
        nameEN: 'Influenza Vaccine (1st dose — 2 doses needed for first-timers)',
        nameFIL: 'Influenza (Trangkaso) Bakuna – Unang Dosis',
        nameZH: '流感疫苗（首次接种第1剂，需打2剂）',
        protectsAgainst: {
          en: 'Seasonal influenza (flu)',
          fil: 'Trangkaso',
          zh: '季节性流感',
        },
        doses: 2,
        route: 'IM injection',
        isFreeEPI: false,
        sideEffects: 'Soreness at injection site, mild fever.',
        postVaccineCare: 'Annual vaccination recommended.',
        whereToGet: {
          en: 'Private clinics and hospitals (approx. ₱800–₱1,500 per dose)',
          fil: 'Sa pribadong klinika (mga ₱800–₱1,500 bawat dosis)',
          zh: '私立诊所（约₱800–₱1,500/剂）',
        },
      },
    ],
  },
  {
    ageLabel: { en: '9 Months', fil: '9 Buwan', zh: '9个月' },
    recommendedAgeWeeks: 39,
    vaccines: [
      {
        code: 'MMR1',
        nameEN: 'MMR (Measles-Mumps-Rubella) 1st dose',
        nameFIL: 'MMR (Tigdas, Beke, Rubella) Unang Dosis',
        nameZH: '麻疹-腮腺炎-风疹疫苗（第1剂）',
        protectsAgainst: {
          en: 'Measles (tigdas), Mumps (beke), Rubella (German measles)',
          fil: 'Tigdas, Beke, Rubella',
          zh: '麻疹、腮腺炎、风疹',
        },
        doses: 2,
        route: 'Subcutaneous injection',
        isFreeEPI: true,
        sideEffects: 'Mild rash, low fever 7–12 days after vaccine. Normal.',
        postVaccineCare:
          'Rash and mild fever after 1 week are normal — do not need to see Pedia unless high fever.',
        whereToGet: {
          en: 'Free at BHS or RHU',
          fil: 'Libre sa BHS o RHU',
          zh: '在社区卫生站免费接种',
        },
      },
      {
        code: 'HepA1',
        nameEN: 'Hepatitis A (1st dose)',
        nameFIL: 'Hepatitis A (Unang Dosis)',
        nameZH: '甲型肝炎疫苗（第1剂）',
        protectsAgainst: {
          en: 'Hepatitis A (liver disease spread through contaminated food/water)',
          fil: 'Hepatitis A (sakit sa atay mula sa maruming pagkain/tubig)',
          zh: '甲型肝炎（经食物/水传播的肝病）',
        },
        doses: 2,
        route: 'IM injection',
        isFreeEPI: false,
        sideEffects: 'Soreness at injection site, mild fever.',
        postVaccineCare: 'Follow-up 2nd dose at 6 months later.',
        whereToGet: {
          en: 'Private clinics (approx. ₱1,500–₱2,500 per dose)',
          fil: 'Sa pribadong klinika (mga ₱1,500–₱2,500)',
          zh: '私立诊所（约₱1,500–₱2,500/剂）',
        },
      },
    ],
  },
  {
    ageLabel: { en: '12 Months (1 Year)', fil: '12 Buwan (1 Taon)', zh: '12个月（1岁）' },
    recommendedAgeWeeks: 52,
    vaccines: [
      {
        code: 'Varicella1',
        nameEN: 'Varicella (Chickenpox) 1st dose',
        nameFIL: 'Varicella (Bulutong-tubig) Unang Dosis',
        nameZH: '水痘疫苗（第1剂）',
        protectsAgainst: {
          en: 'Chickenpox (bulutong-tubig)',
          fil: 'Bulutong-tubig',
          zh: '水痘',
        },
        doses: 2,
        route: 'Subcutaneous injection',
        isFreeEPI: false,
        sideEffects: 'Mild rash, low fever.',
        postVaccineCare: 'Mild chickenpox-like rash can appear — normal.',
        whereToGet: {
          en: 'Private clinics (approx. ₱1,500–₱2,000)',
          fil: 'Sa pribadong klinika (mga ₱1,500–₱2,000)',
          zh: '私立诊所（约₱1,500–₱2,000）',
        },
      },
      {
        code: 'HepA2',
        nameEN: 'Hepatitis A (2nd dose)',
        nameFIL: 'Hepatitis A (Ikalawang Dosis)',
        nameZH: '甲型肝炎疫苗（第2剂）',
        protectsAgainst: { en: 'Hepatitis A', fil: 'Hepatitis A', zh: '甲型肝炎' },
        doses: 2,
        route: 'IM injection',
        isFreeEPI: false,
        sideEffects: 'Soreness, mild fever.',
        postVaccineCare: 'None special.',
        whereToGet: {
          en: 'Private clinics',
          fil: 'Pribadong klinika',
          zh: '私立诊所',
        },
      },
    ],
  },
  {
    ageLabel: { en: '12–15 Months', fil: '12–15 Buwan', zh: '12–15个月' },
    recommendedAgeWeeks: 54,
    vaccines: [
      {
        code: 'MMR2',
        nameEN: 'MMR (2nd dose)',
        nameFIL: 'MMR (Ikalawang Dosis)',
        nameZH: '麻疹-腮腺炎-风疹疫苗（第2剂）',
        protectsAgainst: {
          en: 'Measles, Mumps, Rubella',
          fil: 'Tigdas, Beke, Rubella',
          zh: '麻疹、腮腺炎、风疹',
        },
        doses: 2,
        route: 'Subcutaneous injection',
        isFreeEPI: true,
        sideEffects: 'Same as 1st dose.',
        postVaccineCare: 'Same as 1st dose.',
        whereToGet: {
          en: 'Free at BHS or RHU',
          fil: 'Libre sa BHS o RHU',
          zh: '在社区卫生站免费接种',
        },
      },
    ],
  },
  {
    ageLabel: { en: '15–18 Months', fil: '15–18 Buwan', zh: '15–18个月' },
    recommendedAgeWeeks: 65,
    vaccines: [
      {
        code: 'DPTBooster',
        nameEN: 'DPT Booster (Pentavalent Booster)',
        nameFIL: 'DPT Booster',
        nameZH: '百白破加强针',
        protectsAgainst: {
          en: 'Diphtheria, Pertussis, Tetanus',
          fil: 'Diphtheria, Pertussis, Tetanus',
          zh: '白喉、百日咳、破伤风',
        },
        doses: 1,
        route: 'IM injection',
        isFreeEPI: true,
        sideEffects: 'Soreness, mild fever.',
        postVaccineCare: 'Paracetamol if fever.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
      {
        code: 'OPVBooster',
        nameEN: 'OPV Booster',
        nameFIL: 'OPV Booster',
        nameZH: '口服脊髓灰质炎疫苗加强',
        protectsAgainst: { en: 'Polio', fil: 'Polio', zh: '脊髓灰质炎' },
        doses: 1,
        route: 'Oral',
        isFreeEPI: true,
        sideEffects: 'None expected.',
        postVaccineCare: 'No food/water for 30 min.',
        whereToGet: { en: 'Free at BHS or RHU', fil: 'Libre sa BHS o RHU', zh: '在社区卫生站免费接种' },
      },
    ],
  },
  {
    ageLabel: { en: '3–5 Years', fil: '3–5 Taon', zh: '3–5岁' },
    recommendedAgeWeeks: 156,
    vaccines: [
      {
        code: 'Typhoid',
        nameEN: 'Typhoid Vaccine',
        nameFIL: 'Bakuna laban sa Typhoid',
        nameZH: '伤寒疫苗',
        protectsAgainst: {
          en: 'Typhoid fever (very common in Philippines)',
          fil: 'Typhoid (karaniwan sa Pilipinas)',
          zh: '伤寒（菲律宾常见病）',
        },
        doses: 1,
        route: 'IM injection or oral',
        isFreeEPI: false,
        sideEffects: 'Mild soreness, low fever.',
        postVaccineCare: 'Booster every 3 years.',
        whereToGet: {
          en: 'Private clinics (approx. ₱800–₱1,200)',
          fil: 'Pribadong klinika (mga ₱800–₱1,200)',
          zh: '私立诊所（约₱800–₱1,200）',
        },
      },
    ],
  },
];

/** Flat list of all vaccines (useful for lookup by code) */
export const ALL_VACCINES: VaccineEntry[] = DOH_EPI_SCHEDULE.flatMap((g) => g.vaccines);

/** Get a vaccine entry by code */
export function getVaccineByCode(code: string): VaccineEntry | undefined {
  return ALL_VACCINES.find((v) => v.code === code);
}

/** Get the age group for a given vaccine code */
export function getAgeGroupForVaccine(code: string): AgeGroup | undefined {
  return DOH_EPI_SCHEDULE.find((g) => g.vaccines.some((v) => v.code === code));
}

/** Calculate the scheduled date for a vaccine given a birthday */
export function calcScheduledDate(birthday: string, recommendedAgeWeeks: number): string {
  const bd = new Date(birthday);
  bd.setDate(bd.getDate() + recommendedAgeWeeks * 7);
  return bd.toISOString().split('T')[0];
}

/** Calculate 7-day reminder date */
export function calcReminderDate(scheduledDate: string): string {
  const d = new Date(scheduledDate);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}
