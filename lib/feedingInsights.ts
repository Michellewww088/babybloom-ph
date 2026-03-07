/**
 * lib/feedingInsights.ts
 * Rule-based feeding analysis engine aligned with WHO/DOH Philippines guidelines.
 * Optional Claude API for a conversational AI summary (requires EXPO_PUBLIC_CLAUDE_API_KEY).
 *
 * Sources:
 *  - WHO Infant and Young Child Feeding Guidelines (2023)
 *  - DOH Philippines IYCF Guidelines
 *  - Philippine Pediatric Society (PPS)
 *  - UNICEF Philippines
 */

import type { FeedingEntry } from '../store/feedingStore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type InsightType = 'good' | 'tip' | 'warning';

export interface FeedInsight {
  type:     InsightType;
  headline: string;   // 1 short sentence shown in bold
  detail:   string;   // 1–2 supporting sentences
  source:   string;   // e.g. "WHO 2023", "DOH Philippines"
}

export interface DailySummaryInsight {
  feedCount:        number;
  recommendedMin:   number;
  recommendedMax:   number;
  totalVolumeMl:    number;
  breastfeedCount:  number;
  bottleCount:      number;
  solidsCount:      number;
  longestGapMins:   number;
  shortestGapMins:  number;
  insights:         FeedInsight[];
  overallScore:     'great' | 'good' | 'needs_attention';
  summaryLine:      string;
}

// ── Age-based WHO Thresholds ───────────────────────────────────────────────────

interface AgeThresholds {
  minFeeds:     number;
  maxFeeds:     number;
  minDurMins:   number;
  maxDurMins:   number;
  maxGapMins:   number;
  minVolBottle: number;
  maxVolBottle: number;
  solidsOk:     boolean;
  label:        string;
}

function getThresholds(ageMonths: number): AgeThresholds {
  if (ageMonths < 1)  return { minFeeds: 8,  maxFeeds: 12, minDurMins: 10, maxDurMins: 45, maxGapMins: 180, minVolBottle: 30,  maxVolBottle: 90,  solidsOk: false, label: '0–1 month' };
  if (ageMonths < 3)  return { minFeeds: 8,  maxFeeds: 12, minDurMins: 10, maxDurMins: 40, maxGapMins: 210, minVolBottle: 60,  maxVolBottle: 150, solidsOk: false, label: '1–3 months' };
  if (ageMonths < 6)  return { minFeeds: 6,  maxFeeds: 8,  minDurMins: 8,  maxDurMins: 35, maxGapMins: 240, minVolBottle: 120, maxVolBottle: 210, solidsOk: false, label: '3–6 months' };
  if (ageMonths < 9)  return { minFeeds: 4,  maxFeeds: 6,  minDurMins: 5,  maxDurMins: 25, maxGapMins: 300, minVolBottle: 150, maxVolBottle: 240, solidsOk: true,  label: '6–9 months' };
  if (ageMonths < 12) return { minFeeds: 3,  maxFeeds: 5,  minDurMins: 5,  maxDurMins: 20, maxGapMins: 360, minVolBottle: 150, maxVolBottle: 240, solidsOk: true,  label: '9–12 months' };
  return                     { minFeeds: 2,  maxFeeds: 3,  minDurMins: 5,  maxDurMins: 20, maxGapMins: 480, minVolBottle: 150, maxVolBottle: 240, solidsOk: true,  label: '12+ months' };
}

// ── Per-Feed Analysis ──────────────────────────────────────────────────────────

/**
 * Analyze a single feed entry against WHO/PPS guidelines for the child's age.
 * Returns a single FeedInsight to display immediately after saving.
 */
