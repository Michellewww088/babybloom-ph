/**
 * sleepInsights.ts — WHO/AAP/PPS sleep analysis engine for BabyBloom PH
 * Per-sleep insights + daily summary + optional Claude Haiku narrative
 */
import { SleepEntry, getDurationMinutes } from '../store/sleepStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightType = 'good' | 'tip' | 'warning';

export interface SleepInsight {
  type:     InsightType;
  headline: string;
  detail:   string;
  source:   string;
}

export interface DailySleepSummary {
  totalMinutes:          number;
  totalHours:            number;
  targetMin:             number;
  targetMax:             number;
  napCount:              number;
  nightSleepMinutes:     number;
  napMinutes:            number;
  longestStretchMinutes: number;
  insights:              SleepInsight[];
  overallScore:          'great' | 'good' | 'needs_attention';
  summaryLine:           string;
  ageGroup:              string;
  sleepDebtMinutes:      number;   // negative = deficit, positive = surplus
}

// ─── Age-based WHO Thresholds ─────────────────────────────────────────────────
//   Sources: WHO Sleep Guidelines 2019, AAP, Philippine Pediatric Society

interface SleepThresholds {
  minHours:       number;
  maxHours:       number;
  idealNaps:      number;
  maxNaps:        number;
  minNightHours:  number;
  minNapMinutes:  number;
  maxNapMinutes:  number;
  ageLabel:       string;
}

const getThresholds = (ageMonths: number): SleepThresholds => {
  if (ageMonths <  4) return { minHours: 14, maxHours: 17, idealNaps: 3, maxNaps: 5, minNightHours: 7,  minNapMinutes: 15, maxNapMinutes: 120, ageLabel: 'newborn'   };
  if (ageMonths < 12) return { minHours: 12, maxHours: 15, idealNaps: 2, maxNaps: 3, minNightHours: 9,  minNapMinutes: 30, maxNapMinutes: 120, ageLabel: 'infant'    };
  if (ageMonths < 24) return { minHours: 11, maxHours: 14, idealNaps: 1, maxNaps: 2, minNightHours: 10, minNapMinutes: 60, maxNapMinutes: 120, ageLabel: 'toddler'   };
  if (ageMonths < 36) return { minHours: 11, maxHours: 14, idealNaps: 1, maxNaps: 1, minNightHours: 10, minNapMinutes: 60, maxNapMinutes: 120, ageLabel: 'toddler'   };
  return                     { minHours: 10, maxHours: 13, idealNaps: 0, maxNaps: 1, minNightHours: 10, minNapMinutes: 60, maxNapMinutes: 120, ageLabel: 'preschool' };
};

// ─── Per-sleep Analysis ───────────────────────────────────────────────────────

export const analyzeOneSleep = (
  entry: SleepEntry,
  childAgeMonths: number,
): SleepInsight | null => {
  const t    = getThresholds(childAgeMonths);
  const mins = getDurationMinutes(entry.startedAt, entry.endedAt);
  if (!mins) return null;

  // ── nap analysis ──────────────────────────────────────────────────────────
  if (entry.sleepType === 'nap') {
    if (mins < t.minNapMinutes) {
      return {
        type:     'tip',
        headline: `Short nap (${mins}m) — consider extending`,
        detail:   `For a ${t.ageLabel}, naps ideally last ${t.minNapMinutes}–${t.maxNapMinutes} minutes. Short naps may leave baby overtired. Try a consistent nap schedule.`,
        source:   'WHO Sleep Guidelines',
      };
    }
    if (mins > t.maxNapMinutes) {
      return {
        type:     'tip',
        headline: 'Long nap — watch bedtime tonight',
        detail:   `Naps over ${t.maxNapMinutes} minutes can sometimes push bedtime later. If night sleep is disrupted, try capping naps a bit shorter.`,
        source:   'American Academy of Sleep Medicine',
      };
    }
    return {
      type:     'good',
      headline: `Perfect nap! ${mins}m 🌙`,
      detail:   `${mins} minutes is an ideal nap for baby's age. Naps support brain development, emotional regulation, and memory consolidation.`,
      source:   'WHO Sleep Guidelines',
    };
  }

  // ── night sleep analysis ───────────────────────────────────────────────────
  const nightHours = mins / 60;
  if (nightHours < t.minNightHours - 1) {
    return {
      type:     'warning',
      headline: `Short night sleep — ${nightHours.toFixed(1)}h`,
      detail:   `For a ${t.ageLabel}, at least ${t.minNightHours}h of night sleep is recommended. Consistent early bedtimes (7–8 PM) help extend night sleep naturally.`,
      source:   'WHO & AAP Sleep Guidelines',
    };
  }
  if (entry.quality === 'frequent_waking') {
    return {
      type:     'tip',
      headline: 'Frequent waking — normal at this age',
      detail:   'A consistent bedtime routine (warm bath → feed → soft lullaby) signals sleep time and can reduce night wakings over time. You\'re doing great, Ate! 💪',
      source:   'Philippine Pediatric Society (PPS)',
    };
  }
  if (nightHours >= t.minNightHours) {
    return {
      type:     'good',
      headline: `Great night sleep! ${nightHours.toFixed(1)}h ⭐`,
      detail:   `${nightHours.toFixed(1)} hours of quality night sleep is excellent for a ${t.ageLabel}. Consistent night sleep supports growth hormone release and brain development.`,
      source:   'WHO Sleep Guidelines',
    };
  }
  return null;
};

