/**
 * index.tsx — BabyBloom PH Dashboard
 * Redesigned to match system.png — kawaii SVG illustrated icons, hero baby card, growth chart
 */

import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Image, Dimensions,
} from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Rect, G, Line, Polyline,
  Defs, LinearGradient as SvgGrad, Stop, Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import ChildSwitcher from '../../components/ChildSwitcher';
import { useChildStore, getChildDisplayName, getChildAge } from '../../store/childStore';

const { width: W } = Dimensions.get('window');
const CARD_W = W - 32;

// ── Kawaii SVG Icons ───────────────────────────────────────────────────────────

function IconBottle({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="bGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFD6E8" />
          <Stop offset="1" stopColor="#FFB3CF" />
        </SvgGrad>
      </Defs>
      {/* Bottle body */}
      <Rect x="14" y="16" width="20" height="24" rx="9" fill="url(#bGrad)" />
      {/* Neck */}
      <Rect x="17" y="10" width="14" height="8" rx="4" fill="#FFB3CF" />
      {/* Nipple */}
      <Ellipse cx="24" cy="9" rx="6" ry="3.5" fill="#FF8FAB" />
      <Ellipse cx="24" cy="7" rx="3.5" ry="2.5" fill="#FF6B8A" />
      {/* Milk fill */}
      <Rect x="15" y="26" width="18" height="12" rx="7" fill="white" opacity="0.45" />
      {/* Shine */}
      <Ellipse cx="18" cy="20" rx="2.5" ry="5" fill="white" opacity="0.4" />
      {/* Scale marks */}
      <Line x1="15" y1="30" x2="19" y2="30" stroke="#FFB3CF" strokeWidth="1.2" />
      <Line x1="15" y1="34" x2="19" y2="34" stroke="#FFB3CF" strokeWidth="1.2" />
    </Svg>
  );
}

function IconMoon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="mGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF9C4" />
          <Stop offset="1" stopColor="#FFD54F" />
        </SvgGrad>
      </Defs>
      {/* Moon crescent */}
      <Path
        d="M30 8 Q42 16 42 28 Q42 40 28 44 Q14 40 12 28 Q16 34 26 32 Q40 28 30 8Z"
        fill="url(#mGrad)"
      />
      {/* Stars */}
      <Circle cx="10" cy="14" r="2.5" fill="#FFD700" />
      <Circle cx="40" cy="10" r="2" fill="#FFD700" />
      <Circle cx="42" cy="30" r="1.5" fill="#FFD700" />
      <Circle cx="6" cy="34" r="1.5" fill="#FFD700" />
      {/* Moon face */}
      <Circle cx="26" cy="24" r="2" fill="#E8A020" />
      <Circle cx="34" cy="22" r="2" fill="#E8A020" />
      <Path d="M26 30 Q30 34 34 30" stroke="#E8A020" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Z letters */}
      <Path d="M6 18 L10 18 L6 23 L10 23" stroke="#C5B4FF" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 13 L6 13 L3 17 L6 17" stroke="#C5B4FF" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconSyringe({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgGrad id="sGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#C5E8F5" />
          <Stop offset="1" stopColor="#8AC8DE" />
        </SvgGrad>
      </Defs>
      {/* Body */}
      <Rect x="10" y="20" width="26" height="8" rx="4" fill="url(#sGrad)" />
      {/* Plunger */}
      <Rect x="34" y="17" width="5" height="14" rx="2.5" fill="#7BBDD0" />
      <Rect x="35" y="15" width="3" height="4" rx="1" fill="#5AAABF" />
      {/* Needle */}
      <Path d="M10 23 L4 24" stroke="#8AC8DE" strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M10 25 L4 24" stroke="#8AC8DE" strokeWidth="2.2" strokeLinecap="round" />
      {/* Liquid */}
      <Rect x="11" y="21" width="15" height="6" rx="3" fill="#A8D8F0" />
      {/* Heart */}
      <Path d="M21 10 Q23 7 25 10 Q28 13 23 17 Q18 13 21 10Z" fill="#FFB3C8" />
      {/* Plus */}
      <Path d="M7 10 L7 14 M5 12 L9 12" stroke="#A8D8F0" strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function IconPills({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Capsule top half */}
      <Path d="M12 22 Q12 14 24 14 Q36 14 36 22" fill="#B2A4FF" />
      {/* Capsule bottom half */}
      <Path d="M12 22 Q12 30 24 30 Q36 30 36 22" fill="#FFB3C8" />
      {/* Capsule outline */}
      <Ellipse cx="24" cy="22" rx="12" ry="8" fill="none" stroke="white" strokeWidth="1.5" />
      {/* Divider */}
      <Line x1="12" y1="22" x2="36" y2="22" stroke="white" strokeWidth="1.5" />
      {/* Shine */}
      <Ellipse cx="18" cy="18" rx="3.5" ry="2" fill="white" opacity="0.4" />
      {/* Small round pill */}
      <Ellipse cx="36" cy="38" rx="6" ry="3.5" fill="#FFD3A5" transform="rotate(-35, 36, 38)" />
      {/* Star */}
      <Path d="M10 37 L11 40 L14 40 L11.5 42 L12.5 45 L10 43 L7.5 45 L8.5 42 L6 40 L9 40Z" fill="#FFD700" />
    </Svg>
  );
}

