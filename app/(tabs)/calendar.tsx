/**
 * calendar.tsx — Calendar & Reminders
 * Cute BabyBloom pink theme
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { key: 'vaccine',    emoji: '💉', grad: ['#FFDDE8', '#FFB3C6'] as [string,string], accent: '#E87090' },
  { key: 'checkup',   emoji: '🏥', grad: ['#DDEEFF', '#B3D4FF'] as [string,string], accent: '#5B9BD5' },
  { key: 'feeding',   emoji: '🍼', grad: ['#FFE8D0', '#FFD1A3'] as [string,string], accent: '#E88045' },
  { key: 'sleep',     emoji: '🌙', grad: ['#EDE8FF', '#D4C8FF'] as [string,string], accent: '#9B89F7' },
  { key: 'medication',emoji: '💊', grad: ['#D8F5E8', '#A8E8C4'] as [string,string], accent: '#3CAF78' },
  { key: 'custom',    emoji: '📝', grad: ['#F0F0F0', '#E0E0E0'] as [string,string], accent: '#888' },
] as const;

// Simple cute calendar grid (static placeholder)
const DAYS_LABEL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function CalendarScreen() {
  const { t } = useTranslation();
  const today = new Date().getDate();

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Category chips ── */}
      <Text style={s.sectionTitle}>📋 Event Types</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        <View style={s.chipRow}>
          {CATEGORIES.map(({ key, emoji, grad, accent }) => (
            <TouchableOpacity key={key} activeOpacity={0.8}>
              <LinearGradient colors={grad} style={s.chip}>
                <Text style={s.chipEmoji}>{emoji}</Text>
                <Text style={[s.chipLabel, { color: accent }]}>{t(`calendar.${key}`)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Mini Calendar ── */}
      <Text style={s.sectionTitle}>📅 March 2026</Text>
      <View style={s.calCard}>
        {/* Day labels */}
        <View style={s.dayLabelsRow}>
          {DAYS_LABEL.map((d) => (
            <Text key={d} style={s.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Day numbers grid */}
        <View style={s.daysGrid}>
          {/* offset for March 2026 (Sunday start, March 1 = Sunday = index 0) */}
          {DAYS.map((d) => {
            const isToday = d === today;
            return (
              <TouchableOpacity
                key={d}
                style={[s.dayCell, isToday && s.dayCellToday]}
                activeOpacity={0.7}
              >
                <Text style={[s.dayNum, isToday && s.dayNumToday]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* No events placeholder */}
        <View style={s.noEventsBanner}>
          <Text style={s.noEventsEmoji}>🌸</Text>
          <Text style={s.noEventsText}>{t('calendar.no_events')}</Text>
        </View>
      </View>

      {/* ── Add Reminder CTA ── */}
      <TouchableOpacity activeOpacity={0.85}>
        <LinearGradient colors={['#F06292', '#F48FB1']} style={s.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.addBtnText}>🌸  {t('calendar.add_reminder')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  content:   { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#C2185B', marginBottom: 10 },

  chipRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 2, paddingBottom: 4 },
  chip: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', gap: 4, minWidth: 76,
    shadowColor: '#E87090', shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  chipEmoji: { fontSize: 20 },
  chipLabel: { fontSize: 11, fontWeight: '700' },

  // Calendar card
  calCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 16, marginBottom: 18,
    shadowColor: '#E87090', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: '#FCE4EC',
  },

  dayLabelsRow: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#F06292' },

  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  dayCellToday: { backgroundColor: '#F06292' },
  dayNum: { fontSize: 13, color: '#555', fontWeight: '500' },
  dayNumToday: { color: '#fff', fontWeight: '800' },

  noEventsBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 14, paddingVertical: 10,
    backgroundColor: '#FFF0F4', borderRadius: 12,
  },
  noEventsEmoji: { fontSize: 18 },
  noEventsText:  { fontSize: 13, color: '#E87090', fontWeight: '600' },

  addBtn: {
    borderRadius: 18, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#F06292', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