export function analyzeOneFeed(
  entry:           FeedingEntry,
  childAgeMonths:  number,
): FeedInsight {
  const th = getThresholds(childAgeMonths);

  // ── Breastfeed ────────────────────────────────────────────────────────────
  if (entry.feedType === 'breastfeed') {
    const dur = entry.durationMinutes ?? 0;

    if (dur > 0 && dur < th.minDurMins) {
      return {
        type: 'tip',
        headline: `Short session (${dur} min) — is baby still hungry?`,
        detail: `At this age, sessions usually last ${th.minDurMins}–${th.maxDurMins} min. If baby unlatched early, try burping and offering the breast again.`,
        source: 'WHO 2023',
      };
    }
    if (dur > th.maxDurMins) {
      return {
        type: 'tip',
        headline: `Long session (${dur} min) — check the latch`,
        detail: `Sessions over ${th.maxDurMins} min may signal a shallow latch or low supply. A certified lactation consultant (IBCLC) can help.`,
        source: 'Philippine Pediatric Society',
      };
    }
    if (entry.breastSide === 'both') {
      return {
        type: 'good',
        headline: 'Both sides offered — excellent!',
        detail: 'Offering both breasts ensures full drainage and helps maintain your milk supply. Keep it up! 🤱',
        source: 'WHO 2023',
      };
    }
    if (entry.pauseIntervals && entry.pauseIntervals.length > 0) {
      return {
        type: 'tip',
        headline: `${entry.pauseIntervals.length} pause${entry.pauseIntervals.length > 1 ? 's' : ''} recorded`,
        detail: 'Frequent pauses are normal if baby needs burping. Active nursing time is what counts for milk transfer.',
        source: 'Philippine Pediatric Society',
      };
    }
    return {
      type: 'good',
      headline: dur > 0 ? `${dur}-minute session logged!` : 'Breastfeed logged!',
      detail: "You're doing an amazing job. Breast milk is the best nutrition for your baby. 💕",
      source: 'DOH Philippines',
    };
  }

  // ── Bottle ────────────────────────────────────────────────────────────────
  if (entry.feedType === 'bottle') {
    const vol = entry.volumeMl ?? 0;
    if (vol > 0 && vol < th.minVolBottle) {
      return {
        type: 'tip',
        headline: `Small volume (${vol} ml) — okay if feeding often`,
        detail: `Typical bottle feeds at this age are ${th.minVolBottle}–${th.maxVolBottle} ml. Small, frequent feeds are fine for young babies.`,
        source: 'WHO 2023',
      };
    }
    if (vol > th.maxVolBottle) {
      return {
        type: 'warning',
        headline: `Large volume (${vol} ml) — watch for overfeeding`,
        detail: `More than ${th.maxVolBottle} ml per feed at this age may lead to overfeeding. Try paced bottle feeding. Consult your Pedia if frequent.`,
        source: 'Philippine Pediatric Society',
      };
    }
    if (vol > 0) {
      return {
        type: 'good',
        headline: `${vol} ml — right on target! 🍼`,
        detail: `Within the recommended ${th.minVolBottle}–${th.maxVolBottle} ml range for ${th.label}.`,
        source: 'WHO 2023',
      };
    }
    return { type: 'good', headline: 'Bottle feed logged!', detail: 'Tip: Add the volume next time for better tracking.', source: 'DOH Philippines' };
  }

  // ── Solids ────────────────────────────────────────────────────────────────
  if (!th.solidsOk) {
    return {
      type: 'warning',
      headline: 'Solids before 6 months — check with your Pedia',
      detail: 'DOH Philippines and WHO recommend exclusive breastfeeding for the first 6 months. Always consult your Pediatrician before introducing solids.',
      source: 'DOH Philippines',
    };
  }
  if (entry.reaction === 'allergic') {
    return {
      type: 'warning',
      headline: `Allergic reaction to ${entry.foodItem ?? 'this food'} — stop and consult`,
      detail: 'Stop offering this food and contact your Pedia right away. Watch for: rash, swelling, vomiting, or breathing difficulty.',
      source: 'Philippine Pediatric Society',
    };
  }
  if (entry.isFirstFood) {
    return {
      type: 'good',
      headline: `First time trying ${entry.foodItem}! 🎉`,
      detail: 'Offer the same food 3–5 times over a week before introducing another. Watch for any reaction over 48 hours.',
      source: 'WHO 2023',
    };
  }
  if (entry.reaction === 'mild') {
    return {
      type: 'tip',
      headline: `Mild reaction noted to ${entry.foodItem ?? 'food'}`,
      detail: "A mild reaction could be normal adjustment. Note symptoms and mention it at your next Pedia visit. Skip this food for a few days.",
      source: 'Philippine Pediatric Society',
    };
  }
  return {
    type: 'good',
    headline: `${entry.foodItem ?? 'Solids'} enjoyed! 🥗`,
    detail: 'Great variety builds a healthy palate. Continue mixing Filipino superfoods like malunggay, kamote, and kalabasa.',
    source: 'DOH Philippines',
  };
}

