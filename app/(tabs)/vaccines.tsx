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
  KeyboardAvoidingView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SkeletonList } from '../../components/SkeletonCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  Baby, Sprout, Leaf, Flower2, Heart, Moon, Cake, Star,
  Footprints, School, CheckCircle2, Clock, AlertTriangle, XCircle,
  Sparkles, Bot, Shield, Lightbulb, Calendar, Syringe, ClipboardList,
  Building2, Trash2, Globe, Search, MapPin, BookOpen, Zap, Hash, Pill,
  Microscope, Thermometer, Ban, CircleDot, Coins, Cross,
  Camera, ChevronRight, Plus, User,
} from 'lucide-react-native';

import Colors from '../../constants/Colors';
import { useChildStore, getChildDisplayName } from '../../store/childStore';
import { EmptyState } from '../../components/EmptyState';
import { useVaccineStore, VaccineRecord, VaccineStatus, AdministeredRole, VaccineSite } from '../../store/vaccineStore';
import {
  DOH_EPI_SCHEDULE, AgeGroup as EpiAgeGroup, VaccineEntry,
  getAgeGroupForVaccine,
} from '../../constants/vaccines-doh-epi';

const { width: W } = Dimensions.get('window');
const BLUE   = Colors.blue;
const MINT   = Colors.mint;
const GOLD   = Colors.gold;
const DARK   = Colors.dark;
const GRAY   = Colors.midGray;
const PURPLE = '#7B68EE';
const PINK   = Colors.primaryPink;

type LangKey = 'en' | 'fil' | 'zh';
type MainTab = 'knowledge' | 'records';
type FilterKey = 'all' | 'free' | 'optional';

