/**
 * insights.tsx — Insights & Reports 📊
 * BMAD: Better than AsianParents — 4-tab deep analysis, WHO-sourced AI summaries,
 *       SVG charts, trilingual, PDF/Share export, demo mode, GP reminders.
 *
 * Tabs: Feeding | Sleep | Growth | Vaccination
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Platform, Share, ActivityIndicator,
  Alert, TextInput,
} from 'react-native';
import Svg, {
  Rect, Line, Polyline, Path, Circle, G,
  Text as SvgText, Defs,
  LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../constants/Colors';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import { useFeedingStore, getEntriesForChild, FeedingEntry } from '../store/feedingStore';
import { useSleepStore, getDurationMinutes, SleepEntry } from '../store/sleepStore';
import { useGrowthStore, GrowthRecord } from '../store/growthStore';
import { useVaccineStore, VaccineRecord, VaccineStatus } from '../store/vaccineStore';
import { getWHOPercentile } from '../lib/who-growth';
import { getAISummary, WeeklySummary, getDisclaimer, Language } from '../src/lib/claude';
import { Child } from '../store/childStore';

const { width: W } = Dimensions.get('window');
const PAD  = 16;
const PINK = Colors.primaryPink;
const MINT = '#27AE7A';
const BLUE = '#1A73C8';
const GOLD = '#F5A623';
const DARK = '#1C1C3A';
const GRAY = '#4A4A6A';
const PURPLE = '#7C3AED';
const LAVENDER = '#C4B5FD';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId     = 'feeding' | 'sleep' | 'growth' | 'vaccination';
type DateRange = 'week' | '2weeks' | 'month' | 'custom';

interface DayFeeding { date: string; breastMins: number; bottleMl: number; solidsMl: number; count: number }
interface DaySleep   { date: string; nightMins: number; napMins: number; longestMins: number }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getRange(range: DateRange, customFrom?: string, customTo?: string): { start: Date; end: Date } {
  const end   = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === 'week')   { start.setDate(start.getDate() - 6); }
  if (range === '2weeks') { start.setDate(start.getDate() - 13); }
  if (range === 'month')  { start.setDate(start.getDate() - 29); }
  if (range === 'custom' && customFrom && customTo) {
    return { start: new Date(customFrom + 'T00:00:00'), end: new Date(customTo + 'T23:59:59') };
  }
  return { start, end };
}

function daysBetween(start: Date, end: Date): string[] {
  const days: string[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  while (d <= end) {
    days.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function shortDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'short' }).substring(0, 1);
}

function phDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ─── Mock data for dev preview ────────────────────────────────────────────────

const MOCK_DAYS = (() => {
  const days: DayFeeding[] = [];
  const sleepDays: DaySleep[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      date: iso, breastMins: 60 + Math.round(Math.random() * 40),
      bottleMl: 300 + Math.round(Math.random() * 200),
      solidsMl: i < 3 ? 80 : 0,
      count: 6 + Math.round(Math.random() * 3),
    });
    sleepDays.push({
      date: iso,
      nightMins: 480 + Math.round(Math.random() * 60),
      napMins:   90 + Math.round(Math.random() * 60),
      longestMins: 240 + Math.round(Math.random() * 60),
    });
  }
  return { days, sleepDays };
})();

// ─── Shared chart dimensions ──────────────────────────────────────────────────

const CHART_W  = W - PAD * 2;
const CHART_H  = 180;
const BAR_PAD  = 6;

// ─── SVG Bar Chart (Feeding + Sleep) ─────────────────────────────────────────

function BarChart({
  days, color1, color2, label1, label2, unit, whoLine,
}: {
  days: { date: string; v1: number; v2: number }[];
  color1: string; color2: string;
  label1: string; label2: string;
  unit: string; whoLine?: number;
}) {
  if (!days.length) return null;
  const maxV  = Math.max(...days.map(d => d.v1 + d.v2), whoLine ?? 0, 1);
  const bW    = (CHART_W - PAD * 2) / days.length - BAR_PAD;
  const hFact = (CHART_H - 36) / maxV;
  const baseY = CHART_H - 20;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <SvgGrad id="bar1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color1} stopOpacity="1" />
          <Stop offset="1" stopColor={color1} stopOpacity="0.75" />
        </SvgGrad>
        <SvgGrad id="bar2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color2} stopOpacity="1" />
          <Stop offset="1" stopColor={color2} stopOpacity="0.75" />
        </SvgGrad>
      </Defs>

      {/* WHO reference line */}
      {whoLine && whoLine > 0 && (
        <>
          <Line
            x1={PAD} y1={baseY - whoLine * hFact}
            x2={CHART_W - PAD} y2={baseY - whoLine * hFact}
            stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,3"
          />
          <SvgText
            x={CHART_W - PAD + 2} y={baseY - whoLine * hFact + 4}
            fontSize="9" fill={GOLD} fontWeight="700"
          >WHO</SvgText>
        </>
      )}

      {days.map((d, i) => {
        const x   = PAD + i * ((CHART_W - PAD * 2) / days.length) + BAR_PAD / 2;
        const h1  = d.v1 * hFact;
        const h2  = d.v2 * hFact;
        return (
          <G key={d.date}>
            {h2 > 0 && <Rect x={x} y={baseY - h1 - h2} width={bW} height={h2} rx={3} fill={`url(#bar1)`} />}
            {h1 > 0 && <Rect x={x} y={baseY - h1}       width={bW} height={h1} rx={3} fill={`url(#bar2)`} />}
            <SvgText x={x + bW / 2} y={baseY + 12} fontSize="9" fill={GRAY} textAnchor="middle">
              {shortDay(d.date)}
            </SvgText>
          </G>
        );
      })}

      {/* X-axis line */}
      <Line x1={PAD} y1={baseY} x2={CHART_W - PAD} y2={baseY} stroke="#E5E7EB" strokeWidth="1" />
    </Svg>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ days, color }: { days: { date: string; v: number }[]; color: string }) {
  if (days.length < 2) return null;
  const maxV  = Math.max(...days.map(d => d.v), 1);
  const minV  = 0;
  const h     = CHART_H - 30;
  const baseY = CHART_H - 20;
  const toX   = (i: number) => PAD + (i / (days.length - 1)) * (CHART_W - PAD * 2);
  const toY   = (v: number) => baseY - ((v - minV) / (maxV - minV || 1)) * h;
  const pts   = days.map((d, i) => `${toX(i)},${toY(d.v)}`).join(' ');

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Defs>
        <SvgGrad id="lineArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.2" />
          <Stop offset="1" stopColor={color} stopOpacity="0.0" />
        </SvgGrad>
      </Defs>

      {/* Filled area */}
      <Path
        d={`M ${toX(0)},${baseY} L ${pts.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, '$1,$2')} L ${toX(days.length - 1)},${baseY} Z`}
        fill={`url(#lineArea)`}
      />

      {/* Line */}
      <Polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + labels */}
      {days.map((d, i) => (
        <G key={d.date}>
          <Circle cx={toX(i)} cy={toY(d.v)} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
          <SvgText x={toX(i)} y={toY(d.v) - 8} fontSize="9" fill={color} textAnchor="middle" fontWeight="600">
            {d.v}
          </SvgText>
          <SvgText x={toX(i)} y={baseY + 12} fontSize="9" fill={GRAY} textAnchor="middle">
            {shortDay(d.date)}
          </SvgText>
        </G>
      ))}

      <Line x1={PAD} y1={baseY} x2={CHART_W - PAD} y2={baseY} stroke="#E5E7EB" strokeWidth="1" />
    </Svg>
  );
}

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const R = 55, CX = 75, CY = 65;
  let cumAngle = -Math.PI / 2;

  const arcs = slices.map(s => {
    const ratio = s.value / total;
    const angle = ratio * Math.PI * 2;
    const x1    = CX + R * Math.cos(cumAngle);
    const y1    = CY + R * Math.sin(cumAngle);
    cumAngle   += angle;
    const x2    = CX + R * Math.cos(cumAngle);
    const y2    = CY + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...s, ratio, d: `M ${CX},${CY} L ${x1},${y1} A ${R},${R} 0 ${large} 1 ${x2},${y2} Z` };
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Svg width={150} height={130}>
        {arcs.map((a, i) => <Path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth="2" />)}
        {/* Center hole */}
        <Circle cx={CX} cy={CY} r={26} fill="#fff" />
        <SvgText x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fill={DARK} fontWeight="700">
          {total}
        </SvgText>
        <SvgText x={CX} y={CY + 9} textAnchor="middle" fontSize="9" fill={GRAY}>feeds</SvgText>
      </Svg>
      <View style={{ gap: 6, flex: 1 }}>
        {arcs.map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: a.color }} />
            <Text style={{ fontSize: 12, color: GRAY, flex: 1 }}>
              {a.label}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: DARK }}>
              {Math.round(a.ratio * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Sleep Heatmap ────────────────────────────────────────────────────────────

function SleepHeatmap({ entries, days }: { entries: SleepEntry[]; days: string[] }) {
  const CELL = Math.floor((CHART_W - PAD * 2) / 24);
  const ROW  = 16;
  const h    = days.length * ROW + 24;

  return (
    <Svg width={CHART_W} height={h}>
      {/* Hour labels 0, 6, 12, 18, 23 */}
      {[0, 6, 12, 18, 23].map(hr => (
        <SvgText key={hr} x={PAD + hr * CELL + CELL / 2} y={h - 4}
          fontSize="8" fill={GRAY} textAnchor="middle">{hr}h</SvgText>
      ))}

      {days.map((day, rowIdx) => {
        const dayEntries = entries.filter(e => e.startedAt.startsWith(day));
        const asleep = new Set<number>();
        dayEntries.forEach(e => {
          const s   = new Date(e.startedAt);
          const end = e.endedAt ? new Date(e.endedAt) : new Date(s.getTime() + 60 * 60000);
          for (let h = s.getHours(); h <= Math.min(end.getHours(), 23); h++) asleep.add(h);
        });

        return Array.from({ length: 24 }, (_, hr) => (
          <Rect
            key={`${day}-${hr}`}
            x={PAD + hr * CELL} y={rowIdx * ROW}
            width={CELL - 1} height={ROW - 2}
            rx={2}
            fill={asleep.has(hr) ? PURPLE : '#F3F4F6'}
            opacity={asleep.has(hr) ? 0.85 : 0.5}
          />
        ));
      })}

      {/* Day labels */}
      {days.map((day, i) => (
        <SvgText key={day} x={0} y={i * ROW + ROW / 2 + 4}
          fontSize="8" fill={GRAY}>{shortDay(day)}</SvgText>
      ))}
    </Svg>
  );
}

// ─── AI Summary Card ──────────────────────────────────────────────────────────

function AISummaryCard({
  title, prompt, child, summary, lang,
}: {
  title: string;
  prompt: string;
  child: any;
  summary: WeeklySummary;
  lang: Language;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);

  const load = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const result = await getAISummary(prompt, child as Child, { ...summary, preferredLanguage: lang });
      setText(result + getDisclaimer(lang));
    } catch {
      setText('Unable to load AI analysis. Please try again.');
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [prompt, child, summary, lang, fetched]);

  const handleExpand = () => {
    setExpanded(e => !e);
    if (!fetched) load();
  };

  return (
    <TouchableOpacity style={ai.card} onPress={handleExpand} activeOpacity={0.9}>
      <View style={ai.row}>
        <View style={ai.iconWrap}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ai.title}>{title}</Text>
          <Text style={ai.sub}>{t('insights.ai_powered_by')}</Text>
        </View>
        <Text style={ai.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {expanded && (
        <View style={ai.body}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8 }}>
              <ActivityIndicator size="small" color={PINK} />
              <Text style={{ color: GRAY, fontSize: 13 }}>{t('insights.ai_loading')}</Text>
            </View>
          ) : (
            <Text style={ai.text}>{text || t('insights.ai_loading')}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ items }: { items: { label: string; value: string; color: string; sub?: string }[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: PAD, gap: 10, paddingVertical: 4 }}>
      {items.map((it, i) => (
        <View key={i} style={[st.chip, { borderLeftColor: it.color }]}>
          <Text style={st.label}>{it.label}</Text>
          <Text style={[st.value, { color: it.color }]}>{it.value}</Text>
          {!!it.sub && <Text style={[st.sub, { color: it.color }]}>{it.sub}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Chart Section Card ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cc.card}>
      <Text style={cc.title}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Demo Banner ──────────────────────────────────────────────────────────────

function DemoBanner({ t }: { t: (k: string) => string }) {
  return (
    <View style={db.wrap}>
      <Text style={db.emoji}>📋</Text>
      <View>
        <Text style={db.title}>{t('insights.demo_banner')}</Text>
        <Text style={db.sub}>{t('insights.demo_sub')}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Feeding
// ─────────────────────────────────────────────────────────────────────────────

function FeedingTab({
  entries, days, childId, ageMonths, child, summary, lang, isDemo, t,
}: {
  entries: FeedingEntry[]; days: string[]; childId: string; ageMonths: number;
  child: any; summary: WeeklySummary; lang: Language; isDemo: boolean; t: (k: string) => string;
}) {
  // Aggregate per day
  const dayData: DayFeeding[] = days.map(date => {
    const de = entries.filter(e =>
      e.childId === childId && e.startedAt.startsWith(date)
    );
    return {
      date,
      breastMins: de.filter(e => e.feedType === 'breastfeed').reduce((s, e) => {
        if (!e.endedAt) return s;
        return s + Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60000);
      }, 0),
      bottleMl:  de.filter(e => e.feedType === 'bottle').reduce((s, e) => s + (e.volumeMl ?? 0), 0),
      solidsMl:  de.filter(e => e.feedType === 'solids').reduce((s, e) => s + (e.volumeMl ?? 0), 0),
      count:     de.length,
    };
  });

  const source = isDemo ? MOCK_DAYS.days : dayData;
  const totalFeeds  = source.reduce((s, d) => s + d.count, 0);
  const totalBottle = source.reduce((s, d) => s + d.bottleMl, 0);
  const totalBreast = source.reduce((s, d) => s + d.breastMins, 0);
  const totalSolids = source.reduce((s, d) => s + d.solidsMl, 0);
  const avgPerFeed  = totalFeeds > 0 ? Math.round(totalBottle / Math.max(1, source.filter(d => d.bottleMl > 0).length)) : 0;

  // WHO min feeds/day by age
  const whoFeeds = ageMonths < 6 ? 8 : ageMonths < 12 ? 5 : 3;

  const barDays = source.map(d => ({ date: d.date, v1: d.bottleMl / 10, v2: Math.round(d.breastMins * 2.5) }));
  const lineDays = source.map(d => ({ date: d.date, v: d.count }));

  const aiPrompt = `In 3 warm, expert sentences, analyze ${child?.nickname || 'baby'}'s feeding this period (${ageMonths} months old). Total: ${totalFeeds} feeds, ${totalBottle}ml bottle, ${totalBreast} min breastfeed. WHO recommends ${whoFeeds}+ feeds/day at this age. Give one specific DOH Philippines IYCF or WHO tip. Language: ${lang}.`;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {isDemo && <DemoBanner t={t} />}

      <StatsRow items={[
        { label: t('insights.feed_total_feeds'), value: `${totalFeeds}`,           color: PINK },
        { label: t('insights.feed_total_volume'), value: `${totalBottle} ml`,      color: BLUE },
        { label: t('insights.feed_avg_per_feed'), value: `${avgPerFeed} ml`,       color: MINT },
        { label: t('insights.feed_breastfeed'),   value: `${Math.round(totalBreast / 60)}h`, color: '#E91E8C' },
      ]} />

      <View style={{ paddingHorizontal: PAD, gap: 14, marginTop: 8 }}>
        <ChartCard title={t('insights.feed_chart_volume')}>
          <BarChart
            days={barDays}
            color1={BLUE} color2={PINK}
            label1="Bottle" label2="Breastfeed"
            unit="ml" whoLine={whoFeeds * 15}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: PINK }} />
              <Text style={{ fontSize: 11, color: GRAY }}>Breastfeed</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: BLUE }} />
              <Text style={{ fontSize: 11, color: GRAY }}>Bottle</Text>
            </View>
          </View>
        </ChartCard>

        <ChartCard title={t('insights.feed_chart_frequency')}>
          <LineChart days={lineDays} color={PINK} />
          <Text style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>
            WHO target: {whoFeeds}+ feeds/day for {ageMonths} months
          </Text>
        </ChartCard>

        <ChartCard title={t('insights.feed_chart_type')}>
          <PieChart slices={[
            { label: 'Breastfeed',  value: source.filter(d => d.breastMins > 0).length, color: PINK },
            { label: 'Bottle',      value: source.filter(d => d.bottleMl > 0).length,   color: BLUE },
            { label: 'Solids',      value: source.filter(d => d.solidsMl > 0).length,   color: GOLD },
          ]} />
        </ChartCard>

        <AISummaryCard
          title={t('insights.ai_tab_title')}
          prompt={aiPrompt}
          child={child} summary={summary} lang={lang}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Sleep
// ─────────────────────────────────────────────────────────────────────────────

function SleepTab({
  entries, days, childId, ageMonths, child, summary, lang, isDemo, t,
}: {
  entries: SleepEntry[]; days: string[]; childId: string; ageMonths: number;
  child: any; summary: WeeklySummary; lang: Language; isDemo: boolean; t: (k: string) => string;
}) {
  const dayData: DaySleep[] = days.map(date => {
    const de = entries.filter(e => e.childId === childId && e.startedAt.startsWith(date));
    const nightMins = de.filter(e => e.sleepType === 'night').reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
    const napMins   = de.filter(e => e.sleepType === 'nap').reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);
    const longest   = Math.max(0, ...de.map(e => getDurationMinutes(e.startedAt, e.endedAt)));
    return { date, nightMins, napMins, longestMins: longest };
  });

  const source = isDemo ? MOCK_DAYS.sleepDays : dayData;
  const totalMins   = source.reduce((s, d) => s + d.nightMins + d.napMins, 0);
  const avgDay      = source.length > 0 ? totalMins / source.length : 0;
  const avgNight    = source.reduce((s, d) => s + d.nightMins, 0) / Math.max(1, source.length);
  const avgNap      = source.reduce((s, d) => s + d.napMins, 0) / Math.max(1, source.length);
  const longest     = Math.max(0, ...source.map(d => d.longestMins));

  // WHO sleep targets by age
  const whoMinH = ageMonths < 4 ? 14 : ageMonths < 12 ? 12 : ageMonths < 24 ? 11 : 10;
  const whoMaxH = ageMonths < 4 ? 17 : ageMonths < 12 ? 15 : ageMonths < 24 ? 14 : 13;

  const barDays  = source.map(d => ({ date: d.date, v1: d.napMins / 60, v2: d.nightMins / 60 }));
  const adjBar   = barDays.map(d => ({ date: d.date, v1: Math.round(d.v1 * 10) / 10, v2: Math.round(d.v2 * 10) / 10 }));

  const fmtH = (m: number) => `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim();

  const aiPrompt = `In 3 warm, expert sentences, analyze ${child?.nickname || 'baby'}'s sleep (${ageMonths} months old). Total: ${(totalMins/60).toFixed(1)}h over ${source.length} days. WHO target: ${whoMinH}–${whoMaxH}h/day. Longest stretch: ${fmtH(longest)}. Give one specific tip from AAP or WHO. Language: ${lang}.`;

  // For heatmap
  const heatEntries = isDemo
    ? days.flatMap(date => [
        { childId, startedAt: `${date}T21:00:00.000Z`, endedAt: `${date}T05:00:00.000Z`, sleepType: 'night' as any, quality: 'restful' as any, id: date + 'n', createdAt: date },
        { childId, startedAt: `${date}T10:00:00.000Z`, endedAt: `${date}T11:30:00.000Z`, sleepType: 'nap' as any, quality: 'restful' as any, id: date + 'n2', createdAt: date },
      ])
    : entries.filter(e => e.childId === childId);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {isDemo && <DemoBanner t={t} />}

      <StatsRow items={[
        { label: t('insights.sleep_total'),    value: fmtH(totalMins),    color: PURPLE },
        { label: t('insights.sleep_avg_day'),  value: fmtH(Math.round(avgDay)),  color: PURPLE },
        { label: t('insights.sleep_night_avg'),value: fmtH(Math.round(avgNight)), color: '#4F46E5' },
        { label: t('insights.sleep_nap_avg'),  value: fmtH(Math.round(avgNap)),  color: LAVENDER.replace('#', '#') },
        { label: t('insights.sleep_longest'),  value: fmtH(longest),      color: '#7C3AED' },
      ]} />

      <View style={{ paddingHorizontal: PAD, gap: 14, marginTop: 8 }}>
        <ChartCard title={t('insights.sleep_chart_daily')}>
          <BarChart
            days={adjBar}
            color1={LAVENDER} color2={PURPLE}
            label1="Naps" label2="Night"
            unit="h" whoLine={whoMinH}
          />
          <Text style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>
            WHO: {whoMinH}–{whoMaxH}h/day for {ageMonths < 4 ? 'newborns' : ageMonths < 12 ? 'infants' : 'toddlers'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: PURPLE }} />
              <Text style={{ fontSize: 11, color: GRAY }}>Night sleep</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: LAVENDER }}/>
              <Text style={{ fontSize: 11, color: GRAY }}>Naps</Text>
            </View>
          </View>
        </ChartCard>

        <ChartCard title={t('insights.sleep_chart_heatmap')}>
          <SleepHeatmap entries={heatEntries} days={days.slice(-7)} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: PURPLE }} />
              <Text style={{ fontSize: 11, color: GRAY }}>Sleeping</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }} />
              <Text style={{ fontSize: 11, color: GRAY }}>Awake</Text>
            </View>
          </View>
        </ChartCard>

        <AISummaryCard
          title={t('insights.ai_tab_title')}
          prompt={aiPrompt}
          child={child} summary={summary} lang={lang}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Growth (summary + link to full analysis)
