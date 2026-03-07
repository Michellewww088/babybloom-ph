/**
 * vaccines.tsx — Vaccination Guide
 * Cute BabyBloom pink + blue theme
 */

import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const EPI_SCHEDULE = [
  { ageKey: 'at_birth', emoji: '🌟', vaccines: ['BCG', 'Hepatitis B (dose 1)'],                                free: true  },
  { ageKey: 'weeks_6',  emoji: '🌱', vaccines: ['DPT-HepB-Hib (1)', 'OPV (1)', 'PCV (1)', 'Rotavirus (1)'], free: true  },
  { ageKey: 'weeks_10', emoji: '🌼', vaccines: ['DPT-HepB-Hib (2)', 'OPV (2)', 'PCV (2)', 'Rotavirus (2)'], free: true  },
  { ageKey: 'weeks_14', emoji: '🌻', vaccines: ['DPT-HepB-Hib (3)', 'OPV (3)', 'IPV (1)', 'PCV (3)'],       free: true  },
  { ageKey: 'months_6', emoji: '🍼', vaccines: ['Influenza (dose 1)'],                                        free: false },
  { ageKey: 'months_9', emoji: '🐣', vaccines: ['MMR (dose 1)', 'Hepatitis A (dose 1)'],                      free: false },
  { ageKey: 'months_12',emoji: '🎂', vaccines: ['Varicella', 'Hepatitis A (dose 2)'],                         free: false },
] as const;

export default function VaccinesScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero banner ── */}
      <LinearGradient colors={['#DDEEFF', '#BBD6FF']} style={s.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.heroEmoji}>💉</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>{t('vaccines.subtitle')}</Text>
          <Text style={s.heroSub}>Keep your baby protected 🛡️</Text>
        </View>
      </LinearGradient>

      {/* ── Legend badges ── */}
      <View style={s.badges}>
        <LinearGradient colors={['#C8F7DC', '#A8ECC4']} style={s.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.badgeText}>✅  {t('vaccines.free_epi')}</Text>
        </LinearGradient>
        <LinearGradient colors={['#FFF0C8', '#FFE0A3']} style={s.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.badgeText}>💰  {t('vaccines.optional')}</Text>
        </LinearGradient>
      </View>

      {/* ── Vaccine schedule cards ── */}
      {EPI_SCHEDULE.map(({ ageKey, emoji, vaccines, free }) => (
        <View key={ageKey} style={[s.card, free ? s.cardFree : s.cardOptional]}>
          <View style={s.cardHeader}>
            <View style={[s.agePill, free ? s.agePillFree : s.agePillOptional]}>
              <Text style={s.ageEmoji}>{emoji}</Text>
              <Text style={[s.ageText, { color: free ? '#1A7A4A' : '#A05C00' }]}>
                {t(`vaccines.${ageKey}`)}
              </Text>
            </View>
            <View style={[s.miniBadge, free ? s.miniFree : s.miniOpt]}>
              <Text style={[s.miniBadgeText, { color: free ? '#1A7A4A' : '#A05C00' }]}>
                {free ? '✅ Free' : '💰 Optional'}
              </Text>
            </View>
          </View>

          {vaccines.map((v) => (
            <View key={v} style={s.vaccineRow}>
              <View style={[s.dot, { backgroundColor: free ? '#3CAF78' : '#E8A840' }]} />
              <Text style={s.vaccineName}>{v}</Text>
              <TouchableOpacity style={[s.markBtn, free ? s.markBtnFree : s.markBtnOpt]} activeOpacity={0.8}>
                <Text style={[s.markBtnText, { color: free ? '#1A7A4A' : '#A05C00' }]}>
                  {t('vaccines.mark_given')}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      {/* ── Find BHS / RHU CTA ── */}
      <TouchableOpacity activeOpacity={0.85}>
        <LinearGradient colors={['#60B8E0', '#90CAEE']} style={s.findBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.findBtnText}>🏥  {t('vaccines.find_center')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  content:   { padding: 16, paddingBottom: 40 },

  // Hero banner
  heroBanner: {
    borderRadius: 22, padding: 18, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#60B8E0', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  heroEmoji: { fontSize: 42 },
  heroTitle: { fontSize: 14, fontWeight: '800', color: '#1A4A7A', lineHeight: 18 },
  heroSub:   { fontSize: 12, color: '#5B9BD5', fontWeight: '600', marginTop: 2 },

  // Badges
  badges: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  badge: { flex: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#2D5A3D' },

  // Cards
  card: {
    borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardFree:     { backgroundColor: '#F0FFF7', borderWidth: 1.5, borderColor: '#A8ECC4' },
  cardOptional: { backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: '#FFE0A3' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  agePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  agePillFree:     { backgroundColor: '#C8F7DC' },
  agePillOptional: { backgroundColor: '#FFF0C8' },
  ageEmoji: { fontSize: 16 },
  ageText:  { fontSize: 14, fontWeight: '800' },

  miniBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  miniFree:  { backgroundColor: '#D8FAE8' },
  miniOpt:   { backgroundColor: '#FFF3CC' },
  miniBadgeText: { fontSize: 11, fontWeight: '700' },

  // Vaccine rows
  vaccineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  vaccineName: { fontSize: 13, color: '#374151', flex: 1, fontWeight: '500' },
  markBtn:     { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  markBtnFree: { backgroundColor: '#C8F7DC' },
  markBtnOpt:  { backgroundColor: '#FFF0C8' },
  markBtnText: { fontSize: 11, fontWeight: '700' },

  // Find center button
  findBtn: {
    borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#60B8E0', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  findBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
