/**
 * milestones.tsx — Milestones & Records
 * Cute BabyBloom pink + warm theme
 */

import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const MILESTONE_AGES = [
  {
    ageKey: 'months_2', emoji: '😊',
    color: '#F06292',
    items: ['Smiles at people 😊', 'Tracks objects 👀', 'Makes cooing sounds 🎵'],
  },
  {
    ageKey: 'months_4', emoji: '😂',
    color: '#E87090',
    items: ['Holds head steady 💪', 'Laughs out loud 😂', 'Pushes up on arms 🤸'],
  },
  {
    ageKey: 'months_6', emoji: '🪑',
    color: '#FF8FAB',
    items: ['Sits with support 🪑', 'Recognizes faces 🤗', 'Responds to name 📣'],
  },
  {
    ageKey: 'months_9', emoji: '🗣️',
    color: '#F06292',
    items: ["Says 'mama/dada' 🗣️", 'Pulls to stand 🧍', 'Pincer grasp 🤌'],
  },
  {
    ageKey: 'months_12', emoji: '🚶',
    color: '#E87090',
    items: ['Takes first steps 🚶', 'Waves bye-bye 👋', 'Says 2–3 words 🗨️'],
  },
] as const;

const QUICK_ACTIONS = [
  { label: 'milestones.memory_book',  emoji: '📔', grad: ['#FFE0EC', '#FFBBD0'] as [string,string], accent: '#C2185B' },
  { label: 'milestones.first_times',  emoji: '⭐', grad: ['#FFF5C8', '#FFE8A3'] as [string,string], accent: '#A07020' },
  { label: 'milestones.growth_photos',emoji: '📸', grad: ['#D8F5E8', '#A8ECC4'] as [string,string], accent: '#2A8A5A' },
  { label: 'milestones.checklist',    emoji: '✅', grad: ['#EDE8FF', '#D4C8FF'] as [string,string], accent: '#7050C8' },
] as const;

export default function MilestonesScreen() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero banner ── */}
      <LinearGradient colors={['#FFDDE8', '#FFB3C6']} style={s.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={s.heroEmoji}>⭐</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Baby's Big Moments</Text>
          <Text style={s.heroSub}>Capture every precious milestone 📸</Text>
        </View>
      </LinearGradient>

      {/* ── Quick actions ── */}
      <Text style={s.sectionTitle}>🌸 Quick Access</Text>
      <View style={s.actionsGrid}>
        {QUICK_ACTIONS.map(({ label, emoji, grad, accent }) => (
          <TouchableOpacity key={label} activeOpacity={0.82} style={s.actionWrap}>
            <LinearGradient colors={grad} style={s.actionCard}>
              <Text style={s.actionEmoji}>{emoji}</Text>
              <Text style={[s.actionLabel, { color: accent }]}>{t(label)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Milestone checklist ── */}
      <Text style={s.sectionTitle}>🏆 Development Checklist</Text>
      {MILESTONE_AGES.map(({ ageKey, emoji, color, items }) => (
        <View key={ageKey} style={s.card}>
          {/* Age header */}
          <LinearGradient colors={['#FFDDE8', '#FFE8F2']} style={s.ageHeader}>
            <Text style={s.ageHeaderEmoji}>{emoji}</Text>
            <Text style={[s.ageHeaderText, { color }]}>{t(`milestones.${ageKey}`)}</Text>
            <View style={[s.ageHeaderDot, { backgroundColor: color }]} />
          </LinearGradient>

          {/* Milestone items */}
          <View style={s.itemsList}>
            {items.map((item) => {
              const itemKey = `${ageKey}:${item}`;
              const isDone = !!checked[itemKey];
              return (
                <TouchableOpacity
                  key={item}
                  style={s.itemRow}
                  activeOpacity={0.7}
                  onPress={() => toggle(itemKey)}
                >
                  <View style={[s.checkbox, isDone && { backgroundColor: color, borderColor: color }]}>
                    {isDone && <Text style={s.checkmark}>✓</Text>}
                  </View>
                  <Text style={[s.itemText, isDone && { color: '#BBB', textDecorationLine: 'line-through' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* ── Add Milestone CTA ── */}
      <TouchableOpacity activeOpacity={0.85}>
        <LinearGradient colors={['#F06292', '#F48FB1']} style={s.addBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.addBtnText}>🌸  {t('milestones.add_milestone')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F8' },
  content:   { padding: 16, paddingBottom: 40 },

  // Hero
  heroBanner: {
    borderRadius: 22, padding: 18, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#F06292', shadowOpacity: 0.22, shadowRadius: 10, elevation: 4,
  },
  heroEmoji: { fontSize: 42 },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#880E4F', lineHeight: 20 },
  heroSub:   { fontSize: 12, color: '#E87090', fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#C2185B', marginBottom: 10 },

  // Quick actions grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  actionWrap:  { width: '47.5%' },
  actionCard: {
    borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },

  // Milestone cards
  card: {
    backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#F06292', shadowOpacity: 0.10, shadowRadius: 10, elevation: 3,
    borderWidth: 1, borderColor: '#FCE4EC',
  },
  ageHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  ageHeaderEmoji: { fontSize: 20 },
  ageHeaderText:  { fontSize: 15, fontWeight: '800', flex: 1 },
  ageHeaderDot:   { width: 8, height: 8, borderRadius: 4 },

  // Items
  itemsList: { paddingHorizontal: 16, paddingBottom: 12 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#FCE4EC',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#F8BBD9',
    alignItems: 'center', justifyContent: 'center',
  },
  checkmark: { fontSize: 13, color: '#fff', fontWeight: '900' },
  itemText:  { fontSize: 14, color: '#444', flex: 1, fontWeight: '500' },

  // Add button
  addBtn: {
    borderRadius: 18, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#F06292', shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
