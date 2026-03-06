/**
 * welcome.tsx — BabyBloom PH
 * Full-screen animated welcome shown after the first child profile is saved.
 *
 * Animations (react-native-reanimated):
 *  • Main card : 3-D flip-in  (perspective + rotateX 45°→0°) + slide-up
 *  • Illustration : spring scale bounce + continuous float
 *  • Glow rings  : 3 staggered pulse rings (scale + fade)
 *  • Confetti    : 14 coloured dots floating up from bottom
 *  • Title / sub : fade + scale from 0.85
 *
 * Auto-navigates to Dashboard after 3.2 s (or on Tap).
 */

import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../constants/Colors';
import { useChildStore, getChildDisplayName } from '../store/childStore';

const { width: W, height: H } = Dimensions.get('window');

// ─── Confetti config ──────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#FF6B95', '#FFB347', '#A8E6CF', '#85C1E9',
  '#F7DC6F', '#C39BD3', '#F1948A', '#82E0AA',
  '#7FB3D3', '#F8C471', '#FF9A9E', '#A29BFE',
  '#FD79A8', '#6C5CE7',
];

const CONFETTI: { x: number; y: number; color: string; size: number; delay: number; dur: number }[] = [
  { x: W * 0.05, y: H * 0.95, color: CONFETTI_COLORS[0],  size: 8,  delay: 0,   dur: 2800 },
  { x: W * 0.15, y: H * 0.98, color: CONFETTI_COLORS[1],  size: 6,  delay: 200, dur: 2600 },
  { x: W * 0.28, y: H * 0.92, color: CONFETTI_COLORS[2],  size: 10, delay: 100, dur: 3000 },
  { x: W * 0.42, y: H * 0.96, color: CONFETTI_COLORS[3],  size: 7,  delay: 350, dur: 2700 },
  { x: W * 0.58, y: H * 0.94, color: CONFETTI_COLORS[4],  size: 9,  delay: 80,  dur: 2900 },
  { x: W * 0.72, y: H * 0.97, color: CONFETTI_COLORS[5],  size: 6,  delay: 260, dur: 2500 },
  { x: W * 0.85, y: H * 0.93, color: CONFETTI_COLORS[6],  size: 8,  delay: 450, dur: 3100 },
  { x: W * 0.93, y: H * 0.99, color: CONFETTI_COLORS[7],  size: 5,  delay: 150, dur: 2400 },
  { x: W * 0.10, y: H * 0.88, color: CONFETTI_COLORS[8],  size: 7,  delay: 320, dur: 2750 },
  { x: W * 0.35, y: H * 0.90, color: CONFETTI_COLORS[9],  size: 10, delay: 50,  dur: 3200 },
  { x: W * 0.62, y: H * 0.91, color: CONFETTI_COLORS[10], size: 6,  delay: 400, dur: 2600 },
  { x: W * 0.78, y: H * 0.89, color: CONFETTI_COLORS[11], size: 8,  delay: 220, dur: 2850 },
  { x: W * 0.50, y: H * 0.99, color: CONFETTI_COLORS[12], size: 9,  delay: 500, dur: 2950 },
  { x: W * 0.88, y: H * 0.86, color: CONFETTI_COLORS[13], size: 7,  delay: 370, dur: 2700 },
];

// ─── SVG illustration — Kawaii baby in a star ─────────────────────────────────

