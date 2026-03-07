/**
 * encyclopedia.tsx — Parenting Guide
 * Cute BabyBloom green + pink theme
 */

import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const AGE_STAGES = [
  { key: 'pregnancy', emoji: '🤰', grad: ['#FFE0EC', '#FFBBD0'] as [string,string], accent: '#C2185B' },
  { key: 'newborn',   emoji: '👶', grad: ['#FFF0D0', '#FFE0A3'] as [string,string], accent: '#B07020' },
  { emoji: '🌱', label: '1–3M',  grad: ['#D8F5E8', '#A8ECC4'] as [string,string], accent: '#2A8A5A' },
  { emoji: '🌼', label: '3–6M',  grad: ['#FFF5C8', '#FFE8A3'] as [string,string], accent: '#A07020' },
  { emoji: '🌻', label: '6–9M',  grad: ['#FFE8D0', '#FFD0A8'] as [string,string], accent: '#C06020' },
  { emoji: '🎈', label: '9–12M', grad: ['#EDE8FF', '#D4C8FF'] as [string,string], accent: '#7050C8' },
  { emoji: '🎂', label: '1–2Y',  grad: ['#FFD8E8', '#FFB8CC'] as [string,string], accent: '#C0305A' },
] as const;

const TOPICS = [
  { key: 'feeding_nutrition', emoji: '🍼', grad: ['#FFF5DC', '#FFEAB0'] as [string,string], accent: '#B07A20' },
  { key: 'sleep_rest',        emoji: '🌙', grad: ['#EDE8FF', '#D4C8FF'] as [string,string], accent: '#7050C8' },
  { key: 'development',       emoji: '🌱', grad: ['#D8F5E8', '#A8ECC4'] as [string,string], accent: '#2A8A5A' },
  { key: 'health_illness',    emoji: '🩺', grad: ['#DDEEFF', '#BBD6FF'] as [string,string], accent: '#2A5AA0' },
  { key: 'safety',            emoji: '🛡️', grad: ['#FFE8D0', '#FFD0A8'] as [string,string], accent: '#C06020' },
  { key: 'mental_health',     emoji: '💜', grad: ['#F5E8FF', '#E4C8FF'] as [string,string], accent: '#8030B0' },
  { key: 'traditions',        emoji: '🏠', grad: ['#FFE0EC', '#FFBBD0'] as [string,string], accent: '#C2185B' },
] as const;

export default function EncyclopediaScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero banner ── */}
      <LinearGradient colors={['#C8F0D8', '#A8E8C0']} style={s.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.heroEmoji}>📖</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>{t('encyclopedia.subtitle')}</Text>
          <Text style={s.heroSub}>Trusted info, every step of the way 🌿</Text>
        </View>
      </LinearGradient>

      {/* ── Browse by age ── */}
      <Text style={s.sectionTitle}>👶 {t('encyclopedia.browse_age')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
        <View style={s.ageRow}>
          {AGE_STAGES.map((stage, i) => (
            <TouchableOpacity key={i} activeOpacity={0.8}>
              <LinearGradient colors={stage.grad} style={s.ageChip}>
                <Text style={s.ageEmoji}>{stage.emoji}</Text>
                <Text style={[s.ageLabel, { color: stage.accent }]}>
                  {'key' in stage ? t(`encyclopedia.${stage.key}`) : stage.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Browse by topic ── */}
      <Text style={s.sectionTitle}>🗂️ {t('encyclopedia.browse_topic')}</Text>
      <View style={s.topicGrid}>
        {TOPICS.map(({ key, emoji, grad, accent }) => (
          <TouchableOpacity key={key} activeOpacity={0.8} style={s.topicWrap}>
            <LinearGradient colors={grad} style={s.topicCard}>
              <Text style={s.topicEmoji}>{emoji}</Text>
              <Text style={[s.topicLabel, { color: accent }]}>{t(`encyclopedia.${key}`)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Featured PH article ── */}
      <LinearGradient colors={['#FFF0F6', '#FFE0EE']} style={s.featured} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.featuredTagRow}>
          <Text style={s.featuredTag}>🇵🇭 Philippines Special</Text>
        </View>
        <Text style={s.featuredTitle}>
          Malunggay at Kamote: Superfoods para sa Iyong Sanggol
        </Text>
        <Text style={s.featuredBody}>
          Discover the best local Filipino superfoods for your baby's complementary feeding journey.
        </Text>
        <TouchableOpacity style={s.readBtn} activeOpacity={0.8}>
          <LinearGradient colors={['#F06292', '#F48FB1']} style={s.readBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={s.readBtnText}>Read Article  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FFF8' },
  content:   { padding: 16, paddingBottom: 40 },

  // Hero
  heroBanner: {
    borderRadius: 22, padding: 18, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#3CAF78', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  heroEmoji: { fontSize: 42 },
  heroTitle: { fontSize: 14, fontWeight: '800', color: '#1A6A40', lineHeight: 18 },
  heroSub:   { fontSize: 12, color: '#3CAF78', fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A6A40', marginBottom: 10 },

  // Age chips
  ageRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 2, paddingBottom: 4 },
  ageChip: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center', gap: 5, minWidth: 78,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  ageEmoji: { fontSize: 26 },
  ageLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Topic grid
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  topicWrap: { width: '47.5%' },
  topicCard: {
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  topicEmoji: { fontSize: 22 },
  topicLabel: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 17 },

  // Featured
  featured: {
    borderRadius: 22, padding: 18,
    shadowColor: '#F06292', shadowOpacity: 0.14, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#FFBBD0',
  },
  featuredTagRow: { marginBottom: 8 },
  featuredTag:   { fontSize: 12, fontWeight: '800', color: '#C2185B', letterSpacing: 0.3 },
  featuredTitle: { fontSize: 15, fontWeight: '800', color: '#880E4F', marginBottom: 8, lineHeight: 21 },
  featuredBody:  { fontSize: 13, color: '#C2185B', lineHeight: 18, marginBottom: 14, opacity: 0.8 },
  readBtn:       { alignSelf: 'flex-start' },
  readBtnGrad:   { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9 },
  readBtnText:   { color: '#fff', fontWeight: '800', fontSize: 13 },
});
