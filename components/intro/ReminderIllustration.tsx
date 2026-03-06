/**
 * ReminderIllustration — Kawaii alarm clock for the "Smart Care Reminders" slide
 * Clock with a heart face, animated ringing bounce
 */
import React, { useEffect } from 'react';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, Easing,
} from 'react-native-reanimated';

export default function ReminderIllustration({ size = 200 }: { size?: number }) {
  const rotateZ = useSharedValue(0);
  const floatY  = useSharedValue(0);

  useEffect(() => {
    // Ringing wiggle
    rotateZ.value = withRepeat(
      withSequence(
        withTiming( 8, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming(-8, { duration: 120, easing: Easing.inOut(Easing.quad) }),
        withTiming( 6, { duration: 100 }),
        withTiming(-6, { duration: 100 }),
        withTiming( 0, { duration: 80  }),
        withTiming( 0, { duration: 1800 }), // rest
      ),
      -1, false
    );
    // Gentle float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming( 0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${rotateZ.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[animStyle, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">

        {/* ── Bell legs (feet) ─────────────────────────────────────────── */}
        <Circle cx="72"  cy="172" r="14" fill="#88DBBA" />
        <Circle cx="128" cy="172" r="14" fill="#88DBBA" />

        {/* ── Bell arms (handles) ─────────────────────────────────────── */}
        <Circle cx="36"  cy="84" r="18" fill="#88DBBA" />
        <Circle cx="164" cy="84" r="18" fill="#88DBBA" />

        {/* ── Clock body ──────────────────────────────────────────────── */}
        <Circle cx="100" cy="102" r="74" fill="#A8E6CF" />
        <Circle cx="100" cy="102" r="64" fill="#E8FAF4" />

        {/* ── Clock face details ───────────────────────────────────────── */}
        {/* 12 o'clock tick */}
        <Rect x="97" y="46" width="6" height="14" rx="3" fill="#A8E6CF" />
        {/* 3 o'clock tick */}
        <Rect x="140" y="99" width="14" height="6" rx="3" fill="#A8E6CF" />
        {/* 6 o'clock tick */}
        <Rect x="97" y="144" width="6" height="14" rx="3" fill="#A8E6CF" />
        {/* 9 o'clock tick */}
        <Rect x="46" y="99" width="14" height="6" rx="3" fill="#A8E6CF" />

        {/* ── Clock hands ─────────────────────────────────────────────── */}
        {/* Hour hand (pointing ~10) */}
        <Path d="M 100 102 L 72 72" stroke="#27AE7A" strokeWidth="5" strokeLinecap="round" />
        {/* Minute hand (pointing ~2) */}
        <Path d="M 100 102 L 128 68" stroke="#27AE7A" strokeWidth="3.5" strokeLinecap="round" />
        {/* Center dot */}
        <Circle cx="100" cy="102" r="6" fill="#27AE7A" />

        {/* ── Kawaii face on clock body ────────────────────────────────── */}
        {/* Eyes */}
        <Ellipse cx="82"  cy="116" rx="9" ry="10" fill="#2C1A0E" />
        <Circle  cx="86"  cy="112" r="3"  fill="white" />
        <Ellipse cx="118" cy="116" rx="9" ry="10" fill="#2C1A0E" />
        <Circle  cx="122" cy="112" r="3"  fill="white" />
        {/* Rosy cheeks */}
        <Ellipse cx="68"  cy="127" rx="10" ry="6" fill="#F4A8C0" opacity={0.55} />
        <Ellipse cx="132" cy="127" rx="10" ry="6" fill="#F4A8C0" opacity={0.55} />
        {/* Smile */}
        <Path
          d="M 82 135 Q 100 148 118 135"
          stroke="#27AE7A" strokeWidth="3" fill="none" strokeLinecap="round"
        />

        {/* ── Heart button on top ──────────────────────────────────────── */}
        <Path
          d="M 100 34 C 100 29 94 29 94 35 C 94 40 100 44 100 44 C 100 44 106 40 106 35 C 106 29 100 29 100 34Z"
          fill="#E8637C"
        />

        {/* ── Sparkle lines (ringing effect) ──────────────────────────── */}
        <Path d="M 26 52 L 34 60"  stroke="#FFE066" strokeWidth="3" strokeLinecap="round" opacity={0.9} />
        <Path d="M 22 65 L 32 65"  stroke="#FFE066" strokeWidth="3" strokeLinecap="round" opacity={0.7} />
        <Path d="M 174 52 L 166 60" stroke="#FFE066" strokeWidth="3" strokeLinecap="round" opacity={0.9} />
        <Path d="M 178 65 L 168 65" stroke="#FFE066" strokeWidth="3" strokeLinecap="round" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}
