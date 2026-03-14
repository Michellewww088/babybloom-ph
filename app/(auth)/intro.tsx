/**
 * intro.tsx — Feature walkthrough (redesigned)
 *
 * Phase 1 (3 s): Animated splash — kawaii bear + floating ☁️ 🌙 ⭐
 * Phase 2: 3 swipeable feature slides → onboarding
 *
 * Design: Babiyo-inspired · large gradient blob · dots + arrow nav · soft pink pastel
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { Cloud, Moon, Star, Sparkles, Flower2 } from 'lucide-react-native';
import BearIllustration    from '../../components/intro/BearIllustration';
import GrowthIllustration  from '../../components/intro/GrowthIllustration';
import ReminderIllustration from '../../components/intro/ReminderIllustration';
import AIIllustration      from '../../components/intro/AIIllustration';
import Colors from '../../constants/Colors';

// ── Feature slides data ────────────────────────────────────────────────────────

const SLIDES = [
  {
    key:         'growth',
    blobColors:  [Colors.primarySoft, '#FFE8EF', '#FFF4F7'] as [string, string, string],
    accentColor: '#E8637C',
    Illustration: GrowthIllustration,
  },
  {
    key:         'reminders',
    blobColors:  ['#C0EDD8', '#DAF5EA', '#F0FBF6'] as [string, string, string],
    accentColor: Colors.mint,
    Illustration: ReminderIllustration,
  },
  {
    key:         'ai',
    blobColors:  ['#E0CDFA', '#EDDFFF', '#F7F0FF'] as [string, string, string],
    accentColor: '#9B59B6',
    Illustration: AIIllustration,
  },
] as const;

// splash (index 0) + 3 feature slides = 4 screens → 4 progress dots
const TOTAL_SCREENS = 1 + SLIDES.length;

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function IntroScreen() {
  const { t }     = useTranslation();
  const { width } = useWindowDimensions();

  const [phase,   setPhase]   = useState<'splash' | 'slides'>('splash');
  const [current, setCurrent] = useState(0);

  // ── Splash floating decorations (cloud / moon / star) ────────────────────────
  const cloud1Y  = useRef(new Animated.Value(0)).current;
  const cloud2Y  = useRef(new Animated.Value(0)).current;
  const moonY    = useRef(new Animated.Value(0)).current;
  const starOp   = useRef(new Animated.Value(0.5)).current;
  const textOp   = useRef(new Animated.Value(0)).current;
  const splashOp = useRef(new Animated.Value(1)).current;

  const slideAnim   = useRef(new Animated.Value(0)).current;
  const splashTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Splash bootstrap ─────────────────────────────────────────────────────────

  useEffect(() => {
    const bounce = (v: Animated.Value, amp: number, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: amp, duration: dur, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0,   duration: dur, useNativeDriver: true }),
      ]));

    const anims = [
      bounce(cloud1Y, -8,  1400),
      bounce(cloud2Y,  8,  1700),
      bounce(moonY,   -6,  2100),
      Animated.loop(Animated.sequence([
        Animated.timing(starOp, { toValue: 1,   duration: 650, useNativeDriver: true }),
        Animated.timing(starOp, { toValue: 0.3, duration: 650, useNativeDriver: true }),
      ])),
    ];
    anims.forEach(a => a.start());
    Animated.timing(textOp, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }).start();

    const doTransition = () =>
      Animated.timing(splashOp, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        anims.forEach(a => a.stop());
        setPhase('slides');
      });

    splashTimer.current = setTimeout(doTransition, 3500);
    return () => { clearTimeout(splashTimer.current); anims.forEach(a => a.stop()); };
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────────

  function advanceSplash() {
    clearTimeout(splashTimer.current);
    Animated.timing(splashOp, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
      setPhase('slides')
    );
  }

  function goToSlide(idx: number) {
    Animated.spring(slideAnim, {
      toValue: -idx * width,
      useNativeDriver: false,
      tension: 68, friction: 12,
    }).start();
    setCurrent(idx);
  }

  function handleNext() {
    if (phase === 'splash') { advanceSplash(); return; }
    if (current === SLIDES.length - 1) {
      router.replace('/(auth)/onboarding');
    } else {
      goToSlide(current + 1);
    }
  }

  function handleSkip() { router.replace('/(auth)/onboarding'); }

  // ── Swipe support ────────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy),
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -40 && current < SLIDES.length - 1) goToSlide(current + 1);
        else if (dx > 40 && current > 0)             goToSlide(current - 1);
      },
    })
  ).current;

  // ── Derived ──────────────────────────────────────────────────────────────────

  const dotIndex = phase === 'splash' ? 0 : current + 1;
  const accent   = phase === 'slides' ? SLIDES[current].accentColor : '#E8637C';
  const isLast   = phase === 'slides' && current === SLIDES.length - 1;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>

      {/* ═══ SPLASH ══════════════════════════════════════════════════════════ */}
      {phase === 'splash' && (
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: splashOp }]}>
          <LinearGradient colors={[Colors.softPink, '#FFF0F6', '#FFFAFC']} style={s.page}>

            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={[s.skipText, { color: '#E8637C' }]}>Skip</Text>
            </TouchableOpacity>

            {/* Blob + custom bear + floating deco */}
            <View style={s.splashBlobWrap}>
              {/* Floating deco elements */}
              <Animated.View style={[s.dCloud1, { transform: [{ translateY: cloud1Y }] }]}><Cloud size={36} color="#B0C4DE" /></Animated.View>
              <Animated.View style={[s.dCloud2, { transform: [{ translateY: cloud2Y }] }]}><Cloud size={28} color="#B0C4DE" /></Animated.View>
              <Animated.View style={[s.dMoon,   { transform: [{ translateY: moonY   }] }]}><Moon size={30} color={Colors.gold} /></Animated.View>
              <Animated.View style={[s.dStar1,  { opacity: starOp }]}><Star size={22} color={Colors.gold} /></Animated.View>
              <Animated.View style={[s.dStar2,  { opacity: starOp }]}><Sparkles size={17} color={Colors.gold} /></Animated.View>
              <Animated.View style={[s.dStar3,  { opacity: starOp }]}><Star size={19} color={Colors.gold} /></Animated.View>

              {/* Pink gradient blob — LinearGradient as container so illustration renders on top */}
              <LinearGradient
                colors={['#FFB3C6', '#FFD0DC', '#FFE8EF']}
                style={s.splashBlob}
              >
                <BearIllustration size={200} />
              </LinearGradient>
            </View>

            <Animated.View style={[s.splashTextWrap, { opacity: textOp }]}>
              <Text style={s.splashTitle}>Welcome to BabyBloom <View style={{ marginLeft: 4 }}><Flower2 size={24} color="#E8637C" /></View></Text>
              <Text style={s.splashSubtitle}>
                A beautiful journey of watching your baby{'\n'}grow healthy and happy.
              </Text>
            </Animated.View>

            <View style={s.bottomRow}>
              <Dots total={TOTAL_SCREENS} active={dotIndex} color="#E8637C" />
              <ArrowBtn color="#E8637C" onPress={handleNext} />
            </View>
            <View style={{ height: 44 }} />
          </LinearGradient>
        </Animated.View>
      )}

      {/* ═══ FEATURE SLIDES ══════════════════════════════════════════════════ */}
      {phase === 'slides' && (
        <View style={[s.page, { backgroundColor: '#FFF8FB' }]}>

          {!isLast && (
            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={[s.skipText, { color: accent }]}>Skip</Text>
            </TouchableOpacity>
          )}

          <View style={[s.slidesViewport, { width }]} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                s.slidesStrip,
                { width: width * SLIDES.length, transform: [{ translateX: slideAnim }] },
              ]}
            >
              {SLIDES.map((sl) => (
                <SlideContent key={sl.key} slide={sl} width={width} t={t} />
              ))}
            </Animated.View>
          </View>

          <View style={s.bottomSection}>
            <View style={s.bottomRow}>
              <Dots total={TOTAL_SCREENS} active={dotIndex} color={accent} />
              {!isLast && <ArrowBtn color={accent} onPress={handleNext} />}
            </View>
            {isLast && (
              <TouchableOpacity style={s.ctaBtn} onPress={handleNext} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#E8637C', '#F0829A', '#F5A0B5']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.ctaBtnGrad}
                >
                  <Text style={s.ctaBtnText}><View style={{ marginRight: 6 }}><Star size={17} color={Colors.white} /></View> {t('intro.cta_start')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 44 }} />
        </View>
      )}
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Dots({ total, active, color }: { total: number; active: number; color: string }) {
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === active
              ? [s.dotActive, { backgroundColor: color }]
              : s.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

function ArrowBtn({ color, onPress }: { color: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.arrowBtn, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={s.arrowText}>→</Text>
    </TouchableOpacity>
  );
}

function SlideContent({
  slide, width, t,
}: {
  slide: typeof SLIDES[number];
  width: number;
  t: (key: string) => string;
}) {
  const { Illustration } = slide;
  return (
    <View style={[s.slide, { width }]}>
      {/* Gradient blob — LinearGradient as container so illustration renders on top */}
      <LinearGradient colors={slide.blobColors} style={s.blob}>
        <Illustration size={180} />
      </LinearGradient>

      <View style={s.textArea}>
        <Text style={[s.slideTitle, { color: slide.accentColor }]}>
          {t(`intro.${slide.key}_title`)}
        </Text>
        <Text style={s.slideSubtitle}>
          {t(`intro.${slide.key}_desc`)}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  page: { flex: 1, alignItems: 'center', paddingTop: 56 },

  skipBtn:  { alignSelf: 'flex-end', paddingHorizontal: 24, paddingVertical: 8, marginBottom: 4 },
  skipText: { fontSize: 15, fontWeight: '600' },

  // ── Splash ──────────────────────────────────────────────────────────────────
  splashBlobWrap: {
    flex: 1,
    width: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBlob: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#E8637C',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  // Floating deco (positioned inside splashBlobWrap)
  dCloud1: { position: 'absolute', top: 14,  left: 0   },
  dCloud2: { position: 'absolute', bottom: 18, right: 6 },
  dMoon:   { position: 'absolute', top: 6,   right: 20 },
  dStar1:  { position: 'absolute', top: 64,  right: 0  },
  dStar2:  { position: 'absolute', bottom: 64, left: 10 },
  dStar3:  { position: 'absolute', top: 108, left: 28  },

  splashTextWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E8637C',
    textAlign: 'center',
    marginBottom: 12,
  },
  splashSubtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 23,
    fontWeight: '500',
  },

  // ── Feature slides ───────────────────────────────────────────────────────────
  slidesViewport: { flex: 1, overflow: 'hidden' },
  slidesStrip:    { flexDirection: 'row', flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 28,
  },

  blob: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  textArea: {
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  slideTitle: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
  },
  slideSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },

  // ── Bottom nav ───────────────────────────────────────────────────────────────
  bottomSection: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 16,
    marginTop: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 28,
    marginTop: 8,
    marginBottom: 4,
  },
  dotsRow:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:         { height: 9, borderRadius: 5 },
  dotActive:   { width: 28 },
  dotInactive: { width: 9, backgroundColor: 'rgba(0,0,0,0.15)' },

  arrowBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  arrowText: { fontSize: 22, color: Colors.white, fontWeight: '700' },

  ctaBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#E8637C',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaBtnGrad: { paddingVertical: 17, alignItems: 'center', borderRadius: 18 },
  ctaBtnText: { color: Colors.white, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
