/**
 * mama.tsx — Pregnancy Hub main screen
 * Lavender/rose color scheme. Only shown when isPregnancyMode = true.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ClipboardList, Heart, Timer, CalendarDays,
  FileText, ShoppingBag, ChevronDown, ChevronUp,
  Baby, Scale, Activity,
} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { usePregnancyStore, getTrimester, getDaysUntilDue } from '../../store/pregnancyStore';
import { supabase } from '../../src/lib/supabase';

// ── Color aliases (mapped to Colors.ts tokens) ────────────────────────────
const LAV   = Colors.secondary;    // #C9A7E8
const LAV_BG = Colors.secondaryBg; // #F0E6FF
const PINK   = Colors.primary;     // #E8527A

// ── Types ─────────────────────────────────────────────────────────────────
interface PregnancyLog {
  weight_kg:    number | null;
  bp_systolic:  number | null;
  bp_diastolic: number | null;
}
interface NextAppt { appointment_date: string; purpose: string | null; }
interface WeekData {
  baby_size_name:   string | null;
  baby_weight_g:    number | null;
  baby_development: string | null;
  mama_tips:        string | null;
}

// ── Feature grid config ───────────────────────────────────────────────────
const FEATURES = [
  { key: 'weekly_log',   label: 'Weekly Log',        Icon: ClipboardList, bg: LAV   + '22' },
  { key: 'kick',         label: 'Kick Counter',       Icon: Heart,         bg: PINK  + '22' },
  { key: 'contractions', label: 'Contraction Timer',  Icon: Timer,         bg: Colors.warning + '22' },
  { key: 'appointments', label: 'Appointments',       Icon: CalendarDays,  bg: Colors.health + '22' },
  { key: 'birth_plan',   label: 'Birth Plan',         Icon: FileText,      bg: Colors.sleep  + '22' },
  { key: 'hospital_bag', label: 'Hospital Bag',       Icon: ShoppingBag,   bg: Colors.accent + '22' },
] as const;

const FEAT_COLORS = [LAV, PINK, Colors.warning, Colors.health, Colors.sleep, Colors.accent];

// ── Screen ────────────────────────────────────────────────────────────────
export default function MamaScreen() {
  const { activePregnancy, currentWeek, dueDate } = usePregnancyStore();
  const trimester = getTrimester(currentWeek);
  const daysToGo  = getDaysUntilDue(dueDate) ?? 0;
  const progress  = Math.min(currentWeek / 40, 1);

  const [latestLog,   setLatestLog]   = useState<PregnancyLog | null>(null);
  const [nextAppt,    setNextAppt]    = useState<NextAppt | null>(null);
  const [weekData,    setWeekData]    = useState<WeekData | null>(null);
  const [devExpanded, setDevExpanded] = useState(false);

  // ── Fetch Supabase data ──────────────────────────────────────────────
  useEffect(() => {
    if (!activePregnancy?.id) return;
    const pid = activePregnancy.id;
    const today = new Date().toISOString().split('T')[0];

    supabase
      .from('pregnancy_logs')
      .select('weight_kg, bp_systolic, bp_diastolic')
      .eq('pregnancy_id', pid)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setLatestLog(data));

    supabase
      .from('prenatal_appointments')
      .select('appointment_date, purpose')
      .eq('pregnancy_id', pid)
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setNextAppt(data));

    supabase
      .from('pregnancy_weeks')
      .select('baby_size_name, baby_weight_g, baby_development, mama_tips')
      .eq('week', currentWeek)
      .maybeSingle()
      .then(({ data }) => setWeekData(data));
  }, [activePregnancy?.id, currentWeek]);

  // ── Pulse animation ──────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1,  duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const trimLabel =
    trimester === 'first'  ? 'First Trimester'  :
    trimester === 'second' ? 'Second Trimester' : 'Third Trimester';

  const fmtDate = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });

  const daysLabel =
    daysToGo > 0  ? `${daysToGo} days to go` :
    daysToGo === 0 ? 'Due today!' : 'Past due date';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── 1. HEADER ────────────────────────────────────────────────── */}
      <LinearGradient colors={['#F3E8FF', '#FFF0F5']} style={s.header}>
        <Text style={s.headerTitle}>BabyBloom Mama</Text>
        <Text style={s.headerSub}>{currentWeek} weeks pregnant</Text>
      </LinearGradient>

      {/* ── 2. WEEKLY HERO CARD ──────────────────────────────────────── */}
      <View style={s.heroCard}>

        {/* Ring + week number */}
        <View style={s.ringContainer}>
          <Animated.View style={[s.ringOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={s.ringInner} />
          <View style={s.weekCenter}>
            <Text style={s.weekLabel}>Week</Text>
            <Text style={s.weekNum}>{currentWeek}</Text>
          </View>
        </View>

        {/* Baby size */}
        <Text style={s.babySize}>
          {weekData?.baby_size_name
            ? `Your baby is the size of a `
            : 'Your baby is growing beautifully'}
          {weekData?.baby_size_name && (
            <Text style={s.babySizeAccent}>{weekData.baby_size_name}</Text>
          )}
        </Text>

        {/* Trimester badge */}
        <View style={s.trimBadge}>
          <Text style={s.trimText}>{trimLabel}</Text>
        </View>

        {/* Countdown */}
        <Text style={s.daysLabel}>{daysLabel}</Text>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <LinearGradient
            colors={[LAV, PINK]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.progressFill, { flex: progress }]}
          />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={s.progressPct}>{Math.round(progress * 100)}% of pregnancy</Text>

      </View>

      {/* ── 3. QUICK STATS ROW ───────────────────────────────────────── */}
      <View style={s.statsRow}>
        <StatCard
          Icon={Scale}
          label="Last Weight"
          value={latestLog?.weight_kg != null ? `${latestLog.weight_kg} kg` : '—'}
          color={LAV}
        />
        <StatCard
          Icon={Activity}
          label="Last BP"
          value={
            latestLog?.bp_systolic != null && latestLog?.bp_diastolic != null
              ? `${latestLog.bp_systolic}/${latestLog.bp_diastolic}`
              : '—'
          }
          color={PINK}
        />
        <StatCard
          Icon={CalendarDays}
          label="Next Appt"
          value={nextAppt ? fmtDate(nextAppt.appointment_date) : '—'}
          color={Colors.health}
        />
      </View>

      {/* ── 4. FEATURE GRID ──────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>What would you like to do?</Text>
      <View style={s.grid}>
        {FEATURES.map(({ key, label, Icon }, i) => (
          <TouchableOpacity
            key={key}
            style={s.gridTile}
            activeOpacity={0.75}
            onPress={() => {
              if (key === 'kick') router.push('/kick-counter');
            }}
          >
            <View style={[s.gridIconWrap, { backgroundColor: FEAT_COLORS[i] + '20' }]}>
              <Icon size={22} strokeWidth={1.5} color={FEAT_COLORS[i]} />
            </View>
            <Text style={s.gridLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 5. THIS WEEK'S DEVELOPMENT ───────────────────────────────── */}
      <TouchableOpacity
        style={s.devCard}
        activeOpacity={0.85}
        onPress={() => setDevExpanded(v => !v)}
      >
        <View style={s.devRow}>
          <Baby size={18} strokeWidth={1.5} color={LAV} style={{ marginRight: 8 }} />
          <Text style={s.devTitle}>Baby at Week {currentWeek}</Text>
          {devExpanded
            ? <ChevronUp   size={18} strokeWidth={2} color={Colors.textMid} />
            : <ChevronDown size={18} strokeWidth={2} color={Colors.textMid} />
          }
        </View>

        {devExpanded && (
          <View style={s.devBody}>
            <Text style={s.devText}>
              {weekData?.baby_development ??
                `At week ${currentWeek}, your baby is developing rapidly. Each day brings new milestones in growth and development.`}
            </Text>
            {weekData?.mama_tips && (
              <>
                <View style={s.devDivider} />
                <Text style={s.devTipsLabel}>Tips for Mama</Text>
                <Text style={s.devText}>{weekData.mama_tips}</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  Icon, label, value, color,
}: { Icon: React.ComponentType<any>; label: string; value: string; color: string }) {
  return (
    <View style={[sc.card, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Icon size={16} strokeWidth={1.5} color={color} />
      <Text style={sc.label}>{label}</Text>
      <Text style={sc.value}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { paddingBottom: 24 },

  // Header
  header:     { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  headerTitle:{ fontFamily: 'Nunito_700Bold', fontSize: 24, color: LAV, marginBottom: 4 },
  headerSub:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMid },

  // Hero card
  heroCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: LAV,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },

  // Ring
  ringContainer: {
    width: 160, height: 160,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  ringOuter: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2.5,
    borderColor: LAV + '50',
  },
  ringInner: {
    position: 'absolute',
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 1.5,
    borderColor: LAV + '28',
  },
  weekCenter:  { alignItems: 'center' },
  weekLabel:   {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textMid,
    letterSpacing: 2, textTransform: 'uppercase',
    marginBottom: 2,
  },
  weekNum: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 52, color: LAV, lineHeight: 58,
  },

  // Baby size
  babySize:      { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMid, textAlign: 'center', marginBottom: 14 },
  babySizeAccent:{ fontFamily: 'PlusJakartaSans_700Bold', color: LAV },

  // Trimester badge
  trimBadge: {
    backgroundColor: LAV_BG,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    marginBottom: 14,
  },
  trimText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: LAV },

  // Countdown
  daysLabel: {
    fontFamily: 'Nunito_700Bold', fontSize: 16,
    color: Colors.textDark, marginBottom: 12,
  },

  // Progress
  progressTrack: {
    flexDirection: 'row',
    width: '100%', height: 6,
    borderRadius: 3,
    backgroundColor: LAV_BG,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill:  { borderRadius: 3 },
  progressPct: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11, color: Colors.textLight,
  },

  // Stats row
  statsRow:  { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 },

  // Section title
  sectionTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 15,
    color: Colors.textDark,
    paddingHorizontal: 20, marginBottom: 12,
  },

  // Feature grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12,
    marginBottom: 24,
  },
  gridTile: {
    width: '30%', flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minWidth: '28%',
  },
  gridIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, color: Colors.textDark,
    textAlign: 'center', lineHeight: 15,
  },

  // Development card
  devCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: LAV,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  devRow:    { flexDirection: 'row', alignItems: 'center' },
  devTitle:  { fontFamily: 'Nunito_700Bold', fontSize: 15, color: Colors.textDark, flex: 1 },
  devBody:   { marginTop: 14 },
  devText:   { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMid, lineHeight: 20 },
  devDivider:{ height: 1, backgroundColor: Colors.divider, marginVertical: 12 },
  devTipsLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: LAV, marginBottom: 6 },
});

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: Colors.textLight, textAlign: 'center' },
  value: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: Colors.textDark, textAlign: 'center' },
});