const AGE_ICONS: Record<number, (size: number, color: string) => React.ReactNode> = {
  0:   (size, color) => <Baby size={size} color={color} />,
  6:   (size, color) => <Sprout size={size} color={color} />,
  10:  (size, color) => <Leaf size={size} color={color} />,
  14:  (size, color) => <Flower2 size={size} color={color} />,
  26:  (size, color) => <Heart size={size} color={color} />,
  39:  (size, color) => <Moon size={size} color={color} />,
  52:  (size, color) => <Cake size={size} color={color} />,
  54:  (size, color) => <Star size={size} color={color} />,
  65:  (size, color) => <Footprints size={size} color={color} />,
  156: (size, color) => <School size={size} color={color} />,
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
  if (s === 'given')           return MINT;
  if (s === 'upcoming')        return BLUE;
  if (s === 'overdue')         return '#E53E3E';
  if (s === 'not_applicable')  return '#9E9E9E';
  return GRAY;
}
function statusBg(s: VaccineStatus) {
  if (s === 'given')           return Colors.softMint;
  if (s === 'upcoming')        return Colors.softBlue;
  if (s === 'overdue')         return '#FFF5F5';
  if (s === 'not_applicable')  return '#F5F5F5';
  return '#F5F5F5';
}
function statusIcon(s: VaccineStatus): React.ReactNode {
  if (s === 'given')           return <CheckCircle2 size={16} color={MINT} />;
  if (s === 'upcoming')        return <Clock size={16} color={BLUE} />;
  if (s === 'overdue')         return <AlertTriangle size={16} color={'#E53E3E'} />;
  if (s === 'not_applicable')  return <Ban size={16} color={'#9E9E9E'} />;
  return <XCircle size={16} color={GRAY} />;
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
            <Sparkles size={22} strokeWidth={1.5} color={Colors.white} />
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
            <View style={ai.loadRow}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Sparkles size={16} strokeWidth={1.5} color={PURPLE} /><Text style={ai.loadTxt}>{t('vaccine_log.ai_loading')}</Text></View></View>
          ) : report ? (
            <>
              {isDemo && (
                <View style={ai.demoBadge}>
                  <Bot size={26} strokeWidth={1.5} color={'#5B4FCF'} />
                  <View style={{ flex: 1 }}>
                    <Text style={ai.demoTitle}>{t('vaccine_log.ai_demo_title')}</Text>
                    <Text style={ai.demoSub}>{t('vaccine_log.ai_demo_sub')}</Text>
                  </View>
                </View>
              )}
              <View style={[ai.section, { backgroundColor: Colors.softMint }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={1.5} color={MINT} /><Text style={[ai.sLabel, { color: MINT }]}>{t('vaccine_log.ai_section_coverage')}</Text></View>
                <Text style={ai.sBody}>{report.coverageSummary}</Text>
              </View>
              {overdueList.length > 0 && (
                <View style={[ai.section, { backgroundColor: '#FFF5F5' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} strokeWidth={1.5} color={'#E53E3E'} /><Text style={[ai.sLabel, { color: '#E53E3E' }]}>{t('vaccine_log.ai_section_action')}</Text></View>
                  <Text style={ai.sBody}>{report.actionNeeded}</Text>
                </View>
              )}
              <View style={[ai.section, { backgroundColor: Colors.softGold }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Lightbulb size={12} strokeWidth={1.5} color={GOLD} /><Text style={[ai.sLabel, { color: GOLD }]}>{t('vaccine_log.ai_section_tip')}</Text></View>
                <Text style={ai.sBody}>{report.ateTip}</Text>
              </View>
              <View style={[ai.section, { backgroundColor: Colors.softBlue }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Calendar size={12} strokeWidth={1.5} color={BLUE} /><Text style={[ai.sLabel, { color: BLUE }]}>{t('vaccine_log.ai_section_next')}</Text></View>
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
  card:      { backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 14, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
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
    <LinearGradient colors={[Colors.blue,'#4A9DE8']} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={h.card}>
      <View style={h.topRow}>
        <Syringe size={36} strokeWidth={1.5} color={Colors.white} />
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
        <View style={h.stat}><Text style={h.statN}>{givenCount}</Text><View style={h.statLRow}><CheckCircle2 size={12} color="rgba(255,255,255,0.85)" /><Text style={h.statL}>{t('vaccine_log.tab_given')}</Text></View></View>
        <View style={h.div} />
        <View style={h.stat}><Text style={h.statN}>{upcomingCount}</Text><View style={h.statLRow}><Clock size={12} color="rgba(255,255,255,0.85)" /><Text style={h.statL}>{t('vaccine_log.tab_upcoming')}</Text></View></View>
        <View style={h.div} />
        <View style={h.stat}>
          <Text style={[h.statN, overdueCount > 0 && { color: '#FFD6D6' }]}>{overdueCount}</Text>
          <View style={h.statLRow}><AlertTriangle size={12} color="rgba(255,255,255,0.85)" /><Text style={h.statL}>{t('vaccine_log.tab_overdue')}</Text></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ClipboardList size={12} strokeWidth={1.5} color={'rgba(255,255,255,0.75)'} /><Text style={h.autoNote}>{t('vaccine_log.auto_populated')}</Text></View>
    </LinearGradient>
  );
}

const h = StyleSheet.create({
  card:     { borderRadius: 22, padding: 18, marginBottom: 14, shadowColor: BLUE, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  emoji:    { fontSize: 36 },
  title:    { fontSize: 17, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  pctBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  pctNum:   { fontSize: 22, fontWeight: '900', color: Colors.white },
  pctLbl:   { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 1 },
  barBg:    { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, marginBottom: 14 },
  barFill:  { height: 8, backgroundColor: Colors.white, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  stat:     { alignItems: 'center' },
  statN:    { fontSize: 20, fontWeight: '900', color: Colors.white },
  statL:    { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  statLRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 2 },
  div:      { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  autoNote: { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
});

// ── Vaccine Timeline Card (My Records) ────────────────────────────────────────

function VaccineTimelineCard({
  record, onPress, isLast,
}: { record: VaccineRecord; onPress: () => void; isLast: boolean }) {
  const { t } = useTranslation();

  const dotColor = record.status === 'given'           ? Colors.mint
    : record.status === 'upcoming'        ? Colors.warning
    : record.status === 'overdue'         ? Colors.danger
    : record.status === 'not_applicable'  ? '#9E9E9E'
    : Colors.textLight;

  const badgeBg = record.status === 'given'           ? Colors.softMint
    : record.status === 'upcoming'        ? Colors.warningBg
    : record.status === 'overdue'         ? Colors.dangerBg
    : record.status === 'not_applicable'  ? '#F5F5F5'
    : Colors.divider;

  const badgeColor = record.status === 'given'           ? Colors.mint
    : record.status === 'upcoming'        ? Colors.warning
    : record.status === 'overdue'         ? Colors.danger
    : record.status === 'not_applicable'  ? '#9E9E9E'
    : Colors.textMid;

  const badgeLabel = record.status === 'given'           ? t('vaccine_log.status_given')
    : record.status === 'upcoming'        ? t('vaccine_log.status_upcoming')
    : record.status === 'overdue'         ? t('vaccine_log.status_overdue')
    : record.status === 'not_applicable'  ? t('vaccine_log.status_not_applicable')
    : t('vaccine_log.status_skipped');

  const roleIcon = record.administeredRole === 'pediatrician'
    ? <Syringe size={11} strokeWidth={1.5} color={Colors.textMid} />
    : record.administeredRole === 'nurse'
    ? <Cross size={11} strokeWidth={1.5} color={Colors.textMid} />
    : record.administeredRole === 'midwife'
    ? <Heart size={11} strokeWidth={1.5} color={Colors.textMid} />
    : <User size={11} strokeWidth={1.5} color={Colors.textMid} />;

  return (
    <View style={tl.row}>
      {/* ── Left timeline column ── */}
      <View style={tl.lineCol}>
        <View style={[tl.dot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={tl.line} />}
      </View>

      {/* ── Card ── */}
      <TouchableOpacity style={tl.card} onPress={onPress} activeOpacity={0.85}>
        {/* Name + status badge */}
        <View style={tl.topRow}>
          <Text style={tl.name} numberOfLines={2}>{record.nameEN}</Text>
          <View style={[tl.badge, { backgroundColor: badgeBg }]}>
            <Text style={[tl.badgeTxt, { color: badgeColor }]}>{badgeLabel}</Text>
          </View>
        </View>

        {/* Brand + dose number */}
        {(record.brand || record.doseNumber != null) && (
          <View style={tl.subRow}>
            {record.brand && <Text style={tl.brand}>{record.brand}</Text>}
            {record.brand && record.doseNumber != null && <Text style={tl.sep}>·</Text>}
            {record.doseNumber != null && (
              <Text style={tl.dose}>{t('vaccine_log.dose_label', { n: record.doseNumber })}</Text>
            )}
          </View>
        )}

        {/* Dates */}
        <View style={tl.datesBlock}>
          <View style={tl.dateRow}>
            <Calendar size={11} strokeWidth={1.5} color={Colors.textLight} />
            <Text style={tl.dateLbl}>{t('vaccine_log.scheduled_date')}:</Text>
            <Text style={tl.dateVal}>{fmtDate(record.scheduledDate)}</Text>
          </View>
          {record.status === 'given' && record.givenDate && (
            <View style={tl.dateRow}>
              <CheckCircle2 size={11} strokeWidth={1.5} color={Colors.mint} />
              <Text style={tl.dateLbl}>{t('vaccine_log.given_label')}:</Text>
              <Text style={[tl.dateVal, { color: Colors.mint }]}>{fmtDate(record.givenDate)}</Text>
            </View>
          )}
        </View>

        {/* Administered by + role */}
        {record.administeredBy && (
          <View style={tl.adminRow}>
            {roleIcon}
            <Text style={tl.adminTxt} numberOfLines={1}>{record.administeredBy}</Text>
            {record.administeredRole && (
              <View style={tl.roleChip}>
                <Text style={tl.roleChipTxt}>{record.administeredRole}</Text>
              </View>
            )}
          </View>
        )}

        {/* Certificate photo indicator */}
        {record.certificateUrl ? (
          <View style={tl.certRow}>
            <Camera size={12} strokeWidth={1.5} color={BLUE} />
            <Text style={tl.certTxt}>{t('vaccine_log.field_certificate')}</Text>
          </View>
        ) : null}

        {/* Footer: EPI badge + chevron */}
        <View style={tl.footer}>
          <View style={[tl.epiBadge, record.isFreeEPI ? tl.epiFree : tl.epiPriv]}>
            <Text style={[tl.epiTxt, { color: record.isFreeEPI ? Colors.mint : Colors.gold }]}>
              {record.isFreeEPI ? t('vaccine_log.badge_free') : t('vaccine_log.badge_private')}
            </Text>
          </View>
          <ChevronRight size={14} strokeWidth={1.5} color={Colors.textLight} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const tl = StyleSheet.create({
  row:        { flexDirection: 'row', marginBottom: 4 },
  lineCol:    { width: 24, alignItems: 'center', paddingTop: 18 },
  dot:        { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  line:       { width: 2, flex: 1, backgroundColor: Colors.primarySoft, marginTop: 4, marginBottom: 0 },
  card:       { flex: 1, backgroundColor: Colors.surface, borderRadius: 20, padding: 14, marginBottom: 12,
                marginLeft: 8, shadowColor: Colors.shadowColor, shadowOpacity: 0.08,
                shadowRadius: 10, elevation: 3, gap: 8 },
  topRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, justifyContent: 'space-between' },
  name:       { flex: 1, fontSize: 14, fontFamily: 'Nunito_700Bold', color: Colors.textDark, lineHeight: 19 },
  badge:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeTxt:   { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '700' },
  subRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand:      { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid },
  sep:        { fontSize: 11, color: Colors.textLight },
  dose:       { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid },
  datesBlock: { gap: 4 },
  dateRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateLbl:    { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textLight },
  dateVal:    { fontSize: 11, fontFamily: 'JetBrainsMono_400Regular', color: Colors.textMid },
  adminRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  adminTxt:   { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid, flex: 1 },
  roleChip:   { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.softBlue },
  roleChipTxt:{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: BLUE, fontWeight: '700' },
  certRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  certTxt:    { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: BLUE },
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  epiBadge:   { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  epiFree:    { backgroundColor: Colors.softMint },
  epiPriv:    { backgroundColor: Colors.softGold },
  epiTxt:     { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', fontWeight: '800' },
});

// ── Edit Modal (My Records) ────────────────────────────────────────────────────

const BRANDS = ['Sanofi', 'GSK', 'Pfizer', 'MSD', 'AstraZeneca', 'Serum Institute', 'Other'];

const ROLE_OPTS: { v: AdministeredRole; l: string }[] = [
  { v: 'pediatrician', l: 'Pedia' },
  { v: 'nurse',        l: 'Nurse' },
  { v: 'midwife',      l: 'Midwife' },
];

const SITE_OPTS: { v: VaccineSite; l: string }[] = [
  { v: 'left_thigh',  l: 'L Thigh' },
  { v: 'right_thigh', l: 'R Thigh' },
  { v: 'left_arm',    l: 'L Arm' },
  { v: 'right_arm',   l: 'R Arm' },
  { v: 'oral',        l: 'Oral' },
];

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={mo.secHdr}>
      {icon}
      <Text style={mo.secTitle}>{label}</Text>
    </View>
  );
}

function VaccineEditModal({
  visible, record, onClose, onSave, onDelete,
}: {
  visible: boolean; record: VaccineRecord | null;
  onClose: () => void; onSave: (r: VaccineRecord) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useTranslation();

  // Section 1 — Vaccine Details
  const [status,   setStatus]   = useState<VaccineStatus>('upcoming');
  const [brand,    setBrand]    = useState('');

  // Section 2 — Schedule
  const [givenDt,  setGivenDt]  = useState('');
  const [nextDue,  setNextDue]  = useState('');

  // Section 3 — Administration
  const [adminBy,  setAdminBy]  = useState('');
  const [adminRole,setAdminRole]= useState<AdministeredRole | ''>('');
  const [clinic,   setClinic]   = useState('');
  const [site,     setSite]     = useState<VaccineSite | ''>('');

  // Section 4 — Batch Info
  const [lotNum,    setLotNum]   = useState('');
  const [expiryDt,  setExpiryDt] = useState('');
  const [doseNum,   setDoseNum]  = useState('');

  // Section 5 — Notes & Attachments
  const [reaction,  setReaction]  = useState('');
  const [notes,     setNotes]     = useState('');
  const [certUri,   setCertUri]   = useState('');
  const [reminder,  setReminder]  = useState(true);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setBrand(record.brand ?? '');
      setGivenDt(record.givenDate ?? '');
      setNextDue(record.nextDueDate ?? '');
      setAdminBy(record.administeredBy ?? '');
      setAdminRole(record.administeredRole ?? '');
      setClinic(record.clinicName ?? '');
      setSite(record.site ?? '');
      setLotNum(record.lotNumber ?? '');
      setExpiryDt(record.expiryDate ?? '');
      setDoseNum(record.doseNumber != null ? String(record.doseNumber) : '');
      setReaction(record.reactionNotes ?? '');
      setNotes(record.notes ?? '');
      setCertUri(record.certificateUrl ?? '');
      setReminder(record.reminderEnabled);
    }
  }, [record]);

  if (!record) return null;

  const ageGroup = getAgeGroupForVaccine(record.code);
  const vaccInfo = ageGroup?.vaccines.find(v => v.code === record.code);
  const wks      = record.recommendedAgeWeeks;
  const ageLabel = wks === 0 ? t('vaccine_log.at_birth') : wks < 52 ? `${wks} weeks` : `${Math.round(wks / 4.33)} months`;

  // Expiry warning — yellow if expiry is within 30 days of givenDate (or today)
  const expiryWarning = (() => {
    if (!expiryDt) return false;
    const ref  = givenDt ? new Date(givenDt) : new Date();
    const exp  = new Date(expiryDt);
    const diff = Math.round((exp.getTime() - ref.getTime()) / 86400000);
    return diff >= 0 && diff < 30;
  })();

  const pickCertPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('vaccine_log.cert_perm_title'), t('vaccine_log.cert_perm_msg')); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setCertUri(result.assets[0].uri);
    }
  };

  const save = () => {
    if (status === 'given' && !givenDt) {
      Alert.alert(t('vaccine_log.date_required_title'), t('vaccine_log.date_required_msg'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      ...record,
      status,
      brand:            brand || undefined,
      givenDate:        status === 'given' ? givenDt : undefined,
      nextDueDate:      nextDue || undefined,
      administeredBy:   adminBy || undefined,
      administeredRole: (adminRole as AdministeredRole) || undefined,
      clinicName:       clinic || undefined,
      site:             (site as VaccineSite) || undefined,
      lotNumber:        lotNum || undefined,
      expiryDate:       expiryDt || undefined,
      doseNumber:       doseNum ? parseInt(doseNum, 10) : undefined,
      reactionNotes:    reaction || undefined,
      notes:            notes || undefined,
      certificateUrl:   certUri || undefined,
      reminderEnabled:  reminder,
      updatedAt:        new Date().toISOString(),
    });
    onClose();
  };

  const STATUS_OPTS: { v: VaccineStatus; icon: React.ReactNode; l: string; c: string }[] = [
    { v: 'given',           icon: <CheckCircle2 size={14} color={MINT} />,     l: t('vaccine_log.status_given'),          c: MINT     },
    { v: 'upcoming',        icon: <Clock size={14} color={BLUE} />,            l: t('vaccine_log.status_upcoming'),       c: BLUE     },
    { v: 'skipped',         icon: <XCircle size={14} color={GRAY} />,          l: t('vaccine_log.status_skipped'),        c: GRAY     },
    { v: 'not_applicable',  icon: <Ban size={14} color={'#9E9E9E'} />,         l: t('vaccine_log.status_not_applicable'), c: '#9E9E9E'},
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={mo.wrap}>

          {/* ── Header ── */}
          <LinearGradient colors={[Colors.blue, '#4A9DE8']} style={mo.hdr}>
            <TouchableOpacity onPress={onClose} style={mo.closeBtn}>
              <Text style={mo.closeTxt}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={mo.hdrTitle}>{t('vaccine_log.modal_title_edit')}</Text>
              <Text style={mo.hdrSub} numberOfLines={2}>{record.nameEN}</Text>
              <Text style={mo.hdrAge}>{ageLabel} · {fmtDate(record.scheduledDate)}</Text>
            </View>
            <View style={[mo.epiBadge, { backgroundColor: record.isFreeEPI ? '#C8F7DC' : '#FFF0C8' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {record.isFreeEPI
                  ? <CheckCircle2 size={12} strokeWidth={1.5} color="#1A7A4A" />
                  : <Coins        size={12} strokeWidth={1.5} color="#A05C00" />}
                <Text style={[mo.epiBadgeTxt, { color: record.isFreeEPI ? '#1A7A4A' : '#A05C00' }]}>
                  {record.isFreeEPI ? 'FREE' : 'Private'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={mo.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Vaccine quick-info card ── */}
            {vaccInfo && (
              <View style={mo.infoCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={1.5} color={BLUE} /><Text style={mo.infoLbl}>{t('vaccine_log.protects_against')}</Text></View>
                <Text style={mo.infoVal}>{vaccInfo.protectsAgainst.en}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Syringe size={12} strokeWidth={1.5} color={BLUE} /><Text style={mo.infoLbl}>{t('vaccine_log.route_label')}</Text></View>
                <Text style={mo.infoVal}>{vaccInfo.route}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Zap size={12} strokeWidth={1.5} color={BLUE} /><Text style={mo.infoLbl}>{t('vaccine_log.side_effects')}</Text></View>
                <Text style={mo.infoVal}>{vaccInfo.sideEffects}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Building2 size={12} strokeWidth={1.5} color={BLUE} /><Text style={mo.infoLbl}>{t('vaccine_log.where_to_get')}</Text></View>
                <Text style={mo.infoVal}>{vaccInfo.whereToGet.en}</Text>
              </View>
            )}

            {/* ══ SECTION 1: Vaccine Details ══ */}
            <SectionHeader icon={<Pill size={14} strokeWidth={1.5} color={BLUE} />} label={t('vaccine_log.sec_details')} />

            <Text style={mo.fLbl}>{t('vaccine_log.field_status')}</Text>
            <View style={mo.statusRow}>
              {STATUS_OPTS.map(o => (
                <TouchableOpacity key={o.v} style={[mo.statusBtn, status === o.v && { borderColor: o.c, backgroundColor: statusBg(o.v) }]} onPress={() => setStatus(o.v)} activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {o.icon}
                    <Text style={[mo.statusBtnTxt, status === o.v && { color: o.c }]}>{o.l}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_brand')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {BRANDS.map(b => (
                    <TouchableOpacity key={b} onPress={() => setBrand(brand === b ? '' : b)} activeOpacity={0.8}
                      style={[mo.chip, brand === b && mo.chipActive]}>
                      <Text style={[mo.chipTxt, brand === b && mo.chipTxtActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_dose_number')}</Text>
              <TextInput style={mo.input} value={doseNum} onChangeText={setDoseNum}
                placeholder="1" placeholderTextColor="#ccc" keyboardType="number-pad" />
            </View>

            {/* ══ SECTION 2: Schedule ══ */}
            <SectionHeader icon={<Calendar size={14} strokeWidth={1.5} color={BLUE} />} label={t('vaccine_log.sec_schedule')} />

            <View style={mo.scheduledChip}>
              <Calendar size={12} strokeWidth={1.5} color={BLUE} />
              <Text style={mo.scheduledChipTxt}>{t('vaccine_log.scheduled_date')}: <Text style={{ fontWeight: '800' }}>{fmtDate(record.scheduledDate)}</Text></Text>
            </View>

            {status === 'given' && (
              <View style={mo.fBlock}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_date_given')} *</Text>
                <TextInput style={mo.input} value={givenDt} onChangeText={setGivenDt}
                  placeholder="YYYY-MM-DD" placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
              </View>
            )}

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_next_due')}</Text>
              <TextInput style={mo.input} value={nextDue} onChangeText={setNextDue}
                placeholder="YYYY-MM-DD  (auto-filled for multi-dose)" placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
            </View>

            {/* ══ SECTION 3: Administration ══ */}
            <SectionHeader icon={<Syringe size={14} strokeWidth={1.5} color={BLUE} />} label={t('vaccine_log.sec_admin')} />

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_admin_by')}</Text>
              <TextInput style={mo.input} value={adminBy} onChangeText={setAdminBy}
                placeholder="Dr. Santos / Nurse Reyes" placeholderTextColor="#ccc" />
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_admin_role')}</Text>
              <View style={mo.segRow}>
                {ROLE_OPTS.map(o => (
                  <TouchableOpacity key={o.v} onPress={() => setAdminRole(adminRole === o.v ? '' : o.v)} activeOpacity={0.8}
                    style={[mo.segBtn, adminRole === o.v && mo.segBtnActive]}>
                    <Text style={[mo.segBtnTxt, adminRole === o.v && mo.segBtnTxtActive]}>{o.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_clinic')}</Text>
              <TextInput style={mo.input} value={clinic} onChangeText={setClinic}
                placeholder="e.g. Makati Med, BHS Poblacion, RHU Pasay" placeholderTextColor="#ccc" />
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_site')}</Text>
              <View style={[mo.segRow, { flexWrap: 'wrap' }]}>
                {SITE_OPTS.map(o => (
                  <TouchableOpacity key={o.v} onPress={() => setSite(site === o.v ? '' : o.v)} activeOpacity={0.8}
                    style={[mo.segBtn, site === o.v && mo.segBtnActive]}>
                    <Text style={[mo.segBtnTxt, site === o.v && mo.segBtnTxtActive]}>{o.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ══ SECTION 4: Batch Info ══ */}
            <SectionHeader icon={<Hash size={14} strokeWidth={1.5} color={BLUE} />} label={t('vaccine_log.sec_batch')} />

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_lot')}</Text>
              <TextInput style={mo.input} value={lotNum} onChangeText={setLotNum}
                placeholder="Lot number — useful for recalls" placeholderTextColor="#ccc" />
            </View>

            <View style={mo.fBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_expiry')}</Text>
                {expiryWarning && (
                  <View style={mo.expiryWarn}>
                    <AlertTriangle size={11} color={GOLD} />
                    <Text style={mo.expiryWarnTxt}>{t('vaccine_log.expiry_soon')}</Text>
                  </View>
                )}
              </View>
              <TextInput style={[mo.input, expiryWarning && { borderColor: GOLD }]} value={expiryDt}
                onChangeText={setExpiryDt} placeholder="YYYY-MM-DD" placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
            </View>

            {/* ══ SECTION 5: Notes & Attachments ══ */}
            <SectionHeader icon={<ClipboardList size={14} strokeWidth={1.5} color={BLUE} />} label={t('vaccine_log.sec_notes')} />

            <View style={mo.fBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_reaction')}</Text>
                <Text style={[mo.charCount, reaction.length > 450 && { color: '#E53E3E' }]}>{reaction.length}/500</Text>
              </View>
              <TextInput style={[mo.input, mo.inputMulti]} value={reaction} onChangeText={v => v.length <= 500 && setReaction(v)}
                placeholder='"Mild fever for 1 day", "No reaction"' placeholderTextColor="#ccc" multiline numberOfLines={3} />
            </View>

            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_notes')}</Text>
              <TextInput style={[mo.input, mo.inputMulti]} value={notes} onChangeText={setNotes}
                placeholder="Any additional notes…" placeholderTextColor="#ccc" multiline numberOfLines={2} />
            </View>

            {/* Certificate photo */}
            <View style={mo.fBlock}>
              <Text style={mo.fLbl}>{t('vaccine_log.field_certificate')}</Text>
              {certUri ? (
                <View style={mo.certPreview}>
                  <Image source={{ uri: certUri }} style={mo.certImg} resizeMode="cover" />
                  <TouchableOpacity style={mo.certRemove} onPress={() => setCertUri('')}>
                    <Trash2 size={14} color="#E53E3E" />
                    <Text style={mo.certRemoveTxt}>{t('vaccine_log.remove_photo')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={mo.certUpload} onPress={pickCertPhoto} activeOpacity={0.8}>
                  <Microscope size={20} strokeWidth={1.5} color={BLUE} />
                  <Text style={mo.certUploadTxt}>{t('vaccine_log.upload_certificate')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reminder toggle */}
            <View style={mo.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={mo.fLbl}>{t('vaccine_log.field_reminder')}</Text>
                <Text style={mo.reminderSub}>{t('vaccine_log.reminder_7days')} ({fmtDate(record.reminderDate ?? record.scheduledDate)})</Text>
              </View>
              <Switch value={reminder} onValueChange={setReminder}
                trackColor={{ false: '#e0e0e0', true: BLUE + '66' }} thumbColor={reminder ? BLUE : '#aaa'} />
            </View>

            {/* Post-care tip */}
            {status === 'given' && vaccInfo && (
              <View style={mo.postCare}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Cross size={12} strokeWidth={1.5} color={GOLD} />
                  <Text style={mo.postCareLbl}>{t('vaccine_log.post_care')}</Text>
                </View>
                <Text style={mo.postCareVal}>{vaccInfo.postVaccineCare}</Text>
              </View>
            )}

            {/* Save */}
            <TouchableOpacity onPress={save} activeOpacity={0.85} style={{ marginTop: 8 }}>
              <LinearGradient colors={[BLUE, '#4A9DE8']} style={mo.saveBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Syringe size={18} strokeWidth={1.5} color={Colors.white} />
                  <Text style={mo.saveBtnTxt}>{t('vaccine_log.save')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Delete */}
            {onDelete && (
              <TouchableOpacity style={mo.deleteBtn} onPress={() => Alert.alert(
                t('vaccine_log.delete'), t('vaccine_log.delete_confirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.delete'), style: 'destructive', onPress: () => { onDelete(record.id); onClose(); } },
                ]
              )} activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={16} strokeWidth={1.5} color="#E53E3E" />
                  <Text style={mo.deleteBtnTxt}>{t('vaccine_log.delete')}</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mo = StyleSheet.create({
  wrap:            { flex: 1, backgroundColor: Colors.background },
  hdr:             { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:        { color: Colors.white, fontSize: 14, fontWeight: '700' },
  hdrTitle:        { fontSize: 16, fontWeight: '800', color: Colors.white },
  hdrSub:          { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 16 },
  hdrAge:          { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  epiBadge:        { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, alignSelf: 'flex-start' },
  epiBadgeTxt:     { fontSize: 10, fontWeight: '800' },
  content:         { padding: 16, paddingBottom: 32 },
  infoCard:        { backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 20, gap: 2 },
  infoLbl:         { fontSize: 10, fontWeight: '800', color: BLUE, marginTop: 6 },
  infoVal:         { fontSize: 12, color: DARK, lineHeight: 17 },
  secHdr:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  secTitle:        { fontSize: 12, fontWeight: '800', color: BLUE, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusRow:       { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusBtn:       { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', paddingVertical: 10, alignItems: 'center' },
  statusBtnTxt:    { fontSize: 11, fontWeight: '700', color: GRAY },
  fBlock:          { marginBottom: 14 },
  fLbl:            { fontSize: 12, fontWeight: '700', color: GRAY, marginBottom: 6 },
  input:           { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 11, fontSize: 13, color: DARK, height: 52, fontFamily: 'PlusJakartaSans_400Regular' },
  inputMulti:      { minHeight: 72, height: undefined, textAlignVertical: 'top', paddingTop: 12 },
  // Brand chips
  chip:            { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive:      { borderColor: BLUE, backgroundColor: Colors.softBlue },
  chipTxt:         { fontSize: 12, fontWeight: '600', color: GRAY },
  chipTxtActive:   { color: BLUE, fontWeight: '800' },
  // Scheduled date chip
  scheduledChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.softBlue, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14, alignSelf: 'flex-start' },
  scheduledChipTxt:{ fontSize: 12, color: BLUE },
  // Segmented controls (role + site)
  segRow:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  segBtn:          { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  segBtnActive:    { borderColor: BLUE, backgroundColor: Colors.softBlue },
  segBtnTxt:       { fontSize: 12, fontWeight: '600', color: GRAY },
  segBtnTxtActive: { color: BLUE, fontWeight: '800' },
  // Expiry warning
  expiryWarn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.softGold, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  expiryWarnTxt:   { fontSize: 10, fontWeight: '700', color: GOLD },
  // Char counter
  charCount:       { fontSize: 11, color: GRAY },
  // Certificate
  certUpload:      { borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', height: 80, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8FBFF' },
  certUploadTxt:   { fontSize: 13, fontWeight: '600', color: BLUE },
  certPreview:     { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  certImg:         { width: '100%', height: 160 },
  certRemove:      { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#FFF5F5' },
  certRemoveTxt:   { fontSize: 12, fontWeight: '600', color: '#E53E3E' },
  // Reminder
  reminderRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0F8FF', borderRadius: 14, padding: 14, marginBottom: 14 },
  reminderSub:     { fontSize: 11, color: BLUE, marginTop: 2 },
  // Post-care
  postCare:        { backgroundColor: Colors.softGold, borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: GOLD, gap: 4, marginBottom: 14 },
  postCareLbl:     { fontSize: 11, fontWeight: '800', color: GOLD },
  postCareVal:     { fontSize: 12, color: DARK, lineHeight: 17 },
  // Buttons
  saveBtn:         { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: BLUE, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnTxt:      { color: Colors.white, fontSize: 16, fontWeight: '800' },
  deleteBtn:       { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFBDBD', backgroundColor: '#FFF5F5', marginBottom: 14 },
  deleteBtnTxt:    { color: '#E53E3E', fontSize: 14, fontWeight: '700' },
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
          <Sparkles size={20} strokeWidth={1.5} color={Colors.white} />
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
            <View style={[kbai.section, { backgroundColor: Colors.softBlue }]}>
              <Text style={[kbai.sLabel, { color: BLUE }]}>{t('vaccine_kb.ai_section_why')}</Text>
              <Text style={kbai.sBody}>{analysis.whyMatters}</Text>
            </View>
          )}
          {activeSection === 'qa' && (
            <View style={[kbai.section, { backgroundColor: Colors.softGold }]}>
              <Text style={[kbai.sLabel, { color: GOLD }]}>{t('vaccine_kb.ai_section_qa')}</Text>
              <Text style={kbai.sBody}>{analysis.commonQs}</Text>
            </View>
          )}
          {activeSection === 'expect' && (
            <View style={[kbai.section, { backgroundColor: Colors.softMint }]}>
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
  card:        { backgroundColor: Colors.white, borderRadius: 18, marginBottom: 12, shadowColor: PURPLE, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
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
  secTabTxtActive: { color: Colors.white },
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
  const gradColors: [string, string] = vaccine.isFreeEPI ? [Colors.blue,'#4A9DE8'] : ['#D4860A',Colors.gold];

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
              {isOral ? <Pill size={18} strokeWidth={1.5} color={'rgba(255,255,255,0.85)'} /> : <Syringe size={18} strokeWidth={1.5} color={'rgba(255,255,255,0.85)'} />}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={det.langHint}>Trilingual</Text><Globe size={12} strokeWidth={1.5} color={GRAY} /></View>
          </View>

          {/* Protects Against (big highlight) */}
          <LinearGradient colors={vaccine.isFreeEPI ? [Colors.softBlue,'#D0E8FF'] : [Colors.softGold,'#FFEEcc']} style={det.protectsBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={1.5} color={vaccine.isFreeEPI ? BLUE : '#A05C00'} /><Text style={[det.protectsLbl, { color: vaccine.isFreeEPI ? BLUE : '#A05C00' }]}>{t('vaccine_kb.detail_protects')}</Text></View>
            <Text style={[det.protectsTxt, { color: vaccine.isFreeEPI ? DARK : '#6B3A00' }]}>{getProtects()}</Text>
          </LinearGradient>

          {/* Info Grid */}
          <View style={det.infoGrid}>
            <View style={det.infoCell}>
              {isOral ? <Pill size={20} strokeWidth={1.5} color={GRAY} /> : <Syringe size={20} strokeWidth={1.5} color={GRAY} />}
              <Text style={det.infoCellLbl}>{t('vaccine_kb.detail_route')}</Text>
              <Text style={det.infoCellVal}>{vaccine.route.split('(')[0].trim()}</Text>
            </View>
            <View style={det.infoDivider} />
            <View style={det.infoCell}>
              <Hash size={20} strokeWidth={1.5} color={GRAY} />
              <Text style={det.infoCellLbl}>{t('vaccine_kb.detail_doses')}</Text>
              <Text style={det.infoCellVal}>{vaccine.doses}-dose series</Text>
            </View>
            <View style={det.infoDivider} />
            <View style={det.infoCell}>
              {vaccine.isFreeEPI ? <CircleDot size={20} strokeWidth={1.5} color={MINT} /> : <Coins size={20} strokeWidth={1.5} color={GOLD} />}
              <Text style={det.infoCellLbl}>Cost</Text>
              <Text style={[det.infoCellVal, { color: vaccine.isFreeEPI ? MINT : GOLD }]}>
                {vaccine.isFreeEPI ? 'FREE' : 'Optional'}
              </Text>
            </View>
          </View>

          {/* Side Effects (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setSideOpen(!sideOpen)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Zap size={16} strokeWidth={1.5} color={DARK} /><Text style={det.collapsibleLbl}>{t('vaccine_kb.detail_side_effects')}</Text></View>
            <Text style={det.collapsibleChevron}>{sideOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {sideOpen && (
            <View style={det.collapsibleBody}>
              <Text style={det.collapsibleTxt}>{vaccine.sideEffects}</Text>
            </View>
          )}

          {/* Post-Vaccine Care (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setCareOpen(!careOpen)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Cross size={16} strokeWidth={1.5} color={DARK} /><Text style={det.collapsibleLbl}>{t('vaccine_kb.detail_post_care')}</Text></View>
            <Text style={det.collapsibleChevron}>{careOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {careOpen && (
            <View style={[det.collapsibleBody, { backgroundColor: Colors.softGold, borderLeftColor: GOLD }]}>
              <Text style={det.collapsibleTxt}>{vaccine.postVaccineCare}</Text>
            </View>
          )}

          {/* Where to Get (collapsible) */}
          <TouchableOpacity style={det.collapsibleHdr} onPress={() => setWhereOpen(!whereOpen)} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><MapPin size={16} strokeWidth={1.5} color={DARK} /><Text style={det.collapsibleLbl}>{t('vaccine_kb.detail_where')}</Text></View>
            <Text style={det.collapsibleChevron}>{whereOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {whereOpen && (
            <View style={[det.collapsibleBody, { backgroundColor: Colors.softMint, borderLeftColor: MINT }]}>
              <Text style={[det.collapsibleTxt, { color: '#1A5C3A' }]}>{getWhere()}</Text>
            </View>
          )}

          {/* AI Expert Analysis */}
          <VaccineDetailAI vaccine={vaccine} childName={childName} />

          {/* Child Status + Action */}
          {childRecord && (
            <View style={det.childStatusBox}>
              <Text style={det.childStatusLbl}>{t('vaccine_kb.child_status_lbl')} {childName}</Text>
              <View style={[det.childStatusChip, { backgroundColor: statusBg(childRecord.status), flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                {statusIcon(childRecord.status)}
                <Text style={[det.childStatusTxt, { color: statusColor(childRecord.status) }]}>
                  {childRecord.status.charAt(0).toUpperCase() + childRecord.status.slice(1)}
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
  wrap:             { flex: 1, backgroundColor: Colors.background },
  hdr:              { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 20 },
  closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  closeTxt:         { color: Colors.white, fontSize: 14, fontWeight: '700' },
  routeRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  routeIcon:        { fontSize: 18 },
  routeTxt:         { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  hdrName:          { fontSize: 18, fontWeight: '900', color: Colors.white, lineHeight: 24 },
  epiBadge:         { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  epiBadgeTxt:      { fontSize: 10, fontWeight: '800' },
  doseLbl:          { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  content:          { padding: 16 },
  langRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  langBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: 'transparent' },
  langBtnActive:    { backgroundColor: DARK, borderColor: DARK },
  langTxt:          { fontSize: 12, fontWeight: '700', color: GRAY },
  langTxtActive:    { color: Colors.white },
  langHint:         { fontSize: 10, color: GRAY, fontStyle: 'italic' },
  protectsBox:      { borderRadius: 16, padding: 16, marginBottom: 12 },
  protectsLbl:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  protectsTxt:      { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  infoGrid:         { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  infoCell:         { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  infoCellIcon:     { fontSize: 20 },
  infoCellLbl:      { fontSize: 9, color: GRAY, fontWeight: '700', letterSpacing: 0.4 },
  infoCellVal:      { fontSize: 12, color: DARK, fontWeight: '700', textAlign: 'center' },
  infoDivider:      { width: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  collapsibleHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  collapsibleLbl:   { fontSize: 13, fontWeight: '700', color: DARK },
  collapsibleChevron:{ fontSize: 11, color: GRAY },
  collapsibleBody:  { backgroundColor: '#F0F8FF', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: BLUE },
  collapsibleTxt:   { fontSize: 13, color: DARK, lineHeight: 20 },
  childStatusBox:   { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginTop: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  childStatusLbl:   { fontSize: 11, color: GRAY, fontWeight: '700', marginBottom: 8 },
  childStatusChip:  { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 12 },
  childStatusTxt:   { fontSize: 13, fontWeight: '800' },
  markGivenBtn:     { borderRadius: 12, overflow: 'hidden' },
  markGivenGrad:    { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  markGivenTxt:     { color: Colors.white, fontSize: 15, fontWeight: '800' },
  viewRecordBtn:    { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: BLUE },
  viewRecordTxt:    { color: BLUE, fontSize: 14, fontWeight: '700' },
});

// ── Parent Resource Articles ───────────────────────────────────────────────────

const PARENT_RESOURCES = [
  {
    iconComponent: (color: string) => <CircleDot size={20} strokeWidth={1.5} color={color} />,
    titleKey: 'vaccine_kb.res_1_title',
    bodyKey:  'vaccine_kb.res_1_body',
    color: MINT,
    bg: Colors.softMint,
  },
  {
    iconComponent: (color: string) => <Microscope size={20} strokeWidth={1.5} color={color} />,
    titleKey: 'vaccine_kb.res_2_title',
    bodyKey:  'vaccine_kb.res_2_body',
    color: BLUE,
    bg: Colors.softBlue,
  },
  {
    iconComponent: (color: string) => <Thermometer size={20} strokeWidth={1.5} color={color} />,
    titleKey: 'vaccine_kb.res_3_title',
    bodyKey:  'vaccine_kb.res_3_body',
    color: '#E53E3E',
    bg: '#FFF5F5',
  },
  {
    iconComponent: (color: string) => <Ban size={20} strokeWidth={1.5} color={color} />,
    titleKey: 'vaccine_kb.res_4_title',
    bodyKey:  'vaccine_kb.res_4_body',
    color: PURPLE,
    bg: '#F0EDFF',
  },
  {
    iconComponent: (color: string) => <Calendar size={20} strokeWidth={1.5} color={color} />,
    titleKey: 'vaccine_kb.res_5_title',
    bodyKey:  'vaccine_kb.res_5_body',
    color: GOLD,
    bg: Colors.softGold,
  },
];

function ParentResourceCard({ iconComponent, titleKey, bodyKey, color, bg }: typeof PARENT_RESOURCES[0]) {
  const { t }      = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <View style={[res.card, { borderLeftColor: color }]}>
      <TouchableOpacity style={res.hdr} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={[res.iconBox, { backgroundColor: bg }]}>
          {iconComponent(color)}
        </View>
        <Text style={res.title} numberOfLines={open ? undefined : 2}>{t(titleKey)}</Text>
        <Text style={[res.chevron, { color }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={res.body}>
          <Text style={res.bodyTxt}>{t(bodyKey)}</Text>
          <View style={[res.sourceBadge, { backgroundColor: bg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><BookOpen size={12} strokeWidth={1.5} color={color} /><Text style={[res.sourceTxt, { color }]}>Source: DOH Philippines · WHO · PPS</Text></View>
          </View>
        </View>
      )}
    </View>
  );
}

const res = StyleSheet.create({
  card:     { backgroundColor: Colors.white, borderRadius: 14, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
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
  const renderAgeIcon = AGE_ICONS[group.recommendedAgeWeeks];
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
          {renderAgeIcon ? renderAgeIcon(24, DARK) : <Baby size={24} color={DARK} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={acc.ageLabel}>{ageLabel}</Text>
          <Text style={acc.vaccineCount}>{totalInGroup} {t('vaccine_kb.vaccines_in_group', { count: totalInGroup })}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {childRecords.length > 0 && (
            <View style={[acc.progressBadge, {
              backgroundColor: givenInGroup === totalInGroup ? Colors.softMint :
                hasOverdue ? '#FFF5F5' : Colors.softBlue,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {givenInGroup === totalInGroup
                  ? <CheckCircle2 size={12} color={MINT} />
                  : hasOverdue
                  ? <AlertTriangle size={12} color={'#E53E3E'} />
                  : <Clock size={12} color={BLUE} />}
                <Text style={[acc.progressTxt, {
                  color: givenInGroup === totalInGroup ? MINT :
                    hasOverdue ? '#E53E3E' : BLUE,
                }]}>
                  {givenInGroup}/{totalInGroup}
                </Text>
              </View>
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
                    <View style={[acc.epiBadge, { backgroundColor: vaccine.isFreeEPI ? Colors.softMint : Colors.softGold }]}>
                      <Text style={[acc.epiBadgeTxt, { color: vaccine.isFreeEPI ? MINT : GOLD }]}>
                        {vaccine.isFreeEPI ? t('vaccine_kb.free_badge') : t('vaccine_kb.private_badge')}
                      </Text>
                    </View>
                  </View>
                  <View style={acc.vaccMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      {vaccine.route.toLowerCase().includes('oral') ? <Pill size={11} strokeWidth={1.5} color={GRAY} /> : <Syringe size={11} strokeWidth={1.5} color={GRAY} />}
                      <Text style={acc.vaccRoute}>{vaccine.route.split('(')[0].trim()}</Text>
                    </View>
                    <Text style={acc.vaccDot}>·</Text>
                    <Text style={acc.vaccProtects} numberOfLines={1}>
                      {vaccine.protectsAgainst.en}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  {record ? (
                    <View style={[acc.statusDot, { backgroundColor: statusBg(record.status) }]}>
                      {statusIcon(record.status)}
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
  card:         { backgroundColor: Colors.white, borderRadius: 18, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  hdr:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  ageBox:       { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F5F5FA', alignItems: 'center', justifyContent: 'center' },
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
        <Search size={16} strokeWidth={1.5} color={GRAY} />
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
            <Text style={[kb.chipTxt, filter === f.key && { color: Colors.white }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* EPI Coverage Banner */}
      {filter !== 'optional' && (
        <LinearGradient colors={[Colors.softMint,'#C8F7DC']} style={kb.epiBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><CircleDot size={14} strokeWidth={1.5} color={'#1A5C3A'} /><Text style={kb.epiBannerTxt}>{t('vaccine_kb.epi_banner')}</Text></View>
        </LinearGradient>
      )}

      {/* Age Group Accordions */}
      {filteredGroups.length === 0 ? (
        <View style={kb.noResults}>
          <Search size={36} strokeWidth={1.5} color={GRAY} />
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
          <BookOpen size={22} strokeWidth={1.5} color={Colors.white} />
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
        <LinearGradient colors={[Colors.blue,'#4A9DE8']} style={kb.bhsBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Building2 size={18} strokeWidth={1.5} color={Colors.white} /><Text style={kb.bhsBtnTxt}>{t('vaccine_log.find_center')}</Text></View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </View>
  );
}

const kb = StyleSheet.create({
  searchRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchIcon:     { fontSize: 16 },
  searchInput:    { flex: 1, fontSize: 14, color: DARK },
  searchClear:    { fontSize: 12, color: GRAY, padding: 2 },
  filterRow:      { marginBottom: 10 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: '#e8e8e8' },
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
  bhsBtnTxt:      { color: Colors.white, fontSize: 15, fontWeight: '800' },
});

// ── Records Tab (existing log wrapped) ────────────────────────────────────────

const RECORD_TABS: { key: VaccineStatus | 'all'; i18n: string }[] = [
  { key: 'all',            i18n: 'vaccine_log.tab_all' },
  { key: 'given',          i18n: 'vaccine_log.tab_given' },
  { key: 'upcoming',       i18n: 'vaccine_log.tab_upcoming' },
  { key: 'overdue',        i18n: 'vaccine_log.tab_overdue' },
  { key: 'not_applicable', i18n: 'vaccine_log.tab_not_applicable' },
];

function RecordsTab({
  childName, ageMonths, allForChild,
  givenCount, upcomingCount, overdueCount, notApplicableCount, totalCount,
  overdueNames, nextUpcoming, onEditRecord, onAddCustom,
}: {
  childName: string; ageMonths: number;
  allForChild: VaccineRecord[];
  givenCount: number; upcomingCount: number; overdueCount: number;
  notApplicableCount: number; totalCount: number;
  overdueNames: string[]; nextUpcoming: VaccineRecord | null;
  onEditRecord: (r: VaccineRecord) => void;
  onAddCustom: () => void;
}) {
  const { t }                       = useTranslation();
  const [activeFilter, setActiveFilter] = useState<VaccineStatus | 'all'>('all');
  const vaccineStore                = useVaccineStore();
  const { activeChild }             = useChildStore();

  const filteredRecs = activeChild
    ? vaccineStore.getRecords(activeChild.id, activeFilter === 'all' ? undefined : activeFilter)
    : [];

  // For the "all" tab, hide not_applicable by default to keep the list clean
  const displayRecs = activeFilter === 'all'
    ? filteredRecs.filter(r => r.status !== 'not_applicable')
    : filteredRecs;

  const countForTab = (key: VaccineStatus | 'all') => {
    if (key === 'all')            return totalCount - notApplicableCount;
    if (key === 'given')          return givenCount;
    if (key === 'upcoming')       return upcomingCount;
    if (key === 'overdue')        return overdueCount;
    if (key === 'not_applicable') return notApplicableCount;
    return 0;
  };

  return (
    <View>
      <CoverageHero
        name={childName} ageMonths={ageMonths}
        givenCount={givenCount} upcomingCount={upcomingCount}
        overdueCount={overdueCount}
        totalCount={totalCount - notApplicableCount}
      />
      <VaccineAISection
        childName={childName} ageMonths={ageMonths}
        givenCount={givenCount} totalCount={totalCount - notApplicableCount}
        overdueList={overdueNames}
        nextVaccineName={nextUpcoming?.nameEN ?? ''}
        nextVaccineDate={nextUpcoming?.scheduledDate ?? ''}
      />
      <LinearGradient colors={[Colors.gold,'#FFC642']} style={rt.gpBanner}>
        <Text style={rt.gpTxt}>{t('vaccine_log.garantisadong')}</Text>
      </LinearGradient>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={rt.filterRow} contentContainerStyle={rt.filterContent}>
        {RECORD_TABS.map(tab => {
          const active = activeFilter === tab.key;
          const count  = countForTab(tab.key);
          return (
            <TouchableOpacity key={tab.key} style={[rt.tab, active && rt.tabActive]} onPress={() => { setActiveFilter(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.8}>
              <Text style={[rt.tabTxt, active && rt.tabTxtActive]}>
                {t(tab.i18n)}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* not_applicable info banner — shown when that filter is active */}
      {activeFilter === 'not_applicable' && notApplicableCount > 0 && (
        <View style={rt.naBanner}>
          <Ban size={14} strokeWidth={1.5} color={'#9E9E9E'} />
          <Text style={rt.naBannerTxt}>{t('vaccine_log.not_applicable_info')}</Text>
        </View>
      )}

      {displayRecs.length === 0 ? (
        <EmptyState
          illustration={null}
          illustrationColor={Colors.softBlue}
          title={t('vaccine_log.no_records')}
          message={`${childName}'s vaccination records will appear here once logged.`}
        />
      ) : (
        <View style={rt.timeline}>
          {displayRecs.map((rec, idx) => (
            <VaccineTimelineCard
              key={rec.id}
              record={rec}
              isLast={idx === displayRecs.length - 1}
              onPress={() => onEditRecord(rec)}
            />
          ))}
        </View>
      )}
      <View style={{ height: 80 }} />
    </View>
  );
}

const rt = StyleSheet.create({
  gpBanner:     { borderRadius: 14, padding: 14, marginBottom: 12 },
  gpTxt:        { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.white, lineHeight: 17 },
  filterRow:    { marginBottom: 14 },
  filterContent:{ paddingHorizontal: 0, gap: 8 },
  tab:          { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5,
                  borderColor: Colors.border, backgroundColor: 'transparent' },
  tabActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt:       { fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.textMid },
  tabTxtActive: { color: Colors.white },
  timeline:     { paddingTop: 4 },
  naBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F5F5F5',
                  borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#9E9E9E' },
  naBannerTxt:  { flex: 1, fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: Colors.textMid, lineHeight: 17 },
});

// ── Custom Record Modal ────────────────────────────────────────────────────────

function CustomVaccineModal({
  visible, childId, onClose, onSave,
}: {
  visible: boolean; childId: string;
  onClose: () => void; onSave: () => void;
}) {
  const { t } = useTranslation();
  const vaccineStore = useVaccineStore();

  const [nameEN,      setNameEN]      = useState('');
  const [scheduledDt, setScheduledDt] = useState('');
  const [nextDue,     setNextDue]     = useState('');
  const [brand,       setBrand]       = useState('');
  const [doseNum,     setDoseNum]     = useState('');
  const [notes,       setNotes]       = useState('');

  const reset = () => { setNameEN(''); setScheduledDt(''); setNextDue(''); setBrand(''); setDoseNum(''); setNotes(''); };

  const save = () => {
    if (!nameEN.trim()) {
      Alert.alert(t('vaccine_log.custom_name_required_title'), t('vaccine_log.custom_name_required_msg'));
      return;
    }
    if (!scheduledDt.trim()) {
      Alert.alert(t('vaccine_log.date_required_title'), t('vaccine_log.date_required_msg'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    vaccineStore.addCustomRecord({
      childId,
      nameEN: nameEN.trim(),
      scheduledDate: scheduledDt.trim(),
      nextDueDate:  nextDue.trim() || undefined,
      brand: brand.trim() || undefined,
      doseNumber: doseNum ? parseInt(doseNum, 10) : undefined,
      notes: notes.trim() || undefined,
    });
    reset();
    onSave();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cm.wrap}>
          <LinearGradient colors={[Colors.primary, '#F07090']} style={cm.hdr}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={cm.closeBtn}>
              <Text style={cm.closeTxt}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={cm.hdrTitle}>{t('vaccine_log.custom_modal_title')}</Text>
              <Text style={cm.hdrSub}>{t('vaccine_log.custom_modal_subtitle')}</Text>
            </View>
            <View style={cm.customBadge}>
              <Text style={cm.customBadgeTxt}>{t('vaccine_log.custom_badge')}</Text>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={cm.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionHeader icon={<Pill size={14} strokeWidth={1.5} color={Colors.primary} />} label={t('vaccine_log.sec_details')} />

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.custom_name_label')} *</Text>
              <TextInput style={cm.input} value={nameEN} onChangeText={setNameEN}
                placeholder={t('vaccine_log.custom_name_placeholder')} placeholderTextColor="#ccc" autoFocus />
            </View>

            <SectionHeader icon={<Calendar size={14} strokeWidth={1.5} color={Colors.primary} />} label={t('vaccine_log.sec_schedule')} />

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.field_date_given')} *</Text>
              <TextInput style={cm.input} value={scheduledDt} onChangeText={setScheduledDt}
                placeholder="YYYY-MM-DD" placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
            </View>

            <SectionHeader icon={<Syringe size={14} strokeWidth={1.5} color={Colors.primary} />} label={t('vaccine_log.sec_admin')} />

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.field_brand')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {BRANDS.map(b => (
                    <TouchableOpacity key={b} onPress={() => setBrand(brand === b ? '' : b)} activeOpacity={0.8}
                      style={[cm.chip, brand === b && cm.chipActive]}>
                      <Text style={[cm.chipTxt, brand === b && cm.chipTxtActive]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.field_dose_number')}</Text>
              <TextInput style={cm.input} value={doseNum} onChangeText={setDoseNum}
                placeholder="1" placeholderTextColor="#ccc" keyboardType="number-pad" />
            </View>

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.field_next_due')}</Text>
              <TextInput style={cm.input} value={nextDue} onChangeText={setNextDue}
                placeholder={t('vaccine_log.field_next_due_placeholder')} placeholderTextColor="#ccc" keyboardType="numbers-and-punctuation" />
            </View>

            <View style={cm.fBlock}>
              <Text style={cm.fLbl}>{t('vaccine_log.field_notes')}</Text>
              <TextInput style={[cm.input, cm.inputMulti]} value={notes} onChangeText={setNotes}
                placeholder={t('vaccine_log.custom_notes_placeholder')} placeholderTextColor="#ccc" multiline numberOfLines={3} />
            </View>

            <TouchableOpacity onPress={save} activeOpacity={0.85} style={{ marginTop: 8 }}>
              <LinearGradient colors={[Colors.primary, '#F07090']} style={cm.saveBtn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Plus size={18} strokeWidth={2} color={Colors.white} />
                  <Text style={cm.saveBtnTxt}>{t('vaccine_log.custom_save')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 48 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  wrap:         { flex: 1, backgroundColor: Colors.background },
  hdr:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { color: Colors.white, fontSize: 14, fontWeight: '700' },
  hdrTitle:     { fontSize: 16, fontWeight: '800', color: Colors.white },
  hdrSub:       { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  customBadge:  { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  customBadgeTxt:{ fontSize: 11, fontWeight: '800', color: Colors.white },
  content:      { padding: 16, paddingBottom: 32 },
  fBlock:       { marginBottom: 14 },
  fLbl:         { fontSize: 12, fontWeight: '700', color: GRAY, marginBottom: 6 },
  input:        { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 11, fontSize: 13, color: DARK, height: 52, fontFamily: 'PlusJakartaSans_400Regular' },
  inputMulti:   { minHeight: 72, height: undefined, textAlignVertical: 'top', paddingTop: 12 },
  chip:         { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive:   { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  chipTxt:      { fontSize: 12, fontWeight: '600', color: GRAY },
  chipTxtActive:{ color: Colors.primary, fontWeight: '800' },
  saveBtn:      { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnTxt:   { color: Colors.white, fontSize: 16, fontWeight: '800' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function VaccinesScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const vaccineStore    = useVaccineStore();

  const [isLoading,      setIsLoading]      = useState(true);
  const [mainTab,        setMainTab]        = useState<MainTab>('knowledge');
  const [detailVaccine,  setDetailVaccine]  = useState<VaccineEntry | null>(null);
  const [detailRecord,   setDetailRecord]   = useState<VaccineRecord | undefined>(undefined);
  const [detailVisible,  setDetailVisible]  = useState(false);
  const [editRecord,     setEditRecord]     = useState<VaccineRecord | null>(null);
  const [editVisible,    setEditVisible]    = useState(false);
  const [customVisible,  setCustomVisible]  = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeChild?.id && activeChild.birthday) {
      vaccineStore.autoPopulate(activeChild.id, activeChild.birthday);
      vaccineStore.refreshStatuses(activeChild.id, activeChild.birthday);
    }
  }, [activeChild?.id]);

  const allForChild        = activeChild ? vaccineStore.getRecords(activeChild.id) : [];
  const givenCount         = allForChild.filter(r => r.status === 'given').length;
  const upcomingCount      = allForChild.filter(r => r.status === 'upcoming').length;
  const overdueCount       = allForChild.filter(r => r.status === 'overdue').length;
  const notApplicableCount = allForChild.filter(r => r.status === 'not_applicable').length;
  const totalCount         = allForChild.length;
  const overdueNames       = allForChild.filter(r => r.status === 'overdue').map(r => r.code);
  const nextUpcoming       = activeChild ? vaccineStore.getNextUpcoming(activeChild.id) : null;

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
      <View style={{ flex: 1, backgroundColor: '#F5F8FF' }}>
        {/* Hero card placeholder */}
        <View style={{ margin: 16, borderRadius: 20, backgroundColor: Colors.softBlue, padding: 20, height: 120,
          shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}>
          <View style={{ height: 18, width: '45%', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 12 }} />
          <View style={{ height: 14, width: '65%', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 8 }} />
          <View style={{ height: 14, width: '55%', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        </View>
        {/* Filter tabs placeholder */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
          {[70, 60, 80, 65].map((w, i) => (
            <View key={i} style={{ width: w, height: 32, borderRadius: 16, backgroundColor: Colors.divider }} />
          ))}
        </View>
        {/* Vaccine rows */}
        <SkeletonList count={5} variant="row" />
      </View>
    );
  }

  if (!activeChild) {
    return (
      <ScrollView style={sc.container} contentContainerStyle={sc.content}>
        <LinearGradient colors={[Colors.blue,'#4A9DE8']} style={sc.emptyHero}>
          <Syringe size={48} strokeWidth={1.5} color={Colors.white} />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Microscope size={14} strokeWidth={1.5} color={mainTab === 'knowledge' ? Colors.white : GRAY} />
            <Text style={[sc.mainTabTxt, mainTab === 'knowledge' && sc.mainTabTxtActive]}>{t('vaccine_kb.tab_knowledge')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sc.mainTab, mainTab === 'records' && sc.mainTabActive]}
          onPress={() => setMainTab('records')} activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ClipboardList size={14} strokeWidth={1.5} color={mainTab === 'records' ? Colors.white : GRAY} />
              <Text style={[sc.mainTabTxt, mainTab === 'records' && sc.mainTabTxtActive]}>{t('vaccine_kb.tab_records')}</Text>
            </View>
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
            notApplicableCount={notApplicableCount}
            totalCount={totalCount}
            overdueNames={overdueNames}
            nextUpcoming={nextUpcoming}
            onEditRecord={r => { setEditRecord(r); setEditVisible(true); }}
            onAddCustom={() => setCustomVisible(true)}
          />
        )}
      </ScrollView>

      {/* Floating "+" FAB — pointer-transparent overlay so it sits above ScrollView */}
      {mainTab === 'records' && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <TouchableOpacity
            style={sc.fab}
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCustomVisible(true);
            }}
          >
            <Plus size={28} strokeWidth={2.5} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

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

      {/* Custom Vaccine Modal (FAB in My Records tab) */}
      {activeChild && (
        <CustomVaccineModal
          visible={customVisible}
          childId={activeChild.id}
          onClose={() => setCustomVisible(false)}
          onSave={() => setCustomVisible(false)}
        />
      )}
    </View>
  );
}

const sc = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  content:         { padding: 16, paddingBottom: 40 },
  fab:             { position: 'absolute', bottom: 24, right: 16, width: 56, height: 56,
                     borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center',
                     justifyContent: 'center', shadowColor: Colors.shadowColor,
                     shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                     elevation: 8, zIndex: 99 },
  mainTabBar:      { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 4, zIndex: 10 },
  mainTab:         { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5FA', alignItems: 'center', justifyContent: 'center' },
  mainTabActive:   { backgroundColor: BLUE },
  mainTabTxt:      { fontSize: 13, fontWeight: '700', color: GRAY },
  mainTabTxtActive:{ color: Colors.white },
  overdueDot:      { backgroundColor: '#E53E3E', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  overdueDotTxt:   { color: Colors.white, fontSize: 10, fontWeight: '800' },
  emptyHero:       { borderRadius: 22, padding: 40, alignItems: 'center', gap: 10 },
  emptyTitle:      { fontSize: 20, fontWeight: '800', color: Colors.white },
  emptySub:        { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
});
