import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import i18n from '../../src/i18n';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import { supabase } from '../../src/lib/supabase';
import Colors from '../../constants/Colors';
import { useOnboardingStore } from '../../store/onboardingStore';

// ── Types ────────────────────────────────────────────────────────────────
type Status    = 'pregnant' | 'parenting' | null;
type BirthType = 'vaginal'  | 'cesarean'  | null;
type BabyCount = 'single'   | 'twins'     | 'triplets' | null;
type LangCode  = 'en'       | 'fil'       | 'zh';

const TOTAL_STEPS = 5;

// ── Kawaii SVG Icons ─────────────────────────────────────────────────────

function IconPregnant() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Head */}
      <Circle cx="32" cy="16" r="12" fill="#F5C994" />
      {/* Hair */}
      <Path d="M 20 14 Q 22 4 32 4 Q 42 4 44 14" fill="#C8855A" />
      {/* Body/Belly */}
      <Ellipse cx="32" cy="44" rx="18" ry="16" fill="#FFD6E4" />
      {/* Heart on belly */}
      <Path d="M32 42 C32 39 28 39 28 43 C28 46 32 49 32 49 C32 49 36 46 36 43 C36 39 32 39 32 42Z"
        fill="#E8637C" />
      {/* Arms */}
      <Ellipse cx="14" cy="42" rx="5" ry="9" fill="#F5C994" transform="rotate(-15 14 42)" />
      <Ellipse cx="50" cy="42" rx="5" ry="9" fill="#F5C994" transform="rotate(15 50 42)" />
      {/* Cute face */}
      <Circle cx="28" cy="15" r="2" fill="#2C1A0E" />
      <Circle cx="36" cy="15" r="2" fill="#2C1A0E" />
      <Circle cx="29" cy="14" r="0.8" fill="white" />
      <Circle cx="37" cy="14" r="0.8" fill="white" />
      <Path d="M 29 19 Q 32 22 35 19" stroke="#D47A8F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <Ellipse cx="23" cy="18" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.55" />
      <Ellipse cx="41" cy="18" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.55" />
    </Svg>
  );
}

function IconParent() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Baby body */}
      <Ellipse cx="32" cy="46" rx="14" ry="12" fill="#FFE0B2" />
      {/* Baby head */}
      <Circle cx="32" cy="26" r="16" fill="#FFE0B2" />
      {/* Baby ears */}
      <Circle cx="16" cy="26" r="6" fill="#FFD0A0" />
      <Circle cx="48" cy="26" r="6" fill="#FFD0A0" />
      {/* Eyes */}
      <Circle cx="26" cy="24" r="3" fill="#2C1A0E" />
      <Circle cx="38" cy="24" r="3" fill="#2C1A0E" />
      <Circle cx="27" cy="23" r="1.2" fill="white" />
      <Circle cx="39" cy="23" r="1.2" fill="white" />
      {/* Rosy cheeks */}
      <Ellipse cx="20" cy="30" rx="5" ry="3" fill="#F4A8C0" opacity="0.6" />
      <Ellipse cx="44" cy="30" rx="5" ry="3" fill="#F4A8C0" opacity="0.6" />
      {/* Smile */}
      <Path d="M 25 33 Q 32 38 39 33" stroke="#D47A8F" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Baby cap */}
      <Path d="M 16 20 Q 32 8 48 20" fill="#FFB3C6" />
      <Circle cx="32" cy="10" r="4" fill="#E8637C" />
    </Svg>
  );
}