function IconChart({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {/* Card bg */}
      <Rect x="4" y="8" width="40" height="34" rx="7" fill="#FFF0F4" />
      {/* Bars */}
      <Rect x="10" y="28" width="7" height="10" rx="2.5" fill="#FFB3C8" />
      <Rect x="20" y="20" width="7" height="18" rx="2.5" fill="#B2A4FF" />
      <Rect x="30" y="14" width="7" height="24" rx="2.5" fill="#A8D8EA" />
      {/* Dotted trend line */}
      <Polyline
        points="13,26 23,18 33,12"
        fill="none" stroke="#FF8FAB" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="2.5,2.5"
      />
      {/* Up arrow */}
      <Path d="M37 10 L40 7 L43 10" stroke="#6BC46A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Line x1="40" y1="7" x2="40" y2="14" stroke="#6BC46A" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Kawaii Baby Illustration ───────────────────────────────────────────────────

function KawaiiBaby({ size = 100 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Onesie / body */}
      <Ellipse cx="50" cy="76" rx="26" ry="20" fill="#FFD6E8" />
      <Path d="M28 72 Q38 88 50 90 Q62 88 72 72 Q62 68 50 70 Q38 68 28 72Z" fill="#FFB6C8" />
      {/* Arms */}
      <Ellipse cx="22" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(-15, 22, 72)" />
      <Ellipse cx="78" cy="72" rx="7" ry="13" fill="#FFECD5" transform="rotate(15, 78, 72)" />
      {/* Head */}
      <Circle cx="50" cy="40" r="24" fill="#FFECD5" />
      {/* Hair */}
      <Path d="M28 33 Q50 14 72 33 Q65 18 50 16 Q35 18 28 33Z" fill="#8B5E3C" />
      <Circle cx="50" cy="19" r="5.5" fill="#8B5E3C" />
      {/* Ears */}
      <Circle cx="26" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="74" cy="40" r="6.5" fill="#FFDFC8" />
      <Circle cx="26" cy="40" r="4" fill="#FFB3A0" />
      <Circle cx="74" cy="40" r="4" fill="#FFB3A0" />
      {/* Kawaii closed eyes */}
      <Path d="M36 39 Q40 35 44 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <Path d="M56 39 Q60 35 64 39" stroke="#5C3317" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* Eyelashes */}
      <Line x1="36" y1="39" x2="34" y2="37" stroke="#5C3317" strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="44" y1="39" x2="46" y2="37" stroke="#5C3317" strokeWidth="1.4" strokeLinecap="round" />
      {/* Blush */}
      <Ellipse cx="35" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      <Ellipse cx="65" cy="46" rx="6" ry="3.5" fill="#FFB3C8" opacity="0.65" />
      {/* Smile */}
      <Path d="M40 51 Q50 58 60 51" stroke="#E87090" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Bow */}
      <Path d="M38 23 Q50 18 62 23 Q50 28 38 23Z" fill="#FF8FAB" />
      <Circle cx="50" cy="23" r="3" fill="#FF6B8A" />
      {/* Flower decoration */}
      <Circle cx="76" cy="27" r="3.5" fill="#FFD700" />
      <Circle cx="71" cy="25" r="3" fill="#FFB3C8" />
      <Circle cx="81" cy="25" r="3" fill="#FFB3C8" />
      <Circle cx="76" cy="20" r="3" fill="#FFB3C8" />
      <Circle cx="76" cy="32" r="3" fill="#FFB3C8" />
      <Circle cx="76" cy="27" r="2" fill="white" opacity="0.7" />
    </Svg>
  );
}

