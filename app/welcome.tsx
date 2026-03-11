/**
 * welcome.tsx — BabyBloom PH
 * NEW DESIGN: Clean white/cream + BB logo bloom + floating petals
 * Completely different from the previous baby-on-cloud design
 * 5-second auto-navigate, tap to skip
 */

import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Image, TouchableOpacity, Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue, withSpring, withTiming, withDelay,
  withRepeat, withSequence, useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import Svg, {
  Path, Circle, Ellipse, Defs,
  RadialGradient, LinearGradient as SvgGrad, Stop, G,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import Colors from '../constants/Colors';

const { width: W, height: H } = Dimensions.get('window');

// ─── Petal SVG ────────────────────────────────────────────────────────────────
function Petal({ size = 28, color = '#FFB3D9', rotate = 0 }: {
  size?: number; color?: string; rotate?: number;
}) {
  return (
    <Svg width={size} height={size * 1.6} viewBox="0 0 20 32">
      <Defs>
        <RadialGradient id={`pg${rotate}`} cx="50%" cy="30%" r="60%">
          <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.7" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </RadialGradient>
      </Defs>
      <Path
        d="M 10,2 C 16,8 18,16 10,30 C 2,16 4,8 10,2 Z"
        fill={`url(#pg${rotate})`}
        transform={`rotate(${rotate}, 10, 16)`}
      />
    </Svg>
  );
}

// ─── Floating petal particle ──────────────────────────────────────────────────
function FloatPetal({ startX, startY, size, color, delay, duration }: {
  startX: number; startY: number; size: number;
  color: string; delay: number; duration: number;
}) {
  const ty  = useSharedValue(0);
  const tx  = useSharedValue(0);
  const op  = useSharedValue(0);
  const rot = useSharedValue(0);
  const sc  = useSharedValue(0.6);

  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0,       { duration: 0 }),
      withTiming(-H * 0.55, { duration, easing: Easing.linear }),
    ), -1));
    tx.value = withDelay(delay, withRepeat(withSequence(
      withTiming( 30, { duration: duration * 0.4, easing: Easing.inOut(Easing.ease) }),
      withTiming(-20, { duration: duration * 0.3, easing: Easing.inOut(Easing.ease) }),
      withTiming( 10, { duration: duration * 0.3, easing: Easing.inOut(Easing.ease) }),
    ), -1));
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0,   { duration: 0 }),
      withTiming(0.9, { duration: duration * 0.12, easing: Easing.out(Easing.ease) }),
      withTiming(0.7, { duration: duration * 0.65 }),
      withTiming(0,   { duration: duration * 0.23, easing: Easing.in(Easing.ease) }),
    ), -1));
    rot.value = withDelay(delay, withRepeat(
      withTiming(360, { duration: duration * 0.7, easing: Easing.linear }), -1,
    ));
    sc.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1,   { duration: duration * 0.3 }),
      withTiming(0.6, { duration: duration * 0.7 }),
    ), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: sc.value },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: startX, top: startY }, style]}>
      <Petal size={size} color={color} />
    </Animated.View>
  );
}

// ─── Bloom ring ────────────────────────────────────────────────────────────────
function BloomRing({ index, delay }: { index: number; delay: number }) {
  const sc = useSharedValue(0.3);
  const op = useSharedValue(0);

  useEffect(() => {
    sc.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0.3, { duration: 0 }),
      withTiming(1.6, { duration: 2200, easing: Easing.out(Easing.ease) }),
    ), -1));
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(0,   { duration: 2000, easing: Easing.out(Easing.ease) }),
    ), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));

  const colors = ['#FFB3D9', '#FF88C2', '#FFCCE8'];
  const size   = 120 + index * 40;

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: colors[index % colors.length],
    }, style]} />
  );
}

