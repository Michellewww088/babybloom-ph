/**
 * BearIllustration — Kawaii teddy bear SVG for the splash screen
 * Animated with react-native-reanimated: gentle float + blink
 */
import React, { useEffect } from 'react';
import Svg, {
  Circle, Ellipse, Path, G, Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

export default function BearIllustration({ size = 200 }: { size?: number }) {
  const s = size / 200; // scale factor

  const floatY  = useSharedValue(0);
  const blinkOp = useSharedValue(1);

  useEffect(() => {
    // Gentle float
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
    // Blink every ~4 s
    const doBlink = () => {
      blinkOp.value = withSequence(
        withTiming(0, { duration: 80 }),
        withTiming(1, { duration: 80 }),
      );
    };
    doBlink();
    const id = setInterval(doBlink, 4000);
    return () => clearInterval(id);
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={floatStyle}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* ── Body ────────────────────────────────────────────────────────── */}
        <Ellipse cx="100" cy="135" rx="58" ry="52" fill="#F5C994" />
        {/* Tummy */}
        <Ellipse cx="100" cy="148" rx="34" ry="27" fill="#FAE0BA" />

        {/* ── Ears ─────────────────────────────────────────────────────────*/}
        {/* Left ear */}
        <Circle cx="42" cy="62" r="28" fill="#F5C994" />
        <Circle cx="42" cy="62" r="16" fill="#F4A8C0" />
        {/* Right ear */}
        <Circle cx="158" cy="62" r="28" fill="#F5C994" />
        <Circle cx="158" cy="62" r="16" fill="#F4A8C0" />

        {/* ── Head ─────────────────────────────────────────────────────────*/}
        <Circle cx="100" cy="96" r="66" fill="#F5C994" />

        {/* ── Eyes (blink controlled via opacity) ──────────────────────── */}
        {/* Left eye */}
        <Ellipse cx="78" cy="88" rx="13" ry="14" fill="#2C1A0E" />
        <Circle  cx="83" cy="83" r="4.5"         fill="white" />
        <Circle  cx="85" cy="82" r="2"            fill="white" opacity={0.7} />
        {/* Right eye */}
        <Ellipse cx="122" cy="88" rx="13" ry="14" fill="#2C1A0E" />
        <Circle  cx="127" cy="83" r="4.5"         fill="white" />
        <Circle  cx="129" cy="82" r="2"            fill="white" opacity={0.7} />

        {/* Rosy cheeks */}
        <Ellipse cx="62"  cy="108" rx="13" ry="8" fill="#F4A8C0" opacity={0.6} />
        <Ellipse cx="138" cy="108" rx="13" ry="8" fill="#F4A8C0" opacity={0.6} />

        {/* ── Snout ────────────────────────────────────────────────────── */}
        <Ellipse cx="100" cy="113" rx="26" ry="18" fill="#FAE0BA" />
        {/* Nose */}
        <Ellipse cx="100" cy="106" rx="10" ry="7"  fill="#D47A8F" />
        {/* Mouth */}
        <Path
          d="M 90 117 Q 100 126 110 117"
          stroke="#D47A8F" strokeWidth="2.5" fill="none"
          strokeLinecap="round"
        />

        {/* ── Bow / accessory ─────────────────────────────────────────── */}
        {/* Left bow wing */}
        <Path d="M 84 36 Q 100 28 100 44 Q 84 48 84 36Z" fill="#F4A8C0" />
        {/* Right bow wing */}
        <Path d="M 116 36 Q 100 28 100 44 Q 116 48 116 36Z" fill="#F4A8C0" />
        {/* Bow center knot */}
        <Circle cx="100" cy="40" r="6" fill="#E8637C" />

        {/* ── Small stars decorating body ─────────────────────────────── */}
        <Path d="M 148 120 l3 -7 3 7 -7 -3 7 -3Z" fill="#FFE066" opacity={0.9} />
        <Path d="M 50  130 l2 -5 2 5 -5 -2 5 -2Z" fill="#FFE066" opacity={0.8} />
      </Svg>
    </Animated.View>
  );
}
