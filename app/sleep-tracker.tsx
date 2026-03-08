/**
 * sleep-tracker.tsx — BabyBloom PH Sleep Tracker
 * Features: animated moon timer · manual entry · WHO analysis · AI summary
 * Better than AsianParents: background timer · 24h timeline · per-sleep insights · sleep debt tracker
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router }         from 'expo-router';
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { useTranslation }   from 'react-i18next';
import {
  Animated, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGrad, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import Colors                              from '../constants/Colors';
import { analyzeOneSleep, analyzeDailySleep, DailySleepSummary, getClaudeSleepSummary, SleepInsight } from '../lib/sleepInsights';
import { useChildStore }                   from '../store/childStore';
import {
  formatSleepDuration, getDurationMinutes,
  SleepEntry, SleepQuality, SleepType,
  useSleepStore, WeekDay,
} from '../store/sleepStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAD          = 16;
const NIGHT_COLOR  = '#3730A3';  // deep indigo for night sleep
const NAP_COLOR    = '#7C3AED';  // purple for naps
const NIGHT_LIGHT  = '#EDE9FE';
const NAP_LIGHT    = '#F5F3FF';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => `sl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const formatHHMMSS = (totalSeconds: number): string => {
  const h  = Math.floor(totalSeconds / 3600);
  const m  = Math.floor((totalSeconds % 3600) / 60);
  const s  = totalSeconds % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatTimePH = (iso: string): string => {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const formatDateHeader = (iso: string): string => {
  const d   = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYest  = (() => { const y = new Date(now); y.setDate(y.getDate()-1); return d.toDateString() === y.toDateString(); })();
  if (isToday) return 'Today';
  if (isYest)  return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
};

const parseTimeInput = (val: string, baseDate: Date): Date | null => {
  const m = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h   = parseInt(m[1], 10);
  const mn = parseInt(m[2], 10);
  const ap = (m[3] ?? '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const r = new Date(baseDate);
  r.setHours(h, mn, 0, 0);
  return r;
};

const computeAgeMonths = (birthday?: string): number => {
  if (!birthday) return 6;
  const b   = new Date(birthday);
  const now = new Date();
  return Math.floor((now.getTime() - b.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────────────────────

function IconBack({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={Colors.dark} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPlus({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function IconMoonBig({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Defs>
        <SvgGrad id="moonGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0"   stopColor="#C4B5FD" />
          <Stop offset="1"   stopColor="#7C3AED" />
        </SvgGrad>
      </Defs>
      {/* Moon body */}
      <Path d="M36 8 C20 8 10 20 10 36 C10 52 20 64 36 64 C24 58 18 48 22 36 C26 24 36 16 50 16 C44 10 40 8 36 8Z"
        fill="url(#moonGrad)" />
      {/* Stars */}
      <Circle cx={54} cy={18} r={3} fill="#FDE68A" />
      <Circle cx={60} cy={30} r={2} fill="#FDE68A" opacity={0.8} />
      <Circle cx={48} cy={12} r={1.5} fill="#FDE68A" opacity={0.9} />
      {/* Kawaii face */}
      <Circle cx={28} cy={34} r={2.5} fill="#1C1C3A" />
      <Circle cx={36} cy={34} r={2.5} fill="#1C1C3A" />
      <Path d="M26 42 Q32 47 38 42" stroke="#1C1C3A" strokeWidth={1.8} strokeLinecap="round" fill="none" />
      {/* Blush */}
      <Circle cx={24} cy={39} r={3.5} fill="#F9A8D4" opacity={0.6} />
      <Circle cx={40} cy={39} r={3.5} fill="#F9A8D4" opacity={0.6} />
    </Svg>
  );
}

function IconSunBig({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Defs>
        <SvgGrad id="sunGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </SvgGrad>
      </Defs>
      {/* Sun rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad  = (deg * Math.PI) / 180;
        const cx   = 36; const cy = 36;
        const r1   = 26; const r2 = 32;
        const x1   = cx + r1 * Math.cos(rad);
        const y1   = cy + r1 * Math.sin(rad);
        const x2   = cx + r2 * Math.cos(rad);
        const y2   = cy + r2 * Math.sin(rad);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth={3} strokeLinecap="round" />;
      })}
      {/* Sun body */}
      <Circle cx={36} cy={36} r={18} fill="url(#sunGrad)" />
      {/* Kawaii face */}
      <Circle cx={30} cy={34} r={2.5} fill="#92400E" />
      <Circle cx={42} cy={34} r={2.5} fill="#92400E" />
      <Path d="M28 42 Q36 48 44 42" stroke="#92400E" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Circle cx={26} cy={40} r={3.5} fill="#FBBF24" opacity={0.5} />
      <Circle cx={46} cy={40} r={3.5} fill="#FBBF24" opacity={0.5} />
    </Svg>
  );
}

function IconDelete({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconNight({ size = 18, active = false }: { size?: number; active?: boolean }) {
  const c = active ? '#FFFFFF' : NIGHT_COLOR;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={active ? 'rgba(255,255,255,0.3)' : 'none'} />
    </Svg>
  );
}

function IconSunSmall({ size = 18, active = false }: { size?: number; active?: boolean }) {
  const c = active ? '#FFFFFF' : NAP_COLOR;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={5} stroke={c} strokeWidth={2} fill={active ? 'rgba(255,255,255,0.3)' : 'none'} />
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const r  = (deg * Math.PI) / 180;
        return <Line key={i} x1={12+8.5*Math.cos(r)} y1={12+8.5*Math.sin(r)} x2={12+11*Math.cos(r)} y2={12+11*Math.sin(r)} stroke={c} strokeWidth={2} strokeLinecap="round" />;
      })}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Bar Chart — BMAD redesign: clear Y-axis, color-coded bars, value
// labels, summary header, and reading guide so parents always understand it
// ─────────────────────────────────────────────────────────────────────────────

