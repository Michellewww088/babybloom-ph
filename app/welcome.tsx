/**
 * welcome.tsx — BabyBloom PH
 * Closely matches the brand reference artwork:
 *   • Chubby 3D baby peeking from a huge fluffy cloud, brown hair tuft,
 *     tiny foot sticking out on the left, hands gripping cloud top
 *   • Bottle + pacifier + 3 gold stars orbiting on a glowing ellipse
 *   • "BabyBloom" logo in pink→purple gradient with white outline
 *   • Dreamy pink-purple sky, sparkle stars, layered foreground clouds
 *   • Baby bobs, tilts head, blinks every ~3 s
 *   • 5-second auto-navigate to Dashboard (tap to skip)
 */

import { useEffect, useState } from 'react';
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
import Svg, {
  Circle, Ellipse, Path, Rect,
  Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, G,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useChildStore, getChildDisplayName } from '../store/childStore';

const { width: W, height: H } = Dimensions.get('window');

const ORBIT_RX       = W * 0.40;
const ORBIT_RY       = W * 0.135;
const ORBIT_DURATION = 7200;

// ─── Milk Bottle ─────────────────────────────────────────────────────────────
function BottleIcon() {
  return (
    <Svg width={44} height={60} viewBox="0 0 44 60">
      <Defs>
        <RadialGradient id="bGlass" cx="35%" cy="25%" r="65%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="100%" stopColor="#D6EFFF" stopOpacity="0.88" />
        </RadialGradient>
        <RadialGradient id="bCap" cx="40%" cy="30%" r="60%">
          <Stop offset="0%"   stopColor="#FFE566" />
          <Stop offset="100%" stopColor="#F5A623" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={22} cy={58} rx={12} ry={3}  fill="rgba(0,0,0,0.10)" />
      <Path    d="M17 4 Q22 -3 27 4"            fill="#F5A623" />
      <Rect    x={13} y={3}  width={18} height={10} rx={4.5} fill="url(#bCap)" />
      <Rect    x={11} y={11} width={22} height={5}  rx={2.5} fill="#FFD166" />
      <Rect    x={5}  y={14} width={34} height={41} rx={11}  fill="url(#bGlass)" />
      <Rect    x={5}  y={28} width={34} height={27} rx={8}   fill="rgba(255,255,255,0.75)" />
      <Rect    x={9}  y={16} width={6}  height={34} rx={3}   fill="rgba(255,255,255,0.55)" />
      <Path    d="M31 32 L37 32 M31 38 L37 38 M31 44 L37 44"
        stroke="rgba(100,160,230,0.4)" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Pacifier ────────────────────────────────────────────────────────────────
function PacifierIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Defs>
        <RadialGradient id="pNip" cx="35%" cy="28%" r="65%">
          <Stop offset="0%"   stopColor="#FFE566" />
          <Stop offset="100%" stopColor="#F5A623" />
        </RadialGradient>
      </Defs>
      <Circle cx={24} cy={24} r={21} fill="none" stroke="#FF6B9D" strokeWidth={5} />
      <Circle cx={24} cy={24} r={14} fill="none" stroke="#FF99BB" strokeWidth={2} opacity={0.6} />
      <Ellipse cx={24} cy={24} rx={10} ry={8}   fill="url(#pNip)" />
      <Ellipse cx={24} cy={24} rx={6.5} ry={5}  fill="#FFD166" />
      <Circle  cx={20} cy={21} r={2.8}           fill="rgba(255,255,255,0.7)" />
    </Svg>
  );
}

