/**
 * kick-counter.tsx — Fetal Kick Counter
 * Part of the Pregnancy Hub (Mama tab feature).
 * Tracks kick counts per session, saves to kick_counts table.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft, Baby, CheckCircle2, AlertTriangle,
  RotateCcw, Save, History, Clock,
} from 'lucide-react-native';
import Colors from '../constants/Colors';
import { usePregnancyStore } from '../store/pregnancyStore';
import { supabase } from '../src/lib/supabase';

// ── Constants ─────────────────────────────────────────────────────────────
const GOAL_KICKS   = 10;
const WARN_SECONDS = 2 * 60 * 60; // 2 hours

// ── Types ─────────────────────────────────────────────────────────────────
interface KickSession {
  id:               string;
  kicks_count:      number;
  duration_minutes: number | null;
  logged_at:        string;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function KickCounterScreen() {
  const { activePregnancy } = usePregnancyStore();

  // ── Session state ──────────────────────────────────────────────────────
  const [kicks,          setKicks]          = useState(0);
  const [sessionStarted, setSessionStarted] = useState<number | null>(null);
  const [elapsed,        setElapsed]        = useState(0);
  const [saved,          setSaved]          = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [history,        setHistory]        = useState<KickSession[]>([]);
  const [celebrated,     setCelebrated]     = useState(false);

  // ── Animation ─────────────────────────────────────────────────────────
  const scale = useRef(new Animated.Value(1)).current;

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStarted === null || saved) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStarted) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, saved]);

  // ── Celebrate at 10 kicks ─────────────────────────────────────────────
  useEffect(() => {
    if (kicks >= GOAL_KICKS && !celebrated) {
      setCelebrated(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [kicks, celebrated]);

  // ── Load history on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = useCallback(async () => {
    if (!activePregnancy?.id) return;
    const { data } = await supabase
      .from('kick_counts')
      .select('id, kicks_count, duration_minutes, logged_at')
      .eq('pregnancy_id', activePregnancy.id)
      .order('logged_at', { ascending: false })
      .limit(5);
    setHistory(data ?? []);
  }, [activePregnancy?.id]);

  // ── Tap handler ───────────────────────────────────────────────────────
  function handleKick() {
    if (saved) return;

    // Start session on first kick
    if (sessionStarted === null) setSessionStarted(Date.now());

    // Scale animation: 1.0 → 1.15 → 1.0
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.15, useNativeDriver: true,
        speed: 50, bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1.0, useNativeDriver: true,
        speed: 30, bounciness: 4,
      }),
    ]).start();

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setKicks(k => k + 1);
  }

  // ── Save session ──────────────────────────────────────────────────────
  async function handleSave() {
    if (kicks === 0 || saving) return;
    setSaving(true);
    try {
      const durationMinutes = elapsed > 0 ? Math.max(1, Math.floor(elapsed / 60)) : null;
      if (activePregnancy?.id) {
        await supabase.from('kick_counts').insert({
          pregnancy_id:     activePregnancy.id,
          kicks_count:      kicks,
          duration_minutes: durationMinutes,
          logged_at:        new Date().toISOString(),
        });
        await fetchHistory();
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSaved(true);
    } catch (err) {
      console.warn('Kick save error:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function handleReset() {
    setKicks(0);
    setSessionStarted(null);
    setElapsed(0);
    setSaved(false);
    setCelebrated(false);
    scale.setValue(1);
  }

  // ── Derived ──────────────────────────────────────────────────────────
  const progress     = Math.min(kicks / GOAL_KICKS, 1);
  const sessionActive = sessionStarted !== null && !saved;
  const showSuccess  = kicks >= GOAL_KICKS && celebrated;
  const showWarning  = sessionActive && kicks < GOAL_KICKS && elapsed >= WARN_SECONDS;

  return (
    <View style={s.root}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <LinearGradient colors={['#F3E8FF', '#FFF0F5']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} strokeWidth={2} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kick Counter</Text>
        <View style={s.backBtn} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Alert cards ─────────────────────────────────────────── */}
        {showSuccess && (
          <View style={[s.alertCard, { backgroundColor: Colors.healthBg, borderColor: Colors.health }]}>
            <CheckCircle2 size={20} strokeWidth={1.5} color={Colors.health} />
            <View style={s.alertText}>
              <Text style={[s.alertTitle, { color: Colors.health }]}>
                10 kicks reached!
              </Text>
              <Text style={s.alertBody}>
                {elapsed > 0
                  ? `Reached in ${Math.max(1, Math.floor(elapsed / 60))} min — baby is doing great!`
                  : 'Baby is doing great!'}
              </Text>
            </View>
          </View>
        )}

        {showWarning && (
          <View style={[s.alertCard, { backgroundColor: Colors.dangerBg, borderColor: Colors.danger }]}>
            <AlertTriangle size={20} strokeWidth={1.5} color={Colors.danger} />
            <View style={s.alertText}>
              <Text style={[s.alertTitle, { color: Colors.danger }]}>
                Fewer than 10 kicks in 2 hours
              </Text>
              <Text style={s.alertBody}>
                Please contact your OB-GYN as soon as possible.
              </Text>
            </View>
          </View>
        )}

        {/* ── Kick count number ────────────────────────────────────── */}
        <Text style={s.kickNumber}>{kicks}</Text>
        <Text style={s.kickLabel}>kicks</Text>

        {/* ── Timer ────────────────────────────────────────────────── */}
        <View style={s.timerRow}>
          <Clock size={14} strokeWidth={1.5} color={Colors.textMid} />
          <Text style={s.timerText}>
            {sessionStarted ? formatElapsed(elapsed) : '0:00'}
          </Text>
        </View>

        {/* ── Big animated kick button ─────────────────────────────── */}
        <View style={s.buttonWrap}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              onPress={handleKick}
              disabled={saved}
              activeOpacity={0.85}
              style={[s.kickBtn, saved && s.kickBtnDone]}
            >
              <Baby
                size={64}
                strokeWidth={1.5}
                color={saved ? Colors.textLight : Colors.primary}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Progress bar ─────────────────────────────────────────── */}
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={s.progressLabel}>{kicks} of {GOAL_KICKS} kicks</Text>
        </View>

        {/* ── Tap hint ────────────────────────────────────────────── */}
        {!saved && (
          <Text style={s.hint}>
            {sessionStarted ? 'Tap the button each time baby kicks' : 'Tap to start counting kicks'}
          </Text>
        )}

        {/* ── Action buttons ──────────────────────────────────────── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.saveBtn, (kicks === 0 || saved) && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={kicks === 0 || saved || saving}
          >
            <LinearGradient
              colors={['#E8527A', '#C9375E']}
              style={s.saveBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Save size={18} strokeWidth={1.5} color={Colors.white} />
              <Text style={s.saveBtnText}>
                {saved ? 'Saved' : saving ? 'Saving…' : 'Save Session'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
            <RotateCcw size={16} strokeWidth={1.5} color={Colors.textMid} />
            <Text style={s.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* ── History ──────────────────────────────────────────────── */}
        {history.length > 0 && (
          <View style={s.historySection}>
            <View style={s.historyHeader}>
              <History size={16} strokeWidth={1.5} color={Colors.textMid} />
              <Text style={s.historyTitle}>Recent Sessions</Text>
            </View>
            {history.map((session) => (
              <View key={session.id} style={s.historyRow}>
                <View>
                  <Text style={s.historyDate}>{formatDate(session.logged_at)}</Text>
                  {session.duration_minutes !== null && (
                    <Text style={s.historyDuration}>
                      {session.duration_minutes} min
                    </Text>
                  )}
                </View>
                <View style={[
                  s.kickBadge,
                  session.kicks_count >= GOAL_KICKS
                    ? { backgroundColor: Colors.healthBg }
                    : { backgroundColor: Colors.primaryBg },
                ]}>
                  <Text style={[
                    s.kickBadgeText,
                    { color: session.kicks_count >= GOAL_KICKS ? Colors.health : Colors.primary },
                  ]}>
                    {session.kicks_count} kicks
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Empty history ─────────────────────────────────────────── */}
        {history.length === 0 && (
          <View style={s.emptyHistory}>
            <Baby size={32} strokeWidth={1} color={Colors.textLight} />
            <Text style={s.emptyHistoryText}>No sessions recorded yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },

  // Header
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  {
    fontFamily: 'Nunito_700Bold', fontSize: 18, color: Colors.secondary,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48,
    alignItems: 'center',
  },

  // Alert cards
  alertCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 14, padding: 14,
    marginBottom: 16, width: '100%', gap: 10,
  },
  alertText:  { flex: 1 },
  alertTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, marginBottom: 2 },
  alertBody:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMid },

  // Kick count display
  kickNumber: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 80,
    color: Colors.primary, lineHeight: 88, marginTop: 8,
  },
  kickLabel: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16,
    color: Colors.textMid, marginBottom: 4, marginTop: -8,
  },

  // Timer
  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 24,
  },
  timerText: {
    fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: Colors.textMid,
  },

  // Kick button
  buttonWrap: { marginBottom: 28 },
  kickBtn: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.primaryBg,
    borderWidth: 3, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 16,
    elevation: 6,
  },
  kickBtnDone: {
    borderColor: Colors.border, backgroundColor: Colors.background,
  },

  // Progress
  progressWrap: { alignItems: 'center', marginBottom: 10, width: 200 },
  progressTrack: {
    width: 200, height: 6, borderRadius: 3,
    backgroundColor: Colors.border, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: {
    height: '100%', borderRadius: 3, backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMid,
  },

  // Hint
  hint: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13,
    color: Colors.textLight, textAlign: 'center', marginBottom: 24, marginTop: 6,
  },

  // Actions
  actions:     { width: '100%', gap: 12, marginBottom: 32 },
  saveBtn:     { borderRadius: 14, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, gap: 8,
  },
  saveBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.white },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 6,
  },
  resetBtnText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMid },

  // History
  historySection: { width: '100%' },
  historyHeader:  {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  historyTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textDark,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  historyDate:     { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textDark },
  historyDuration: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: Colors.textLight, marginTop: 2 },
  kickBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  kickBadgeText:   { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },

  // Empty
  emptyHistory: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyHistoryText: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textLight,
  },
});
