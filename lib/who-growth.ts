/**
 * who-growth.ts — WHO Multicentre Growth Reference Study data
 * Weight-for-age & Height-for-age (boys & girls), 0–24 months
 * Percentiles: 3rd, 15th, 50th, 85th, 97th
 * Source: https://www.who.int/tools/child-growth-standards
 */

export type Sex          = 'male' | 'female';
export type GrowthMetric = 'weight' | 'height' | 'head';

export interface WHOPercentileRow {
  months: number;
  p3:  number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export interface PercentileResult {
  percentile: number;
  label:      'Normal' | 'Watch' | 'Consult Pedia';
  color:      string;
  bgColor:    string;
}

// ─── WHO Weight-for-Age Boys (kg) ─────────────────────────────────────────────
const WHO_WEIGHT_BOYS: WHOPercentileRow[] = [
  { months:  0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.3 },
  { months:  1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.7 },
  { months:  2, p3: 4.4, p15: 5.0, p50: 5.6, p85: 6.3, p97: 7.1 },
  { months:  3, p3: 5.1, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { months:  4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { months:  5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { months:  6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { months:  7, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.2 },
  { months:  8, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.6 },
  { months:  9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { months: 10, p3: 7.4, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { months: 11, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { months: 12, p3: 7.8, p15: 8.7, p50: 9.6, p85: 10.8, p97: 12.0 },
  { months: 13, p3: 8.0, p15: 8.9, p50: 9.9, p85: 11.1, p97: 12.3 },
  { months: 14, p3: 8.2, p15: 9.1, p50: 10.1, p85: 11.3, p97: 12.6 },
  { months: 15, p3: 8.4, p15: 9.3, p50: 10.3, p85: 11.5, p97: 12.8 },
  { months: 16, p3: 8.5, p15: 9.5, p50: 10.5, p85: 11.7, p97: 13.1 },
  { months: 17, p3: 8.7, p15: 9.6, p50: 10.7, p85: 12.0, p97: 13.3 },
  { months: 18, p3: 8.9, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.6 },
  { months: 19, p3: 9.0, p15: 10.0, p50: 11.1, p85: 12.4, p97: 13.8 },
  { months: 20, p3: 9.2, p15: 10.2, p50: 11.3, p85: 12.6, p97: 14.1 },
  { months: 21, p3: 9.3, p15: 10.4, p50: 11.5, p85: 12.9, p97: 14.3 },
  { months: 22, p3: 9.5, p15: 10.5, p50: 11.8, p85: 13.2, p97: 14.6 },
  { months: 23, p3: 9.7, p15: 10.7, p50: 12.0, p85: 13.4, p97: 14.9 },
  { months: 24, p3: 9.8, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

// ─── WHO Weight-for-Age Girls (kg) ───────────────────────────────────────────
const WHO_WEIGHT_GIRLS: WHOPercentileRow[] = [
  { months:  0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { months:  1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { months:  2, p3: 4.0, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { months:  3, p3: 4.6, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { months:  4, p3: 5.1, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { months:  5, p3: 5.5, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { months:  6, p3: 5.7, p15: 6.4, p50: 7.3, p85: 8.2, p97: 9.3 },
  { months:  7, p3: 6.0, p15: 6.7, p50: 7.6, p85: 8.6, p97: 9.7 },
  { months:  8, p3: 6.3, p15: 7.0, p50: 7.9, p85: 8.9, p97: 10.0 },
  { months:  9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.2, p97: 10.4 },
  { months: 10, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.5, p97: 10.7 },
  { months: 11, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.7, p97: 11.0 },
  { months: 12, p3: 7.1, p15: 7.9, p50: 8.9, p85: 10.0, p97: 11.3 },
  { months: 13, p3: 7.3, p15: 8.2, p50: 9.2, p85: 10.3, p97: 11.6 },
  { months: 14, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.6, p97: 11.8 },
  { months: 15, p3: 7.8, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.1 },
  { months: 16, p3: 8.0, p15: 8.8, p50: 9.8, p85: 11.0, p97: 12.4 },
  { months: 17, p3: 8.2, p15: 9.0, p50: 10.0, p85: 11.3, p97: 12.7 },
  { months: 18, p3: 8.4, p15: 9.2, p50: 10.2, p85: 11.5, p97: 12.9 },
  { months: 19, p3: 8.5, p15: 9.4, p50: 10.4, p85: 11.7, p97: 13.2 },
  { months: 20, p3: 8.7, p15: 9.6, p50: 10.6, p85: 11.9, p97: 13.4 },
  { months: 21, p3: 8.9, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.7 },
  { months: 22, p3: 9.0, p15: 10.0, p50: 11.1, p85: 12.4, p97: 13.9 },
  { months: 23, p3: 9.2, p15: 10.1, p50: 11.3, p85: 12.6, p97: 14.2 },
  { months: 24, p3: 9.4, p15: 10.3, p50: 11.5, p85: 12.9, p97: 14.5 },
];

// ─── WHO Height-for-Age Boys (cm) ─────────────────────────────────────────────
const WHO_HEIGHT_BOYS: WHOPercentileRow[] = [
  { months:  0, p3: 46.1, p15: 47.8, p50: 49.9, p85: 51.8, p97: 53.7 },
  { months:  1, p3: 50.8, p15: 52.4, p50: 54.7, p85: 57.0, p97: 58.6 },
  { months:  2, p3: 54.4, p15: 56.0, p50: 58.4, p85: 60.7, p97: 62.2 },
  { months:  3, p3: 57.3, p15: 59.0, p50: 61.4, p85: 63.7, p97: 65.5 },
  { months:  4, p3: 59.7, p15: 61.5, p50: 63.9, p85: 66.2, p97: 68.0 },
  { months:  5, p3: 61.7, p15: 63.6, p50: 65.9, p85: 68.3, p97: 70.1 },
  { months:  6, p3: 63.3, p15: 65.2, p50: 67.6, p85: 70.1, p97: 71.9 },
  { months:  7, p3: 64.8, p15: 66.8, p50: 69.2, p85: 71.6, p97: 73.5 },
  { months:  8, p3: 66.2, p15: 68.2, p50: 70.6, p85: 73.0, p97: 75.0 },
  { months:  9, p3: 67.5, p15: 69.5, p50: 72.0, p85: 74.4, p97: 76.3 },
  { months: 10, p3: 68.7, p15: 70.7, p50: 73.3, p85: 75.7, p97: 77.7 },
  { months: 11, p3: 69.9, p15: 71.9, p50: 74.5, p85: 77.0, p97: 78.9 },
  { months: 12, p3: 71.0, p15: 73.1, p50: 75.7, p85: 78.3, p97: 80.2 },
  { months: 13, p3: 72.1, p15: 74.2, p50: 76.9, p85: 79.5, p97: 81.5 },
  { months: 14, p3: 73.1, p15: 75.2, p50: 78.0, p85: 80.6, p97: 82.7 },
  { months: 15, p3: 74.1, p15: 76.2, p50: 79.1, p85: 81.7, p97: 83.9 },
  { months: 16, p3: 75.0, p15: 77.2, p50: 80.2, p85: 82.9, p97: 85.1 },
  { months: 17, p3: 76.0, p15: 78.2, p50: 81.2, p85: 84.0, p97: 86.2 },
  { months: 18, p3: 76.9, p15: 79.1, p50: 82.3, p85: 85.0, p97: 87.3 },
  { months: 19, p3: 77.7, p15: 80.0, p50: 83.2, p85: 86.0, p97: 88.4 },
  { months: 20, p3: 78.6, p15: 80.9, p50: 84.2, p85: 87.0, p97: 89.5 },
  { months: 21, p3: 79.4, p15: 81.8, p50: 85.1, p85: 88.0, p97: 90.5 },
  { months: 22, p3: 80.2, p15: 82.6, p50: 86.0, p85: 89.0, p97: 91.5 },
  { months: 23, p3: 81.0, p15: 83.5, p50: 86.9, p85: 89.9, p97: 92.5 },
  { months: 24, p3: 81.7, p15: 84.3, p50: 87.8, p85: 90.9, p97: 93.5 },
];

// ─── WHO Height-for-Age Girls (cm) ───────────────────────────────────────────
const WHO_HEIGHT_GIRLS: WHOPercentileRow[] = [
  { months:  0, p3: 45.4, p15: 47.2, p50: 49.1, p85: 51.0, p97: 52.9 },
  { months:  1, p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.4 },
  { months:  2, p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 60.9 },
  { months:  3, p3: 55.6, p15: 57.6, p50: 59.8, p85: 61.9, p97: 63.8 },
  { months:  4, p3: 57.8, p15: 59.9, p50: 62.1, p85: 64.3, p97: 66.2 },
  { months:  5, p3: 59.6, p15: 61.8, p50: 64.0, p85: 66.2, p97: 68.2 },
  { months:  6, p3: 61.2, p15: 63.4, p50: 65.7, p85: 68.0, p97: 70.0 },
  { months:  7, p3: 62.7, p15: 64.9, p50: 67.3, p85: 69.6, p97: 71.6 },
  { months:  8, p3: 64.0, p15: 66.3, p50: 68.7, p85: 71.1, p97: 73.2 },
  { months:  9, p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.5, p97: 74.7 },
  { months: 10, p3: 66.5, p15: 69.0, p50: 71.5, p85: 73.9, p97: 76.1 },
  { months: 11, p3: 67.7, p15: 70.1, p50: 72.8, p85: 75.3, p97: 77.5 },
  { months: 12, p3: 68.9, p15: 71.3, p50: 74.0, p85: 76.6, p97: 78.9 },
  { months: 13, p3: 70.0, p15: 72.5, p50: 75.2, p85: 77.9, p97: 80.2 },
  { months: 14, p3: 71.0, p15: 73.6, p50: 76.4, p85: 79.1, p97: 81.5 },
  { months: 15, p3: 72.0, p15: 74.7, p50: 77.5, p85: 80.3, p97: 82.7 },
  { months: 16, p3: 73.0, p15: 75.7, p50: 78.6, p85: 81.4, p97: 83.9 },
  { months: 17, p3: 74.0, p15: 76.7, p50: 79.7, p85: 82.5, p97: 85.1 },
  { months: 18, p3: 74.9, p15: 77.7, p50: 80.7, p85: 83.7, p97: 86.2 },
  { months: 19, p3: 75.8, p15: 78.6, p50: 81.7, p85: 84.7, p97: 87.3 },
  { months: 20, p3: 76.7, p15: 79.5, p50: 82.7, p85: 85.7, p97: 88.4 },
  { months: 21, p3: 77.5, p15: 80.5, p50: 83.7, p85: 86.8, p97: 89.5 },
  { months: 22, p3: 78.4, p15: 81.4, p50: 84.6, p85: 87.8, p97: 90.6 },
  { months: 23, p3: 79.2, p15: 82.2, p50: 85.5, p85: 88.7, p97: 91.7 },
  { months: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.8, p97: 92.9 },
];

// ─── WHO Head Circumference Boys (cm) ─────────────────────────────────────────
const WHO_HEAD_BOYS: WHOPercentileRow[] = [
  { months:  0, p3: 31.9, p15: 33.0, p50: 34.5, p85: 35.9, p97: 37.0 },
  { months:  1, p3: 34.9, p15: 36.0, p50: 37.3, p85: 38.7, p97: 39.7 },
  { months:  2, p3: 36.8, p15: 37.9, p50: 39.1, p85: 40.4, p97: 41.5 },
  { months:  3, p3: 38.1, p15: 39.2, p50: 40.5, p85: 41.8, p97: 42.9 },
  { months:  4, p3: 39.2, p15: 40.3, p50: 41.6, p85: 42.9, p97: 44.0 },
  { months:  5, p3: 40.1, p15: 41.2, p50: 42.6, p85: 43.9, p97: 44.9 },
  { months:  6, p3: 40.9, p15: 42.0, p50: 43.3, p85: 44.6, p97: 45.7 },
  { months:  7, p3: 41.5, p15: 42.6, p50: 44.0, p85: 45.3, p97: 46.4 },
  { months:  8, p3: 42.0, p15: 43.2, p50: 44.5, p85: 45.9, p97: 46.9 },
  { months:  9, p3: 42.5, p15: 43.7, p50: 45.0, p85: 46.4, p97: 47.4 },
  { months: 10, p3: 42.9, p15: 44.1, p50: 45.5, p85: 46.8, p97: 47.9 },
  { months: 11, p3: 43.3, p15: 44.4, p50: 45.8, p85: 47.2, p97: 48.3 },
  { months: 12, p3: 43.6, p15: 44.8, p50: 46.2, p85: 47.6, p97: 48.7 },
  { months: 15, p3: 44.4, p15: 45.6, p50: 47.0, p85: 48.4, p97: 49.5 },
  { months: 18, p3: 45.1, p15: 46.3, p50: 47.6, p85: 49.1, p97: 50.2 },
  { months: 21, p3: 45.7, p15: 46.8, p50: 48.2, p85: 49.6, p97: 50.7 },
  { months: 24, p3: 46.1, p15: 47.2, p50: 48.6, p85: 50.1, p97: 51.2 },
];

// ─── WHO Head Circumference Girls (cm) ───────────────────────────────────────
const WHO_HEAD_GIRLS: WHOPercentileRow[] = [
  { months:  0, p3: 31.5, p15: 32.5, p50: 33.9, p85: 35.2, p97: 36.2 },
  { months:  1, p3: 34.2, p15: 35.2, p50: 36.5, p85: 37.8, p97: 38.8 },
  { months:  2, p3: 35.8, p15: 36.9, p50: 38.3, p85: 39.6, p97: 40.6 },
  { months:  3, p3: 37.1, p15: 38.2, p50: 39.5, p85: 40.9, p97: 41.9 },
  { months:  4, p3: 38.1, p15: 39.3, p50: 40.6, p85: 42.0, p97: 43.1 },
  { months:  5, p3: 39.0, p15: 40.2, p50: 41.5, p85: 42.9, p97: 44.0 },
  { months:  6, p3: 39.7, p15: 40.9, p50: 42.2, p85: 43.6, p97: 44.7 },
  { months:  7, p3: 40.4, p15: 41.5, p50: 42.9, p85: 44.3, p97: 45.4 },
  { months:  8, p3: 40.9, p15: 42.1, p50: 43.5, p85: 44.9, p97: 45.9 },
  { months:  9, p3: 41.3, p15: 42.6, p50: 44.0, p85: 45.4, p97: 46.4 },
  { months: 10, p3: 41.7, p15: 43.0, p50: 44.4, p85: 45.8, p97: 46.9 },
  { months: 11, p3: 42.1, p15: 43.4, p50: 44.7, p85: 46.2, p97: 47.2 },
  { months: 12, p3: 42.4, p15: 43.7, p50: 45.1, p85: 46.5, p97: 47.6 },
  { months: 15, p3: 43.2, p15: 44.5, p50: 45.9, p85: 47.4, p97: 48.4 },
  { months: 18, p3: 43.8, p15: 45.1, p50: 46.5, p85: 48.0, p97: 49.1 },
  { months: 21, p3: 44.3, p15: 45.6, p50: 47.1, p85: 48.5, p97: 49.6 },
  { months: 24, p3: 44.7, p15: 46.0, p50: 47.5, p85: 49.0, p97: 50.1 },
];

// ─── Data lookup ──────────────────────────────────────────────────────────────
export function getWHOCurveData(sex: Sex, metric: GrowthMetric): WHOPercentileRow[] {
  if (metric === 'weight') return sex === 'male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
  if (metric === 'height') return sex === 'male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
  return sex === 'male' ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
}

// ─── Percentile interpolation ─────────────────────────────────────────────────
/**
 * Returns the approximate WHO percentile for a given measurement.
 * Uses linear interpolation between the 5 known percentile bands.
 */
export function getWHOPercentile(
  sex: Sex,
  metric: GrowthMetric,
  ageMonths: number,
  value: number,
): PercentileResult {
  const data  = getWHOCurveData(sex, metric);
  const age   = Math.max(0, Math.min(Math.round(ageMonths), 24));

  // Find row — exact or interpolate between closest months
  let row = data.find((r) => r.months === age);
  if (!row) {
    const below = [...data].reverse().find((r) => r.months <= age);
    const above = data.find((r) => r.months >= age);
    if (below && above && below !== above) {
      const t = (age - below.months) / (above.months - below.months);
      row = {
        months: age,
        p3:  below.p3  + t * (above.p3  - below.p3),
        p15: below.p15 + t * (above.p15 - below.p15),
        p50: below.p50 + t * (above.p50 - below.p50),
        p85: below.p85 + t * (above.p85 - below.p85),
        p97: below.p97 + t * (above.p97 - below.p97),
      };
    } else {
      row = below ?? above ?? data[0];
    }
  }

  // Map value → approximate percentile
  let pct: number;
  if      (value <= row.p3)  pct = Math.max(1,  3  * (value / row.p3));
  else if (value <= row.p15) pct = 3  + 12 * (value - row.p3)  / (row.p15 - row.p3);
  else if (value <= row.p50) pct = 15 + 35 * (value - row.p15) / (row.p50 - row.p15);
  else if (value <= row.p85) pct = 50 + 35 * (value - row.p50) / (row.p85 - row.p50);
  else if (value <= row.p97) pct = 85 + 12 * (value - row.p85) / (row.p97 - row.p85);
  else                        pct = Math.min(99, 97 + 2 * (value - row.p97) / row.p97);

  pct = Math.round(pct);

  // Zone classification per CLAUDE.md
  // 🟢 Green 15–85th | 🟡 Yellow 5–15th or 85–97th | 🔴 Red < 5th or > 97th
  let label: PercentileResult['label'];
  let color: string;
  let bgColor: string;
  if (pct >= 15 && pct <= 85) {
    label = 'Normal'; color = '#27AE7A'; bgColor = '#E0F7EF';
  } else if (pct >= 5 && pct < 15) {
    label = 'Watch';  color = '#F5A623'; bgColor = '#FFF8E8';
  } else if (pct > 85 && pct <= 97) {
    label = 'Watch';  color = '#F5A623'; bgColor = '#FFF8E8';
  } else {
    label = 'Consult Pedia'; color = '#E63B6F'; bgColor = '#FFE4EE';
  }

  return { percentile: pct, label, color, bgColor };
}

// ─── Corrected age for preterm ────────────────────────────────────────────────
export function getCorrectedAgeMonths(
  ageMonths: number,
  gestationalAgeWeeks?: number,
): number {
  if (!gestationalAgeWeeks || gestationalAgeWeeks >= 37) return ageMonths;
  const correctionMonths = (40 - gestationalAgeWeeks) * 7 / 30.44;
  return Math.max(0, ageMonths - correctionMonths);
}
