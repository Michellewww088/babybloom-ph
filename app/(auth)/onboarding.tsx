import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import i18n from '../../src/i18n';
import { supabase } from '../../src/lib/supabase';
import Colors from '../../constants/Colors';

// ── Types ────────────────────────────────────────────────────────────────
type Status    = 'pregnant' | 'parenting' | null;
type BirthType = 'vaginal'  | 'cesarean'  | null;
type BabyCount = 'single'   | 'twins'     | 'triplets' | null;
type LangCode  = 'en'       | 'fil'       | 'zh';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { t } = useTranslation();

  const [step,      setStep]      = useState(1);
  const [saving,    setSaving]    = useState(false);

  // Step data
  const [status,    setStatus]    = useState<Status>(null);
  const [birthType, setBirthType] = useState<BirthType>(null);
  const [babyCount, setBabyCount] = useState<BabyCount>(null);
  const [dateValue, setDateValue] = useState('');       // ISO date string
  const [language,  setLanguage]  = useState<LangCode>('en');

  // ── Navigation ───────────────────────────────────────────────────────
  function canAdvance() {
    if (step === 1) return !!status;
    if (step === 2) return status === 'pregnant' || !!birthType;
    if (step === 3) return !!babyCount;
    if (step === 4) return !!dateValue;
    return true;
  }

  function goNext() {
    // Skip step 2 (birth type) if pregnant
    if (step === 1 && status === 'pregnant') { setStep(3); return; }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  }

  function goBack() {
    if (step === 3 && status === 'pregnant') { setStep(1); return; }
    if (step > 1) setStep(s => s - 1);
  }

  function skipAll() {
    handleFinish(true);
  }

  // ── Save & navigate ───────────────────────────────────────────────────
  async function handleFinish(skipped = false) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          language,
          onboarding_completed: true,
        });
      }
    } catch (err: any) {
      // Non-blocking — proceed even if save fails
      console.warn('Onboarding save failed:', err.message);
    } finally {
      setSaving(false);
    }
    // Skip → go straight to Dashboard (ChildSwitcher lets them add baby later)
    // Finish → go to Create Child Profile (required first-run step)
    router.replace(skipped ? '/(tabs)' : '/child-profile');
  }

  // ── Effective step count for progress dots ────────────────────────────
  // If pregnant, step 2 (birth type) is skipped, so show 4 dots
  const visibleSteps = status === 'pregnant' ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const currentDot   = status === 'pregnant' && step >= 3 ? step - 1 : step;

  return (
    <LinearGradient colors={[Colors.primaryPink, Colors.gold]} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Header row */}
        <View style={s.headerRow}>
          {step > 1 ? (
            <TouchableOpacity onPress={goBack} style={s.backBtn}>
              <Text style={s.backText}>← {t('onboarding.back')}</Text>
            </TouchableOpacity>
          ) : <View style={s.backBtn} />}

          <TouchableOpacity onPress={skipAll} style={s.skipBtn}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={s.dotsRow}>
          {Array.from({ length: visibleSteps }).map((_, i) => (
            <View
              key={i}
              style={[s.dot, i + 1 <= currentDot ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>

        {/* Step card */}
        <View style={s.card}>

          {/* ── STEP 1: Status ──────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Text style={s.stepLabel}>Step 1 of {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step1_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard
                  emoji="🤰"
                  label={t('onboarding.pregnant')}
                  selected={status === 'pregnant'}
                  onPress={() => setStatus('pregnant')}
                />
                <OptionCard
                  emoji="👶"
                  label={t('onboarding.parent')}
                  selected={status === 'parenting'}
                  onPress={() => setStatus('parenting')}
                />
              </View>
            </>
          )}

          {/* ── STEP 2: Birth Type (only if parenting) ─────────────── */}
          {step === 2 && status === 'parenting' && (
            <>
              <Text style={s.stepLabel}>Step 2 of {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step2_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard
                  emoji="🌸"
                  label={t('onboarding.vaginal')}
                  sublabel="Normal / Vaginal"
                  selected={birthType === 'vaginal'}
                  onPress={() => setBirthType('vaginal')}
                />
                <OptionCard
                  emoji="🏥"
                  label={t('onboarding.csection')}
                  sublabel="C-Section / CS"
                  selected={birthType === 'cesarean'}
                  onPress={() => setBirthType('cesarean')}
                />
              </View>
            </>
          )}

          {/* ── STEP 3: Single or Multiple ─────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={s.stepLabel}>
                Step {status === 'pregnant' ? 2 : 3} of {visibleSteps}
              </Text>
              <Text style={s.question}>{t('onboarding.step3_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard emoji="👶"     label={t('onboarding.single')}   selected={babyCount === 'single'}   onPress={() => setBabyCount('single')}   />
                <OptionCard emoji="👶👶"   label={t('onboarding.twins')}    selected={babyCount === 'twins'}    onPress={() => setBabyCount('twins')}    />
                <OptionCard emoji="👶👶👶" label={t('onboarding.triplets')} selected={babyCount === 'triplets'} onPress={() => setBabyCount('triplets')} wide />
              </View>
            </>
          )}

          {/* ── STEP 4: Date of Birth / EDD ────────────────────────── */}
          {step === 4 && (
            <>
              <Text style={s.stepLabel}>
                Step {status === 'pregnant' ? 3 : 4} of {visibleSteps}
              </Text>
              <Text style={s.question}>
                {status === 'pregnant'
                  ? 'When is your due date?'
                  : t('onboarding.step4_title')}
              </Text>
              <Text style={s.dateHint}>Format: YYYY-MM-DD</Text>

              {/* Native date picker workaround for RN */}
              <DateSelector
                value={dateValue}
                onChange={setDateValue}
                isPregnant={status === 'pregnant'}
              />
            </>
          )}

          {/* ── STEP 5: Language Preference ────────────────────────── */}
          {step === 5 && (
            <>
              <Text style={s.stepLabel}>Step {visibleSteps} of {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step5_title')}</Text>
              <View style={s.langOptions}>
                {([
                  { code: 'en',  emoji: '🇺🇸', label: 'English'  },
                  { code: 'fil', emoji: '🇵🇭', label: 'Filipino' },
                  { code: 'zh',  emoji: '🇨🇳', label: '中文'     },
                ] as { code: LangCode; emoji: string; label: string }[]).map(({ code, emoji, label }) => (
                  <TouchableOpacity
                    key={code}
                    style={[s.langCard, language === code && s.langCardActive]}
                    onPress={() => {
                      setLanguage(code);
                      i18n.changeLanguage(code);
                    }}
                  >
                    <Text style={s.langEmoji}>{emoji}</Text>
                    <Text style={[s.langLabel, language === code && s.langLabelActive]}>
                      {label}
                    </Text>
                    {language === code && <Text style={s.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Next / Finish button */}
          <TouchableOpacity
            style={[s.nextBtn, (!canAdvance() || saving) && s.nextBtnDisabled]}
            onPress={goNext}
            disabled={!canAdvance() || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.nextBtnText}>
                  {step === TOTAL_STEPS
                    ? `🎉 ${t('onboarding.finish')}`
                    : `${t('onboarding.next')} →`}
                </Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Option Card Component ────────────────────────────────────────────────
function OptionCard({
  emoji, label, sublabel, selected, onPress, wide,
}: {
  emoji: string; label: string; sublabel?: string;
  selected: boolean; onPress: () => void; wide?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.optCard, selected && s.optCardSelected, wide && s.optCardWide]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <Text style={s.optCheck}>✓</Text>}
      <Text style={s.optEmoji}>{emoji}</Text>
      <Text style={[s.optLabel, selected && s.optLabelSelected]}>{label}</Text>
      {sublabel && <Text style={s.optSublabel}>{sublabel}</Text>}
    </TouchableOpacity>
  );
}

// ── Date Selector Component ──────────────────────────────────────────────
function DateSelector({
  value, onChange, isPregnant,
}: {
  value: string; onChange: (v: string) => void; isPregnant: boolean;
}) {
  const today = new Date();
  const [year,  setYear]  = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [day,   setDay]   = useState(String(today.getDate()).padStart(2, '0'));

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function update(y: string, m: string, d: string) {
    const iso = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    onChange(iso);
    setYear(y); setMonth(m); setDay(d);
  }

  return (
    <View>
      <View style={ds.row}>
        {/* Month */}
        <View style={ds.col}>
          <Text style={ds.colLabel}>Month</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {MONTHS.map((m, i) => {
              const val = String(i + 1).padStart(2, '0');
              return (
                <TouchableOpacity
                  key={m}
                  style={[ds.item, month === val && ds.itemSelected]}
                  onPress={() => update(year, val, day)}
                >
                  <Text style={[ds.itemText, month === val && ds.itemTextSelected]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Day */}
        <View style={ds.col}>
          <Text style={ds.colLabel}>Day</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
              <TouchableOpacity
                key={d}
                style={[ds.item, day === d && ds.itemSelected]}
                onPress={() => update(year, month, d)}
              >
                <Text style={[ds.itemText, day === d && ds.itemTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Year */}
        <View style={ds.col}>
          <Text style={ds.colLabel}>Year</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {Array.from({ length: isPregnant ? 2 : 6 }, (_, i) => {
              const y = isPregnant
                ? String(today.getFullYear() + i)
                : String(today.getFullYear() - i);
              return (
                <TouchableOpacity
                  key={y}
                  style={[ds.item, year === y && ds.itemSelected]}
                  onPress={() => update(y, month, day)}
                >
                  <Text style={[ds.itemText, year === y && ds.itemTextSelected]}>{y}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {value ? (
        <Text style={ds.selected}>
          Selected: {new Date(value + 'T12:00:00').toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </Text>
      ) : null}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient:     { flex: 1 },
  scrollContent:{ padding: 24, paddingTop: 56, paddingBottom: 60 },

  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn:      { minWidth: 60 },
  backText:     { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  skipBtn:      {},
  skipText:     { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  dotsRow:      { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:          { width: 10, height: 10, borderRadius: 5 },
  dotActive:    { backgroundColor: '#fff' },
  dotInactive:  { backgroundColor: 'rgba(255,255,255,0.35)' },

  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },

  stepLabel:    { fontSize: 12, fontWeight: '700', color: Colors.lightGray, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  question:     { fontSize: 20, fontWeight: '800', color: Colors.dark, marginBottom: 20, lineHeight: 26 },
  dateHint:     { fontSize: 12, color: Colors.lightGray, marginBottom: 12 },

  optionGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  optCard:      { flex: 1, minWidth: '44%', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background, position: 'relative' },
  optCardSelected:{ borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  optCardWide:  { minWidth: '100%' },
  optCheck:     { position: 'absolute', top: 10, right: 12, fontSize: 14, color: Colors.primaryPink, fontWeight: '800' },
  optEmoji:     { fontSize: 36, marginBottom: 8 },
  optLabel:     { fontSize: 14, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  optLabelSelected: { color: Colors.primaryPink },
  optSublabel:  { fontSize: 11, color: Colors.lightGray, marginTop: 2, textAlign: 'center' },

  langOptions:  { gap: 12, marginBottom: 20 },
  langCard:     { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background },
  langCardActive:{ borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  langEmoji:    { fontSize: 28, marginRight: 14 },
  langLabel:    { fontSize: 16, fontWeight: '700', color: Colors.dark, flex: 1 },
  langLabelActive: { color: Colors.primaryPink },
  checkmark:    { fontSize: 18, color: Colors.primaryPink, fontWeight: '800' },

  nextBtn:      { backgroundColor: Colors.primaryPink, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const ds = StyleSheet.create({
  row:           { flexDirection: 'row', gap: 8, marginBottom: 12 },
  col:           { flex: 1 },
  colLabel:      { fontSize: 12, fontWeight: '700', color: Colors.lightGray, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase' },
  scroll:        { height: 160, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12 },
  item:          { paddingVertical: 10, alignItems: 'center' },
  itemSelected:  { backgroundColor: Colors.softPink },
  itemText:      { fontSize: 14, color: Colors.midGray },
  itemTextSelected: { color: Colors.primaryPink, fontWeight: '700' },
  selected:      { fontSize: 13, color: Colors.primaryPink, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