// ── Daily Summary Analysis ─────────────────────────────────────────────────────

/**
 * Analyze the full set of today's entries against WHO/DOH guidelines.
 * Returns a structured summary with color-coded bullet insights.
 */
export function analyzeDailyFeeding(
  todayEntries:   FeedingEntry[],
  childAgeMonths: number,
  childName:      string,
): DailySummaryInsight {
  const th = getThresholds(childAgeMonths);

  const sorted = [...todayEntries].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  const feedCount       = sorted.length;
  const totalVolumeMl   = sorted.reduce((s, e) => s + (e.volumeMl ?? 0), 0);
  const breastfeedCount = sorted.filter((e) => e.feedType === 'breastfeed').length;
  const bottleCount     = sorted.filter((e) => e.feedType === 'bottle').length;
  const solidsCount     = sorted.filter((e) => e.feedType === 'solids').length;

  // Gap analysis
  let longestGapMins  = 0;
  let shortestGapMins = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const gap = Math.floor(
      (new Date(sorted[i].startedAt).getTime() - new Date(sorted[i - 1].startedAt).getTime()) / 60000,
    );
    longestGapMins  = Math.max(longestGapMins, gap);
    shortestGapMins = Math.min(shortestGapMins, gap);
  }
  if (shortestGapMins === Infinity) shortestGapMins = 0;

  const insights: FeedInsight[] = [];

  // 1. Feed count
  if (feedCount === 0) {
    insights.push({ type: 'tip', headline: 'No feeds logged yet today', detail: `${childName} needs ${th.minFeeds}–${th.maxFeeds} feeds at this age. Tap + to log the first one!`, source: 'WHO 2023' });
  } else if (feedCount < th.minFeeds) {
    insights.push({ type: 'tip', headline: `${feedCount} feeds so far — aim for ${th.minFeeds}+`, detail: `${th.minFeeds}–${th.maxFeeds} feeds per day is recommended at ${th.label}. Keep going!`, source: 'WHO 2023' });
  } else if (feedCount <= th.maxFeeds) {
    insights.push({ type: 'good', headline: `${feedCount} feeds — on track! ✅`, detail: `Right within the recommended ${th.minFeeds}–${th.maxFeeds} range for ${th.label}. Excellent work!`, source: 'WHO 2023' });
  } else {
    insights.push({ type: 'tip', headline: `${feedCount} feeds — very frequent`, detail: 'Frequent feeds are normal for young babies. If bottle-feeding, ensure volumes are not too large per feed to prevent overfeeding.', source: 'Philippine Pediatric Society' });
  }

  // 2. Breastfeeding alignment
  if (childAgeMonths < 6 && breastfeedCount > 0) {
    insights.push({ type: 'good', headline: `${breastfeedCount} breastfeed${breastfeedCount > 1 ? 's' : ''} today 🤱`, detail: "Breast milk provides the ideal nutrition and immunity for babies under 6 months. You're giving your baby the best start!", source: 'DOH Philippines' });
  } else if (childAgeMonths < 6 && bottleCount > 0 && breastfeedCount === 0) {
    insights.push({ type: 'tip', headline: 'No breastfeeds today', detail: 'DOH Philippines recommends exclusive breastfeeding for 6 months. If supply is a concern, a lactation consultant can help you.', source: 'DOH Philippines' });
  }

  // 3. Gap analysis
  if (longestGapMins > th.maxGapMins && feedCount > 1) {
    const gapH = Math.floor(longestGapMins / 60);
    const gapM = longestGapMins % 60;
    insights.push({ type: 'warning', headline: `Long gap: ${gapH}h ${gapM > 0 ? `${gapM}m` : ''} between feeds`, detail: `At this age, gaps over ${Math.floor(th.maxGapMins / 60)}h may mean baby is sleeping too long or missing hunger cues. Discuss with your Pedia.`, source: 'Philippine Pediatric Society' });
  }

  // 4. Solids progress
  if (solidsCount > 0 && childAgeMonths >= 6) {
    insights.push({ type: 'good', headline: `${solidsCount} solid meal${solidsCount > 1 ? 's' : ''} today 🥗`, detail: 'Great variety! Continue mixing solids with breast milk or formula throughout the first year.', source: 'WHO 2023' });
  }

  // 5. Total volume for bottle feeders
  if (bottleCount > 0 && totalVolumeMl > 0) {
    const avgVol = Math.round(totalVolumeMl / bottleCount);
    if (avgVol >= th.minVolBottle && avgVol <= th.maxVolBottle) {
      insights.push({ type: 'good', headline: `Avg ${avgVol} ml/bottle — perfect 👍`, detail: `Consistent with the ${th.minVolBottle}–${th.maxVolBottle} ml recommendation for ${th.label}.`, source: 'WHO 2023' });
    }
  }

  // Overall score
  const hasWarnings = insights.some((i) => i.type === 'warning');
  const isOnTrack   = feedCount >= th.minFeeds && feedCount <= th.maxFeeds;

  const overallScore: DailySummaryInsight['overallScore'] =
    hasWarnings                        ? 'needs_attention'
    : isOnTrack                         ? 'great'
    :                                     'good';

  const summaryLine =
    overallScore === 'great'            ? `Great feeding day for ${childName}! 🌟`
    : overallScore === 'needs_attention' ? `A few things to review for ${childName} 👀`
    :                                      `Good progress for ${childName} today 💪`;

  return {
    feedCount,
    recommendedMin:  th.minFeeds,
    recommendedMax:  th.maxFeeds,
    totalVolumeMl,
    breastfeedCount,
    bottleCount,
    solidsCount,
    longestGapMins,
    shortestGapMins: shortestGapMins === Infinity ? 0 : shortestGapMins,
    insights,
    overallScore,
    summaryLine,
  };
}

