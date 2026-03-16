/**
 * SkeletonCard — reusable shimmer placeholders for BabyBloom PH
 *
 * Usage:
 *   <SkeletonCard />            — generic content card placeholder
 *   <SkeletonList count={4} />  — renders N SkeletonCard items
 *   <SkeletonRow />             — single slim row (list items, vaccine rows)
 *   <SkeletonLine width="70%" height={14} /> — one bare shimmer bar
 *   <ButtonLoader />            — inline spinner replacement inside buttons
 *
 * Colors match the design system:
 *   base      → Colors.divider   (#F3F4F6)
 *   highlight → Colors.surface   (#FFFFFF)
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

// ─────────────────────────────────────────────────────────────────────────────
// Core shimmer bar — the building block for everything else
// ─────────────────────────────────────────────────────────────────────────────

interface ShimmerBarProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerBar({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: ShimmerBarProps) {
  const [containerWidth, setContainerWidth] = useState(300);
  const x = useSharedValue(-containerWidth);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  useEffect(() => {
    x.value = -containerWidth;
    x.value = withRepeat(
      withTiming(containerWidth, {
        duration: 1300,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [containerWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.divider,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animStyle]}>
        <LinearGradient
          colors={[Colors.divider, 'rgba(255,255,255,0.88)', Colors.divider]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonLine — single-line placeholder (flexible width/height)
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLine({
  width = '100%',
  height = 14,
  borderRadius = 7,
  style,
}: SkeletonLineProps) {
  return (
    <ShimmerBar
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonRow — one list-item row (icon + two lines of text + optional badge)
// Matches the shape of vaccine rows, calendar event rows, log entries
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonRow() {
  return (
    <View style={sk.rowWrap}>
      {/* left icon circle */}
      <ShimmerBar width={44} height={44} borderRadius={22} />

      {/* text block */}
      <View style={sk.rowBody}>
        <ShimmerBar width="62%" height={14} borderRadius={7} />
        <ShimmerBar width="40%" height={11} borderRadius={5} style={{ marginTop: 7 }} />
      </View>

      {/* right badge */}
      <ShimmerBar width={56} height={24} borderRadius={12} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonCard — full card placeholder (matches borderRadius-20 app cards)
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <View style={sk.card}>
      {/* header row */}
      <View style={sk.cardHeader}>
        <ShimmerBar width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ShimmerBar width="55%" height={14} borderRadius={7} />
          <ShimmerBar width="35%" height={11} borderRadius={5} style={{ marginTop: 7 }} />
        </View>
        <ShimmerBar width={60} height={24} borderRadius={12} />
      </View>

      {/* body lines */}
      <ShimmerBar width="90%" height={12} borderRadius={6} style={{ marginTop: 16 }} />
      <ShimmerBar width="75%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
      <ShimmerBar width="50%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonList — renders N skeleton rows or cards
// ─────────────────────────────────────────────────────────────────────────────

interface SkeletonListProps {
  count?: number;
  /** 'card' for card-shaped placeholders, 'row' for slim list rows */
  variant?: 'card' | 'row';
  style?: ViewStyle;
}

export function SkeletonList({
  count = 4,
  variant = 'card',
  style,
}: SkeletonListProps) {
  return (
    <View style={[sk.listWrap, style]}>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'row' ? (
          <SkeletonRow key={i} />
        ) : (
          <SkeletonCard key={i} />
        ),
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ButtonLoader — three animated dots for inside button loading states
// Replaces ActivityIndicator inside primary/secondary buttons
// ─────────────────────────────────────────────────────────────────────────────

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[sk.dot, animStyle]} />;
}

export function ButtonLoader({ color = Colors.surface }: { color?: string }) {
  return (
    <View style={sk.dotsRow}>
      <Dot delay={0} />
      <Dot delay={180} />
      <Dot delay={360} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonAIBlock — replaces inline AI-loading spinners inside content cards
// ─────────────────────────────────────────────────────────────────────────────

export function SkeletonAIBlock() {
  return (
    <View style={sk.aiBlock}>
      <ShimmerBar width="85%" height={12} borderRadius={6} />
      <ShimmerBar width="70%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
      <ShimmerBar width="50%" height={12} borderRadius={6} style={{ marginTop: 8 }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  listWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.surface,
  },
  aiBlock: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});

export default SkeletonCard;