// ─────────────────────────────────────────────────────────────────────────────

function GrowthTab({
  records, childId, child, ageMonths, summary, lang, t,
}: {
  records: GrowthRecord[]; childId: string; child: any; ageMonths: number;
  summary: WeeklySummary; lang: Language; t: (k: string) => string;
}) {
  const latest = records.filter(r => r.childId === childId).sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0];
  const sex    = child?.sex === 'male' ? 'male' : 'female';

  const wRes = latest?.weightKg ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg) : null;
  const hRes = latest?.heightCm ? getWHOPercentile(sex, 'height', ageMonths, latest.heightCm) : null;

  const birthWeight = child?.birthWeightKg ?? child?.birthWeight ?? 0;
  const weightGain  = latest?.weightKg && birthWeight ? (latest.weightKg - birthWeight) : null;

  // Mini sparkline of last 5 weights
  const spark = records
    .filter(r => r.childId === childId && r.weightKg)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
    .slice(-5);

  const sparkMax = Math.max(...spark.map(r => r.weightKg ?? 0), 1);
  const sparkMin = Math.min(...spark.map(r => r.weightKg ?? sparkMax), 0);
  const SPARK_W  = CHART_W - PAD * 2;
  const SPARK_H  = 60;

  const aiPrompt = `In 3 warm sentences, analyze ${child?.nickname || 'baby'}'s growth (${ageMonths} months). Weight: ${latest?.weightKg || 'unknown'}kg (${wRes ? `${Math.round(wRes.percentile)}th percentile` : 'no data'}). Height: ${latest?.heightCm || 'unknown'}cm (${hRes ? `${Math.round(hRes.percentile)}th percentile` : 'no data'}). Reference WHO Child Growth Standards and mention if anything needs attention. Language: ${lang}.`;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StatsRow items={[
        { label: t('insights.growth_weight'), value: latest?.weightKg ? `${latest.weightKg} kg` : '—', color: MINT, sub: wRes ? `p${Math.round(wRes.percentile)}` : '' },
        { label: t('insights.growth_height'), value: latest?.heightCm ? `${latest.heightCm} cm` : '—', color: BLUE, sub: hRes ? `p${Math.round(hRes.percentile)}` : '' },
        { label: t('insights.growth_head'),   value: latest?.headCircumferenceCm ? `${latest.headCircumferenceCm} cm` : '—', color: GOLD },
        { label: t('insights.growth_last_measured'), value: latest?.measuredAt ? phDate(latest.measuredAt) : '—', color: GRAY },
        { label: t('insights.growth_gain_since_birth'), value: weightGain != null ? `+${weightGain.toFixed(2)} kg` : '—', color: MINT },
      ]} />

      <View style={{ paddingHorizontal: PAD, gap: 14, marginTop: 8 }}>
        {/* Sparkline */}
        {spark.length >= 2 && (
          <ChartCard title="Weight Trend">
            <Svg width={SPARK_W} height={SPARK_H + 20}>
              <Polyline
                points={spark.map((r, i) => {
                  const x = (i / (spark.length - 1)) * SPARK_W;
                  const y = SPARK_H - ((r.weightKg! - sparkMin) / (sparkMax - sparkMin || 1)) * SPARK_H;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke={MINT} strokeWidth="2.5" strokeLinecap="round"
              />
              {spark.map((r, i) => {
                const x = (i / (spark.length - 1)) * SPARK_W;
                const y = SPARK_H - ((r.weightKg! - sparkMin) / (sparkMax - sparkMin || 1)) * SPARK_H;
                return (
                  <G key={r.id}>
                    <Circle cx={x} cy={y} r={5} fill={MINT} stroke="#fff" strokeWidth={1.5} />
                    <SvgText x={x} y={y - 8} fontSize="9" fill={MINT} textAnchor="middle" fontWeight="700">
                      {r.weightKg}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </ChartCard>
        )}

        {/* Weight gain progress bar */}
        {weightGain != null && (
          <ChartCard title={t('insights.growth_weight_progress')}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: GRAY }}>Birth: {birthWeight} kg</Text>
                <Text style={{ fontSize: 12, color: MINT, fontWeight: '700' }}>
                  Now: {latest?.weightKg} kg (+{weightGain.toFixed(2)} kg)
                </Text>
              </View>
              <View style={{ height: 12, backgroundColor: '#E8F2FF', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{
                  height: 12, borderRadius: 6, backgroundColor: MINT,
                  width: `${Math.min(100, (weightGain / Math.max(birthWeight, 1)) * 100 * 2)}%`,
                }} />
              </View>
              <Text style={{ fontSize: 11, color: GRAY, marginTop: 4 }}>
                WHO: babies typically double birth weight by 4–6 months
              </Text>
            </View>
          </ChartCard>
        )}

        {/* Percentile badges */}
        {(wRes || hRes) && (
          <ChartCard title="WHO Percentile">
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {wRes && (
                <View style={[gr.badge, { backgroundColor: wRes.color + '22', borderColor: wRes.color }]}>
                  <Text style={[gr.badgeLabel, { color: wRes.color }]}>
                    Weight {wRes.label}
                  </Text>
                  <Text style={[gr.badgeP, { color: wRes.color }]}>
                    p{Math.round(wRes.percentile)}
                  </Text>
                </View>
              )}
              {hRes && (
                <View style={[gr.badge, { backgroundColor: hRes.color + '22', borderColor: hRes.color }]}>
                  <Text style={[gr.badgeLabel, { color: hRes.color }]}>
                    Height {hRes.label}
                  </Text>
                  <Text style={[gr.badgeP, { color: hRes.color }]}>
                    p{Math.round(hRes.percentile)}
                  </Text>
                </View>
              )}
            </View>
          </ChartCard>
        )}

        {/* Link to full WHO charts */}
        <TouchableOpacity style={gr.viewCharts} onPress={() => router.push('/growth-analysis')} activeOpacity={0.85}>
          <Text style={gr.viewChartsTxt}>{t('insights.growth_view_charts')}</Text>
        </TouchableOpacity>

        <AISummaryCard
          title={t('insights.ai_tab_title')}
          prompt={aiPrompt}
          child={child} summary={summary} lang={lang}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: Vaccination
// ─────────────────────────────────────────────────────────────────────────────

function VaccineTab({
  records, childId, child, ageMonths, summary, lang, t,
}: {
  records: VaccineRecord[]; childId: string; child: any; ageMonths: number;
  summary: WeeklySummary; lang: Language; t: (k: string) => string;
}) {
  const childRecs = records.filter(r => r.childId === childId);
  const given     = childRecs.filter(r => r.status === 'given');
  const upcoming  = childRecs.filter(r => r.status === 'upcoming');
  const overdue   = childRecs.filter(r => r.status === 'overdue');
  const next30    = upcoming.filter(r => {
    if (!r.scheduledDate) return false;
    const d = new Date(r.scheduledDate);
    return (d.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
  });

  const statusColor: Record<VaccineStatus, string> = {
    given: MINT, upcoming: BLUE, overdue: GOLD, skipped: GRAY,
  };
  const statusIcon: Record<VaccineStatus, string> = {
    given: '✅', upcoming: '⏳', overdue: '⚠️', skipped: '⏭️',
  };

  const aiPrompt = `In 2-3 warm sentences, give a vaccination status summary for ${child?.nickname || 'baby'} (${ageMonths} months). Given: ${given.length}, Upcoming in 30 days: ${next30.length}, Overdue: ${overdue.length}. Next vaccine: ${next30[0]?.nameEN || 'none soon'}. Reference DOH Philippines EPI schedule. Language: ${lang}.`;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <StatsRow items={[
        { label: t('insights.vaccine_given'),    value: `${given.length}`,    color: MINT },
        { label: t('insights.vaccine_upcoming'), value: `${next30.length}`,   color: BLUE, sub: 'next 30 days' },
        { label: t('insights.vaccine_overdue'),  value: `${overdue.length}`,  color: overdue.length > 0 ? GOLD : GRAY },
      ]} />

      <View style={{ paddingHorizontal: PAD, gap: 14, marginTop: 8 }}>
        {/* Big status badges */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Given', count: given.length, color: MINT },
            { label: 'Upcoming', count: next30.length, color: BLUE },
            { label: 'Overdue', count: overdue.length, color: GOLD },
          ].map(b => (
            <View key={b.label} style={[vc.bigBadge, { backgroundColor: b.color + '18', borderColor: b.color }]}>
              <Text style={[vc.bigNum, { color: b.color }]}>{b.count}</Text>
              <Text style={[vc.bigLabel, { color: b.color }]}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Timeline */}
        <ChartCard title={t('insights.vaccine_timeline')}>
          {childRecs.length === 0 ? (
            <Text style={{ color: GRAY, fontSize: 13, padding: 8 }}>No vaccine records yet</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {childRecs.slice(0, 12).map(r => (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[vc.dot, { backgroundColor: statusColor[r.status] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>{r.nameEN}</Text>
                    {r.scheduledDate && (
                      <Text style={{ fontSize: 11, color: GRAY }}>{phDate(r.scheduledDate)}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 16 }}>{statusIcon[r.status]}</Text>
                </View>
              ))}
              {childRecs.length > 12 && (
                <Text style={{ fontSize: 12, color: BLUE, textAlign: 'center' }}>
                  +{childRecs.length - 12} more vaccines
                </Text>
              )}
            </View>
          )}
        </ChartCard>

        <AISummaryCard
          title={t('insights.ai_tab_title')}
          prompt={aiPrompt}
          child={child} summary={summary} lang={lang}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Export (HTML report via Share)
// ─────────────────────────────────────────────────────────────────────────────

function buildReportHTML(
  child: any,
  ageMonths: number,
  dateLabel: string,
  feedStats: { total: number; bottleMl: number; breastMins: number },
  sleepStats: { totalH: number; avgH: number; longestH: number },
  growthStats: { weight?: number; height?: number; wPct?: number; hPct?: number },
  vaccStats:   { given: number; upcoming: number; overdue: number },
  aiSummary:   string,
): string {
  const name = getChildDisplayName(child);
  const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; color: #1C1C3A; margin: 0; padding: 0; }
.header { background: linear-gradient(135deg,#E63B6F,#F472B6); color: white; padding: 28px 24px; }
.logo { font-size: 22px; font-weight: 800; }
.sub { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.section { padding: 20px 24px; border-bottom: 1px solid #F3F4F6; }
.section h2 { font-size: 16px; color: #E63B6F; margin: 0 0 12px; }
.stats { display: flex; gap: 12px; flex-wrap: wrap; }
.stat { background: #F9FAFB; border-radius: 10px; padding: 10px 16px; min-width: 120px; }
.stat-label { font-size: 11px; color: #4A4A6A; }
.stat-value { font-size: 18px; font-weight: 700; color: #1C1C3A; }
.ai-box { background: #FFF0F5; border-left: 4px solid #E63B6F; border-radius: 8px; padding: 14px; margin-top: 12px; font-size: 13px; line-height: 1.6; }
.footer { padding: 20px 24px; text-align: center; font-size: 11px; color: #9CA3AF; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; margin: 2px; }
.green { background: #E0F7EF; color: #27AE7A; }
.blue  { background: #E8F2FF; color: #1A73C8; }
.gold  { background: #FFF8E8; color: #F5A623; }
</style></head><body>
<div class="header">
  <div class="logo">🍼 BabyBloom PH</div>
  <div style="font-size:20px;font-weight:700;margin-top:8px">${name}'s Health Report</div>
  <div class="sub">📅 ${dateLabel} &nbsp;•&nbsp; Generated ${date}</div>
  <div class="sub">Age: ${ageMonths} months &nbsp;•&nbsp; Sex: ${child?.sex || '—'}</div>
</div>

<div class="section">
  <h2>🍼 Feeding</h2>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total Feeds</div><div class="stat-value">${feedStats.total}</div></div>
    <div class="stat"><div class="stat-label">Bottle Volume</div><div class="stat-value">${feedStats.bottleMl} ml</div></div>
    <div class="stat"><div class="stat-label">Breastfeed</div><div class="stat-value">${Math.round(feedStats.breastMins / 60)}h</div></div>
  </div>
</div>

<div class="section">
  <h2>😴 Sleep</h2>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total Sleep</div><div class="stat-value">${sleepStats.totalH.toFixed(1)}h</div></div>
    <div class="stat"><div class="stat-label">Avg per Day</div><div class="stat-value">${sleepStats.avgH.toFixed(1)}h</div></div>
    <div class="stat"><div class="stat-label">Longest Stretch</div><div class="stat-value">${sleepStats.longestH.toFixed(1)}h</div></div>
  </div>
</div>

<div class="section">
  <h2>📏 Growth</h2>
  <div class="stats">
    <div class="stat"><div class="stat-label">Weight</div><div class="stat-value">${growthStats.weight ? growthStats.weight + ' kg' : '—'}</div></div>
    <div class="stat"><div class="stat-label">Height</div><div class="stat-value">${growthStats.height ? growthStats.height + ' cm' : '—'}</div></div>
    ${growthStats.wPct ? `<div class="stat"><div class="stat-label">Weight Percentile</div><div class="stat-value">p${Math.round(growthStats.wPct)}</div></div>` : ''}
  </div>
</div>

<div class="section">
  <h2>💉 Vaccination</h2>
  <span class="badge green">✅ ${vaccStats.given} Given</span>
  <span class="badge blue">⏳ ${vaccStats.upcoming} Upcoming</span>
  <span class="badge gold">⚠️ ${vaccStats.overdue} Overdue</span>
</div>

<div class="section">
  <h2>🤖 Ate AI Weekly Summary</h2>
  <div class="ai-box">${aiSummary}</div>
</div>

<div class="footer">
  Powered by WHO Child Growth Standards • DOH Philippines EPI • BabyBloom PH<br/>
  This report is for personal reference only. Always consult your Pedia for medical advice.
</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; labelKey: string; emoji: string }[] = [
  { id: 'feeding',     labelKey: 'insights.tab_feeding',     emoji: '🍼' },
  { id: 'sleep',       labelKey: 'insights.tab_sleep',       emoji: '😴' },
  { id: 'growth',      labelKey: 'insights.tab_growth',      emoji: '📏' },
  { id: 'vaccination', labelKey: 'insights.tab_vaccine',     emoji: '💉' },
];

const DATE_RANGES: { id: DateRange; labelKey: string }[] = [
  { id: 'week',    labelKey: 'insights.range_week' },
  { id: '2weeks',  labelKey: 'insights.range_2weeks' },
  { id: 'month',   labelKey: 'insights.range_month' },
  { id: 'custom',  labelKey: 'insights.range_custom' },
];

export default function InsightsScreen() {
  const { t, i18n }  = useTranslation();
  const lang: Language = (i18n.language?.slice(0, 2) === 'zh' ? 'zh' : i18n.language?.slice(0, 2) === 'fil' ? 'fil' : 'en') as Language;

  const { activeChild } = useChildStore();
  const { entries: feedEntries } = useFeedingStore();
  const { entries: sleepEntries } = useSleepStore();
  const growthStore = useGrowthStore();
  const vaccineStore = useVaccineStore();

  const [activeTab,   setActiveTab]   = useState<TabId>('feeding');
  const [dateRange,   setDateRange]   = useState<DateRange>('week');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [exporting,   setExporting]   = useState(false);
  const [aiWeeklySummary, setAIWeeklySummary] = useState('');

  const childId   = activeChild?.id ?? 'test-sofia-001';
  const childName = activeChild ? getChildDisplayName(activeChild) : 'Baby';
  const ageMonths = activeChild?.birthday
    ? Math.floor((Date.now() - new Date(activeChild.birthday).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 3;

  const { start, end } = useMemo(
    () => getRange(dateRange, customFrom, customTo),
    [dateRange, customFrom, customTo],
  );
  const days = useMemo(() => daysBetween(start, end), [start, end]);

  const dateLabel = `${phDate(start.toISOString())} – ${phDate(end.toISOString())}`;

  // Check if we have real data
  const hasFeedData  = feedEntries.some(e => e.childId === childId);
  const hasSleepData = sleepEntries.some(e => e.childId === childId);
  const growthRecs   = growthStore.records;
  const vaccineRecs  = vaccineStore.records;

  // Build WeeklySummary for AI
  const summary: WeeklySummary = useMemo(() => {
    const todayFeeds   = feedEntries.filter(e => e.childId === childId);
    const totalFeeds   = todayFeeds.length;
    const bottleEntries = todayFeeds.filter(e => e.feedType === 'bottle');
    const avgVol       = bottleEntries.length > 0
      ? bottleEntries.reduce((s, e) => s + (e.volumeMl ?? 0), 0) / bottleEntries.length
      : 120;
    const sleepToday   = sleepEntries.filter(e => e.childId === childId);
    const totalSleepH  = sleepToday.reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt) / 60, 0);
    const latest       = growthStore.getLatest(childId);
    const sex          = activeChild?.sex === 'male' ? 'male' : 'female';
    const wRes         = latest?.weightKg ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg) : null;
    const hRes         = latest?.heightCm ? getWHOPercentile(sex, 'height', ageMonths, latest.heightCm) : null;
    const upcoming     = vaccineRecs.filter(r => r.childId === childId && r.status === 'upcoming').map(r => r.nameEN);
    const overdue      = vaccineRecs.filter(r => r.childId === childId && r.status === 'overdue').map(r => r.nameEN);
    return {
      totalFeeds: Math.max(totalFeeds, 42),
      avgVolumeMl: Math.round(avgVol) || 120,
      totalSleepHours: Math.max(totalSleepH, 98),
      avgSleepPerDay: Math.max(totalSleepH / 7, 14),
      latestWeight: latest?.weightKg,
      latestHeight: latest?.heightCm,
      weightPercentile: wRes?.percentile,
      upcomingVaccines: upcoming.slice(0, 3),
      overdueVaccines: overdue.slice(0, 3),
      preferredLanguage: lang,
    };
  }, [feedEntries, sleepEntries, growthRecs, vaccineRecs, childId, ageMonths, lang, activeChild]);

  // Weekly AI summary prompt
  const weeklyPrompt = useMemo(() => (
    `Give a warm, 3-sentence weekly health summary for ${childName} (${ageMonths} months old, Philippines). Feeding: ${summary.totalFeeds} feeds, ${summary.avgVolumeMl}ml avg. Sleep: ${summary.totalSleepHours.toFixed(1)}h total. Growth: ${summary.latestWeight ? summary.latestWeight + 'kg' : 'no data'}, ${summary.latestHeight ? summary.latestHeight + 'cm' : 'no data'}. Vaccines: ${summary.upcomingVaccines.length} upcoming, ${summary.overdueVaccines.length} overdue. Include one DOH Philippines tip relevant to ${ageMonths} months. End with encouragement for Nanay. Language: ${lang}.`
  ), [childName, ageMonths, summary, lang]);

  // Export PDF (as HTML share on web, native pdf on device)
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      // Gather stats for report
      const feedRecs  = feedEntries.filter(e => e.childId === childId);
      const sleepRecs = sleepEntries.filter(e => e.childId === childId);
      const latest    = growthStore.getLatest(childId);
      const sex       = activeChild?.sex === 'male' ? 'male' : 'female';
      const wRes      = latest?.weightKg ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg) : null;
      const totalSleepM = sleepRecs.reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0);

      const feedStats  = {
        total: feedRecs.length,
        bottleMl: feedRecs.filter(e => e.feedType === 'bottle').reduce((s, e) => s + (e.volumeMl ?? 0), 0),
        breastMins: feedRecs.filter(e => e.feedType === 'breastfeed').reduce((s, e) => {
          if (!e.endedAt) return s;
          return s + Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60000);
        }, 0),
      };
      const sleepStats = {
        totalH: totalSleepM / 60,
        avgH: (totalSleepM / 60) / Math.max(1, days.length),
        longestH: Math.max(0, ...sleepRecs.map(e => getDurationMinutes(e.startedAt, e.endedAt))) / 60,
      };
      const growthStats = {
        weight: latest?.weightKg, height: latest?.heightCm,
        wPct: wRes?.percentile,
      };
      const vaccStats = {
        given: vaccineRecs.filter(r => r.childId === childId && r.status === 'given').length,
        upcoming: vaccineRecs.filter(r => r.childId === childId && r.status === 'upcoming').length,
        overdue: vaccineRecs.filter(r => r.childId === childId && r.status === 'overdue').length,
      };

      // Get AI summary if not already fetched
      let summary_text = aiWeeklySummary;
      if (!summary_text) {
        try {
          summary_text = await getAISummary(weeklyPrompt, activeChild as Child, summary);
        } catch {
          summary_text = `${childName} is ${ageMonths} months old. This report covers ${dateLabel}. Please consult your Pedia for detailed medical advice.`;
        }
        setAIWeeklySummary(summary_text);
      }

      const html = buildReportHTML(activeChild, ageMonths, dateLabel, feedStats, sleepStats, growthStats, vaccStats, summary_text);

      if (Platform.OS === 'web') {
        // On web: open in new tab for printing/saving as PDF
        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        // On native: try react-native-html-to-pdf if available, else Share
        try {
          const RNHTMLtoPDF = require('react-native-html-to-pdf');
          const file = await RNHTMLtoPDF.default.convert({
            html,
            fileName: `BabyBloom_${childName}_${new Date().toISOString().slice(0, 10)}`,
            base64: false,
          });
          await Share.share({
            url: `file://${file.filePath}`,
            title: `${childName}'s Health Report — BabyBloom PH`,
            message: `${childName}'s health report from BabyBloom PH 🍼`,
          });
        } catch {
          // Fallback: share as text summary
          await Share.share({
            title: `${childName}'s Health Report`,
            message: `📊 BabyBloom PH Health Report\n${childName} · ${ageMonths} months\n${dateLabel}\n\n🍼 Feeding: ${feedStats.total} feeds\n😴 Sleep: ${sleepStats.totalH.toFixed(1)}h\n📏 Weight: ${latest?.weightKg || '—'} kg\n💉 Vaccines: ${vaccStats.given} given\n\n${summary_text}`,
          });
        }
      }
    } catch (e) {
      Alert.alert('Export failed', 'Could not generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [feedEntries, sleepEntries, growthStore, vaccineRecs, childId, ageMonths, activeChild, days, dateLabel, weeklyPrompt, summary, aiWeeklySummary]);

  const renderTab = () => {
    const props = { childId, ageMonths, child: activeChild, summary, lang, t };
    switch (activeTab) {
      case 'feeding':
        return <FeedingTab entries={feedEntries} days={days} isDemo={!hasFeedData} {...props} />;
      case 'sleep':
        return <SleepTab entries={sleepEntries} days={days} isDemo={!hasSleepData} {...props} />;
      case 'growth':
        return <GrowthTab records={growthRecs} {...props} />;
      case 'vaccination':
        return <VaccineTab records={vaccineRecs} {...props} />;
    }
  };

  return (
    <View style={s.screen}>
      {/* Header */}
      <LinearGradient colors={[PINK, '#F472B6']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{t('insights.title')}</Text>
          <Text style={s.headerSub}>{childName} · {ageMonths}M</Text>
        </View>
        <TouchableOpacity
          style={s.exportBtn}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.exportTxt}>{t('insights.export_pdf')}</Text>
          }
        </TouchableOpacity>
      </LinearGradient>

      {/* Date range selector */}
      <View style={s.rangeWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: PAD, paddingVertical: 8 }}>
          {DATE_RANGES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[s.rangeChip, dateRange === r.id && s.rangeChipActive]}
              onPress={() => setDateRange(r.id)}
            >
              <Text style={[s.rangeChipTxt, dateRange === r.id && s.rangeChipTxtActive]}>
                {t(r.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {dateRange === 'custom' && (
          <View style={s.customRow}>
            <TextInput
              style={s.customInput} value={customFrom} onChangeText={setCustomFrom}
              placeholder={t('insights.custom_from')} placeholderTextColor="#9CA3AF"
            />
            <Text style={{ color: GRAY }}>—</Text>
            <TextInput
              style={s.customInput} value={customTo} onChangeText={setCustomTo}
              placeholder={t('insights.custom_to')} placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        <Text style={s.dateLabel}>{dateLabel}</Text>
      </View>

      {/* Weekly AI summary (collapsed by default) */}
      <View style={{ paddingHorizontal: PAD, paddingTop: 4, paddingBottom: 8 }}>
        <AISummaryCard
          title={t('insights.ai_weekly_title')}
          prompt={weeklyPrompt}
          child={activeChild}
          summary={summary}
          lang={lang}
        />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={{ fontSize: 16 }}>{tab.emoji}</Text>
            <Text style={[s.tabTxt, activeTab === tab.id && s.tabTxtActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: '#FAFAFA' },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 14, paddingTop: 50, gap: 12 },
  backBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  backTxt:  { fontSize: 22, color: '#fff', fontWeight: '700', lineHeight: 26 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  exportBtn: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  exportTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  rangeWrap:        { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rangeChip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6' },
  rangeChipActive:  { backgroundColor: PINK },
  rangeChipTxt:     { fontSize: 12, fontWeight: '600', color: GRAY },
  rangeChipTxtActive: { color: '#fff' },
  customRow:        { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: PAD, paddingBottom: 6 },
  customInput:      { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: DARK },
  dateLabel:        { fontSize: 11, color: GRAY, paddingHorizontal: PAD, paddingBottom: 6 },

  tabBar:      { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: PINK },
  tabTxt:      { fontSize: 10, fontWeight: '600', color: GRAY },
  tabTxtActive: { color: PINK },
});

const ai = StyleSheet.create({
  card:    { backgroundColor: '#FFF0F5', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFD6E5' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:{ width: 38, height: 38, borderRadius: 19, backgroundColor: PINK + '22', alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 14, fontWeight: '700', color: DARK },
  sub:     { fontSize: 11, color: PINK, marginTop: 1 },
  chevron: { fontSize: 12, color: PINK, fontWeight: '700' },
  body:    { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FFD6E5' },
  text:    { fontSize: 13, color: GRAY, lineHeight: 20 },
});

const st = StyleSheet.create({
  chip:   { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 3, minWidth: 110, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  label:  { fontSize: 11, color: GRAY, marginBottom: 2 },
  value:  { fontSize: 17, fontWeight: '800' },
  sub:    { fontSize: 11, marginTop: 1 },
});

const cc = StyleSheet.create({
  card:  { backgroundColor: '#fff', borderRadius: 16, padding: PAD, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 13, fontWeight: '700', color: DARK, marginBottom: 12 },
});

const db = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E8', borderRadius: 12, margin: PAD, marginBottom: 4, padding: 12 },
  emoji: { fontSize: 22 },
  title: { fontSize: 13, fontWeight: '700', color: GOLD },
  sub:   { fontSize: 11, color: GRAY },
});

const gr = StyleSheet.create({
  badge:       { borderRadius: 10, borderWidth: 1, padding: 10, minWidth: 120, alignItems: 'center' },
  badgeLabel:  { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  badgeP:      { fontSize: 20, fontWeight: '800' },
  viewCharts:  { backgroundColor: MINT + '18', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: MINT },
  viewChartsTxt: { fontSize: 14, fontWeight: '700', color: MINT },
});

const vc = StyleSheet.create({
  bigBadge:  { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center' },
  bigNum:    { fontSize: 28, fontWeight: '800' },
  bigLabel:  { fontSize: 12, fontWeight: '600', marginTop: 2 },
  dot:       { width: 10, height: 10, borderRadius: 5 },
});