// ── Optional Claude API ────────────────────────────────────────────────────────

const CLAUDE_API_KEY =
  typeof process !== 'undefined' && process.env
    ? (process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '')
    : '';

/**
 * Call Claude Haiku for a warm, conversational daily feeding summary.
 * Returns null if the API key is not configured or the request fails.
 * The caller falls back to rule-based `summaryLine` in that case.
 */
export async function getClaudeDailySummary(
  summary:        DailySummaryInsight,
  childName:      string,
  childAgeMonths: number,
  language:       'en' | 'fil' | 'zh' = 'en',
): Promise<string | null> {
  if (!CLAUDE_API_KEY) return null;

  const langLabel = language === 'fil' ? 'Filipino/Tagalog' : language === 'zh' ? 'Simplified Chinese' : 'English';

  const prompt = `You are Ate AI for BabyBloom PH — a warm, encouraging baby health assistant for Filipino parents.
Child: ${childName}, ${childAgeMonths} months old.
Today's feeding summary:
- Total feeds: ${summary.feedCount} (WHO recommended: ${summary.recommendedMin}–${summary.recommendedMax})
- Breastfeeds: ${summary.breastfeedCount}, Bottle: ${summary.bottleCount}, Solids: ${summary.solidsCount}
- Total volume: ${summary.totalVolumeMl} ml
- Longest gap between feeds: ${summary.longestGapMins} minutes
- Overall: ${summary.overallScore}

Write a warm, 2-sentence daily feeding summary for the parent. Language: ${langLabel}.
Be encouraging, specific, and cite WHO or DOH Philippines where relevant. Under 70 words.
End with: "[For medical concerns, please consult your Pedia.]"`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 180,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.content?.[0]?.text as string | undefined) ?? null;
  } catch {
    return null;  // Silent fallback — rule-based is always the safety net
  }
}
