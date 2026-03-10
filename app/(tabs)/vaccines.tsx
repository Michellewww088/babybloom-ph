/**
 * vaccines.tsx — Vaccine Knowledge Base + Personal Log (Page 3)
 * BMAD: Beats AsianParents — trilingual Knowledge Base with age accordion,
 *       per-vaccine AI analysis (WHO/DOH/PPS), expert parent resources,
 *       personal records + coverage hero, all in one screen.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal, TextInput,
  StyleSheet, Dimensions, Alert, Platform, Switch,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import Colors from '../../constants/Colors';
import { useChildStore, getChildDisplayName } from '../../store/childStore';
import { useVaccineStore, VaccineRecord, VaccineStatus } from '../../store/vaccineStore';
import {
  DOH_EPI_SCHEDULE, AgeGroup as EpiAgeGroup, VaccineEntry,
  getAgeGroupForVaccine,
} from '../../constants/vaccines-doh-epi';

const { width: W } = Dimensions.get('window');
const BLUE   = '#1A73C8';
const MINT   = '#27AE7A';
const GOLD   = '#F5A623';
const DARK   = '#1C1C3A';
const GRAY   = '#4A4A6A';
const PURPLE = '#7B68EE';
const PINK   = Colors.primaryPink;

type LangKey = 'en' | 'fil' | 'zh';
type MainTab = 'knowledge' | 'records';
type FilterKey = 'all' | 'free' | 'optional';

const AGE_EMOJIS: Record<number, string> = {
  0: '👶', 6: '🌱', 10: '🌿', 14: '🌸',
  26: '🎀', 39: '🌙', 52: '🎂', 54: '🌟', 65: '🚶', 156: '🏫',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
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

// ── AI Report for My Records ───────────────────────────────────────────────────

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
    : `⚠️ ${overdueList.length} vaccine${overdueList.length > 1 ? 's are' : ' is'} overdue: ${overdueList.join(', ')}. `
      + `Please visit your nearest BHS or RHU as soon as possible. Free EPI vaccines are available nationwide.`;

  const tips = [
    `The DOH Philippines EPI program provides free vaccines at all BHS/RHU locations. Always bring your MCH Booklet — it serves as ${name}'s official vaccination record. 📋`,
    `According to the Philippine Pediatric Society (PPS), completing the EPI schedule on time gives ${name} the best protection. Mild fever after a vaccine is normal. 💉`,
    `WHO recommends vaccinating all children per national schedules. BCG, Pentavalent, OPV, PCV, and Rotavirus vaccines are FREE at all government health centers. 🇵🇭`,
  ];

  const nextStep = nextVaccineName
    ? `📅 Next: ${nextVaccineName} on ${fmtDate(nextVaccineDate)} (${daysUntil(nextVaccineDate)} days). `
      + (nextVaccineName.includes('OPV') || nextVaccineName.includes('Rotavirus') ? 'Oral vaccine — no injection! ' : '')
      + `Visit your BHS/RHU on time.`
    : `${name} is up to date with all scheduled vaccines! Remember to complete remaining vaccines as ${name} grows.`;

  return { coverageSummary, actionNeeded, ateTip: tips[ageMonths < 3 ? 0 : ageMonths < 9 ? 1 : 2], nextStep };
}

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
      await new Promise(r => setTimeout(r, 600));
      setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate));
      setIsDemo(true); setLoad(false); return;
    }
    try {
      const prompt = `You are Ate AI, a warm Filipino baby health assistant. Child: ${childName}, ${ageMonths} months. Vaccination: ${givenCount}/${totalCount} given. Overdue: ${overdueList.join(', ') || 'None'}. Next: ${nextVaccineName || 'None'} on ${nextVaccineDate || 'N/A'}. Respond as JSON: {coverageSummary, actionNeeded, ateTip, nextStep}. Use warm Taglish.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) { setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate)); setIsDemo(true); setLoad(false); return; }
      const txt = data?.content?.[0]?.text ?? '';
      try { setReport(JSON.parse(txt.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim())); }
      catch { setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate)); setIsDemo(true); }
    } catch {
      setReport(buildVaccineDemoReport(childName, ageMonths, givenCount, totalCount, overdueList, nextVaccineName, nextVaccineDate));
      setIsDemo(true);
    }
    setLoad(false);
  };

  return (
    <View style={ai.card}>
      <TouchableOpacity style={ai.hdrRow} onPress={() => { setOpen(!open); if (!open && !fetched.current) doFetch(); }} activeOpacity={0.8}>
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
              <Text style={ai.disclaimer}>{t('vaccine_log.ai_disclaimer')}</Text>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

const ai = StyleSheet.create({
  card:      { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, shadowColor: PURPLE, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  hdrRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  hdrLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox:   { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconTxt:   { fontSize: 22 },
  hdrTitle:  { fontSize: 15, fontWeight: '800', color: DARK },
  hdrSub:    { fontSize: 11, color: PURPLE, fontWeight: '600', marginTop: 1 },
  chevron:   { fontSize: 12, color: GRAY, marginLeft: 8 },
  body:      { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  loadRow:   { paddingVertical: 20, alignItems: 'center' },
  loadTxt:   { fontSize: 13, color: PURPLE, fontWeight: '600' },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0EDFF', borderRadius: 12, padding: 12 },
  demoIcon:  { fontSize: 26 },
  demoTitle: { fontSize: 13, fontWeight: '800', color: '#5B4FCF' },
  demoSub:   { fontSize: 11, color: PURPLE, marginTop: 2 },
  section:   { borderRadius: 12, padding: 12, gap: 4 },
  sLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sBody:     { fontSize: 13, color: DARK, lineHeight: 19 },
  disclaimer:{ fontSize: 10, color: GRAY, textAlign: 'center', marginTop: 4, lineHeight: 14 },
});

// ── Coverage Hero ──────────────────────────────────────────────────────────────

function CoverageHero({
  name, ageMonths, givenCount, upcomingCount, overdueCount, totalCount,
}: {
  name: string; ageMonths: number;
  givenCount: number; upcomingCount: number; overdueCount: number; totalCount: number;
}) {
  const { t } = useTranslation();
  const pct  = totalCount > 0 ? Math.round((givenCount / totalCount) * 100) : 0;
  const barW = (W - 32 - 36) * (pct / 100);

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
        <View style={h.stat}><Text style={h.statN}>{givenCount}</Text><Text style={h.statL}>✅ {t('vaccine_log.tab_given')}</Text></View>
        <View style={h.div} />
        <View style={h.stat}><Text style={h.statN}>{upcomingCount}</Text><Text style={h.statL}>⏳ {t('vaccine_log.tab_upcoming')}</Text></View>
        <View style={h.div} />
        <View style={h.stat}>
          <Text style={[h.statN, overdueCount > 0 && { color: '#FFD6D6' }]}>{overdueCount}</Text>
          <Text style={h.statL}>⚠️ {t('vaccine_log.tab_overdue')}</Text>
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

// ── Vaccine Row (My Records) ───────────────────────────────────────────────────

function VaccineRow({ record, onPress }: { record: VaccineRecord; onPress: () => void }) {
  const { t } = useTranslation();
  const days  = record.status === 'upcoming' ? daysUntil(record.scheduledDate) : null;
  const wks   = record.recommendedAgeWeeks;
  const ageLabel = wks === 0 ? t('vaccine_log.at_birth') : wks < 52 ? `${wks}w` : `${Math.round(wks/4.33)}M`;

  return (
    <TouchableOpacity style={[vr.card, { borderLeftColor: statusColor(record.status) }]} onPress={onPress} activeOpacity={0.85}>
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
              {days !== null && days <= 14 && days >= 0 ? <Text style={{ color: days <= 3 ? '#E53E3E' : GOLD }}> ({days}d)</Text> : null}
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
  card:      { backgroundColor: '#fff', borderRadius: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  iconCol:   { width: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  iconTxt:   { fontSize: 20 },
  center:    { flex: 1, paddingVertical: 12, gap: 3 },
  name:      { fontSize: 13, fontWeight: '700', color: DARK, lineHeight: 18 },
  meta:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  metaTxt:   { fontSize: 11, color: GRAY, fontWeight: '500' },
  dot:       { fontSize: 11, color: '#ccc' },
  clinic:    { fontSize: 10, color: GRAY, opacity: 0.7 },
  badge:     { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeFree: { backgroundColor: '#E0F7EF' },
  badgePriv: { backgroundColor: '#FFF8E8' },
  badgeTxt:  { fontSize: 9, fontWeight: '800' },
  chevron:   { fontSize: 18, color: '#ccc' },
});

// ── Edit Modal (My Records) ────────────────────────────────────────────────────

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
    if (status === 'given' && !givenDt) { Alert.alert('Date Required', 'Please enter the date the vaccine was given.'); return; }
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
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={mo.wrap}>
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
            <Text style={mo.secTitle}>{t('vaccine_log.field_status')}</Text>
            <View style={mo.statusRow}>
              {STATUS_OPTS.map(o => (
                <TouchableOpacity key={o.v} style={[mo.statusBtn, status === o.v && { borderColor: o.c, backgroundColor: statusBg(o.v) }]} onPress={() => setStatus(o.v)} activeOpacity={0.8}>
                  <Text style={[mo.statusBtnTxt, status === o.v && { color: o.c }]}>{o.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {status === 'given' && (
              <View style={mo.fBlock}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_date_given')} *</Text>
                <TextInput style={mo.input} value={givenDt} onChangeText={setGivenDt} placeholder="YYYY-MM-DD" placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
              </View>
            )}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_clinic')}</Text>
              <TextInput style={mo.input} value={clinic} onChangeText={setClinic} placeholder="e.g. Makati Medical Center, BHS Poblacion" placeholderTextColor="#ccc" />
            </View>
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_lot')}</Text>
              <TextInput style={mo.input} value={lotNum} onChangeText={setLotNum} placeholder="Optional — useful for recalls" placeholderTextColor="#ccc" />
            </View>
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_admin_by')}</Text>
              <TextInput style={mo.input} value={adminBy} onChangeText={setAdminBy} placeholder="Doctor / Nurse name" placeholderTextColor="#ccc" />
            </View>
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_reaction')}</Text>
              <TextInput style={[mo.input, mo.inputMulti]} value={reaction} onChangeText={setReaction} placeholder='"Mild fever for 1 day", "No reaction"' placeholderTextColor="#ccc" multiline numberOfLines={2} />
            </View>
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_notes')}</Text>
              <TextInput style={[mo.input, mo.inputMulti]} value={notes} onChangeText={setNotes} placeholder="Any additional notes…" placeholderTextColor="#ccc" multiline numberOfLines={2} />
            </View>
            <View style={mo.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_reminder')}</Text>
                <Text style={mo.reminderSub}>{t('vaccine_log.reminder_7days')} ({fmtDate(record.reminderDate ?? record.scheduledDate)})</Text>
              </View>
              <Switch value={reminder} onValueChange={setReminder} trackColor={{ false: '#e0e0e0', true: BLUE + '66' }} thumbColor={reminder ? BLUE : '#aaa'} />
            </View>
            <TouchableOpacity onPress={save} activeOpacity={0.85}>
              <LinearGradient colors={[BLUE,'#4A9DE8']} style={mo.saveBtn}>
                <Text style={mo.saveBtnTxt}>💉 {t('vaccine_log.save')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity style={mo.deleteBtn} onPress={() => Alert.alert(t('vaccine_log.delete'), t('vaccine_log.delete_confirm'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => { onDelete(record.id); onClose(); } },
              ])} activeOpacity={0.85}>
                <Text style={mo.deleteBtnTxt}>🗑 {t('vaccine_log.delete')}</Text>
              </TouchableOpacity>
            )}
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
  wrap:        { flex: 1, backgroundColor: '#FAFAFA' },
  hdr:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  hdrTitle:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  hdrSub:      { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 16 },
  hdrAge:      { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  epiBadge:    { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  epiBadgeTxt: { fontSize: 10, fontWeight: '800' },
  content:     { padding: 16 },
  infoCard:    { backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 16, gap: 2 },
  infoLbl:     { fontSize: 10, fontWeight: '800', color: BLUE, marginTop: 6 },
  infoVal:     { fontSize: 12, color: DARK, lineHeight: 17 },
  secTitle:    { fontSize: 12, fontWeight: '800', color: GRAY, marginBottom: 8, marginTop: 4, letterSpacing: 0.5 },
  statusRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusBtn:   { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', paddingVertical: 10, alignItems: 'center' },
  statusBtnTxt:{ fontSize: 11, fontWeight: '700', color: GRAY },
  fBlock:      { marginBottom: 12 },
  fLbl:        { fontSize: 12, fontWeight: '700', color: GRAY, marginBottom: 6 },
  input:       { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8e8e8', paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: DARK },
  inputMulti:  { minHeight: 60, textAlignVertical: 'top', paddingTop: 11 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 14 },
  reminderSub: { fontSize: 11, color: BLUE, marginTop: 2 },
  saveBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  deleteBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFBDBD', backgroundColor: '#FFF5F5', marginBottom: 14 },
  deleteBtnTxt:{ color: '#E53E3E', fontSize: 14, fontWeight: '700' },
  postCare:    { backgroundColor: '#FFF8E8', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: GOLD, gap: 4 },
  postCareLbl: { fontSize: 11, fontWeight: '800', color: GOLD },
  postCareVal: { fontSize: 12, color: DARK, lineHeight: 17 },
});

// ══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Per-Vaccine AI Analysis ────────────────────────────────────────────────────

interface VaccineDetailAnalysis {
  whyMatters: string;
  commonQs: string;
  whatToExpect: string;
}

function buildVaccineDetailAnalysis(
  vaccine: VaccineEntry,
  childName: string,
): VaccineDetailAnalysis {
  const isFree = vaccine.isFreeEPI;
  const isOral = vaccine.route.toLowerCase().includes('oral');
  const code   = vaccine.code;

  let whyMatters = '';
  if (code === 'BCG') {
    whyMatters = `BCG protects ${childName} against tuberculosis (TB) — a disease that's still prevalent in the Philippines. The DOH requires BCG at birth because it's most effective when given immediately after delivery.\n\n🇵🇭 The Philippines has one of the highest TB rates in Southeast Asia, making this vaccine especially critical for every Filipino newborn. BCG prevents the most severe forms of TB, including TB meningitis which can cause permanent brain damage in infants.`;
  } else if (code === 'HepB1') {
    whyMatters = `Hepatitis B is transmitted from mother to child at birth — this is why the 1st dose must be given within 24 hours of delivery. Without vaccination, babies of infected mothers have a 90% chance of developing chronic Hepatitis B.\n\n📊 WHO estimates 257 million people worldwide live with chronic Hepatitis B. Early vaccination is the most effective prevention strategy available today.`;
  } else if (code.startsWith('Penta')) {
    whyMatters = `The Pentavalent vaccine is one of the most important in the DOH EPI schedule — it protects against 5 serious diseases in one injection:\n\n• Pertussis (whooping cough) — can be fatal in infants under 3 months\n• Diphtheria — causes airway obstruction\n• Tetanus — causes severe muscle spasms\n• Hepatitis B — liver disease\n• Hib — bacterial meningitis\n\n💙 Completing all 3 doses at 6, 10, and 14 weeks builds strong, lasting protection during your baby's most vulnerable period.`;
  } else if (code.startsWith('OPV') || code === 'IPV1') {
    whyMatters = `Polio vaccination is one of the greatest public health successes in history. The Philippines achieved polio-free status through mass vaccination — but in 2019, polio briefly returned due to gaps in vaccination coverage.\n\n🌏 Every child who receives OPV strengthens the Philippines' "community shield." Even one missed child creates a vulnerability. The OPV is oral (no injection!) making it easy and painless for your baby.`;
  } else if (code.startsWith('PCV')) {
    whyMatters = `Pneumonia is the #1 cause of death in Filipino children under 5. The PCV vaccine protects against Streptococcus pneumoniae — the most common bacterial cause of severe pneumonia, meningitis, and blood infections in young children.\n\n💙 Since PCV was added to the free DOH EPI schedule, pneumonia deaths in Filipino children have dropped dramatically. This vaccine truly saves lives.`;
  } else if (code.startsWith('Rota')) {
    whyMatters = `Rotavirus is the leading cause of severe diarrhea and dehydration in Filipino infants. Before this vaccine, rotavirus sent thousands of Filipino babies to the hospital every year.\n\n💧 The great news: Rotavirus vaccine is oral (just liquid drops — no injection!), and it's now FREE under the DOH EPI. It works best when the 1st dose is given before 14 weeks of age, so timing is important.`;
  } else if (code.startsWith('MMR')) {
    whyMatters = `In 2019, the Philippines experienced a major measles outbreak with over 47,000 cases and hundreds of deaths — mostly unvaccinated children. MMR vaccine provides protection against:\n\n• Measles (Tigdas) — can cause pneumonia, brain damage\n• Mumps (Beke) — can cause deafness\n• Rubella — can cause severe birth defects if caught during pregnancy\n\n🛡️ Two doses of MMR provide 97% protection against measles. The 1st dose at 9 months, 2nd at 12-15 months.`;
  } else if (code.startsWith('Flu')) {
    whyMatters = `Influenza (flu) can be severe and even life-threatening for infants under 2 years. The WHO and Philippine Pediatric Society (PPS) recommend annual flu vaccination starting at 6 months.\n\n🌬️ First-time vaccinees need 2 doses given 4 weeks apart. After that, just one dose every year. Flu strains change annually, so yearly vaccination keeps ${childName} protected against the latest circulating strains.`;
  } else if (code.startsWith('HepA')) {
    whyMatters = `Hepatitis A spreads through contaminated food and water — a very real risk in the Philippines where street food and tap water quality varies. It causes liver inflammation, jaundice, and can be debilitating.\n\n💙 Two doses given 6 months apart provide long-lasting (possibly lifelong) protection. The PPS recommends Hepatitis A vaccine as part of the optional but highly recommended schedule for Filipino children.`;
  } else if (code.startsWith('Varicella')) {
    whyMatters = `Chickenpox (Bulutong-tubig) is highly contagious. While often mild, it can cause bacterial skin infections, pneumonia, and even encephalitis (brain inflammation) in some children.\n\n🛡️ Two doses of Varicella vaccine provide over 98% protection. Beyond protecting ${childName}, vaccination prevents spreading chickenpox to immunocompromised children and pregnant women who can suffer severe complications.`;
  } else if (code === 'DPTBooster' || code === 'OPVBooster') {
    whyMatters = `Booster doses are essential because immunity from the primary series naturally wanes over time. Without a booster, ${childName}'s protection against diphtheria, pertussis, and tetanus would decrease as they grow.\n\n📊 Studies show that children who receive booster doses maintain significantly higher levels of protection throughout childhood. The DOH provides this booster FREE at all BHS/RHU.`;
  } else if (code === 'Typhoid') {
    whyMatters = `Typhoid fever is endemic in the Philippines, with thousands of cases annually. It spreads through contaminated food and water, causing sustained high fever, stomach pain, and potentially life-threatening complications.\n\n🇵🇭 Philippine pediatricians strongly recommend typhoid vaccination for children 3 years and older, especially before school entry and travel. A booster is needed every 3 years.`;
  } else {
    whyMatters = `WHO and the Philippine Pediatric Society (PPS) include this vaccine in the recommended childhood immunization schedule. It provides vital protection during ${childName}'s critical developmental years.\n\n💉 This vaccine has been rigorously tested and approved by the Food and Drug Administration (FDA) Philippines and is aligned with global immunization standards.`;
  }

  let commonQs = '';
  if (isOral) {
    commonQs = `**Q: Is an oral vaccine really effective?**\nAbsolutely! Oral vaccines like OPV and Rotavirus are highly effective and work by stimulating immunity in the gut — exactly where these viruses enter the body.\n\n**Q: My baby spit some out — is it still effective?**\nA small amount is fine. If the majority was spit out within the first few minutes, inform the health worker — they may administer another dose.\n\n**Q: Do I breastfeed before or after?**\nBreastfeeding is fine! For OPV specifically, do not feed or give water for 30 minutes after administration to allow absorption.`;
  } else if (code === 'BCG') {
    commonQs = `**Q: Why is there a bump/sore at the injection site?**\nThis is completely normal! BCG creates a small ulcer that heals into a scar over 2-3 months. This scar is proof the vaccine worked. Do not apply cream, antiseptic, or bandage.\n\n**Q: What if the scar is very big?**\nThe scar size varies and doesn't indicate how well the vaccine worked. Consult your Pedia only if there's excessive pus, spreading redness, or swollen lymph nodes in the armpit.\n\n**Q: My baby didn't get BCG at birth — can I still give it later?**\nYes! BCG can be given up to 5 years of age. Visit your BHS/RHU — it's free.`;
  } else if (code.startsWith('MMR')) {
    commonQs = `**Q: My baby got a rash and fever 10 days after MMR — is this normal?**\nYes! A mild rash and low fever 7-14 days after MMR is completely normal and not contagious. It shows the immune system is working. Consult Pedia only if fever exceeds 38.5°C or the rash is severe.\n\n**Q: I've heard MMR causes autism — is this true?**\nThis has been completely disproven. The original 1998 study was fraudulent and retracted. Hundreds of large studies involving millions of children have found NO link between MMR and autism. WHO, AAP, and PPS all confirm MMR is safe.\n\n**Q: Can I give MMR and other vaccines at the same time?**\nYes, this is safe and recommended. Multiple vaccines on the same day is standard practice.`;
  } else if (code.startsWith('Penta')) {
    commonQs = `**Q: My baby screams a lot after Pentavalent — is this normal?**\nFussiness and crying for a few hours is normal and expected. It's uncomfortable but not dangerous. Breastfeeding, cuddling, and paracetamol (per weight) help.\n\n**Q: How many more Pentavalent doses are needed?**\n3 doses total: at 6, 10, and 14 weeks. All 3 are needed for complete protection.\n\n**Q: My baby had a fever of 38°C after the shot — what should I do?**\nLow-grade fever (below 38.5°C) is normal. Give paracetamol at the dose prescribed by your Pedia based on ${childName}'s weight. If fever exceeds 38.5°C or persists beyond 2 days, consult your Pedia.`;
  } else if (!isFree) {
    commonQs = `**Q: Is this vaccine really necessary if it's not in the free EPI?**\nWhile not in the free schedule, the PPS recommends this vaccine as an important addition to your child's protection. Talk to your pediatrician about whether it's right for ${childName}.\n\n**Q: Is there financial assistance available?**\nSome hospitals offer package deals for optional vaccines. PhilHealth may cover some vaccines under certain packages. Check with your local health center.\n\n**Q: Can I give this alongside EPI vaccines?**\nYes! Multiple vaccines given simultaneously are safe and reduce the number of clinic visits needed.`;
  } else {
    commonQs = `**Q: Can my baby get multiple vaccines in one visit?**\nYes! This is safe, recommended, and reduces clinic trips. Your baby's immune system can easily handle multiple vaccines simultaneously.\n\n**Q: Is it OK to vaccinate if my baby has a mild cold?**\nMild illness (runny nose, low-grade fever) is generally not a reason to delay vaccination. However, if your baby has a moderate or severe illness, wait until they recover. When in doubt, consult your Pedia.\n\n**Q: What if we missed the recommended age?**\nCatch-up vaccination is available at BHS/RHU. Vaccines given after the recommended age still provide protection — it's never too late!`;
  }

  const whatToExpect = isFree
    ? `📍 **Where:** Nearest Barangay Health Station (BHS) or Rural Health Unit (RHU) — 100% FREE. No appointment needed.\n\n📋 **Bring:** MCH Booklet (Mother & Child Health Booklet) — required for the official vaccination record.\n\n👗 **Dress baby in:** Comfortable clothing with easy access to the thighs (for injection) or arms.\n\n🤱 **Tip:** Breastfeed during or right after vaccination — studies show it reduces pain!\n\n🩹 **After vaccination:** ${vaccine.postVaccineCare}\n\n⚠️ **Call your Pedia if:** Fever above 38.5°C, persistent crying over 3 hours, unusual swelling, or difficulty breathing.`
    : `📍 **Where:** Private pediatric clinic or hospital. Estimated cost: ${vaccine.whereToGet.en.split('(').pop()?.replace(')', '') ?? 'ask your Pedia'}.\n\n📋 **Bring:** MCH Booklet and insurance card if applicable. Ask about PhilHealth coverage.\n\n💡 **Save money:** Ask your pediatrician about combination vaccine packages that may reduce overall cost.\n\n🩹 **After vaccination:** ${vaccine.postVaccineCare}\n\n⚠️ **Call your Pedia if:** Fever above 38.5°C, persistent crying over 3 hours, or any severe reaction.`;

  return { whyMatters, commonQs, whatToExpect };
}

function VaccineDetailAI({
  vaccine, childName,
}: {
  vaccine: VaccineEntry; childName: string;
}) {
  const { t }      = useTranslation();
  const [open, setOpen]   = useState(false);
  const [analysis, setAnalysis] = useState<VaccineDetailAnalysis | null>(null);
  const [activeSection, setActiveSection] = useState<'why' | 'qa' | 'expect'>('why');

  useEffect(() => {
    if (open && !analysis) {
      setAnalysis(buildVaccineDetailAnalysis(vaccine, childName));
    }
  }, [open]);

  return (
    <View style={kbai.card}>
      <TouchableOpacity style={kbai.hdr} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <LinearGradient colors={[PURPLE, '#9B8EFF']} style={kbai.iconBox}>
          <Text style={kbai.iconTxt}>✨</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={kbai.title}>{t('vaccine_kb.ai_title')}</Text>
          <Text style={kbai.sub}>{t('vaccine_kb.ai_sub')}</Text>
        </View>
        <Text style={kbai.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && analysis && (
        <View style={kbai.body}>
          {/* Section Tabs */}
          <View style={kbai.sectionTabs}>
            {(['why', 'qa', 'expect'] as const).map(sec => (
              <TouchableOpacity
                key={sec}
                style={[kbai.secTab, activeSection === sec && kbai.secTabActive]}
                onPress={() => setActiveSection(sec)} activeOpacity={0.8}
              >
                <Text style={[kbai.secTabTxt, activeSection === sec && kbai.secTabTxtActive]}>
                  {sec === 'why' ? t('vaccine_kb.ai_section_why').split(' ')[0] : sec === 'qa' ? t('vaccine_kb.ai_section_qa').split(' ')[0] : t('vaccine_kb.ai_section_expect').split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {activeSection === 'why' && (
            <View style={[kbai.section, { backgroundColor: '#E8F2FF' }]}>
              <Text style={[kbai.sLabel, { color: BLUE }]}>{t('vaccine_kb.ai_section_why')}</Text>
              <Text style={kbai.sBody}>{analysis.whyMatters}</Text>
            </View>
          )}
          {activeSection === 'qa' && (
            <View style={[kbai.section, { backgroundColor: '#FFF8E8' }]}>
              <Text style={[kbai.sLabel, { color: GOLD }]}>{t('vaccine_kb.ai_section_qa')}</Text>
              <Text style={kbai.sBody}>{analysis.commonQs}</Text>
            </View>
          )}
          {activeSection === 'expect' && (
            <View style={[kbai.section, { backgroundColor: '#E0F7EF' }]}>
              <Text style={[kbai.sLabel, { color: MINT }]}>{t('vaccine_kb.ai_section_expect')}</Text>
              <Text style={kbai.sBody}>{analysis.whatToExpect}</Text>
            </View>
          )}
          <Text style={kbai.disclaimer}>{t('vaccine_kb.ai_disclaimer')}</Text>
        </View>
      )}
    </View>
  );
}

