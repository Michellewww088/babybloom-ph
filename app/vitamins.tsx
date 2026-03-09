/**
 * vitamins.tsx — Vitamins & Medications
 * BMAD: WHO/DOH recs · AI analysis card · GP tracker · trilingual
 * Better than AsianParents: smart recs, adherence tracking, GP countdown,
 * antibiotic warning, streaks, AI-powered analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Modal, TextInput, Switch, Alert,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Circle, Rect, Line, Ellipse,
  Defs, LinearGradient as SvgGrad, Stop,
} from 'react-native-svg';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '../constants/Colors';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import { useVitaminStore, VitaminEntry, GPVisit, EntryType, Frequency } from '../store/vitaminStore';
import {
  VITAMIN_RECOMMENDATIONS, VITAMIN_QUICK_OPTIONS, MEDICATION_QUICK_OPTIONS,
  FREQUENCY_OPTIONS, getRecommendationsForAge, isGPEligible,
  getDaysUntilNextGP, getNextGPMonth, VitaminRec,
} from '../constants/vitamins-guide';
import { AteAISummaryCard } from '../components/ai/AteAI';

const { width: W } = Dimensions.get('window');
const PAD = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Pill SVG icon
// ─────────────────────────────────────────────────────────────────────────────
function PillIcon({ size = 22, color = Colors.primaryPink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx="12" cy="12" rx="9" ry="5.5" fill="none"
        stroke={color} strokeWidth="2" transform="rotate(-45 12 12)" />
      <Line x1="6.5" y1="6.5" x2="17.5" y2="17.5"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StarIcon({ size = 16, color = Colors.gold }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L14.6 9.3L22.4 9.3L16 14.1L18.6 21.4L12 16.8L5.4 21.4L8 14.1L1.6 9.3L9.4 9.3Z"
        fill={color} />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = Colors.mint }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function BabyIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="16" r="10" fill="#FFE0B2" />
      <Circle cx="16" cy="15" r="1.5" fill="#5D4037" />
      <Circle cx="24" cy="15" r="1.5" fill="#5D4037" />
      <Path d="M17 21 Q20 24 23 21" stroke="#E91E63" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Circle cx="14" cy="17" r="2.5" fill="#FFCCBC" />
      <Circle cx="26" cy="17" r="2.5" fill="#FFCCBC" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Adherence ring
// ─────────────────────────────────────────────────────────────────────────────
function AdherenceRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const r      = (size - 6) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (percent / 100) * circ;
  const color  = percent >= 80 ? Colors.mint : percent >= 50 ? Colors.gold : '#FF6B6B';
  return (
    <Svg width={size} height={size}>
      <Circle cx={size/2} cy={size/2} r={r} stroke="#F0F0F5" strokeWidth="5" fill="none" />
      <Circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="5" fill="none"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <Path d="" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority badge
// ─────────────────────────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high:   { bg: '#FFE4EE', text: Colors.primaryPink, label: '★ High' },
    medium: { bg: '#FFF8E8', text: Colors.gold,        label: '◆ Med'  },
    low:    { bg: '#E8F5E9', text: Colors.mint,        label: '○ Low'  },
  }[priority];
  return (
    <View style={[s.badge, { backgroundColor: config.bg }]}>
      <Text style={[s.badgeTxt, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Type chip
// ─────────────────────────────────────────────────────────────────────────────
function TypeChip({ type }: { type: EntryType }) {
  const config: Record<EntryType, { bg: string; color: string; label: string }> = {
    vitamin:    { bg: '#E8F5FF', color: Colors.blue,        label: '💊 Vitamin'    },
    supplement: { bg: '#E8FFF4', color: Colors.mint,        label: '🌿 Supplement' },
    mineral:    { bg: '#FFF3E0', color: '#E65100',          label: '⚗️ Mineral'    },
    medication: { bg: '#FCE4EC', color: Colors.primaryPink, label: '💉 Medication' },
  };
  const c = config[type];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeTxt, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommended vitamin card (from WHO/DOH)
// ─────────────────────────────────────────────────────────────────────────────
function RecommendationCard({
  rec, isLogged, lang, onQuickAdd,
}: {
  rec: VitaminRec;
  isLogged: boolean;
  lang: string;
  onQuickAdd: (rec: VitaminRec) => void;
}) {
  const reason = rec.reason[lang as keyof typeof rec.reason] ?? rec.reason.en;
  return (
    <View style={[s.recCard, isLogged && s.recCardDone]}>
      <View style={s.recHeader}>
        <View style={{ flex: 1 }}>
          <View style={s.recNameRow}>
            {rec.isFreeGovProgram && (
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeTxt}>🏥 FREE</Text>
              </View>
            )}
            <Text style={s.recName}>{rec.name}</Text>
            {isLogged && <CheckIcon size={16} />}
          </View>
          <Text style={s.recDose}>{rec.dose}</Text>
        </View>
        <PriorityBadge priority={rec.priority} />
      </View>

      <Text style={s.recReason} numberOfLines={3}>{reason}</Text>

      <View style={s.recFooter}>
        <Text style={s.recSource}>📚 {rec.source}</Text>
        {!isLogged && (
          <TouchableOpacity style={s.addRecBtn} onPress={() => onQuickAdd(rec)}>
            <Text style={s.addRecBtnTxt}>+ Log</Text>
          </TouchableOpacity>
        )}
        {isLogged && (
          <View style={s.loggedPill}>
            <CheckIcon size={12} />
            <Text style={s.loggedTxt}>Logged ✓</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry card (active / past)
// ─────────────────────────────────────────────────────────────────────────────
function EntryCard({
  entry, onEdit, onDelete, onLogDose, todayStatus, adherence,
}: {
  entry: VitaminEntry;
  onEdit: () => void;
  onDelete: () => void;
  onLogDose: (taken: boolean) => void;
  todayStatus: { taken: boolean } | undefined;
  adherence: number;
}) {
  const { t } = useTranslation();
  const tKey  = (k: string) => t(k) as string;
  const isPast = entry.endDate !== null && entry.endDate < new Date().toISOString().split('T')[0];

  return (
    <View style={[s.entryCard, isPast && { opacity: 0.72 }]}>
      {/* Antibiotic warning banner */}
      {entry.isAntibiotic && !isPast && (
        <View style={s.antibioticBanner}>
          <Text style={s.antibioticTxt}>
            ⚠️ {tKey('vitamins.antibiotic_warning')}
          </Text>
        </View>
      )}

      <View style={s.entryRow}>
        {/* Left: adherence ring */}
        {!isPast && (
          <View style={s.ringWrap}>
            <AdherenceRing percent={adherence} />
            <Text style={s.ringPct}>{adherence}%</Text>
          </View>
        )}

        {/* Center: info */}
        <View style={{ flex: 1, marginLeft: isPast ? 0 : 10 }}>
          <Text style={s.entryName}>{entry.name}</Text>
          <View style={s.entryChips}>
            <TypeChip type={entry.type} />
          </View>
          <Text style={s.entryMeta}>{entry.dose} · {entry.frequency.replace('_', ' ')}</Text>
          {entry.reminderTime && (
            <Text style={s.entryReminder}>⏰ {entry.reminderTime}</Text>
          )}
          {entry.prescribedBy && (
            <Text style={s.entryMeta}>👨‍⚕️ {entry.prescribedBy}</Text>
          )}
        </View>

        {/* Right: today status + actions */}
        <View style={s.entryRight}>
          {!isPast && entry.frequency !== 'as_needed' && (
            <TouchableOpacity
              style={[s.doseBtn, todayStatus?.taken && s.doseBtnTaken]}
              onPress={() => onLogDose(!todayStatus?.taken)}
            >
              <Text style={[s.doseBtnTxt, todayStatus?.taken && { color: '#fff' }]}>
                {todayStatus?.taken ? '✓' : tKey('vitamins.log_dose')}
              </Text>
            </TouchableOpacity>
          )}
          <View style={s.entryActions}>
            <TouchableOpacity onPress={onEdit} style={s.iconBtn}>
              <Text style={s.iconBtnTxt}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={s.iconBtn}>
              <Text style={s.iconBtnTxt}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {entry.notes ? <Text style={s.entryNotes}>📝 {entry.notes}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GP Tracker modal
// ─────────────────────────────────────────────────────────────────────────────
function GPTrackerModal({
  visible, onClose, childId, childName, ageMonths,
}: {
  visible: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  ageMonths: number;
}) {
  const { t: tRaw } = useTranslation();
  const t    = tRaw as (k: string, o?: object) => string;
  const tKey = (k: string, o?: object) => t(k, o);
  const { addGPVisit, deleteGPVisit, getGPVisitsForChild } = useVitaminStore();
  const visits = getGPVisitsForChild(childId);

  const [showForm,   setShowForm]   = useState(false);
  const [formDate,   setFormDate]   = useState(new Date().toISOString().split('T')[0]);
  const [formBHS,    setFormBHS]    = useState('');
  const [formVitA,   setFormVitA]   = useState(true);
  const [formDeworm, setFormDeworm] = useState(true);
  const [formNotes,  setFormNotes]  = useState('');

  const daysUntil = getDaysUntilNextGP();
  const nextGP    = getNextGPMonth();

  function handleSave() {
    if (!formBHS.trim()) { Alert.alert('Required', 'Please enter the BHS / clinic name.'); return; }
    addGPVisit({
      childId,
      date:      formDate,
      bhsName:   formBHS.trim(),
      vitaminA:  formVitA,
      deworming: formDeworm,
      notes:     formNotes.trim(),
    });
    setShowForm(false);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormBHS('');
    setFormVitA(true);
    setFormDeworm(true);
    setFormNotes('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
        {/* Header */}
        <LinearGradient colors={['#FFB74D', '#FFC870']} style={gp.header}>
          <Text style={gp.headerTitle}>🌟 {tKey('vitamins.gp.title')}</Text>
          <TouchableOpacity onPress={onClose} style={gp.closeBtn}>
            <Text style={gp.closeTxt}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: PAD }}>
          {/* Info card */}
          <View style={gp.infoCard}>
            <Text style={gp.infoTitle}>💊 {tKey('vitamins.gp.what_is')}</Text>
            <Text style={gp.infoDesc}>{tKey('vitamins.gp.description')}</Text>
            <View style={gp.infoRow}>
              <Text style={gp.infoItem}>✅ {tKey('vitamins.gp.vitamin_a')}</Text>
              <Text style={gp.infoItem}>✅ {tKey('vitamins.gp.deworming')}</Text>
            </View>
            <Text style={gp.infoFree}>🏥 {tKey('vitamins.gp.free_at_bhs')}</Text>
          </View>

          {/* Countdown */}
          {isGPEligible(ageMonths) && (
            <View style={gp.countdownCard}>
              <StarIcon size={20} color={Colors.gold} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={gp.countdownLabel}>{tKey('vitamins.gp.next_visit')}</Text>
                <Text style={gp.countdownVal}>
                  {nextGP.name} · {daysUntil === 0 ? 'Today!' : `${daysUntil} days away`}
                </Text>
              </View>
            </View>
          )}

          {/* Log visit button */}
          {!showForm && (
            <TouchableOpacity style={gp.logBtn} onPress={() => setShowForm(true)}>
              <Text style={gp.logBtnTxt}>+ {tKey('vitamins.gp.log_visit')}</Text>
            </TouchableOpacity>
          )}

          {/* Form */}
          {showForm && (
            <View style={gp.form}>
              <Text style={gp.formTitle}>📋 {tKey('vitamins.gp.log_visit')}</Text>

              <Text style={s.label}>{tKey('vitamins.gp.date')}</Text>
              <TextInput style={s.input} value={formDate}
                onChangeText={setFormDate} placeholder="YYYY-MM-DD" />

              <Text style={s.label}>{tKey('vitamins.gp.bhs_name')}</Text>
              <TextInput style={s.input} value={formBHS}
                onChangeText={setFormBHS}
                placeholder={tKey('vitamins.gp.bhs_placeholder')} />

              <Text style={s.label}>{tKey('vitamins.gp.received')}</Text>
              <View style={gp.checkRow}>
                <TouchableOpacity style={[gp.check, formVitA && gp.checkActive]}
                  onPress={() => setFormVitA(v => !v)}>
                  <Text style={gp.checkTxt}>{formVitA ? '✓' : '○'} Vitamin A</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[gp.check, formDeworm && gp.checkActive]}
                  onPress={() => setFormDeworm(v => !v)}>
                  <Text style={gp.checkTxt}>{formDeworm ? '✓' : '○'} Deworming</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>{tKey('vitamins.fields.notes')}</Text>
              <TextInput style={[s.input, { height: 70 }]} value={formNotes}
                onChangeText={setFormNotes} multiline placeholder="Optional notes..." />

              <View style={s.modalFooter}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={s.cancelTxt}>{tKey('vitamins.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                  <Text style={s.saveTxt}>{tKey('vitamins.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Past visits */}
          <Text style={s.sectionTitle}>{tKey('vitamins.gp.past_visits')}</Text>
          {visits.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🌿</Text>
              <Text style={s.emptyTxt}>{tKey('vitamins.gp.no_visits')}</Text>
            </View>
          ) : visits.map(v => (
            <View key={v.id} style={gp.visitCard}>
              <View style={{ flex: 1 }}>
                <Text style={gp.visitDate}>{v.date}</Text>
                <Text style={gp.visitBHS}>{v.bhsName}</Text>
                <View style={gp.visitPills}>
                  {v.vitaminA  && <View style={gp.pill}><Text style={gp.pillTxt}>Vitamin A ✓</Text></View>}
                  {v.deworming && <View style={gp.pill}><Text style={gp.pillTxt}>Deworming ✓</Text></View>}
                </View>
                {v.notes ? <Text style={s.entryNotes}>📝 {v.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() =>
                Alert.alert('Delete?', 'Remove this GP visit record?', [
                  { text: 'Cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteGPVisit(v.id) },
                ])
              }>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add / Edit Entry Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddEditModal({
  visible, onClose, onSave,
  editEntry, childId, isMedication,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<VitaminEntry>) => void;
  editEntry?: VitaminEntry | null;
  childId: string;
  isMedication: boolean;
}) {
  const { t } = useTranslation();
  const tKey  = (k: string) => t(k) as string;

  const quickOpts = isMedication ? MEDICATION_QUICK_OPTIONS : VITAMIN_QUICK_OPTIONS;

  const [name,        setName]        = useState(editEntry?.name        ?? '');
  const [type,        setType]        = useState<EntryType>(
    editEntry?.type ?? (isMedication ? 'medication' : 'vitamin'));
  const [dose,        setDose]        = useState(editEntry?.dose        ?? '');
  const [frequency,   setFrequency]   = useState<Frequency>(editEntry?.frequency ?? 'once_daily');
  const [remTime,     setRemTime]     = useState(editEntry?.reminderTime ?? '08:00');
  const [remEnabled,  setRemEnabled]  = useState(editEntry?.reminderEnabled ?? true);
  const [startDate,   setStartDate]   = useState(
    editEntry?.startDate ?? new Date().toISOString().split('T')[0]);
  const [endDate,     setEndDate]     = useState(editEntry?.endDate ?? '');
  const [notes,       setNotes]       = useState(editEntry?.notes       ?? '');
  // Medication extras
  const [prescribedBy, setPrescribedBy] = useState(editEntry?.prescribedBy ?? '');
  const [diagnosis,    setDiagnosis]    = useState(editEntry?.diagnosis    ?? '');
  const [isAntibiotic, setIsAntibiotic] = useState(editEntry?.isAntibiotic ?? false);

  // Reset when opening for new entry
  React.useEffect(() => {
    if (visible && !editEntry) {
      setName(''); setDose(''); setFrequency('once_daily');
      setRemTime('08:00'); setRemEnabled(true);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(''); setNotes('');
      setPrescribedBy(''); setDiagnosis(''); setIsAntibiotic(false);
      setType(isMedication ? 'medication' : 'vitamin');
    }
  }, [visible, editEntry, isMedication]);

  function handleSave() {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a name.'); return; }
    if (!dose.trim()) { Alert.alert('Required', 'Please enter the dose.'); return; }
    onSave({
      childId,
      name: name.trim(),
      type,
      dose: dose.trim(),
      frequency,
      reminderTime:    remEnabled ? remTime : null,
      reminderEnabled: remEnabled,
      startDate,
      endDate:         endDate.trim() || null,
      notes:           notes.trim(),
      prescribedBy:    prescribedBy.trim() || undefined,
      diagnosis:       diagnosis.trim() || undefined,
      isAntibiotic,
    });
    onClose();
  }

  const typeOptions: { key: EntryType; label: string }[] = isMedication
    ? [{ key: 'medication', label: '💉 Medication' }]
    : [
        { key: 'vitamin',    label: '💊 Vitamin'    },
        { key: 'supplement', label: '🌿 Supplement' },
        { key: 'mineral',    label: '⚗️ Mineral'    },
      ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
          {/* Header */}
          <LinearGradient
            colors={isMedication ? ['#5BC8F5', '#90D8F8'] : ['#27AE7A', '#4DD0A0']}
            style={m.header}
          >
            <Text style={m.headerTitle}>
              {editEntry ? tKey('vitamins.edit_entry') : (
                isMedication ? tKey('vitamins.add_medication') : tKey('vitamins.add_vitamin')
              )}
            </Text>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Text style={m.closeTxt}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: 60 }}>
            {/* Antibiotic banner */}
            {isMedication && isAntibiotic && (
              <View style={m.antibioticBanner}>
                <Text style={m.antibioticTxt}>
                  ⚠️ {tKey('vitamins.antibiotic_warning')}
                </Text>
              </View>
            )}

            {/* Quick-select chips */}
            <Text style={s.label}>{tKey('vitamins.fields.name')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}>
                {quickOpts.map(opt => (
                  <TouchableOpacity key={opt}
                    style={[m.chip, name === opt && m.chipActive]}
                    onPress={() => setName(opt)}>
                    <Text style={[m.chipTxt, name === opt && m.chipTxtActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder={tKey('vitamins.fields.name_placeholder')} />

            {/* Type selector */}
            {!isMedication && (
              <>
                <Text style={s.label}>{tKey('vitamins.fields.type')}</Text>
                <View style={m.typeRow}>
                  {typeOptions.map(opt => (
                    <TouchableOpacity key={opt.key}
                      style={[m.typeChip, type === opt.key && m.typeChipActive]}
                      onPress={() => setType(opt.key)}>
                      <Text style={[m.typeChipTxt, type === opt.key && m.typeChipTxtActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Dose */}
            <Text style={s.label}>{tKey('vitamins.fields.dose')}</Text>
            <TextInput style={s.input} value={dose} onChangeText={setDose}
              placeholder="e.g. 400 IU, 5ml, 1 chewable" />

            {/* Frequency */}
            <Text style={s.label}>{tKey('vitamins.fields.frequency')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}>
                {FREQUENCY_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.key}
                    style={[m.chip, frequency === opt.key && m.chipActive]}
                    onPress={() => setFrequency(opt.key as Frequency)}>
                    <Text style={[m.chipTxt, frequency === opt.key && m.chipTxtActive]}>
                      {opt.label.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Reminder */}
            <View style={m.row}>
              <Text style={[s.label, { flex: 1, marginBottom: 0 }]}>
                ⏰ {tKey('vitamins.fields.reminder')}
              </Text>
              <Switch value={remEnabled} onValueChange={setRemEnabled}
                thumbColor={remEnabled ? Colors.primaryPink : '#ccc'}
                trackColor={{ true: '#FFE4EE', false: '#eee' }} />
            </View>
            {remEnabled && (
              <TextInput style={s.input} value={remTime} onChangeText={setRemTime}
                placeholder="HH:MM (e.g. 08:00)" />
            )}

            {/* Dates */}
            <Text style={s.label}>{tKey('vitamins.fields.start_date')}</Text>
            <TextInput style={s.input} value={startDate} onChangeText={setStartDate}
              placeholder="YYYY-MM-DD" />

            <Text style={s.label}>{tKey('vitamins.fields.end_date')}</Text>
            <TextInput style={s.input} value={endDate} onChangeText={setEndDate}
              placeholder={tKey('vitamins.fields.end_date_placeholder')} />

            {/* Medication extras */}
            {isMedication && (
              <>
                <Text style={s.label}>{tKey('vitamins.fields.prescribed_by')}</Text>
                <TextInput style={s.input} value={prescribedBy} onChangeText={setPrescribedBy}
                  placeholder="Dr. Juan dela Cruz" />

                <Text style={s.label}>{tKey('vitamins.fields.diagnosis')}</Text>
                <TextInput style={s.input} value={diagnosis} onChangeText={setDiagnosis}
                  placeholder="e.g. Fever, ear infection" />

                <View style={m.row}>
                  <Text style={[s.label, { flex: 1, marginBottom: 0 }]}>
                    ⚠️ {tKey('vitamins.fields.is_antibiotic')}
                  </Text>
                  <Switch value={isAntibiotic} onValueChange={setIsAntibiotic}
                    thumbColor={isAntibiotic ? Colors.primaryPink : '#ccc'}
                    trackColor={{ true: '#FFE4EE', false: '#eee' }} />
                </View>
              </>
            )}

            {/* Notes */}
            <Text style={s.label}>{tKey('vitamins.fields.notes')}</Text>
            <TextInput style={[s.input, { height: 80 }]} value={notes}
              onChangeText={setNotes} multiline
              placeholder={tKey('vitamins.fields.notes_placeholder')} />

            {/* Footer */}
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelTxt}>{tKey('vitamins.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveTxt}>{tKey('vitamins.save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function VitaminsScreen() {
  const { t: tRaw, i18n } = useTranslation();
  const t    = tRaw as (k: string, o?: object) => string;
  const tKey = (k: string, o?: object) => t(k, o);
  const lang  = (i18n.language?.slice(0,2) === 'zh' ? 'zh' : i18n.language?.slice(0,2) === 'fil' ? 'fil' : 'en') as 'en'|'fil'|'zh';

  const { activeChild } = useChildStore();
  const {
    getActiveEntries, getPastEntries, addEntry, updateEntry, deleteEntry,
    logDose, getTodayDoseStatus, getAdherencePercent,
  } = useVitaminStore();

  // Tab state: 'vitamins' | 'medications'
  const [activeTab, setActiveTab] = useState<'vitamins' | 'medications'>('vitamins');
  const [showAdd,   setShowAdd]   = useState(false);
  const [showGP,    setShowGP]    = useState(false);
  const [editEntry, setEditEntry] = useState<VitaminEntry | null>(null);

  const childId   = activeChild?.id    ?? '';
  const childName = activeChild ? getChildDisplayName(activeChild) : 'Baby';
  const ageMonths = activeChild?.birthday
    ? Math.floor((Date.now() - new Date(activeChild.birthday).getTime()) / (1000*60*60*24*30.44))
    : 0;

  // Filter active entries by tab
  const allActive = getActiveEntries(childId);
  const allPast   = getPastEntries(childId);

  const activeVits = allActive.filter(e => e.type !== 'medication');
  const activeMeds = allActive.filter(e => e.type === 'medication');
  const pastVits   = allPast.filter(e => e.type !== 'medication');
  const pastMeds   = allPast.filter(e => e.type === 'medication');

  const shownActive = activeTab === 'vitamins' ? activeVits : activeMeds;
  const shownPast   = activeTab === 'vitamins' ? pastVits   : pastMeds;

  // Recommendations for age
  const recs      = useMemo(() => getRecommendationsForAge(ageMonths), [ageMonths]);
  const loggedNames = new Set(allActive.map(e => e.name.toLowerCase()));
  const isLogged  = (rec: VitaminRec) => loggedNames.has(rec.name.toLowerCase());

  // AI prompt for this screen
  const aiPrompt = useMemo(() => {
    const loggedVits = allActive.map(e => `${e.name} (${e.dose})`).join(', ') || 'none logged';
    const recNames   = recs.map(r => r.name).join(', ');
    return `In 2-3 concise sentences, analyze ${childName}'s vitamin/supplement regimen for a ${ageMonths}-month-old. Currently logged: ${loggedVits}. WHO/DOH recommended for this age: ${recNames}. Mention any important gaps, what's looking good, and one Philippines-specific tip (like BHS or Garantisadong Pambata if relevant).`;
  }, [childName, ageMonths, allActive, recs]);

  function handleQuickAdd(rec: VitaminRec) {
    setEditEntry(null);
    setActiveTab('vitamins');
    setShowAdd(true);
  }

  function handleSaveEntry(data: Partial<VitaminEntry>) {
    if (editEntry) {
      updateEntry(editEntry.id, data);
    } else {
      addEntry(data as Omit<VitaminEntry, 'id' | 'createdAt' | 'doseLogs'>);
    }
    setEditEntry(null);
  }

  function handleDelete(entry: VitaminEntry) {
    Alert.alert(
      tKey('vitamins.delete_confirm_title'),
      tKey('vitamins.delete_confirm_msg', { name: entry.name }),
      [
        { text: tKey('vitamins.cancel'), style: 'cancel' },
        { text: tKey('vitamins.delete'), style: 'destructive',
          onPress: () => deleteEntry(entry.id) },
      ],
    );
  }

  if (!activeChild) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyIcon}>💊</Text>
        <Text style={s.emptyTxt}>{tKey('vitamins.no_child')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <LinearGradient colors={['#27AE7A', '#4DD0A0']} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>💊 {tKey('vitamins.title')}</Text>
          <Text style={s.headerSub}>{childName}</Text>
        </View>
        <TouchableOpacity style={s.gpBtn} onPress={() => setShowGP(true)}>
          <Text style={s.gpBtnTxt}>🌟 GP</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── Ate AI Analysis Card ── */}
        <View style={{ paddingHorizontal: PAD, marginTop: 14 }}>
          <AteAISummaryCard
            title={tKey('vitamins.ai_card_title')}
            emoji="🔬"
            prompt={aiPrompt}
            onChatPress={() => {}}
          />
        </View>

        {/* ── Recommended section ── */}
        {recs.length > 0 && (
          <View style={{ marginTop: 18 }}>
            <Text style={[s.sectionTitle, { paddingHorizontal: PAD }]}>
              🏥 {tKey('vitamins.recommended_for', { name: childName })}
            </Text>
            <Text style={[s.sectionSub, { paddingHorizontal: PAD }]}>
              {tKey('vitamins.recommended_source')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: PAD, gap: 12, paddingBottom: 4 }}>
              {recs.map((rec, i) => (
                <View key={i} style={{ width: W * 0.75 }}>
                  <RecommendationCard
                    rec={rec}
                    isLogged={isLogged(rec)}
                    lang={lang}
                    onQuickAdd={handleQuickAdd}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── GP Countdown Banner ── */}
        {isGPEligible(ageMonths) && (
          <TouchableOpacity style={s.gpBanner} onPress={() => setShowGP(true)}>
            <Text style={s.gpBannerEmoji}>🌟</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.gpBannerTitle}>{tKey('vitamins.gp.banner_title')}</Text>
              <Text style={s.gpBannerSub}>
                {tKey('vitamins.gp.banner_sub', { days: getDaysUntilNextGP(), month: getNextGPMonth().name })}
              </Text>
            </View>
            <Text style={s.gpBannerArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Tab switcher ── */}
        <View style={s.tabs}>
          {(['vitamins', 'medications'] as const).map(tab => (
            <TouchableOpacity key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>
                {tab === 'vitamins'
                  ? `💊 ${tKey('vitamins.tabs.vitamins')}`
                  : `💉 ${tKey('vitamins.tabs.medications')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Active entries ── */}
        <View style={{ paddingHorizontal: PAD }}>
          <Text style={s.sectionTitle}>{tKey('vitamins.active')}</Text>

          {shownActive.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>{activeTab === 'vitamins' ? '💊' : '💉'}</Text>
              <Text style={s.emptyCardTxt}>
                {activeTab === 'vitamins'
                  ? tKey('vitamins.no_active_vitamins')
                  : tKey('vitamins.no_active_medications')}
              </Text>
              <TouchableOpacity style={s.addFirstBtn}
                onPress={() => { setEditEntry(null); setShowAdd(true); }}>
                <Text style={s.addFirstBtnTxt}>
                  + {activeTab === 'vitamins'
                    ? tKey('vitamins.add_vitamin')
                    : tKey('vitamins.add_medication')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            shownActive.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => { setEditEntry(entry); setShowAdd(true); }}
                onDelete={() => handleDelete(entry)}
                onLogDose={(taken) => logDose(entry.id, taken)}
                todayStatus={getTodayDoseStatus(entry.id)}
                adherence={getAdherencePercent(entry.id, 7)}
              />
            ))
          )}

          {/* ── Past entries ── */}
          {shownPast.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 20 }]}>{tKey('vitamins.past')}</Text>
              {shownPast.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => { setEditEntry(entry); setShowAdd(true); }}
                  onDelete={() => handleDelete(entry)}
                  onLogDose={() => {}}
                  todayStatus={undefined}
                  adherence={getAdherencePercent(entry.id, 30)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => { setEditEntry(null); setShowAdd(true); }}>
        <LinearGradient colors={['#27AE7A', '#4DD0A0']} style={s.fabGrad}>
          <Text style={s.fabTxt}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Modals ── */}
      <AddEditModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditEntry(null); }}
        onSave={handleSaveEntry}
        editEntry={editEntry}
        childId={childId}
        isMedication={activeTab === 'medications'}
      />

      <GPTrackerModal
        visible={showGP}
        onClose={() => setShowGP(false)}
        childId={childId}
        childName={childName}
        ageMonths={ageMonths}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50, gap: 12 },
  backBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  backTxt:     { fontSize: 22, color: '#fff', fontWeight: '700', lineHeight: 26 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  gpBtn:       { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  gpBtnTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Section titles
  sectionTitle:   { fontSize: 13, fontWeight: '800', color: Colors.dark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginTop: 8 },
  sectionSub:     { fontSize: 12, color: Colors.midGray, marginBottom: 8 },

  // Tabs
  tabs:         { flexDirection: 'row', marginHorizontal: PAD, marginTop: 16, marginBottom: 4, backgroundColor: '#F0F0F5', borderRadius: 12, padding: 4 },
  tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: Colors.midGray },
  tabTxtActive: { color: Colors.dark, fontWeight: '800' },

  // Recommendation card
  recCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 0, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F0F0F5' },
  recCardDone:   { borderColor: Colors.mint + '55', borderWidth: 1.5 },
  recHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  recNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recName:       { fontSize: 15, fontWeight: '800', color: Colors.dark },
  recDose:       { fontSize: 12, color: Colors.midGray, marginTop: 2 },
  recReason:     { fontSize: 12.5, color: Colors.midGray, lineHeight: 18, marginBottom: 8 },
  recFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recSource:     { fontSize: 11, color: Colors.blue, flex: 1 },
  addRecBtn:     { backgroundColor: Colors.mint, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addRecBtnTxt:  { color: '#fff', fontWeight: '800', fontSize: 12 },
  loggedPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.softMint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  loggedTxt:     { fontSize: 11, color: Colors.mint, fontWeight: '700' },
  freeBadge:     { backgroundColor: '#E8F5E9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  freeBadgeTxt:  { fontSize: 10, fontWeight: '800', color: Colors.mint },

  // Entry card
  entryCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  entryRow:        { flexDirection: 'row', alignItems: 'flex-start' },
  entryName:       { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  entryChips:      { flexDirection: 'row', gap: 6, marginBottom: 4 },
  entryMeta:       { fontSize: 12, color: Colors.midGray, marginBottom: 2 },
  entryReminder:   { fontSize: 12, color: Colors.blue },
  entryNotes:      { fontSize: 12, color: Colors.midGray, marginTop: 6, fontStyle: 'italic' },
  entryRight:      { alignItems: 'flex-end', gap: 8 },
  entryActions:    { flexDirection: 'row', gap: 4 },
  doseBtn:         { borderWidth: 1.5, borderColor: Colors.mint, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  doseBtnTaken:    { backgroundColor: Colors.mint, borderColor: Colors.mint },
  doseBtnTxt:      { fontSize: 12, fontWeight: '700', color: Colors.mint },
  iconBtn:         { padding: 6 },
  iconBtnTxt:      { fontSize: 16 },
  antibioticBanner:{ backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10, marginBottom: 10 },
  antibioticTxt:   { fontSize: 12.5, color: '#E65100', fontWeight: '700', lineHeight: 18 },
  ringWrap:        { alignItems: 'center', justifyContent: 'center', width: 44 },
  ringPct:         { fontSize: 9, fontWeight: '700', color: Colors.midGray, marginTop: -2 },

  // GP Banner
  gpBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E8', marginHorizontal: PAD, marginTop: 14, borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: Colors.gold + '66' },
  gpBannerEmoji: { fontSize: 28, marginRight: 12 },
  gpBannerTitle: { fontSize: 14, fontWeight: '800', color: Colors.dark },
  gpBannerSub:   { fontSize: 12, color: Colors.midGray, marginTop: 2 },
  gpBannerArrow: { fontSize: 22, color: Colors.gold, fontWeight: '700' },

  // Empty states
  emptyState:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTxt:      { fontSize: 15, color: Colors.midGray, textAlign: 'center' },
  emptyCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  emptyCardTxt:  { fontSize: 14, color: Colors.midGray, textAlign: 'center', marginBottom: 14 },
  addFirstBtn:   { backgroundColor: Colors.softMint, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  addFirstBtnTxt:{ color: Colors.mint, fontWeight: '800', fontSize: 13 },

  // FAB
  fab:     { position: 'absolute', bottom: 90, right: 22, borderRadius: 30, shadowColor: Colors.mint, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  fabGrad: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  fabTxt:  { color: '#fff', fontSize: 30, fontWeight: '300', lineHeight: 34 },

  // Shared form styles
  label:       { fontSize: 13, fontWeight: '700', color: Colors.dark, marginBottom: 6, marginTop: 14 },
  input:       { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: Colors.dark },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderColor: '#DDD', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt:   { fontSize: 14, fontWeight: '700', color: Colors.midGray },
  saveBtn:     { flex: 1, backgroundColor: Colors.mint, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Badge
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTxt: { fontSize: 10.5, fontWeight: '700' },
});

// Add/Edit modal styles
const m = StyleSheet.create({
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50, gap: 12 },
  headerTitle:    { fontSize: 17, fontWeight: '800', color: '#fff', flex: 1 },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5FA', borderWidth: 1, borderColor: '#EEE' },
  chipActive:     { backgroundColor: Colors.mint, borderColor: Colors.mint },
  chipTxt:        { fontSize: 12.5, fontWeight: '600', color: Colors.midGray },
  chipTxtActive:  { color: '#fff' },
  typeRow:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  typeChip:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#EEE', backgroundColor: '#fff' },
  typeChipActive: { borderColor: Colors.mint, backgroundColor: Colors.softMint },
  typeChipTxt:    { fontSize: 12.5, fontWeight: '600', color: Colors.midGray },
  typeChipTxtActive: { color: Colors.mint },
  row:            { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  antibioticBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 12, marginBottom: 8 },
  antibioticTxt:  { fontSize: 13, color: '#E65100', fontWeight: '700', lineHeight: 19 },
});

// GP Tracker modal styles
const gp = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingTop: 50, gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', flex: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  infoTitle:   { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  infoDesc:    { fontSize: 13, color: Colors.midGray, lineHeight: 19, marginBottom: 10 },
  infoRow:     { flexDirection: 'row', gap: 12, marginBottom: 8 },
  infoItem:    { fontSize: 13, fontWeight: '700', color: Colors.dark },
  infoFree:    { fontSize: 13, color: Colors.mint, fontWeight: '700', marginTop: 4 },
  countdownCard:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E8', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: Colors.gold + '55' },
  countdownLabel:{ fontSize: 12, color: Colors.midGray, marginBottom: 2 },
  countdownVal: { fontSize: 15, fontWeight: '800', color: Colors.dark },
  logBtn:      { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  logBtnTxt:   { color: '#fff', fontWeight: '800', fontSize: 15 },
  form:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  formTitle:   { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 2 },
  checkRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  check:       { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#EEE', backgroundColor: '#F5F5FA' },
  checkActive: { borderColor: Colors.gold, backgroundColor: '#FFF8E8' },
  checkTxt:    { fontSize: 13, fontWeight: '700', color: Colors.dark },
  visitCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  visitDate:   { fontSize: 13, fontWeight: '800', color: Colors.dark },
  visitBHS:    { fontSize: 13, color: Colors.midGray, marginTop: 2 },
  visitPills:  { flexDirection: 'row', gap: 6, marginTop: 6 },
  pill:        { backgroundColor: Colors.softMint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillTxt:     { fontSize: 11, fontWeight: '700', color: Colors.mint },
});
