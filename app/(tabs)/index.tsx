/**
 * index.tsx — Dashboard / Home Screen
 * Per docs/03-dashboard.md + CLAUDE.md Design System
 * Kawaii SVG icon redesign — beautiful gradient cards, no plain emoji icons
 *
 * Layout (top to bottom):
 *  1. TopNavBar  — child switcher LEFT · name+age CENTER · AI+bell RIGHT
 *  2. ChildSwitcher row (only if 2+ children)
 *  3. ScrollView (pull-to-refresh)
 *     a. Hero Banner (gradient + KawaiiBaby)
 *     b. Quick Stats Strip  — 4 horizontal chips with SVG icons
 *     c. Growth Snapshot Card
 *     d. Feature Icon Grid  — 6 items (2 cols × 3 rows) gradient + kawaii SVG
 *     e. Insights Card      — weekly summary
 *  OR empty state when no child profile exists
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image,
  StyleSheet, Dimensions, RefreshControl, Modal,
  TextInput, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Line, Polyline, Rect,
  Defs, LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import ChildSwitcher from '../../components/ChildSwitcher';
import {
  useChildStore, Child,
  getChildDisplayName, getChildAgeVerbose,
} from '../../store/childStore';
import {
  useFeedingStore,
  getLastFeed, getTodayEntries, timeAgoShort,
} from '../../store/feedingStore';
import {
  useSleepStore,
  formatSleepDuration,
} from '../../store/sleepStore';
import { useGrowthStore } from '../../store/growthStore';
import {
  getWHOPercentile,
  getCorrectedAgeMonths,
} from '../../lib/who-growth';
import { AteAIButton, AteAIChat, AteAISummaryCard } from '../../components/ai/AteAI';

const { width: W } = Dimensions.get('window');
const PAD      = 16;
const CARD_W   = W - PAD * 2;
const FEAT_GAP = 12;
const FEAT_W   = (CARD_W - FEAT_GAP) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Kawaii Baby Illustration
// ─────────────────────────────────────────────────────────────────────────────
function KawaiiBaby({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGrad id="kbBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD6E8" />
          <Stop offset="1" stopColor="#FFB6C8" />
        </SvgGrad>
      </Defs>
      <Ellipse cx="50" cy="76" rx="26" ry="20" fill="url(#kbBody)" />
      <Path d="M28 72 Q38 88 50 90 Q62 88 72 72 Q62 68 50 70 Q38 68 28 72Z" fill="#FFB6C8" />
      <Ellipse cx="22" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(-15,22,72)" />
      <Ellipse cx="78" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(15,78,72)" />
      <Circle cx="50" cy="40" r="24" fill="#FFECD5" />
      <Path d="M28 33 Q50 14 72 33 Q65 18 50 16 Q35 18 28 33Z" fill="#8B5E3C" />
      <Circle cx="50" cy="19" r="5.5" fill="#8B5E3C" />
      <Circle cx="26" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="74" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="26" cy="40" r="4"   fill="#FFB3A0" />
      <Circle cx="74" cy="40" r="4"   fill="#FFB3A0" />
      <Path d="M36 39 Q40 35 44 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M56 39 Q60 35 64 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Ellipse cx="35" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      <Ellipse cx="65" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      <Path d="M40 51 Q50 58 60 51" stroke="#E87090" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M38 23 Q50 18 62 23 Q50 28 38 23Z" fill="#FF8FAB" />
      <Circle cx="50" cy="23" r="3" fill="#FF6B8A" />
      <Circle cx="76" cy="27" r="3.5" fill="#FFD700" />
      <Circle cx="71" cy="25" r="3"   fill="#FFB3C8" />
      <Circle cx="81" cy="25" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="20" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="32" r="3"   fill="#FFB3C8" />
      <Circle cx="76" cy="27" r="2"   fill="white" opacity="0.7" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kawaii SVG Feature Icons
// ─────────────────────────────────────────────────────────────────────────────

function IconBottle({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iBottle" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFB6C8" />
          <Stop offset="1" stopColor="#E63B6F" />
        </SvgGrad>
      </Defs>
      {/* Bottle body */}
      <Rect x="14" y="18" width="20" height="24" rx="8" fill="url(#iBottle)" />
      {/* Milk highlight */}
      <Rect x="15" y="28" width="18" height="13" rx="6" fill="#fff" opacity="0.22" />
      {/* Nipple base */}
      <Rect x="18" y="11" width="12" height="8" rx="4" fill="#FFD6E8" />
      {/* Nipple tip */}
      <Rect x="20" y="7" width="8" height="5" rx="3" fill="#FF8FAB" />
      {/* Cap ring */}
      <Rect x="13" y="17" width="22" height="4" rx="2" fill="#FF6B8A" />
      {/* Measurement lines */}
      <Line x1="16" y1="29" x2="21" y2="29" stroke="#fff" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      <Line x1="16" y1="33" x2="21" y2="33" stroke="#fff" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      <Line x1="16" y1="37" x2="21" y2="37" stroke="#fff" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
      {/* Heart sparkle */}
      <Path d="M28 25 C28 24 30 24 30 25.5 C30 24 32 24 32 25 C32 26.5 30 28 30 28 C30 28 28 26.5 28 25Z" fill="#fff" opacity="0.7" />
    </Svg>
  );
}

