import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const EPI_SCHEDULE = [
  { ageKey: 'at_birth', vaccines: ['BCG', 'Hepatitis B (dose 1)'],                     free: true  },
  { ageKey: 'weeks_6',  vaccines: ['DPT-HepB-Hib (1)', 'OPV (1)', 'PCV (1)', 'Rotavirus (1)'], free: true  },
  { ageKey: 'weeks_10', vaccines: ['DPT-HepB-Hib (2)', 'OPV (2)', 'PCV (2)', 'Rotavirus (2)'], free: true  },
  { ageKey: 'weeks_14', vaccines: ['DPT-HepB-Hib (3)', 'OPV (3)', 'IPV (1)', 'PCV (3)'],       free: true  },
  { ageKey: 'months_6', vaccines: ['Influenza (dose 1)'],                               free: false },
  { ageKey: 'months_9', vaccines: ['MMR (dose 1)', 'Hepatitis A (dose 1)'],             free: false },
  { ageKey: 'months_12',vaccines: ['Varicella', 'Hepatitis A (dose 2)'],               free: false },
] as const;

export default function VaccinesScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{t('vaccines.title')}</Text>
      <Text style={s.subtitle}>{t('vaccines.subtitle')}</Text>

      <View style={s.badges}>
        <View style={[s.badge, s.freeBadge]}><Text style={s.badgeText}>✅ {t('vaccines.free_epi')}</Text></View>
        <View style={[s.badge, s.optionalBadge]}><Text style={s.badgeText}>💰 {t('vaccines.optional')}</Text></View>
      </View>

      {EPI_SCHEDULE.map(({ ageKey, vaccines, free }) => (
        <View key={ageKey} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.age}>💉 {t(`vaccines.${ageKey}`)}</Text>
            <View style={[s.badge, free ? s.freeBadge : s.optionalBadge]}>
              <Text style={s.badgeText}>{free ? `✅ ${t('vaccines.free_epi')}` : `💰 ${t('vaccines.optional')}`}</Text>
            </View>
          </View>
          {vaccines.map((v) => (
            <View key={v} style={s.vaccineRow}>
              <Text style={s.vaccineName}>{v}</Text>
              <TouchableOpacity style={s.markBtn}>
                <Text style={s.markBtnText}>{t('vaccines.mark_given')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity style={s.findBtn}>
        <Text style={s.findBtnText}>🏥 {t('vaccines.find_center')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  content:      { padding: 20, paddingBottom: 40 },
  title:        { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle:     { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  badges:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  freeBadge:    { backgroundColor: '#D1FAE5' },
  optionalBadge:{ backgroundColor: '#FEF3C7' },
  badgeText:    { fontSize: 12, fontWeight: '600', color: '#374151' },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  age:          { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  vaccineRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  vaccineName:  { fontSize: 14, color: '#374151', flex: 1 },
  markBtn:      { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  markBtnText:  { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  findBtn:      { backgroundColor: '#3B82F6', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  findBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