// ─── Gold Star ───────────────────────────────────────────────────────────────
function StarIcon({ size = 30, color = '#FFD84A' }: { size?: number; color?: string }) {
  const h = size / 2;
  const oR = h * 0.92, iR = h * 0.40;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? oR : iR;
    const a = (i * 36 - 90) * (Math.PI / 180);
    return `${h + r * Math.cos(a)},${h + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={`M ${pts} Z`} fill="rgba(0,0,0,0.10)" transform="translate(1.5,2.5)" />
      <Path d={`M ${pts} Z`} fill={color} />
      <Path d={`M ${pts} Z`} fill="rgba(255,255,255,0.28)" />
      <Circle cx={h} cy={h * 0.72} r={h * 0.22} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

// ─── BabyBloom logo — pink + purple two-tone with white glow ─────────────────
function BabyBloomLogo() {
  const fs   = Math.round(W * 0.125); // ~47 px on 375-wide screen
  const base = {
    fontWeight:       '900' as const,
    textShadowColor:  'rgba(255,255,255,0.90)',
    textShadowOffset: { width: 0, height: 0 } as const,
    textShadowRadius: 10,
    letterSpacing:    0.5,
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[base, { fontSize: fs, color: '#FF6BB8' }]}>Baby</Text>
      <Text style={[base, { fontSize: fs, color: '#BB44FF' }]}>Bloom</Text>
    </View>
  );
}

// ─── Baby + huge fluffy cloud ─────────────────────────────────────────────────
function BabyOnCloud({ isBlinking }: { isBlinking: boolean }) {
  return (
    <Svg width={W * 0.92} height={260} viewBox="0 0 320 260">
      <Defs>
        <RadialGradient id="skin" cx="36%" cy="28%" r="70%">
          <Stop offset="0%"   stopColor="#FFF4E0" />
          <Stop offset="52%"  stopColor="#FFCF96" />
          <Stop offset="100%" stopColor="#F09555" />
        </RadialGradient>
        <RadialGradient id="skinD" cx="38%" cy="32%" r="62%">
          <Stop offset="0%"   stopColor="#FFD4A0" />
          <Stop offset="100%" stopColor="#E8875A" />
        </RadialGradient>
        <RadialGradient id="eye" cx="28%" cy="22%" r="72%">
          <Stop offset="0%"   stopColor="#7A4A28" />
          <Stop offset="58%"  stopColor="#3D1E0A" />
          <Stop offset="100%" stopColor="#190904" />
        </RadialGradient>
        <RadialGradient id="cloudT" cx="44%" cy="14%" r="66%">
          <Stop offset="0%"   stopColor="#FFFFFF" />
          <Stop offset="68%"  stopColor="#FDF4FF" />
          <Stop offset="100%" stopColor="#EED8FC" />
        </RadialGradient>
        <RadialGradient id="cloudB" cx="50%" cy="88%" r="55%">
          <Stop offset="0%"   stopColor="#F8EEFF" />
          <Stop offset="100%" stopColor="#E4C4F4" />
        </RadialGradient>
        <RadialGradient id="hair" cx="40%" cy="20%" r="66%">
          <Stop offset="0%"   stopColor="#B46830" />
          <Stop offset="100%" stopColor="#6B3A18" />
        </RadialGradient>
      </Defs>

      {/* ── HUGE FLUFFY CLOUD ── */}
      {/* cast shadow */}
      <Ellipse cx={160} cy={256} rx={134} ry={9} fill="rgba(155,80,200,0.14)" />
      {/* base fill */}
      <Rect x={16} y={210} width={288} height={46} rx={23} fill="url(#cloudB)" />
      {/* back puff row — slightly tinted */}
      <Circle cx={68}  cy={210} r={34}  fill="#F2E6FF" />
      <Circle cx={130} cy={200} r={42}  fill="#F2E6FF" />
      <Circle cx={198} cy={200} r={42}  fill="#F2E6FF" />
      <Circle cx={258} cy={210} r={34}  fill="#F2E6FF" />
      {/* main front puff row — bright white */}
      <Circle cx={38}  cy={222} r={36}  fill="url(#cloudT)" />
      <Circle cx={84}  cy={206} r={48}  fill="url(#cloudT)" />
      <Circle cx={136} cy={196} r={58}  fill="url(#cloudT)" />
      <Circle cx={190} cy={200} r={54}  fill="url(#cloudT)" />
      <Circle cx={240} cy={212} r={46}  fill="url(#cloudT)" />
      <Circle cx={282} cy={222} r={36}  fill="url(#cloudT)" />
      {/* gap filler */}
      <Rect x={16} y={220} width={288} height={36} fill="url(#cloudT)" />
      {/* bottom shadow rim */}
      <Ellipse cx={160} cy={254} rx={132} ry={6} fill="rgba(195,140,230,0.18)" />

      {/* ── BODY (just shoulders) ── */}
      <Ellipse cx={78}  cy={178} rx={42} ry={32} fill="url(#skin)" />
      <Ellipse cx={242} cy={178} rx={42} ry={32} fill="url(#skin)" />
      <Rect    x={78}   y={158}  width={164} height={42} fill="url(#skin)" />

      {/* ── LEFT ARM + HAND (gripping cloud) ── */}
      <Path d="M68 178 Q46 194 34 206 Q38 218 52 218 Q62 211 72 201 Q80 206 90 206"
        fill="url(#skin)" />
      <Circle cx={40}  cy={212} r={19}  fill="url(#skinD)" />
      <Circle cx={40}  cy={212} r={13}  fill="url(#skin)" />
      <Circle cx={27}  cy={204} r={8}   fill="url(#skin)" />
      <Circle cx={34}  cy={200} r={8}   fill="url(#skin)" />
      <Circle cx={42}  cy={198} r={8}   fill="url(#skin)" />
      <Circle cx={50}  cy={200} r={8}   fill="url(#skin)" />

      {/* ── RIGHT ARM + HAND ── */}
      <Path d="M252 178 Q274 194 286 206 Q282 218 268 218 Q258 211 248 201 Q240 206 230 206"
        fill="url(#skin)" />
      <Circle cx={280} cy={212} r={19}  fill="url(#skinD)" />
      <Circle cx={280} cy={212} r={13}  fill="url(#skin)" />
      <Circle cx={293} cy={204} r={8}   fill="url(#skin)" />
      <Circle cx={286} cy={200} r={8}   fill="url(#skin)" />
      <Circle cx={278} cy={198} r={8}   fill="url(#skin)" />
      <Circle cx={270} cy={200} r={8}   fill="url(#skin)" />

      {/* ── LITTLE FOOT peeking left (matches reference) ── */}
      <Ellipse cx={22}  cy={232} rx={20} ry={15} fill="url(#skin)" />
      <Circle  cx={8}   cy={226} r={6.5} fill="url(#skin)" />
      <Circle  cx={15}  cy={221} r={6.5} fill="url(#skin)" />
      <Circle  cx={23}  cy={219} r={6.5} fill="url(#skin)" />
      <Circle  cx={32}  cy={221} r={6}   fill="url(#skin)" />

      {/* ── HEAD ── */}
      <Rect   x={136} y={105} width={48} height={46} rx={13} fill="url(#skin)" />
      <Circle cx={160} cy={92} r={90}  fill="url(#skin)" />
      {/* ears */}
      <Circle cx={70}  cy={102} r={24} fill="url(#skinD)" />
      <Circle cx={70}  cy={102} r={16} fill="url(#skin)" />
      <Circle cx={250} cy={102} r={24} fill="url(#skinD)" />
      <Circle cx={250} cy={102} r={16} fill="url(#skin)" />

      {/* ── HAIR — brown tuft sweeping up (matches reference) ── */}
      <Path d="M112 24 Q136 2 160 6 Q184 2 208 24 Q192 12 160 14 Q128 12 112 24Z"
        fill="url(#hair)" />
      <Path d="M112 24 Q128 -2 160 4 Q192 -2 208 24"
        stroke="#7B4222" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M122 18 Q138 -4 160 2 Q182 -4 198 18"
        stroke="#8B5030" strokeWidth={5} fill="none" strokeLinecap="round" />
      {/* swoop tuft */}
      <Path d="M152 6 Q160 -12 172 -6 Q178 -2 170 6"
        fill="url(#hair)" />
      {/* hair shine */}
      <Path d="M142 10 Q158 3 174 9"
        stroke="rgba(200,140,80,0.5)" strokeWidth={3.5} fill="none" strokeLinecap="round" />

      {/* ── EYEBROWS — ultra thin, high, gentle ── */}
      <Path d="M100 50 Q122 39 142 46"
        stroke="#7B4222" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M178 46 Q198 39 220 50"
        stroke="#7B4222" strokeWidth={2.5} fill="none" strokeLinecap="round" />

      {/* ── EYES ── */}
      {isBlinking ? (
        <G>
          {/* closed eyes with lashes */}
          <Path d="M96 96 Q126 80 154 96"
            stroke="#3D1A08" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M103 91 L101 84  M113 88 L113 81  M124 89 L126 82"
            stroke="#3D1A08" strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M166 96 Q194 80 224 96"
            stroke="#3D1A08" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Path d="M196 89 L194 82  M207 88 L209 81  M218 91 L220 84"
            stroke="#3D1A08" strokeWidth={2.2} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          {/* LEFT eye */}
          <Ellipse cx={125} cy={97}  rx={31} ry={33} fill="white" />
          <Circle  cx={127} cy={99}  r={25}           fill="url(#eye)" />
          <Circle  cx={128} cy={100} r={16}           fill="#120604" />
          {/* big anime sparkle highlight */}
          <Circle  cx={116} cy={88}  r={11}           fill="white" />
          <Circle  cx={136} cy={108} r={4}            fill="rgba(255,255,255,0.6)" />
          <Path d="M96 83 L100 74  M108 80 L110 71  M120 78 L120 68"
            stroke="#3D1A08" strokeWidth={2.5} strokeLinecap="round" />
          {/* RIGHT eye */}
          <Ellipse cx={195} cy={97}  rx={31} ry={33} fill="white" />
          <Circle  cx={193} cy={99}  r={25}           fill="url(#eye)" />
          <Circle  cx={192} cy={100} r={16}           fill="#120604" />
          <Circle  cx={184} cy={88}  r={11}           fill="white" />
          <Circle  cx={184} cy={108} r={4}            fill="rgba(255,255,255,0.6)" />
          <Path d="M224 83 L220 74  M212 80 L210 71  M200 78 L200 68"
            stroke="#3D1A08" strokeWidth={2.5} strokeLinecap="round" />
        </G>
      )}

      {/* ── NOSE — two tiny dots ── */}
      <Circle cx={153} cy={122} r={3.5} fill="#E08A50" opacity={0.65} />
      <Circle cx={167} cy={122} r={3.5} fill="#E08A50" opacity={0.65} />

      {/* ── PACIFIER — yellow, matches reference ── */}
      <Circle  cx={160} cy={146} r={26} fill="none" stroke="#FFBD30" strokeWidth={6.5} />
      <Circle  cx={160} cy={146} r={17} fill="none" stroke="#FFE080" strokeWidth={2.5} opacity={0.65} />
      <Ellipse cx={160} cy={137} rx={15} ry={13}   fill="#FFD84A" />
      <Ellipse cx={160} cy={137} rx={10} ry={8}    fill="#F5A820" />
      <Circle  cx={154} cy={132} r={4.5}           fill="rgba(255,255,255,0.65)" />

      {/* ── ROSY CHEEKS ── */}
      <Circle cx={86}  cy={116} r={34} fill="#FFB3C6" opacity={0.30} />
      <Circle cx={234} cy={116} r={34} fill="#FFB3C6" opacity={0.30} />
      <Circle cx={82}  cy={108} r={12} fill="rgba(255,210,228,0.22)" />
      <Circle cx={238} cy={108} r={12} fill="rgba(255,210,228,0.22)" />

    </Svg>
  );
}

// ─── Fluffy background / foreground cloud ─────────────────────────────────────
function CloudShape({ w = 180, h = 78, tint = '#F8E8FF', opacity = 0.85 }: {
  w?: number; h?: number; tint?: string; opacity?: number;
}) {
  const r  = h * 0.5;
  const id = `cg_${w}_${h}`;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="14%" r="66%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={String(opacity)} />
          <Stop offset="100%" stopColor={tint}    stopOpacity={String(opacity * 0.80)} />
        </RadialGradient>
      </Defs>
      <Circle cx={r * 0.68}  cy={h * 0.56} r={r * 0.72} fill={`url(#${id})`} />
      <Circle cx={r * 1.52}  cy={h * 0.40} r={r * 0.90} fill={`url(#${id})`} />
      <Circle cx={r * 2.52}  cy={h * 0.48} r={r * 0.82} fill={`url(#${id})`} />
      <Circle cx={r * 3.28}  cy={h * 0.56} r={r * 0.66} fill={`url(#${id})`} />
      <Rect   x={r * 0.14}   y={h * 0.55}  width={w - r * 0.28} height={h * 0.45} rx={r * 0.28}
        fill={`url(#${id})`} />
    </Svg>
  );
}