function WeeklyBarChart({ data, targetMin }: { data: WeekDay[]; targetMin: number }) {
  const { t } = useTranslation();
  const W        = 320;
  const H        = 182;
  const PAD_L    = 36;   // Y-axis label room
  const PAD_T    = 22;   // value labels above bars
  const PAD_B    = 22;   // day labels below bars
  const PAD_R    = 46;   // WHO target label room
  const chartW   = W - PAD_L - PAD_R;
  const chartH   = H - PAD_T - PAD_B;
  const barSlotW = chartW / 7;
  const barW     = Math.min(22, barSlotW * 0.62);

  // Y scale — leave buffer above target so the label never clips
  const maxDataMins = Math.max(...data.map((d) => d.totalMinutes), 0);
  const maxMins     = Math.max(maxDataMins, (targetMin + 4) * 60);
  const scaleY      = (mins: number) => chartH - (mins / maxMins) * chartH;
  const targetY     = scaleY(targetMin * 60);

  // Y grid ticks — pick a sensible set that covers the range
  const yTicks = [0, 4, 8, 12, 16, 20].filter((h) => h * 60 <= maxMins + 120);

  // Summary stats (outside SVG)
  const today        = new Date().toISOString().split('T')[0];
  const daysOnTarget = data.filter((d) => d.totalMinutes >= targetMin * 60).length;
  const daysWithData = data.filter((d) => d.totalMinutes > 0).length;
  const avgMins      = daysWithData > 0
    ? data.filter((d) => d.totalMinutes > 0).reduce((s, d) => s + d.totalMinutes, 0) / daysWithData
    : 0;
  const avgHoursStr  = daysWithData > 0 ? `${(avgMins / 60).toFixed(1)}h` : '—';

  // Color-code bars by WHO target adherence
  const getBarGradId = (mins: number) => {
    if (mins <= 0)              return '';
    if (mins >= targetMin * 60) return 'wbcGood';   // ≥ min target → green
    if (mins >= targetMin * 48) return 'wbcAmber';  // ≥ 80% target → amber
    return 'wbcRed';                                 // < 80% target → pink
  };
  const getBarHexColor = (mins: number) => {
    if (mins <= 0)              return Colors.lightGray;
    if (mins >= targetMin * 60) return Colors.mint;
    if (mins >= targetMin * 48) return Colors.gold;
    return Colors.primaryPink;
  };

  // Format label for top of bar ("8h", "8.5h", "10h")
  const fmtHours = (mins: number): string => {
    if (mins <= 0) return '';
    const rounded = Math.round(mins / 30) / 2; // nearest 0.5 h
    return `${rounded}h`;
  };

  // Summary header colour
  const scoreColor =
    daysOnTarget >= 5 ? Colors.mint :
    daysOnTarget >= 3 ? Colors.gold :
    Colors.primaryPink;

  return (
    <View>
      {/* ── Summary Stats Header ─────────────────────────────────────────── */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#F5F3FF', borderRadius: 14,
        paddingVertical: 10, paddingHorizontal: 6, marginBottom: 10,
      }}>
        <View style={{ alignItems: 'center', minWidth: 68 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: scoreColor, lineHeight: 28 }}>
              {daysOnTarget}
            </Text>
            <Text style={{ fontSize: 13, color: Colors.lightGray, fontWeight: '600', marginBottom: 2 }}>/7</Text>
          </View>
          <Text style={{ fontSize: 10, color: Colors.lightGray, fontWeight: '600' }}>{t('sleep.chart.days_on_target')}</Text>
        </View>

        <View style={{ width: 1, backgroundColor: '#DDD8F5' }} />

        <View style={{ alignItems: 'center', minWidth: 68 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: NIGHT_COLOR, lineHeight: 28 }}>
            {avgHoursStr}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.lightGray, fontWeight: '600' }}>{t('sleep.chart.avg_per_day')}</Text>
        </View>

        <View style={{ width: 1, backgroundColor: '#DDD8F5' }} />

        <View style={{ alignItems: 'center', minWidth: 68 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.midGray, lineHeight: 28 }}>
            {targetMin}–{targetMin + 3}
            <Text style={{ fontSize: 13 }}>h</Text>
          </Text>
          <Text style={{ fontSize: 10, color: Colors.lightGray, fontWeight: '600' }}>{t('sleep.chart.who_range')}</Text>
        </View>
      </View>

      {/* ── SVG Chart ────────────────────────────────────────────────────── */}
      <View style={{ alignItems: 'center' }}>
        <Svg width={W} height={H}>
          <Defs>
            {/* Three bar gradients — green / amber / pink */}
            <SvgGrad id="wbcGood" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2DD4A3" />
              <Stop offset="100%" stopColor={Colors.mint} />
            </SvgGrad>
            <SvgGrad id="wbcAmber" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FBBF24" />
              <Stop offset="100%" stopColor={Colors.gold} />
            </SvgGrad>
            <SvgGrad id="wbcRed" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#F87171" />
              <Stop offset="100%" stopColor={Colors.primaryPink} />
            </SvgGrad>
            {/* Nap overlay gradient (always purple, semi-transparent) */}
            <SvgGrad id="wbcNap" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={NAP_COLOR} stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#A78BFA" stopOpacity="0.65" />
            </SvgGrad>
          </Defs>

          {/* ── Y-axis gridlines + hour labels ──────────────────────────── */}
          {yTicks.map((h) => {
            const y = PAD_T + scaleY(h * 60);
            if (y > PAD_T + chartH + 1) return null;
            return (
              <React.Fragment key={`yt-${h}`}>
                <Line
                  x1={PAD_L - 4} y1={y}
                  x2={W - PAD_R} y2={y}
                  stroke={h === 0 ? '#C5C3D8' : '#ECEAF6'}
                  strokeWidth={h === 0 ? 1 : 0.75}
                  strokeDasharray={h === 0 ? '0' : '3,4'}
                />
                <SvgText
                  x={PAD_L - 7} y={y + 4}
                  fontSize={9} fill={Colors.lightGray}
                  textAnchor="end" fontWeight="600"
                >{h}h</SvgText>
              </React.Fragment>
            );
          })}

          {/* ── WHO minimum target line (amber dashes + label) ─────────── */}
          <Line
            x1={PAD_L} y1={PAD_T + targetY}
            x2={W - PAD_R} y2={PAD_T + targetY}
            stroke="#F59E0B" strokeWidth={1.5}
            strokeDasharray="5,4"
          />
          <SvgText
            x={W - PAD_R + 4} y={PAD_T + targetY + 4}
            fontSize={9} fill="#92400E"
            textAnchor="start" fontWeight="700"
          >{t('sleep.chart.min_hours', { hours: targetMin })}</SvgText>

          {/* ── Bars ────────────────────────────────────────────────────── */}
          {data.map((day, i) => {
            const slotX   = PAD_L + i * barSlotW;
            const barX    = slotX + (barSlotW - barW) / 2;
            const isToday = day.date === today;

            const nightPx = (day.nightMinutes / maxMins) * chartH;
            const napPx   = (day.napMinutes   / maxMins) * chartH;
            const nightY  = PAD_T + chartH - nightPx;
            const napY    = nightY - napPx;

            const gradId   = getBarGradId(day.totalMinutes);
            const hexColor = getBarHexColor(day.totalMinutes);
            const label    = fmtHours(day.totalMinutes);
            // Value label sits 5px above the top of the tallest stack
            const topY = napPx > 2 ? napY : nightPx > 2 ? nightY : PAD_T + chartH;
            const lblY = topY - 5;

            return (
              <React.Fragment key={day.date}>
                {/* Today: subtle lavender column highlight */}
                {isToday && (
                  <Rect
                    x={slotX + 1} y={PAD_T - 2}
                    width={barSlotW - 2} height={chartH + 4}
                    rx={6} fill="#EDE9FE" opacity={0.45}
                  />
                )}

                {/* Night-sleep bar (carries the colour grade) */}
                {nightPx > 2 && (
                  <Rect
                    x={barX} y={nightY}
                    width={barW} height={nightPx}
                    rx={5}
                    fill={gradId ? `url(#${gradId})` : hexColor}
                  />
                )}

                {/* Nap bar stacked on top */}
                {napPx > 2 && (
                  <Rect
                    x={barX} y={napY}
                    width={barW} height={napPx}
                    rx={5}
                    fill="url(#wbcNap)"
                  />
                )}

                {/* Empty-day tick */}
                {day.totalMinutes === 0 && (
                  <Rect
                    x={barX + barW / 2 - 2} y={PAD_T + chartH - 4}
                    width={4} height={4}
                    rx={2} fill={Colors.lightGray} opacity={0.35}
                  />
                )}

                {/* ── Value label (colour-coded hours) ─────────────────── */}
                {label !== '' && (
                  <SvgText
                    x={barX + barW / 2}
                    y={lblY}
                    fontSize={8}
                    fill={hexColor}
                    textAnchor="middle"
                    fontWeight="800"
                  >{label}</SvgText>
                )}

                {/* ── X-axis day label ─────────────────────────────────── */}
                <SvgText
                  x={slotX + barSlotW / 2}
                  y={PAD_T + chartH + 15}
                  fontSize={isToday ? 11 : 10}
                  fill={isToday ? NIGHT_COLOR : Colors.lightGray}
                  textAnchor="middle"
                  fontWeight={isToday ? '800' : '600'}
                >{day.label}</SvgText>

                {/* Today dot */}
                {isToday && (
                  <Circle
                    cx={slotX + barSlotW / 2}
                    cy={PAD_T + chartH + 20}
                    r={2.5}
                    fill={NIGHT_COLOR}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 6 }}>
        {([
          { color: Colors.mint,        label: t('sleep.chart.legend_on_target') },
          { color: Colors.gold,        label: t('sleep.chart.legend_almost') },
          { color: Colors.primaryPink, label: t('sleep.chart.legend_too_short') },
          { color: NAP_COLOR,          label: t('sleep.chart.legend_nap') },
        ]).map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, opacity: label.includes('Nap') ? 0.75 : 1 }} />
            <Text style={{ fontSize: 10, color: Colors.midGray, fontWeight: '600' }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Reading Guide ─────────────────────────────────────────────────── */}
      <View style={{
        backgroundColor: Colors.softGold, borderRadius: 10,
        padding: 10, marginTop: 10,
      }}>
        <Text style={{ fontSize: 10, color: '#78350F', lineHeight: 16 }}>
          <Text style={{ fontWeight: '700' }}>📊 {t('sleep.chart.guide_title')} </Text>
          {t('sleep.chart.guide_line1')}
          {'\n'}{t('sleep.chart.guide_line2')}
          {'\n'}🎯 {t('sleep.chart.guide_line3', { hours: targetMin })}
          {'\n'}{t('sleep.chart.guide_line4')}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 24-Hour Sleep Timeline
// ─────────────────────────────────────────────────────────────────────────────

function SleepTimeline24h({ entries }: { entries: SleepEntry[] }) {
  const { t } = useTranslation();
  const W  = 320;
  const H  = 28;
  const completed = entries.filter((e) => !!e.endedAt);
  if (completed.length === 0) return null;

  const toX = (iso: string) => {
    const d = new Date(iso);
    const minutesSinceMidnight = d.getHours() * 60 + d.getMinutes();
    return (minutesSinceMidnight / 1440) * W;
  };

  const nowX = (() => {
    const now = new Date();
    return ((now.getHours() * 60 + now.getMinutes()) / 1440) * W;
  })();

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginBottom: 4 }}>
        {t('sleep.timeline_label')}
      </Text>
      <Svg width={W} height={H}>
        {/* Background track */}
        <Rect x={0} y={8} width={W} height={12} rx={6} fill={Colors.border} />

        {/* Sleep segments */}
        {completed.map((entry) => {
          const x1 = toX(entry.startedAt);
          const x2 = toX(entry.endedAt!);
          const w  = Math.max(x2 - x1, 3);
          return (
            <Rect
              key={entry.id}
              x={x1} y={8} width={w} height={12} rx={3}
              fill={entry.sleepType === 'night' ? NIGHT_COLOR : NAP_COLOR}
              opacity={0.9}
            />
          );
        })}

        {/* Current time marker */}
        <Line x1={nowX} y1={4} x2={nowX} y2={H - 4} stroke={Colors.primaryPink} strokeWidth={1.5} />

        {/* Hour labels at 0, 6, 12, 18, 24 */}
        {[0, 6, 12, 18].map((h) => {
          const x = (h / 24) * W;
          return (
            <React.Fragment key={h}>
              <Line x1={x} y1={20} x2={x} y2={22} stroke={Colors.lightGray} strokeWidth={1} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: W }}>
        {['12am', '6am', '12pm', '6pm', '12am'].map((label, i) => (
          <Text key={i} style={{ fontSize: 9, color: Colors.lightGray }}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Timer Card
// ─────────────────────────────────────────────────────────────────────────────

function ActiveTimerCard({
  seconds, sleepType, startedAt, onStop,
}: { seconds: number; sleepType: SleepType; startedAt: string; onStop: () => void }) {
  const { t }     = useTranslation();
  const glowAnim  = useRef(new Animated.Value(0.4)).current;
  const moonAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
    Animated.spring(moonAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  const moonScale = moonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const isNight   = sleepType === 'night';

  return (
    <LinearGradient
      colors={isNight ? ['#1E1B4B', '#312E81', '#4338CA'] : ['#2E1065', '#4C1D95', '#7C3AED']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={act.card}
    >
      {/* Glow ring */}
      <Animated.View style={[act.glow, { opacity: glowAnim }]} />

      {/* Icon */}
      <Animated.View style={{ transform: [{ scale: moonScale }], marginBottom: 12 }}>
        {isNight ? <IconMoonBig size={80} /> : <IconSunSmall size={60} active />}
      </Animated.View>

      {/* Type badge */}
      <View style={act.typeBadge}>
        <Text style={act.typeBadgeText}>
          {isNight ? `🌙 ${t('sleep.night_sleep')}` : `☀️ ${t('sleep.nap')}`}
        </Text>
      </View>

      {/* Big timer */}
      <Text style={act.timerText}>{formatHHMMSS(seconds)}</Text>
      <Text style={act.startedLabel}>{t('sleep.timer_started_at', { time: formatTimePH(startedAt) })}</Text>

      {/* Stop button */}
      <TouchableOpacity style={act.stopBtn} onPress={onStop} activeOpacity={0.85}>
        <LinearGradient
          colors={['#F59E0B', '#F97316']}
          style={act.stopBtnGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <IconSunBig size={22} />
          <Text style={act.stopBtnText}>{t('sleep.stop_sleep')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Type Selector
// ─────────────────────────────────────────────────────────────────────────────

function SleepTypeSelector({ value, onChange }: { value: SleepType; onChange: (v: SleepType) => void }) {
  const { t } = useTranslation();
  return (
    <View style={sel.row}>
      {(['night', 'nap'] as SleepType[]).map((type) => {
        const active = value === type;
        const isNight = type === 'night';
        return (
          <TouchableOpacity
            key={type}
            style={[sel.pill, active && (isNight ? sel.pillActiveNight : sel.pillActiveNap)]}
            onPress={() => onChange(type)}
            activeOpacity={0.8}
          >
            {isNight
              ? <IconNight size={16} active={active} />
              : <IconSunSmall size={16} active={active} />
            }
            <Text style={[sel.pillText, active && sel.pillTextActive]}>
              {isNight ? t('sleep.night_sleep') : t('sleep.nap')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quality Selector
// ─────────────────────────────────────────────────────────────────────────────

const QUALITY_OPTIONS: { value: SleepQuality; emoji: string; labelKey: string }[] = [
  { value: 'restful',          emoji: '😴', labelKey: 'sleep.restful'          },
  { value: 'restless',         emoji: '😕', labelKey: 'sleep.restless'         },
  { value: 'frequent_waking',  emoji: '😣', labelKey: 'sleep.frequent_waking'  },
];

function QualitySelector({ value, onChange }: { value: SleepQuality | undefined; onChange: (v: SleepQuality) => void }) {
  const { t } = useTranslation();
  return (
    <View style={sel.row}>
      {QUALITY_OPTIONS.map(({ value: qv, emoji, labelKey }) => {
        const active = value === qv;
        return (
          <TouchableOpacity
            key={qv}
            style={[sel.qualPill, active && sel.qualPillActive]}
            onPress={() => onChange(qv)}
            activeOpacity={0.8}
          >
            <Text style={sel.qualEmoji}>{emoji}</Text>
            <Text style={[sel.qualText, active && sel.qualTextActive]}>{t(labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-Sleep Insight Card (shows after saving)
// ─────────────────────────────────────────────────────────────────────────────

function PerSleepInsightCard({ insight, onDismiss }: { insight: SleepInsight; onDismiss: () => void }) {
  const bg   = insight.type === 'good'    ? Colors.softMint
             : insight.type === 'warning' ? '#FEF3C7'
             : Colors.softBlue;
  const icon = insight.type === 'good' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡';

  return (
    <View style={[ins.card, { borderColor: bg, backgroundColor: bg }]}>
      <View style={ins.row}>
        <Text style={ins.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={ins.headline}>{insight.headline}</Text>
          <Text style={ins.detail}>{insight.detail}</Text>
          <Text style={ins.source}>{insight.source}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={ins.dismiss}>
          <Text style={{ color: Colors.lightGray, fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Sleep Summary Card (WHO analysis)
// ─────────────────────────────────────────────────────────────────────────────

function DailySleepSummaryCard({ todayEntries, childAgeMonths, childName }: {
  todayEntries: SleepEntry[]; childAgeMonths: number; childName: string;
}) {
  const { t }            = useTranslation();
  const [aiText, setAI]  = useState<string | null>(null);
  const [loading, setL]  = useState(false);
  const [expanded, setE] = useState(false);
  const hasFetched       = useRef(false);

  if (todayEntries.length === 0) return null;

  const summary = analyzeDailySleep(todayEntries, childAgeMonths, childName);

  const scoreDot = summary.overallScore === 'great'
    ? { color: Colors.mint,        bg: Colors.softMint,  emoji: '🌟' }
    : summary.overallScore === 'good'
    ? { color: Colors.gold,        bg: Colors.softGold,  emoji: '😊' }
    : { color: '#EF4444',          bg: '#FEF2F2',        emoji: '💤' };

  const fetchAI = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setL(true);
    const text = await getClaudeSleepSummary(summary, childName, childAgeMonths, 'en');
    setAI(text);
    setL(false);
  };

  return (
    <LinearGradient
      colors={['#F5F3FF', '#EDE9FE']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={dsc.card}
    >
      <View style={dsc.titleRow}>
        <View style={[dsc.scoreDot, { backgroundColor: scoreDot.bg }]}>
          <Text style={[dsc.scoreEmoji]}>{scoreDot.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dsc.label}>{t('sleep.ai_summary_label')}</Text>
          <Text style={[dsc.scoreLine, { color: scoreDot.color }]}>{summary.summaryLine}</Text>
        </View>
        <TouchableOpacity onPress={() => { setE(!expanded); if (!expanded) fetchAI(); }} style={dsc.expandBtn}>
          <Text style={dsc.expandTxt}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick stats */}
      <View style={dsc.statsRow}>
        <View style={dsc.statItem}>
          <Text style={dsc.statVal}>{summary.totalHours.toFixed(1)}h</Text>
          <Text style={dsc.statLbl}>{t('sleep.stat_total')}</Text>
        </View>
        <View style={dsc.statDivider} />
        <View style={dsc.statItem}>
          <Text style={dsc.statVal}>{summary.targetMin}–{summary.targetMax}h</Text>
          <Text style={dsc.statLbl}>{t('sleep.who_target')}</Text>
        </View>
        <View style={dsc.statDivider} />
        <View style={dsc.statItem}>
          <Text style={dsc.statVal}>{summary.napCount}</Text>
          <Text style={dsc.statLbl}>{t('sleep.summary.nap_count')}</Text>
        </View>
        <View style={dsc.statDivider} />
        <View style={dsc.statItem}>
          <Text style={dsc.statVal}>{formatSleepDuration(summary.longestStretchMinutes)}</Text>
          <Text style={dsc.statLbl}>{t('sleep.stat_longest')}</Text>
        </View>
      </View>

      {/* Sleep debt indicator */}
      {summary.sleepDebtMinutes < 0 && (
        <View style={dsc.debtRow}>
          <Text style={dsc.debtText}>
            {t('sleep.debt_short', { duration: formatSleepDuration(Math.abs(summary.sleepDebtMinutes)) })}
          </Text>
        </View>
      )}

      {/* Expanded insights */}
      {expanded && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {summary.insights.map((ins, i) => (
            <View key={i} style={[dsc.insightRow, { backgroundColor: ins.type === 'good' ? Colors.softMint : ins.type === 'warning' ? '#FEF3C7' : Colors.softBlue }]}>
              <Text style={dsc.insightIcon}>
                {ins.type === 'good' ? '✅' : ins.type === 'warning' ? '⚠️' : '💡'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={dsc.insightHead}>{ins.headline}</Text>
                <Text style={dsc.insightDetail}>{ins.detail}</Text>
              </View>
            </View>
          ))}

          {/* AI narrative */}
          {loading && (
            <View style={dsc.aiRow}>
              <Text style={dsc.aiLoading}>{t('sleep.ai_thinking')}</Text>
            </View>
          )}
          {aiText && (
            <View style={dsc.aiRow}>
              <Text style={dsc.aiLabel}>{t('sleep.ai_says')}</Text>
              <Text style={dsc.aiText}>{aiText}</Text>
            </View>
          )}
          <Text style={dsc.disclaimer}>{t('sleep.ai_disclaimer')}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirm Modal (kawaii style like feeding-log)
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({ visible, sleepType, onCancel, onConfirm }: {
  visible: boolean; sleepType: SleepType | null; onCancel: () => void; onConfirm: () => void;
}) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <Pressable style={del.overlay} onPress={onCancel}>
        <Pressable style={del.sheet} onPress={(e) => e.stopPropagation()}>
          <LinearGradient colors={['#EDE9FE', '#F5F3FF']} style={del.iconWrap}>
            <Text style={{ fontSize: 40 }}>{sleepType === 'night' ? '🌙' : '☀️'}</Text>
            <View style={del.sadBadge}><Text style={{ fontSize: 14 }}>😢</Text></View>
          </LinearGradient>
          <Text style={del.title}>{t('sleep.delete_title')}</Text>
          <Text style={del.body}>{t('sleep.delete_body')}</Text>
          <View style={del.btnRow}>
            <TouchableOpacity style={del.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={del.cancelTxt}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.85}>
              <LinearGradient colors={['#EF4444', '#DC2626']} style={del.deleteBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={del.deleteTxt}>{t('common.delete')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Entry Row
// ─────────────────────────────────────────────────────────────────────────────

function SleepEntryRow({ entry, onRequestDelete }: { entry: SleepEntry; onRequestDelete: (e: SleepEntry) => void }) {
  const { t }     = useTranslation();
  const durationM = getDurationMinutes(entry.startedAt, entry.endedAt);
  const isNight   = entry.sleepType === 'night';

  const qualityBg =
    entry.quality === 'restful'          ? Colors.softMint  :
    entry.quality === 'restless'         ? Colors.softGold  :
    entry.quality === 'frequent_waking'  ? '#FEE2E2'        : Colors.border;
  const qualityText =
    entry.quality === 'restful'          ? { color: Colors.mint,  label: t('sleep.quality_restful')   } :
    entry.quality === 'restless'         ? { color: '#92400E',    label: t('sleep.quality_restless')  } :
    entry.quality === 'frequent_waking'  ? { color: '#991B1B',    label: t('sleep.quality_frequent')  } :
    null;

  return (
    <View style={er.row}>
      <View style={[er.typeIcon, { backgroundColor: isNight ? '#EDE9FE' : '#FEF3C7' }]}>
        {isNight ? <Text style={{ fontSize: 20 }}>🌙</Text> : <Text style={{ fontSize: 20 }}>☀️</Text>}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={er.typeLabel}>{isNight ? t('sleep.night_sleep') : t('sleep.nap')}</Text>
          {!!durationM && (
            <View style={[er.durationBadge, { backgroundColor: isNight ? '#EDE9FE' : '#F5F3FF' }]}>
              <Text style={[er.durationText, { color: isNight ? NIGHT_COLOR : NAP_COLOR }]}>
                {formatSleepDuration(durationM)}
              </Text>
            </View>
          )}
        </View>
        <Text style={er.timeRange}>
          {formatTimePH(entry.startedAt)}
          {entry.endedAt ? ` → ${formatTimePH(entry.endedAt)}` : ` ${t('sleep.still_sleeping')}`}
        </Text>
        {qualityText && (
          <View style={[er.qualBadge, { backgroundColor: qualityBg }]}>
            <Text style={[er.qualText, { color: qualityText.color }]}>{qualityText.label}</Text>
          </View>
        )}
        {!!entry.notes && <Text style={er.notes} numberOfLines={1}>{entry.notes}</Text>}
      </View>
      <TouchableOpacity onPress={() => onRequestDelete(entry)} style={er.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <IconDelete size={16} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Sleep Modal
// ─────────────────────────────────────────────────────────────────────────────

function AddSleepModal({ visible, onClose, onSaved, prefillStart, prefillType }: {
  visible: boolean;
  onClose: () => void;
  onSaved: (entry: SleepEntry) => void;
  prefillStart?: string;
  prefillType?: SleepType;
}) {
  const { t }             = useTranslation();
  const { activeChild }   = useChildStore();
  const { addEntry }      = useSleepStore();

  const [mode, setMode]     = useState<'timer' | 'manual'>('timer');
  const [sleepType, setType] = useState<SleepType>(prefillType ?? 'nap');
  const [quality, setQual]   = useState<SleepQuality | undefined>(undefined);
  const [notes, setNotes]    = useState('');
  const [startInput, setStart] = useState('');
  const [endInput, setEnd]     = useState('');
  const [error, setError]      = useState('');

  // Timer sub-state (when stopping, show confirm panel)
  const [timerSeconds, setTimerSec] = useState(0);
  const {
    timerActive, timerStartedAt, timerSleepType,
    startTimer, stopTimer, getActiveElapsedSeconds,
  } = useSleepStore();

  useEffect(() => {
    if (!visible) return;
    // If prefill (called from stop-timer shortcut), set mode = timer
    if (prefillStart) {
      setMode('timer');
      setType(prefillType ?? 'nap');
    }
  }, [visible]);

  // Tick timer display
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setTimerSec(getActiveElapsedSeconds());
    }, 1_000);
    return () => clearInterval(id);
  }, [timerActive]);

  const handleStartTimer = () => {
    startTimer(sleepType);
    setTimerSec(0);
  };

  const handleSave = () => {
    setError('');
    if (mode === 'timer') {
      // Save with prefill (stop timer result)
      if (!prefillStart) { onClose(); return; }
      const entry: SleepEntry = {
        id:        uid(),
        childId:   activeChild?.id ?? '',
        startedAt: prefillStart,
        endedAt:   new Date().toISOString(),
        sleepType,
        quality,
        notes:     notes.trim() || undefined,
      };
      addEntry(entry);
      onSaved(entry);
      onClose();
    } else {
      // Manual entry
      const now = new Date();
      const s   = parseTimeInput(startInput, now);
      const e   = parseTimeInput(endInput,   now);
      if (!s) { setError('Enter a valid start time (e.g. 9:30 PM)'); return; }
      if (!e) { setError('Enter a valid end time (e.g. 11:00 PM)');  return; }
      if (e <= s) {
        // assume end is next day if end < start
        e.setDate(e.getDate() + 1);
      }
      const entry: SleepEntry = {
        id:        uid(),
        childId:   activeChild?.id ?? '',
        startedAt: s.toISOString(),
        endedAt:   e.toISOString(),
        sleepType,
        quality,
        notes:     notes.trim() || undefined,
      };
      addEntry(entry);
      onSaved(entry);
      onClose();
    }
  };

  const reset = () => {
    setMode('timer'); setType('nap'); setQual(undefined);
    setNotes(''); setStart(''); setEnd(''); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={mod.overlay} onPress={handleClose}>
        <Pressable style={mod.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={mod.handle} />
          <Text style={mod.title}>{t('sleep.add_entry')}</Text>

          {/* Mode tabs (only when no timer active) */}
          {!timerActive && !prefillStart && (
            <View style={mod.modeTabs}>
              {(['timer', 'manual'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[mod.modeTab, mode === m && mod.modeTabActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[mod.modeTabTxt, mode === m && mod.modeTabTxtActive]}>
                    {m === 'timer' ? `⏱ ${t('sleep.timer_mode')}` : `✏️ ${t('sleep.manual_mode')}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {/* Sleep type */}
            <Text style={mod.sectionLabel}>{t('sleep.sleep_type')}</Text>
            <SleepTypeSelector value={sleepType} onChange={setType} />

            {/* Timer mode: show timer if active, else start button */}
            {mode === 'timer' && !prefillStart && (
              <View style={mod.timerSection}>
                {timerActive ? (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, color: Colors.lightGray, fontWeight: '700' }}>
                      {t('sleep.timer_active')}
                    </Text>
                    <Text style={mod.timerDisplay}>{formatHHMMSS(timerSeconds)}</Text>
                    <Text style={mod.timerSub}>{t('sleep.timer_started_at', { time: formatTimePH(timerStartedAt!) })}</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={handleStartTimer} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#4338CA', '#7C3AED']}
                      style={mod.startBtn}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Text style={mod.startBtnTxt}>🌙 {t('sleep.start_sleep')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Prefill timer stop: show start/end recap */}
            {prefillStart && (
              <View style={mod.prefillRow}>
                <Text style={mod.prefillLabel}>{t('sleep.start_time')}</Text>
                <Text style={mod.prefillVal}>{formatTimePH(prefillStart)}</Text>
                <Text style={mod.prefillArrow}>→</Text>
                <Text style={mod.prefillLabel}>{t('sleep.prefill_now')}</Text>
                <Text style={mod.prefillVal}>{formatTimePH(new Date().toISOString())}</Text>
              </View>
            )}

            {/* Manual mode fields */}
            {mode === 'manual' && (
              <View style={{ gap: 12, marginTop: 4 }}>
                <View>
                  <Text style={mod.sectionLabel}>{t('sleep.start_time')}</Text>
                  <TextInput
                    style={mod.input}
                    value={startInput}
                    onChangeText={setStart}
                    placeholder="e.g. 8:30 PM"
                    placeholderTextColor={Colors.lightGray}
                  />
                </View>
                <View>
                  <Text style={mod.sectionLabel}>{t('sleep.end_time')}</Text>
                  <TextInput
                    style={mod.input}
                    value={endInput}
                    onChangeText={setEnd}
                    placeholder="e.g. 10:00 PM"
                    placeholderTextColor={Colors.lightGray}
                  />
                </View>
              </View>
            )}

            {/* Quality */}
            <Text style={[mod.sectionLabel, { marginTop: 16 }]}>{t('sleep.quality')}</Text>
            <QualitySelector value={quality} onChange={setQual} />

            {/* Notes */}
            <Text style={[mod.sectionLabel, { marginTop: 12 }]}>{t('common.notes')}</Text>
            <TextInput
              style={[mod.input, { height: 72, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('sleep.notes_placeholder')}
              placeholderTextColor={Colors.lightGray}
              multiline
            />

            {!!error && <Text style={mod.error}>{error}</Text>}
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity onPress={handleSave} activeOpacity={0.88} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={[NAP_COLOR, NIGHT_COLOR]}
              style={mod.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={mod.saveBtnTxt}>{t('sleep.save')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SleepTrackerScreen() {
  const { t }             = useTranslation();
  const { activeChild }   = useChildStore();
  const {
    entries, timerActive, timerStartedAt, timerSleepType,
    stopTimer, getTodayEntries, getWeeklyData, getActiveElapsedSeconds, restoreTimer,
  } = useSleepStore();

  const [filter,          setFilter]       = useState<'today' | 'week' | 'month'>('today');
  const [showModal,       setModal]        = useState(false);
  const [prefillStart,    setPrefill]      = useState<string | undefined>();
  const [prefillType,     setPrefillType]  = useState<SleepType | undefined>();
  const [deleteTarget,    setDeleteTarget] = useState<SleepEntry | null>(null);
  const [lastSavedInsight, setInsight]     = useState<SleepInsight | null>(null);
  const [timerSeconds,    setTimerSec]     = useState(0);

  const childId    = activeChild?.id ?? '';
  const ageMonths  = computeAgeMonths(activeChild?.birthday);
  const childName  = activeChild?.nickname ?? activeChild?.firstName ?? 'Baby';

  // Restore background timer on mount
  useEffect(() => { restoreTimer(); }, []);

  // Timer tick
  useEffect(() => {
    if (!timerActive) return;
    setTimerSec(getActiveElapsedSeconds());
    const id = setInterval(() => setTimerSec(getActiveElapsedSeconds()), 1_000);
    return () => clearInterval(id);
  }, [timerActive]);

  // Stop-timer shortcut: stop → open modal with prefill
  const handleStopTimer = useCallback(() => {
    const result = stopTimer();
    if (!result) return;
    setPrefill(result.startedAt);
    setPrefillType(result.sleepType);
    setModal(true);
  }, [stopTimer]);

  const handleSaved = useCallback((entry: SleepEntry) => {
    const ins = analyzeOneSleep(entry, ageMonths);
    if (ins) setInsight(ins);
    setPrefill(undefined);
    setPrefillType(undefined);
  }, [ageMonths]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      useSleepStore.getState().deleteEntry(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  // Filtered entries
  const childEntries = entries.filter((e) => e.childId === childId);
  const todayEntries = getTodayEntries(childId);
  const weeklyData   = getWeeklyData(childId);

  const filteredEntries = useMemo(() => {
    if (filter === 'today') {
      const today = new Date().toDateString();
      return childEntries.filter((e) => new Date(e.startedAt).toDateString() === today);
    }
    if (filter === 'week') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      return childEntries.filter((e) => new Date(e.startedAt) >= cutoff);
    }
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1);
    return childEntries.filter((e) => new Date(e.startedAt) >= cutoff);
  }, [childEntries, filter]);

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: { header: string; data: SleepEntry[] }[] = [];
    const map = new Map<string, SleepEntry[]>();
    filteredEntries.forEach((e) => {
      const key = new Date(e.startedAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    map.forEach((data, key) => {
      groups.push({ header: formatDateHeader(data[0].startedAt), data });
    });
    return groups;
  }, [filteredEntries]);

  const todaySleepH  = (todayEntries.reduce((s, e) => s + getDurationMinutes(e.startedAt, e.endedAt), 0) / 60).toFixed(1);
  const targetMinH   = ageMonths < 4 ? 14 : ageMonths < 12 ? 12 : ageMonths < 24 ? 11 : 10;

  return (
    <View style={s.screen}>
      {/* Header */}
      <LinearGradient colors={['#4338CA', '#7C3AED']} style={s.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>{t('sleep.title')} 😴</Text>
          {activeChild && (
            <Text style={s.headerSub}>{childName} · {t('sleep.age_months', { age: ageMonths })}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => { setPrefill(undefined); setPrefillType(undefined); setModal(true); }}
          activeOpacity={0.85}
        >
          <IconPlus size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Active timer card */}
        {timerActive && timerStartedAt && (
          <View style={{ marginHorizontal: PAD, marginTop: 16 }}>
            <ActiveTimerCard
              seconds={timerSeconds}
              sleepType={timerSleepType}
              startedAt={timerStartedAt}
              onStop={handleStopTimer}
            />
          </View>
        )}

        {/* Start Sleep button (when no timer) */}
        {!timerActive && (
          <View style={{ marginHorizontal: PAD, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setPrefill(undefined); setPrefillType(undefined);
                useSleepStore.getState().startTimer('nap');
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#4338CA', '#7C3AED', '#A78BFA']}
                style={s.startSleepBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={s.startSleepEmoji}>🌙</Text>
                <View>
                  <Text style={s.startSleepText}>{t('sleep.start_sleep')}</Text>
                  <Text style={s.startSleepSub}>{t('sleep.tap_to_start')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Per-sleep insight (after save) */}
        {lastSavedInsight && (
          <View style={{ marginHorizontal: PAD, marginTop: 12 }}>
            <PerSleepInsightCard insight={lastSavedInsight} onDismiss={() => setInsight(null)} />
          </View>
        )}

        {/* Today stats strip */}
        <View style={s.statsStrip}>
          <View style={s.statChip}>
            <Text style={s.statChipVal}>{todaySleepH}h</Text>
            <Text style={s.statChipLbl}>{t('sleep.filters.today')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statChip}>
            <Text style={s.statChipVal}>{targetMinH}–{targetMinH + 3}h</Text>
            <Text style={s.statChipLbl}>{t('sleep.who_target')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statChip}>
            <Text style={s.statChipVal}>{todayEntries.filter((e) => e.sleepType === 'nap').length}</Text>
            <Text style={s.statChipLbl}>{t('sleep.summary.nap_count')}</Text>
          </View>
        </View>

        {/* 24-hour timeline */}
        {todayEntries.length > 0 && (
          <View style={{ marginHorizontal: PAD, marginTop: 4 }}>
            <SleepTimeline24h entries={todayEntries} />
          </View>
        )}

        {/* Weekly chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>{t('sleep.weekly_chart_title')} 📊</Text>
          <WeeklyBarChart data={weeklyData} targetMin={targetMinH} />
        </View>

        {/* Daily AI summary card */}
        {filter === 'today' && (
          <View style={{ marginHorizontal: PAD, marginTop: 4 }}>
            <DailySleepSummaryCard
              todayEntries={todayEntries}
              childAgeMonths={ageMonths}
              childName={childName}
            />
          </View>
        )}

        {/* Filter tabs */}
        <View style={s.filterRow}>
          {(['today', 'week', 'month'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterTabTxt, filter === f && s.filterTabTxtActive]}>
                {t(`sleep.filters.${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Entry list */}
        {groupedEntries.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>😴</Text>
            <Text style={s.emptyTitle}>{t('sleep.no_entries')}</Text>
            <Text style={s.emptySub}>{t('sleep.empty_sub')}</Text>
          </View>
        ) : (
          groupedEntries.map(({ header, data }) => (
            <View key={header} style={{ marginHorizontal: PAD }}>
              <Text style={s.dateHeader}>{header}</Text>
              <View style={s.entryGroup}>
                {data.map((entry, i) => (
                  <React.Fragment key={entry.id}>
                    {i > 0 && <View style={s.entryDivider} />}
                    <SleepEntryRow entry={entry} onRequestDelete={setDeleteTarget} />
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Dev button for testing */}
        {typeof __DEV__ !== 'undefined' && __DEV__ && (
          <TouchableOpacity
            style={{ margin: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' }}
            onPress={() => {
              const store  = (window as any).__sleepStore?.getState?.();
              const child  = (window as any).__childStore?.getState?.()?.activeChild;
              if (!store || !child) return;
              const now    = new Date();
              const start9 = new Date(now); start9.setHours(21, 0, 0, 0);
              const end6   = new Date(now); end6.setHours(6, 0, 0, 0); end6.setDate(end6.getDate() + 1);
              const napS   = new Date(now); napS.setHours(14, 0, 0, 0);
              const napE   = new Date(now); napE.setHours(15, 15, 0, 0);
              store.addEntry({ id: uid(), childId: child.id, startedAt: start9.toISOString(), endedAt: end6.toISOString(), sleepType: 'night', quality: 'restful' });
              store.addEntry({ id: uid(), childId: child.id, startedAt: napS.toISOString(),  endedAt: napE.toISOString(),  sleepType: 'nap',   quality: 'restful' });
            }}
          >
            <Text style={{ fontSize: 13, color: NAP_COLOR, fontWeight: '700' }}>😴 Dev: Add Test Sleep Entries</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <AddSleepModal
        visible={showModal}
        onClose={() => setModal(false)}
        onSaved={handleSaved}
        prefillStart={prefillStart}
        prefillType={prefillType}
      />
      <DeleteConfirmModal
        visible={!!deleteTarget}
        sleepType={deleteTarget?.sleepType ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: Colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingTop: Platform.OS === 'ios' ? 52 : 16, paddingBottom: 14 },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerSub:        { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 1 },
  addBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  scroll:           { flex: 1 },
  content:          { paddingBottom: 40 },
  startSleepBtn:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 24, shadowColor: NIGHT_COLOR, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  startSleepEmoji:  { fontSize: 36 },
  startSleepText:   { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  startSleepSub:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  statsStrip:       { flexDirection: 'row', marginHorizontal: PAD, marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.border },
  statChip:         { flex: 1, alignItems: 'center', gap: 2 },
  statChipVal:      { fontSize: 18, fontWeight: '800', color: NIGHT_COLOR },
  statChipLbl:      { fontSize: 10, color: Colors.lightGray, fontWeight: '700', textTransform: 'uppercase' },
  statDivider:      { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  chartCard:        { backgroundColor: '#FFFFFF', borderRadius: 22, marginHorizontal: PAD, marginTop: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  chartTitle:       { fontSize: 14, fontWeight: '800', color: Colors.dark, marginBottom: 12, alignSelf: 'flex-start' },
  filterRow:        { flexDirection: 'row', gap: 8, marginHorizontal: PAD, marginTop: 16, marginBottom: 10 },
  filterTab:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.border },
  filterTabActive:  { backgroundColor: NIGHT_COLOR, borderColor: NIGHT_COLOR },
  filterTabTxt:     { fontSize: 12, fontWeight: '700', color: Colors.midGray },
  filterTabTxtActive:{ color: '#FFFFFF' },
  dateHeader:       { fontSize: 11, fontWeight: '800', color: Colors.lightGray, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14, marginBottom: 6 },
  entryGroup:       { backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.border },
  entryDivider:     { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
  empty:            { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:       { fontSize: 16, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  emptySub:         { fontSize: 13, color: Colors.lightGray, textAlign: 'center', maxWidth: 260, lineHeight: 19 },
});

// Active timer card
const act = StyleSheet.create({
  card:         { borderRadius: 24, padding: 24, alignItems: 'center', gap: 6, overflow: 'hidden', shadowColor: NIGHT_COLOR, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  glow:         { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(167,139,250,0.25)', top: -40, alignSelf: 'center' },
  typeBadge:    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  typeBadgeText:{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  timerText:    { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginTop: 4 },
  startedLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  stopBtn:      { marginTop: 12, borderRadius: 16, overflow: 'hidden', shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 8 },
  stopBtnGrad:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  stopBtnText:  { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

// Selectors
const sel = StyleSheet.create({
  row:               { flexDirection: 'row', gap: 8, marginTop: 6 },
  pill:              { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#FFFFFF' },
  pillActiveNight:   { backgroundColor: NIGHT_COLOR, borderColor: NIGHT_COLOR },
  pillActiveNap:     { backgroundColor: NAP_COLOR, borderColor: NAP_COLOR },
  pillText:          { fontSize: 13, fontWeight: '700', color: Colors.midGray },
  pillTextActive:    { color: '#FFFFFF' },
  qualPill:          { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#FFFFFF', gap: 3 },
  qualPillActive:    { borderColor: NAP_COLOR, backgroundColor: NIGHT_LIGHT },
  qualEmoji:         { fontSize: 18 },
  qualText:          { fontSize: 10, fontWeight: '700', color: Colors.midGray, textAlign: 'center' },
  qualTextActive:    { color: NIGHT_COLOR },
});

// Entry row
const er = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  typeIcon:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeLabel:     { fontSize: 14, fontWeight: '700', color: Colors.dark },
  durationBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  durationText:  { fontSize: 12, fontWeight: '800' },
  timeRange:     { fontSize: 12, color: Colors.midGray, fontWeight: '600' },
  qualBadge:     { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  qualText:      { fontSize: 11, fontWeight: '700' },
  notes:         { fontSize: 11, color: Colors.lightGray, marginTop: 2 },
  deleteBtn:     { padding: 4, marginTop: 2 },
});

// Per-sleep insight card
const ins = StyleSheet.create({
  card:     { borderRadius: 16, padding: 14, borderWidth: 1.5 },
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icon:     { fontSize: 18, marginTop: 1 },
  headline: { fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 3 },
  detail:   { fontSize: 12, color: Colors.midGray, lineHeight: 17 },
  source:   { fontSize: 10, color: Colors.lightGray, fontWeight: '600', marginTop: 4 },
  dismiss:  { padding: 4 },
});

// Daily summary card
const dsc = StyleSheet.create({
  card:          { borderRadius: 22, padding: 16, shadowColor: NAP_COLOR, shadowOpacity: 0.12, shadowRadius: 10, elevation: 3 },
  titleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  scoreDot:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scoreEmoji:    { fontSize: 22 },
  label:         { fontSize: 10, color: Colors.lightGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreLine:     { fontSize: 13, fontWeight: '800', marginTop: 2 },
  expandBtn:     { padding: 6 },
  expandTxt:     { fontSize: 13, color: NAP_COLOR, fontWeight: '700' },
  statsRow:      { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  statItem:      { flex: 1, alignItems: 'center', gap: 2 },
  statVal:       { fontSize: 14, fontWeight: '800', color: NIGHT_COLOR },
  statLbl:       { fontSize: 9, color: Colors.lightGray, fontWeight: '700', textTransform: 'uppercase' },
  statDivider:   { width: 1, height: 28, backgroundColor: Colors.border },
  debtRow:       { marginTop: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10 },
  debtText:      { fontSize: 12, color: '#92400E', fontWeight: '600', lineHeight: 17 },
  insightRow:    { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 10, alignItems: 'flex-start' },
  insightIcon:   { fontSize: 14, marginTop: 1 },
  insightHead:   { fontSize: 12, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  insightDetail: { fontSize: 11, color: Colors.midGray, lineHeight: 16 },
  aiRow:         { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: 12, marginTop: 4 },
  aiLabel:       { fontSize: 11, fontWeight: '800', color: NAP_COLOR, marginBottom: 4 },
  aiText:        { fontSize: 12, color: Colors.dark, lineHeight: 18 },
  aiLoading:     { fontSize: 12, color: Colors.lightGray, fontStyle: 'italic' },
  disclaimer:    { fontSize: 10, color: Colors.lightGray, lineHeight: 15, marginTop: 8, fontStyle: 'italic' },
});

// Delete modal
const del = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  sheet:     { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, margin: 32, alignItems: 'center', gap: 12 },
  iconWrap:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  sadBadge:  { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#FFFFFF', borderRadius: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  title:     { fontSize: 17, fontWeight: '800', color: Colors.dark, textAlign: 'center' },
  body:      { fontSize: 13, color: Colors.midGray, textAlign: 'center', lineHeight: 19 },
  btnRow:    { flexDirection: 'row', gap: 12, marginTop: 4, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.softPink, alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '800', color: Colors.primaryPink },
  deleteBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  deleteTxt: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});

// Add modal
const mod = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  handle:        { width: 44, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },
  title:         { fontSize: 18, fontWeight: '800', color: Colors.dark, marginBottom: 16 },
  modeTabs:      { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeTab:       { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modeTabActive: { backgroundColor: NIGHT_COLOR, borderColor: NIGHT_COLOR },
  modeTabTxt:    { fontSize: 13, fontWeight: '700', color: Colors.midGray },
  modeTabTxtActive:{ color: '#FFFFFF' },
  sectionLabel:  { fontSize: 11, fontWeight: '800', color: Colors.lightGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  timerSection:  { alignItems: 'center', paddingVertical: 16 },
  timerDisplay:  { fontSize: 44, fontWeight: '900', color: NIGHT_COLOR, letterSpacing: 2 },
  timerSub:      { fontSize: 11, color: Colors.lightGray, marginTop: 4 },
  startBtn:      { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  startBtnTxt:   { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  prefillRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.softBlue, borderRadius: 14, padding: 12, marginTop: 8 },
  prefillLabel:  { fontSize: 10, color: Colors.lightGray, fontWeight: '700' },
  prefillVal:    { fontSize: 13, fontWeight: '800', color: NIGHT_COLOR },
  prefillArrow:  { fontSize: 14, color: Colors.lightGray },
  input:         { backgroundColor: Colors.background, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.dark },
  error:         { fontSize: 12, color: '#EF4444', marginTop: 8, fontWeight: '600' },
  saveBtn:       { borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: NAP_COLOR, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
  saveBtnTxt:    { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
