/**
 * index.tsx — Dashboard / Home Screen
 * TASK 2-E redesign: HeroCard + StatsRow + QuickActionsGrid + ActivityFeed
 *
 * Layout (top to bottom):
 *  1. TopNavBar  — child switcher LEFT · name+age CENTER · AI+bell RIGHT
 *  2. ChildSwitcher row (only if 2+ children)
 *  3. ScrollView (pull-to-refresh)
 *     a. HeroCard
 *     b. StatsRow  — 3 equal stat cards
 *     c. QuickActionsGrid — 2x3 action cards
 *     d. ActivityFeed — today's timeline
 *     e. Growth Snapshot Card
 *     f. Ate AI Summary Card
 *  OR empty state when no child profile exists
 */

import React, { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, RefreshControl, Modal,
  TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import Svg, {
  Circle, Line, Polyline,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import ChildSwitcher from '../../components/ChildSwitcher';
import {
  useChildStore, Child,
  getChildDisplayName, getChildAgeVerbose,
} from '../../store/childStore';
import {
  useFeedingStore,
  getLastFeed, getTodayEntries, timeAgoShort,
} from '../../store/feedingStore';
import {
  useSleepStore,
  formatSleepDuration,
} from '../../store/sleepStore';
import { useGrowthStore } from '../../store/growthStore';
import { useVaccineStore } from '../../store/vaccineStore';
import {
  getWHOPercentile,
  getCorrectedAgeMonths,
} from '../../lib/who-growth';
import { AteAIButton, AteAIChat, AteAISummaryCard } from '../../components/ai/AteAI';
import {
  Baby,
  Flower2,
  Bell,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Pencil,
  Droplets,
  Moon,
  BarChart2,
  Syringe,
  Award,
  Pill,
  ChevronRight,
  Clock,
} from 'lucide-react-native';

const { width: W } = Dimensions.get('window');
const PAD    = 16;
const CARD_W = W - PAD * 2;
const QA_GAP = 12;
const QA_W   = (CARD_W - QA_GAP) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Sparkline
// ─────────────────────────────────────────────────────────────────────────────
function MiniSparkLine({ width = 120, data }: { width?: number; data?: number[] }) {
  const h = 44;
  const pts = data && data.length >= 2 ? data : null;
  if (!pts) {
    return (
      <Svg width={width} height={h}>
        <Line x1="4" y1={h - 6} x2={width - 4} y2={h - 6}
          stroke="#F8BBD9" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="5,4" />
        <Line x1={width / 2} y1="4" x2={width / 2} y2={h - 8}
          stroke="#FCE4EC" strokeWidth="1" />
      </Svg>
    );
  }
  const minV = Math.min(...pts) * 0.95;
  const maxV = Math.max(...pts) * 1.05;
  const toX  = (i: number) => 8 + (i / (pts.length - 1)) * (width - 16);
  const toY  = (v: number) => 4 + (1 - (v - minV) / (maxV - minV)) * (h - 10);
  const poly = pts.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  return (
    <Svg width={width} height={h}>
      <Polyline points={poly} fill="none" stroke={Colors.primaryPink}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((v, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill={Colors.primaryPink} />
      ))}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Avatar
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_BG = [Colors.softBlue, Colors.softPink, Colors.softMint, Colors.softGold];

function MiniAvatar({ child, size = 36 }: { child: Child; size?: number }) {
  const idx = (child.avatarIndex ?? 0) % AVATAR_BG.length;
  if (child.photoUri) {
    return (
      <Image
        source={{ uri: child.photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: AVATAR_BG[idx],
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Baby size={size * 0.5} strokeWidth={1.5} color={Colors.textMid} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Top Navigation Bar  (with Ate AI animated button)
// ─────────────────────────────────────────────────────────────────────────────
function TopNavBar({ onAteAIPress }: { onAteAIPress: () => void }) {
  const { t } = useTranslation();
  const { activeChild, children } = useChildStore();
  const hasChild    = !!activeChild;
  const displayName = hasChild ? getChildDisplayName(activeChild!) : null;
  const ageStr      = hasChild && activeChild!.birthday
    ? getChildAgeVerbose(activeChild!.birthday) : null;

  return (
    <View style={nav.bar}>

      {/* Left: Avatar / Add Baby */}
      <TouchableOpacity
        style={nav.left}
        onPress={() => router.push(hasChild
          ? { pathname: '/child-profile', params: { id: activeChild!.id } }
          : '/child-profile')}
        activeOpacity={0.75}
      >
        {hasChild ? (
          <>
            <View style={nav.avatarRing}>
              <MiniAvatar child={activeChild!} size={34} />
            </View>
            {children.length > 1 && <Text style={nav.arrow}>▾</Text>}
          </>
        ) : (
          <View style={nav.addPill}>
            <Text style={nav.addPillText}>{t('home.add_baby')}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Center: Name + Age */}
      <View style={nav.center}>
        {hasChild ? (
          <>
            <Text style={nav.name} numberOfLines={1}>{displayName}</Text>
            {ageStr && <Text style={nav.age} numberOfLines={1}>{ageStr}</Text>}
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={nav.appName}>{t('app.name')} </Text>
            <Flower2 size={20} strokeWidth={1.5} color={Colors.primary} />
          </View>
        )}
      </View>

      {/* Right: Ate AI (animated kawaii button) + Bell */}
      <View style={nav.right}>
        <AteAIButton onPress={onAteAIPress} />
        <TouchableOpacity style={nav.iconBtn} activeOpacity={0.7}>
          <Bell size={20} strokeWidth={1.5} color={Colors.textMid} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HeroCard — light gradient, avatar, greeting, contextual chip
// ─────────────────────────────────────────────────────────────────────────────
function HeroCard({ child }: { child: Child }) {
  const { t } = useTranslation();
  const vaccineStore = useVaccineStore();
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t('home.greeting_morning')
    : hour < 18
      ? t('home.greeting_afternoon')
      : t('home.greeting_evening');
  const name = getChildDisplayName(child);
  const ageStr = child.birthday ? getChildAgeVerbose(child.birthday) : '';

  // Contextual chip: next vaccine within 30 days
  const nextVax = vaccineStore.getNextUpcoming(child.id);
  let chipLabel: string | null = null;
  if (nextVax) {
    const days = Math.ceil(
      (new Date(nextVax.scheduledDate).getTime() - Date.now()) / 86_400_000,
    );
    if (days >= 0 && days <= 30)
      chipLabel = `Next vaccine in ${days} day${days !== 1 ? 's' : ''}`;
  }

  return (
    <LinearGradient
      colors={['#FFF0F5', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={hc.card}
    >
      {/* Edit pencil top-right */}
      <TouchableOpacity
        style={hc.editBtn}
        onPress={() =>
          router.push({ pathname: '/child-profile', params: { id: child.id } })
        }
        activeOpacity={0.7}
      >
        <Pencil size={16} strokeWidth={1.5} color={Colors.textMid} />
      </TouchableOpacity>

      <View style={hc.row}>
        {/* Avatar */}
        {child.photoUri ? (
          <Image source={{ uri: child.photoUri }} style={hc.avatar} />
        ) : (
          <View style={hc.avatarFallback}>
            <Baby size={36} strokeWidth={1.5} color={Colors.primary} />
          </View>
        )}

        {/* Text column */}
        <View style={hc.textCol}>
          <Text style={hc.greeting}>{greeting}</Text>
          <Text style={hc.ageLine}>{name} is {ageStr} old today</Text>
          {chipLabel && (
            <View style={hc.chip}>
              <Text style={hc.chipText}>{chipLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. StatsRow — 3 equal stat cards in a row
// ─────────────────────────────────────────────────────────────────────────────
function StatsRow({ childId }: { childId: string }) {
  const { entries } = useFeedingStore();
  const sleepStore  = useSleepStore();
  const vaccineStore = useVaccineStore();

  const lastFeed = getLastFeed(entries, childId);
  const lastFedVal = lastFeed ? timeAgoShort(lastFeed.startedAt) : '—';

  const sleepMins = sleepStore.getTodaySleepMinutes(childId);
  const sleepVal  = sleepMins > 0 ? formatSleepDuration(sleepMins) : '—';

  const nextVax = vaccineStore.getNextUpcoming(childId);
  const nextVaxVal = nextVax
    ? (nextVax.nameEN.length > 10 ? nextVax.nameEN.slice(0, 10) + '\u2026' : nextVax.nameEN)
    : '—';

  const cards = [
    { label: 'Last Feed',    value: lastFedVal,  bg: Colors.sleepBg,     route: '/feeding-log' },
    { label: 'Last Sleep',   value: sleepVal,    bg: Colors.secondaryBg, route: '/sleep-tracker' },
    { label: 'Next Vaccine', value: nextVaxVal,  bg: Colors.primaryBg,   route: '/(tabs)/vaccines' },
  ];

  return (
    <View style={sr.row}>
      {cards.map(({ label, value, bg, route }) => (
        <TouchableOpacity
          key={label}
          style={[sr.card, { backgroundColor: bg }]}
          onPress={() => router.push(route as any)}
          activeOpacity={0.8}
        >
          <Text style={sr.value} numberOfLines={1}>{value}</Text>
          <Text style={sr.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. QuickActionsGrid — 2x3 action cards
// ─────────────────────────────────────────────────────────────────────────────
const ACTIONS = [
  { id: 'feed',       label: 'Log Feed',     Icon: Droplets, bg: Colors.sleepBg,     iconColor: Colors.sleep,     route: '/feeding-log' },
  { id: 'sleep',      label: 'Log Sleep',    Icon: Moon,     bg: Colors.secondaryBg, iconColor: Colors.secondary, route: '/sleep-tracker' },
  { id: 'growth',     label: 'Track Growth', Icon: BarChart2,bg: Colors.healthBg,    iconColor: Colors.health,    route: '/growth-analysis' },
  { id: 'vaccine',    label: 'Add Vaccine',  Icon: Syringe,  bg: Colors.primaryBg,   iconColor: Colors.primary,   route: '/(tabs)/vaccines' },
  { id: 'milestones', label: 'Milestones',   Icon: Award,    bg: Colors.accentBg,    iconColor: Colors.accent,    route: '/(tabs)/milestones' },
  { id: 'vitamins',   label: 'Vitamins',     Icon: Pill,     bg: Colors.healthBg,    iconColor: Colors.health,    route: '/vitamins' },
];

function QuickActionsGrid() {
  return (
    <View>
      <Text style={s.sectionTitle}>QUICK ACTIONS</Text>
      <View style={qa.grid}>
        {ACTIONS.map(({ id, label, Icon, bg, iconColor, route }) => (
          <TouchableOpacity
            key={id}
            style={[qa.card, { backgroundColor: bg }]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.82}
          >
            <Icon size={24} strokeWidth={1.5} color={iconColor} />
            <Text style={qa.label}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ActivityFeed — today's combined feeding + sleep timeline
// ─────────────────────────────────────────────────────────────────────────────
interface ActivityEvent {
  id: string;
  time: string;
  name: string;
  detail: string;
  dotColor: string;
}

function ActivityFeed({ childId }: { childId: string }) {
  const { entries } = useFeedingStore();
  const sleepStore  = useSleepStore();

  const todayFeeds = getTodayEntries(entries, childId);
  const todaySleep = sleepStore.getTodayEntries(childId);

  const events: ActivityEvent[] = [
    ...todayFeeds.map(e => ({
      id:       e.id,
      time:     e.startedAt,
      name:
        e.feedType === 'breastfeed'
          ? 'Breastfeed'
          : e.feedType === 'bottle'
            ? 'Bottle Feed'
            : 'Solids',
      detail:
        e.feedType === 'breastfeed'
          ? (e.breastSide ? `${e.breastSide} breast` : 'Both sides')
          : e.feedType === 'bottle'
            ? (e.volumeMl ? `${e.volumeMl}ml` : '')
            : (e.foodItem || ''),
      dotColor: Colors.primary,
    })),
    ...todaySleep.map(e => ({
      id:       e.id,
      time:     e.startedAt,
      name:     e.sleepType === 'nap' ? 'Nap' : 'Sleep',
      detail:   e.endedAt
        ? formatSleepDuration(
            Math.round(
              (new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60_000,
            ),
          )
        : 'In progress',
      dotColor: Colors.secondary,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  return (
    <View style={af.card}>
      <View style={af.header}>
        <Text style={s.sectionTitle}>TODAY'S ACTIVITY</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/calendar' as any)}
          activeOpacity={0.7}
        >
          <Text style={af.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <Text style={af.empty}>No activity logged yet today</Text>
      ) : (
        events.map((ev, idx) => (
          <View key={ev.id} style={af.row}>
            {/* Timeline column */}
            <View style={af.timelineCol}>
              <View style={[af.dot, { backgroundColor: ev.dotColor }]} />
              {idx < events.length - 1 && <View style={af.connector} />}
            </View>
            {/* Content */}
            <View style={af.content}>
              <Text style={af.time}>{fmtTime(ev.time)}</Text>
              <Text style={af.eventName}>{ev.name}</Text>
              {!!ev.detail && <Text style={af.detail}>{ev.detail}</Text>}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Growth Snapshot Card (with real WHO data + add-measurement modal)
// ─────────────────────────────────────────────────────────────────────────────
function GrowthSnapshotCard() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const growthStore     = useGrowthStore();
  const childId         = activeChild?.id ?? '';

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [mWeight,   setMWeight]   = useState('');
  const [mHeight,   setMHeight]   = useState('');
  const [mHead,     setMHead]     = useState('');
  const [mNotes,    setMNotes]    = useState('');
  const [mDate,     setMDate]     = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Real data
  const latest    = growthStore.getLatest(childId);
  const sparkData = growthStore.getLastNWeights(childId, 5).map((r) => r.kg);

  // Child age in months (with preterm correction)
  const ageMonths = (() => {
    if (!activeChild?.birthday) return 0;
    const msAge = Date.now() - new Date(activeChild.birthday).getTime();
    const rawMonths = msAge / (1000 * 60 * 60 * 24 * 30.44);
    return getCorrectedAgeMonths(rawMonths, activeChild.gestationalAge ?? undefined);
  })();
  const sex = (activeChild?.sex === 'male' || activeChild?.sex === 'female')
    ? activeChild.sex : 'male';

  // WHO percentile for weight
  const wPct = latest?.weightKg
    ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg)
    : null;

  // Display values
  const weightVal = latest?.weightKg
    ? `${latest.weightKg} kg`
    : (activeChild?.birthWeight ? `${activeChild.birthWeight} kg` : '—');
  const heightVal = latest?.heightCm
    ? `${latest.heightCm} cm`
    : (activeChild?.birthHeight ? `${activeChild.birthHeight} cm` : '—');
  const headVal   = latest?.headCircumferenceCm
    ? `${latest.headCircumferenceCm} cm`
    : '—';

  // Badge styling based on percentile zone
  const badgeBg   = wPct ? wPct.bgColor : Colors.softMint;
  const badgeFg   = wPct ? wPct.color   : Colors.mint;
  const badgeTxt  = wPct
    ? `${wPct.label}  •  p${Math.round(wPct.percentile)}`
    : t('growth.add_to_update');

  // Save measurement
  const handleSave = () => {
    const w  = parseFloat(mWeight);
    const h  = parseFloat(mHeight);
    const hd = parseFloat(mHead);
    if (!mWeight && !mHeight && !mHead) {
      Alert.alert(t('growth.error_title'), t('growth.error_empty'));
      return;
    }
    growthStore.addRecord({
      id:                   `gr_${Date.now()}`,
      childId,
      measuredAt:           mDate,
      weightKg:             isNaN(w)  ? undefined : w,
      heightCm:             isNaN(h)  ? undefined : h,
      headCircumferenceCm:  isNaN(hd) ? undefined : hd,
      notes:                mNotes || undefined,
      createdAt:            new Date().toISOString(),
    });
    setModalVisible(false);
    setMWeight(''); setMHeight(''); setMHead(''); setMNotes('');
    setMDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <>
      <View style={gc.card}>
        <View style={gc.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={gc.title}>{t('growth.snapshot_title')} </Text>
            <TrendingUp size={20} strokeWidth={1.5} color={Colors.textMid} />
          </View>
          <TouchableOpacity onPress={() => router.push('/growth-analysis')} activeOpacity={0.75}>
            <Text style={gc.link}>{t('growth.view_full')}</Text>
          </TouchableOpacity>
        </View>

        {/* 3 stat boxes */}
        <View style={gc.statsRow}>
          {[
            { label: t('growth.weight'),    value: weightVal },
            { label: t('growth.height'),    value: heightVal },
            { label: t('growth.head_circ'), value: headVal   },
          ].map(({ label, value }) => (
            <LinearGradient
              key={label}
              colors={[Colors.softPink, '#FFD6E8']}
              style={gc.statBox}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={gc.statNum}>{value}</Text>
              <Text style={gc.statLbl}>{label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* WHO badge + Add button */}
        <View style={gc.percentRow}>
          <View style={[gc.badge, { backgroundColor: badgeBg, flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{
              width: 10, height: 10, borderRadius: 5, marginRight: 6,
              backgroundColor: wPct
                ? (wPct.percentile >= 15 && wPct.percentile <= 85
                    ? Colors.mint
                    : wPct.percentile >= 5 && wPct.percentile <= 97
                      ? Colors.gold
                      : Colors.danger)
                : Colors.lightGray,
            }} />
            <Text style={[gc.badgeText, { color: badgeFg }]}>
              {badgeTxt}
            </Text>
          </View>
          <TouchableOpacity
            style={gc.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={gc.addBtnText}>{t('growth.add_measurement')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sparkline */}
        <View style={gc.sparkWrap}>
          <Text style={gc.sparkLabel}>{t('growth.last_5_weights')}</Text>
          <MiniSparkLine width={CARD_W - 48} data={sparkData.length >= 2 ? sparkData : undefined} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Sparkles size={16} strokeWidth={1.5} color={Colors.gold} />
          <Text style={[gc.aiText, { marginLeft: 6 }]}>
            {latest
              ? t('growth.ai_summary_prompt')
              : t('growth.ai_add_prompt')}
          </Text>
        </View>
      </View>

      {/* Add Measurement Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={mm.container}>
            {/* Header */}
            <View style={mm.header}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={mm.cancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={mm.title}>{t('growth.modal_title')}</Text>
              <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                <Text style={mm.save}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={mm.body} keyboardShouldPersistTaps="handled">
              {/* Date */}
              <Text style={mm.label}>{t('growth.modal_date')}</Text>
              <TextInput
                style={mm.input}
                value={mDate}
                onChangeText={setMDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.lightGray}
                keyboardType="numbers-and-punctuation"
              />

              {/* Weight */}
              <Text style={mm.label}>{t('growth.modal_weight')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mWeight}
                  onChangeText={setMWeight}
                  placeholder={t('growth.modal_weight_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>kg</Text>
              </View>

              {/* Height */}
              <Text style={mm.label}>{t('growth.modal_height')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mHeight}
                  onChangeText={setMHeight}
                  placeholder={t('growth.modal_height_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>cm</Text>
              </View>

              {/* Head */}
              <Text style={mm.label}>{t('growth.modal_head')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mHead}
                  onChangeText={setMHead}
                  placeholder={t('growth.modal_head_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>cm</Text>
              </View>

              {/* Notes */}
              <Text style={mm.label}>{t('growth.modal_notes')}</Text>
              <TextInput
                style={[mm.input, mm.inputMulti]}
                value={mNotes}
                onChangeText={setMNotes}
                placeholder={t('growth.modal_notes_placeholder')}
                placeholderTextColor={Colors.lightGray}
                multiline
                numberOfLines={3}
              />

              {/* WHO tip */}
              <View style={mm.tip}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Lightbulb size={16} strokeWidth={1.5} color={Colors.gold} />
                  <Text style={[mm.tipText, { marginLeft: 6 }]}>{t('growth.who_tip')}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={es.wrap}>
      <View style={es.iconCircle}>
        <Baby size={100} color={Colors.primary} strokeWidth={1} />
      </View>
      <Text style={es.title}>{t('home.welcome_title')}</Text>
      <Text style={es.subtitle}>{t('home.welcome_subtitle')}</Text>
      <TouchableOpacity onPress={() => router.push('/child-profile')} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          style={es.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={es.btnText}>{t('home.add_baby_profile')}</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={es.note}>{t('home.mch_booklet_note')}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t }                         = useTranslation();
  const { activeChild, children }     = useChildStore();
  const [refreshing,   setRefreshing] = useState(false);
  const [ateAIOpen,    setAteAIOpen]  = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  if (!activeChild) {
    return (
      <View style={s.screen}>
        <TopNavBar onAteAIPress={() => setAteAIOpen(true)} />
        <EmptyState />
        <AteAIChat visible={ateAIOpen} onClose={() => setAteAIOpen(false)} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <TopNavBar onAteAIPress={() => setAteAIOpen(true)} />
      {children.length > 1 && <ChildSwitcher />}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryPink}
            colors={[Colors.primaryPink]}
          />
        }
      >
        <HeroCard child={activeChild} />
        <StatsRow childId={activeChild.id} />
        <QuickActionsGrid />
        <ActivityFeed childId={activeChild.id} />

        <Text style={s.sectionTitle}>{t('home.growth_snapshot')}</Text>
        <GrowthSnapshotCard />

        <AteAISummaryCard
          title={t('ateai.weekly_summary_title')}
          icon={<Sparkles size={20} strokeWidth={1.5} color={Colors.gold} />}
          prompt="Give a 2-sentence friendly weekly health summary for this baby based on the data. Include one specific WHO/DOH tip relevant to their age."
          onChatPress={() => setAteAIOpen(true)}
        />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Ate AI Chat Sheet */}
      <AteAIChat visible={ateAIOpen} onClose={() => setAteAIOpen(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  scroll:       { flex: 1 },
  content:      { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: Colors.textMid,
    marginBottom: 10, marginTop: 18, marginHorizontal: PAD,
    textTransform: 'uppercase', letterSpacing: 1.5,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
});

// Top nav
const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
  },
  left:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatarRing:  { borderRadius: 20, borderWidth: 2, borderColor: Colors.softPink, overflow: 'hidden' },
  arrow:       { fontSize: 13, color: Colors.lightGray },
  addPill:     { backgroundColor: Colors.softPink, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addPillText: { fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  center:      { flex: 2, alignItems: 'center' },
  name:        { fontSize: 15, fontWeight: '800', color: Colors.dark },
  age:         { fontSize: 11, color: Colors.lightGray, fontWeight: '600', marginTop: 1 },
  appName:     { fontSize: 15, fontWeight: '800', color: Colors.primaryPink },
  right:       { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.softPink, alignItems: 'center', justifyContent: 'center' },
});

// HeroCard
const hc = StyleSheet.create({
  card: {
    marginHorizontal: PAD, marginTop: 14, borderRadius: 20, padding: 20,
    shadowColor: Colors.shadowColor, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  editBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.divider, alignItems: 'center', justifyContent: 'center',
  },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:       { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.primary },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  textCol:  { flex: 1, gap: 4 },
  greeting: { fontSize: 18, fontFamily: 'Nunito_700Bold', color: Colors.primary, fontWeight: '700' },
  ageLine:  { fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textDark },
  chip:     {
    backgroundColor: Colors.primaryBg, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  chipText: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.primary },
});

// StatsRow
const sr = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 8, paddingHorizontal: PAD, marginTop: 14 },
  card:  { flex: 1, borderRadius: 16, padding: 12 },
  value: { fontSize: 18, fontFamily: 'JetBrainsMono_400Regular', color: Colors.textDark, fontWeight: '700' },
  label: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid, marginTop: 4 },
});

// QuickActionsGrid
const qa = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: QA_GAP, paddingHorizontal: PAD, marginBottom: 4 },
  card:  { width: QA_W, borderRadius: 16, padding: 16 },
  label: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.textDark, marginTop: 8, fontWeight: '700' },
});

// ActivityFeed
const af = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16,
    marginHorizontal: PAD, marginBottom: 4,
    shadowColor: Colors.shadowColor, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll:     { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.primary, fontWeight: '700' },
  empty:       { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid, textAlign: 'center', paddingVertical: 16 },
  row:         { flexDirection: 'row', gap: 12, marginBottom: 0 },
  timelineCol: { alignItems: 'center', width: 16 },
  dot:         { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  connector:   { width: 1, flex: 1, backgroundColor: Colors.divider, marginTop: 4, minHeight: 20 },
  content:     { flex: 1, paddingBottom: 16 },
  time:        { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid },
  eventName:   { fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.textDark, fontWeight: '700', marginTop: 2 },
  detail:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid, marginTop: 2 },
});

// Growth snapshot
const gc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16,
    marginHorizontal: PAD, marginBottom: 4,
    shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:      { fontSize: 15, fontWeight: '800', color: Colors.dark },
  link:       { fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },
  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:    { flex: 1, borderRadius: 16, padding: 11, alignItems: 'center' },
  statNum:    { fontSize: 16, fontWeight: '800', color: Colors.dark },
  statLbl:    { fontSize: 9, color: Colors.midGray, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge:      { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, flex: 1 },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  percentNote:{ fontSize: 10, color: Colors.lightGray, flex: 1 },
  addBtn:     { backgroundColor: Colors.softPink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  sparkWrap:  { marginBottom: 10 },
  sparkLabel: { fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiText:     { fontSize: 12, color: Colors.lightGray, fontStyle: 'italic', lineHeight: 18 },
});

// Add Measurement Modal
const mm = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:      { fontSize: 16, fontWeight: '800', color: Colors.dark },
  cancel:     { fontSize: 15, color: Colors.midGray, fontWeight: '600' },
  save:       { fontSize: 15, color: Colors.primaryPink, fontWeight: '800' },
  body:       { padding: 16, paddingBottom: 60 },
  label:      { fontSize: 13, fontWeight: '700', color: Colors.dark, marginTop: 16, marginBottom: 6 },
  input:      {
    backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: Colors.dark, height: 52,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputFlex:  { flex: 1 },
  unit:       { fontSize: 14, fontWeight: '700', color: Colors.midGray, width: 28 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  tip:        { marginTop: 20, backgroundColor: Colors.softBlue, borderRadius: 14, padding: 14 },
  tipText:    { fontSize: 12, color: Colors.blue, lineHeight: 18 },
});

// Empty state
const es = StyleSheet.create({
  wrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  iconCircle:{ width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 22, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginTop: 20, marginBottom: 10 },
  subtitle:  { fontSize: 14, color: Colors.midGray, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  btn:       { borderRadius: 14, height: 52, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primaryPink, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnText:   { color: Colors.white, fontSize: 16, fontWeight: '800' },
  note:      { marginTop: 20, fontSize: 13, color: Colors.lightGray, fontWeight: '600' },
});
