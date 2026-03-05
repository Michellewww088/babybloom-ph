import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Colors from '../../constants/Colors';

const MILESTONE_AGES = [
  { ageKey: 'months_2',  items: ['Smiles at people 😊', 'Tracks objects 👀'] },
  { ageKey: 'months_4',  items: ['Holds head steady 💪', 'Laughs out loud 😂'] },
  { ageKey: 'months_6',  items: ['Sits with support 🪑', 'Recognizes faces 🤗'] },
  { ageKey: 'months_9',  items: ["Says 'mama/dada' 🗣️", 'Pulls to stand 🧍'] },
  { ageKey: 'months_12', items: ['Takes first steps 🚶', 'Waves bye-bye 👋'] },
] as const;

export default function MilestonesScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{t('milestones.title')}</Text>

      {/* Quick actions */}
      <View style={s.actionsRow}>
        {[
          { label: t('milestones.memory_book'),  emoji: '📔' },
          { label: t('milestones.first_times'),  emoji: '⭐' },
          { label: t('milestones.growth_photos'),emoji: '📸' },
          { label: t('milestones.checklist'),    emoji: '✅' },
        ].map(({ label, emoji }) => (
          <TouchableOpacity key={label} style={s.actionCard}>
            <Text style={s.actionEmoji}>{emoji}</Text>
            <Text style={s.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Milestone checklist by age */}
      {MILESTONE_AGES.map(({ ageKey, items }) => (
        <View key={ageKey} style={s.card}>
          <Text style={s.age}>{t(`milestones.${ageKey}`)}</Text>
          {items.map((item) => (
            <TouchableOpacity key={item} style={s.itemRow}>
              <View style={s.checkbox} />
              <Text style={s.itemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <TouchableOpacity style={s.addBtn}>
        <Text style={s.addBtnText}>+ {t('milestones.add_milestone')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  content:     { padding: 20, paddingBottom: 40 },
  title:       { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  actionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionCard:  { width: '46%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  age:         { fontSize: 15, fontWeight: '700', color: Colors.primaryPink, marginBottom: 10 },
  itemRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  checkbox:    { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB' },
  itemText:    { fontSize: 14, color: '#374151', flex: 1 },
  addBtn:      { backgroundColor: Colors.primaryPink, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  addBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
