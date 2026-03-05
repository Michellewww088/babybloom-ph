import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { key: 'vaccine',    emoji: '💉', color: '#EF4444' },
  { key: 'checkup',   emoji: '🏥', color: '#3B82F6' },
  { key: 'feeding',   emoji: '🍼', color: '#F97316' },
  { key: 'sleep',     emoji: '😴', color: '#8B5CF6' },
  { key: 'medication',emoji: '💊', color: '#10B981' },
  { key: 'custom',    emoji: '📝', color: '#6B7280' },
] as const;

export default function CalendarScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{t('calendar.title')}</Text>

      {/* Category legend */}
      <View style={s.legend}>
        {CATEGORIES.map(({ key, emoji, color }) => (
          <View key={key} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={s.legendText}>{emoji} {t(`calendar.${key}`)}</Text>
          </View>
        ))}
      </View>

      {/* Placeholder calendar area */}
      <View style={s.calendarPlaceholder}>
        <Text style={s.placeholderEmoji}>📅</Text>
        <Text style={s.placeholderText}>{t('calendar.no_events')}</Text>
      </View>

      {/* Add reminder button */}
      <TouchableOpacity style={s.addBtn}>
        <Text style={s.addBtnText}>+ {t('calendar.add_reminder')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#F9FAFB' },
  content:             { padding: 20, paddingBottom: 40 },
  title:               { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  legend:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  legendItem:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:                 { width: 10, height: 10, borderRadius: 5 },
  legendText:          { fontSize: 12, color: '#374151' },
  calendarPlaceholder: { backgroundColor: '#fff', borderRadius: 16, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  placeholderEmoji:    { fontSize: 48, marginBottom: 12 },
  placeholderText:     { color: '#9CA3AF', fontSize: 14 },
  addBtn:              { backgroundColor: '#F472B6', borderRadius: 14, padding: 16, alignItems: 'center' },
  addBtnText:          { color: '#fff', fontSize: 16, fontWeight: '700' },
});
