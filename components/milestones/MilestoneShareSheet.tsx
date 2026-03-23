/**
 * MilestoneShareSheet — bottom sheet + beautiful shareable card
 * Appears after a milestone is first marked as achieved.
 * Uses react-native-view-shot to capture the card as an image,
 * then offers Share (native share sheet) and Save to Photos.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Share, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { Award, Share2, ImageDown, X, Heart, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ShareMilestoneData {
  childName:     string;   // "Sofia"
  ageMonths:     number;   // 14
  milestoneText: string;   // "Walks without support"
  stageLabel:    string;   // "Baby I" or "Toddler I"
  stageColor:    string;   // hex colour for the stage badge
  achievedDate:  string;   // "2026-03-23"
}

interface Props {
  visible:  boolean;
  data:     ShareMilestoneData | null;
  onClose:  () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function ageLabel(months: number): string {
  if (months < 1)  return 'newborn';
  if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}mo old` : `${y} year${y !== 1 ? 's' : ''} old`;
}

// ── Shareable card (captured by ViewShot) ─────────────────────────────────────
const CARD_DISPLAY_W = 300;
const CARD_DISPLAY_H = 300;

function ShareCard({ data }: { data: ShareMilestoneData }) {
  const stageBg = data.stageColor + '22'; // 13% opacity for badge bg

  return (
    <LinearGradient
      colors={['#FFE8F0', '#FFFFFF', '#FFF8E1']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={card.root}
    >
      {/* Decorative corner dots */}
      <View style={[card.dot, card.dotTL]} />
      <View style={[card.dot, card.dotBR]} />

      {/* BabyBloom PH wordmark */}
      <View style={card.brandRow}>
        <Heart size={11} color={Colors.primary} fill={Colors.primary} />
        <Text style={card.brandText}> BabyBloom PH</Text>
      </View>

      {/* Central icon: concentric rings + Award */}
      <View style={card.iconWrap}>
        <View style={[card.ring, card.ring3]} />
        <View style={[card.ring, card.ring2]} />
        <View style={card.ring1}>
          <Award size={32} color={Colors.accent} strokeWidth={1.8} />
        </View>
      </View>

      {/* Main text */}
      <Text style={card.headline}>
        <Text style={{ color: data.stageColor }}>{data.childName}</Text>
        {' just reached\na milestone!'}
      </Text>

      {/* Milestone text pill */}
      <View style={[card.pill, { backgroundColor: stageBg, borderColor: data.stageColor + '55' }]}>
        <Sparkles size={11} color={data.stageColor} strokeWidth={2} style={{ marginRight: 5 }} />
        <Text style={[card.pillText, { color: data.stageColor }]} numberOfLines={3}>
          {data.milestoneText}
        </Text>
      </View>

      {/* Date */}
      <Text style={card.dateText}>{formatDate(data.achievedDate)}</Text>

      {/* Footer rule + age */}
      <View style={card.footer}>
        <View style={card.footerLine} />
        <Text style={card.footerText}>
          {data.childName}  ·  {ageLabel(data.ageMonths)}  ·  BabyBloom PH 🇵🇭
        </Text>
      </View>
    </LinearGradient>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MilestoneShareSheet({ visible, data, onClose }: Props) {
  const cardRef  = useRef<View>(null);
  const [busy,   setBusy]   = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const capture = useCallback(async (): Promise<string | null> => {
    try {
      if (!cardRef.current) return null;
      const uri = await captureRef(cardRef, {
        format:  'jpg',
        quality: 1,
        result:  Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
      return uri;
    } catch (e) {
      console.warn('ViewShot capture failed:', e);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!data) return;
    setBusy(true);
    try {
      const uri = await capture();
      if (!uri) {
        // Fallback: share text only
        await Share.share({
          title:   `${data.childName} reached a milestone!`,
          message: `${data.childName} just achieved: "${data.milestoneText}" — logged on BabyBloom PH 🍼`,
        });
      } else if (Platform.OS === 'web') {
        // Web: open image in new tab for manual share
        const link     = document.createElement('a');
        link.href      = uri;
        link.target    = '_blank';
        link.rel       = 'noopener';
        link.click();
      } else {
        await Share.share({
          url:     uri,
          title:   `${data.childName} reached a milestone!`,
          message: `${data.childName} just achieved: "${data.milestoneText}" — logged on BabyBloom PH 🍼`,
        });
      }
    } catch (e) {
      console.warn('Share failed:', e);
    } finally {
      setBusy(false);
    }
  }, [data, capture]);

  const handleSaveToPhotos = useCallback(async () => {
    if (!data) return;
    setBusy(true);
    setStatus('idle');
    try {
      if (Platform.OS === 'web') {
        // Web: trigger download
        const uri  = await capture();
        if (uri) {
          const link     = document.createElement('a');
          link.href      = uri;
          link.download  = `babybloom-milestone-${data.childName.toLowerCase()}.jpg`;
          link.click();
          setStatus('saved');
        }
      } else {
        const { status: perm } = await MediaLibrary.requestPermissionsAsync();
        if (perm !== 'granted') { setStatus('error'); return; }
        const uri = await capture();
        if (uri) {
          await MediaLibrary.saveToLibraryAsync(uri);
          setStatus('saved');
        }
      }
    } catch (e) {
      console.warn('Save to photos failed:', e);
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }, [data, capture]);

  const handleClose = useCallback(() => {
    setStatus('idle');
    onClose();
  }, [onClose]);

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={sh.backdrop}>
        <View style={sh.sheet}>

          {/* Close button */}
          <TouchableOpacity style={sh.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <X size={18} color={Colors.textMid} strokeWidth={2} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={sh.title}>Share this moment! 🎉</Text>
          <Text style={sh.subtitle}>
            {data.childName} hit a milestone — celebrate with family!
          </Text>

          {/* Card preview (ViewShot target) */}
          <View style={sh.cardWrapper}>
            <View ref={cardRef} collapsable={false}>
              <ShareCard data={data} />
            </View>
          </View>

          {/* Status feedback */}
          {status === 'saved' && (
            <View style={sh.statusBanner}>
              <Text style={sh.statusText}>Saved to your photos!</Text>
            </View>
          )}
          {status === 'error' && (
            <View style={[sh.statusBanner, sh.statusBannerErr]}>
              <Text style={[sh.statusText, sh.statusTextErr]}>
                Permission denied. Check your settings.
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={sh.btnCol}>
            <TouchableOpacity
              style={sh.primaryBtn}
              onPress={handleShare}
              activeOpacity={0.85}
              disabled={busy}
            >
              <LinearGradient
                colors={[Colors.primary, '#C2185B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={sh.btnGradient}
              >
                {busy
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Share2 size={16} color="#fff" strokeWidth={2} style={{ marginRight: 8 }} />
                      <Text style={sh.primaryBtnText}>Share to Instagram / Facebook</Text>
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={sh.secondaryBtn}
              onPress={handleSaveToPhotos}
              activeOpacity={0.85}
              disabled={busy}
            >
              <ImageDown size={16} color={Colors.primary} strokeWidth={2} style={{ marginRight: 8 }} />
              <Text style={sh.secondaryBtnText}>Save to Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={sh.notNowBtn} onPress={handleClose} activeOpacity={0.7}>
              <Text style={sh.notNowText}>Not now</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Card styles ────────────────────────────────────────────────────────────────
const card = StyleSheet.create({
  root: {
    width:         CARD_DISPLAY_W,
    height:        CARD_DISPLAY_H,
    borderRadius:  20,
    alignItems:    'center',
    justifyContent:'center',
    padding:       20,
    overflow:      'hidden',
  },

  // Decorative corner dots
  dot:   { position: 'absolute', width: 80, height: 80, borderRadius: 40, opacity: 0.12 },
  dotTL: { top: -20, left: -20, backgroundColor: Colors.primary },
  dotBR: { bottom: -20, right: -20, backgroundColor: Colors.accent },

  // Wordmark
  brandRow: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', alignItems: 'center' },
  brandText:{ fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },

  // Icon rings
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ring:     { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  ring3:    { width: 72, height: 72, borderColor: Colors.primary + '15' },
  ring2:    { width: 56, height: 56, borderColor: Colors.primary + '25' },
  ring1:    { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.accentBg, borderWidth: 1.5, borderColor: Colors.accent + '55', alignItems: 'center', justifyContent: 'center' },

  // Headline
  headline: { fontSize: 15, fontWeight: '800', color: Colors.textDark, textAlign: 'center', lineHeight: 22, marginBottom: 10 },

  // Milestone pill
  pill:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8, maxWidth: '95%' },
  pillText: { fontSize: 12, fontWeight: '700', textAlign: 'center', flexShrink: 1 },

  // Date
  dateText: { fontSize: 10, color: Colors.textLight, marginBottom: 14 },

  // Footer
  footer:     { position: 'absolute', bottom: 14, left: 16, right: 16, alignItems: 'center' },
  footerLine: { width: '100%', height: 0.5, backgroundColor: Colors.border, marginBottom: 7 },
  footerText: { fontSize: 9, color: Colors.textLight, textAlign: 'center', letterSpacing: 0.2 },
});

// ── Sheet styles ───────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 20,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },

  title:    { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: Colors.textMid, textAlign: 'center', marginBottom: 20 },

  cardWrapper: {
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 16,
  },

  // Status
  statusBanner:    { backgroundColor: Colors.healthBg, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
  statusText:      { fontSize: 13, color: Colors.health, fontWeight: '600' },
  statusBannerErr: { backgroundColor: Colors.dangerBg },
  statusTextErr:   { color: Colors.danger },

  // Buttons
  btnCol:        { width: '100%', gap: 10 },
  primaryBtn:    { borderRadius: 14, overflow: 'hidden' },
  btnGradient:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50 },
  primaryBtnText:{ fontSize: 15, fontWeight: '700', color: '#fff' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  notNowBtn:  { alignItems: 'center', paddingVertical: 10 },
  notNowText: { fontSize: 14, color: Colors.textLight, fontWeight: '500' },
});
