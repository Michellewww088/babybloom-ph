/**
 * growth-analysis.tsx — Full Growth Analysis Screen
 * WHO Growth Charts + AI Analysis + Measurement History + PDF Export
 * BMAD: richer context, interactivity, AI narrative — beats AsianParents
 */

// Suppress React Native Web SVG prop warnings (onPress on SVG elements is handled via onClick on web)
if (typeof window !== 'undefined') {
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('Unknown event handler property') || msg.includes('onPress')) return;
    origError(...args);
  };
}

import React, { useState, useRef } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, StyleSheet, Dimensions, Alert, Platform,
  KeyboardAvoidingView, Share,
} from 'react-native';
import Svg, {
  Path, Circle, Line, Polyline,
  Text as SvgText, Defs, LinearGradient as SvgGrad, Stop, G,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  Trash2, Lightbulb, Star, Smile, AlertTriangle, Scale, Ruler, Brain,
  Sparkles, Bot, BarChart2, Users, ClipboardList, Share2, CheckCircle, CircleAlert,
} from 'lucide-react-native';

import Colors from '../constants/Colors';
import { useChildStore, getChildDisplayName } from '../store/childStore';
import { useGrowthStore, GrowthRecord } from '../store/growthStore';
import {
  getWHOPercentile, getWHOCurveData, getCorrectedAgeMonths,
  WHOPercentileRow, Sex, GrowthMetric,
} from '../lib/who-growth';

const { width: W } = Dimensions.get('window');
const PAD = 16;

// Chart constants
const SVG_W      = W - PAD * 2;
const CHART_H    = 270;
const PL         = 46;  // pad left
const PB         = 28;  // pad bottom
const PT         = 14;  // pad top
const PR         = 18;  // pad right
const PLOT_W     = SVG_W - PL - PR;
const PLOT_H     = CHART_H - PT - PB;

type TabId = 'weight' | 'height' | 'head';

interface DotInfo {
  x: number; y: number;
  record: GrowthRecord;
  value: number;
  percentile: number;
  label: string;
  color: string;
}

interface MetricReport {
  status: 'Normal' | 'Low' | 'High' | 'Watch';
  explanation: string;
}
interface GrowthReport {
  overallSummary:  string;
  overallStatus:   'great' | 'good' | 'watch';
  weight:          MetricReport;
  height:          MetricReport;
  head:            MetricReport;
  healthInsights:  string;
  parentGuidance:  string[];
}

