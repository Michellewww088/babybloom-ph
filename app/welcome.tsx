/**
 * welcome.tsx
 * Full-screen animated welcome shown after the first child profile is saved.
 * Auto-navigates to Dashboard after 2.8 seconds (or on Skip tap).
 *
 * Animations (react-native-reanimated):
 *   - Baby emoji: spring bounce in
 *   - Title + subtitle: fade + slide-up with delays
 *   - Sparkles: infinite twinkling at scattered positions
 *
 * Background: expo-linear-gradient (soft pink → gold → soft pink)
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../constants/Colors';
import { useChildStore, getChildDisplayName } from '../store/childStore';

// ── Screen dimensions ────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get('window');

// ── Sparkle positions (relative to screen) ──────────────────────────────────

const SPARKLES = [
  { x: W * 0.07,  y: H * 0.10, delay: 80,   emoji: '✨' },
  { x: W * 0.82,  y: H * 0.08, delay: 260,  emoji: '🌟' },
  { x: W * 0.03,  y: H * 0.46, delay: 170,  emoji: '✨' },
  { x: W * 0.87,  y: H * 0.40, delay: 350,  emoji: '⭐' },
  { x: W * 0.20,  y: H * 0.73, delay: 210,  emoji: '✨' },
  { x: W * 0.76,  y: H * 0.70, delay: 300,  emoji: '🌟' },
  { x: W * 0.46,  y: H * 0.05, delay: 140,  emoji: '⭐' },
  { x: W * 0.62,  y: H * 0.82, delay: 230,  emoji: '✨' },
  { x: W * 0.34,  y: H * 0.88, delay: 320,  emoji: '🌟' },
  { x: W * 0.90,  y: H * 0.20, delay: 190,  emoji: '✨' },
];

// ── Stable sparkle component (module-level → never remounts) ─────────────────

function SparkleEmoji({ x, y, delay, emoji }: { x: number; y: number; delay: number; emoji: string }) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,   { duration: 550 }),
          withTiming(0.1, { duration: 650 }),
        ),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1.3, { damping: 8, stiffness: 80 }),
          withTiming(0.5, { duration: 650 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[st.sparkle, { left: x, top: y }, aStyle]}>
      {emoji}
    </Animated.Text>
  );
}

// ── Welcome Screen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const { t }        = useTranslation();
  const { activeChild } = useChildStore();
  const name         = activeChild ? getChildDisplayName(activeChild) : 'Baby';

  // ── Shared animation values ────────────────────────────────────────────────

  const emojiScale   = useSharedValue(0);
  const emojiRotate  = useSharedValue(-0.15);   // slight tilt → rights itself

  const titleOpacity = useSharedValue(0);
  const titleY       = useSharedValue(32);

  const subOpacity   = useSharedValue(0);
  const subY         = useSharedValue(20);

  // ── Run animations on mount ────────────────────────────────────────────────

  useEffect(() => {
    // 1. Baby emoji spring in
    emojiScale.value  = withSpring(1,    { damping: 6,  stiffness: 70 });
    emojiRotate.value = withSpring(0,    { damping: 10, stiffness: 80 });

    // 2. Title fade + slide up (after 400ms)
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    titleY.value       = withDelay(400, withTiming(0, { duration: 700 }));

    // 3. Subtitle fade + slide up (after 900ms)
    subOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    subY.value       = withDelay(900, withTiming(0, { duration: 600 }));

    // 4. Auto-navigate to dashboard after 2.8 seconds
    const timer = setTimeout(() => router.replace('/(tabs)'), 2800);
    return () => clearTimeout(timer);
  }, []);

  // ── Animated styles ────────────────────────────────────────────────────────

  const emojiAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale:  emojiScale.value },
      { rotate: `${emojiRotate.value}rad` },
    ],
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subAnimStyle = useAnimatedStyle(() => ({
    opacity:   subOpacity.value,
    transform: [{ translateY: subY.value }],
  }));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient
      colors={['#FFE4EE', '#FFF8E8', '#FFE4EE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={st.screen}
    >
      {/* ── Sparkles (scattered twinkling) ── */}
      {SPARKLES.map((sp, i) => (
        <SparkleEmoji key={i} x={sp.x} y={sp.y} delay={sp.delay} emoji={sp.emoji} />
      ))}

      {/* ── Main content ── */}
      <View style={st.content}>

        {/* Baby emoji with spring bounce */}
        <Animated.Text style={[st.babyEmoji, emojiAnimStyle]}>
          👶
        </Animated.Text>

        {/* Small flourish row */}
        <View style={st.flowerRow}>
          <Text style={st.flowerEmoji}>🌸</Text>
          <Text style={st.flowerEmoji}>🍼</Text>
          <Text style={st.flowerEmoji}>🌸</Text>
        </View>

        {/* Welcome title */}
        <Animated.Text style={[st.title, titleAnimStyle]}>
          {t('welcome.title', { name })}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[st.subtitle, subAnimStyle]}>
          {t('welcome.subtitle')}
        </Animated.Text>

      </View>

      {/* ── Skip / Go to Dashboard button ── */}
      <TouchableOpacity
        style={st.skipBtn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.75}
      >
        <Text style={st.skipText}>{t('welcome.skip')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sparkles (absolutely positioned)
  sparkle: {
    position: 'absolute',
    fontSize: 22,
  },

  // Main content block
  content: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },

  babyEmoji: {
    fontSize: 96,
    marginBottom: 8,
  },

  flowerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  flowerEmoji: { fontSize: 22 },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 38,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.midGray,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },

  // Skip button (bottom of screen)
  skipBtn: {
    position: 'absolute',
    bottom: 52,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: Colors.primaryPink,
  },
  skipText: {
    color: Colors.primaryPink,
    fontWeight: '700',
    fontSize: 14,
  },
});