function IconMoon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iMoon" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C4B5FD" />
          <Stop offset="1" stopColor="#7C3AED" />
        </SvgGrad>
      </Defs>
      {/* Moon crescent */}
      <Path d="M26 8 C16 8 9 16 9 25 C9 33 15 40 25 40 C33 40 39 34 40 27 C36 29 30 27 27 22 C23 18 22 12 26 8Z" fill="url(#iMoon)" />
      {/* Stars */}
      <Circle cx="37" cy="11" r="2.5" fill="#FDE68A" />
      <Circle cx="42" cy="19" r="1.5" fill="#FDE68A" />
      <Circle cx="34" cy="7"  r="1.5" fill="#FDE68A" />
      {/* Kawaii eyes */}
      <Path d="M18 24 Q20 22 22 24" stroke="#4C1D95" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M26 26 Q28 24 30 26" stroke="#4C1D95" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M19 31 Q24 35 30 31" stroke="#4C1D95" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="18" cy="29" rx="3" ry="2" fill="#FF9CC0" opacity="0.45" />
      <Ellipse cx="31" cy="29" rx="3" ry="2" fill="#FF9CC0" opacity="0.45" />
    </Svg>
  );
}

function IconSyringe({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iSyr" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#93C5FD" />
          <Stop offset="1" stopColor="#1A73C8" />
        </SvgGrad>
      </Defs>
      {/* Barrel */}
      <Rect x="10" y="19" width="28" height="10" rx="5" fill="url(#iSyr)" />
      {/* Plunger handle */}
      <Rect x="37" y="21" width="7" height="6" rx="2" fill="#93C5FD" />
      <Rect x="42" y="20" width="3" height="8" rx="1.5" fill="#60A5FA" />
      {/* Needle */}
      <Path d="M10 22.5 L4 24 L10 25.5Z" fill="#BFDBFE" />
      {/* Liquid fill */}
      <Rect x="12" y="21" width="14" height="6" rx="3" fill="#BFDBFE" opacity="0.5" />
      {/* Tick marks */}
      <Line x1="22" y1="19" x2="22" y2="17" stroke="#fff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <Line x1="27" y1="19" x2="27" y2="17" stroke="#fff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      {/* Heart accent top */}
      <Path d="M23 11 C23 9 26 9 26 11.5 C26 9 29 9 29 11 C29 14 26 17 26 17 C26 17 23 14 23 11Z" fill="#E63B6F" />
    </Svg>
  );
}

function IconPills({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iPill1" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6EE7B7" />
          <Stop offset="1" stopColor="#27AE7A" />
        </SvgGrad>
        <SvgGrad id="iPill2" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#FBBF24" />
        </SvgGrad>
      </Defs>
      {/* Main capsule */}
      <Path d="M10 20 Q10 12 20 12 L28 12 Q38 12 38 20 Q38 28 28 28 L20 28 Q10 28 10 20Z" fill="url(#iPill1)" />
      {/* Left half lighter */}
      <Path d="M10 20 Q10 12 20 12 L24 12 L24 28 L20 28 Q10 28 10 20Z" fill="#A7F3D0" />
      <Line x1="24" y1="12" x2="24" y2="28" stroke="white" strokeWidth="1.5" opacity="0.4" />
      {/* Plus sign on right half */}
      <Line x1="29" y1="20" x2="37" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <Line x1="33" y1="16" x2="33" y2="24" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Small yellow pill */}
      <Ellipse cx="19" cy="37" rx="7" ry="5" fill="url(#iPill2)" />
      <Line x1="19" y1="32" x2="19" y2="42" stroke="white" strokeWidth="1.5" opacity="0.5" />
      {/* Dot pills */}
      <Circle cx="30" cy="37" r="4" fill="#FDA4AF" />
      <Circle cx="39" cy="35" r="3" fill="#C4B5FD" />
    </Svg>
  );
}

function IconGuide({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iGuide" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FDE68A" />
          <Stop offset="1" stopColor="#F59E0B" />
        </SvgGrad>
      </Defs>
      {/* Bowl */}
      <Path d="M8 24 Q8 38 24 38 Q40 38 40 24Z" fill="url(#iGuide)" />
      <Ellipse cx="24" cy="24" rx="16" ry="5" fill="#FEF3C7" />
      {/* Steam */}
      <Path d="M17 18 Q15 14 17 10" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M24 16 Q22 12 24 8" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M31 18 Q29 14 31 10" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Spoon */}
      <Ellipse cx="40" cy="14" rx="4" ry="3.5" fill="#FBBF24" />
      <Line x1="39.5" y1="17" x2="37" y2="29" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      {/* Food in bowl */}
      <Circle cx="19" cy="25.5" r="2.5" fill="#F59E0B" opacity="0.55" />
      <Circle cx="26" cy="24.5" r="3"   fill="#FCA5A5" opacity="0.65" />
      <Circle cx="32" cy="26"   r="2"   fill="#86EFAC" opacity="0.75" />
    </Svg>
  );
}