// ─── WHO Growth Chart ─────────────────────────────────────────────────────────
function WHOGrowthChart({
  records, ageMonths, sex, metric, onDotPress, activeDotId,
}: {
  records: GrowthRecord[];
  ageMonths: number;
  sex: Sex;
  metric: GrowthMetric;
  onDotPress: (dot: DotInfo | null) => void;
  activeDotId: string | null;
}) {
  const { t }     = useTranslation();
  const curveData = getWHOCurveData(sex, metric);
  const unit      = metric === 'weight' ? 'kg' : 'cm';

  const getV = (r: GrowthRecord) =>
    metric === 'weight' ? r.weightKg :
    metric === 'height' ? r.heightCm : r.headCircumferenceCm;

  const allP3  = curveData.map((r) => r.p3);
  const allP97 = curveData.map((r) => r.p97);
  const yMin   = Math.floor(Math.min(...allP3) * 0.91);
  const yMax   = Math.ceil(Math.max(...allP97) * 1.06);

  const toX = (m: number) => PL + Math.min(m, 24) / 24 * PLOT_W;
  const toY = (v: number) => PT + (1 - (v - yMin) / (yMax - yMin)) * PLOT_H;

  const polyPts = (key: keyof WHOPercentileRow) =>
    curveData.map((r) => `${toX(r.months)},${toY(r[key] as number)}`).join(' ');

  const bandD = (lo: keyof WHOPercentileRow, hi: keyof WHOPercentileRow) => {
    const fwd  = curveData.map((r) => `${toX(r.months)},${toY(r[hi] as number)}`).join(' ');
    const back = [...curveData].reverse().map((r) => `${toX(r.months)},${toY(r[lo] as number)}`).join(' ');
    return `M ${fwd} L ${back} Z`;
  };

  // Child dots (age estimated from date diff vs today)
  const dots: DotInfo[] = records
    .filter((r) => getV(r) !== undefined)
    .map((r) => {
      const val    = getV(r)!;
      const msAgo  = Date.now() - new Date(r.measuredAt).getTime();
      const dotAge = Math.max(0, ageMonths - msAgo / (1000 * 60 * 60 * 24 * 30.44));
      const res    = getWHOPercentile(sex, metric, Math.round(dotAge), val);
      return {
        x: toX(Math.min(dotAge, 24)),
        y: toY(val),
        record: r, value: val,
        percentile: res.percentile,
        label: res.label,
        color: res.color,
      };
    });

  // Axis ticks
  const tStep  = metric === 'weight' ? 2 : metric === 'height' ? 10 : 5;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / tStep) * tStep; v <= yMax; v += tStep) yTicks.push(v);
  const xTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <View>
      <Svg width={SVG_W} height={CHART_H}>
        <Defs>
          <SvgGrad id="gb" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#27AE7A" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#27AE7A" stopOpacity="0.05" />
          </SvgGrad>
        </Defs>

        {/* Color bands */}
        <Path d={bandD('p3', 'p15')}  fill="#FEF3C7" opacity="0.7" />
        <Path d={bandD('p15', 'p85')} fill="url(#gb)" />
        <Path d={bandD('p85', 'p97')} fill="#FEF3C7" opacity="0.7" />

        {/* Grid lines */}
        {yTicks.map((v) => (
          <Line key={v} x1={PL} y1={toY(v)} x2={SVG_W - PR} y2={toY(v)}
            stroke="#F3F4F6" strokeWidth="1" />
        ))}

        {/* WHO curves */}
        <Polyline points={polyPts('p3')}  fill="none" stroke="#FCA5A5" strokeWidth="1"   strokeDasharray="4,3" />
        <Polyline points={polyPts('p15')} fill="none" stroke="#F5A623" strokeWidth="1.2" strokeDasharray="5,3" />
        <Polyline points={polyPts('p50')} fill="none" stroke="#27AE7A" strokeWidth="2.2" />
        <Polyline points={polyPts('p85')} fill="none" stroke="#F5A623" strokeWidth="1.2" strokeDasharray="5,3" />
        <Polyline points={polyPts('p97')} fill="none" stroke="#FCA5A5" strokeWidth="1"   strokeDasharray="4,3" />

        {/* Percentile labels on right edge */}
        {([['p3','3','#FCA5A5'],['p15','15',Colors.gold],['p50','50',Colors.mint],['p85','85',Colors.gold],['p97','97','#FCA5A5']] as [keyof WHOPercentileRow, string, string][]).map(([key, lbl, col]) => {
          const last = curveData[curveData.length - 1];
          return (
            <SvgText key={key} x={SVG_W - PR + 2} y={toY(last[key] as number) + 3}
              fontSize="8" fill={col} fontWeight="700" textAnchor="start">{lbl}</SvgText>
          );
        })}

        {/* Child line */}
        {dots.length > 1 && (
          <Polyline points={dots.map((d) => `${d.x},${d.y}`).join(' ')}
            fill="none" stroke={Colors.primaryPink} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Child dots */}
        {dots.map((dot) => (
          <G key={dot.record.id}>
            {activeDotId === dot.record.id && (
              <Circle cx={dot.x} cy={dot.y} r="16" fill={dot.color + '22'} />
            )}
            <Circle cx={dot.x} cy={dot.y} r="7" fill={dot.color} stroke="#FFFFFF" strokeWidth="2.5" />
            <Circle cx={dot.x} cy={dot.y} r="20" fill="transparent"
              onPress={Platform.OS !== 'web' ? () => onDotPress(activeDotId === dot.record.id ? null : dot) : undefined}
              onClick={Platform.OS === 'web' ? () => onDotPress(activeDotId === dot.record.id ? null : dot) : undefined} />
          </G>
        ))}

        {/* Axes */}
        <Line x1={PL} y1={PT + PLOT_H} x2={SVG_W - PR} y2={PT + PLOT_H} stroke="#E5E7EB" strokeWidth="1.5" />
        <Line x1={PL} y1={PT}          x2={PL}          y2={PT + PLOT_H} stroke="#E5E7EB" strokeWidth="1.5" />

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <SvgText key={v} x={PL - 4} y={toY(v) + 3}
            fontSize="9" fill={Colors.lightGray} textAnchor="end">{v}{unit}</SvgText>
        ))}

        {/* X-axis labels */}
        {xTicks.map((m) => (
          <SvgText key={m} x={toX(m)} y={PT + PLOT_H + 14}
            fontSize="9" fill={Colors.lightGray} textAnchor="middle">{m}m</SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={ch.legend}>
        {[
          { color: Colors.mint,           label: '50th (median)' },
          { color: Colors.primaryPink,  label: t('growth.child_data_legend') },
          { color: Colors.gold,         label: '15th / 85th' },
          { color: '#FCA5A5',           label: '3rd / 97th' },
        ].map(({ color, label }) => (
          <View key={label} style={ch.item}>
            <View style={[ch.dot, { backgroundColor: color }]} />
            <Text style={ch.lbl}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Dot Popup ────────────────────────────────────────────────────────────────
function DotPopup({ dot, metric, onClose }: { dot: DotInfo; metric: GrowthMetric; onClose: () => void }) {
  const unit = metric === 'weight' ? 'kg' : 'cm';
  const dec  = metric === 'weight' ? 2 : 1;
  const date = new Date(dot.record.measuredAt).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const left = Math.max(4, Math.min(dot.x - 70, SVG_W - 150));
  return (
    <View style={[dp.card, { borderColor: dot.color + '60', left }]}>
      <TouchableOpacity style={dp.closeBtn} onPress={onClose}>
        <Text style={dp.closeX}>✕</Text>
      </TouchableOpacity>
      <Text style={[dp.value, { color: dot.color }]}>{dot.value.toFixed(dec)} {unit}</Text>
      <View style={[dp.badge, { backgroundColor: dot.color + '20' }]}>
        <Text style={[dp.badgeTxt, { color: dot.color }]}>{dot.percentile}th %ile · {dot.label}</Text>
      </View>
      <Text style={dp.date}>{date}</Text>
    </View>
  );
}

// ─── Add/Edit Measurement Modal ───────────────────────────────────────────────
function MeasurementModal({
  visible, onClose, childId, editRecord,
}: {
  visible: boolean; onClose: () => void;
  childId: string; editRecord?: GrowthRecord;
}) {
  const { t }   = useTranslation();
  const store   = useGrowthStore();
  const today   = new Date().toISOString().split('T')[0];

  const [date,   setDate]   = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head,   setHead]   = useState('');
  const [notes,  setNotes]  = useState('');

  React.useEffect(() => {
    if (visible) {
      setDate(editRecord?.measuredAt ?? today);
      setWeight(editRecord?.weightKg?.toString() ?? '');
      setHeight(editRecord?.heightCm?.toString() ?? '');
      setHead(editRecord?.headCircumferenceCm?.toString() ?? '');
      setNotes(editRecord?.notes ?? '');
    }
  }, [visible, editRecord]);

  const save = () => {
    if (!weight && !height && !head) {
      Alert.alert('Missing data', 'Please enter at least one measurement.');
      return;
    }
    const rec: GrowthRecord = {
      id: editRecord?.id ?? `gr_${Date.now()}`,
      childId,
      measuredAt: date || today,
      weightKg:   weight ? parseFloat(weight) : undefined,
      heightCm:   height ? parseFloat(height) : undefined,
      headCircumferenceCm: head ? parseFloat(head) : undefined,
      notes: notes || undefined,
      createdAt: editRecord?.createdAt ?? new Date().toISOString(),
    };
    editRecord ? store.updateRecord(editRecord.id, rec) : store.addRecord(rec);
    onClose();
  };

  const del = () => {
    if (!editRecord) return;
    Alert.alert(t('growth.modal_delete'), t('growth.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { store.deleteRecord(editRecord.id); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={mm.wrap}>
          {/* Header */}
          <View style={mm.hdr}>
            <TouchableOpacity onPress={onClose} style={mm.closeBtn}>
              <Text style={mm.closeTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={mm.title}>{editRecord ? t('growth.edit_title') : t('growth.modal_title')}</Text>
            {editRecord
              ? <TouchableOpacity onPress={del} style={mm.delBtn}><Trash2 size={20} strokeWidth={1.5} color={Colors.primaryPink} /></TouchableOpacity>
              : <View style={{ width: 36 }} />
            }
          </View>

          <ScrollView contentContainerStyle={mm.body} keyboardShouldPersistTaps="handled">
            <Text style={mm.label}>{t('growth.modal_date')}</Text>
            <TextInput style={mm.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={Colors.lightGray} />

            <Text style={mm.label}>{t('growth.modal_weight')}</Text>
            <View style={mm.row}>
              <TextInput style={[mm.input, { flex: 1 }]} value={weight} onChangeText={setWeight}
                placeholder={t('growth.modal_weight_placeholder')} placeholderTextColor={Colors.lightGray}
                keyboardType="decimal-pad" />
              <Text style={mm.unit}>kg</Text>
            </View>

            <Text style={mm.label}>{t('growth.modal_height')}</Text>
            <View style={mm.row}>
              <TextInput style={[mm.input, { flex: 1 }]} value={height} onChangeText={setHeight}
                placeholder={t('growth.modal_height_placeholder')} placeholderTextColor={Colors.lightGray}
                keyboardType="decimal-pad" />
              <Text style={mm.unit}>cm</Text>
            </View>

            <Text style={mm.label}>{t('growth.modal_head')}</Text>
            <View style={mm.row}>
              <TextInput style={[mm.input, { flex: 1 }]} value={head} onChangeText={setHead}
                placeholder={t('growth.modal_head_placeholder')} placeholderTextColor={Colors.lightGray}
                keyboardType="decimal-pad" />
              <Text style={mm.unit}>cm</Text>
            </View>

            <Text style={mm.label}>{t('growth.modal_notes')}</Text>
            <TextInput style={[mm.input, { height: 70, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder={t('growth.modal_notes')} placeholderTextColor={Colors.lightGray} multiline />

            <View style={mm.tip}>
              <Text style={mm.tipTxt}>
                <Lightbulb size={16} strokeWidth={1.5} color={Colors.gold} />{' '}Weigh baby undressed in the morning before feeding. Use your Pediatrician's scale when possible for the most accurate reading.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={save} activeOpacity={0.85} style={mm.saveWrap}>
            <LinearGradient colors={[Colors.primaryPink, '#F472B6']} style={mm.saveBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={mm.saveTxt}>{t('growth.modal_save')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Percentile Visual Bar ────────────────────────────────────────────────────
function PercentileBar({ percentile, color }: { percentile: number; color: string }) {
  const BAR_W  = W - PAD * 2 - 64;
  const clamped = Math.max(0, Math.min(100, percentile));
  const markerLeft = (clamped / 100) * BAR_W - 8; // centre the 16px circle

  return (
    <View style={{ marginVertical: 8 }}>
      {/* Zone colour bar */}
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 6, overflow: 'hidden', width: BAR_W }}>
        <View style={{ width: BAR_W * 0.05,  backgroundColor: '#FCA5A5' }} />
        <View style={{ width: BAR_W * 0.10,  backgroundColor: '#FDE68A' }} />
        <View style={{ width: BAR_W * 0.70,  backgroundColor: '#6EE7B7' }} />
        <View style={{ width: BAR_W * 0.12,  backgroundColor: '#FDE68A' }} />
        <View style={{ width: BAR_W * 0.03,  backgroundColor: '#FCA5A5' }} />
      </View>
      {/* Marker circle */}
      <View style={{
        position: 'absolute', left: Math.max(0, markerLeft), top: -3,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: color, borderWidth: 2.5, borderColor: Colors.white,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 3, elevation: 4,
      }} />
      {/* Percentile label */}
      <Text style={{
        position: 'absolute', left: Math.max(0, markerLeft - 6), top: 15,
        fontSize: 10, fontWeight: '800', color,
      }}>p{Math.round(clamped)}</Text>
      {/* Zone labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, width: BAR_W }}>
        <Text style={{ fontSize: 8, color: '#FCA5A5', fontWeight: '800' }}>Low</Text>
        <Text style={{ fontSize: 8, color: Colors.mint, fontWeight: '800', marginLeft: 14 }}>Healthy (p15–p85)</Text>
        <Text style={{ fontSize: 8, color: '#FCA5A5', fontWeight: '800' }}>High</Text>
      </View>
    </View>
  );
}

function StatusIcon({ st, size = 14 }: { st: string; size?: number }) {
  if (st === 'Normal') return <CheckCircle size={size} strokeWidth={1.5} color={Colors.mint} />;
  if (st === 'Watch')  return <CircleAlert size={size} strokeWidth={1.5} color={Colors.gold} />;
  return <AlertTriangle size={size} strokeWidth={1.5} color={Colors.primaryPink} />;
}

// ─── Demo report builder (no API key required) ────────────────────────────────
function buildDemoReport(
  name: string, ageM: number, sex: Sex,
  wR: ReturnType<typeof getWHOPercentile> | null,
  hR: ReturnType<typeof getWHOPercentile> | null,
  hdR: ReturnType<typeof getWHOPercentile> | null,
  wTrend: string,
): GrowthReport {
  const classify = (pct?: number): 'Normal' | 'Watch' | 'Low' | 'High' => {
    if (pct === undefined) return 'Normal';
    if (pct >= 15 && pct <= 85) return 'Normal';
    if (pct >= 5  && pct <= 97) return 'Watch';
    return pct < 5 ? 'Low' : 'High';
  };
  const overall = (classify(wR?.percentile) === 'Normal' && classify(hR?.percentile) === 'Normal') ? 'great' : 'good';
  const wPct  = wR  ? Math.round(wR.percentile)  : null;
  const hPct  = hR  ? Math.round(hR.percentile)  : null;
  const hdPct = hdR ? Math.round(hdR.percentile) : null;
  const isBF  = ageM < 6;
  return {
    overallSummary:
      `${name} is growing ${overall === 'great' ? 'beautifully' : 'steadily'}! At ${ageM} month${ageM !== 1 ? 's' : ''} old, ` +
      `${wPct ? `weight is at the ${wPct}th percentile` : 'measurements look good'} — ` +
      (wTrend.includes('gaining') ? `great weight gain trend, keep up the wonderful feeding routine!` : `continue regular well-baby checkups to track progress.`),
    overallStatus: overall,
    weight: {
      status: classify(wR?.percentile),
      explanation: wPct
        ? `${name}'s weight is at the ${wPct}th percentile — meaning ${wPct} out of 100 babies of the same age and gender weigh less. ` +
          (wPct >= 15 && wPct <= 85 ? `This is in the healthy range — great news!` : wPct >= 5 ? `Slightly outside typical range — worth monitoring at next visit.` : `Please consult your Pediatrician for guidance.`)
        : 'No weight recorded yet. Tap + Add to log a measurement.',
    },
    height: {
      status: classify(hR?.percentile),
      explanation: hPct
        ? `Height/length is at the ${hPct}th percentile for this age and gender. ` +
          (hPct >= 15 && hPct <= 85 ? `Growing at a healthy rate according to WHO Multicentre Growth Reference Study!` : `Check with your Pedia at the next checkup.`)
        : 'No height recorded yet. Add it for a complete analysis.',
    },
    head: {
      status: classify(hdR?.percentile),
      explanation: hdPct
        ? `Head circumference at the ${hdPct}th percentile is a good sign of brain and cognitive development. ` +
          (hdPct >= 5 && hdPct <= 97 ? `Within the normal range — brain growth looks on track!` : `Mention this measurement to your Pediatrician.`)
        : 'No head circumference recorded. This helps assess brain development.',
    },
    healthInsights:
      `Overall, ${name}'s growth pattern shows consistent, healthy development. ` +
      `The measurements suggest ${isBF ? 'breast milk or formula is providing excellent nutrition' : 'complementary feeding is going well alongside breast milk'}. ` +
      `Regular well-baby checkups every 1–3 months help catch any concerns early and keep vaccinations on schedule.`,
    parentGuidance: [
      isBF
        ? `Continue exclusive breastfeeding — DOH Philippines recommends it for the first 6 months. Breastfeed on demand, 8–12 times per day.`
        : `At ${ageM} months, offer 3–4 solid meals daily alongside breast milk. Great Philippine superfoods: lugaw, kamote, kalabasa, saging, and malunggay!`,
      `Track feeding and sleep in BabyBloom PH. For ${ageM}-month-olds, expect ${ageM < 3 ? '14–17' : ageM < 6 ? '12–16' : '12–15'} hours of total sleep per day.`,
      `Next well-baby checkup: the PPS schedule recommends visits at 2, 4, 6, 9, 12, 15, 18, and 24 months. Your next vaccine may also be due soon — check the Vaccines tab!`,
    ],
  };
}

// ─── AI Growth Analysis ───────────────────────────────────────────────────────
function AIGrowthSection({ records, childName, ageMonths, sex }: {
  records: GrowthRecord[]; childName: string; ageMonths: number; sex: Sex;
}) {
  const { t }                         = useTranslation();
  const [report,   setReport]         = useState<GrowthReport | null>(null);
  const [rawText,  setRawText]        = useState<string | null>(null);
  const [load,     setLoad]           = useState(false);
  const [open,     setOpen]           = useState(false);
  const fetched                       = useRef(false);
  const latest                        = records.length > 0 ? records[records.length - 1] : null;

  // WHO percentiles for latest record
  const wR  = latest?.weightKg             ? getWHOPercentile(sex, 'weight', ageMonths, latest.weightKg)             : null;
  const hR  = latest?.heightCm             ? getWHOPercentile(sex, 'height', ageMonths, latest.heightCm)             : null;
  const hdR = latest?.headCircumferenceCm  ? getWHOPercentile(sex, 'head',   ageMonths, latest.headCircumferenceCm)  : null;

  // Weight trend
  const sortedW = records.filter((r) => r.weightKg !== undefined);
  const prevW   = sortedW.length >= 2 ? sortedW[sortedW.length - 2].weightKg : undefined;
  const wTrend  = latest?.weightKg && prevW
    ? (latest.weightKg > prevW ? `gaining well (+${(latest.weightKg - prevW).toFixed(2)}kg since last)` : `slight decrease — monitor`)
    : 'only one measurement';

  const [isDemo,   setIsDemo]  = useState(false);

  const doFetch = async () => {
    if (fetched.current) return;
    fetched.current = true;
    setLoad(true);
    const apiKey = (process.env as any).EXPO_PUBLIC_CLAUDE_API_KEY;
    if (!apiKey || apiKey === 'your_claude_api_key_here') {
      // Demo mode — build a report from actual measurements without calling the API
      await new Promise(r => setTimeout(r, 900)); // brief loading feel
      setReport(buildDemoReport(childName, ageMonths, sex, wR, hR, hdR, wTrend));
      setIsDemo(true);
      setLoad(false); return;
    }

    const prompt = `You are Ate AI, a warm baby health assistant for BabyBloom PH (Philippines). You are like a caring older sister to Filipino parents.

Generate a detailed, parent-friendly growth report for ${childName}.

Baby Information:
- Name: ${childName}
- Age: ${ageMonths} months old
- Gender: ${sex}

Latest Measurements vs WHO Standards:
- Weight: ${latest?.weightKg ? `${latest.weightKg}kg → ~${wR ? Math.round(wR.percentile) : '?'}th percentile (${wR?.label ?? 'unknown'})` : 'not recorded'}
- Height/Length: ${latest?.heightCm ? `${latest.heightCm}cm → ~${hR ? Math.round(hR.percentile) : '?'}th percentile (${hR?.label ?? 'unknown'})` : 'not recorded'}
- Head Circumference: ${latest?.headCircumferenceCm ? `${latest.headCircumferenceCm}cm → ~${hdR ? Math.round(hdR.percentile) : '?'}th percentile` : 'not recorded'}
- Weight trend: ${wTrend}
- Total measurements recorded: ${records.length}

Return ONLY a valid JSON object — no markdown, no backticks, no text outside JSON:
{
  "overallSummary": "2-3 warm sentences about the baby's overall growth, using the actual measurements.",
  "overallStatus": "great",
  "weight": {
    "status": "Normal",
    "explanation": "2 sentences about weight in parent-friendly language. Explain what the percentile means — e.g., heavier than X out of 100 babies the same age and gender."
  },
  "height": {
    "status": "Normal",
    "explanation": "2 sentences about height in parent-friendly language."
  },
  "head": {
    "status": "Normal",
    "explanation": "2 sentences about head circumference and what it suggests about brain development."
  },
  "healthInsights": "2-3 sentences about what these measurements together suggest about the baby's overall development.",
  "parentGuidance": ["Practical and specific tip 1 relevant to this age", "Practical tip 2 (feeding or activity)", "Practical tip 3 (when to see the Pedia)"]
}

Rules: status = Normal | Low | High | Watch. overallStatus = great | good | watch. Be warm and reassuring. No medical diagnoses. Keep it simple.`;

    try {
      const res  = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 750,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();

      // API-level error (credits, rate limit, auth) → fallback to demo
      if (!res.ok || data?.error) {
        setReport(buildDemoReport(childName, ageMonths, sex, wR, hR, hdR, wTrend));
        setIsDemo(true);
        setLoad(false); return;
      }

      const txt   = data?.content?.[0]?.text?.trim() ?? '';
      // Strip any markdown code fences if present
      const clean = txt.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
      try { setReport(JSON.parse(clean) as GrowthReport); }
      catch {
        // JSON parse failed → also fallback to demo
        setReport(buildDemoReport(childName, ageMonths, sex, wR, hR, hdR, wTrend));
        setIsDemo(true);
      }
    } catch {
      // Network error → fallback to demo
      setReport(buildDemoReport(childName, ageMonths, sex, wR, hR, hdR, wTrend));
      setIsDemo(true);
    }
    setLoad(false);
  };

  // Overall status colour theming
  const OVERALL_THEME: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    great: { bg: Colors.softMint, text: Colors.mint,         icon: <Star size={24} strokeWidth={1.5} color={Colors.mint} /> },
    good:  { bg: Colors.softGold, text: Colors.gold,         icon: <Smile size={24} strokeWidth={1.5} color={Colors.gold} /> },
    watch: { bg: Colors.softPink, text: Colors.primaryPink,  icon: <AlertTriangle size={24} strokeWidth={1.5} color={Colors.primaryPink} /> },
  };
  const theme = report ? (OVERALL_THEME[report.overallStatus] ?? OVERALL_THEME.good) : null;

  // Per-metric config
  const METRICS = [
    { key: 'weight' as const, label: 'Weight',              icon: <Scale size={20} strokeWidth={1.5} color={Colors.textMid} />, pR: wR,  val: latest?.weightKg,            unit: 'kg', dec: 2 },
    { key: 'height' as const, label: 'Height / Length',     icon: <Ruler size={20} strokeWidth={1.5} color={Colors.textMid} />, pR: hR,  val: latest?.heightCm,             unit: 'cm', dec: 1 },
    { key: 'head'   as const, label: 'Head Circumference',  icon: <Brain size={20} strokeWidth={1.5} color={Colors.textMid} />, pR: hdR, val: latest?.headCircumferenceCm,  unit: 'cm', dec: 1 },
  ];

  return (
    <View style={aig.wrapper}>
      {/* ── Collapsible header ── */}
      <TouchableOpacity
        style={aig.hdrRow}
        onPress={() => { setOpen(!open); if (!open && !fetched.current) doFetch(); }}
        activeOpacity={0.8}
      >
        <View style={aig.hdrLeft}>
          <LinearGradient colors={['#C4B5FD', '#7C3AED']} style={aig.hdrGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Sparkles size={20} strokeWidth={1.5} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={aig.hdrTitle}>{t('growth.ai_analysis_title')}</Text>
            <Text style={aig.hdrSub}>Powered by Ate AI · WHO standards</Text>
          </View>
        </View>
        <Text style={aig.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={aig.body}>
          {/* Loading */}
          {load && (
            <View style={aig.loadRow}>
              <Text style={aig.loadTxt}><Brain size={16} strokeWidth={1.5} color={Colors.textMid} /> {t('growth.ai_loading')}</Text>
            </View>
          )}

          {/* ── Structured 4-section report ── */}
          {!load && report && (
            <>
              {/* Demo badge */}
              {isDemo && (
                <View style={aig.demoBadge}>
                  <View style={aig.demoIcon}><Bot size={24} strokeWidth={1.5} color={Colors.textMid} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={aig.demoTitle}>Demo Preview</Text>
                    <Text style={aig.demoSub}>Add <Text style={{ fontWeight: '800' }}>EXPO_PUBLIC_CLAUDE_API_KEY</Text> to .env.local for live Ate AI analysis</Text>
                  </View>
                </View>
              )}

              {/* SECTION 1 — Overall Summary */}
              <View style={[aig.overallBanner, { backgroundColor: theme?.bg }]}>
                <View style={aig.overallIcon}>{theme?.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[aig.overallLabel, { color: theme?.text }]}>OVERALL GROWTH SUMMARY</Text>
                  <Text style={aig.overallText}>{report.overallSummary}</Text>
                </View>
              </View>

              {/* SECTION 2 — Per-metric detail */}
              <Text style={aig.sectionHdr}><BarChart2 size={16} strokeWidth={1.5} color={Colors.textMid} /> DETAILED ANALYSIS</Text>
              {METRICS.map(({ key, label, icon, pR, val, unit, dec }) => {
                const mr  = report[key];
                const st  = mr?.status ?? 'Normal';
                const stC = st === 'Normal' ? Colors.mint : st === 'Watch' ? Colors.gold : Colors.primaryPink;
                const stB = st === 'Normal' ? Colors.softMint : st === 'Watch' ? Colors.softGold : Colors.softPink;
                return (
                  <View key={key} style={aig.metricCard}>
                    <View style={aig.metricTop}>
                      <View style={aig.metricEmoji}>{icon}</View>
                      <Text style={aig.metricLabel}>{label}</Text>
                      <View style={[aig.statusBadge, { backgroundColor: stB }]}>
                        <Text style={[aig.statusTxt, { color: stC }]}><StatusIcon st={st} /> {st}</Text>
                      </View>
                    </View>
                    {val !== undefined && pR ? (
                      <>
                        <Text style={[aig.metricVal, { color: stC }]}>{val.toFixed(dec)} {unit}</Text>
                        <PercentileBar percentile={pR.percentile} color={pR.color} />
                        <Text style={aig.pctNote}>
                          {`${childName} is at the `}
                          <Text style={{ fontWeight: '800', color: stC }}>{Math.round(pR.percentile)}th percentile</Text>
                          {` — ${
                            pR.percentile >= 15 && pR.percentile <= 85
                              ? `within the healthy range for babies this age `
                              : pR.percentile >= 5 && pR.percentile <= 97
                              ? `slightly outside the typical range — worth monitoring `
                              : `outside the typical range — please consult your Pediatrician `
                          }`}
                          <StatusIcon st={pR.percentile >= 15 && pR.percentile <= 85 ? 'Normal' : pR.percentile >= 5 && pR.percentile <= 97 ? 'Watch' : 'Alert'} size={12} />
                        </Text>
                      </>
                    ) : (
                      <Text style={aig.pctNote}>No measurement recorded yet.</Text>
                    )}
                    <Text style={aig.metricExpl}>{mr?.explanation}</Text>
                  </View>
                );
              })}

              {/* SECTION 3 — Health Insights */}
              <View style={aig.insightCard}>
                <Text style={aig.sectionHdr}><Lightbulb size={16} strokeWidth={1.5} color={Colors.textMid} /> HEALTH INSIGHTS</Text>
                <Text style={aig.insightTxt}>{report.healthInsights}</Text>
              </View>

              {/* SECTION 4 — Parent Guidance */}
              <View style={aig.guidanceCard}>
                <Text style={aig.sectionHdr}><Users size={16} strokeWidth={1.5} color={Colors.textMid} /> PARENT GUIDANCE</Text>
                {(report.parentGuidance ?? []).map((tip, i) => (
                  <View key={i} style={aig.tipRow}>
                    <View style={aig.tipNum}><Text style={aig.tipNumTxt}>{i + 1}</Text></View>
                    <Text style={aig.tipTxt}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* WHO disclaimer */}
              <View style={aig.disclaimer}>
                <Text style={aig.disclaimerTxt}>
                  <ClipboardList size={14} strokeWidth={1.5} color={Colors.textMid} /> Based on WHO Multicentre Growth Reference Study (MGRS) standards.{'\n'}[This is general information. Please consult your Pedia for medical concerns.]
                </Text>
              </View>
            </>
          )}

          {/* Fallback — raw text if JSON parse failed */}
          {!load && !report && rawText && (
            <View style={aig.rawWrap}>
              <Text style={aig.rawTxt}>{rawText}</Text>
            </View>
          )}

          {/* Empty state */}
          {!load && !report && !rawText && (
            <Text style={aig.emptyTxt}>
              {latest ? 'Something went wrong. Close and tap again to retry.' : 'Add at least one measurement to unlock AI analysis.'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────
function HistoryTable({ records, metric, onEdit }: {
  records: GrowthRecord[]; metric: GrowthMetric; onEdit: (r: GrowthRecord) => void;
}) {
  const { t }  = useTranslation();
  const getV   = (r: GrowthRecord) =>
    metric === 'weight' ? r.weightKg : metric === 'height' ? r.heightCm : r.headCircumferenceCm;
  const unit   = metric === 'weight' ? 'kg' : 'cm';
  const dec    = metric === 'weight' ? 2 : 1;
  const sorted = [...records].reverse().filter((r) => getV(r) !== undefined);

  return (
    <View style={ht.wrap}>
      <Text style={ht.title}>{t('growth.history_title')}</Text>
      {sorted.length === 0
        ? <Text style={ht.empty}>{t('growth.history_empty')}</Text>
        : sorted.slice(0, 10).map((r, i) => {
            const val  = getV(r)!;
            const prev = sorted[i + 1] ? getV(sorted[i + 1]) : undefined;
            const diff = prev !== undefined ? val - prev : undefined;
            const date = new Date(r.measuredAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <TouchableOpacity key={r.id} style={[ht.row, i > 0 && ht.border]} onPress={() => onEdit(r)} activeOpacity={0.75}>
                <View>
                  <Text style={ht.date}>{date}</Text>
                  {r.notes ? <Text style={ht.notes} numberOfLines={1}>{r.notes}</Text> : null}
                </View>
                <View style={ht.right}>
                  <Text style={ht.val}>{val.toFixed(dec)} {unit}</Text>
                  {diff !== undefined && (
                    <Text style={[ht.diff, { color: diff >= 0 ? Colors.mint : Colors.primaryPink }]}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(dec)} {unit}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
      }
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GrowthAnalysisScreen() {
  const { t }           = useTranslation();
  const { activeChild } = useChildStore();
  const growthStore     = useGrowthStore();

  const [tab,     setTab]     = useState<TabId>('weight');
  const [modal,   setModal]   = useState(false);
  const [editRec, setEditRec] = useState<GrowthRecord | undefined>();
  const [dotInfo, setDotInfo] = useState<DotInfo | null>(null);

  if (!activeChild) {
    return (
      <View style={s.screen}>
        <LinearGradient colors={[Colors.primaryPink, '#F472B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.hdr}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 60 }}>
            <Text style={s.backW}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.hdrTitleW}>{t('growth.title')}</Text>
          <View style={{ width: 60 }} />
        </LinearGradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.midGray, fontSize: 15 }}>No active child profile.</Text>
        </View>
      </View>
    );
  }

  const name      = getChildDisplayName(activeChild);
  const sex: Sex  = activeChild.sex === 'female' ? 'female' : 'male';
  const birth     = new Date(activeChild.birthday);
  const ageM      = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  const corrected = getCorrectedAgeMonths(ageM, activeChild.gestationalAge);
  const isPreterm = !!(activeChild.gestationalAge && activeChild.gestationalAge < 37);

  const records = growthStore.getRecords(activeChild.id);
  const latest  = growthStore.getLatest(activeChild.id);

  const getV = (r: GrowthRecord) =>
    tab === 'weight' ? r.weightKg : tab === 'height' ? r.heightCm : r.headCircumferenceCm;
  const unit = tab === 'weight' ? 'kg' : 'cm';
  const dec  = tab === 'weight' ? 2 : 1;

  const curVal  = latest ? getV(latest) : undefined;
  const pResult = curVal !== undefined ? getWHOPercentile(sex, tab, corrected, curVal) : null;
  const sorted  = records.filter((r) => getV(r) !== undefined);
  const prevVal = sorted.length >= 2 ? getV(sorted[sorted.length - 2]) : undefined;
  const diff    = curVal !== undefined && prevVal !== undefined ? curVal - prevVal : undefined;

  const TABS = [
    { id: 'weight' as TabId, label: t('growth.tab_weight') },
    { id: 'height' as TabId, label: t('growth.tab_height') },
    { id: 'head'   as TabId, label: t('growth.tab_head')   },
  ];

  return (
    <View style={s.screen}>
      {/* Gradient header */}
      <LinearGradient colors={[Colors.primaryPink, '#F472B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 60 }}>
          <Text style={s.backW}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.hdrTitleW}>{t('growth.title')}</Text>
        <TouchableOpacity onPress={() => { setEditRec(undefined); setModal(true); }} style={s.addBtn}>
          <Text style={s.addTxt}>+ Add</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Child row */}
        <View style={s.childRow}>
          <Text style={s.childName}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.childAge}>{ageM}m</Text>
            {isPreterm && (
              <View style={s.pretrmBadge}>
                <Text style={s.pretrmTxt}>{t('growth.corrected_age_note')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Metric tabs */}
        <View style={tb2.bar}>
          {TABS.map(({ id, label }) => (
            <TouchableOpacity key={id} style={[tb2.tab, tab === id && tb2.active]}
              onPress={() => { setTab(id); setDotInfo(null); }}>
              <Text style={[tb2.txt, tab === id && tb2.activeTxt]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current value hero card */}
        {curVal !== undefined && pResult ? (
          <LinearGradient colors={[pResult.bgColor, Colors.white]} style={sv.card}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={{ flex: 1 }}>
              <Text style={sv.metaLbl}>
                {tab === 'weight' ? t('growth.summary_weight') :
                 tab === 'height' ? t('growth.summary_height') : t('growth.summary_head')}
              </Text>
              <Text style={[sv.big, { color: pResult.color }]}>
                {curVal.toFixed(dec)}<Text style={sv.unit}> {unit}</Text>
              </Text>
              {diff !== undefined && (
                <Text style={[sv.change, { color: diff >= 0 ? Colors.mint : Colors.primaryPink }]}>
                  {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(dec)}{unit} {t('growth.since_last')}
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[sv.badge, { backgroundColor: pResult.bgColor }]}>
                <Text style={[sv.badgeTxt, { color: pResult.color }]}>{pResult.percentile}th %ile</Text>
              </View>
              <Text style={[sv.zone, { color: pResult.color }]}>
                {pResult.label === 'Normal'      ? t('growth.zone_normal') :
                 pResult.label === 'Watch'       ? t('growth.zone_watch')  : t('growth.zone_consult')}
              </Text>
              {latest?.measuredAt && (
                <Text style={sv.lastDate}>
                  {t('growth.last_measured')} {new Date(latest.measuredAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={sv.empty} onPress={() => { setEditRec(undefined); setModal(true); }} activeOpacity={0.8}>
            <View style={{ marginBottom: 10 }}><Ruler size={38} strokeWidth={1.5} color={Colors.textMid} /></View>
            <Text style={sv.emptyTitle}>{t('growth.no_data')}</Text>
            <Text style={sv.emptySub}>{t('growth.no_data_sub')}</Text>
            <LinearGradient colors={[Colors.primaryPink, '#F472B6']} style={sv.emptyCta}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={sv.emptyCtaTxt}>{t('growth.add_first_cta')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* WHO Growth Chart card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {tab === 'weight' ? t('growth.chart_weight_title') :
             tab === 'height' ? t('growth.chart_height_title') : t('growth.chart_head_title')}
          </Text>
          <Text style={s.cardSub}>{t('growth.tap_dot_hint')} · {t('growth.who_source')}</Text>

          <WHOGrowthChart
            records={records} ageMonths={corrected} sex={sex} metric={tab}
            onDotPress={setDotInfo} activeDotId={dotInfo?.record.id ?? null}
          />

          {dotInfo && <DotPopup dot={dotInfo} metric={tab} onClose={() => setDotInfo(null)} />}
        </View>

        {/* Percentile zone legend */}
        <View style={pl.card}>
          <Text style={pl.title}>{t('growth.percentile_explain_title')}</Text>
          <View style={pl.row}>
            {[
              { range: '< 5th',   c: Colors.primaryPink, bg: Colors.softPink },
              { range: '5–15th',  c: Colors.gold, bg: Colors.softGold },
              { range: '15–85th', c: Colors.mint, bg: Colors.softMint },
              { range: '85–97th', c: Colors.gold, bg: Colors.softGold },
              { range: '> 97th',  c: Colors.primaryPink, bg: Colors.softPink },
            ].map(({ range, c, bg }) => (
              <View key={range} style={[pl.band, { backgroundColor: bg }]}>
                <Text style={[pl.bandTxt, { color: c }]}>{range}</Text>
              </View>
            ))}
          </View>
          <Text style={pl.body}>{t('growth.percentile_explain_body')}</Text>
        </View>

        {/* AI Analysis */}
        <AIGrowthSection records={records} childName={name} ageMonths={corrected} sex={sex} />

        {/* History */}
        <HistoryTable records={records} metric={tab} onEdit={(r) => { setEditRec(r); setModal(true); }} />

        {/* Export / Share Report */}
        <TouchableOpacity
          style={ex.btn} activeOpacity={0.8}
          onPress={async () => {
            const dateStr = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
            const sep = '─'.repeat(36);
            const lines: string[] = [
              `BabyBloom PH — Growth Report`,
              sep,
              `Baby   : ${name}`,
              `Age    : ${ageM} months`,
              `Gender : ${sex === 'female' ? 'Girl' : 'Boy'}`,
              `Date   : ${dateStr}`,
              ``,
              `LATEST MEASUREMENTS`,
              sep,
            ];

            const addMetric = (label: string, val: number | undefined, unit: string, metric: GrowthMetric, dec: number) => {
              if (!val) return;
              const r = getWHOPercentile(sex, metric, corrected, val);
              const zone = r.percentile >= 15 && r.percentile <= 85 ? '[OK] Normal'
                         : r.percentile >= 5  && r.percentile <= 97 ? '[!] Monitor'
                         : '[!!] See Pedia';
              lines.push(`${label.padEnd(16)}: ${val.toFixed(dec)} ${unit}`);
              lines.push(`${'Percentile'.padEnd(16)}: ${Math.round(r.percentile)}th  ${zone}`);
              lines.push(``);
            };
            addMetric('Weight',     latest?.weightKg,           'kg', 'weight', 2);
            addMetric('Height',     latest?.heightCm,           'cm', 'height', 1);
            addMetric('Head Circ.', latest?.headCircumferenceCm,'cm', 'head',   1);

            if (latest?.measuredAt) {
              lines.push(`Measured   : ${new Date(latest.measuredAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`);
            }
            lines.push(`Total logs : ${records.length} measurement${records.length !== 1 ? 's' : ''}`);

            if (records.length > 1) {
              lines.push(``, `GROWTH HISTORY (last ${Math.min(records.length, 5)})`);
              lines.push(sep);
              [...records].reverse().slice(0, 5).forEach((r) => {
                const d = new Date(r.measuredAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                const parts = [];
                if (r.weightKg)            parts.push(`${r.weightKg}kg`);
                if (r.heightCm)            parts.push(`${r.heightCm}cm`);
                if (r.headCircumferenceCm) parts.push(`HC ${r.headCircumferenceCm}cm`);
                lines.push(`${d}  |  ${parts.join('  ·  ')}`);
              });
            }

            lines.push(``, `PERCENTILE GUIDE`);
            lines.push(sep);
            lines.push(`[OK] p15–p85  Healthy range`);
            lines.push(`[!] p5–p15 or p85–p97  Monitor`);
            lines.push(`[!!] <p5 or >p97  Consult Pediatrician`);
            lines.push(``, sep);
            lines.push(`Generated by BabyBloom PH`);
            lines.push(`WHO Multicentre Growth Reference Study standards`);
            lines.push(`This is general information.`);
            lines.push(`   Please consult your Pedia for medical concerns.`);

            const reportText = lines.join('\n');
            const title      = `${name}'s Growth Report — BabyBloom PH`;

            if (Platform.OS === 'web') {
              const nav = navigator as any;
              if (nav.share) {
                try { await nav.share({ title, text: reportText }); return; } catch {}
              }
              if (nav.clipboard?.writeText) {
                try {
                  await nav.clipboard.writeText(reportText);
                  Alert.alert('Copied!', 'Growth report copied to clipboard.\nPaste it into WhatsApp, Messenger, or email to share with your Pedia!');
                } catch {
                  // Clipboard blocked (document not focused) — show inline
                  Alert.alert(title, reportText, [{ text: 'OK' }]);
                }
              } else {
                Alert.alert(title, reportText, [{ text: 'OK' }]);
              }
            } else {
              try {
                await Share.share({ title, message: reportText });
              } catch {
                Alert.alert(title, reportText, [{ text: 'OK' }]);
              }
            }
          }}
        >
          <Text style={ex.txt}>{t('growth.export_pdf')} <Share2 size={16} strokeWidth={1.5} color={Colors.primaryPink} /></Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <MeasurementModal visible={modal} onClose={() => setModal(false)}
        childId={activeChild.id} editRecord={editRec} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: Colors.background },
  hdr:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 52, paddingBottom: 14 },
  backW:      { color: Colors.white, fontWeight: '700', fontSize: 14 },
  hdrTitleW:  { fontSize: 17, fontWeight: '800', color: Colors.white },
  addBtn:     { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  addTxt:     { color: Colors.white, fontWeight: '800', fontSize: 13 },
  scroll:     { flex: 1 },
  content:    { paddingTop: 4, paddingBottom: 40 },
  childRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAD, paddingVertical: 10 },
  childName:  { fontSize: 18, fontWeight: '800', color: Colors.dark },
  childAge:   { fontSize: 13, color: Colors.midGray, fontWeight: '600' },
  pretrmBadge:{ backgroundColor: Colors.softGold, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pretrmTxt:  { fontSize: 10, color: Colors.gold, fontWeight: '700' },
  card:       { backgroundColor: Colors.white, borderRadius: 20, padding: PAD, marginHorizontal: PAD, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: Colors.border },
  cardTitle:  { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  cardSub:    { fontSize: 10, color: Colors.lightGray, marginBottom: 12 },
});

const tb2 = StyleSheet.create({
  bar:       { flexDirection: 'row', marginHorizontal: PAD, marginBottom: 12, backgroundColor: Colors.border, borderRadius: 14, padding: 3 },
  tab:       { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  active:    { backgroundColor: Colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  txt:       { fontSize: 13, fontWeight: '700', color: Colors.lightGray },
  activeTxt: { color: Colors.primaryPink },
});

const sv = StyleSheet.create({
  card:       { borderRadius: 20, padding: 16, marginHorizontal: PAD, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  metaLbl:    { fontSize: 10, color: Colors.midGray, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  big:        { fontSize: 36, fontWeight: '900' },
  unit:       { fontSize: 16, fontWeight: '700' },
  change:     { fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge:      { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:   { fontSize: 14, fontWeight: '800' },
  zone:       { fontSize: 12, fontWeight: '700' },
  lastDate:   { fontSize: 10, color: Colors.lightGray },
  empty:      { backgroundColor: Colors.white, borderRadius: 20, padding: 24, marginHorizontal: PAD, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: Colors.dark, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: Colors.midGray, textAlign: 'center', marginBottom: 16, lineHeight: 19 },
  emptyCta:   { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  emptyCtaTxt:{ color: Colors.white, fontWeight: '800', fontSize: 14 },
});

const ch = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6 },
  item:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:    { width: 10, height: 10, borderRadius: 5 },
  lbl:    { fontSize: 10, color: Colors.midGray, fontWeight: '600' },
});

const dp = StyleSheet.create({
  card:     { position: 'absolute', bottom: 56, backgroundColor: Colors.white, borderRadius: 14, padding: 12, width: 148, borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, elevation: 6, zIndex: 10 },
  closeBtn: { position: 'absolute', top: 6, right: 8 },
  closeX:   { color: Colors.lightGray, fontSize: 12, fontWeight: '700' },
  value:    { fontSize: 22, fontWeight: '900', marginTop: 8, marginBottom: 4 },
  badge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  date:     { fontSize: 11, color: Colors.midGray },
});

const pl = StyleSheet.create({
  card:    { backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginHorizontal: PAD, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  title:   { fontSize: 13, fontWeight: '800', color: Colors.dark, marginBottom: 10 },
  row:     { flexDirection: 'row', gap: 4, marginBottom: 10 },
  band:    { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  bandTxt: { fontSize: 9, fontWeight: '800', textAlign: 'center' },
  body:    { fontSize: 12, color: Colors.midGray, lineHeight: 18 },
});

const aig = StyleSheet.create({
  // wrapper card
  wrapper:       { backgroundColor: Colors.white, borderRadius: 20, marginHorizontal: PAD, marginBottom: 12, overflow: 'hidden', shadowColor: '#7C3AED', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#EDE9FE' },
  // demo badge
  demoBadge:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F3FF', borderRadius: 12, margin: 12, marginBottom: 0, padding: 10, borderWidth: 1, borderColor: '#DDD6FE' },
  demoIcon:      { fontSize: 22 },
  demoTitle:     { fontSize: 12, fontWeight: '800', color: '#7C3AED', letterSpacing: 0.5 },
  demoSub:       { fontSize: 11, color: Colors.textMid, marginTop: 1 },
  // collapsible header
  hdrRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  hdrLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  hdrGrad:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hdrTitle:      { fontSize: 14, fontWeight: '800', color: '#4C1D95' },
  hdrSub:        { fontSize: 10, color: '#7C3AED', fontWeight: '600', marginTop: 1 },
  chevron:       { fontSize: 12, color: '#7C3AED', fontWeight: '800' },
  // body
  body:          { paddingHorizontal: 16, paddingBottom: 20 },
  // loading
  loadRow:       { paddingVertical: 16, alignItems: 'center' },
  loadTxt:       { fontSize: 13, color: '#7C3AED', fontStyle: 'italic' },
  // section 1 — overall summary banner
  overallBanner: { borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 16 },
  overallIcon:   { fontSize: 28 },
  overallLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  overallText:   { fontSize: 13, color: Colors.dark, lineHeight: 20 },
  // section header
  sectionHdr:    { fontSize: 10, fontWeight: '800', color: Colors.midGray, letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  // metric cards
  metricCard:    { backgroundColor: Colors.background, borderRadius: 14, padding: 14, marginBottom: 10 },
  metricTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metricEmoji:   { fontSize: 18 },
  metricLabel:   { fontSize: 13, fontWeight: '800', color: Colors.dark, flex: 1 },
  statusBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusTxt:     { fontSize: 11, fontWeight: '800' },
  metricVal:     { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  pctNote:       { fontSize: 12, color: Colors.midGray, lineHeight: 18, marginTop: 2, marginBottom: 6 },
  metricExpl:    { fontSize: 12, color: Colors.dark, lineHeight: 19, marginTop: 6, fontStyle: 'italic' },
  // section 3 — insights
  insightCard:   { backgroundColor: Colors.softBlue, borderRadius: 14, padding: 14, marginBottom: 10 },
  insightTxt:    { fontSize: 13, color: Colors.dark, lineHeight: 20 },
  // section 4 — guidance
  guidanceCard:  { backgroundColor: Colors.softMint, borderRadius: 14, padding: 14, marginBottom: 10 },
  tipRow:        { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  tipNum:        { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.mint, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  tipNumTxt:     { fontSize: 11, fontWeight: '900', color: Colors.white },
  tipTxt:        { fontSize: 13, color: Colors.dark, lineHeight: 19, flex: 1 },
  // disclaimer
  disclaimer:    { backgroundColor: Colors.divider, borderRadius: 12, padding: 12, marginTop: 4 },
  disclaimerTxt: { fontSize: 11, color: Colors.midGray, lineHeight: 17, fontStyle: 'italic' },
  // fallback
  rawWrap:       { padding: 4 },
  rawTxt:        { fontSize: 13, color: Colors.dark, lineHeight: 20 },
  emptyTxt:      { fontSize: 12, color: Colors.lightGray, fontStyle: 'italic', paddingVertical: 8, textAlign: 'center' },
});

const ht = StyleSheet.create({
  wrap:   { backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginHorizontal: PAD, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  title:  { fontSize: 12, fontWeight: '800', color: Colors.dark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:  { fontSize: 13, color: Colors.lightGray, textAlign: 'center', paddingVertical: 8 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  border: { borderTopWidth: 1, borderTopColor: Colors.border },
  date:   { fontSize: 13, fontWeight: '700', color: Colors.dark },
  notes:  { fontSize: 11, color: Colors.lightGray, marginTop: 2 },
  right:  { alignItems: 'flex-end' },
  val:    { fontSize: 14, fontWeight: '800', color: Colors.dark },
  diff:   { fontSize: 11, fontWeight: '700', marginTop: 2 },
});

const ex = StyleSheet.create({
  btn: { marginHorizontal: PAD, borderRadius: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.softBlue, marginBottom: 12, borderWidth: 1, borderColor: Colors.blue + '40' },
  txt: { fontSize: 14, fontWeight: '800', color: Colors.blue },
});

const mm = StyleSheet.create({
  wrap:     { flex: 1, backgroundColor: Colors.white },
  hdr:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 13, color: Colors.midGray, fontWeight: '700' },
  delBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.softPink, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 16, fontWeight: '800', color: Colors.dark },
  body:     { padding: 20 },
  label:    { fontSize: 13, fontWeight: '700', color: Colors.midGray, marginBottom: 6, marginTop: 14 },
  input:    { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.dark },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unit:     { fontSize: 14, fontWeight: '700', color: Colors.midGray, width: 26 },
  tip:      { backgroundColor: Colors.softBlue, borderRadius: 12, padding: 12, marginTop: 16 },
  tipTxt:   { fontSize: 12, color: Colors.blue, lineHeight: 18 },
  saveWrap: { marginHorizontal: 20, marginBottom: 32, marginTop: 12 },
  saveBtn:  { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveTxt:  { color: Colors.white, fontSize: 16, fontWeight: '800' },
});