function IconNatural() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Petals */}
      <Ellipse cx="32" cy="14" rx="7" ry="12" fill="#FFB3C6" />
      <Ellipse cx="50" cy="23" rx="7" ry="12" fill="#FFB3C6" transform="rotate(60 50 23)" />
      <Ellipse cx="46" cy="46" rx="7" ry="12" fill="#FFB3C6" transform="rotate(120 46 46)" />
      <Ellipse cx="32" cy="52" rx="7" ry="12" fill="#F4A8C0" transform="rotate(180 32 52)" />
      <Ellipse cx="18" cy="46" rx="7" ry="12" fill="#F4A8C0" transform="rotate(240 18 46)" />
      <Ellipse cx="14" cy="23" rx="7" ry="12" fill="#FFB3C6" transform="rotate(300 14 23)" />
      {/* Center */}
      <Circle cx="32" cy="32" r="11" fill="#FFE066" />
      <Circle cx="29" cy="30" r="1.5" fill="#C8A000" />
      <Circle cx="35" cy="30" r="1.5" fill="#C8A000" />
      <Path d="M 28 34 Q 32 37 36 34" stroke="#C8A000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconCSection() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Soft circle bg */}
      <Circle cx="32" cy="32" r="28" fill="#E0F7EF" />
      {/* Medical cross */}
      <Rect x="26" y="14" width="12" height="36" rx="5" fill="#27AE7A" />
      <Rect x="14" y="26" width="36" height="12" rx="5" fill="#27AE7A" />
      {/* Heart overlay */}
      <Path d="M32 38 C32 35 28.5 35 28.5 38 C28.5 40.5 32 43 32 43 C32 43 35.5 40.5 35.5 38 C35.5 35 32 35 32 38Z"
        fill="white" opacity="0.9" />
    </Svg>
  );
}

function IconSingle() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Big star */}
      <Path d="M32 8 L36 24 L52 24 L40 34 L44 50 L32 40 L20 50 L24 34 L12 24 L28 24 Z"
        fill="#FFE066" />
      {/* Star shine */}
      <Circle cx="32" cy="30" r="6" fill="white" opacity="0.3" />
      {/* Face on star */}
      <Circle cx="28" cy="28" r="2" fill="#C8A000" />
      <Circle cx="36" cy="28" r="2" fill="#C8A000" />
      <Path d="M 27 33 Q 32 37 37 33" stroke="#C8A000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconTwins() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Left star */}
      <Path d="M18 6 L21 16 L32 16 L23 22 L26 32 L18 26 L10 32 L13 22 L4 16 L15 16 Z"
        fill="#FFB3C6" />
      <Circle cx="16" cy="20" r="3.5" fill="white" opacity="0.25" />
      <Circle cx="14" cy="19" r="1.2" fill="#D47A8F" />
      <Circle cx="19" cy="19" r="1.2" fill="#D47A8F" />
      <Path d="M 13 22 Q 16 24.5 19 22" stroke="#D47A8F" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Right star */}
      <Path d="M46 6 L49 16 L60 16 L51 22 L54 32 L46 26 L38 32 L41 22 L32 16 L43 16 Z"
        fill="#C8A8F0" />
      <Circle cx="44" cy="20" r="3.5" fill="white" opacity="0.25" />
      <Circle cx="42" cy="19" r="1.2" fill="#9B59B6" />
      <Circle cx="47" cy="19" r="1.2" fill="#9B59B6" />
      <Path d="M 41 22 Q 44 24.5 47 22" stroke="#9B59B6" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Hearts between */}
      <Path d="M32 36 C32 34 30 34 30 36 C30 38 32 39.5 32 39.5 C32 39.5 34 38 34 36 C34 34 32 34 32 36Z"
        fill="#E8637C" />
    </Svg>
  );
}

