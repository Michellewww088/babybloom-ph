/**
 * vaccines.tsx — Vaccination Log & DOH EPI Schedule
 * BMAD: Beats AsianParents — child-specific records, AI analysis, full EPI coverage,
 *       trilingual, offline-first, auto-reminder, PH cultural context
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal, TextInput,
  StyleSheet, Dimensions, Alert, Platform, Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import { useChildStore, getChildDisplayName } from '../../store/childStore';
import { useVaccineStore, VaccineRecord, VaccineStatus } from '../../store/vaccineStore';
import { getAgeGroupForVaccine } from '../../constants/vaccines-doh-epi';

const { width: W } = Dimensions.get('window');
const PINK = Colors.primaryPink;
const BLUE = '#1A73C8';
const MINT = '#27AE7A';
const GOLD = '#F5A623';
const DARK = '#1C1C3A';
const GRAY = '#4A4A6A';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function statusColor(s: VaccineStatus) {
  if (s === 'given')    return MINT;
  if (s === 'upcoming') return BLUE;
  if (s === 'overdue')  return '#E53E3E';
  return GRAY;
}
function statusBg(s: VaccineStatus) {
  if (s === 'given')    return '#E0F7EF';
  if (s === 'upcoming') return '#E8F2FF';
  if (s === 'overdue')  return '#FFF5F5';
  return '#F5F5F5';
}
function statusIcon(s: VaccineStatus) {
  if (s === 'given')    return '✅';
  if (s === 'upcoming') return '⏳';
  if (s === 'overdue')  return '⚠️';
  return '❌';
}

// ─── AI Report Type ────────────────────────────────────────────────────────────

interface VaccineAIReport {
  coverageSummary: string;
  actionNeeded: string;
  ateTip: string;
  nextStep: string;
}

function buildVaccineDemoReport(
  name: string, ageMonths: number,
  givenCount: number, totalCount: number,
  overdueList: string[], nextVaccineName: string, nextVaccineDate: string,
): VaccineAIReport {
  const pct = totalCount > 0 ? Math.round((givenCount / totalCount) * 100) : 0;

  const coverageSummary =
    `${name} has received ${givenCount} of ${totalCount} scheduled vaccines (${pct}% coverage). ` +
    (pct >= 80
      ? `Excellent protection! ${name} is well-covered for this age. Keep up the great work, Mommy! 🌟`
      : pct >= 50
      ? `Good progress! Continue following the DOH EPI schedule to ensure full protection. 💪`
      : `It's important to catch up on the vaccination schedule. Visit your nearest BHS or RHU soon. 💙`);

  const actionNeeded = overdueList.length === 0
    ? `No overdue vaccines — ${name} is on track! The next scheduled vaccine is ${nextVaccineName || 'coming up soon'}.`
    : `⚠️ ${overdueList.length} vaccine${overdueList.length > 1 ? 's are' : ' is'} overdue: ${overdueList.join(', ')}. ` +
      `Please visit your nearest Barangay Health Station (BHS) or Rural Health Unit (RHU) as soon as possible. Free EPI vaccines are available nationwide.`;

  const tips = [
    `The DOH Philippines EPI program provides free vaccines at all BHS/RHU locations. Always bring your MCH Booklet (Mother & Child Health Booklet) — it serves as ${name}'s official vaccination record. 📋`,
    `According to the Philippine Pediatric Society (PPS), completing the EPI schedule on time gives ${name} the best protection. Mild fever or soreness after a vaccine is normal and resolves in 1–2 days. 💉`,
    `WHO recommends vaccinating all children according to national schedules. In the Philippines, BCG, Pentavalent, OPV, PCV, and Rotavirus vaccines are FREE at all government health centers. 🇵🇭`,
  ];
  const tipIndex = ageMonths < 3 ? 0 : ageMonths < 9 ? 1 : 2;

  const nextStep = nextVaccineName
    ? `📅 Next vaccine: ${nextVaccineName} scheduled for ${fmtDate(nextVaccineDate)} ` +
      `(${daysUntil(nextVaccineDate)} days from today). ` +
      `${nextVaccineName.includes('OPV') || nextVaccineName.includes('Rotavirus') ? 'This is an oral vaccine — no injection needed! ' : ''}` +
      `Visit your BHS/RHU on time.`
    : `${name} is up to date with all currently scheduled vaccines! Remember to complete remaining vaccines as ${name} grows. Annual influenza vaccine is recommended from 6 months.`;

  return { coverageSummary, actionNeeded, ateTip: tips[tipIndex], nextStep };
}

// ─── AI Analysis Section ───────────────────────────────────────────────────────

function VaccineAISection({
  childName, ageMonths, givenCount, totalCount,
  overdueList, nextVaccineName, nextVaccineDate,
}: {
  childName: string; ageMonths: number;
  givenCount: number; totalCount: number;
  overdueList: string[]; nextVaccineName: string; nextVaccineDate: string;
}) {
  const { t }   = useTranslation();
  const [open, setOpen]     = useState(false);
  const [load, setLoad]     = useState(false);
  const [report, setReport] = useState<VaccineAIReport | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const fetched             = useRef(false);

  const doFetch = async () => {
    if (fetched.current) return;
    fetched.current = true;
    setLoad(true);
    const apiKey = (process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '').trim();
    if (!apiKey || apiKey === 'your_claude_api_key_here') {
      await new Promise(r => setTimeout(r, 700));
      setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate));
      setIsDemo(true); setLoad(false); return;
    }
    try {
      const prompt = `You are Ate AI, a warm Filipino baby health assistant.
Child: ${childName}, ${ageMonths} months old.
Vaccination: ${givenCount}/${totalCount} given (${Math.round(givenCount/Math.max(totalCount,1)*100)}%).
Overdue: ${overdueList.length > 0 ? overdueList.join(', ') : 'None'}.
Next vaccine: ${nextVaccineName || 'None'} on ${nextVaccineDate || 'N/A'}.
Respond as JSON with fields: coverageSummary, actionNeeded, ateTip, nextStep. Use warm Taglish.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate));
        setIsDemo(true); setLoad(false); return;
      }
      const txt = data?.content?.[0]?.text ?? '';
      const clean = txt.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
      try { setReport(JSON.parse(clean)); }
      catch { setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate)); setIsDemo(true); }
    } catch {
      setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate));
      setIsDemo(true);
    }
    setLoad(false);
  };

  return (
    <View style={ai.card}>
      <TouchableOpacity
        style={ai.hdrRow}
        onPress={() => { setOpen(!open); if (!open && !fetched.current) doFetch(); }}
        activeOpacity={0.8}
      >
        <View style={ai.hdrLeft}>
          <LinearGradient colors={['#7B68EE','#9B8EFF']} style={ai.iconBox}>
            <Text style={ai.iconTxt}>✨</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={ai.hdrTitle}>{t('vaccine_log.ai_title')}</Text>
            <Text style={ai.hdrSub}>{t('vaccine_log.ai_subtitle')}</Text>
          </View>
        </View>
        <Text style={ai.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={ai.body}>
          {load ? (
            <View style={ai.loadRow}><Text style={ai.loadTxt}>✨ {t('vaccine_log.ai_loading')}</Text></View>
          ) : report ? (
            <>
              {isDemo && (
                <View style={ai.demoBadge}>
                  <Text style={ai.demoIcon}>🤖</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={ai.demoTitle}>{t('vaccine_log.ai_demo_title')}</Text>
                    <Text style={ai.demoSub}>{t('vaccine_log.ai_demo_sub')}</Text>
                  </View>
                </View>
              )}
              <View style={[ai.section, { backgroundColor: '#E0F7EF' }]}>
                <Text style={[ai.sLabel, { color: MINT }]}>🛡️ {t('vaccine_log.ai_section_coverage')}</Text>
                <Text style={ai.sBody}>{report.coverageSummary}</Text>
              </View>
              {overdueList.length > 0 && (
                <View style={[ai.section, { backgroundColor: '#FFF5F5' }]}>
                  <Text style={[ai.sLabel, { color: '#E53E3E' }]}>⚠️ {t('vaccine_log.ai_section_action')}</Text>
                  <Text style={ai.sBody}>{report.actionNeeded}</Text>
                </View>
              )}
              <View style={[ai.section, { backgroundColor: '#FFF8E8' }]}>
                <Text style={[ai.sLabel, { color: GOLD }]}>💡 {t('vaccine_log.ai_section_tip')}</Text>
                <Text style={ai.sBody}>{report.ateTip}</Text>
              </View>
              <View style={[ai.section, { backgroundColor: '#E8F2FF' }]}>
                <Text style={[ai.sLabel, { color: BLUE }]}>📅 {t('vaccine_log.ai_section_next')}</Text>
                <Text style={ai.sBody}>{report.nextStep}</Text>
              </View>
              <View style={ai.phTip}>
                <Text style={ai.phTipTxt}>{t('vaccine_log.ph_tip')}</Text>
              </View>
              <Text style={ai.disclaimer}>{t('vaccine_log.ai_disclaimer')}</Text>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

const ai = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14,
    shadowColor: '#7B68EE', shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  hdrRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  hdrLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconTxt:  { fontSize: 22 },
  hdrTitle: { fontSize: 15, fontWeight: '800', color: DARK },
  hdrSub:   { fontSize: 11, color: '#7B68EE', fontWeight: '600', marginTop: 1 },
  chevron:  { fontSize: 12, color: GRAY, marginLeft: 8 },
  body:     { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  loadRow:  { paddingVertical: 20, alignItems: 'center' },
  loadTxt:  { fontSize: 13, color: '#7B68EE', fontWeight: '600' },
  demoBadge:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0EDFF', borderRadius: 12, padding: 12 },
  demoIcon: { fontSize: 26 },
  demoTitle:{ fontSize: 13, fontWeight: '800', color: '#5B4FCF' },
  demoSub:  { fontSize: 11, color: '#7B68EE', marginTop: 2 },
  section:  { borderRadius: 12, padding: 12, gap: 4 },
  sLabel:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sBody:    { fontSize: 13, color: DARK, lineHeight: 19 },
  phTip:    { backgroundColor: '#E8F2FF', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: BLUE },
  phTipTxt: { fontSize: 12, color: BLUE, fontWeight: '600', lineHeight: 17 },
  disclaimer:{ fontSize: 10, color: GRAY, textAlign: 'center', marginTop: 4, lineHeight: 14 },
});

// ─── Coverage Hero ─────────────────────────────────────────────────────────────

function CoverageHero({
  name, ageMonths, givenCount, upcomingCount, overdueCount, totalCount,
}: {
  name: string; ageMonths: number;
  givenCount: number; upcomingCount: number; overdueCount: number; totalCount: number;
}) {
  const { t } = useTranslation();
  const pct   = totalCount > 0 ? Math.round((givenCount / totalCount) * 100) : 0;
  const barW  = (W - 32 - 36) * (pct / 100);

  return (
    <LinearGradient colors={['#1A73C8','#4A9DE8']} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={h.card}>
      <View style={h.topRow}>
        <Text style={h.emoji}>💉</Text>
        <View style={{ flex: 1 }}>
          <Text style={h.title}>{name} · {ageMonths}M</Text>
          <Text style={h.subtitle}>{t('vaccine_log.subtitle')}</Text>
        </View>
        <View style={h.pctBadge}>
          <Text style={h.pctNum}>{pct}%</Text>
          <Text style={h.pctLbl}>{t('vaccine_log.coverage_label')}</Text>
        </View>
      </View>
      <View style={h.barBg}><View style={[h.barFill, { width: barW }]} /></View>
      <View style={h.statsRow}>
        <View style={h.stat}><Text style={h.statN}>{givenCount}</Text><Text style={h.statL}>✅ Given</Text></View>
        <View style={h.div} />
        <View style={h.stat}><Text style={h.statN}>{upcomingCount}</Text><Text style={h.statL}>⏳ Upcoming</Text></View>
        <View style={h.div} />
        <View style={h.stat}>
          <Text style={[h.statN, overdueCount > 0 && { color: '#FFD6D6' }]}>{overdueCount}</Text>
          <Text style={h.statL}>⚠️ Overdue</Text>
        </View>
      </View>
      <Text style={h.autoNote}>📋 {t('vaccine_log.auto_populated')}</Text>
    </LinearGradient>
  );
}

const h = StyleSheet.create({
  card:     { borderRadius: 22, padding: 18, marginBottom: 14, shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  emoji:    { fontSize: 36 },
  title:    { fontSize: 17, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  pctBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pctNum:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  pctLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 1 },
  barBg:    { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginBottom: 14 },
  barFill:  { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  stat:     { alignItems: 'center' },
  statN:    { fontSize: 20, fontWeight: '900', color: '#fff' },
  statL:    { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 2 },
  div:      { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  autoNote: { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
});

// ─── Vaccine Row ───────────────────────────────────────────────────────────────

function VaccineRow({ record, onPress }: { record: VaccineRecord; onPress: () => void }) {
  const { t } = useTranslation();
  const days  = record.status === 'upcoming' ? daysUntil(record.scheduledDate) : null;
  const wks   = record.recommendedAgeWeeks;
  const ageLabel = wks === 0 ? t('vaccine_log.at_birth') : wks < 52 ? `${wks}w` : `${Math.round(wks/4.33)}M`;

  return (
    <TouchableOpacity
      style={[vr.card, { borderLeftColor: statusColor(record.status) }]}
      onPress={onPress} activeOpacity={0.85}
    >
      <View style={[vr.iconCol, { backgroundColor: statusBg(record.status) }]}>
        <Text style={vr.iconTxt}>{statusIcon(record.status)}</Text>
      </View>
      <View style={vr.center}>
        <Text style={vr.name} numberOfLines={2}>{record.nameEN}</Text>
        <View style={vr.meta}>
          <Text style={vr.metaTxt}>{ageLabel}</Text>
          <Text style={vr.dot}>·</Text>
          {record.status === 'given' && record.givenDate ? (
            <Text style={[vr.metaTxt, { color: MINT }]}>{t('vaccine_log.given_label')} {fmtDate(record.givenDate)}</Text>
          ) : record.status === 'overdue' ? (
            <Text style={[vr.metaTxt, { color: '#E53E3E' }]}>{t('vaccine_log.overdue_label')} {fmtDate(record.scheduledDate)}</Text>
          ) : (
            <Text style={[vr.metaTxt, { color: BLUE }]}>
              {t('vaccine_log.due_label')}: {fmtDate(record.scheduledDate)}
              {days !== null && days <= 14 && days >= 0 ? (
                <Text style={{ color: days <= 3 ? '#E53E3E' : GOLD }}> ({days}d)</Text>
              ) : null}
            </Text>
          )}
        </View>
        {record.clinicName ? <Text style={vr.clinic} numberOfLines={1}>🏥 {record.clinicName}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <View style={[vr.badge, record.isFreeEPI ? vr.badgeFree : vr.badgePriv]}>
          <Text style={[vr.badgeTxt, { color: record.isFreeEPI ? MINT : GOLD }]}>
            {record.isFreeEPI ? t('vaccine_log.badge_free') : t('vaccine_log.badge_private')}
          </Text>
        </View>
        <Text style={vr.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const vr = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingRight: 12, borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  iconCol: { width: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  iconTxt: { fontSize: 20 },
  center:  { flex: 1, paddingVertical: 12, gap: 3 },
  name:    { fontSize: 13, fontWeight: '700', color: DARK, lineHeight: 18 },
  meta:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaTxt: { fontSize: 11, color: GRAY, fontWeight: '500' },
  dot:     { fontSize: 11, color: '#ccc' },
  clinic:  { fontSize: 10, color: GRAY, opacity: 0.7 },
  badge:   { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeFree: { backgroundColor: '#E0F7EF' },
  badgePriv: { backgroundColor: '#FFF8E8' },
  badgeTxt:  { fontSize: 9, fontWeight: '800' },
  chevron:   { fontSize: 18, color: '#ccc' },
});

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function VaccineEditModal({
  visible, record, onClose, onSave, onDelete,
}: {
  visible: boolean; record: VaccineRecord | null;
  onClose: () => void; onSave: (r: VaccineRecord) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [status,   setStatus]   = useState<VaccineStatus>('upcoming');
  const [givenDt,  setGivenDt]  = useState('');
  const [clinic,   setClinic]   = useState('');
  const [lotNum,   setLotNum]   = useState('');
  const [adminBy,  setAdminBy]  = useState('');
  const [reaction, setReaction] = useState('');
  const [notes,    setNotes]    = useState('');
  const [reminder, setReminder] = useState(true);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setGivenDt(record.givenDate ?? '');
      setClinic(record.clinicName ?? '');
      setLotNum(record.lotNumber ?? '');
      setAdminBy(record.administeredBy ?? '');
      setReaction(record.reactionNotes ?? '');
      setNotes(record.notes ?? '');
      setReminder(record.reminderEnabled);
    }
  }, [record]);

  if (!record) return null;

  const ageGroup  = getAgeGroupForVaccine(record.code);
  const vaccInfo  = ageGroup?.vaccines.find(v => v.code === record.code);
  const wks       = record.recommendedAgeWeeks;
  const ageLabel  = wks === 0 ? t('vaccine_log.at_birth') : wks < 52 ? `${wks} weeks` : `${Math.round(wks/4.33)} months`;

  const save = () => {
    if (status === 'given' && !givenDt) {
      Alert.alert('Date Required', 'Please enter the date the vaccine was given.'); return;
    }
    onSave({ ...record, status, givenDate: status === 'given' ? givenDt : undefined,
      clinicName: clinic || undefined, lotNumber: lotNum || undefined,
      administeredBy: adminBy || undefined, reactionNotes: reaction || undefined,
      notes: notes || undefined, reminderEnabled: reminder, updatedAt: new Date().toISOString() });
    onClose();
  };

  const STATUS_OPTS: { v: VaccineStatus; l: string; c: string }[] = [
    { v: 'given',    l: '✅ ' + t('vaccine_log.status_given'),    c: MINT },
    { v: 'upcoming', l: '⏳ ' + t('vaccine_log.status_upcoming'), c: BLUE },
    { v: 'skipped',  l: '❌ ' + t('vaccine_log.status_skipped'),  c: GRAY },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={mo.wrap}>
          {/* Header */}
          <LinearGradient colors={['#1A73C8','#4A9DE8']} style={mo.hdr}>
            <TouchableOpacity onPress={onClose} style={mo.closeBtn}>
              <Text style={mo.closeTxt}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={mo.hdrTitle}>{t('vaccine_log.modal_title_edit')}</Text>
              <Text style={mo.hdrSub} numberOfLines={2}>{record.nameEN}</Text>
              <Text style={mo.hdrAge}>{ageLabel} · {fmtDate(record.scheduledDate)}</Text>
            </View>
            <View style={[mo.epiBadge, { backgroundColor: record.isFreeEPI ? '#C8F7DC' : '#FFF0C8' }]}>
              <Text style={[mo.epiBadgeTxt, { color: record.isFreeEPI ? '#1A7A4A' : '#A05C00' }]}>
                {record.isFreeEPI ? '✅ FREE' : '💰 Private'}
              </Text>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={mo.content} showsVerticalScrollIndicator={false}>

            {/* Vaccine Info Card */}
            {vaccInfo && (
              <View style={mo.infoCard}>
                <Text style={mo.infoLbl}>🛡️ {t('vaccine_log.protects_against')}</Text>
                <Text style={mo.infoVal}>{vaccInfo.protectsAgainst.en}</Text>
                <Text style={mo.infoLbl}>💉 {t('vaccine_log.route_label')}</Text>
                <Text style={mo.infoVal}>{vaccInfo.route}</Text>
                <Text style={mo.infoLbl}>⚡ {t('vaccine_log.side_effects')}</Text>
                <Text style={mo.infoVal}>{vaccInfo.sideEffects}</Text>
                <Text style={mo.infoLbl}>🏥 {t('vaccine_log.where_to_get')}</Text>
                <Text style={mo.infoVal}>{vaccInfo.whereToGet.en}</Text>
              </View>
            )}

            {/* Status */}
            <Text style={mo.secTitle}>{t('vaccine_log.field_status')}</Text>
            <View style={mo.statusRow}>
              {STATUS_OPTS.map(o => (
                <TouchableOpacity
                  key={o.v}
                  style={[mo.statusBtn, status === o.v && { borderColor: o.c, backgroundColor: statusBg(o.v) }]}
                  onPress={() => setStatus(o.v)} activeOpacity={0.8}
                >
                  <Text style={[mo.statusBtnTxt, status === o.v && { color: o.c }]}>{o.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Given */}
            {status === 'given' && (
              <View style={mo.fBlock}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_date_given')} *</Text>
                <TextInput style={mo.input} value={givenDt} onChangeText={setGivenDt}
                  placeholder="YYYY-MM-DD" placeholderTextColor="#ccc"
                  keyboardType="numbers-and-punctuation" />
              </View>
            )}

            {/* Clinic */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_clinic')}</Text>
              <TextInput style={mo.input} value={clinic} onChangeText={setClinic}
                placeholder="e.g. Makati Medical Center, BHS Poblacion" placeholderTextColor="#ccc" />
            </View>

            {/* Lot Number */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_lot')}</Text>
              <TextInput style={mo.input} value={lotNum} onChangeText={setLotNum}
                placeholder="Optional — useful for recalls" placeholderTextColor="#ccc" />
            </View>

            {/* Administered By */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_admin_by')}</Text>
              <TextInput style={mo.input} value={adminBy} onChangeText={setAdminBy}
                placeholder="Doctor / Nurse name" placeholderTextColor="#ccc" />
            </View>

            {/* Reaction */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_reaction')}</Text>
              <TextInput style={[mo.input, mo.inputMulti]} value={reaction} onChangeText={setReaction}
                placeholder='"Mild fever for 1 day", "No reaction"' placeholderTextColor="#ccc"
                multiline numberOfLines={2} />
            </View>

            {/* Notes */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_notes')}</Text>
              <TextInput style={[mo.input, mo.inputMulti]} value={notes} onChangeText={setNotes}
                placeholder="Any additional notes…" placeholderTextColor="#ccc" multiline numberOfLines={2} />
            </View>

            {/* Reminder */}
            <View style={mo.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_reminder')}</Text>
                <Text style={mo.reminderSub}>
                  {t('vaccine_log.reminder_7days')} ({fmtDate(record.reminderDate ?? record.scheduledDate)})
                </Text>
              </View>
              <Switch value={reminder} onValueChange={setReminder}
                trackColor={{ false: '#e0e0e0', true: BLUE + '66' }}
                thumbColor={reminder ? BLUE : '#aaa'} />
            </View>

            {/* Save */}
            <TouchableOpacity onPress={save} activeOpacity={0.85}>
              <LinearGradient colors={[BLUE,'#4A9DE8']} style={mo.saveBtn}>
                <Text style={mo.saveBtnTxt}>💉 {t('vaccine_log.save')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Delete */}
            {onDelete && (
              <TouchableOpacity
                style={mo.deleteBtn}
                onPress={() => Alert.alert(t('vaccine_log.delete'), t('vaccine_log.delete_confirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.delete'), style: 'destructive', onPress: () => { onDelete(record.id); onClose(); } },
                ])}
                activeOpacity={0.85}
              >
                <Text style={mo.deleteBtnTxt}>🗑 {t('vaccine_log.delete')}</Text>
              </TouchableOpacity>
            )}

            {/* Post-care */}
            {status === 'given' && vaccInfo && (
              <View style={mo.postCare}>
                <Text style={mo.postCareLbl}>🩹 {t('vaccine_log.post_care')}</Text>
                <Text style={mo.postCareVal}>{vaccInfo.postVaccineCare}</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mo = StyleSheet.create({
  wrap:       { flex: 1, backgroundColor: '#FAFAFA' },
  hdr:        { flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:   { color: '#fff', fontSize: 14, fontWeight: '700' },
  hdrTitle:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  hdrSub:     { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 16 },
  hdrAge:     { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  epiBadge:   { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  epiBadgeTxt:{ fontSize: 10, fontWeight: '800' },
  content:    { padding: 16 },
  infoCard:   { backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 16, gap: 2 },
  infoLbl:    { fontSize: 10, fontWeight: '800', color: BLUE, marginTop: 6 },
  infoVal:    { fontSize: 12, color: DARK, lineHeight: 17 },
  secTitle:   { fontSize: 12, fontWeight: '800', color: GRAY, marginBottom: 8, marginTop: 4, letterSpacing: 0.5 },
  statusRow:  { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusBtn:  { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', paddingVertical: 10, alignItems: 'center' },
  statusBtnTxt:{ fontSize: 11, fontWeight: '700', color: GRAY },
  fBlock:     { marginBottom: 12 },
  fLbl:       { fontSize: 12, fontWeight: '700', color: GRAY, marginBottom: 6 },
  input:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8e8e8', paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: DARK },
  inputMulti: { minHeight: 60, textAlignVertical: 'top', paddingTop: 11 },
  reminderRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 14 },
  reminderSub:{ fontSize: 11, color: BLUE, marginTop: 2 },
  saveBtn:    { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  deleteBtn:  { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFBDBD', backgroundColor: '#FFF5F5', marginBottom: 14 },
  deleteBtnTxt:{ color: '#E53E3E', fontSize: 14, fontWeight: '700' },
  postCare:   { backgroundColor: '#FFF8E8', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: GOLD, gap: 4 },
  postCareLbl:{ fontSize: 11, fontWeight: '800', color: GOLD },
  postCareVal:{ fontSize: 12, color: DARK, lineHeight: 17 },
});

// ─── Filter Tabs ───────────────────────────────────────────────────────────────

const TABS: { key: VaccineStatus | 'all'; i18n: string }[] = [
  { key: 'all',      i18n: 'vaccine_log.tab_all' },
  { key: 'given',    i18n: 'vaccine_log.tab_given' },
  { key: 'upcoming', i18n: 'vaccine_log.tab_upcoming' },
  { key: 'overdue',  i18n: 'vaccine_log.tab_overdue' },
];

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function VaccinesScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const vaccineStore    = useVaccineStore();

  const [activeFilter, setActiveFilter] = useState<VaccineStatus | 'all'>('all');
  const [editRecord,   setEditRecord]   = useState<VaccineRecord | null>(null);
  const [editVisible,  setEditVisible]  = useState(false);

  // Auto-populate & refresh statuses when active child changes
  useEffect(() => {
    if (activeChild?.id && activeChild.birthday) {
      vaccineStore.autoPopulate(activeChild.id, activeChild.birthday);
      vaccineStore.refreshStatuses(activeChild.id);
    }
  }, [activeChild?.id]);

  const allForChild   = activeChild ? vaccineStore.getRecords(activeChild.id) : [];
  const filteredRecs  = activeChild
    ? vaccineStore.getRecords(activeChild.id, activeFilter === 'all' ? undefined : activeFilter)
    : [];

  const givenCount    = allForChild.filter(r => r.status === 'given').length;
  const upcomingCount = allForChild.filter(r => r.status === 'upcoming').length;
  const overdueCount  = allForChild.filter(r => r.status === 'overdue').length;
  const totalCount    = allForChild.length;
  const overdueNames  = allForChild.filter(r => r.status === 'overdue').map(r => r.code);
  const nextUpcoming  = activeChild ? vaccineStore.getNextUpcoming(activeChild.id) : null;

  const ageMonths = activeChild?.birthday
    ? Math.floor((Date.now() - new Date(activeChild.birthday).getTime()) / (1000*60*60*24*30.44))
    : 0;
  const childName = activeChild ? getChildDisplayName(activeChild) : '';

  // No child
  if (!activeChild) {
    return (
      <ScrollView style={sc.container} contentContainerStyle={sc.content}>
        <LinearGradient colors={['#1A73C8','#4A9DE8']} style={sc.emptyHero}>
          <Text style={{ fontSize: 48 }}>💉</Text>
          <Text style={sc.emptyTitle}>{t('vaccine_log.title')}</Text>
          <Text style={sc.emptySub}>{t('vaccine_log.error_no_child')}</Text>
        </LinearGradient>
      </ScrollView>
    );
  }

  return (
    <View style={sc.container}>
      <ScrollView contentContainerStyle={sc.content} showsVerticalScrollIndicator={false}>

        {/* Coverage Hero */}
        <CoverageHero
          name={childName} ageMonths={ageMonths}
          givenCount={givenCount} upcomingCount={upcomingCount}
          overdueCount={overdueCount} totalCount={totalCount}
        />

        {/* Ate AI Section */}
        <VaccineAISection
          childName={childName} ageMonths={ageMonths}
          givenCount={givenCount} totalCount={totalCount}
          overdueList={overdueNames}
          nextVaccineName={nextUpcoming?.nameEN ?? ''}
          nextVaccineDate={nextUpcoming?.scheduledDate ?? ''}
        />

        {/* Garantisadong Pambata Banner */}
        <LinearGradient colors={['#F5A623','#FFC642']} style={sc.gpBanner}>
          <Text style={sc.gpTxt}>{t('vaccine_log.garantisadong')}</Text>
        </LinearGradient>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sc.filterRow}>
          {TABS.map(tab => {
            const active = activeFilter === tab.key;
            const count  = tab.key === 'all' ? totalCount : tab.key === 'given' ? givenCount : tab.key === 'upcoming' ? upcomingCount : overdueCount;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[sc.tab, active && sc.tabActive]}
                onPress={() => setActiveFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[sc.tabTxt, active && sc.tabTxtActive]}>
                  {t(tab.i18n)}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {filteredRecs.length === 0 ? (
          <View style={sc.emptyList}>
            <Text style={{ fontSize: 32 }}>💉</Text>
            <Text style={sc.emptyListTxt}>{t('vaccine_log.no_records')}</Text>
          </View>
        ) : (
          <View>
            {filteredRecs.map(rec => (
              <VaccineRow key={rec.id} record={rec} onPress={() => { setEditRecord(rec); setEditVisible(true); }} />
            ))}
          </View>
        )}

        {/* Find BHS CTA */}
        <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 10 }}>
          <LinearGradient colors={['#1A73C8','#4A9DE8']} style={sc.findBtn}>
            <Text style={sc.findBtnTxt}>{t('vaccine_log.find_center')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Modal */}
      <VaccineEditModal
        visible={editVisible}
        record={editRecord}
        onClose={() => setEditVisible(false)}
        onSave={r => vaccineStore.updateRecord(r.id, r)}
        onDelete={id => { vaccineStore.deleteRecord(id); setEditVisible(false); }}
      />
    </View>
  );
}

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FF' },
  content:   { padding: 16, paddingBottom: 40 },

  emptyHero: { borderRadius: 22, padding: 40, alignItems: 'center', gap: 10, marginBottom: 20 },
  emptyTitle:{ fontSize: 20, fontWeight: '800', color: '#fff' },
  emptySub:  { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },

  gpBanner:  { borderRadius: 14, padding: 14, marginBottom: 12 },
  gpTxt:     { fontSize: 12, color: '#fff', fontWeight: '700', lineHeight: 17 },

  filterRow: { marginBottom: 12 },
  tab:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8e8e8' },
  tabActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabTxt:    { fontSize: 12, fontWeight: '700', color: GRAY },
  tabTxtActive: { color: '#fff' },

  emptyList: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyListTxt: { fontSize: 14, color: GRAY },

  findBtn:   { borderRadius: 16, paddingVertical: 15, alignItems: 'center', shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  findBtnTxt:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});