function BabyStarIllustration() {
  return (
    <Svg width={200} height={200} viewBox="0 0 200 200">
      {/* Star background */}
      <Path
        d="M100 10 L118 65 L176 65 L130 99 L148 154 L100 120 L52 154 L70 99 L24 65 L82 65 Z"
        fill="#FFE4EE"
        stroke="#FFB3C6"
        strokeWidth={3}
      />
      {/* Star inner glow */}
      <Path
        d="M100 28 L113 68 L156 68 L122 92 L135 132 L100 108 L65 132 L78 92 L44 68 L87 68 Z"
        fill="#FFF0F5"
        opacity={0.7}
      />

      {/* Baby head */}
      <Circle cx={100} cy={84} r={26} fill="#FFDAB9" />

      {/* Rosy cheeks */}
      <Circle cx={82}  cy={90} r={7} fill="#FFB3C6" opacity={0.6} />
      <Circle cx={118} cy={90} r={7} fill="#FFB3C6" opacity={0.6} />

      {/* Eyes */}
      <Circle cx={90}  cy={82} r={4} fill="#1C1C3A" />
      <Circle cx={110} cy={82} r={4} fill="#1C1C3A" />
      {/* Eye shine */}
      <Circle cx={92}  cy={80} r={1.5} fill="white" />
      <Circle cx={112} cy={80} r={1.5} fill="white" />

      {/* Smile */}
      <Path
        d="M92 92 Q100 100 108 92"
        stroke="#E63B6F"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />

      {/* Baby hair */}
      <Path
        d="M76 72 Q88 56 100 58 Q112 56 124 72"
        stroke="#C8906A"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />

      {/* Baby swaddle body */}
      <Ellipse cx={100} cy={125} rx={24} ry={18} fill="#FFE4EE" />
      <Ellipse cx={100} cy={130} rx={20} ry={13} fill="#FFC8D8" />

      {/* Tiny bow on top of head */}
      <Path
        d="M94 58 Q100 53 106 58 Q100 62 94 58Z"
        fill="#E63B6F"
        opacity={0.8}
      />

      {/* Mini stars around */}
      <Path d="M30 30 L33 38 L40 38 L35 43 L37 51 L30 46 L23 51 L25 43 L20 38 L27 38Z"
        fill="#F5A623" opacity={0.8} />
      <Path d="M162 22 L164 28 L170 28 L165 32 L167 38 L162 34 L157 38 L159 32 L154 28 L160 28Z"
        fill="#F5A623" opacity={0.7} />
      <Path d="M168 155 L170 161 L176 161 L171 165 L173 171 L168 167 L163 171 L165 165 L160 161 L166 161Z"
        fill="#E63B6F" opacity={0.6} />
    </Svg>
  );
}

// ─── Pulsing ring ─────────────────────────────────────────────────────────────

function PulseRing({ delay, size, color }: { delay: number; size: number; color: string }) {
  const scale   = useSharedValue(0.4);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 0 }),
        ),
        -1,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
          withTiming(0.7, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: color,
        },
        aStyle,
      ]}
    />
  );
}

// ─── Single confetti dot ──────────────────────────────────────────────────────