// ─── 8-petal flower ────────────────────────────────────────────────────────────
function FlowerDecor({ size = 60, color = '#FFB3D9', opacity = 0.35 }: {
  size?: number; color?: string; opacity?: number;
}) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" opacity={opacity}>
      <Defs>
        <RadialGradient id="fd" cx="50%" cy="35%" r="55%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color}   stopOpacity="0.9" />
        </RadialGradient>
      </Defs>
      {petals.map(deg => (
        <Ellipse
          key={deg}
          cx={30} cy={18} rx={7} ry={13}
          fill="url(#fd)"
          transform={`rotate(${deg}, 30, 30)`}
        />
      ))}
      <Circle cx={30} cy={30} r={8} fill="#FFD4EC" />
      <Circle cx={30} cy={30} r={5} fill="#FF88C2" />
    </Svg>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const name            = activeChild ? getChildDisplayName(activeChild) : 'Baby';

  // RN Animated for progress bar
  const progress = useRef(new RNAnimated.Value(0)).current;

  // Reanimated
  const logoSc   = useSharedValue(0);
  const logoOp   = useSharedValue(0);
  const logoRot  = useSharedValue(-8);
  const textOp   = useSharedValue(0);
  const textY    = useSharedValue(20);
  const ringPulse = useSharedValue(1);

  useEffect(() => {
    // Logo bloom entrance
    logoSc.value  = withSpring(1, { damping: 8, stiffness: 70 });
    logoOp.value  = withTiming(1, { duration: 600 });
    logoRot.value = withSpring(0, { damping: 10, stiffness: 80 });

    // Logo gentle breathe after entrance
    setTimeout(() => {
      ringPulse.value = withRepeat(withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.00, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ), -1, true);
    }, 800);

    // Text slide-up
    textOp.value = withDelay(500, withTiming(1, { duration: 700 }));
    textY.value  = withDelay(500, withSpring(0, { damping: 12, stiffness: 90 }));

    // Progress
    RNAnimated.timing(progress, {
      toValue: 1, duration: 5000,
      easing: t => t,
      useNativeDriver: false,
    }).start();

    const nav = setTimeout(() => router.replace('/(tabs)'), 5000);
    return () => clearTimeout(nav);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOp.value,
    transform: [
      { scale:  logoSc.value },
      { rotate: `${logoRot.value}deg` },
    ],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOp.value,
    transform: [{ translateY: textY.value }],
  }));

  const PETAL_DATA = [
    { x: W*0.08, y: H*0.55, size: 20, color: '#FF88C2', delay: 0,    dur: 5200 },
    { x: W*0.18, y: H*0.60, size: 14, color: '#FFAED8', delay: 700,  dur: 4800 },
    { x: W*0.28, y: H*0.58, size: 18, color: '#FF6BAE', delay: 1400, dur: 5600 },
    { x: W*0.40, y: H*0.62, size: 12, color: '#FFD0EA', delay: 300,  dur: 4400 },
    { x: W*0.52, y: H*0.57, size: 22, color: '#FF88C2', delay: 900,  dur: 5000 },
    { x: W*0.64, y: H*0.61, size: 16, color: '#FFAED8', delay: 200,  dur: 4600 },
    { x: W*0.76, y: H*0.59, size: 20, color: '#FF6BAE', delay: 1100, dur: 5300 },
    { x: W*0.88, y: H*0.56, size: 14, color: '#FFD0EA', delay: 600,  dur: 4900 },
    { x: W*0.12, y: H*0.70, size: 11, color: '#FFAED8', delay: 1800, dur: 4200 },
    { x: W*0.72, y: H*0.68, size: 13, color: '#FF88C2', delay: 1500, dur: 4700 },
    { x: W*0.35, y: H*0.72, size: 10, color: '#FFD0EA', delay: 2200, dur: 4000 },
    { x: W*0.60, y: H*0.74, size: 15, color: '#FF6BAE', delay: 800,  dur: 5100 },
  ];

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => router.replace('/(tabs)')}>
      {/* ── Background: soft cream gradient ── */}
      <View style={st.bg} />
      <View style={st.bgGrad} />

      {/* ── Decorative corner flowers ── */}
      <View style={[st.deco, { top: -8, left: -8 }]}>
        <FlowerDecor size={90} color="#FFAED8" opacity={0.25} />
      </View>
      <View style={[st.deco, { top: -8, right: -8 }]}>
        <FlowerDecor size={80} color="#FF88C2" opacity={0.22} />
      </View>
      <View style={[st.deco, { bottom: H*0.12, left: -10 }]}>
        <FlowerDecor size={70} color="#FFD4EC" opacity={0.28} />
      </View>
      <View style={[st.deco, { bottom: H*0.10, right: -10 }]}>
        <FlowerDecor size={85} color="#FFAED8" opacity={0.24} />
      </View>
      {/* Scattered small flowers */}
      <View style={{ position: 'absolute', top: H*0.12, left: W*0.06 }}>
        <FlowerDecor size={36} color="#FF88C2" opacity={0.20} />
      </View>
      <View style={{ position: 'absolute', top: H*0.08, right: W*0.08 }}>
        <FlowerDecor size={28} color="#FFD0E8" opacity={0.25} />
      </View>
      <View style={{ position: 'absolute', top: H*0.20, right: W*0.04 }}>
        <FlowerDecor size={22} color="#FF6BAE" opacity={0.18} />
      </View>
      <View style={{ position: 'absolute', top: H*0.28, left: W*0.02 }}>
        <FlowerDecor size={20} color="#FFAED8" opacity={0.20} />
      </View>

      {/* ── Floating petals ── */}
      {PETAL_DATA.map((p, i) => (
        <FloatPetal key={i} startX={p.x} startY={p.y} size={p.size}
          color={p.color} delay={p.delay} duration={p.dur} />
      ))}

      {/* ── Center: bloom rings + logo ── */}
      <View style={st.center}>
        {/* Bloom pulse rings */}
        <View style={st.rings}>
          <BloomRing index={0} delay={0}    />
          <BloomRing index={1} delay={750}  />
          <BloomRing index={2} delay={1500} />
        </View>

        {/* Soft glow circle behind logo */}
        <View style={st.glow} />

        {/* BB Logo */}
        <Animated.View style={[st.logoPulse, pulseStyle]}>
          <Animated.View style={[st.logoWrap, logoStyle]}>
            <Image
              source={require('../assets/images/bb-logo.png')}
              style={st.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>

      {/* ── Text ── */}
      <Animated.View style={[st.textArea, textStyle]}>
        <View style={st.brandRow}>
          <Text style={[st.brand, { color: '#FF4899' }]}>Baby</Text>
          <Text style={[st.brand, { color: '#9B35C0' }]}>Bloom</Text>
          <View style={st.phTag}>
            <Text style={st.phTxt}>PH</Text>
          </View>
        </View>
        <Text style={st.tagline}>
          {t('welcome.subtitle', 'Your Baby\'s First Digital Home 🌸')}
        </Text>
      </Animated.View>

      {/* ── 5-second progress bar ── */}
      <View style={st.barArea}>
        <View style={st.barTrack}>
          <RNAnimated.View
            style={[st.barFill, {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]}
          />
          <RNAnimated.View
            style={[st.barDot, {
              left: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '96%'] }),
            }]}
          />
        </View>
        <Text style={st.hint}>Tap anywhere to continue</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const LOGO_SZ = W * 0.52;

