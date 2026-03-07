import { useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Image, Dimensions,
} from 'react-native';
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


// ── Home Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t }                                         = useTranslation();
  const { activeChild } = useChildStore();

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
  screen:  { flex: 1, backgroundColor: '#FFF0F4' },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // Greeting row
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  avatarThumb: {
    width: 56, height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: Colors.primaryPink,
  },
  avatarThumbImg: { width: 56, height: 56, borderRadius: 28 },
  avatarThumbDefault: {
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarThumbEmoji: { fontSize: 28 },
  greetingText:  { flex: 1 },
  greeting:      { fontSize: 18, fontWeight: '700', color: Colors.dark },
  babyName:      { fontSize: 13, color: Colors.primaryPink, fontWeight: '600', marginTop: 2 },

  // Section titles
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: Colors.primaryPink,
    marginBottom: 10, marginTop: 6,
  },

  // Quick Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#fff',
    borderRadius: 16, padding: 14,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#FCE4EC',
    shadowColor: '#E8637C', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  statEmoji: { fontSize: 26, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.dark },
  statLabel: { fontSize: 11, color: Colors.lightGray, marginTop: 2, textAlign: 'center' },

  // Growth Snapshot card
  growthCard: {
    backgroundColor: '#fff',
    borderRadius: 18, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#FCE4EC',
    shadowColor: '#E8637C', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  growthCardTitle: {
    fontSize: 14, fontWeight: '800', color: Colors.primaryPink,
    marginBottom: 14,
  },
  growthPlaceholder: {
    color: Colors.lightGray, fontSize: 14, textAlign: 'center', lineHeight: 20,
  },

  // Birth stats inside growth card
  birthStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  birthStatItem: {
    flex: 1,
    backgroundColor: '#FFF0F4',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  birthStatValue: {
    fontSize: 22, fontWeight: '800', color: Colors.primaryPink,
  },
  birthStatUnit: {
    fontSize: 12, color: Colors.primaryPink, fontWeight: '600', marginBottom: 4,
  },
  birthStatLabel: {
    fontSize: 11, color: Colors.midGray, textAlign: 'center',
  },
  addMeasurementBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryPink,
    borderStyle: 'dashed',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  addMeasurementText: {
    color: Colors.primaryPink, fontWeight: '700', fontSize: 13,
  },

  // Feature grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    width: '30%',
    backgroundColor: '#FFF5F7',
    borderRadius: 16, padding: 14,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FCE4EC',
    shadowColor: '#E8637C', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  featureEmoji: { fontSize: 32, marginBottom: 8 },
  featureLabel: { fontSize: 11, fontWeight: '700', color: Colors.primaryPink, textAlign: 'center', lineHeight: 15 },
});