function ConfettiDot({
  x, y, color, size, delay, dur,
}: typeof CONFETTI[0]) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const rotate     = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1,   { duration: 400 }),
          withTiming(0.9, { duration: dur - 600 }),
          withTiming(0,   { duration: 200 }),
          withTiming(0,   { duration: 400 }),
        ),
        -1,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-(H * 0.55), { duration: dur, easing: Easing.out(Easing.quad) }),
          withTiming(0,           { duration: 0 }),
        ),
        -1,
      ),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: dur * 1.2, easing: Easing.linear }),
        -1,
      ),
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top:  y,
          width:  size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        aStyle,
      ]}
    />
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const name            = activeChild ? getChildDisplayName(activeChild) : 'Baby';

  // ── Shared values ─────────────────────────────────────────────────────────

  // Card 3-D flip-in: starts tilted away (rotateX 45°), slides from below
  const cardRotateX  = useSharedValue(45);
  const cardTranslY  = useSharedValue(120);
  const cardOpacity  = useSharedValue(0);
  const cardScale    = useSharedValue(0.85);

  // Illustration float
  const illustScale  = useSharedValue(0);
  const illustFloatY = useSharedValue(0);

  // Title & subtitle
  const titleOpacity = useSharedValue(0);
  const titleScale   = useSharedValue(0.85);

  const subOpacity   = useSharedValue(0);
  const subScale     = useSharedValue(0.85);

  // Tap-to-go hint
  const hintOpacity  = useSharedValue(0);

  // ── Kick off on mount ─────────────────────────────────────────────────────

  useEffect(() => {
    // 1. Card 3-D flip up (perspective effect via rotateX)
    cardOpacity.value  = withTiming(1, { duration: 300 });
    cardRotateX.value  = withSpring(0,  { damping: 14, stiffness: 90 });
    cardTranslY.value  = withSpring(0,  { damping: 14, stiffness: 90 });
    cardScale.value    = withSpring(1,  { damping: 12, stiffness: 100 });

    // 2. Illustration spring in after 150 ms
    illustScale.value  = withDelay(150, withSpring(1, { damping: 6, stiffness: 70 }));

    // 3. Continuous float after initial settle
    illustFloatY.value = withDelay(
      700,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(  0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    // 4. Title fade + scale
    titleOpacity.value = withDelay(350, withTiming(1, { duration: 600 }));
    titleScale.value   = withDelay(350, withSpring(1, { damping: 10, stiffness: 90 }));

    // 5. Subtitle
    subOpacity.value   = withDelay(650, withTiming(1, { duration: 600 }));
    subScale.value     = withDelay(650, withSpring(1, { damping: 10, stiffness: 90 }));

    // 6. Hint
    hintOpacity.value  = withDelay(1400, withTiming(0.7, { duration: 600 }));

    // 7. Auto-navigate
    const timer = setTimeout(() => router.replace('/(tabs)'), 3200);
    return () => clearTimeout(timer);
  }, []);

  // ── Animated styles ───────────────────────────────────────────────────────

  const cardAStyle = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [
      { perspective: 900 },
      { rotateX:     `${cardRotateX.value}deg` },
      { translateY:  cardTranslY.value },
      { scale:       cardScale.value },
    ],
  }));

  const illustAStyle = useAnimatedStyle(() => ({
    transform: [
      { scale:      illustScale.value },
      { translateY: illustFloatY.value },
    ],
  }));

  const titleAStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const subAStyle = useAnimatedStyle(() => ({
    opacity:   subOpacity.value,
    transform: [{ scale: subScale.value }],
  }));

  const hintAStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{ flex: 1 }}
      onPress={() => router.replace('/(tabs)')}
    >
      <LinearGradient
        colors={['#1C1C3A', '#3D1F5A', '#1C1C3A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.screen}
      >
        {/* ── Confetti dots ── */}
        {CONFETTI.map((c, i) => <ConfettiDot key={i} {...c} />)}

        {/* ── Pulse rings (centred) ── */}
        <View style={st.ringWrap}>
          <PulseRing delay={0}    size={260} color="rgba(230,59,111,0.5)" />
          <PulseRing delay={540}  size={340} color="rgba(245,166,35,0.35)" />
          <PulseRing delay={1080} size={420} color="rgba(230,59,111,0.2)" />
        </View>

        {/* ── 3-D card ── */}
        <Animated.View style={[st.card, cardAStyle]}>

          {/* Illustration container with glow */}
          <View style={st.illustWrap}>
            <View style={st.illustGlow} />
            <Animated.View style={illustAStyle}>
              <BabyStarIllustration />
            </Animated.View>
          </View>

          {/* Divider sparkles */}
          <View style={st.sparkleRow}>
            {['✨','🌸','✨','🌸','✨'].map((s, i) => (
              <Text key={i} style={st.sparkleChar}>{s}</Text>
            ))}
          </View>

          {/* Title */}
          <Animated.Text style={[st.title, titleAStyle]}>
            {t('welcome.title', { name })}
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[st.subtitle, subAStyle]}>
            {t('welcome.subtitle')}
          </Animated.Text>

        </Animated.View>

        {/* ── Tap hint ── */}
        <Animated.Text style={[st.tapHint, hintAStyle]}>
          {t('welcome.skip', 'Tap anywhere to continue →')}
        </Animated.Text>

      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },

  // Centred ring holder
  ringWrap: {
    position:        'absolute',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Main card ──────────────────────────────────────────────────────────────
  card: {
    width:           W * 0.85,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius:    32,
    alignItems:      'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.18)',
    // Glass shadow
    shadowColor:     Colors.primaryPink,
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.5,
    shadowRadius:    24,
    elevation:       16,
  },

  // Illustration
  illustWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  illustGlow: {
    position:        'absolute',
    width:           180,
    height:          180,
    borderRadius:    90,
    backgroundColor: Colors.primaryPink,
    opacity:         0.15,
    // Blur via shadow trick
    shadowColor:     Colors.primaryPink,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    40,
  },

  // Sparkle row
  sparkleRow: {
    flexDirection:  'row',
    gap:            8,
    marginVertical: 12,
  },
  sparkleChar: {
    fontSize: 18,
  },

  // Title
  title: {
    fontSize:       28,
    fontWeight:     '800',
    color:          '#FFFFFF',
    textAlign:      'center',
    marginBottom:   12,
    lineHeight:     38,
    textShadowColor:  'rgba(230,59,111,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  // Subtitle
  subtitle: {
    fontSize:     15,
    color:        'rgba(255,255,255,0.75)',
    textAlign:    'center',
    lineHeight:   24,
  },

  // Tap hint
  tapHint: {
    position:     'absolute',
    bottom:       52,
    fontSize:     13,
    color:        'rgba(255,255,255,0.7)',
    fontWeight:   '500',
    letterSpacing: 0.3,
  },
});
