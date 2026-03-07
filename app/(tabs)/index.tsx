/**
 * index.tsx — Dashboard / Home Screen
 * Per docs/03-dashboard.md + CLAUDE.md Design System
 *
 * Layout (top to bottom):
 *  1. TopNavBar  — child switcher LEFT · name+age CENTER · AI+bell RIGHT
 *  2. ChildSwitcher row (only if 2+ children)
 *  3. ScrollView (pull-to-refresh)
 *     a. Quick Stats Strip  — 4 horizontal chips
 *     b. Growth Snapshot Card
 *     c. Feature Icon Grid  — 6 items (2 cols × 3 rows)
 *     d. Insights Card      — weekly summary
 *  OR empty state when no child profile exists
 */

import { useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Line, Polyline,
  Defs, LinearGradient as SvgGrad, Stop, Rect, G,
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

const { width: W } = Dimensions.get('window');
const PAD       = 16;
const CARD_W    = W - PAD * 2;
const FEAT_GAP  = 10;
const FEAT_W    = (CARD_W - FEAT_GAP) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Kawaii Baby Illustration  (empty-state hero)
// ─────────────────────────────────────────────────────────────────────────────
function KawaiiBaby({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGrad id="bodyG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD6E8" />
          <Stop offset="1" stopColor="#FFB6C8" />
        </SvgGrad>
      </Defs>
      {/* Onesie */}
      <Ellipse cx="50" cy="76" rx="26" ry="20" fill="url(#bodyG)" />
      <Path d="M28 72 Q38 88 50 90 Q62 88 72 72 Q62 68 50 70 Q38 68 28 72Z" fill="#FFB6C8" />
      {/* Arms */}
      <Ellipse cx="22" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(-15,22,72)" />
      <Ellipse cx="78" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(15,78,72)" />
      {/* Head */}
      <Circle cx="50" cy="40" r="24" fill="#FFECD5" />
      {/* Hair */}
      <Path d="M28 33 Q50 14 72 33 Q65 18 50 16 Q35 18 28 33Z" fill="#8B5E3C" />
      <Circle cx="50" cy="19" r="5.5" fill="#8B5E3C" />
      {/* Ears */}
      <Circle cx="26" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="74" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="26" cy="40" r="4"   fill="#FFB3A0" />
      <Circle cx="74" cy="40" r="4"   fill="#FFB3A0" />
      {/* Kawaii eyes */}
      <Path d="M36 39 Q40 35 44 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M56 39 Q60 35 64 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="35" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      <Ellipse cx="65" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      {/* Smile */}
      <Path d="M40 51 Q50 58 60 51" stroke="#E87090" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Bow */}
      <Path d="M38 23 Q50 18 62 23 Q50 28 38 23Z" fill="#FF8FAB" />
      <Circle cx="50" cy="23" r="3" fill="#FF6B8A" />
      {/* Flower accent */}
      <Circle cx="76" cy="27" r="3.5" fill="#FFD700" />
      <Circle cx="71" cy="25" r="3"   fill="#FFB3C8" />
      <Circle cx="81" cy="25" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="20" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="32" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="27" r="2"   fill="white" opacity="0.7" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Sparkline  (placeholder — will use Victory Native when data exists)
// ─────────────────────────────────────────────────────────────────────────────
function MiniSparkLine({ width = 120, hasData = false }: { width?: number; hasData?: boolean }) {
  const h = 44;
  if (!hasData) {
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
  const pts = [3.2, 4.1, 5.0, 5.6, 6.2];
  const minV = 2.5, maxV = 8;
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
// Mini Avatar  (for top nav, inline — no ChildSwitcher import needed)
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_BG    = ['#E8F2FF', '#FFE4EE', '#E0F7EF', '#FFF8E8'];
const AVATAR_EMOJI = ['👶🏻', '👶🏽', '👶🏾', '👶'];

function MiniAvatar({ child, size = 36 }: { child: Child; size?: number }) {
  const idx  = (child.avatarIndex ?? 0) % AVATAR_BG.length;
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
      <Text style={{ fontSize: size * 0.46 }}>{AVATAR_EMOJI[idx]}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Top Navigation Bar
//    LEFT  — child avatar switcher (▾ if multi-child) OR "Add Baby" pill
//    CENTER — child nickname  •  age string
//    RIGHT  — 🤖 Ate AI  |  🔔 Bell
// ─────────────────────────────────────────────────────────────────────────────
function TopNavBar() {
  const { activeChild, children } = useChildStore();
  const hasChild     = !!activeChild;
  const displayName  = hasChild ? getChildDisplayName(activeChild!) : null;
  const ageStr       = hasChild && activeChild!.birthday
    ? getChildAgeVerbose(activeChild!.birthday)
    : null;

  const onAvatarPress = () => {
    if (hasChild) {
      router.push({ pathname: '/child-profile', params: { id: activeChild!.id } });
    } else {
      router.push('/child-profile');
    }
  };

  return (
    <View style={nav.bar}>

      {/* ── Left: Child Switcher ── */}
      <TouchableOpacity style={nav.left} onPress={onAvatarPress} activeOpacity={0.75}>
        {hasChild ? (
          <>
            <View style={nav.avatarRing}>
              <MiniAvatar child={activeChild!} size={34} />
            </View>
            {children.length > 1 && (
              <Text style={nav.arrow}>▾</Text>
            )}
          </>
        ) : (
          <TouchableOpacity
            style={nav.addPill}
            onPress={() => router.push('/child-profile')}
            activeOpacity={0.8}
          >
            <Text style={nav.addPillText}>+ Add Baby</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* ── Center: Name + Age ── */}
      <View style={nav.center}>
        {hasChild ? (
          <>
            <Text style={nav.name} numberOfLines={1}>{displayName}</Text>
            {ageStr && <Text style={nav.age} numberOfLines={1}>{ageStr}</Text>}
          </>
        ) : (
          <Text style={nav.appName}>BabyBloom PH 🌸</Text>
        )}
      </View>

      {/* ── Right: AI + Bell ── */}
      <View style={nav.right}>
        <TouchableOpacity style={nav.iconBtn} activeOpacity={0.7}>
          <Text style={nav.iconEmoji}>🤖</Text>
        </TouchableOpacity>
        <TouchableOpacity style={nav.iconBtn} activeOpacity={0.7}>
          <Text style={nav.iconEmoji}>🔔</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Quick Stats Strip  — 4 white pill chips, colored left border
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_STATS = [
  { id: 'fed',     emoji: '🍼', label: 'Last Fed',     value: '—',    accent: Colors.primaryPink },
  { id: 'sleep',   emoji: '🌙', label: 'Sleep Today',  value: '—',    accent: '#9B89F7'          },
  { id: 'vaccine', emoji: '💉', label: 'Next Vaccine', value: '—',    accent: Colors.blue        },
  { id: 'weight',  emoji: '⚖️', label: 'Weight',       value: '— kg', accent: Colors.mint        },
] as const;

function QuickStatsStrip() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={qs.row}
    >
      {QUICK_STATS.map(({ id, emoji, label, value, accent }) => (
        <View key={id} style={[qs.chip, { borderLeftColor: accent }]}>
          <Text style={qs.chipEmoji}>{emoji}</Text>
          <View>
            <Text style={qs.chipLabel}>{label}</Text>
            <Text style={[qs.chipValue, { color: accent }]}>{value}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Growth Snapshot Card
// ─────────────────────────────────────────────────────────────────────────────
function GrowthSnapshotCard() {
  const { activeChild } = useChildStore();
  const hasMeasurements = false; // future: connect to Supabase growth_records

  const weight = activeChild?.birthWeight ? `${activeChild.birthWeight} kg` : '—';
  const height = activeChild?.birthHeight ? `${activeChild.birthHeight} cm` : '—';

  return (
    <View style={gc.card}>
      {/* Title row */}
      <View style={gc.row}>
        <Text style={gc.title}>Growth Snapshot 📈</Text>
        <TouchableOpacity><Text style={gc.link}>View Full Analysis →</Text></TouchableOpacity>
      </View>

      {/* 3 stat boxes: Weight | Height | Head Circ */}
      <View style={gc.statsRow}>
        {[
          { label: 'Weight',    value: weight },
          { label: 'Height',    value: height },
          { label: 'Head Circ.', value: '—'   },
        ].map(({ label, value }) => (
          <View key={label} style={gc.statBox}>
            <Text style={gc.statNum}>{value}</Text>
            <Text style={gc.statLbl}>{label}</Text>
          </View>
        ))}
      </View>

      {/* WHO Percentile badge placeholder */}
      <View style={gc.percentRow}>
        <View style={[gc.badge, { backgroundColor: Colors.softMint }]}>
          <Text style={[gc.badgeText, { color: Colors.mint }]}>🟢 Normal</Text>
        </View>
        <Text style={gc.percentNote}>WHO percentile — add measurement to update</Text>
      </View>

      {/* Sparkline */}
      <View style={gc.sparkWrap}>
        <MiniSparkLine width={CARD_W - 48} hasData={hasMeasurements} />
      </View>

      {/* AI summary (italic placeholder) */}
      <Text style={gc.aiText}>
        ✨ Add your baby's measurements to get an AI growth analysis from Ate AI.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Feature Icon Grid  — 6 items from docs/03-dashboard.md, 2 cols × 3 rows
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  { id: 'feeding_log',    emoji: '🍼', labelKey: 'home.feeding_log',    bg: '#FFF3E0' },
  { id: 'sleep_tracker',  emoji: '😴', labelKey: 'home.sleep_tracker',  bg: '#F0ECFF' },
  { id: 'vaccination_log',emoji: '💉', labelKey: 'home.vaccination_log',bg: '#FFE4EE' },
  { id: 'vitamins_meds',  emoji: '💊', labelKey: 'home.vitamins_meds',  bg: '#E0F7EF' },
  { id: 'feeding_guide',  emoji: '🥗', labelKey: 'home.feeding_guide',  bg: '#FFF8E8' },
  { id: 'insights',       emoji: '📊', labelKey: 'home.insights',       bg: '#E8F2FF' },
] as const;

function FeatureIconGrid() {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={s.sectionTitle}>{t('home.features')}</Text>
      <View style={fg.grid}>
        {FEATURES.map(({ id, emoji, labelKey, bg }) => (
          <TouchableOpacity
            key={id}
            style={[fg.card, { backgroundColor: bg, width: FEAT_W }]}
            activeOpacity={0.8}
          >
            <Text style={fg.emoji}>{emoji}</Text>
            <Text style={fg.label}>{t(labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Insights Card  — weekly summary (placeholder until Supabase data)
// ─────────────────────────────────────────────────────────────────────────────
function InsightsCard() {
  return (
    <View style={ic.card}>
      <View style={ic.titleRow}>
        <Text style={ic.title}>This Week's Summary 📋</Text>
        <TouchableOpacity><Text style={ic.link}>View Full Reports →</Text></TouchableOpacity>
      </View>
      {[
        { emoji: '🍼', label: 'Total Feeds',    value: '— feeds  •  — ml'     },
        { emoji: '🌙', label: 'Total Sleep',     value: '— hours  •  — avg/day' },
        { emoji: '💉', label: 'Upcoming Event',  value: 'No upcoming events'    },
      ].map(({ emoji, label, value }, i) => (
        <View key={label} style={[ic.row, i > 0 && ic.rowBorder]}>
          <Text style={ic.rowEmoji}>{emoji}</Text>
          <View style={ic.rowText}>
            <Text style={ic.rowLabel}>{label}</Text>
            <Text style={ic.rowValue}>{value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State  — shown when no child profile exists
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={es.wrap}>
      <KawaiiBaby size={160} />
      <Text style={es.title}>Welcome to BabyBloom PH! 🌸</Text>
      <Text style={es.subtitle}>
        Add your baby's profile to start tracking their health journey.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/child-profile')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.primaryPink, '#F06292']}
          style={es.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={es.btnText}>Add Baby Profile  🍼</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={es.note}>Your digital MCH Booklet 🇵🇭</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { activeChild, children } = useChildStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Future: trigger Supabase refetch here
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  // ── No child profile → empty state ──────────────────────────────────────
  if (!activeChild) {
    return (
      <View style={s.screen}>
        <TopNavBar />
        <EmptyState />
      </View>
    );
  }

  // ── Has child → full dashboard ───────────────────────────────────────────
  return (
    <View style={s.screen}>
      <TopNavBar />
      {/* Show full switcher strip only if family has 2+ children */}
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
        {/* Quick Stats */}
        <Text style={[s.sectionTitle, { marginBottom: 8 }]}>{' Quick Stats'}</Text>
        <QuickStatsStrip />

        {/* Growth Snapshot */}
        <Text style={s.sectionTitle}>{'Growth Snapshot'}</Text>
        <GrowthSnapshotCard />

        {/* Feature Grid */}
        <FeatureIconGrid />

        {/* Weekly Insights */}
        <Text style={s.sectionTitle}>{'Insights'}</Text>
        <InsightsCard />

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  scroll:       { flex: 1 },
  content:      { paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: Colors.dark,
    marginBottom: 10, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 0.6, opacity: 0.55,
  },
});

// Top nav
const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
  },
  left:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatarRing: {
    borderRadius: 20, borderWidth: 2, borderColor: Colors.softPink,
    overflow: 'hidden',
  },
  arrow:    { fontSize: 13, color: Colors.lightGray },
  addPill: {
    backgroundColor: Colors.softPink, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addPillText: { fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  center:   { flex: 2, alignItems: 'center' },
  name:     { fontSize: 15, fontWeight: '800', color: Colors.dark },
  age:      { fontSize: 11, color: Colors.lightGray, fontWeight: '600', marginTop: 1 },
  appName:  { fontSize: 15, fontWeight: '800', color: Colors.primaryPink },
  right:    { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.softPink,
    alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: 17 },
});

// Quick stats strip
const qs = StyleSheet.create({
  row:       { gap: 10, paddingBottom: 6 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryPink,  // overridden per item
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    minWidth: 148,
  },
  chipEmoji: { fontSize: 24 },
  chipLabel: { fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginBottom: 3 },
  chipValue: { fontSize: 15, fontWeight: '800' },
});

// Growth snapshot
const gc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:     { fontSize: 15, fontWeight: '800', color: Colors.dark },
  link:      { fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: Colors.softPink, borderRadius: 14,
    padding: 11, alignItems: 'center',
  },
  statNum:      { fontSize: 16, fontWeight: '800', color: Colors.dark },
  statLbl:      { fontSize: 9, color: Colors.lightGray, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  percentRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge:        { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  percentNote:  { fontSize: 10, color: Colors.lightGray, flex: 1 },
  sparkWrap:    { marginBottom: 10 },
  aiText:       { fontSize: 12, color: Colors.lightGray, fontStyle: 'italic', lineHeight: 18 },
});

// Feature icon grid
const fg = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: FEAT_GAP, marginBottom: 4 },
  card: {
    aspectRatio: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  emoji: { fontSize: 40 },
  label: {
    fontSize: 12, fontWeight: '700', color: Colors.midGray,
    textAlign: 'center', paddingHorizontal: 6, lineHeight: 16,
  },
});

// Insights card
const ic = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:     { fontSize: 15, fontWeight: '800', color: Colors.dark },
  link:      { fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowEmoji:  { fontSize: 24 },
  rowText:   { flex: 1 },
  rowLabel:  { fontSize: 10, color: Colors.lightGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  rowValue:  { fontSize: 13, fontWeight: '700', color: Colors.dark },
});

// Empty state
const es = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 40,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: Colors.dark,
    textAlign: 'center', marginTop: 20, marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: Colors.midGray, textAlign: 'center',
    lineHeight: 21, marginBottom: 28,
  },
  btn: {
    borderRadius: 18, paddingVertical: 15, paddingHorizontal: 32,
    shadowColor: Colors.primaryPink, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  note:    { marginTop: 20, fontSize: 13, color: Colors.lightGray, fontWeight: '600' },
});
