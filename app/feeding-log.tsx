/**
 * feeding-log.tsx — Full Feeding Log Screen
 *
 * Better-than-competitors features:
 *  • Live nursing timer with last-side memory (suggests other breast)
 *  • Daily feeding goal progress bar (DOH/WHO recommended 8–12 for newborns)
 *  • Feeding interval color indicator (green / yellow / red)
 *  • First-food milestone auto-detection for solids
 *  • Allergen cross-check against baby's known allergies
 *  • Quick-repeat "Log same as last" one-tap button
 *  • Visual daily timeline (feed dots on a time axis)
 *  • Age-specific DOH/WHO tip card
 *  • Foods tried tracker for solids
 *  • Swipe-delete with confirm dialog
 *  • Full trilingual support (EN / FIL / ZH)
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, StyleSheet, Dimensions, Platform,
  KeyboardAvoidingView, FlatList, Pressable,
} from 'react-native';
import Svg, {
  Path, Circle, Rect, Ellipse,
  Defs, LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AlertTriangle, Bot, CheckCircle2, ClipboardList, Lightbulb, Milk, UtensilsCrossed } from 'lucide-react-native';
import Colors from '../constants/Colors';
import {
  useFeedingStore,
  FeedingEntry, FeedType, BreastSide, MilkType, SolidsTexture, SolidsReaction,
  PauseInterval,
  getEntriesForChild, getLastFeed, getTodayEntries,
  getSuggestedSide, formatDuration, timeAgoShort, minutesSince, getFoodsTriedByChild,
  getActiveElapsedSeconds, formatTimerMark,
} from '../store/feedingStore';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import {
  analyzeOneFeed, analyzeDailyFeeding, getClaudeDailySummary,
  FeedInsight,
} from '../lib/feedingInsights';

const { width: W } = Dimensions.get('window');
const PAD = 16;

// ── Common allergen keywords to cross-check ────────────────────────────────────
const COMMON_ALLERGENS: Record<string, string[]> = {
  eggs:    ['itlog', 'egg'],
  milk:    ['gatas', 'milk', 'dairy'],
  fish:    ['isda', 'fish', 'tilapia', 'bangus', 'salmon'],
  shrimp:  ['hipon', 'shrimp'],
  nuts:    ['mani', 'peanut', 'nuts', 'cashew'],
  wheat:   ['trigo', 'wheat', 'gluten'],
  soy:     ['toyo', 'soy', 'tofu'],
};

// ── PH quick-select foods ──────────────────────────────────────────────────────
const PH_FOODS = ['Lugaw', 'Kamote', 'Kalabasa', 'Saging', 'Malunggay', 'Itlog', 'Manok', 'Isda'];

// ── Formula brands ─────────────────────────────────────────────────────────────
const FORMULA_BRANDS = ['NAN', 'Similac', 'Enfamil', 'Promil', 'Nido', 'S-26'];

// ── DOH/WHO age tip ────────────────────────────────────────────────────────────
function getAgeTip(ageMonths: number, t: (k: string) => string): string {
  if (ageMonths >= 12) return t('feeding.tip_12mo');
  if (ageMonths >= 6)  return t('feeding.tip_6_12mo');
  if (ageMonths >= 4)  return t('feeding.tip_4_6mo');
  return t('feeding.tip_0_6mo');
}

// ── Recommended daily feeds ────────────────────────────────────────────────────
function getRecommendedFeeds(ageMonths: number): number {
  if (ageMonths < 1)  return 12;
  if (ageMonths < 3)  return 10;
  if (ageMonths < 6)  return 8;
  if (ageMonths < 12) return 5;
  return 3;
}

// ── Interval status ────────────────────────────────────────────────────────────
function getIntervalStatus(lastFeed: FeedingEntry | null, ageMonths: number) {
  if (!lastFeed) return 'alert';
  const mins = minutesSince(lastFeed.startedAt);
  const alertMins = ageMonths < 3 ? 180 : ageMonths < 6 ? 240 : 360;
  const warnMins  = alertMins - 60;
  if (mins < warnMins)  return 'ok';
  if (mins < alertMins) return 'check';
  return 'alert';
}

// ─────────────────────────────────────────────────────────────────────────────
// Kawaii SVG icons
// ─────────────────────────────────────────────────────────────────────────────

function IconBack({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={Colors.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPlus({ size = 22, color = Colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </Svg>
  );
}

function IconBreastfeed({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="bfG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFB6C8" />
          <Stop offset="1" stopColor="#E63B6F" />
        </SvgGrad>
      </Defs>
      <Circle cx="24" cy="24" r="18" fill="url(#bfG)" />
      <Circle cx="24" cy="24" r="8"  fill="#fff" opacity="0.35" />
      <Circle cx="24" cy="24" r="4"  fill="#fff" opacity="0.6" />
    </Svg>
  );
}

function IconBottle({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="botG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#93C5FD" />
          <Stop offset="1" stopColor="#1A73C8" />
        </SvgGrad>
      </Defs>
      <Rect x="14" y="14" width="20" height="28" rx="8" fill="url(#botG)" />
      <Rect x="18" y="8"  width="12" height="8"  rx="4" fill="#BAE6FD" />
      <Rect x="15" y="26" width="18" height="10" rx="5" fill="#fff" opacity="0.2" />
    </Svg>
  );
}

function IconSolids({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="solG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </SvgGrad>
      </Defs>
      <Ellipse cx="24" cy="32" rx="18" ry="10" fill="url(#solG)" />
      <Path d="M16 28 Q24 16 32 28" fill="#FEF3C7" />
      <Circle cx="24" cy="22" r="5" fill="#6EE7B7" />
    </Svg>
  );
}

function IconTimer({ size = 22, color = Colors.primaryPink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
      <Path d="M12 9v4l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 3h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IconDelete({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateHeader(isoDate: string): string {
  const d   = new Date(isoDate);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupByDate(entries: FeedingEntry[]): { header: string; data: FeedingEntry[] }[] {
  const map = new Map<string, FeedingEntry[]>();
  for (const e of entries) {
    const key = new Date(e.startedAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return [...map.entries()].map(([, data]) => ({
    header: formatDateHeader(data[0].startedAt),
    data,
  }));
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function checkAllergen(foodItem: string, allergies: string[]): string | null {
  const lower = foodItem.toLowerCase();
  for (const allergy of allergies) {
    const al = allergy.toLowerCase();
    for (const [, keywords] of Object.entries(COMMON_ALLERGENS)) {
      if (keywords.some((k) => al.includes(k) || lower.includes(k))) {
        return allergy;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary cards
// ─────────────────────────────────────────────────────────────────────────────

interface SummaryProps {
  todayEntries: FeedingEntry[];
  lastFeed:     FeedingEntry | null;
  ageMonths:    number;
  childName:    string;
}

function SummaryStrip({ todayEntries, lastFeed, ageMonths, childName }: SummaryProps) {
  const { t }            = useTranslation();
  const totalVol         = todayEntries.reduce((s, e) => s + (e.volumeMl ?? 0), 0);
  const target           = getRecommendedFeeds(ageMonths);
  const progress         = Math.min(todayEntries.length / target, 1);
  const intervalStatus   = getIntervalStatus(lastFeed, ageMonths);
  const intervalColors   = { ok: Colors.mint, check: Colors.gold, alert: Colors.primaryPink };
  const iColor           = intervalColors[intervalStatus];

  // Average interval today
  const avgInterval = useMemo(() => {
    if (todayEntries.length < 2) return null;
    const sorted = [...todayEntries].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
    let total = 0;
    for (let i = 1; i < sorted.length; i++) {
      total += new Date(sorted[i].startedAt).getTime() - new Date(sorted[i - 1].startedAt).getTime();
    }
    const avgMins = Math.round(total / (sorted.length - 1) / 60000);
    return formatDuration(avgMins);
  }, [todayEntries]);

  return (
    <View style={ss.wrap}>
      {/* Row 1: 3 stat cards */}
      <View style={ss.row}>
        <View style={[ss.card, { borderTopColor: Colors.primaryPink }]}>
          <Text style={ss.val}>{todayEntries.length}</Text>
          <Text style={ss.lbl}>{t('feeding.summary_feeds')}</Text>
        </View>
        <View style={[ss.card, { borderTopColor: Colors.blue }]}>
          <Text style={ss.val}>{totalVol > 0 ? `${totalVol} ml` : '—'}</Text>
          <Text style={ss.lbl}>{t('feeding.summary_volume')}</Text>
        </View>
        <View style={[ss.card, { borderTopColor: iColor }]}>
          <Text style={[ss.val, { color: iColor }]}>
            {lastFeed ? timeAgoShort(lastFeed.startedAt) : '—'}
          </Text>
          <Text style={ss.lbl}>{t('feeding.summary_last_fed')}</Text>
        </View>
      </View>

      {/* Row 2: daily goal progress */}
      <View style={ss.goalWrap}>
        <View style={ss.goalRow}>
          <Text style={ss.goalLbl}>{t('feeding.goal_label')}</Text>
          <Text style={ss.goalCount}>
            {todayEntries.length} / {target}{'  '}
            <Text style={ss.goalSub}>{t('feeding.goal_of', { target })}</Text>
          </Text>
        </View>
        <View style={ss.barBg}>
          <View style={[ss.barFill, { width: `${progress * 100}%`, backgroundColor: progress >= 1 ? Colors.mint : Colors.primaryPink }]} />
        </View>
      </View>

      {/* Row 3: interval warning pill */}
      {intervalStatus !== 'ok' && (
        <View style={[ss.pill, { backgroundColor: iColor + '22', borderColor: iColor }]}>
          <Text style={[ss.pillText, { color: iColor }]}>
            {t(`feeding.interval_${intervalStatus}`)}
            {lastFeed ? `  •  ${timeAgoShort(lastFeed.startedAt)}` : ''}
          </Text>
        </View>
      )}

      {avgInterval && (
        <View style={ss.avgRow}>
          <IconTimer size={14} color={Colors.midGray} />
          <Text style={ss.avgTxt}>{t('feeding.summary_interval')}: {avgInterval}</Text>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  wrap:      { paddingHorizontal: PAD, gap: 10, marginBottom: 4 },
  row:       { flexDirection: 'row', gap: 10 },
  card:      {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 12,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    alignItems: 'center',
  },
  val:       { fontSize: 18, fontWeight: '800', color: Colors.dark },
  lbl:       { fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  goalWrap:  { backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  goalRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalLbl:   { fontSize: 12, fontWeight: '700', color: Colors.dark },
  goalCount: { fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  goalSub:   { fontSize: 11, color: Colors.midGray, fontWeight: '600' },
  barBg:     { height: 8, backgroundColor: Colors.softPink, borderRadius: 4, overflow: 'hidden' },
  barFill:   { height: 8, borderRadius: 4 },
  pill:      { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  pillText:  { fontSize: 13, fontWeight: '700' },
  avgRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avgTxt:    { fontSize: 11, color: Colors.midGray, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Daily timeline (dots on time axis)
// ─────────────────────────────────────────────────────────────────────────────
function DailyTimeline({ entries }: { entries: FeedingEntry[] }) {
  if (entries.length === 0) return null;
  const typeColor: Record<FeedType, string> = {
    breastfeed: Colors.primaryPink,
    bottle:     Colors.blue,
    solids:     Colors.warning,
  };
  const timelineW = W - PAD * 2 - 32;

  return (
    <View style={tl.wrap}>
      <Text style={tl.title}>Today's Timeline</Text>
      <View style={tl.axis}>
        <View style={tl.line} />
        {entries.map((e) => {
          const d = new Date(e.startedAt);
          const minutesFromMidnight = d.getHours() * 60 + d.getMinutes();
          const left = (minutesFromMidnight / 1440) * timelineW;
          return (
            <View key={e.id} style={[tl.dot, { left, backgroundColor: typeColor[e.feedType] }]}>
              <Text style={tl.dotTime}>{formatTime(e.startedAt)}</Text>
            </View>
          );
        })}
        <Text style={tl.labelL}>12 AM</Text>
        <Text style={tl.labelR}>11 PM</Text>
      </View>
    </View>
  );
}

const tl = StyleSheet.create({
  wrap:     { marginHorizontal: PAD, backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  title:    { fontSize: 12, fontWeight: '700', color: Colors.dark, marginBottom: 14 },
  axis:     { height: 36, position: 'relative', marginHorizontal: 8 },
  line:     { position: 'absolute', top: 8, left: 0, right: 0, height: 3, backgroundColor: Colors.softPink, borderRadius: 2 },
  dot:      { position: 'absolute', top: 0, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  dotTime:  { position: 'absolute', top: 22, fontSize: 8, color: Colors.midGray, fontWeight: '600', width: 40, textAlign: 'center', left: -11 },
  labelL:   { position: 'absolute', bottom: 0, left: 0, fontSize: 9, color: Colors.lightGray, fontWeight: '600' },
  labelR:   { position: 'absolute', bottom: 0, right: 0, fontSize: 9, color: Colors.lightGray, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Feed entry row
// ─────────────────────────────────────────────────────────────────────────────
function FeedEntryRow({
  entry, onEdit, onRequestDelete,
}: {
  entry:           FeedingEntry;
  onEdit:          (e: FeedingEntry) => void;
  onRequestDelete: (e: FeedingEntry) => void;
}) {
  const { t } = useTranslation();
  const typeColor: Record<FeedType, string> = {
    breastfeed: Colors.primaryPink,
    bottle:     Colors.blue,
    solids:     Colors.warning,
  };
  const color = typeColor[entry.feedType];

  function subtitle() {
    if (entry.feedType === 'breastfeed') {
      const side = entry.breastSide ? `${entry.breastSide} side` : '';
      const dur  = entry.durationMinutes ? ` · ${formatDuration(entry.durationMinutes)}` : '';
      return `${side}${dur}`.trim() || 'Breastfeed';
    }
    if (entry.feedType === 'bottle') {
      const vol = entry.volumeMl ? `${entry.volumeMl} ml` : '';
      return [entry.formulaBrand, vol].filter(Boolean).join(' · ') || 'Bottle';
    }
    // solids
    return [
      entry.foodItem,
      entry.amount,
      entry.isFirstFood ? '🎉 First time!' : '',
    ].filter(Boolean).join(' · ');
  }

  const FeedIcon = entry.feedType === 'breastfeed' ? IconBreastfeed
    : entry.feedType === 'bottle' ? IconBottle : IconSolids;

  return (
    <TouchableOpacity onPress={() => onEdit(entry)} activeOpacity={0.78}>
      <View style={er.row}>
        <View style={[er.iconWrap, { backgroundColor: color + '18' }]}>
          <FeedIcon size={28} />
        </View>
        <View style={er.body}>
          <Text style={er.type}>{t(`feeding.type_${entry.feedType}`)}</Text>
          <Text style={er.sub} numberOfLines={1}>{subtitle()}</Text>
          {entry.reaction === 'allergic' && (
            <Text style={er.allergyBadge}><AlertTriangle size={14} color={Colors.danger} /> Allergic reaction noted</Text>
          )}
        </View>
        <View style={er.right}>
          <Text style={er.time}>{formatTime(entry.startedAt)}</Text>
          <TouchableOpacity
            onPress={() => onRequestDelete(entry)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconDelete size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const er = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 12, backgroundColor: Colors.white },
  iconWrap:    { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body:        { flex: 1 },
  type:        { fontSize: 13, fontWeight: '700', color: Colors.dark },
  sub:         { fontSize: 11, color: Colors.midGray, marginTop: 2 },
  allergyBadge:{ fontSize: 10, color: Colors.danger, fontWeight: '700', marginTop: 3 },
  right:       { alignItems: 'flex-end', gap: 8 },
  time:        { fontSize: 12, fontWeight: '700', color: Colors.midGray },
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete Confirmation Modal — kawaii, replaces Alert.alert
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ visible, feedType, onCancel, onConfirm }: {
  visible:   boolean;
  feedType:  FeedType | null;
  onCancel:  () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const FeedIcon = feedType === 'breastfeed' ? IconBreastfeed
    : feedType === 'bottle' ? IconBottle : IconSolids;
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <Pressable style={dc.overlay} onPress={onCancel}>
        <Pressable style={dc.card} onPress={() => {}}>
          <View style={dc.iconWrap}>
            {FeedIcon && <FeedIcon size={52} />}
            <View style={dc.sadBadge}><Text style={dc.sadEmoji}>😢</Text></View>
          </View>
          <Text style={dc.title}>{t('feeding.delete_title')}</Text>
          <Text style={dc.body}>{t('feeding.delete_body')}</Text>
          <View style={dc.btnRow}>
            <TouchableOpacity style={dc.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={dc.cancelTxt}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dc.deleteBtn} onPress={onConfirm} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.danger, '#DC2626']}
                style={dc.deleteBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <IconDelete size={16} />
                <Text style={dc.deleteTxt}>{t('common.delete')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const dc = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(28,28,58,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:          { backgroundColor: Colors.white, borderRadius: 28, padding: 28, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, elevation: 10 },
  iconWrap:      { position: 'relative', marginBottom: 16 },
  sadBadge:      { position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.dangerBg, borderWidth: 2, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  sadEmoji:      { fontSize: 13 },
  title:         { fontSize: 18, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 8 },
  body:          { fontSize: 13, color: Colors.midGray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnRow:        { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn:     { flex: 1, borderRadius: 16, borderWidth: 2, borderColor: Colors.primaryPink, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.softPink },
  cancelTxt:     { fontSize: 14, fontWeight: '800', color: Colors.primaryPink },
  deleteBtn:     { flex: 1, borderRadius: 16, overflow: 'hidden' },
  deleteBtnGrad: { flexDirection: 'row', gap: 6, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  deleteTxt:     { fontSize: 14, fontWeight: '800', color: Colors.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// Timer Timeline — pause/resume dot track shown below the breastfeed timer
// ─────────────────────────────────────────────────────────────────────────────
function TimerTimeline({ timerStartedAt, pauseIntervals, activeSeconds }: {
  timerStartedAt: string;
  pauseIntervals: PauseInterval[];
  activeSeconds:  number;
}) {
  const totalWallSecs = Math.max(
    1,
    Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000),
  );
  if (totalWallSecs < 5) return null;

  const trackW = W - PAD * 2 - 48;

  function frac(isoDate: string) {
    const secs = Math.floor((new Date(isoDate).getTime() - new Date(timerStartedAt).getTime()) / 1000);
    return Math.min(Math.max(secs / totalWallSecs, 0), 1);
  }

  return (
    <View style={ttl.wrap}>
      <View style={[ttl.track, { width: trackW }]}>
        {/* Start dot */}
        <View style={[ttl.dot, ttl.dotStart, { left: 0 }]}>
          <Text style={[ttl.lbl, { left: -8 }]}>0:00</Text>
        </View>

        {/* Pause / Resume dots */}
        {pauseIntervals.map((interval, idx) => {
          const pl = frac(interval.pausedAt) * trackW;
          return (
            <React.Fragment key={idx}>
              <View style={[ttl.dot, ttl.dotPause, { left: pl }]}>
                <Text style={[ttl.lbl, ttl.lblGold, { left: -18 }]}>
                  ⏸{formatTimerMark(interval.pausedAt, timerStartedAt)}
                </Text>
              </View>
              {interval.resumedAt && (
                <View style={[ttl.dot, ttl.dotResume, { left: frac(interval.resumedAt) * trackW }]}>
                  <Text style={[ttl.lbl, ttl.lblMint, { left: -16 }]}>
                    ▶{formatTimerMark(interval.resumedAt, timerStartedAt)}
                  </Text>
                </View>
              )}
            </React.Fragment>
          );
        })}

        {/* Current position */}
        <View style={[ttl.dot, ttl.dotCurrent, { left: trackW }]}>
          <Text style={[ttl.lbl, ttl.lblPink, { left: -10 }]}>
            {Math.floor(activeSeconds / 60).toString().padStart(2, '0')}:
            {(activeSeconds % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>
      <Text style={ttl.activeLbl}>Active nursing: {formatDuration(Math.max(1, Math.round(activeSeconds / 60)))}</Text>
    </View>
  );
}
const ttl = StyleSheet.create({
  wrap:       { marginTop: 10, marginBottom: 6, paddingHorizontal: 12 },
  track:      { height: 4, backgroundColor: Colors.softPink, borderRadius: 2, position: 'relative', marginBottom: 28 },
  dot:        { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.white },
  dotStart:   { backgroundColor: Colors.mint },
  dotPause:   { backgroundColor: Colors.gold },
  dotResume:  { backgroundColor: Colors.mint },
  dotCurrent: { backgroundColor: Colors.primaryPink },
  lbl:        { position: 'absolute', top: 18, fontSize: 8, color: Colors.midGray, fontWeight: '700', width: 36, textAlign: 'center' },
  lblGold:    { color: Colors.gold, width: 46 },
  lblMint:    { color: Colors.mint, width: 42 },
  lblPink:    { color: Colors.primaryPink, width: 36 },
  activeLbl:  { fontSize: 10, color: Colors.midGray, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Per-Feed Insight Card — shown after saving a feed
// ─────────────────────────────────────────────────────────────────────────────
function PerFeedInsightCard({ insight, onDismiss }: {
  insight:   FeedInsight;
  onDismiss: () => void;
}) {
  const bgMap: Record<FeedInsight['type'], [string, string]> = {
    good:    [Colors.softMint, '#D1FAE5'],
    tip:     [Colors.softGold, '#FEF3C7'],
    warning: [Colors.dangerBg, '#FEE2E2'],
  };
  const colorMap: Record<FeedInsight['type'], string> = {
    good: Colors.mint, tip: Colors.gold, warning: Colors.danger,
  };
  const tc = colorMap[insight.type];
  const InsightIcon = insight.type === 'good' ? CheckCircle2 : insight.type === 'tip' ? Lightbulb : AlertTriangle;
  return (
    <LinearGradient colors={bgMap[insight.type]} style={pf.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={pf.row}>
        <View style={pf.emoji}><InsightIcon size={20} color={tc} /></View>
        <View style={pf.body}>
          <Text style={[pf.headline, { color: tc }]}>{insight.headline}</Text>
          <Text style={pf.detail}>{insight.detail}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={pf.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={pf.source}>Source: {insight.source}</Text>
    </LinearGradient>
  );
}
const pf = StyleSheet.create({
  card:     { marginHorizontal: PAD, borderRadius: 18, padding: 14, marginBottom: 4 },
  row:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  emoji:    { fontSize: 20, marginTop: 2 },
  body:     { flex: 1 },
  headline: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  detail:   { fontSize: 12, color: Colors.dark, lineHeight: 18, fontWeight: '500' },
  source:   { fontSize: 10, color: Colors.midGray, fontWeight: '600', marginTop: 8, fontStyle: 'italic' },
  dismiss:  { fontSize: 13, color: Colors.midGray, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Daily AI Summary Card — WHO-based analysis of today's feeding pattern
// ─────────────────────────────────────────────────────────────────────────────
function DailySummaryCard({ todayEntries, childAgeMonths, childName }: {
  todayEntries:   FeedingEntry[];
  childAgeMonths: number;
  childName:      string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded]     = useState(false);
  const [claudeText, setClaudeText] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  const summary = useMemo(
    () => analyzeDailyFeeding(todayEntries, childAgeMonths, childName),
    [todayEntries.length, childAgeMonths, childName],
  );

  // Try Claude API when there are >= 2 feeds (don't hammer on every second)
  useEffect(() => {
    if (todayEntries.length < 2) return;
    setLoading(true);
    getClaudeDailySummary(summary, childName, childAgeMonths)
      .then(setClaudeText)
      .finally(() => setLoading(false));
  }, [todayEntries.length]);

  const scoreColor = { great: Colors.mint, good: Colors.gold, needs_attention: Colors.primaryPink }[summary.overallScore];

  if (todayEntries.length === 0) return null;

  return (
    <View style={ds.card}>
      <TouchableOpacity style={ds.headerRow} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={[ds.dot, { backgroundColor: scoreColor }]} />
        <Text style={ds.line} numberOfLines={2}>
          {loading ? 'Ate AI is analyzing...' : (claudeText?.split('\n')[0] ?? summary.summaryLine)}
        </Text>
        <Text style={ds.chevron}>{expanded ? '▲' : '▽'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={ds.body}>
          {summary.insights.map((ins, idx) => {
            const tc = ins.type === 'good' ? Colors.mint : ins.type === 'tip' ? Colors.gold : Colors.danger;
            return (
              <View key={idx} style={ds.insightRow}>
                <View style={ds.insightEmoji}>
                  {ins.type === 'good' ? <CheckCircle2 size={18} color={Colors.mint} /> : ins.type === 'tip' ? <Lightbulb size={18} color={Colors.gold} /> : <AlertTriangle size={18} color={Colors.danger} />}
                </View>
                <View style={ds.insightBody}>
                  <Text style={[ds.insightHead, { color: tc }]}>{ins.headline}</Text>
                  <Text style={ds.insightDetail}>{ins.detail}</Text>
                  <Text style={ds.insightSource}>— {ins.source}</Text>
                </View>
              </View>
            );
          })}

          {claudeText && !loading && (
            <View style={ds.claudeBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Bot size={14} color={Colors.primaryPink} />
                <Text style={ds.claudeLabel}>Ate AI</Text>
              </View>
              <Text style={ds.claudeText}>{claudeText}</Text>
            </View>
          )}

          <Text style={ds.disclaimer}>{t('feeding.ai_disclaimer')}</Text>
        </View>
      )}
    </View>
  );
}
const ds = StyleSheet.create({
  card:          { marginHorizontal: PAD, backgroundColor: Colors.white, borderRadius: 18, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  line:          { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.dark, lineHeight: 19 },
  chevron:       { fontSize: 12, color: Colors.midGray },
  body:          { marginTop: 12, gap: 10 },
  insightRow:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  insightEmoji:  { fontSize: 16, marginTop: 1 },
  insightBody:   { flex: 1 },
  insightHead:   { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  insightDetail: { fontSize: 11, color: Colors.midGray, lineHeight: 17, fontWeight: '500' },
  insightSource: { fontSize: 9, color: Colors.midGray, fontStyle: 'italic', marginTop: 2 },
  claudeBox:     { backgroundColor: Colors.softPink, borderRadius: 12, padding: 10, marginTop: 4 },
  claudeLabel:   { fontSize: 10, fontWeight: '800', color: Colors.primaryPink, textTransform: 'uppercase', marginBottom: 4 },
  claudeText:    { fontSize: 12, color: Colors.dark, lineHeight: 18, fontWeight: '500', fontStyle: 'italic' },
  disclaimer:    { fontSize: 10, color: Colors.midGray, fontStyle: 'italic', lineHeight: 15, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit Feed Modal
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  visible:        boolean;
  editingEntry:   FeedingEntry | null;
  childId:        string;
  childName:      string;
  childAgeMonths: number;
  allergies:      string[];
  lastFeed:       FeedingEntry | null;
  allEntries:     FeedingEntry[];
  onClose:        () => void;
  onSaved:        (entry: FeedingEntry) => void;
}

function AddFeedModal({
  visible, editingEntry, childId, childName, childAgeMonths,
  allergies, lastFeed, allEntries, onClose, onSaved,
}: ModalProps) {
  const { t }            = useTranslation();
  const {
    addEntry, updateEntry,
    timerActive, timerStartedAt, timerSide, timerPaused, timerPauseLog,
    startTimer, stopTimer, pauseTimer, resumeTimer,
  } = useFeedingStore();

  // Tab
  const [tab, setTab] = useState<FeedType>('breastfeed');

  // Breastfeed state
  const [side, setSide]                 = useState<BreastSide>('left');
  const [durationMins, setDurationMins] = useState('');
  const [useTimer, setUseTimer]         = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Bottle state
  const [milkType, setMilkType]   = useState<MilkType>('breast_milk');
  const [formulaBrand, setFormulaBrand] = useState('');
  const [customBrand, setCustomBrand]   = useState('');
  const [volumeMl, setVolumeMl]         = useState(120);
  const [useOz, setUseOz]               = useState(false);

  // Solids state
  const [foodItem, setFoodItem]     = useState('');
  const [amount, setAmount]         = useState('');
  const [texture, setTexture]       = useState<SolidsTexture>('puree');
  const [reaction, setReaction]     = useState<SolidsReaction>('none');
  const [allergenWarn, setAllergenWarn] = useState<string | null>(null);

  // Common
  const [startedAt, setStartedAt] = useState(new Date().toISOString());
  const [notes, setNotes]         = useState('');

  // Timer interval
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Suggested side
  const suggestedSide = getSuggestedSide(allEntries, childId);

  // Pre-fill when editing
  useEffect(() => {
    if (!visible) return;
    if (editingEntry) {
      setTab(editingEntry.feedType);
      setSide(editingEntry.breastSide ?? 'left');
      setDurationMins(editingEntry.durationMinutes?.toString() ?? '');
      setMilkType(editingEntry.milkType ?? 'breast_milk');
      setFormulaBrand(editingEntry.formulaBrand ?? '');
      setVolumeMl(editingEntry.volumeMl ?? 120);
      setFoodItem(editingEntry.foodItem ?? '');
      setAmount(editingEntry.amount ?? '');
      setTexture(editingEntry.texture ?? 'puree');
      setReaction(editingEntry.reaction ?? 'none');
      setStartedAt(editingEntry.startedAt);
      setNotes(editingEntry.notes ?? '');
    } else {
      // New entry defaults
      setTab('breastfeed');
      setSide(suggestedSide);
      setDurationMins('');
      setMilkType('breast_milk');
      setFormulaBrand('');
      setCustomBrand('');
      setVolumeMl(120);
      setFoodItem('');
      setAmount('');
      setTexture('puree');
      setReaction('none');
      setStartedAt(new Date().toISOString());
      setNotes('');
      setAllergenWarn(null);
    }
  }, [visible, editingEntry]);

  // Live timer — shows active (non-paused) elapsed seconds
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerActive && timerStartedAt && !timerPaused) {
      const tick = () => {
        setTimerSeconds(getActiveElapsedSeconds(timerStartedAt, timerPauseLog, timerPaused));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else if (!timerActive) {
      setTimerSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timerStartedAt, timerPaused, timerPauseLog]);

  // Allergen check on food change
  useEffect(() => {
    if (foodItem && allergies.length > 0) {
      setAllergenWarn(checkAllergen(foodItem, allergies));
    } else {
      setAllergenWarn(null);
    }
  }, [foodItem, allergies]);

  function handleToggleTimer() {
    if (timerActive) {
      // Stop and fill duration
      const mins = Math.max(1, Math.round(timerSeconds / 60));
      setDurationMins(mins.toString());
      stopTimer();
    } else {
      startTimer(side);
    }
  }

  function handleSave() {
    const foodsTried = getFoodsTriedByChild(allEntries, childId);
    const isFirstFood = tab === 'solids' && !!foodItem && !foodsTried.includes(foodItem);

    const base: Omit<FeedingEntry, 'id' | 'createdAt'> = {
      childId,
      feedType: tab,
      startedAt,
      notes: notes.trim() || undefined,
    };

    const extra: Partial<FeedingEntry> = tab === 'breastfeed' ? {
      breastSide:      side,
      durationMinutes: durationMins ? parseInt(durationMins, 10) : undefined,
      pauseIntervals:  timerPauseLog.length > 0 ? timerPauseLog : undefined,
    } : tab === 'bottle' ? {
      milkType,
      formulaBrand: milkType === 'formula' ? (customBrand || formulaBrand || undefined) : undefined,
      volumeMl,
    } : {
      foodItem:    foodItem.trim() || undefined,
      amount:      amount.trim() || undefined,
      texture,
      reaction,
      isFirstFood,
    };

    const entry: FeedingEntry = {
      ...base, ...extra,
      id:        editingEntry?.id ?? newId(),
      createdAt: editingEntry?.createdAt ?? new Date().toISOString(),
    };

    if (editingEntry) {
      updateEntry(editingEntry.id, entry);
    } else {
      addEntry(entry);
    }

    if (timerActive) stopTimer();
    onSaved(entry);
    onClose();
  }

  // Volume display
  const displayVol = useOz ? (volumeMl / 29.574).toFixed(1) : volumeMl.toString();

  // Solids locked for babies < 4 months
  const solidsLocked = childAgeMonths < 4;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <Pressable style={m.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={m.sheet}
        >
          {/* Handle */}
          <View style={m.handle} />

          {/* Header */}
          <View style={m.header}>
            <Text style={m.title}>
              {editingEntry ? t('feeding.edit_feed') : t('feeding.add_feed')}
            </Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Text style={m.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick repeat button (only for new entries if last feed exists) */}
          {!editingEntry && lastFeed && (
            <TouchableOpacity
              style={m.quickRepeat}
              onPress={() => {
                const entry: FeedingEntry = {
                  ...lastFeed,
                  id:        newId(),
                  startedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  isFirstFood: false,
                };
                addEntry(entry);
                onSaved(entry);
                onClose();
              }}
            >
              <Text style={m.quickRepeatTxt}>{t('feeding.quick_repeat')}</Text>
            </TouchableOpacity>
          )}

          {/* Feed type tabs */}
          <View style={m.tabs}>
            {(['breastfeed', 'bottle', 'solids'] as FeedType[]).map((ft) => {
              const active  = tab === ft;
              const locked  = ft === 'solids' && solidsLocked;
              const tabColors: Record<FeedType, string> = {
                breastfeed: Colors.primaryPink,
                bottle:     Colors.blue,
                solids:     Colors.warning,
              };
              const tc = tabColors[ft];
              return (
                <TouchableOpacity
                  key={ft}
                  style={[m.tab, active && { backgroundColor: tc + '18', borderColor: tc }]}
                  onPress={() => !locked && setTab(ft)}
                  disabled={locked}
                  activeOpacity={0.7}
                >
                  <Text style={[m.tabTxt, active && { color: tc }, locked && { opacity: 0.4 }]}>
                    {ft === 'breastfeed' ? '🤱 ' : ft === 'bottle' ? <><Milk size={14} color={active ? tc : Colors.midGray} /> </> : <><UtensilsCrossed size={14} color={active ? tc : Colors.midGray} /> </>}{t(`feeding.tab_${ft}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {solidsLocked && tab === 'solids' && (
            <Text style={m.lockedNote}>{t('feeding.solids_age_lock')}</Text>
          )}

          <ScrollView
            style={m.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── BREASTFEED TAB ── */}
            {tab === 'breastfeed' && (
              <View style={m.section}>
                {/* Side selector with suggestion */}
                <Text style={m.fieldLabel}>{t('feeding.side_label')}</Text>
                <Text style={m.suggest}>
                  {t('feeding.side_suggest', { side: suggestedSide })}
                </Text>
                <View style={m.sideRow}>
                  {(['left', 'right', 'both'] as BreastSide[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[m.sideBtn, side === s && m.sideBtnActive]}
                      onPress={() => setSide(s)}
                    >
                      <Text style={[m.sideTxt, side === s && m.sideTxtActive]}>
                        {s === 'left' ? '👈' : s === 'right' ? '👉' : '👐'}{'  '}
                        {t(`feeding.side_${s}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Timer */}
                <Text style={m.fieldLabel}>{t('feeding.duration_label')}</Text>
                {timerActive && (
                  <View style={m.timerDisplay}>
                    <IconTimer size={18} color={Colors.primaryPink} />
                    <Text style={m.timerTime}>
                      {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
                      {(timerSeconds % 60).toString().padStart(2, '0')}
                    </Text>
                    <Text style={m.timerNote}>{t('feeding.timer_running')}</Text>
                  </View>
                )}
                <View style={m.timerRow}>
                  <TouchableOpacity
                    style={[m.timerBtn, timerActive && { backgroundColor: '#FEE2E2', borderColor: Colors.danger }]}
                    onPress={handleToggleTimer}
                  >
                    <IconTimer size={18} color={timerActive ? Colors.danger : Colors.primaryPink} />
                    <Text style={[m.timerBtnTxt, timerActive && { color: Colors.danger }]}>
                      {timerActive ? t('feeding.timer_btn_stop') : t('feeding.timer_btn_start')}
                    </Text>
                  </TouchableOpacity>
                  <View style={m.durInput}>
                    <TextInput
                      style={m.input}
                      keyboardType="number-pad"
                      placeholder="min"
                      value={durationMins}
                      onChangeText={setDurationMins}
                      maxLength={3}
                    />
                  </View>
                </View>

                {/* Pause / Resume button — shown while timer is running */}
                {timerActive && (
                  <TouchableOpacity
                    style={[m.pauseBtn, timerPaused && m.resumeBtn]}
                    onPress={timerPaused ? resumeTimer : pauseTimer}
                    activeOpacity={0.8}
                  >
                    <Text style={[m.pauseBtnTxt, timerPaused && m.resumeBtnTxt]}>
                      {timerPaused ? `▶ ${t('feeding.timer_resume')}` : `⏸ ${t('feeding.timer_pause')}`}
                    </Text>
                    {timerPaused && <Text style={m.pausedBadge}>{t('feeding.timer_paused')}</Text>}
                  </TouchableOpacity>
                )}

                {/* Timer timeline — pause/resume markers */}
                {timerActive && timerStartedAt && (
                  <TimerTimeline
                    timerStartedAt={timerStartedAt}
                    pauseIntervals={timerPauseLog}
                    activeSeconds={timerSeconds}
                  />
                )}
              </View>
            )}

            {/* ── BOTTLE TAB ── */}
            {tab === 'bottle' && (
              <View style={m.section}>
                {/* Milk type */}
                <Text style={m.fieldLabel}>{t('feeding.milk_type_label')}</Text>
                <View style={m.radioRow}>
                  {(['breast_milk', 'formula'] as MilkType[]).map((mt) => (
                    <TouchableOpacity
                      key={mt}
                      style={[m.radioBtn, milkType === mt && m.radioBtnActive]}
                      onPress={() => setMilkType(mt)}
                    >
                      <Text style={[m.radioTxt, milkType === mt && m.radioTxtActive]}>
                        {mt === 'breast_milk' ? '🤱 ' : <><Milk size={14} color={milkType === mt ? '#fff' : Colors.midGray} /> </>}{t(`feeding.milk_${mt === 'breast_milk' ? 'breast' : 'formula'}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Formula brand chips — DOH Milk Code: logging only, no logos */}
                {milkType === 'formula' && (
                  <>
                    <Text style={m.fieldLabel}>{t('feeding.brand_label')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <ClipboardList size={12} color={Colors.midGray} />
                      <Text style={m.milkCodeNote}>For personal logging only.</Text>
                    </View>
                    <View style={m.chipRow}>
                      {FORMULA_BRANDS.map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={[m.chip, formulaBrand === b && m.chipActive]}
                          onPress={() => { setFormulaBrand(formulaBrand === b ? '' : b); setCustomBrand(''); }}
                        >
                          <Text style={[m.chipTxt, formulaBrand === b && m.chipTxtActive]}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={[m.input, { marginTop: 8 }]}
                      placeholder={t('feeding.brand_other')}
                      value={customBrand}
                      onChangeText={(v) => { setCustomBrand(v); setFormulaBrand(''); }}
                    />
                  </>
                )}

                {/* Volume stepper */}
                <Text style={m.fieldLabel}>{t('feeding.volume_label')}</Text>
                <View style={m.volRow}>
                  <TouchableOpacity style={m.stepBtn} onPress={() => setVolumeMl(Math.max(5, volumeMl - 10))}>
                    <Text style={m.stepTxt}>−</Text>
                  </TouchableOpacity>
                  <View style={m.volDisplay}>
                    <Text style={m.volVal}>{displayVol}</Text>
                    <TouchableOpacity onPress={() => setUseOz(!useOz)}>
                      <Text style={m.volUnit}>{useOz ? 'oz' : 'ml'} ↕</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={m.stepBtn} onPress={() => setVolumeMl(Math.min(500, volumeMl + 10))}>
                    <Text style={m.stepTxt}>+</Text>
                  </TouchableOpacity>
                </View>
                {/* Quick volume buttons */}
                <View style={m.chipRow}>
                  {[60, 90, 120, 150, 180, 210].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[m.chip, volumeMl === v && m.chipActive]}
                      onPress={() => setVolumeMl(v)}
                    >
                      <Text style={[m.chipTxt, volumeMl === v && m.chipTxtActive]}>{v} ml</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── SOLIDS TAB ── */}
            {tab === 'solids' && !solidsLocked && (
              <View style={m.section}>
                {/* Food item + quick chips */}
                <Text style={m.fieldLabel}>{t('feeding.food_label')}</Text>
                <TextInput
                  style={m.input}
                  placeholder={t('feeding.food_placeholder')}
                  value={foodItem}
                  onChangeText={setFoodItem}
                />
                {allergenWarn && (
                  <View style={m.allergenBanner}>
                    <Text style={m.allergenTxt}>
                      {t('feeding.allergen_warning', { food: foodItem, name: childName })}
                    </Text>
                  </View>
                )}
                {foodItem && !getFoodsTriedByChild(allEntries, childId).includes(foodItem) && (
                  <View style={m.firstFoodBadge}>
                    <Text style={m.firstFoodTxt}>{t('feeding.first_food_badge', { food: foodItem })}</Text>
                  </View>
                )}
                <Text style={m.fieldSubLabel}>Quick select PH foods:</Text>
                <View style={m.chipRow}>
                  {PH_FOODS.map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[m.chip, foodItem === f && m.chipSolidsActive]}
                      onPress={() => setFoodItem(foodItem === f ? '' : f)}
                    >
                      <Text style={[m.chipTxt, foodItem === f && { color: Colors.white }]}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount */}
                <Text style={m.fieldLabel}>{t('feeding.amount_label')}</Text>
                <TextInput
                  style={m.input}
                  placeholder={t('feeding.amount_placeholder')}
                  value={amount}
                  onChangeText={setAmount}
                />

                {/* Texture */}
                <Text style={m.fieldLabel}>{t('feeding.texture_label')}</Text>
                <View style={m.chipRow}>
                  {(['puree', 'mashed', 'soft_lumps', 'finger_food'] as SolidsTexture[]).map((tx) => (
                    <TouchableOpacity
                      key={tx}
                      style={[m.chip, texture === tx && m.chipActive]}
                      onPress={() => setTexture(tx)}
                    >
                      <Text style={[m.chipTxt, texture === tx && m.chipTxtActive]}>
                        {t(`feeding.texture_${tx === 'finger_food' ? 'finger' : tx === 'soft_lumps' ? 'soft_lumps' : tx}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Reaction */}
                <Text style={m.fieldLabel}>{t('feeding.reaction_label')}</Text>
                <View style={m.radioCol}>
                  {(['none', 'mild', 'allergic'] as SolidsReaction[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        m.reactionBtn,
                        reaction === r && {
                          backgroundColor: r === 'none' ? Colors.softMint : r === 'mild' ? Colors.softGold : '#FEE2E2',
                          borderColor:     r === 'none' ? Colors.mint : r === 'mild' ? Colors.gold : Colors.danger,
                        },
                      ]}
                      onPress={() => setReaction(r)}
                    >
                      <Text style={m.reactionTxt}>{t(`feeding.reaction_${r}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── COMMON FIELDS ── */}
            <View style={m.section}>
              <Text style={m.fieldLabel}>{t('feeding.started_at')}</Text>
              <Text style={m.timeDisplay}>{formatTime(startedAt)}</Text>
              <View style={m.timeQuickRow}>
                {[0, -15, -30, -60].map((offset) => {
                  const d = new Date(Date.now() + offset * 60000);
                  return (
                    <TouchableOpacity
                      key={offset}
                      style={m.timeQuickBtn}
                      onPress={() => setStartedAt(d.toISOString())}
                    >
                      <Text style={m.timeQuickTxt}>
                        {offset === 0 ? 'Now' : `${Math.abs(offset)}m ago`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={m.fieldLabel}>{t('feeding.notes_label')}</Text>
              <TextInput
                style={[m.input, m.notesInput]}
                placeholder={t('feeding.notes_placeholder')}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Save button */}
            <View style={m.saveWrap}>
              <TouchableOpacity style={m.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.primaryPink, '#F472B6']}
                  style={m.saveBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={m.saveTxt}>{t('feeding.save')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: 'flex-end' },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:          { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  handle:         { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 10 },
  title:          { fontSize: 18, fontWeight: '800', color: Colors.dark },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.softPink, alignItems: 'center', justifyContent: 'center' },
  closeTxt:       { fontSize: 14, color: Colors.primaryPink, fontWeight: '700' },
  quickRepeat:    { marginHorizontal: PAD, marginBottom: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.gold, backgroundColor: Colors.softGold, paddingVertical: 9, paddingHorizontal: 14, alignItems: 'center' },
  quickRepeatTxt: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  tabs:           { flexDirection: 'row', marginHorizontal: PAD, marginBottom: 4, gap: 8 },
  tab:            { flex: 1, paddingVertical: 9, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  tabTxt:         { fontSize: 11, fontWeight: '800', color: Colors.midGray },
  lockedNote:     { fontSize: 11, color: Colors.midGray, textAlign: 'center', marginBottom: 8 },
  scroll:         { paddingHorizontal: PAD },
  section:        { gap: 8, marginBottom: 8 },
  fieldLabel:     { fontSize: 13, fontWeight: '700', color: Colors.dark, marginTop: 6 },
  fieldSubLabel:  { fontSize: 11, color: Colors.midGray, fontWeight: '600' },
  suggest:        { fontSize: 11, color: Colors.mint, fontWeight: '700' },
  sideRow:        { flexDirection: 'row', gap: 8 },
  sideBtn:        { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.background },
  sideBtnActive:  { borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  sideTxt:        { fontSize: 12, fontWeight: '700', color: Colors.midGray },
  sideTxtActive:  { color: Colors.primaryPink },
  timerDisplay:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.softPink, borderRadius: 12, marginVertical: 4 },
  timerTime:      { fontSize: 22, fontWeight: '900', color: Colors.primaryPink, fontVariant: ['tabular-nums'] },
  timerNote:      { fontSize: 12, color: Colors.primaryPink, fontWeight: '600', flex: 1 },
  timerRow:       { flexDirection: 'row', gap: 10, alignItems: 'center' },
  timerBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, borderWidth: 2, borderColor: Colors.primaryPink, paddingVertical: 9, paddingHorizontal: 14, flex: 1, justifyContent: 'center' },
  timerBtnTxt:    { fontSize: 13, fontWeight: '700', color: Colors.primaryPink },
  pauseBtn:       { borderRadius: 14, borderWidth: 2, borderColor: Colors.gold, backgroundColor: Colors.softGold, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resumeBtn:      { borderColor: Colors.mint, backgroundColor: Colors.softMint },
  pauseBtnTxt:    { fontSize: 13, fontWeight: '800', color: '#92400E' },
  resumeBtnTxt:   { color: '#065F46' },
  pausedBadge:    { fontSize: 10, fontWeight: '700', color: Colors.midGray, backgroundColor: Colors.softGold, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  durInput:       { width: 80, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  input:          { borderRadius: 14, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.dark, backgroundColor: Colors.background },
  notesInput:     { minHeight: 72, textAlignVertical: 'top' },
  radioRow:       { flexDirection: 'row', gap: 8 },
  radioBtn:       { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.background },
  radioBtnActive: { borderColor: Colors.blue, backgroundColor: '#EFF6FF' },
  radioTxt:       { fontSize: 12, fontWeight: '700', color: Colors.midGray },
  radioTxtActive: { color: Colors.blue },
  milkCodeNote:   { fontSize: 10, color: Colors.lightGray, fontStyle: 'italic' },
  volRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  stepBtn:        { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.softPink, alignItems: 'center', justifyContent: 'center' },
  stepTxt:        { fontSize: 24, fontWeight: '800', color: Colors.primaryPink },
  volDisplay:     { alignItems: 'center', minWidth: 80 },
  volVal:         { fontSize: 28, fontWeight: '900', color: Colors.dark },
  volUnit:        { fontSize: 13, color: Colors.primaryPink, fontWeight: '700' },
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.background },
  chipActive:     { borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  chipTxt:        { fontSize: 12, fontWeight: '700', color: Colors.midGray },
  chipTxtActive:  { color: Colors.primaryPink },
  chipSolidsActive:{ borderColor: Colors.warning, backgroundColor: Colors.warning },
  allergenBanner: { borderRadius: 12, backgroundColor: Colors.dangerBg, borderWidth: 1.5, borderColor: Colors.danger, padding: 10 },
  allergenTxt:    { fontSize: 12, color: '#B91C1C', fontWeight: '700' },
  firstFoodBadge: { borderRadius: 12, backgroundColor: Colors.softMint, borderWidth: 1.5, borderColor: Colors.mint, padding: 8 },
  firstFoodTxt:   { fontSize: 12, color: Colors.mint, fontWeight: '700' },
  radioCol:       { gap: 8 },
  reactionBtn:    { borderRadius: 14, borderWidth: 2, borderColor: Colors.border, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: Colors.background },
  reactionTxt:    { fontSize: 13, fontWeight: '700', color: Colors.dark },
  timeDisplay:    { fontSize: 22, fontWeight: '900', color: Colors.primaryPink },
  timeQuickRow:   { flexDirection: 'row', gap: 8 },
  timeQuickBtn:   { borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.background },
  timeQuickTxt:   { fontSize: 11, fontWeight: '700', color: Colors.midGray },
  saveWrap:       { paddingVertical: 16 },
  saveBtn:        { borderRadius: 18, overflow: 'hidden', shadowColor: Colors.primaryPink, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  saveBtnGrad:    { paddingVertical: 16, alignItems: 'center' },
  saveTxt:        { fontSize: 16, fontWeight: '800', color: Colors.white },
});

// ─────────────────────────────────────────────────────────────────────────────
// Tip card
// ─────────────────────────────────────────────────────────────────────────────
function TipCard({ ageMonths }: { ageMonths: number }) {
  const { t } = useTranslation();
  return (
    <LinearGradient
      colors={[Colors.softMint, '#D1FAE5']}
      style={tp.card}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    >
      <Text style={tp.label}>{t('feeding.tip_label')}</Text>
      <Text style={tp.text}>{getAgeTip(ageMonths, t)}</Text>
    </LinearGradient>
  );
}

const tp = StyleSheet.create({
  card:  { marginHorizontal: PAD, borderRadius: 18, padding: 14, marginBottom: 4 },
  label: { fontSize: 10, fontWeight: '800', color: Colors.mint, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.8 },
  text:  { fontSize: 13, color: '#065F46', fontWeight: '600', lineHeight: 19 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Foods tried card (for babies on solids)
// ─────────────────────────────────────────────────────────────────────────────
function FoodsTriedCard({ entries, childId }: { entries: FeedingEntry[]; childId: string }) {
  const { t } = useTranslation();
  const foods = getFoodsTriedByChild(entries, childId);
  if (foods.length === 0) return null;
  return (
    <View style={ft.card}>
      <Text style={ft.title}>{t('feeding.foods_tried')}</Text>
      <Text style={ft.count}>{t('feeding.foods_tried_count', { count: foods.length })}</Text>
      <View style={ft.chips}>
        {foods.map((f) => (
          <View key={f} style={ft.chip}>
            <Text style={ft.chipTxt}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const ft = StyleSheet.create({
  card:    { marginHorizontal: PAD, backgroundColor: Colors.white, borderRadius: 18, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  title:   { fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  count:   { fontSize: 11, color: Colors.midGray, marginBottom: 8, fontWeight: '600' },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:    { borderRadius: 20, backgroundColor: Colors.softGold, paddingHorizontal: 12, paddingVertical: 5 },
  chipTxt: { fontSize: 12, fontWeight: '700', color: '#92400E' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function FeedingLogScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const { entries, deleteEntry, timerActive } = useFeedingStore();

  const [filter, setFilter]               = useState<'today' | 'week' | 'month'>('today');
  const [modalVisible, setModal]          = useState(false);
  const [editingEntry, setEditing]        = useState<FeedingEntry | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<FeedingEntry | null>(null);
  const [lastSavedInsight, setLastSavedInsight] = useState<FeedInsight | null>(null);

  const childId    = activeChild?.id ?? '';
  const childName  = activeChild ? getChildDisplayName(activeChild) : 'Baby';
  const allergies  = activeChild?.allergies ?? [];

  // Age in months
  const ageMonths = useMemo(() => {
    if (!activeChild) return 0;
    const birth = new Date(activeChild.birthday);
    const now   = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  }, [activeChild]);

  // Filter entries
  const allChildEntries = useMemo(
    () => getEntriesForChild(entries, childId),
    [entries, childId],
  );

  const filteredEntries = useMemo(() => {
    const now = new Date();
    return allChildEntries.filter((e) => {
      const d = new Date(e.startedAt);
      if (filter === 'today') return d.toDateString() === now.toDateString();
      if (filter === 'week') {
        const week = new Date(now); week.setDate(now.getDate() - 7);
        return d >= week;
      }
      const month = new Date(now); month.setDate(now.getDate() - 30);
      return d >= month;
    });
  }, [allChildEntries, filter]);

  const todayEntries = useMemo(() => getTodayEntries(entries, childId), [entries, childId]);
  const lastFeed     = useMemo(() => getLastFeed(entries, childId), [entries, childId]);
  const grouped      = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  const openAdd  = useCallback(() => { setEditing(null); setModal(true); }, []);
  const openEdit = useCallback((e: FeedingEntry) => { setEditing(e); setModal(true); }, []);
  const handleRequestDelete  = useCallback((e: FeedingEntry) => setDeleteTarget(e), []);
  const handleConfirmDelete  = useCallback(() => {
    if (deleteTarget) { deleteEntry(deleteTarget.id); setDeleteTarget(null); }
  }, [deleteTarget, deleteEntry]);
  const handleSavedEntry = useCallback((entry: FeedingEntry) => {
    const insight = analyzeOneFeed(entry, ageMonths);
    if (insight) setLastSavedInsight(insight);
  }, [ageMonths]);

  // Expose in dev for browser preview testing
  useEffect(() => {
    if (__DEV__ && typeof window !== 'undefined') (window as any).__openFeedModal = openAdd;
  }, [openAdd]);

  if (!activeChild) {
    return (
      <View style={scr.emptyWrap}>
        <Text style={scr.emptyTitle}>{t('feeding.no_baby_profile')}</Text>
        <TouchableOpacity style={scr.emptyBtn} onPress={() => router.push('/child-profile')}>
          <Text style={scr.emptyBtnTxt}>{t('feeding.add_baby_profile')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={scr.root}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primaryPink, '#F472B6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={scr.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={scr.backBtn}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <View style={scr.headerCenter}>
          <Text style={scr.headerTitle}><Milk size={20} color="#fff" /> {t('feeding.title')}</Text>
          <Text style={scr.headerSub}>{childName}</Text>
        </View>
        <TouchableOpacity style={scr.addBtn} onPress={openAdd}>
          <IconPlus size={20} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Active timer banner */}
      {timerActive && (
        <TouchableOpacity onPress={openAdd} style={scr.timerBanner}>
          <Text style={scr.timerBannerTxt}>🤱 {t('feeding.timer_running')} — Tap to view</Text>
        </TouchableOpacity>
      )}

      {/* Date filter */}
      <View style={scr.filterRow}>
        {(['today', 'week', 'month'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[scr.filterBtn, filter === f && scr.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[scr.filterTxt, filter === f && scr.filterTxtActive]}>
              {t(`feeding.filter_${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary strip */}
        <SummaryStrip
          todayEntries={todayEntries}
          lastFeed={lastFeed}
          ageMonths={ageMonths}
          childName={childName}
        />

        {/* Per-feed insight card — appears after saving a feed */}
        {lastSavedInsight && (
          <PerFeedInsightCard insight={lastSavedInsight} onDismiss={() => setLastSavedInsight(null)} />
        )}

        {/* Daily AI summary card */}
        {filter === 'today' && (
          <DailySummaryCard
            todayEntries={todayEntries}
            childAgeMonths={ageMonths}
            childName={childName}
          />
        )}

        {/* Daily timeline (today only) */}
        {filter === 'today' && <DailyTimeline entries={todayEntries} />}

        {/* Age-specific tip */}
        <TipCard ageMonths={ageMonths} />

        {/* Foods tried (for babies on solids) */}
        {ageMonths >= 4 && (
          <FoodsTriedCard entries={entries} childId={childId} />
        )}

        {/* Entries list */}
        {grouped.length === 0 ? (
          <View style={scr.emptyList}>
            <Milk size={48} color={Colors.primary} style={scr.emptyListEmoji} />
            <Text style={scr.emptyListTitle}>{t('feeding.no_entries')}</Text>
            <Text style={scr.emptyListSub}>{t('feeding.no_entries_sub')}</Text>
          </View>
        ) : (
          grouped.map(({ header, data }) => (
            <View key={header} style={scr.group}>
              <Text style={scr.groupHeader}>{header}</Text>
              <View style={scr.groupCard}>
                {data.map((entry, idx) => (
                  <View key={entry.id}>
                    {idx > 0 && <View style={scr.divider} />}
                    <FeedEntryRow entry={entry} onEdit={openEdit} onRequestDelete={handleRequestDelete} />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={scr.fab} onPress={openAdd} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.primaryPink, '#F472B6']}
          style={scr.fabGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <IconPlus size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add / Edit modal */}
      <AddFeedModal
        visible={modalVisible}
        editingEntry={editingEntry}
        childId={childId}
        childName={childName}
        childAgeMonths={ageMonths}
        allergies={allergies}
        lastFeed={lastFeed}
        allEntries={entries}
        onClose={() => setModal(false)}
        onSaved={handleSavedEntry}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        feedType={deleteTarget?.feedType ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const scr = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 48, paddingBottom: 16, paddingHorizontal: PAD, gap: 12 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter:     { flex: 1 },
  headerTitle:      { fontSize: 20, fontWeight: '900', color: Colors.white },
  headerSub:        { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  addBtn:           { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  timerBanner:      { backgroundColor: Colors.softPink, borderBottomWidth: 1, borderBottomColor: Colors.primaryPink + '40', paddingVertical: 10, paddingHorizontal: PAD },
  timerBannerTxt:   { fontSize: 13, fontWeight: '700', color: Colors.primaryPink, textAlign: 'center' },
  filterRow:        { flexDirection: 'row', paddingHorizontal: PAD, paddingVertical: 10, gap: 8 },
  filterBtn:        { flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive:  { backgroundColor: Colors.softPink, borderColor: Colors.primaryPink },
  filterTxt:        { fontSize: 12, fontWeight: '700', color: Colors.midGray },
  filterTxtActive:  { color: Colors.primaryPink },
  group:            { paddingHorizontal: PAD },
  groupHeader:      { fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 6, marginLeft: 2 },
  groupCard:        { backgroundColor: Colors.white, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  divider:          { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },
  emptyList:        { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyListEmoji:   { fontSize: 52, marginBottom: 12 },
  emptyListTitle:   { fontSize: 18, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 8 },
  emptyListSub:     { fontSize: 13, color: Colors.midGray, textAlign: 'center', lineHeight: 20 },
  fab:              { position: 'absolute', bottom: 28, right: 24, borderRadius: 28, shadowColor: Colors.primaryPink, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  fabGrad:          { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:       { fontSize: 20, fontWeight: '800', color: Colors.dark, marginBottom: 20 },
  emptyBtn:         { borderRadius: 14, backgroundColor: Colors.primaryPink, paddingVertical: 13, paddingHorizontal: 28 },
  emptyBtnTxt:      { fontSize: 15, fontWeight: '800', color: Colors.white },
});
