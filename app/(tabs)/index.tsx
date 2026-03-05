import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const FEATURES = [
  { key: 'feeding_log',     emoji: '🍼' },
  { key: 'sleep_tracker',   emoji: '😴' },
  { key: 'vaccination_log', emoji: '💉' },
  { key: 'vitamins_meds',   emoji: '💊' },
  { key: 'feeding_guide',   emoji: '🥗' },
  { key: 'insights',        emoji: '📊' },
] as const;

export default function HomeScreen() {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t('home.greeting_morning')
    : hour < 17 ? t('home.greeting_afternoon')
    : t('home.greeting_evening');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Greeting */}
      <Text style={s.greeting}>{greeting}</Text>

      {/* Quick Stats */}
      <Text style={s.sectionTitle}>{t('home.quick_stats')}</Text>
      <View style={s.statsRow}>
        {[
          { label: t('home.last_fed'),     value: '2h 30m', emoji: '🍼' },
          { label: t('home.sleep_today'),  value: '5h 40m', emoji: '😴' },
          { label: t('home.next_vaccine'), value: 'BCG 12d', emoji: '💉' },
          { label: t('home.weight'),       value: '5.2 kg',  emoji: '⚖️' },
        ].map((stat) => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statEmoji}>{stat.emoji}</Text>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Growth Snapshot */}
      <Text style={s.sectionTitle}>{t('home.growth_snapshot')}</Text>
      <View style={s.growthCard}>
        <Text style={s.growthPlaceholder}>{t('home.ai_summary_placeholder')}</Text>
      </View>

      {/* Feature Grid */}
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
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FDF2F8' },
  content:      { padding: 20, paddingBottom: 40 },
  greeting:     { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12, marginTop: 8 },
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, minWidth: '44%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statEmoji:    { fontSize: 24, marginBottom: 4 },
  statValue:    { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  statLabel:    { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  growthCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#FCE7F3' },
  growthPlaceholder: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard:  { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featureEmoji: { fontSize: 28, marginBottom: 6 },
  featureLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