// ─── Daily Summary Analysis ───────────────────────────────────────────────────

export const analyzeDailySleep = (
  todayEntries: SleepEntry[],
  childAgeMonths: number,
  childName: string,
): DailySleepSummary => {
  const t        = getThresholds(childAgeMonths);
  const insights: SleepInsight[] = [];

  const completed   = todayEntries.filter((e) => !!e.endedAt);
  const nightItems  = completed.filter((e) => e.sleepType === 'night');
  const napItems    = completed.filter((e) => e.sleepType === 'nap');

  const nightMins   = nightItems.reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
  const napMins     = napItems.reduce((s, e)   => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
  const totalMins   = nightMins + napMins;
  const totalHours  = totalMins / 60;

  const durations   = completed.map((e) => getDurationMinutes(e.startedAt, e.endedAt));
  const longest     = durations.length > 0 ? Math.max(...durations) : 0;

  const targetMidMins = ((t.minHours + t.maxHours) / 2) * 60;
  const sleepDebtMins = totalMins - t.minHours * 60;  // negative = deficit

  // ── WHO target check ──────────────────────────────────────────────────────
  if (completed.length > 0) {
    if (totalHours >= t.minHours && totalHours <= t.maxHours) {
      insights.push({
        type:     'good',
        headline: `On track — ${totalHours.toFixed(1)}h today! 🌟`,
        detail:   `${childName} is within the WHO recommended ${t.minHours}–${t.maxHours}h/day for ${t.ageLabel}s. Keep up the great routine!`,
        source:   'WHO Sleep Guidelines',
      });
    } else if (totalHours < t.minHours) {
      const deficit = (t.minHours - totalHours).toFixed(1);
      insights.push({
        type:     'warning',
        headline: `Short by ${deficit}h today 💤`,
        detail:   `${childName} has slept ${totalHours.toFixed(1)}h. WHO recommends ${t.minHours}–${t.maxHours}h/day for ${t.ageLabel}s. An earlier bedtime tonight can help.`,
        source:   'WHO Sleep Guidelines',
      });
    } else if (totalHours > t.maxHours) {
      insights.push({
        type:     'tip',
        headline: 'More sleep than usual',
        detail:   `${totalHours.toFixed(1)}h is above the typical range — this is often normal during growth spurts, illness recovery, or developmental leaps. Monitor tomorrow.`,
        source:   'AAP',
      });
    }
  }

  // ── nap count check ───────────────────────────────────────────────────────
  if (childAgeMonths >= 4 && childAgeMonths < 12 && napItems.length > t.maxNaps) {
    insights.push({
      type:     'tip',
      headline: `${napItems.length} naps today`,
      detail:   `For infants, ${t.idealNaps}–${t.maxNaps} naps is typical. Extra naps during growth spurts are fine, but watch for night sleep disruption.`,
      source:   'WHO',
    });
  }

  if (childAgeMonths >= 4 && childAgeMonths < 12 && napItems.length === 0) {
    insights.push({
      type:     'warning',
      headline: 'No nap recorded today',
      detail:   `Babies under 12 months need daytime naps for healthy brain development. If baby seems tired or fussy, try a short afternoon nap.`,
      source:   'AAP',
    });
  }

  // ── quality / night waking check ──────────────────────────────────────────
  const frequentWaking = completed.filter((e) => e.quality === 'frequent_waking');
  if (frequentWaking.length > 0) {
    insights.push({
      type:     'tip',
      headline: 'Tip: consistent bedtime routine helps',
      detail:   'Bath → feed → song → sleep. Doing the same routine every night helps baby\'s body clock. Most frequent waking improves by 6 months.',
      source:   'Philippine Pediatric Society (PPS)',
    });
  }

  // ── restful quality positive reinforcement ────────────────────────────────
  const allRestful = completed.length > 0 && completed.every((e) => e.quality === 'restful');
  if (allRestful && completed.length >= 2) {
    insights.push({
      type:     'good',
      headline: 'All sleeps restful today 😴',
      detail:   `Restful sleep means baby is getting quality rest — this supports growth, immunity, and development. Great job, ${childName}!`,
      source:   'WHO',
    });
  }

  // ── overall score ─────────────────────────────────────────────────────────
  const hasWarnings = insights.some((i) => i.type === 'warning');
  const hasGood     = insights.some((i) => i.type === 'good');
  let overallScore: 'great' | 'good' | 'needs_attention' = 'good';
  if (!hasWarnings && hasGood)                               overallScore = 'great';
  else if (hasWarnings)                                      overallScore = 'needs_attention';

  // ── summary line ──────────────────────────────────────────────────────────
  let summaryLine = `${childName} has slept ${totalHours.toFixed(1)}h today`;
  if (napItems.length > 0) summaryLine += ` (${napItems.length} nap${napItems.length > 1 ? 's' : ''})`;
  if (overallScore === 'great')           summaryLine += ' — excellent! 🌟';
  else if (overallScore === 'good')       summaryLine += ' — good progress 😊';
  else                                    summaryLine += ' — needs more rest 💤';

  return {
    totalMinutes:          totalMins,
    totalHours,
    targetMin:             t.minHours,
    targetMax:             t.maxHours,
    napCount:              napItems.length,
    nightSleepMinutes:     nightMins,
    napMinutes:            napMins,
    longestStretchMinutes: longest,
    insights,
    overallScore,
    summaryLine,
    ageGroup:              t.ageLabel,
    sleepDebtMinutes:      sleepDebtMins,
  };
};

// ─── Claude Haiku Narrative ───────────────────────────────────────────────────

export const getClaudeSleepSummary = async (
  summary:        DailySleepSummary,
  childName:      string,
  childAgeMonths: number,
  language:       string = 'en',
): Promise<string | null> => {
  const apiKey = (process.env as any).EXPO_PUBLIC_CLAUDE_API_KEY;
  if (!apiKey) return null;

  const langInstruction =
    language === 'fil' ? 'Respond in warm Filipino/Tagalog.' :
    language === 'zh'  ? 'Respond in warm Simplified Chinese.' :
    'Respond in warm English.';

  const prompt = `You are Ate AI, a warm baby health assistant for Filipino parents.
Write a 2-sentence encouraging sleep summary for ${childName} (${childAgeMonths} months old).

Today's sleep data:
- Total sleep: ${summary.totalHours.toFixed(1)}h (WHO target: ${summary.targetMin}–${summary.targetMax}h)
- Night sleep: ${(summary.nightSleepMinutes / 60).toFixed(1)}h
- Naps: ${summary.napCount}
- Longest stretch: ${Math.floor(summary.longestStretchMinutes / 60)}h ${summary.longestStretchMinutes % 60}m
- Score: ${summary.overallScore}

${langInstruction}
Be warm, specific, and encouraging. Max 2 sentences. No bullet points. No disclaimers.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':          apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 160,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
};