const st = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5FB',
  },
  bgGrad: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulated radial via large circle — actual gradient needs LinearGradient
    // We keep it simple: just the bg color + decorative elements
  },
  deco: {
    position: 'absolute',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: H * 0.04,
  },
  rings: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width:  LOGO_SZ * 1.4,
    height: LOGO_SZ * 1.4,
    borderRadius: LOGO_SZ * 0.7,
    backgroundColor: 'rgba(255,72,153,0.08)',
  },
  logoPulse: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    // drop shadow
    shadowColor: '#CC2288',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width:  LOGO_SZ,
    height: LOGO_SZ,
    borderRadius: LOGO_SZ * 0.26,
  },

  textArea: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: Math.round(W * 0.115),
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(200,50,150,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  phTag: {
    marginLeft: 8,
    marginBottom: 2,
    backgroundColor: '#FF4899',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  phTxt: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C060A0',
    textAlign: 'center',
    letterSpacing: 0.1,
    opacity: 0.85,
  },

  barArea: {
    alignItems: 'center',
    paddingBottom: H * 0.05,
    paddingHorizontal: 48,
  },
  barTrack: {
    width: W * 0.55,
    height: 5,
    backgroundColor: 'rgba(200,80,150,0.15)',
    borderRadius: 5,
    overflow: 'visible',
    marginBottom: 14,
    position: 'relative',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FF4899',
    borderRadius: 5,
  },
  barDot: {
    position: 'absolute',
    top: -3.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4899',
    shadowColor: '#FF4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(180,60,130,0.50)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
