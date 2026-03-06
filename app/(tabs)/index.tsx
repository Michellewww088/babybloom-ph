import { useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Image, Modal, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, withSpring, withTiming, withDelay,
  withRepeat, withSequence, useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import ChildSwitcher from '../../components/ChildSwitcher';
import {
  useChildStore, getChildDisplayName, getChildAge,
} from '../../store/childStore';

// ── Constants ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { key: 'feeding_log',     emoji: '🍼' },
  { key: 'sleep_tracker',   emoji: '😴' },
  { key: 'vaccination_log', emoji: '💉' },
  { key: 'vitamins_meds',   emoji: '💊' },
  { key: 'feeding_guide',   emoji: '🥗' },
  { key: 'insights',        emoji: '📊' },
] as const;

const DEFAULT_AVATAR_BG    = ['#E8F2FF', '#FFE4EE', '#E0F7EF', '#FFF8E8'];
const DEFAULT_AVATAR_EMOJI = ['👶🏻', '👶🏽', '👶🏾', '👶'];

const { width: W, height: H } = Dimensions.get('window');

// ── Sparkle positions ──────────────────────────────────────────────────────────

const SPARKLES = [
  { x: W * 0.07, y: H * 0.10, delay: 80,  emoji: '✨' },
  { x: W * 0.82, y: H * 0.08, delay: 260, emoji: '🌟' },
  { x: W * 0.03, y: H * 0.46, delay: 170, emoji: '✨' },
  { x: W * 0.87, y: H * 0.40, delay: 350, emoji: '⭐' },
  { x: W * 0.20, y: H * 0.73, delay: 210, emoji: '✨' },
  { x: W * 0.76, y: H * 0.70, delay: 300, emoji: '🌟' },
  { x: W * 0.46, y: H * 0.05, delay: 140, emoji: '⭐' },
  { x: W * 0.62, y: H * 0.82, delay: 230, emoji: '✨' },
];

// ── Stable sparkle (module-level so it never remounts) ────────────────────────

function SparkleEmoji({ x, y, delay, emoji }: { x: number; y: number; delay: number; emoji: string }) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1, { duration: 550 }), withTiming(0.1, { duration: 650 })),
      -1, true,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1.3, { duration: 550 }), withTiming(0.5, { duration: 650 })),
      -1, true,
    ));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[wm.sparkle, { left: x, top: y }, aStyle]}>
      {emoji}
    </Animated.Text>
  );
}

// ── Welcome Modal ─────────────────────────────────────────────────────────────
// Displayed as a full-screen overlay — avoids any route-navigation issues.