function IconTriplets() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Left star */}
      <Path d="M12 10 L14.5 18 L23 18 L16.5 23 L19 31 L12 26 L5 31 L7.5 23 L1 18 L9.5 18 Z"
        fill="#FFB3C6" />
      <Circle cx="10.5" cy="21" r="1" fill="#D47A8F" />
      <Circle cx="14" cy="21" r="1" fill="#D47A8F" />
      <Path d="M 10 24 Q 12 26 14.5 24" stroke="#D47A8F" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Middle star */}
      <Path d="M32 6 L35 17 L46 17 L37.5 24 L40.5 35 L32 28 L23.5 35 L26.5 24 L18 17 L29 17 Z"
        fill="#FFE066" />
      <Circle cx="29" cy="22" r="1.5" fill="#C8A000" />
      <Circle cx="35" cy="22" r="1.5" fill="#C8A000" />
      <Path d="M 28 26 Q 32 29 36 26" stroke="#C8A000" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Right star */}
      <Path d="M52 10 L54.5 18 L63 18 L56.5 23 L59 31 L52 26 L45 31 L47.5 23 L41 18 L49.5 18 Z"
        fill="#A8E6CF" />
      <Circle cx="50.5" cy="21" r="1" fill="#27AE7A" />
      <Circle cx="54" cy="21" r="1" fill="#27AE7A" />
      <Path d="M 50 24 Q 52 26 54.5 24" stroke="#27AE7A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Hearts */}
      <Path d="M22 46 C22 44.2 19.5 44.2 19.5 46 C19.5 47.8 22 49.5 22 49.5 C22 49.5 24.5 47.8 24.5 46 C24.5 44.2 22 44.2 22 46Z" fill="#E8637C" />
      <Path d="M32 48 C32 46.2 29.5 46.2 29.5 48 C29.5 49.8 32 51.5 32 51.5 C32 51.5 34.5 49.8 34.5 48 C34.5 46.2 32 46.2 32 48Z" fill="#E8637C" />
      <Path d="M42 46 C42 44.2 39.5 44.2 39.5 46 C39.5 47.8 42 49.5 42 49.5 C42 49.5 44.5 47.8 44.5 46 C44.5 44.2 42 44.2 42 46Z" fill="#E8637C" />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { setData: saveOnboardingData } = useOnboardingStore();

  const [step,      setStep]      = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [status,    setStatus]    = useState<Status>(null);
  const [birthType, setBirthType] = useState<BirthType>(null);
  const [babyCount, setBabyCount] = useState<BabyCount>(null);
  const [dateValue, setDateValue] = useState('');
  const [language,  setLanguage]  = useState<LangCode>('en');

  function canAdvance() {
    if (step === 1) return !!status;
    if (step === 2) return status === 'pregnant' || !!birthType;
    if (step === 3) return !!babyCount;
    if (step === 4) return !!dateValue;
    return true;
  }

  function goNext() {
    if (step === 1 && status === 'pregnant') { setStep(3); return; }
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  }

  function goBack() {
    if (step === 3 && status === 'pregnant') { setStep(1); return; }
    if (step > 1) setStep(s => s - 1);
  }

  function skipAll() { handleFinish(true); }

  async function handleFinish(skipped = false) {
    if (!skipped) {
      saveOnboardingData({ status, birthType, babyCount, date: dateValue, language });
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: user.id, language, onboarding_completed: true,
        });
      }
    } catch (err: any) {
      console.warn('Onboarding save failed:', err.message);
    } finally {
      setSaving(false);
    }
    router.replace(skipped ? '/(tabs)' : '/child-profile');
  }

  const visibleSteps = status === 'pregnant' ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const currentDot   = status === 'pregnant' && step >= 3 ? step - 1 : step;

  return (
    // ── Soft pink pastel gradient matching app theme ──────────────────────
    <LinearGradient colors={['#FFE4EE', '#FFCFDA', '#FFB3C6']} style={s.gradient}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Language toggle */}
        <View style={s.langRow}>
          {SUPPORTED_LANGUAGES.map(({ code, nativeLabel }) => (
            <TouchableOpacity
              key={code}
              onPress={() => i18n.changeLanguage(code as LanguageCode)}
              style={[s.langBtn, i18n.language === code && s.langBtnActive]}
            >
              <Text style={[s.langText, i18n.language === code && s.langTextActive]}>
                {nativeLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Header */}
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
            <View key={i} style={[s.dot, i + 1 <= currentDot ? s.dotActive : s.dotInactive]} />
          ))}
        </View>

        {/* Step card */}
        <View style={s.card}>

          {/* ── STEP 1: Status ────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Text style={s.stepLabel}>STEP 1 OF {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step1_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard
                  icon={<IconPregnant />}
                  label={t('onboarding.pregnant')}
                  selected={status === 'pregnant'}
                  onPress={() => setStatus('pregnant')}
                />
                <OptionCard
                  icon={<IconParent />}
                  label={t('onboarding.parent')}
                  selected={status === 'parenting'}
                  onPress={() => setStatus('parenting')}
                />
              </View>
            </>
          )}

          {/* ── STEP 2: Birth Type ─────────────────────────────────────── */}
          {step === 2 && status === 'parenting' && (
            <>
              <Text style={s.stepLabel}>STEP 2 OF {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step2_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard
                  icon={<IconNatural />}
                  label={t('onboarding.vaginal')}
                  sublabel="Normal / Vaginal"
                  selected={birthType === 'vaginal'}
                  onPress={() => setBirthType('vaginal')}
                />
                <OptionCard
                  icon={<IconCSection />}
                  label={t('onboarding.csection')}
                  sublabel="C-Section / CS"
                  selected={birthType === 'cesarean'}
                  onPress={() => setBirthType('cesarean')}
                />
              </View>
            </>
          )}

          {/* ── STEP 3: Baby Count ─────────────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={s.stepLabel}>
                STEP {status === 'pregnant' ? 2 : 3} OF {visibleSteps}
              </Text>
              <Text style={s.question}>{t('onboarding.step3_title')}</Text>
              <View style={s.optionGrid}>
                <OptionCard icon={<IconSingle />}   label={t('onboarding.single')}   selected={babyCount === 'single'}   onPress={() => setBabyCount('single')}   />
                <OptionCard icon={<IconTwins />}    label={t('onboarding.twins')}    selected={babyCount === 'twins'}    onPress={() => setBabyCount('twins')}    />
                <OptionCard icon={<IconTriplets />} label={t('onboarding.triplets')} selected={babyCount === 'triplets'} onPress={() => setBabyCount('triplets')} wide />
              </View>
            </>
          )}

          {/* ── STEP 4: Date ──────────────────────────────────────────── */}
          {step === 4 && (
            <>
              <Text style={s.stepLabel}>
                STEP {status === 'pregnant' ? 3 : 4} OF {visibleSteps}
              </Text>
              <Text style={s.question}>
                {status === 'pregnant' ? 'When is your due date?' : t('onboarding.step4_title')}
              </Text>
              <DateSelector value={dateValue} onChange={setDateValue} isPregnant={status === 'pregnant'} />
            </>
          )}

          {/* ── STEP 5: Language ───────────────────────────────────────── */}
          {step === 5 && (
            <>
              <Text style={s.stepLabel}>STEP {visibleSteps} OF {visibleSteps}</Text>
              <Text style={s.question}>{t('onboarding.step5_title')}</Text>
              <View style={s.langOptions}>
                {([
                  { code: 'en',  flag: '🇺🇸', label: 'English'  },
                  { code: 'fil', flag: '🇵🇭', label: 'Filipino' },
                  { code: 'zh',  flag: '🇨🇳', label: '中文'     },
                ] as { code: LangCode; flag: string; label: string }[]).map(({ code, flag, label }) => (
                  <TouchableOpacity
                    key={code}
                    style={[s.langCard, language === code && s.langCardActive]}
                    onPress={() => { setLanguage(code); i18n.changeLanguage(code); }}
                  >
                    <Text style={s.langEmoji}>{flag}</Text>
                    <Text style={[s.langLabel, language === code && s.langLabelActive]}>{label}</Text>
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
                  {step === TOTAL_STEPS ? `🎉 ${t('onboarding.finish')}` : `${t('onboarding.next')} →`}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Option Card ──────────────────────────────────────────────────────────
function OptionCard({
  icon, label, sublabel, selected, onPress, wide,
}: {
  icon: React.ReactNode; label: string; sublabel?: string;
  selected: boolean; onPress: () => void; wide?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.optCard, selected && s.optCardSelected, wide && s.optCardWide]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <Text style={s.optCheck}>✓</Text>}
      <View style={s.optIconWrap}>{icon}</View>
      <Text style={[s.optLabel, selected && s.optLabelSelected]}>{label}</Text>
      {sublabel && <Text style={s.optSublabel}>{sublabel}</Text>}
    </TouchableOpacity>
  );
}

// ── Date Selector ────────────────────────────────────────────────────────
function DateSelector({ value, onChange, isPregnant }: {
  value: string; onChange: (v: string) => void; isPregnant: boolean;
}) {
  const today = new Date();
  const [year,  setYear]  = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [day,   setDay]   = useState(String(today.getDate()).padStart(2, '0'));
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function update(y: string, m: string, d: string) {
    onChange(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    setYear(y); setMonth(m); setDay(d);
  }

  return (
    <View>
      <View style={ds.row}>
        <View style={ds.col}>
          <Text style={ds.colLabel}>Month</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {MONTHS.map((m, i) => {
              const val = String(i + 1).padStart(2, '0');
              return (
                <TouchableOpacity key={m} style={[ds.item, month === val && ds.itemSelected]} onPress={() => update(year, val, day)}>
                  <Text style={[ds.itemText, month === val && ds.itemTextSelected]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={ds.col}>
          <Text style={ds.colLabel}>Day</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
              <TouchableOpacity key={d} style={[ds.item, day === d && ds.itemSelected]} onPress={() => update(year, month, d)}>
                <Text style={[ds.itemText, day === d && ds.itemTextSelected]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={ds.col}>
          <Text style={ds.colLabel}>Year</Text>
          <ScrollView style={ds.scroll} showsVerticalScrollIndicator={false}>
            {Array.from({ length: isPregnant ? 2 : 12 }, (_, i) => {
              const y = isPregnant ? String(today.getFullYear() + i) : String(today.getFullYear() - i);
              return (
                <TouchableOpacity key={y} style={[ds.item, year === y && ds.itemSelected]} onPress={() => update(y, month, day)}>
                  <Text style={[ds.itemText, year === y && ds.itemTextSelected]}>{y}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
      {value ? (
        <Text style={ds.selected}>
          Selected: {new Date(value + 'T12:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      ) : null}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient:      { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 56, paddingBottom: 60 },

  langRow:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 12 },
  langBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)' },
  langBtnActive: { backgroundColor: '#fff' },
  langText:      { fontSize: 13, color: '#E8637C', fontWeight: '600' },
  langTextActive:{ color: Colors.primaryPink },

  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn:       { minWidth: 60 },
  backText:      { fontSize: 15, color: '#E8637C', fontWeight: '600' },
  skipBtn:       {},
  skipText:      { fontSize: 15, color: 'rgba(232,99,124,0.7)', fontWeight: '500' },

  dotsRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  dotActive:     { backgroundColor: '#E8637C' },
  dotInactive:   { backgroundColor: 'rgba(232,99,124,0.25)' },

  card:          { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#E8637C', shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },

  stepLabel:     { fontSize: 11, fontWeight: '700', color: Colors.lightGray, marginBottom: 6, letterSpacing: 0.8 },
  question:      { fontSize: 20, fontWeight: '800', color: Colors.dark, marginBottom: 20, lineHeight: 26 },

  optionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  optCard:       { flex: 1, minWidth: '44%', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12, borderRadius: 18, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#FAFAFA', position: 'relative' },
  optCardSelected:{ borderColor: Colors.primaryPink, backgroundColor: '#FFF0F4' },
  optCardWide:   { minWidth: '100%' },
  optIconWrap:   { marginBottom: 10 },
  optCheck:      { position: 'absolute', top: 10, right: 12, fontSize: 14, color: Colors.primaryPink, fontWeight: '800' },
  optLabel:      { fontSize: 14, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  optLabelSelected: { color: Colors.primaryPink },
  optSublabel:   { fontSize: 11, color: Colors.lightGray, marginTop: 3, textAlign: 'center' },

  langOptions:   { gap: 12, marginBottom: 20 },
  langCard:      { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#FAFAFA' },
  langCardActive:{ borderColor: Colors.primaryPink, backgroundColor: '#FFF0F4' },
  langEmoji:     { fontSize: 28, marginRight: 14 },
  langLabel:     { fontSize: 16, fontWeight: '700', color: Colors.dark, flex: 1 },
  langLabelActive:{ color: Colors.primaryPink },
  checkmark:     { fontSize: 18, color: Colors.primaryPink, fontWeight: '800' },

  nextBtn:       { backgroundColor: Colors.primaryPink, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  nextBtnDisabled:{ opacity: 0.4 },
  nextBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});

const ds = StyleSheet.create({
  row:             { flexDirection: 'row', gap: 8, marginBottom: 12 },
  col:             { flex: 1 },
  colLabel:        { fontSize: 12, fontWeight: '700', color: Colors.lightGray, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase' },
  scroll:          { height: 160, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12 },
  item:            { paddingVertical: 10, alignItems: 'center' },
  itemSelected:    { backgroundColor: '#FFF0F4' },
  itemText:        { fontSize: 14, color: Colors.midGray },
  itemTextSelected:{ color: Colors.primaryPink, fontWeight: '700' },
  selected:        { fontSize: 13, color: Colors.primaryPink, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