// ─── Orbit item ───────────────────────────────────────────────────────────────
function OrbitItem({
  orbitAngle, phaseOffset, children, itemSize,
}: {
  orbitAngle: ReturnType<typeof useSharedValue<number>>;
  phaseOffset: number;
  children: React.ReactNode;
  itemSize: number;
}) {
  const aStyle = useAnimatedStyle(() => {
    'worklet';
    const rad = ((orbitAngle.value + phaseOffset) * Math.PI) / 180;
    const tx  = ORBIT_RX * Math.cos(rad);
    const ty  = ORBIT_RY * Math.sin(rad);
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
      opacity: ty > 0 ? 0.50 : 1,
      zIndex:  ty > 0 ? 0 : 3,
    };
  });
  return (
    <Animated.View style={[{
      position: 'absolute',
      width: itemSize, height: itemSize,
      marginLeft: -itemSize / 2, marginTop: -itemSize / 2,
      alignItems: 'center', justifyContent: 'center',
    }, aStyle]}>
      {children}
    </Animated.View>
  );
}

// ─── Twinkling sparkle ────────────────────────────────────────────────────────
function SparkleAt({ x, y, size, delay, color = '#FFD84A' }: {
  x: number; y: number; size: number; delay: number; color?: string;
}) {
  const sc = useSharedValue(0.5);
  const op = useSharedValue(0.3);
  useEffect(() => {
    sc.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1,   { duration: 700, easing: Easing.out(Easing.ease) }),
      withTiming(0.5, { duration: 700, easing: Easing.in(Easing.ease) }),
    ), -1));
    op.value = withDelay(delay, withRepeat(withSequence(
      withTiming(1,   { duration: 700 }),
      withTiming(0.3, { duration: 700 }),
    ), -1));
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: sc.value }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, aStyle]}>
      <StarIcon size={size} color={color} />
    </Animated.View>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const name            = activeChild ? getChildDisplayName(activeChild) : 'Baby';

  const [isBlinking, setIsBlinking] = useState(false);

  const orbitAngle  = useSharedValue(0);
  const babyY       = useSharedValue(0);
  const babyS       = useSharedValue(0.75);
  const headTilt    = useSharedValue(0);
  const cloud1X     = useSharedValue(0);
  const cloud2X     = useSharedValue(0);
  const cloud3X     = useSharedValue(0);
  const logoOp      = useSharedValue(0);
  const logoSc      = useSharedValue(0.82);
  const titleOp     = useSharedValue(0);
  const titleY      = useSharedValue(26);

  useEffect(() => {
    // Orbit
    orbitAngle.value = withRepeat(
      withTiming(360, { duration: ORBIT_DURATION, easing: Easing.linear }), -1,
    );
    // Baby spring-in + bob
    babyS.value = withSpring(1, { damping: 7, stiffness: 70 });
    babyY.value = withDelay(600, withRepeat(withSequence(
      withTiming(-14, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      withTiming(  0, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
    ), -1, true));
    // Head tilt
    headTilt.value = withRepeat(withSequence(
      withTiming( 3.5, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      withTiming(-3.5, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    // Cloud drifts
    cloud1X.value = withRepeat(withSequence(
      withTiming( 20, { duration: 4800, easing: Easing.inOut(Easing.ease) }),
      withTiming(-20, { duration: 4800, easing: Easing.inOut(Easing.ease) }),
    ), -1, true);
    cloud2X.value = withDelay(1100, withRepeat(withSequence(
      withTiming(-25, { duration: 5600, easing: Easing.inOut(Easing.ease) }),
      withTiming( 25, { duration: 5600, easing: Easing.inOut(Easing.ease) }),
    ), -1, true));
    cloud3X.value = withDelay(600, withRepeat(withSequence(
      withTiming( 16, { duration: 6400, easing: Easing.inOut(Easing.ease) }),
      withTiming(-16, { duration: 6400, easing: Easing.inOut(Easing.ease) }),
    ), -1, true));
    // Logo pop-in
    logoOp.value = withDelay(250, withTiming(1, { duration: 650 }));
    logoSc.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 90 }));
    // Title slide-up
    titleOp.value = withDelay(600, withTiming(1, { duration: 650 }));
    titleY.value  = withDelay(600, withSpring(0, { damping: 12, stiffness: 80 }));
    // Blink every ~3.2 s
    const doBlink = () => { setIsBlinking(true); setTimeout(() => setIsBlinking(false), 160); };
    const blinkTimer = setInterval(doBlink, 3200);
    // 5-second auto-navigate
    const navTimer = setTimeout(() => router.replace('/(tabs)'), 5000);
    return () => { clearInterval(blinkTimer); clearTimeout(navTimer); };
  }, []);

  const babyStyle  = useAnimatedStyle(() => ({
    transform: [
      { scale:      babyS.value },
      { translateY: babyY.value },
      { rotate:     `${headTilt.value}deg` },
    ],
  }));
  const c1Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloud1X.value }] }));
  const c2Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloud2X.value }] }));
  const c3Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloud3X.value }] }));
  const logoStyle  = useAnimatedStyle(() => ({
    opacity: logoOp.value, transform: [{ scale: logoSc.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOp.value, transform: [{ translateY: titleY.value }],
  }));

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => router.replace('/(tabs)')}>
      <LinearGradient
        colors={['#FFAED8', '#E880D4', '#C464CE', '#9040BC']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={st.screen}
      >
        {/* ── Sparkle stars scattered across sky ── */}
        <SparkleAt x={W*0.06} y={H*0.05} size={20} delay={0}    color="#FFE580" />
        <SparkleAt x={W*0.80} y={H*0.04} size={24} delay={280}  color="#FFD060" />
        <SparkleAt x={W*0.14} y={H*0.29} size={15} delay={560}  color="#FFB8CC" />
        <SparkleAt x={W*0.86} y={H*0.26} size={17} delay={840}  color="#FFE580" />
        <SparkleAt x={W*0.04} y={H*0.69} size={14} delay={420}  color="#FFD060" />
        <SparkleAt x={W*0.90} y={H*0.65} size={16} delay={700}  color="#FFB8CC" />
        <SparkleAt x={W*0.50} y={H*0.03} size={13} delay={920}  color="#FFE580" />
        <SparkleAt x={W*0.34} y={H*0.08} size={11} delay={160}  color="#FFFFFF" />
        <SparkleAt x={W*0.66} y={H*0.09} size={12} delay={480}  color="#FFFFFF" />

        {/* ── Background clouds (behind baby) ── */}
        <Animated.View style={[st.bgC1, c1Style]}>
          <CloudShape w={210} h={88}  opacity={0.52} tint="#F8E4FF" />
        </Animated.View>
        <Animated.View style={[st.bgC2, c2Style]}>
          <CloudShape w={145} h={60}  opacity={0.46} tint="#FFE4F8" />
        </Animated.View>
        <Animated.View style={[st.bgC3, c3Style]}>
          <CloudShape w={170} h={70}  opacity={0.48} tint="#F4E0FF" />
        </Animated.View>

        {/* ── Center scene: orbit ellipse + items + baby ── */}
        <View style={st.scene}>
          {/* Glowing orbit ring */}
          <Svg
            width={ORBIT_RX * 2 + 48}
            height={ORBIT_RY * 2 + 48}
            style={st.orbitRing}
            viewBox={`0 0 ${ORBIT_RX * 2 + 48} ${ORBIT_RY * 2 + 48}`}
          >
            {/* outer glow */}
            <Ellipse
              cx={ORBIT_RX + 24} cy={ORBIT_RY + 24}
              rx={ORBIT_RX + 8}  ry={ORBIT_RY + 8}
              fill="none"
              stroke="rgba(255,200,240,0.16)"
              strokeWidth={10}
            />
            {/* dashed ring */}
            <Ellipse
              cx={ORBIT_RX + 24} cy={ORBIT_RY + 24}
              rx={ORBIT_RX}      ry={ORBIT_RY}
              fill="none"
              stroke="rgba(255,220,255,0.38)"
              strokeWidth={2.5}
              strokeDasharray="10,7"
            />
          </Svg>

          {/* Orbit items */}
          <OrbitItem orbitAngle={orbitAngle} phaseOffset={0}   itemSize={52}><BottleIcon /></OrbitItem>
          <OrbitItem orbitAngle={orbitAngle} phaseOffset={72}  itemSize={36}><StarIcon size={36} color="#FFD84A" /></OrbitItem>
          <OrbitItem orbitAngle={orbitAngle} phaseOffset={144} itemSize={52}><PacifierIcon /></OrbitItem>
          <OrbitItem orbitAngle={orbitAngle} phaseOffset={216} itemSize={30}><StarIcon size={30} color="#FFE880" /></OrbitItem>
          <OrbitItem orbitAngle={orbitAngle} phaseOffset={288} itemSize={34}><StarIcon size={34} color="#F5C842" /></OrbitItem>

          {/* Baby */}
          <Animated.View style={[st.babyWrap, babyStyle]}>
            <BabyOnCloud isBlinking={isBlinking} />
          </Animated.View>
        </View>

        {/* ── Foreground clouds — rendered after scene so they appear in front ── */}
        <View style={st.frontClouds} pointerEvents="none">
          <Animated.View style={[{ marginLeft: -45 }, c2Style]}>
            <CloudShape w={250} h={112} opacity={0.94} tint="#EDD8F8" />
          </Animated.View>
          <Animated.View style={[{ marginRight: -45 }, c1Style]}>
            <CloudShape w={220} h={98}  opacity={0.90} tint="#F4E4FF" />
          </Animated.View>
        </View>

        {/* ── BabyBloom logo ── */}
        <View style={st.logoWrap}>
          <BabyBloomLogo />
        </View>

        {/* ── Title text ── */}
        <Animated.View style={[st.titleWrap, titleStyle]}>
          <Text style={st.welcomeTxt}>{t('welcome.title', { name })}</Text>
          <Text style={st.subtitleTxt}>{t('welcome.subtitle', 'Your Parenting Companion')}</Text>
          <Text style={st.hintTxt}>{t('welcome.skip', 'Tap anywhere to continue →')}</Text>
        </Animated.View>

      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: {
    flex:           1,
    alignItems:     'center',
    overflow:       'hidden',
  },

  // bg clouds
  bgC1: { position: 'absolute', top: H * 0.05, left: -28 },
  bgC2: { position: 'absolute', top: H * 0.12, right: -16 },
  bgC3: { position: 'absolute', top: H * 0.19, left: W * 0.24 },

  // center scene
  scene: {
    marginTop:      H * 0.06,
    width:          W,
    height:         H * 0.47,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  orbitRing: { position: 'absolute' },
  babyWrap:  { alignItems: 'center', justifyContent: 'center' },

  // front clouds (absolutely positioned so scene content shows through)
  frontClouds: {
    position:       'absolute',
    top:            H * 0.68,
    width:          W,
    flexDirection:  'row',
    justifyContent: 'space-between',
  },

  // logo
  logoWrap: {
    alignItems:  'center',
    marginTop:   -14,
  },

  // title text
  titleWrap: {
    alignItems:        'center',
    paddingHorizontal: 28,
    marginTop:         4,
  },
  welcomeTxt: {
    fontSize:         22,
    fontWeight:       '700',
    color:            '#FFFFFF',
    textAlign:        'center',
    marginBottom:     4,
    textShadowColor:  'rgba(100,20,140,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitleTxt: {
    fontSize:         15,
    fontWeight:       '500',
    color:            'rgba(255,255,255,0.88)',
    textAlign:        'center',
    marginBottom:     10,
    textShadowColor:  'rgba(80,0,100,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  hintTxt: {
    fontSize:      12,
    color:         'rgba(255,255,255,0.60)',
    fontWeight:    '500',
    letterSpacing: 0.3,
  },
});