// ── Elephant Decoration ────────────────────────────────────────────────────────

function ElephantDecor({ size = 52 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox="0 0 52 46">
      <Ellipse cx="30" cy="30" rx="18" ry="14" fill="#D4C5EE" />
      <Circle cx="14" cy="20" r="14" fill="#D4C5EE" />
      <Circle cx="5" cy="14" r="9" fill="#DDD0F4" />
      <Circle cx="5" cy="14" r="5.5" fill="#FFB3C8" />
      <Circle cx="10" cy="17" r="3" fill="white" />
      <Circle cx="10" cy="17" r="1.8" fill="#333" />
      <Circle cx="10.5" cy="16.5" r="0.6" fill="white" />
      <Path d="M7 27 Q2 36 8 40 Q12 42 11 46" stroke="#C0B0E0" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <Rect x="18" y="41" width="7" height="8" rx="3" fill="#C0B0E0" />
      <Rect x="28" y="41" width="7" height="8" rx="3" fill="#C0B0E0" />
      <Rect x="37" y="41" width="7" height="8" rx="3" fill="#C0B0E0" />
      <Path d="M48 28 Q54 24 50 19" stroke="#C0B0E0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Circle cx="32" cy="24" r="4" fill="#FFD700" opacity="0.75" />
    </Svg>
  );
}

// ── Growth Chart SVG ──────────────────────────────────────────────────────────