function WelcomeModal({ name, onDismiss }: { name: string; onDismiss: () => void }) {
  const { t } = useTranslation();

  const emojiScale   = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY       = useSharedValue(28);
  const subOpacity   = useSharedValue(0);
  const subY         = useSharedValue(18);

  useEffect(() => {
    emojiScale.value   = withSpring(1, { damping: 6, stiffness: 70 });
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 700 }));
    titleY.value       = withDelay(400, withTiming(0, { duration: 700 }));
    subOpacity.value   = withDelay(900, withTiming(1, { duration: 600 }));
    subY.value         = withDelay(900, withTiming(0, { duration: 600 }));

    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value, transform: [{ translateY: titleY.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value, transform: [{ translateY: subY.value }],
  }));

  return (
    <LinearGradient
      colors={['#FFE4EE', '#FFF8E8', '#FFE4EE']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={wm.screen}
    >
      {SPARKLES.map((sp, i) => (
        <SparkleEmoji key={i} x={sp.x} y={sp.y} delay={sp.delay} emoji={sp.emoji} />
      ))}

      <View style={wm.content}>
        <Animated.Text style={[wm.babyEmoji, emojiStyle]}>👶</Animated.Text>

        <View style={wm.flowerRow}>
          <Text style={wm.flowerEmoji}>🌸</Text>
          <Text style={wm.flowerEmoji}>🍼</Text>
          <Text style={wm.flowerEmoji}>🌸</Text>
        </View>

        <Animated.Text style={[wm.title, titleStyle]}>
          {t('welcome.title', { name })}
        </Animated.Text>

        <Animated.Text style={[wm.subtitle, subStyle]}>
          {t('welcome.subtitle')}
        </Animated.Text>
      </View>

      <TouchableOpacity style={wm.skipBtn} onPress={onDismiss} activeOpacity={0.75}>
        <Text style={wm.skipText}>{t('welcome.skip')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t }                                         = useTranslation();
  const { activeChild, showWelcomeModal, clearWelcomeModal } = useChildStore();

  const hour     = new Date().getHours();
  const greeting =
    hour < 12 ? t('home.greeting_morning')
    : hour < 17 ? t('home.greeting_afternoon')
    : t('home.greeting_evening');

  const babyName = activeChild ? getChildDisplayName(activeChild) : '';
  const babyAge  = activeChild?.birthday ? getChildAge(activeChild.birthday) : null;

  // ── Quick Stats ───────────────────────────────────────────────────────────
  const stats = [
    { label: t('home.last_fed'),     value: '—',       emoji: '🍼' },
    { label: t('home.age_label'),    value: babyAge ?? '—', emoji: '📅' },
    { label: t('home.next_vaccine'), value: '—',       emoji: '💉' },
    { label: t('home.weight'),
      value: activeChild?.birthWeight ? `${activeChild.birthWeight} kg` : '—',
      emoji: '⚖️' },
  ];

  const hasBirthStats = !!(activeChild?.birthWeight || activeChild?.birthHeight);

  return (
    <View style={s.screen}>

      {/* ── Welcome Modal overlay (shown after first child save) ── */}
      <Modal
        visible={showWelcomeModal}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={clearWelcomeModal}
      >
        <WelcomeModal
          name={babyName || 'Baby'}
          onDismiss={clearWelcomeModal}
        />
      </Modal>

      {/* ── Child Switcher ── */}
      <ChildSwitcher />

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        {/* ── Greeting + child header ── */}
        <View style={s.greetingRow}>
          {activeChild && (
            <View style={s.avatarThumb}>
              {activeChild.photoUri ? (
                <Image source={{ uri: activeChild.photoUri }} style={s.avatarThumbImg} />
              ) : (
                <View style={[
                  s.avatarThumbDefault,
                  { backgroundColor: DEFAULT_AVATAR_BG[(activeChild.avatarIndex ?? 0) % 4] },
                ]}>
                  <Text style={s.avatarThumbEmoji}>
                    {DEFAULT_AVATAR_EMOJI[(activeChild.avatarIndex ?? 0) % 4]}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={s.greetingText}>
            <Text style={s.greeting}>{greeting}</Text>
            {babyName ? (
              <Text style={s.babyName}>👶 {babyName}{babyAge ? `  ·  ${babyAge}` : ''}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <Text style={s.sectionTitle}>{t('home.quick_stats')}</Text>
        <View style={s.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <Text style={s.statEmoji}>{stat.emoji}</Text>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Growth Snapshot ── */}
        <Text style={s.sectionTitle}>{t('home.growth_snapshot')}</Text>

        {hasBirthStats ? (
          <View style={s.growthCard}>
            <Text style={s.growthCardTitle}>{t('home.birth_measurements')} 📋</Text>
            <View style={s.birthStatsRow}>
              {activeChild?.birthWeight && (
                <View style={s.birthStatItem}>
                  <Text style={s.birthStatValue}>{activeChild.birthWeight}</Text>
                  <Text style={s.birthStatUnit}>kg</Text>
                  <Text style={s.birthStatLabel}>{t('home.birth_weight_label')}</Text>
                </View>
              )}
              {activeChild?.birthHeight && (
                <View style={s.birthStatItem}>
                  <Text style={s.birthStatValue}>{activeChild.birthHeight}</Text>
                  <Text style={s.birthStatUnit}>cm</Text>
                  <Text style={s.birthStatLabel}>{t('home.birth_height_label')}</Text>
                </View>
              )}
              {activeChild?.gestationalAge && (
                <View style={s.birthStatItem}>
                  <Text style={s.birthStatValue}>{activeChild.gestationalAge}</Text>
                  <Text style={s.birthStatUnit}>wks</Text>
                  <Text style={s.birthStatLabel}>{t('home.gestational_label')}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={s.addMeasurementBtn}>
              <Text style={s.addMeasurementText}>{t('home.add_first_measurement')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.growthCard}>
            <Text style={s.growthPlaceholder}>{t('home.ai_summary_placeholder')}</Text>
          </View>
        )}

        {/* ── Feature Grid ── */}
        <Text style={s.sectionTitle}>{t('home.features')}</Text>
        <View style={s.grid}>
          {FEATURES.map(({ key, emoji }) => (
            <TouchableOpacity key={key} style={s.featureCard}>
              <Text style={s.featureEmoji}>{emoji}</Text>
              <Text style={s.featureLabel}>{t(`home.${key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Dashboard Styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#FDF2F8' },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarThumb: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 2, borderColor: Colors.primaryPink },
  avatarThumbImg: { width: 52, height: 52, borderRadius: 26 },
  avatarThumbDefault: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarThumbEmoji: { fontSize: 26 },
  greetingText: { flex: 1 },
  greeting:     { fontSize: 20, fontWeight: '700', color: Colors.dark },
  babyName:     { fontSize: 13, color: Colors.primaryPink, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: 8 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  statLabel: { fontSize: 11, color: Colors.lightGray, marginTop: 2, textAlign: 'center' },

  growthCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#FCE7F3', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  growthCardTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 14 },
  growthPlaceholder: { color: Colors.lightGray, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  birthStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  birthStatItem: { flex: 1, backgroundColor: Colors.softPink, borderRadius: 12, padding: 12, alignItems: 'center' },
  birthStatValue: { fontSize: 22, fontWeight: '800', color: Colors.primaryPink },
  birthStatUnit: { fontSize: 12, color: Colors.primaryPink, fontWeight: '600', marginBottom: 4 },
  birthStatLabel: { fontSize: 11, color: Colors.midGray, textAlign: 'center' },
  addMeasurementBtn: { paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primaryPink, borderStyle: 'dashed', alignItems: 'center' },
  addMeasurementText: { color: Colors.primaryPink, fontWeight: '600', fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featureEmoji: { fontSize: 28, marginBottom: 6 },
  featureLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
});

// ── Welcome Modal Styles ───────────────────────────────────────────────────────

const wm = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sparkle: { position: 'absolute', fontSize: 22 },

  content: { alignItems: 'center', paddingHorizontal: 36 },

  babyEmoji: { fontSize: 96, marginBottom: 8 },

  flowerRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  flowerEmoji: { fontSize: 22 },

  title: {
    fontSize: 30, fontWeight: '800', color: Colors.dark,
    textAlign: 'center', marginBottom: 14, lineHeight: 38,
  },
  subtitle: {
    fontSize: 16, color: Colors.midGray,
    textAlign: 'center', lineHeight: 26, paddingHorizontal: 8,
  },

  skipBtn: {
    position: 'absolute', bottom: 52,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5, borderColor: Colors.primaryPink,
  },
  skipText: { color: Colors.primaryPink, fontWeight: '700', fontSize: 14 },
});
