/**
 * EmptyState — reusable warm empty-state component for BabyBloom PH
 *
 * Usage:
 *   <EmptyState
 *     illustration={require('@/assets/illustrations/empty-feeding.png')}
 *     title="No feeds logged yet"
 *     message="Sofia's first feed log will appear here."
 *     ctaLabel="Log first feed"
 *     onCta={() => openSheet()}
 *   />
 *
 * While SVG illustrations are pending, pass illustration={null} to show
 * the soft-pink placeholder square automatically.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

// ─────────────────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** PNG / SVG source from require(). Pass null to show placeholder square. */
  illustration?: ImageSourcePropType | null;
  /** Accent color for the placeholder square (default: Colors.softPink) */
  illustrationColor?: string;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  illustration,
  illustrationColor = Colors.softPink,
  title,
  message,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <View style={es.container}>
      {/* Illustration or placeholder */}
      {illustration ? (
        <Image
          source={illustration}
          style={es.illustration}
          resizeMode="contain"
        />
      ) : (
        <View style={[es.placeholder, { backgroundColor: illustrationColor }]} />
      )}

      {/* Title */}
      <Text style={es.title}>{title}</Text>

      {/* Message */}
      <Text style={es.message}>{message}</Text>

      {/* CTA button */}
      {ctaLabel && onCta && (
        <TouchableOpacity
          onPress={onCta}
          activeOpacity={0.85}
          style={es.ctaWrap}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={es.cta}
          >
            <Text style={es.ctaText}>{ctaLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const es = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  illustration: {
    width: 180,
    height: 180,
  },
  /** Soft colored square shown while real SVG illustrations are pending */
  placeholder: {
    width: 180,
    height: 180,
    borderRadius: 24,
  },
  title: {
    ...Typography.headingMedium,
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: 24,
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textMid,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  ctaWrap: {
    marginTop: 24,
    width: 200,
    alignSelf: 'center',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cta: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  ctaText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    color: Colors.surface,
  },
});

export default EmptyState;