function GrowthChartSvg({ width }: { width: number }) {
  const h = 160;
  const padL = 30, padR = 14, padT = 12, padB = 28;
  const cW = width - padL - padR;
  const cH = h - padT - padB;

  const months  = [0, 1, 2, 3, 4, 5];
  const weights = [3.5, 4.2, 5.1, 5.8, 6.2, 6.5];
  const heights = [50, 53, 57, 60, 62, 64];

  const wMin = 2.5, wMax = 8;
  const hMin = 46, hMax = 68;

  const toX  = (i: number) => padL + (i / (months.length - 1)) * cW;
  const toYW = (v: number) => padT + (1 - (v - wMin) / (wMax - wMin)) * cH;
  const toYH = (v: number) => padT + (1 - (v - hMin) / (hMax - hMin)) * cH;

  const wPts = weights.map((v, i) => `${toX(i)},${toYW(v)}`).join(' ');
  const hPts = heights.map((v, i) => `${toX(i)},${toYH(v)}`).join(' ');

  return (
    <Svg width={width} height={h}>
      {/* Grid lines */}
      {[0, 0.33, 0.66, 1].map((t, i) => (
        <Line key={i}
          x1={padL} y1={padT + t * cH}
          x2={padL + cW} y2={padT + t * cH}
          stroke="#FCE4EC" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      <Line x1={padL} y1={padT} x2={padL} y2={padT + cH} stroke="#F8BBD9" strokeWidth="1.5" />
      <Line x1={padL} y1={padT + cH} x2={padL + cW} y2={padT + cH} stroke="#F8BBD9" strokeWidth="1.5" />

      {/* Height line (blue) */}
      <Polyline points={hPts} fill="none" stroke="#60B8E0" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {heights.map((v, i) => (
        <Circle key={`h${i}`} cx={toX(i)} cy={toYH(v)} r="4.5" fill="#60B8E0" />
      ))}

      {/* Weight line (pink) */}
      <Polyline points={wPts} fill="none" stroke="#E87090" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {weights.map((v, i) => (
        <Circle key={`w${i}`} cx={toX(i)} cy={toYW(v)} r="4.5" fill="#E87090" />
      ))}

      {/* Weight label */}
      <SvgText x={toX(4) + 6} y={toYW(weights[4]) - 7}
        fontSize="10" fill="#E87090" fontWeight="bold">{weights[4]} kg</SvgText>

      {/* Month x-axis labels */}
      {months.map((m, i) => (
        <SvgText key={i} x={toX(i)} y={h - 6}
          fontSize="9" fill="#BBBBBB" textAnchor="middle">{m}</SvgText>
      ))}

      {/* Y-axis labels */}
      <SvgText x={padL - 4} y={padT + cH * 0.05} fontSize="9" fill="#BBBBBB" textAnchor="end">8</SvgText>
      <SvgText x={padL - 4} y={padT + cH * 0.5}  fontSize="9" fill="#BBBBBB" textAnchor="end">5</SvgText>
      <SvgText x={padL - 4} y={padT + cH * 0.95} fontSize="9" fill="#BBBBBB" textAnchor="end">3</SvgText>
    </Svg>
  );
}

// ── Feature & Stats Config ────────────────────────────────────────────────────

const FEATURES = [
  { key: 'feeding_log',   Icon: IconBottle, bg: ['#FFE4EE', '#FFD0E6'] as [string,string], accent: '#FF8FAB' },
  { key: 'sleep_tracker', Icon: IconMoon,   bg: ['#FFFDE7', '#FFF0A0'] as [string,string], accent: '#F0C040' },
  { key: 'vitamins_meds', Icon: IconPills,  bg: ['#EDE8FF', '#DDD4FF'] as [string,string], accent: '#9B89F7' },
  { key: 'insights',      Icon: IconChart,  bg: ['#E0F4FF', '#C8EAFF'] as [string,string], accent: '#60B8E0' },
];

const QUICK_STATS = [
  { key: 'feeding',    Icon: IconBottle,  label: "Today's Feeding", value: '—',         accent: '#FF8FAB' },
  { key: 'sleep',      Icon: IconMoon,    label: 'Sleep Today',     value: '—',         accent: '#F0C040' },
  { key: 'vaccine',    Icon: IconSyringe, label: 'Next Vaccine',    value: 'Check →',   accent: '#60B8E0' },
];

// ── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();

  const babyName = activeChild ? getChildDisplayName(activeChild) : '';
  const babyAge  = activeChild?.birthday ? getChildAge(activeChild.birthday) : null;

  return (
    <View style={s.screen}>

      {/* ── Header ── */}
      <LinearGradient colors={['#F06292', '#F48FB1']} style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.bbLogo}>
            <Text style={s.bbLogoText}>BB</Text>
          </View>
          <Text style={s.headerTitle}>BabyBloom PH</Text>
        </View>
        <View style={s.avatarCircle}>
          {activeChild?.photoUri
            ? <Image source={{ uri: activeChild.photoUri }} style={s.avatarImg} />
            : <Text style={s.avatarEmoji}>👶</Text>
          }
        </View>
      </LinearGradient>

      {/* ── Child Switcher ── */}
      <ChildSwitcher />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Baby Card ── */}
        <LinearGradient
          colors={['#FFDDE8', '#FFE8F2', '#FFF5F8']}
          style={s.heroCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={s.heroDeco1}>🌸</Text>
          <Text style={s.heroDeco2}>✨</Text>
          <Text style={s.heroDeco3}>🌼</Text>

          <View style={s.heroRow}>
            <KawaiiBaby size={100} />

            <View style={s.heroInfo}>
              <Text style={s.heroName} numberOfLines={1}>
                {babyName || 'Add your baby 🌸'}
              </Text>
              {babyAge
                ? <Text style={s.heroAge}>Age: {babyAge}</Text>
                : <Text style={s.heroAge}>Tap + to add your baby</Text>
              }

              <View style={s.heroStatBox}>
                <View style={s.heroStat}>
                  <IconBottle size={22} />
                  <View>
                    <Text style={s.heroStatLabel}>Today's feeding</Text>
                    <Text style={s.heroStatValue}>—</Text>
                  </View>
                </View>
                <View style={s.heroStatDivider} />
                <View style={s.heroStat}>
                  <IconSyringe size={22} />
                  <View>
                    <Text style={s.heroStatLabel}>Next vaccine</Text>
                    <Text style={s.heroStatValue}>—</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Stats Row ── */}
        <View style={s.quickRow}>
          {QUICK_STATS.map(({ key, Icon, label, value, accent }) => (
            <TouchableOpacity key={key} style={s.quickCard} activeOpacity={0.8}>
              <Icon size={38} />
              <Text style={[s.quickValue, { color: accent }]}>{value}</Text>
              <Text style={s.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Feature Grid ── */}
        <Text style={s.sectionTitle}>{t('home.features')}</Text>
        <View style={s.featureGrid}>
          {FEATURES.map(({ key, Icon, bg, accent }) => (
            <TouchableOpacity key={key} style={s.featureWrap} activeOpacity={0.82}>
              <LinearGradient colors={bg} style={s.featureCard}>
                <Icon size={54} />
                <Text style={[s.featureLabel, { color: accent }]}>{t(`home.${key}`)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Growth Chart ── */}
        <Text style={s.sectionTitle}>{t('home.growth_snapshot')}</Text>
        <View style={s.chartCard}>
          {/* Legend */}
          <View style={s.chartLegend}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#E87090' }]} />
              <Text style={s.legendText}>Weight (kg)</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#60B8E0' }]} />
              <Text style={s.legendText}>Height (cm)</Text>
            </View>
          </View>

          <GrowthChartSvg width={CARD_W - 32} />

          <Text style={s.chartAxisLabel}>Age (months)</Text>

          {/* Elephant decoration */}
          <View style={s.elephantWrap}>
            <ElephantDecor size={52} />
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF5F8' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bbLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  bbLogoText:   { fontSize: 12, fontWeight: '900', color: '#F06292' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: 'white', letterSpacing: 0.4 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarImg:   { width: 40, height: 40 },
  avatarEmoji: { fontSize: 22 },

  // Hero card
  heroCard: {
    borderRadius: 22, padding: 16, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#E87090', shadowOpacity: 0.18, shadowRadius: 14, elevation: 5,
  },
  heroDeco1: { position: 'absolute', top: 10,  right: 24, fontSize: 20, opacity: 0.55 },
  heroDeco2: { position: 'absolute', top: 34,  right: 10, fontSize: 15, opacity: 0.45 },
  heroDeco3: { position: 'absolute', bottom: 12, right: 20, fontSize: 16, opacity: 0.4 },
  heroRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroInfo:  { flex: 1 },
  heroName:  { fontSize: 19, fontWeight: '800', color: '#C2185B', marginBottom: 3 },
  heroAge:   { fontSize: 13, color: '#E87090', fontWeight: '600', marginBottom: 10 },
  heroStatBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14, padding: 10, gap: 8,
  },
  heroStat:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroStatDivider: { height: 1, backgroundColor: 'rgba(232,112,144,0.15)' },
  heroStatLabel: { fontSize: 10, color: '#E87090', fontWeight: '600' },
  heroStatValue: { fontSize: 13, color: '#C2185B', fontWeight: '800' },

  // Quick stats
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickCard: {
    flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 12,
    alignItems: 'center', gap: 5,
    shadowColor: '#E8637C', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#FCE4EC',
  },
  quickValue: { fontSize: 12, fontWeight: '800' },
  quickLabel: { fontSize: 9, color: '#BBBBBB', textAlign: 'center', fontWeight: '600' },

  // Section title
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#C2185B',
    marginBottom: 10, marginTop: 4,
  },

  // Feature grid
  featureGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  featureWrap:  { width: '47.5%' },
  featureCard: {
    borderRadius: 20, paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  featureLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 17 },

  // Growth chart
  chartCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: '#E8637C', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#FCE4EC',
    overflow: 'visible',
  },
  chartLegend:   { flexDirection: 'row', gap: 18, marginBottom: 6 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendText:    { fontSize: 11, color: '#999', fontWeight: '600' },
  chartAxisLabel:{ fontSize: 10, color: '#BBBBBB', textAlign: 'center', marginTop: 2 },
  elephantWrap:  { alignItems: 'flex-start', marginTop: 8, opacity: 0.5 },
});