const kbai = StyleSheet.create({
  card:        { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, shadowColor: PURPLE, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  hdr:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconTxt:     { fontSize: 20 },
  title:       { fontSize: 14, fontWeight: '800', color: DARK },
  sub:         { fontSize: 10, color: PURPLE, fontWeight: '600', marginTop: 1 },
  chevron:     { fontSize: 12, color: GRAY, marginLeft: 4 },
  body:        { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  sectionTabs: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  secTab:      { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: '#F5F5F7', alignItems: 'center' },
  secTabActive:{ backgroundColor: PURPLE },
  secTabTxt:   { fontSize: 10, fontWeight: '700', color: GRAY },
  secTabTxtActive: { color: '#fff' },
  section:     { borderRadius: 12, padding: 12 },
  sLabel:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  sBody:       { fontSize: 12, color: DARK, lineHeight: 19 },
  disclaimer:  { fontSize: 10, color: GRAY, textAlign: 'center', lineHeight: 14 },
});

// ── Vaccine Detail Modal ───────────────────────────────────────────────────────

function VaccineDetailModal({
  visible, vaccine, childRecord, childName, onClose, onMarkGiven,
}: {
  visible: boolean; vaccine: VaccineEntry | null;
  childRecord?: VaccineRecord; childName: string;
  onClose: () => void; onMarkGiven?: (record: VaccineRecord) => void;
}) {
  const { t }        = useTranslation();
  const [lang, setLang] = useState<LangKey>('en');
  const [sideOpen, setSideOpen]   = useState(false);
  const [careOpen, setCareOpen]   = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);

  if (!vaccine) return null;

  const isOral = vaccine.route.toLowerCase().includes('oral');
  const gradColors: [string, string] = vaccine.isFreeEPI ? ['#1A73C8','#4A9DE8'] : ['#D4860A','#F5A623'];

  const getName = () => lang === 'en' ? vaccine.nameEN : lang === 'fil' ? vaccine.nameFIL : vaccine.nameZH;
  const getProtects = () => lang === 'en' ? vaccine.protectsAgainst.en : lang === 'fil' ? vaccine.protectsAgainst.fil : vaccine.protectsAgainst.zh;
  const getWhere = () => lang === 'en' ? vaccine.whereToGet.en : lang === 'fil' ? vaccine.whereToGet.fil : vaccine.whereToGet.zh;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <View style={det.wrap}>
        {/* Header */}
        <LinearGradient colors={gradColors} style={det.hdr}>
          <TouchableOpacity onPress={onClose} style={det.closeBtn}>
            <Text style={det.closeTxt}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={det.routeRow}>
              <Text style={det.routeIcon}>{isOral ? '💊' : '💉'}</Text>
              <Text style={det.routeTxt}>{isOral ? t('vaccine_kb.oral_route') : t('vaccine_kb.inj_route')}</Text>
            </View>
            <Text style={det.hdrName} numberOfLines={3}>{getName()}</Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <View style={[det.epiBadge, { backgroundColor: vaccine.isFreeEPI ? '#C8F7DC' : '#FFF0C8' }]}>
              <Text style={[det.epiBadgeTxt, { color: vaccine.isFreeEPI ? '#1A7A4A' : '#A05C00' }]}>
                {vaccine.isFreeEPI ? t('vaccine_kb.free_badge') : t('vaccine_kb.private_badge')}
              </Text>
            </View>
            <Text style={det.doseLbl}>{vaccine.doses} {t('vaccine_kb.detail_doses')}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={det.content} showsVerticalScrollIndicator={false}>
          {/* Language Toggle */}
          <View style={det.langRow}>
            {(['en', 'fil', 'zh'] as LangKey[]).map(l => (
              <TouchableOpacity key={l} style={[det.langBtn, lang === l && det.langBtnActive]} onPress={() => setLang(l)} activeOpacity={0.8}>
                <Text style={[det.langTxt, lang === l && det.langTxtActive]}>
                  {l === 'en' ? t('vaccine_kb.lang_en') : l === 'fil' ? t('vaccine_kb.lang_fil') : t('vaccine_kb.lang_zh')}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flex: 1 }} />
            <Text style={det.langHint}>Trilingual 🌏</Text>
          </View>

          {/* Protects Against (big highlight) */}
          <LinearGradient colors={vaccine.isFreeEPI ? ['#E8F2FF','#D0E8FF'] : ['#FFF8E8','#FFEEcc']} style={det.protectsBox}>
            <Text style={[det.protectsLbl, { color: vaccine.isFreeEPI ? BLUE : '#A05C00' }]}>🛡️ {t('vaccine_kb.detail_protects')}</Text>
            <Text style={[det.protectsTxt, { color: vaccine.isFreeEPI ? DARK : '#6B3A00' }]}>{getProtects()}</Text>
          </LinearGradient>

          {/* Info Grid */}
          <View style={det.infoGrid}>
            <View style={det.infoCell}>
              <Text style={det.infoCellIcon}>{isOral ? '💊' : '💉'}</Text>
              <Text style={det.infoCellLbl}>{t('vaccine_kb.detail_route')}</Text>
              <Text style={det.infoCellVal}>{vaccine.route.split('(')[0].trim()}</Text>
            </View>
            <View style={det.infoDivider} />
            <View style={det.infoCell}>
              <Text style={det.infoCellIcon}>🔢</Text>
              <Text style={det.infoCellLbl}>{t('vaccine_kb.detail_doses')}</Text>
              <Text style={det.infoCellVal}>{vaccine.doses}-dose series</Text>
            </View>
            <View style={det.infoDivider} />
            <View style={det.infoCell}>
              <Text style={det.infoCellIcon}>{vaccine.isFreeEPI ? '🟢' : '💰'}</Text>
              <Text style={det.infoCellLbl}>Cost</Text>
              <Text style={[det.infoCellVal, { color: vaccine.isFreeEPI ? MINT : GOLD }]}>
                {vaccine.isFreeEPI ? 'FREE' : 'Optional'}
              </Text>
            </View>
          </View>

          {/* Side Effects (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setSideOpen(!sideOpen)} activeOpacity={0.8}>
            <Text style={det.collapsibleLbl}>⚡ {t('vaccine_kb.detail_side_effects')}</Text>
            <Text style={det.collapsibleChevron}>{sideOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {sideOpen && (
            <View style={det.collapsibleBody}>
              <Text style={det.collapsibleTxt}>{vaccine.sideEffects}</Text>
            </View>
          )}

          {/* Post-Vaccine Care (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setCareOpen(!careOpen)} activeOpacity={0.8}>
            <Text style={det.collapsibleLbl}>🩹 {t('vaccine_kb.detail_post_care')}</Text>
            <Text style={det.collapsibleChevron}>{careOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {careOpen && (
            <View style={[det.collapsibleBody, { backgroundColor: '#FFF8E8', borderLeftColor: GOLD }]}>
              <Text style={det.collapsibleTxt}>{vaccine.postVaccineCare}</Text>
            </View>
          )}

          {/* Where to Get (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setWhereOpen(!whereOpen)} activeOpacity={0.8}>
            <Text style={det.collapsibleLbl}>📍 {t('vaccine_kb.detail_where')}</Text>
            <Text style={det.collapsibleChevron}>{whereOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {whereOpen && (
            <View style={[det.collapsibleBody, { backgroundColor: '#E0F7EF', borderLeftColor: MINT }]}>
              <Text style={[det.collapsibleTxt, { color: '#1A5C3A' }]}>{getWhere()}</Text>
            </View>
          )}

          {/* AI Expert Analysis */}
          <VaccineDetailAI vaccine={vaccine} childName={childName} />

          {/* Child Status + Action */}
          {childRecord && (
            <View style={det.childStatusBox}>
              <Text style={det.childStatusLbl}>{t('vaccine_kb.child_status_lbl')} {childName}</Text>
              <View style={[det.childStatusChip, { backgroundColor: statusBg(childRecord.status) }]}>
                <Text style={[det.childStatusTxt, { color: statusColor(childRecord.status) }]}>
                  {statusIcon(childRecord.status)} {childRecord.status.charAt(0).toUpperCase() + childRecord.status.slice(1)}
                  {childRecord.status === 'given' && childRecord.givenDate ? ` · ${fmtDate(childRecord.givenDate)}` : ''}
                  {childRecord.status === 'upcoming' ? ` · ${fmtDate(childRecord.scheduledDate)}` : ''}
                </Text>
              </View>
              {(childRecord.status === 'upcoming' || childRecord.status === 'overdue') && onMarkGiven && (
                <TouchableOpacity
                  style={det.markGivenBtn}
                  onPress={() => { onClose(); onMarkGiven(childRecord); }}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[MINT, '#3AC88A']} style={det.markGivenGrad}>
                    <Text style={det.markGivenTxt}>{t('vaccine_kb.mark_given')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {childRecord.status === 'given' && onMarkGiven && (
                <TouchableOpacity style={det.viewRecordBtn} onPress={() => { onClose(); onMarkGiven(childRecord); }} activeOpacity={0.85}>
                  <Text style={det.viewRecordTxt}>{t('vaccine_kb.view_record')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const det = StyleSheet.create({
  wrap:             { flex: 1, backgroundColor: '#FAFAFA' },
  hdr:              { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 20 },
  closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  closeTxt:         { color: '#fff', fontSize: 14, fontWeight: '700' },
  routeRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  routeIcon:        { fontSize: 18 },
  routeTxt:         { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  hdrName:          { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  epiBadge:         { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  epiBadgeTxt:      { fontSize: 10, fontWeight: '800' },
  doseLbl:          { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  content:          { padding: 16 },
  langRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  langBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: 'transparent' },
  langBtnActive:    { backgroundColor: DARK, borderColor: DARK },
  langTxt:          { fontSize: 12, fontWeight: '700', color: GRAY },
  langTxtActive:    { color: '#fff' },
  langHint:         { fontSize: 10, color: GRAY, fontStyle: 'italic' },
  protectsBox:      { borderRadius: 16, padding: 16, marginBottom: 12 },
  protectsLbl:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  protectsTxt:      { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  infoGrid:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  infoCell:         { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  infoCellIcon:     { fontSize: 20 },
  infoCellLbl:      { fontSize: 9, color: GRAY, fontWeight: '700', letterSpacing: 0.4 },
  infoCellVal:      { fontSize: 12, color: DARK, fontWeight: '700', textAlign: 'center' },
  infoDivider:      { width: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  collapsibleHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  collapsibleLbl:   { fontSize: 13, fontWeight: '700', color: DARK },
  collapsibleChevron:{ fontSize: 11, color: GRAY },
  collapsibleBody:  { backgroundColor: '#F0F8FF', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: BLUE },
  collapsibleTxt:   { fontSize: 13, color: DARK, lineHeight: 20 },
  childStatusBox:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  childStatusLbl:   { fontSize: 11, color: GRAY, fontWeight: '700', marginBottom: 8 },
  childStatusChip:  { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 12 },
  childStatusTxt:   { fontSize: 13, fontWeight: '800' },
  markGivenBtn:     { borderRadius: 12, overflow: 'hidden' },
  markGivenGrad:    { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  markGivenTxt:     { color: '#fff', fontSize: 15, fontWeight: '800' },
  viewRecordBtn:    { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: BLUE },
  viewRecordTxt:    { color: BLUE, fontSize: 14, fontWeight: '700' },
});

// ── Parent Resource Articles ───────────────────────────────────────────────────

const PARENT_RESOURCES = [
  {
    icon: '🟢',
    titleKey: 'vaccine_kb.res_1_title',
    bodyKey:  'vaccine_kb.res_1_body',
    color: MINT,
    bg: '#E0F7EF',
  },
  {
    icon: '🔬',
    titleKey: 'vaccine_kb.res_2_title',
    bodyKey:  'vaccine_kb.res_2_body',
    color: BLUE,
    bg: '#E8F2FF',
  },
  {
    icon: '🌡️',
    titleKey: 'vaccine_kb.res_3_title',
    bodyKey:  'vaccine_kb.res_3_body',
    color: '#E53E3E',
    bg: '#FFF5F5',
  },
  {
    icon: '🚫',
    titleKey: 'vaccine_kb.res_4_title',
    bodyKey:  'vaccine_kb.res_4_body',
    color: PURPLE,
    bg: '#F0EDFF',
  },
  {
    icon: '📅',
    titleKey: 'vaccine_kb.res_5_title',
    bodyKey:  'vaccine_kb.res_5_body',
    color: GOLD,
    bg: '#FFF8E8',
  },
];

function ParentResourceCard({ icon, titleKey, bodyKey, color, bg }: typeof PARENT_RESOURCES[0]) {
  const { t }      = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={[res.card, { borderLeftColor: color }]}>
      <TouchableOpacity style={res.hdr} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={[res.iconBox, { backgroundColor: bg }]}>
          <Text style={res.iconTxt}>{icon}</Text>
        </View>
        <Text style={res.title} numberOfLines={open ? undefined : 2}>{t(titleKey)}</Text>
        <Text style={[res.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={res.body}>
          <Text style={res.bodyTxt}>{t(bodyKey)}</Text>
          <View style={[res.sourceBadge, { backgroundColor: bg }]}>
            <Text style={[res.sourceTxt, { color }]}>📚 Source: DOH Philippines · WHO · PPS</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const res = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: 14, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  hdr:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  iconBox:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconTxt:  { fontSize: 20 },
  title:    { flex: 1, fontSize: 13, fontWeight: '700', color: DARK, lineHeight: 18 },
  chevron:  { fontSize: 11, marginLeft: 4 },
  body:     { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  bodyTxt:  { fontSize: 13, color: GRAY, lineHeight: 20 },
  sourceBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  sourceTxt:   { fontSize: 10, fontWeight: '700' },
});

// ── Age Group Accordion ────────────────────────────────────────────────────────

function AgeGroupAccordion({
  group, childRecords, onVaccineTap, defaultOpen,
}: {
  group: EpiAgeGroup;
  childRecords: VaccineRecord[];
  onVaccineTap: (v: VaccineEntry, r?: VaccineRecord) => void;
  defaultOpen: boolean;
}) {
  const { t }         = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const emoji  = AGE_EMOJIS[group.recommendedAgeWeeks] ?? '💉';
  const ageLabel = group.ageLabel.en;

  const groupRecords = childRecords.filter(r =>
    group.vaccines.some(v => v.code === r.code)
  );
  const givenInGroup = groupRecords.filter(r => r.status === 'given').length;
  const totalInGroup = group.vaccines.length;
  const hasOverdue   = groupRecords.some(r => r.status === 'overdue');
  const hasUpcoming  = groupRecords.some(r => r.status === 'upcoming');

  return (
    <View style={acc.card}>
      <TouchableOpacity style={acc.hdr} onPress={() => setOpen(!open)} activeOpacity={0.85}>
        <View style={acc.ageBox}>
          <Text style={acc.ageEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={acc.ageLabel}>{ageLabel}</Text>
          <Text style={acc.vaccineCount}>{totalInGroup} {t('vaccine_kb.vaccines_in_group', { count: totalInGroup })}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {childRecords.length > 0 && (
            <View style={[acc.progressBadge, {
              backgroundColor: givenInGroup === totalInGroup ? '#E0F7EF' :
                hasOverdue ? '#FFF5F5' : '#E8F2FF',
            }]}>
              <Text style={[acc.progressTxt, {
                color: givenInGroup === totalInGroup ? MINT :
                  hasOverdue ? '#E53E3E' : BLUE,
              }]}>
                {givenInGroup === totalInGroup ? '✅' : hasOverdue ? '⚠️' : '⏳'}{' '}
                {givenInGroup}/{totalInGroup}
              </Text>
            </View>
          )}
          <Text style={acc.chevron}>{open ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {open && (
        <View style={acc.list}>
          {group.vaccines.map(vaccine => {
            const record = childRecords.find(r => r.code === vaccine.code);
            return (
              <TouchableOpacity
                key={vaccine.code}
                style={[acc.vaccRow, record && { borderLeftColor: statusColor(record.status), borderLeftWidth: 3 }]}
                onPress={() => onVaccineTap(vaccine, record)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <View style={acc.vaccTop}>
                    <Text style={acc.vaccName} numberOfLines={2}>{vaccine.nameEN}</Text>
                    <View style={[acc.epiBadge, { backgroundColor: vaccine.isFreeEPI ? '#E0F7EF' : '#FFF8E8' }]}>
                      <Text style={[acc.epiBadgeTxt, { color: vaccine.isFreeEPI ? MINT : GOLD }]}>
                        {vaccine.isFreeEPI ? t('vaccine_kb.free_badge') : t('vaccine_kb.private_badge')}
                      </Text>
                    </View>
                  </View>
                  <View style={acc.vaccMeta}>
                    <Text style={acc.vaccRoute}>
                      {vaccine.route.toLowerCase().includes('oral') ? '💊 ' : '💉 '}
                      {vaccine.route.split('(')[0].trim()}
                    </Text>
                    <Text style={acc.vaccDot}>·</Text>
                    <Text style={acc.vaccProtects} numberOfLines={1}>
                      {vaccine.protectsAgainst.en}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  {record ? (
                    <View style={[acc.statusDot, { backgroundColor: statusColor(record.status) }]}>
                      <Text style={acc.statusDotTxt}>{statusIcon(record.status)}</Text>
                    </View>
                  ) : null}
                  <Text style={acc.vaccChevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const acc = StyleSheet.create({
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  hdr:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  ageBox:       { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F5FA', alignItems: 'center', justifyContent: 'center' },
  ageEmoji:     { fontSize: 24 },
  ageLabel:     { fontSize: 15, fontWeight: '800', color: DARK },
  vaccineCount: { fontSize: 11, color: GRAY, marginTop: 2, fontWeight: '500' },
  progressBadge:{ borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  progressTxt:  { fontSize: 11, fontWeight: '800' },
  chevron:      { fontSize: 12, color: GRAY },
  list:         { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  vaccRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7F7F7' },
  vaccTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  vaccName:     { flex: 1, fontSize: 13, fontWeight: '700', color: DARK, lineHeight: 18 },
  epiBadge:     { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  epiBadgeTxt:  { fontSize: 9, fontWeight: '800' },
  vaccMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  vaccRoute:    { fontSize: 11, color: GRAY, fontWeight: '500' },
  vaccDot:      { fontSize: 11, color: '#ccc' },
  vaccProtects: { fontSize: 11, color: GRAY, flex: 1 },
  statusDot:    { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusDotTxt: { fontSize: 14 },
  vaccChevron:  { fontSize: 18, color: '#ccc' },
});

// ── Knowledge Base Tab ─────────────────────────────────────────────────────────

function KnowledgeBaseTab({
  childRecords, childName, onVaccineTap,
}: {
  childRecords: VaccineRecord[];
  childName: string;
  onVaccineTap: (v: VaccineEntry, r?: VaccineRecord) => void;
}) {
  const { t }                       = useTranslation();
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<FilterKey>('all');

  const filteredGroups = DOH_EPI_SCHEDULE.map(group => ({
    ...group,
    vaccines: group.vaccines.filter(v => {
      const matchFilter = filter === 'all' || (filter === 'free' ? v.isFreeEPI : !v.isFreeEPI);
      if (!matchFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        v.nameEN.toLowerCase().includes(q) ||
        v.nameFIL.toLowerCase().includes(q) ||
        v.nameZH.toLowerCase().includes(q) ||
        v.protectsAgainst.en.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q)
      );
    }),
  })).filter(g => g.vaccines.length > 0);

  const FILTERS: { key: FilterKey; label: string; color: string; activeBg: string }[] = [
    { key: 'all',      label: t('vaccine_kb.filter_all'),      color: DARK,  activeBg: DARK  },
    { key: 'free',     label: t('vaccine_kb.filter_free'),     color: MINT,  activeBg: MINT  },
    { key: 'optional', label: t('vaccine_kb.filter_optional'), color: GOLD,  activeBg: GOLD  },
  ];

  return (
    <View>
      {/* Search Bar */}
      <View style={kb.searchRow}>
        <Text style={kb.searchIcon}>🔍</Text>
        <TextInput
          style={kb.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('vaccine_kb.search_placeholder')}
          placeholderTextColor="#aaa"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Text style={kb.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={kb.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[kb.chip, filter === f.key && { backgroundColor: f.activeBg, borderColor: f.activeBg }]}
            onPress={() => setFilter(f.key)} activeOpacity={0.8}
          >
            <Text style={[kb.chipTxt, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* EPI Coverage Banner */}
      {filter !== 'optional' && (
        <LinearGradient colors={['#E0F7EF','#C8F7DC']} style={kb.epiBanner}>
          <Text style={kb.epiBannerTxt}>🟢 {t('vaccine_kb.epi_banner')}</Text>
        </LinearGradient>
      )}

      {/* Age Group Accordions */}
      {filteredGroups.length === 0 ? (
        <View style={kb.noResults}>
          <Text style={kb.noResultsIcon}>🔍</Text>
          <Text style={kb.noResultsTxt}>{t('vaccine_kb.no_results')}</Text>
        </View>
      ) : (
        filteredGroups.map((group, idx) => (
          <AgeGroupAccordion
            key={group.recommendedAgeWeeks}
            group={group}
            childRecords={childRecords}
            onVaccineTap={onVaccineTap}
            defaultOpen={idx === 0}
          />
        ))
      )}

      {/* Parent Resources */}
      <View style={kb.resourcesHeader}>
        <LinearGradient colors={[PURPLE,'#9B8EFF']} style={kb.resourcesIconBox}>
          <Text style={kb.resourcesIconTxt}>📚</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={kb.resourcesTitle}>{t('vaccine_kb.resources_title')}</Text>
          <Text style={kb.resourcesSub}>{t('vaccine_kb.resources_sub')}</Text>
        </View>
      </View>
      {PARENT_RESOURCES.map((r, i) => (
        <ParentResourceCard key={i} {...r} />
      ))}

      {/* BHS Locator CTA */}
      <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 6 }}>
        <LinearGradient colors={['#1A73C8','#4A9DE8']} style={kb.bhsBtn}>
          <Text style={kb.bhsBtnTxt}>🏥 {t('vaccine_log.find_center')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </View>
  );
}

const kb = StyleSheet.create({
  searchRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchIcon:     { fontSize: 16 },
  searchInput:    { flex: 1, fontSize: 14, color: DARK },
  searchClear:    { fontSize: 12, color: GRAY, padding: 2 },
  filterRow:      { marginBottom: 10 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8e8e8' },
  chipTxt:        { fontSize: 12, fontWeight: '700', color: GRAY },
  epiBanner:      { borderRadius: 12, padding: 12, marginBottom: 12 },
  epiBannerTxt:   { fontSize: 12, color: '#1A5C3A', fontWeight: '700', lineHeight: 17 },
  noResults:      { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noResultsIcon:  { fontSize: 36 },
  noResultsTxt:   { fontSize: 14, color: GRAY, textAlign: 'center' },
  resourcesHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 12 },
  resourcesIconBox:{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resourcesIconTxt:{ fontSize: 22 },
  resourcesTitle: { fontSize: 16, fontWeight: '800', color: DARK },
  resourcesSub:   { fontSize: 11, color: GRAY, marginTop: 2 },
  bhsBtn:         { borderRadius: 16, paddingVertical: 15, alignItems: 'center', shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  bhsBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '800' },
});

// ── Records Tab (existing log wrapped) ────────────────────────────────────────

const RECORD_TABS: { key: VaccineStatus | 'all'; i18n: string }[] = [
  { key: 'all',      i18n: 'vaccine_log.tab_all' },
  { key: 'given',    i18n: 'vaccine_log.tab_given' },
  { key: 'upcoming', i18n: 'vaccine_log.tab_upcoming' },
  { key: 'overdue',  i18n: 'vaccine_log.tab_overdue' },
];

function RecordsTab({
  childName, ageMonths, allForChild,
  givenCount, upcomingCount, overdueCount, totalCount,
  overdueNames, nextUpcoming, onEditRecord,
}: {
  childName: string; ageMonths: number;
  allForChild: VaccineRecord[];
  givenCount: number; upcomingCount: number; overdueCount: number; totalCount: number;
  overdueNames: string[]; nextUpcoming: VaccineRecord | null;
  onEditRecord: (r: VaccineRecord) => void;
}) {
  const { t }                       = useTranslation();
  const [activeFilter, setActiveFilter] = useState<VaccineStatus | 'all'>('all');
  const vaccineStore                = useVaccineStore();
  const { activeChild }             = useChildStore();

  const filteredRecs = activeChild
    ? vaccineStore.getRecords(activeChild.id, activeFilter === 'all' ? undefined : activeFilter)
    : [];

  return (
    <View>
      <CoverageHero
        name={childName} ageMonths={ageMonths}
        givenCount={givenCount} upcomingCount={upcomingCount}
        overdueCount={overdueCount} totalCount={totalCount}
      />
      <VaccineAISection
        childName={childName} ageMonths={ageMonths}
        givenCount={givenCount} totalCount={totalCount}
        overdueList={overdueNames}
        nextVaccineName={nextUpcoming?.nameEN ?? ''}
        nextVaccineDate={nextUpcoming?.scheduledDate ?? ''}
      />
      <LinearGradient colors={['#F5A623','#FFC642']} style={rt.gpBanner}>
        <Text style={rt.gpTxt}>{t('vaccine_log.garantisadong')}</Text>
      </LinearGradient>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rt.filterRow}>
        {RECORD_TABS.map(tab => {
          const active = activeFilter === tab.key;
          const count  = tab.key === 'all' ? totalCount : tab.key === 'given' ? givenCount : tab.key === 'upcoming' ? upcomingCount : overdueCount;
          return (
            <TouchableOpacity key={tab.key} style={[rt.tab, active && rt.tabActive]} onPress={() => setActiveFilter(tab.key)} activeOpacity={0.8}>
              <Text style={[rt.tabTxt, active && rt.tabTxtActive]}>
                {t(tab.i18n)}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {filteredRecs.length === 0 ? (
        <View style={rt.emptyList}><Text style={{ fontSize: 32 }}>💉</Text><Text style={rt.emptyTxt}>{t('vaccine_log.no_records')}</Text></View>
      ) : (
        <View>{filteredRecs.map(rec => <VaccineRow key={rec.id} record={rec} onPress={() => onEditRecord(rec)} />)}</View>
      )}
      <View style={{ height: 20 }} />
    </View>
  );
}

const rt = StyleSheet.create({
  gpBanner:  { borderRadius: 14, padding: 14, marginBottom: 12 },
  gpTxt:     { fontSize: 12, color: '#fff', fontWeight: '700', lineHeight: 17 },
  filterRow: { marginBottom: 12 },
  tab:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8e8e8' },
  tabActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabTxt:    { fontSize: 12, fontWeight: '700', color: GRAY },
  tabTxtActive: { color: '#fff' },
  emptyList: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyTxt:  { fontSize: 14, color: GRAY },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function VaccinesScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const vaccineStore    = useVaccineStore();

  const [isLoading,     setIsLoading]     = useState(true);
  const [mainTab,       setMainTab]       = useState<MainTab>('knowledge');
  const [detailVaccine, setDetailVaccine] = useState<VaccineEntry | null>(null);
  const [detailRecord,  setDetailRecord]  = useState<VaccineRecord | undefined>(undefined);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editRecord,    setEditRecord]    = useState<VaccineRecord | null>(null);
  const [editVisible,   setEditVisible]   = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeChild?.id && activeChild.birthday) {
      vaccineStore.autoPopulate(activeChild.id, activeChild.birthday);
      vaccineStore.refreshStatuses(activeChild.id);
    }
  }, [activeChild?.id]);

  const allForChild   = activeChild ? vaccineStore.getRecords(activeChild.id) : [];
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

  const handleVaccineTap = (vaccine: VaccineEntry, record?: VaccineRecord) => {
    setDetailVaccine(vaccine);
    setDetailRecord(record);
    setDetailVisible(true);
  };

  const handleMarkGiven = (record: VaccineRecord) => {
    setEditRecord(record);
    setEditVisible(true);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F8FF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primaryPink} />
      </View>
    );
  }

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
      {/* Main Tab Switcher */}
      <View style={sc.mainTabBar}>
        <TouchableOpacity
          style={[sc.mainTab, mainTab === 'knowledge' && sc.mainTabActive]}
          onPress={() => setMainTab('knowledge')} activeOpacity={0.8}
        >
          <Text style={[sc.mainTabTxt, mainTab === 'knowledge' && sc.mainTabTxtActive]}>
            🔬 {t('vaccine_kb.tab_knowledge')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sc.mainTab, mainTab === 'records' && sc.mainTabActive]}
          onPress={() => setMainTab('records')} activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[sc.mainTabTxt, mainTab === 'records' && sc.mainTabTxtActive]}>
              📋 {t('vaccine_kb.tab_records')}
            </Text>
            {overdueCount > 0 && (
              <View style={sc.overdueDot}>
                <Text style={sc.overdueDotTxt}>{overdueCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={sc.content} showsVerticalScrollIndicator={false}>
        {mainTab === 'knowledge' ? (
          <KnowledgeBaseTab
            childRecords={allForChild}
            childName={childName}
            onVaccineTap={handleVaccineTap}
          />
        ) : (
          <RecordsTab
            childName={childName}
            ageMonths={ageMonths}
            allForChild={allForChild}
            givenCount={givenCount}
            upcomingCount={upcomingCount}
            overdueCount={overdueCount}
            totalCount={totalCount}
            overdueNames={overdueNames}
            nextUpcoming={nextUpcoming}
            onEditRecord={r => { setEditRecord(r); setEditVisible(true); }}
          />
        )}
      </ScrollView>

      {/* Vaccine Detail Modal (Knowledge Base) */}
      <VaccineDetailModal
        visible={detailVisible}
        vaccine={detailVaccine}
        childRecord={detailRecord}
        childName={childName}
        onClose={() => setDetailVisible(false)}
        onMarkGiven={handleMarkGiven}
      />

      {/* Edit Modal (My Records + Mark as Given from KB) */}
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
  container:       { flex: 1, backgroundColor: '#F5F8FF' },
  content:         { padding: 16, paddingBottom: 40 },
  mainTabBar:      { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 4, zIndex: 10 },
  mainTab:         { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5FA', alignItems: 'center', justifyContent: 'center' },
  mainTabActive:   { backgroundColor: BLUE },
  mainTabTxt:      { fontSize: 13, fontWeight: '700', color: GRAY },
  mainTabTxtActive:{ color: '#fff' },
  overdueDot:      { backgroundColor: '#E53E3E', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  overdueDotTxt:   { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyHero:       { borderRadius: 22, padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  emptySub:        { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
});
