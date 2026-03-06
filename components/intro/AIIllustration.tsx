/**
 * AIIllustration — Kawaii robot / AI star for the "AI Health Insights" slide
 * Cute robot with a heart screen, animated pulse + float
 */
import React, { useEffect } from 'react';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, Easing,
} from 'react-native-reanimated';

export default function AIIllustration({ size = 200 }: { size?: number }) {
  const floatY = useSharedValue(0);
  const scale  = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(  0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
    // Heart pulse on screen
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(1,    { duration: 400, easing: Easing.in(Easing.quad) }),
        withTiming(1,    { duration: 800 }),
      ),
      -1, false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[floatStyle, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">

        {/* ── Antenna ─────────────────────────────────────────────────── */}
        <Rect x="96" y="18" width="8" height="24" rx="4" fill="#C8A8F0" />
        <Circle cx="100" cy="14" r="10" fill="#9B59B6" />
        <Circle cx="100" cy="14" r="5"  fill="#E8D0FF" />

        {/* ── Robot head ──────────────────────────────────────────────── */}
        <Rect x="36" y="42" width="128" height="100" rx="28" ry="28" fill="#C8A8F0" />

        {/* ── Eyes ────────────────────────────────────────────────────── */}
        {/* Left eye socket */}
        <Rect x="52" y="60" width="38" height="30" rx="10" fill="#F0E8FF" />
        {/* Left pupil */}
        <Circle cx="71" cy="75" r="9" fill="#9B59B6" />
        <Circle cx="75" cy="71" r="3" fill="white" />
        {/* Right eye socket */}
        <Rect x="110" y="60" width="38" height="30" rx="10" fill="#F0E8FF" />
        {/* Right pupil */}
        <Circle cx="129" cy="75" r="9" fill="#9B59B6" />
        <Circle cx="133" cy="71" r="3" fill="white" />

        {/* ── Mouth / heart screen ────────────────────────────────────── */}
        <Rect x="60" y="104" width="80" height="28" rx="14" fill="#E8D0FF" />
        {/* Heart inside */}
        <Path
          d="M 100 122 C 100 117 93 117 93 123 C 93 127 100 131 100 131 C 100 131 107 127 107 123 C 107 117 100 117 100 122Z"
          fill="#E8637C"
        />

        {/* ── Cheek blush ─────────────────────────────────────────────── */}
        <Ellipse cx="48"  cy="96" rx="10" ry="6" fill="#F4A8C0" opacity={0.6} />
        <Ellipse cx="152" cy="96" rx="10" ry="6" fill="#F4A8C0" opacity={0.6} />

        {/* ── Arms ────────────────────────────────────────────────────── */}
        <Rect x="6"  y="70" width="30" height="50" rx="15" fill="#C8A8F0" />
        <Rect x="164" y="70" width="30" height="50" rx="15" fill="#C8A8F0" />
        {/* Hands */}
        <Circle cx="21"  cy="126" r="14" fill="#C8A8F0" />
        <Circle cx="179" cy="126" r="14" fill="#C8A8F0" />

        {/* ── Body ────────────────────────────────────────────────────── */}
        <Rect x="52" y="138" width="96" height="50" rx="20" fill="#C8A8F0" />
        {/* Body panel */}
        <Rect x="72" y="150" width="56" height="28" rx="10" fill="#E8D0FF" />
        {/* Panel button dots */}
        <Circle cx="85" cy="164" r="5" fill="#9B59B6" />
        <Circle cx="100" cy="164" r="5" fill="#E8637C" />
        <Circle cx="115" cy="164" r="5" fill="#88DBBA" />

        {/* ── Feet ────────────────────────────────────────────────────── */}
        <Rect x="62"  y="182" width="34" height="16" rx="8" fill="#C8A8F0" />
        <Rect x="104" y="182" width="34" height="16" rx="8" fill="#C8A8F0" />

        {/* ── Stars floating around ───────────────────────────────────── */}
        <Path d="M 24 36 l3.5 -9 3.5 9 -9.5 -6 10 0Z" fill="#FFE066" opacity={0.9} />
        <Path d="M 170 38 l3 -7 3 7 -8 -5 8 0Z"        fill="#FFE066" opacity={0.8} />
        <Path d="M 12 160 l2.5 -6 2.5 6 -6.5 -4 7 0Z" fill="#FFE066" opacity={0.7} />
        <Path d="M 182 158 l2 -5 2 5 -5.5 -3.5 6 0Z"  fill="#FFE066" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}
