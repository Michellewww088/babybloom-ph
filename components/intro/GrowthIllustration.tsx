/**
 * GrowthIllustration — Cute kawaii growth chart for the "Track Baby Growth" slide
 * Three happy rounded bars (pink · lavender · mint) with tiny faces
 */
import React, { useEffect } from 'react';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

export default function GrowthIllustration({ size = 200 }: { size?: number }) {
  const bar1Y = useSharedValue(0);
  const bar2Y = useSharedValue(0);
  const bar3Y = useSharedValue(0);

  useEffect(() => {
    const bounce = (v: typeof bar1Y, delay: number) => {
      v.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(-8, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,  { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true
      ));
    };
    bounce(bar1Y, 0);
    bounce(bar2Y, 300);
    bounce(bar3Y, 600);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: bar1Y.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: bar2Y.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: bar3Y.value }] }));

  const AnimBar = ({ style, x, y, w, h, color, faceY }: {
    style: any; x: number; y: number; w: number; h: number; color: string; faceY: number;
  }) => (
    <Animated.View style={style}>
      <Svg width={w + 20} height={h + 40} style={{ overflow: 'visible' }}>
        {/* Bar body */}
        <Rect x="10" y="20" width={w} height={h} rx={w / 2} ry={w / 2} fill={color} />
        {/* Cute face on top */}
        <Circle cx={10 + w / 2} cy="14" r="12" fill={color} />
        {/* Eyes */}
        <Circle cx={10 + w / 2 - 4} cy="13" r="2" fill="#3D2B1A" />
        <Circle cx={10 + w / 2 + 4} cy="13" r="2" fill="#3D2B1A" />
        {/* Smile */}
        <Path
          d={`M ${10 + w / 2 - 4} 18 Q ${10 + w / 2} 22 ${10 + w / 2 + 4} 18`}
          stroke="#3D2B1A" strokeWidth="1.5" fill="none" strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Ground line */}
      <Path d="M 20 178 Q 100 175 180 178" stroke="#F4A8C0" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Bar 1 (short · pink) */}
      <G>
        <Rect x="28" y="130" width="38" height="48" rx="19" ry="19" fill="#F4A8C0" />
        {/* Face */}
        <Circle cx="47" cy="122" r="14" fill="#F4A8C0" />
        <Circle cx="42" cy="120" r="2.5" fill="#2C1A0E" />
        <Circle cx="52" cy="120" r="2.5" fill="#2C1A0E" />
        <Circle cx="43" cy="119" r="1" fill="white" />
        <Circle cx="53" cy="119" r="1" fill="white" />
        <Path d="M 42 126 Q 47 130 52 126" stroke="#E8637C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </G>

      {/* Bar 2 (medium · lavender) */}
      <G>
        <Rect x="81" y="100" width="38" height="78" rx="19" ry="19" fill="#C8A8F0" />
        <Circle cx="100" cy="91" r="14" fill="#C8A8F0" />
        <Circle cx="95"  cy="89" r="2.5" fill="#2C1A0E" />
        <Circle cx="105" cy="89" r="2.5" fill="#2C1A0E" />
        <Circle cx="96"  cy="88" r="1"   fill="white" />
        <Circle cx="106" cy="88" r="1"   fill="white" />
        <Path d="M 95 95 Q 100 99 105 95" stroke="#9B59B6" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </G>

      {/* Bar 3 (tall · mint) */}
      <G>
        <Rect x="134" y="70" width="38" height="108" rx="19" ry="19" fill="#88DBBA" />
        <Circle cx="153" cy="61" r="14" fill="#88DBBA" />
        <Circle cx="148" cy="59" r="2.5" fill="#2C1A0E" />
        <Circle cx="158" cy="59" r="2.5" fill="#2C1A0E" />
        <Circle cx="149" cy="58" r="1"   fill="white" />
        <Circle cx="159" cy="58" r="1"   fill="white" />
        <Path d="M 148 65 Q 153 69 158 65" stroke="#27AE7A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Star above tallest bar */}
        <Path d="M 153 36 l3 -8 3 8 -8.5 -5 9.5 0Z" fill="#FFE066" />
      </G>

      {/* Small hearts floating */}
      <Path d="M 62 60 C 62 56 56 56 56 62 C 56 66 62 70 62 70 C 62 70 68 66 68 62 C 68 56 62 56 62 60Z"
        fill="#F4A8C0" opacity={0.7} />
      <Path d="M 25 100 C 25 97 21 97 21 101 C 21 104 25 107 25 107 C 25 107 29 104 29 101 C 29 97 25 97 25 100Z"
        fill="#C8A8F0" opacity={0.6} />
    </Svg>
  );
}