function IconChart({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="iC1" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#93C5FD" />
          <Stop offset="1" stopColor="#1A73C8" />
        </SvgGrad>
        <SvgGrad id="iC2" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#F9A8D4" />
          <Stop offset="1" stopColor="#E63B6F" />
        </SvgGrad>
        <SvgGrad id="iC3" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#6EE7B7" />
          <Stop offset="1" stopColor="#27AE7A" />
        </SvgGrad>
      </Defs>
      {/* Grid lines */}
      <Line x1="8" y1="38" x2="42" y2="38" stroke="#E5E7EB" strokeWidth="1.5" />
      <Line x1="8" y1="30" x2="42" y2="30" stroke="#F3F4F6" strokeWidth="1" />
      <Line x1="8" y1="22" x2="42" y2="22" stroke="#F3F4F6" strokeWidth="1" />
      {/* Bars */}
      <Rect x="10" y="26" width="8"  height="12" rx="3" fill="url(#iC1)" />
      <Rect x="20" y="14" width="8"  height="24" rx="3" fill="url(#iC2)" />
      <Rect x="30" y="19" width="8"  height="19" rx="3" fill="url(#iC3)" />
      {/* Trend line */}
      <Polyline points="14,25 24,13 34,18"
        fill="none" stroke="#FDE68A" strokeWidth="2"
        strokeLinecap="round" strokeDasharray="3,2" />
      <Circle cx="14" cy="25" r="2.5" fill="#FDE68A" />
      <Circle cx="24" cy="13" r="2.5" fill="#FDE68A" />
      <Circle cx="34" cy="18" r="2.5" fill="#FDE68A" />
    </Svg>
  );
}

