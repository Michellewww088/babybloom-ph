import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const AGE_STAGES = [
  { key: 'pregnancy', emoji: '🤰' },
  { key: 'newborn',   emoji: '👶' },
  { emoji: '1️⃣',     label: '1–3M'  },
  { emoji: '3️⃣',     label: '3–6M'  },
  { emoji: '6️⃣',     label: '6–9M'  },
  { emoji: '9️⃣',     label: '9–12M' },
  { emoji: '🎂',     label: '1–2Y'  },
] as const;

const TOPICS = [
  { key: 'feeding_nutrition', emoji: '🍼' },
  { key: 'sleep_rest',        emoji: '😴' },
  { key: 'development',       emoji: '🌱' },
  { key: 'health_illness',    emoji: '🩺' },
  { key: 'safety',            emoji: '🛡️' },
  { key: 'mental_health',     emoji: '💜' },
  { key: 'traditions',        emoji: '🏠' },
] as const;

export default function EncyclopediaScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{t('encyclopedia.title')}</Text>
      <Text style={s.subtitle}>{t('encyclopedia.subtitle')}</Text>

      <Text style={s.sectionTitle}>{t('encyclopedia.browse_age')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
        {AGE_STAGES.map((stage, i) => (
          <TouchableOpacity key={i} style={s.ageChip}>
            <Text style={s.ageEmoji}>{stage.emoji}</Text>
            <Text style={s.ageLabel}>
              {'key' in stage ? t(`encyclopedia.${stage.key}`) : stage.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.sectionTitle}>{t('encyclopedia.browse_topic')}</Text>
      <View style={s.topicGrid}>
        {TOPICS.map(({ key, emoji }) => (
          <TouchableOpacity key={key} style={s.topicCard}>
            <Text style={s.topicEmoji}>{emoji}</Text>
            <Text style={s.topicLabel}>{t(`encyclopedia.${key}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured PH article */}
      <View style={s.featured}>
        <Text style={s.featuredTag}>🇵🇭 Philippines Special</Text>
        <Text style={s.featuredTitle}>Malunggay at Kamote: Superfoods para sa Iyong Sanggol</Text>
        <Text style={s.featuredBody}>Discover the best local Filipino superfoods for your baby's complementary feeding journey.</Text>
        <TouchableOpacity style={s.readBtn}>
          <Text style={s.readBtnText}>Read →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  content:      { padding: 20, paddingBottom: 40 },
  title:        { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  subtitle:     { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 10 },
  hScroll:      { marginBottom: 24 },
  ageChip:      { backgroundColor: '#FDF2F8', borderRadius: 14, padding: 14, alignItems: 'center', marginRight: 10, minWidth: 80, borderWidth: 1, borderColor: '#FBCFE8' },
  ageEmoji:     { fontSize: 26, marginBottom: 4 },
  ageLabel:     { fontSize: 12, fontWeight: '600', color: '#BE185D', textAlign: 'center' },
  topicGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  topicCard:    { width: '46%', backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  topicEmoji:   { fontSize: 24 },
  topicLabel:   { fontSize: 13, fontWeight: '600', color: '#374151', flex: 1 },
  featured:     { backgroundColor: '#FDF2F8', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#FBCFE8' },
  featuredTag:  { fontSize: 12, fontWeight: '700', color: '#BE185D', marginBottom: 6 },
  featuredTitle:{ fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 8, lineHeight: 20 },
  featuredBody: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
  readBtn:      { alignSelf: 'flex-start' },
  readBtnText:  { color: '#F472B6', fontWeight: '700', fontSize: 14 },
});