function IconWeight({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Defs>
        <SvgGrad id="iWt" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6EE7B7" />
          <Stop offset="1" stopColor="#27AE7A" />
        </SvgGrad>
      </Defs>
      {/* Scale body */}
      <Rect x="5" y="22" width="18" height="4" rx="2" fill="url(#iWt)" />
      {/* Scale post */}
      <Rect x="12" y="10" width="4" height="12" rx="2" fill="#A7F3D0" />
      {/* Platform */}
      <Ellipse cx="14" cy="10" rx="9" ry="3.5" fill="url(#iWt)" />
      {/* Weight ball */}
      <Circle cx="14" cy="6" r="5" fill="#6EE7B7" />
      <Circle cx="12" cy="5" r="1.5" fill="white" opacity="0.5" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Sparkline
// ─────────────────────────────────────────────────────────────────────────────
function MiniSparkLine({ width = 120, data }: { width?: number; data?: number[] }) {
  const h = 44;
  const pts = data && data.length >= 2 ? data : null;
  if (!pts) {
    return (
      <Svg width={width} height={h}>
        <Line x1="4" y1={h - 6} x2={width - 4} y2={h - 6}
          stroke="#F8BBD9" strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray="5,4" />
        <Line x1={width / 2} y1="4" x2={width / 2} y2={h - 8}
          stroke="#FCE4EC" strokeWidth="1" />
      </Svg>
    );
  }
  const minV = Math.min(...pts) * 0.95;
  const maxV = Math.max(...pts) * 1.05;
  const toX  = (i: number) => 8 + (i / (pts.length - 1)) * (width - 16);
  const toY  = (v: number) => 4 + (1 - (v - minV) / (maxV - minV)) * (h - 10);
  const poly = pts.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  return (
    <Svg width={width} height={h}>
      <Polyline points={poly} fill="none" stroke={Colors.primaryPink}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((v, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill={Colors.primaryPink} />
      ))}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Avatar
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_BG    = ['#E8F2FF', '#FFE4EE', '#E0F7EF', '#FFF8E8'];
const AVATAR_EMOJI = ['👶🏻', '👶🏽', '👶🏾', '👶'];

function MiniAvatar({ child, size = 36 }: { child: Child; size?: number }) {
  const idx = (child.avatarIndex ?? 0) % AVATAR_BG.length;
  if (child.photoUri) {
    return (
      <Image
        source={{ uri: child.photoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: AVATAR_BG[idx],
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.46 }}>{AVATAR_EMOJI[idx]}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Top Navigation Bar  (with Ate AI animated button)
// ─────────────────────────────────────────────────────────────────────────────
function TopNavBar({ onAteAIPress }: { onAteAIPress: () => void }) {
  const { activeChild, children } = useChildStore();
  const hasChild    = !!activeChild;
  const displayName = hasChild ? getChildDisplayName(activeChild!) : null;
  const ageStr      = hasChild && activeChild!.birthday
    ? getChildAgeVerbose(activeChild!.birthday) : null;

  return (
    <View style={nav.bar}>

      {/* Left: Avatar / Add Baby */}
      <TouchableOpacity
        style={nav.left}
        onPress={() => router.push(hasChild
          ? { pathname: '/child-profile', params: { id: activeChild!.id } }
          : '/child-profile')}
        activeOpacity={0.75}
      >
        {hasChild ? (
          <>
            <View style={nav.avatarRing}>
              <MiniAvatar child={activeChild!} size={34} />
            </View>
            {children.length > 1 && <Text style={nav.arrow}>▾</Text>}
          </>
        ) : (
          <View style={nav.addPill}>
            <Text style={nav.addPillText}>+ Add Baby</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Center: Name + Age */}
      <View style={nav.center}>
        {hasChild ? (
          <>
            <Text style={nav.name} numberOfLines={1}>{displayName}</Text>
            {ageStr && <Text style={nav.age} numberOfLines={1}>{ageStr}</Text>}
          </>
        ) : (
          <Text style={nav.appName}>BabyBloom PH 🌸</Text>
        )}
      </View>

      {/* Right: Ate AI (animated kawaii button) + Bell */}
      <View style={nav.right}>
        <AteAIButton onPress={onAteAIPress} />
        <TouchableOpacity style={nav.iconBtn} activeOpacity={0.7}>
          <Text style={nav.iconEmoji}>🔔</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner — gradient hero card with KawaiiBaby
// ─────────────────────────────────────────────────────────────────────────────
function HeroBanner({ child }: { child: Child }) {
  const name = getChildDisplayName(child);
  return (
    <LinearGradient
      colors={[Colors.primaryPink, '#F472B6', '#FB7185']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={hb.wrap}
    >
      {/* Decorative circles */}
      <View style={hb.circleTop} />
      <View style={hb.circleBot} />

      <View style={hb.textCol}>
        <Text style={hb.greeting}>Hello, Mommy! 🌸</Text>
        <Text style={hb.babyName}>{name}'s Dashboard</Text>
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
          style={hb.statusPill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={hb.statusText}>✨ Everything looks great!</Text>
        </LinearGradient>
      </View>

      <View style={hb.illustration}>
        <KawaiiBaby size={112} />
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Quick Stats Strip — 4 chips with kawaii SVG icons
// ─────────────────────────────────────────────────────────────────────────────
function QsIcon({ id, size }: { id: string; size: number }) {
  if (id === 'fed')     return <IconBottle  size={size} />;
  if (id === 'sleep')   return <IconMoon    size={size} />;
  if (id === 'vaccine') return <IconSyringe size={size} />;
  return <IconWeight size={size} />;
}

function QuickStatsStrip() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const { entries }     = useFeedingStore();
  const sleepStore      = useSleepStore();
  const childId         = activeChild?.id ?? '';

  const lastFeed    = getLastFeed(entries, childId);
  const todayFeeds  = getTodayEntries(entries, childId);
  const lastFedVal  = lastFeed ? timeAgoShort(lastFeed.startedAt) : '—';
  const feedsToday  = todayFeeds.length > 0 ? `${todayFeeds.length}x today` : '—';

  const growthStore   = useGrowthStore();
  const latestGrowth  = growthStore.getLatest(childId);
  const weight        = latestGrowth?.weightKg
    ? `${latestGrowth.weightKg} kg`
    : (activeChild?.birthWeight ? `${activeChild.birthWeight} kg` : '— kg');
  const sleepMins     = sleepStore.getTodaySleepMinutes(childId);
  const sleepVal      = sleepMins > 0 ? formatSleepDuration(sleepMins) : '—';
  const sleepNaps     = sleepStore.getTodayEntries(childId).filter((e) => e.sleepType === 'nap').length;
  const sleepSub      = sleepNaps > 0 ? `${sleepNaps} nap${sleepNaps > 1 ? 's' : ''}` : '';

  const QS_DATA = [
    { id: 'fed',     label: t('home.last_fed'),     value: lastFedVal,  accent: Colors.primaryPink, sub: feedsToday },
    { id: 'sleep',   label: t('home.sleep_today'),  value: sleepVal,    accent: '#7C3AED',          sub: sleepSub  },
    { id: 'vaccine', label: t('home.next_vaccine'), value: '—',         accent: Colors.blue,        sub: '' },
    { id: 'weight',  label: t('home.weight'),       value: weight,      accent: Colors.mint,        sub: '' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={qs.row}
    >
      {QS_DATA.map(({ id, label, value, accent, sub }) => (
        <TouchableOpacity
          key={id}
          style={[qs.chip, { borderLeftColor: accent }]}
          onPress={() => id === 'fed' ? router.push('/feeding-log') : undefined}
          activeOpacity={id === 'fed' ? 0.7 : 1}
        >
          <View style={[qs.iconWrap, { backgroundColor: accent + '22' }]}>
            <QsIcon id={id} size={28} />
          </View>
          <View>
            <Text style={qs.chipLabel}>{label}</Text>
            <Text style={[qs.chipValue, { color: accent }]}>{value}</Text>
            {!!sub && <Text style={[qs.chipSub, { color: accent }]}>{sub}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Growth Snapshot Card (with real WHO data + add-measurement modal)
// ─────────────────────────────────────────────────────────────────────────────
function GrowthSnapshotCard() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const growthStore     = useGrowthStore();
  const childId         = activeChild?.id ?? '';

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [mWeight,   setMWeight]   = useState('');
  const [mHeight,   setMHeight]   = useState('');
  const [mHead,     setMHead]     = useState('');
  const [mNotes,    setMNotes]    = useState('');
  const [mDate,     setMDate]     = useState(
    new Date().toISOString().slice(0, 10),
  );

  // Real data
  const latest    = growthStore.getLatest(childId);
  const sparkData = growthStore.getLastNWeights(childId, 5).map((r) => r.kg);

  // Child age in months (with preterm correction)
  const ageMonths = (() => {
    if (!activeChild?.birthday) return 0;
    const msAge = Date.now() - new Date(activeChild.birthday).getTime();
    const rawMonths = msAge / (1000 * 60 * 60 * 24 * 30.44);
    return getCorrectedAgeMonths(rawMonths, activeChild.gestationalAge ?? undefined);
  })();
  const sex = (activeChild?.sex === 'male' || activeChild?.sex === 'female')
    ? activeChild.sex : 'male';

  // WHO percentile for weight
  const wPct = latest?.weightKg
    ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg)
    : null;

  // Display values
  const weightVal = latest?.weightKg
    ? `${latest.weightKg} kg`
    : (activeChild?.birthWeight ? `${activeChild.birthWeight} kg` : '—');
  const heightVal = latest?.heightCm
    ? `${latest.heightCm} cm`
    : (activeChild?.birthHeight ? `${activeChild.birthHeight} cm` : '—');
  const headVal   = latest?.headCircumferenceCm
    ? `${latest.headCircumferenceCm} cm`
    : '—';

  // Badge styling based on percentile zone
  const badgeBg   = wPct ? wPct.bgColor : Colors.softMint;
  const badgeFg   = wPct ? wPct.color   : Colors.mint;
  const badgeTxt  = wPct
    ? `${wPct.label}  •  p${Math.round(wPct.percentile)}`
    : t('growth.add_to_update');

  // Save measurement
  const handleSave = () => {
    const w  = parseFloat(mWeight);
    const h  = parseFloat(mHeight);
    const hd = parseFloat(mHead);
    if (!mWeight && !mHeight && !mHead) {
      Alert.alert(t('growth.error_title'), t('growth.error_empty'));
      return;
    }
    growthStore.addRecord({
      id:                   `gr_${Date.now()}`,
      childId,
      measuredAt:           mDate,
      weightKg:             isNaN(w)  ? undefined : w,
      heightCm:             isNaN(h)  ? undefined : h,
      headCircumferenceCm:  isNaN(hd) ? undefined : hd,
      notes:                mNotes || undefined,
      createdAt:            new Date().toISOString(),
    });
    setModalVisible(false);
    setMWeight(''); setMHeight(''); setMHead(''); setMNotes('');
    setMDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <>
      <View style={gc.card}>
        <View style={gc.row}>
          <Text style={gc.title}>{t('growth.snapshot_title')} 📈</Text>
          <TouchableOpacity onPress={() => router.push('/growth-analysis')} activeOpacity={0.75}>
            <Text style={gc.link}>{t('growth.view_full')} →</Text>
          </TouchableOpacity>
        </View>

        {/* 3 stat boxes */}
        <View style={gc.statsRow}>
          {[
            { label: t('growth.weight'),    value: weightVal },
            { label: t('growth.height'),    value: heightVal },
            { label: t('growth.head_circ'), value: headVal   },
          ].map(({ label, value }) => (
            <LinearGradient
              key={label}
              colors={[Colors.softPink, '#FFD6E8']}
              style={gc.statBox}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={gc.statNum}>{value}</Text>
              <Text style={gc.statLbl}>{label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* WHO badge + Add button */}
        <View style={gc.percentRow}>
          <View style={[gc.badge, { backgroundColor: badgeBg }]}>
            <Text style={[gc.badgeText, { color: badgeFg }]}>
              {wPct ? (wPct.percentile >= 15 && wPct.percentile <= 85 ? '🟢' : wPct.percentile >= 5 && wPct.percentile <= 97 ? '🟡' : '🔴') : '⬜'} {badgeTxt}
            </Text>
          </View>
          <TouchableOpacity
            style={gc.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={gc.addBtnText}>{t('growth.add_measurement')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sparkline */}
        <View style={gc.sparkWrap}>
          <Text style={gc.sparkLabel}>{t('growth.last_5_weights')}</Text>
          <MiniSparkLine width={CARD_W - 48} data={sparkData.length >= 2 ? sparkData : undefined} />
        </View>

        <Text style={gc.aiText}>
          ✨ {latest
            ? t('growth.ai_summary_prompt')
            : t('growth.ai_add_prompt')}
        </Text>
      </View>

      {/* ── Add Measurement Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={mm.container}>
            {/* Header */}
            <View style={mm.header}>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={mm.cancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={mm.title}>{t('growth.modal_title')}</Text>
              <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                <Text style={mm.save}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={mm.body} keyboardShouldPersistTaps="handled">
              {/* Date */}
              <Text style={mm.label}>{t('growth.modal_date')}</Text>
              <TextInput
                style={mm.input}
                value={mDate}
                onChangeText={setMDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.lightGray}
                keyboardType="numbers-and-punctuation"
              />

              {/* Weight */}
              <Text style={mm.label}>{t('growth.modal_weight')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mWeight}
                  onChangeText={setMWeight}
                  placeholder={t('growth.modal_weight_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>kg</Text>
              </View>

              {/* Height */}
              <Text style={mm.label}>{t('growth.modal_height')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mHeight}
                  onChangeText={setMHeight}
                  placeholder={t('growth.modal_height_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>cm</Text>
              </View>

              {/* Head */}
              <Text style={mm.label}>{t('growth.modal_head')}</Text>
              <View style={mm.inputRow}>
                <TextInput
                  style={[mm.input, mm.inputFlex]}
                  value={mHead}
                  onChangeText={setMHead}
                  placeholder={t('growth.modal_head_placeholder')}
                  placeholderTextColor={Colors.lightGray}
                  keyboardType="decimal-pad"
                />
                <Text style={mm.unit}>cm</Text>
              </View>

              {/* Notes */}
              <Text style={mm.label}>{t('growth.modal_notes')}</Text>
              <TextInput
                style={[mm.input, mm.inputMulti]}
                value={mNotes}
                onChangeText={setMNotes}
                placeholder={t('growth.modal_notes_placeholder')}
                placeholderTextColor={Colors.lightGray}
                multiline
                numberOfLines={3}
              />

              {/* WHO tip */}
              <View style={mm.tip}>
                <Text style={mm.tipText}>💡 {t('growth.who_tip')}</Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Feature Icon Grid — kawaii SVG icons + gradient card backgrounds
// ─────────────────────────────────────────────────────────────────────────────
interface FeatureItem {
  id: string;
  Icon: React.ComponentType<{ size?: number }>;
  labelKey: string;
  gradColors: [string, string];
  shadowColor: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'feeding_log',
    Icon: IconBottle,
    labelKey: 'home.feeding_log',
    gradColors: ['#FFD6E8', '#FFAAC8'],
    shadowColor: Colors.primaryPink,
  },
  {
    id: 'sleep_tracker',
    Icon: IconMoon,
    labelKey: 'home.sleep_tracker',
    gradColors: ['#EDE9FE', '#C4B5FD'],
    shadowColor: '#7C3AED',
  },
  {
    id: 'vaccination_log',
    Icon: IconSyringe,
    labelKey: 'home.vaccination_log',
    gradColors: ['#DBEAFE', '#93C5FD'],
    shadowColor: Colors.blue,
  },
  {
    id: 'vitamins_meds',
    Icon: IconPills,
    labelKey: 'home.vitamins_meds',
    gradColors: ['#D1FAE5', '#6EE7B7'],
    shadowColor: Colors.mint,
  },
  {
    id: 'feeding_guide',
    Icon: IconGuide,
    labelKey: 'home.feeding_guide',
    gradColors: ['#FEF3C7', '#FDE68A'],
    shadowColor: '#F59E0B',
  },
  {
    id: 'insights',
    Icon: IconChart,
    labelKey: 'home.insights',
    gradColors: ['#DBEAFE', '#BAE6FD'],
    shadowColor: Colors.blue,
  },
];

function FeatureIconGrid() {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={s.sectionTitle}>{t('home.features')}</Text>
      <View style={fg.grid}>
        {FEATURES.map(({ id, Icon, labelKey, gradColors, shadowColor }) => (
          <TouchableOpacity
            key={id}
            style={{ width: FEAT_W }}
            activeOpacity={0.82}
            onPress={() => {
              if (id === 'feeding_log')    router.push('/feeding-log');
              if (id === 'sleep_tracker')  router.push('/sleep-tracker');
              if (id === 'vitamins_meds')  router.push('/vitamins' as any);
              if (id === 'insights')       router.push('/growth-analysis');
            }}
          >
            <LinearGradient
              colors={gradColors}
              style={fg.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative circle */}
              <View style={[fg.deco, { backgroundColor: shadowColor + '18' }]} />
              <Icon size={52} />
              <Text style={[fg.label, { color: shadowColor === Colors.primaryPink ? '#9B1B4B' : '#2D2D5A' }]}>
                {t(labelKey)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Insights Card — weekly summary with SVG icons
// ─────────────────────────────────────────────────────────────────────────────
function InsightsCard() {
  const { activeChild } = useChildStore();
  const { entries }     = useFeedingStore();
  const sleepStore      = useSleepStore();
  const childId         = activeChild?.id ?? '';

  // Weekly feeding totals
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const weekFeeds  = entries.filter((e) => e.childId === childId && new Date(e.startedAt) >= cutoff);
  const weekVolume = weekFeeds.reduce((s, e) => s + (e.volumeMl ?? 0), 0);
  const feedLabel  = weekFeeds.length > 0
    ? `${weekFeeds.length} feeds  •  ${weekVolume > 0 ? `${weekVolume}ml` : '—'}`
    : '— feeds  •  — ml';

  // Weekly sleep totals
  const weekSleep      = sleepStore.getWeekEntries(childId);
  const weekSleepMins  = weekSleep.reduce((s, e) => {
    if (!e.endedAt) return s;
    return s + Math.round((new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 60_000);
  }, 0);
  const weekSleepHours = (weekSleepMins / 60).toFixed(1);
  const avgSleepH      = weekSleep.length > 0 ? (weekSleepMins / 60 / 7).toFixed(1) : '—';
  const sleepLabel     = weekSleepMins > 0
    ? `${weekSleepHours}h total  •  ${avgSleepH}h/day avg`
    : '— hours  •  — avg/day';

  return (
    <View style={ic.card}>
      <View style={ic.titleRow}>
        <Text style={ic.title}>This Week's Summary 📋</Text>
        <TouchableOpacity><Text style={ic.link}>View Full Reports →</Text></TouchableOpacity>
      </View>

      {/* Row 1: Feeds */}
      <TouchableOpacity style={ic.row} onPress={() => router.push('/feeding-log')} activeOpacity={0.8}>
        <View style={[ic.iconCircle, { backgroundColor: Colors.softPink }]}>
          <IconBottle size={22} />
        </View>
        <View style={ic.rowText}>
          <Text style={ic.rowLabel}>TOTAL FEEDS</Text>
          <Text style={ic.rowValue}>{feedLabel}</Text>
        </View>
      </TouchableOpacity>

      {/* Row 2: Sleep */}
      <TouchableOpacity style={[ic.row, ic.rowBorder]} onPress={() => router.push('/sleep-tracker')} activeOpacity={0.8}>
        <View style={[ic.iconCircle, { backgroundColor: '#EDE9FE' }]}>
          <IconMoon size={22} />
        </View>
        <View style={ic.rowText}>
          <Text style={ic.rowLabel}>TOTAL SLEEP</Text>
          <Text style={ic.rowValue}>{sleepLabel}</Text>
        </View>
      </TouchableOpacity>

      {/* Row 3: Upcoming */}
      <View style={[ic.row, ic.rowBorder]}>
        <View style={[ic.iconCircle, { backgroundColor: Colors.softBlue }]}>
          <IconSyringe size={22} />
        </View>
        <View style={ic.rowText}>
          <Text style={ic.rowLabel}>UPCOMING EVENT</Text>
          <Text style={ic.rowValue}>No upcoming events</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={es.wrap}>
      <KawaiiBaby size={160} />
      <Text style={es.title}>Welcome to BabyBloom PH! 🌸</Text>
      <Text style={es.subtitle}>
        Add your baby's profile to start tracking their health journey.
      </Text>
      <TouchableOpacity onPress={() => router.push('/child-profile')} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.primaryPink, '#F472B6']}
          style={es.btn}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={es.btnText}>Add Baby Profile  🍼</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={es.note}>Your digital MCH Booklet 🇵🇭</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Home Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t }             = useTranslation();
  const { activeChild, children } = useChildStore();
  const [refreshing,   setRefreshing]  = useState(false);
  const [ateAIOpen,    setAteAIOpen]   = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  if (!activeChild) {
    return (
      <View style={s.screen}>
        <TopNavBar onAteAIPress={() => setAteAIOpen(true)} />
        <EmptyState />
        <AteAIChat visible={ateAIOpen} onClose={() => setAteAIOpen(false)} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <TopNavBar onAteAIPress={() => setAteAIOpen(true)} />
      {children.length > 1 && <ChildSwitcher />}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryPink}
            colors={[Colors.primaryPink]}
          />
        }
      >
        {/* Hero Banner */}
        <HeroBanner child={activeChild} />

        {/* Quick Stats */}
        <Text style={[s.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>
          {t('home.quick_stats')}
        </Text>
        <QuickStatsStrip />

        {/* Ate AI Weekly Summary Card */}
        <AteAISummaryCard
          title={t('ateai.weekly_summary_title')}
          emoji="✨"
          prompt="Give a 2-sentence friendly weekly health summary for this baby based on the data. Include one specific WHO/DOH tip relevant to their age."
          onChatPress={() => setAteAIOpen(true)}
        />

        {/* Growth Snapshot */}
        <Text style={s.sectionTitle}>{t('home.growth_snapshot')}</Text>
        <GrowthSnapshotCard />

        {/* Feature Grid */}
        <FeatureIconGrid />

        {/* Weekly Insights */}
        <Text style={s.sectionTitle}>{t('home.insights')}</Text>
        <InsightsCard />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Ate AI Chat Sheet */}
      <AteAIChat visible={ateAIOpen} onClose={() => setAteAIOpen(false)} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.background },
  scroll:       { flex: 1 },
  content:      { paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: Colors.midGray,
    marginBottom: 10, marginTop: 18, marginHorizontal: PAD,
    textTransform: 'uppercase', letterSpacing: 1,
  },
});

// Top nav
const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 3,
  },
  left:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatarRing: { borderRadius: 20, borderWidth: 2, borderColor: Colors.softPink, overflow: 'hidden' },
  arrow:      { fontSize: 13, color: Colors.lightGray },
  addPill:    { backgroundColor: Colors.softPink, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addPillText:{ fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  center:     { flex: 2, alignItems: 'center' },
  name:       { fontSize: 15, fontWeight: '800', color: Colors.dark },
  age:        { fontSize: 11, color: Colors.lightGray, fontWeight: '600', marginTop: 1 },
  appName:    { fontSize: 15, fontWeight: '800', color: Colors.primaryPink },
  right:      { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  iconBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.softPink, alignItems: 'center', justifyContent: 'center' },
  iconEmoji:  { fontSize: 17 },
});

// Hero banner
const hb = StyleSheet.create({
  wrap: {
    marginHorizontal: PAD, marginTop: 14,
    borderRadius: 24, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', minHeight: 120,
    shadowColor: Colors.primaryPink, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  circleTop: {
    position: 'absolute', top: -30, right: 80,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleBot: {
    position: 'absolute', bottom: -20, left: 20,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textCol:     { flex: 1, zIndex: 1 },
  greeting:    { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginBottom: 4 },
  babyName:    { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 10 },
  statusPill:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  statusText:  { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  illustration:{ zIndex: 1, marginLeft: -8 },
});

// Quick stats
const qs = StyleSheet.create({
  row:  { gap: 10, paddingBottom: 6, paddingHorizontal: PAD },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderLeftWidth: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    minWidth: 155,
  },
  iconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipLabel:  { fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginBottom: 3 },
  chipValue:  { fontSize: 15, fontWeight: '800' },
  chipSub:    { fontSize: 10, fontWeight: '700', marginTop: 1 },
});

// Growth snapshot
const gc = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16,
    marginHorizontal: PAD, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:        { fontSize: 15, fontWeight: '800', color: Colors.dark },
  link:         { fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },
  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:      { flex: 1, borderRadius: 16, padding: 11, alignItems: 'center' },
  statNum:      { fontSize: 16, fontWeight: '800', color: Colors.dark },
  statLbl:      { fontSize: 9, color: Colors.midGray, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  percentRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge:        { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, flex: 1 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  percentNote:  { fontSize: 10, color: Colors.lightGray, flex: 1 },
  addBtn:       { backgroundColor: Colors.softPink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:   { fontSize: 12, fontWeight: '800', color: Colors.primaryPink },
  sparkWrap:    { marginBottom: 10 },
  sparkLabel:   { fontSize: 10, color: Colors.lightGray, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiText:       { fontSize: 12, color: Colors.lightGray, fontStyle: 'italic', lineHeight: 18 },
});

// Add Measurement Modal
const mm = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:      { fontSize: 16, fontWeight: '800', color: Colors.dark },
  cancel:     { fontSize: 15, color: Colors.midGray, fontWeight: '600' },
  save:       { fontSize: 15, color: Colors.primaryPink, fontWeight: '800' },
  body:       { padding: 16, paddingBottom: 60 },
  label:      { fontSize: 13, fontWeight: '700', color: Colors.dark, marginTop: 16, marginBottom: 6 },
  input:      {
    backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.dark,
  },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputFlex:  { flex: 1 },
  unit:       { fontSize: 14, fontWeight: '700', color: Colors.midGray, width: 28 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  tip:        {
    marginTop: 20, backgroundColor: Colors.softBlue, borderRadius: 14, padding: 14,
  },
  tipText:    { fontSize: 12, color: Colors.blue, lineHeight: 18 },
});

// Feature grid
const fg = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: FEAT_GAP, marginBottom: 4, paddingHorizontal: PAD },
  card: {
    width: '100%', aspectRatio: 1,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    gap: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  deco: {
    position: 'absolute', bottom: -20, right: -20,
    width: 80, height: 80, borderRadius: 40,
  },
  label: {
    fontSize: 12, fontWeight: '800',
    textAlign: 'center', paddingHorizontal: 8, lineHeight: 16,
    zIndex: 1,
  },
});

// Insights card
const ic = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16,
    marginHorizontal: PAD, marginBottom: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  titleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:      { fontSize: 15, fontWeight: '800', color: Colors.dark },
  link:       { fontSize: 12, color: Colors.primaryPink, fontWeight: '700' },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rowBorder:  { borderTopWidth: 1, borderTopColor: Colors.border },
  iconCircle: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText:    { flex: 1 },
  rowLabel:   { fontSize: 10, color: Colors.lightGray, fontWeight: '700', letterSpacing: 0.4, marginBottom: 2 },
  rowValue:   { fontSize: 13, fontWeight: '700', color: Colors.dark },
});

// Empty state
const es = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 40,
  },
  title:    { fontSize: 22, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginTop: 20, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.midGray, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  btn:      { borderRadius: 18, paddingVertical: 15, paddingHorizontal: 32, shadowColor: Colors.primaryPink, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnText:  { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  note:     { marginTop: 20, fontSize: 13, color: Colors.lightGray, fontWeight: '600' },
});
