import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import { ButtonLoader } from '../../components/SkeletonCard';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import i18n from '../../src/i18n';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import { supabase } from '../../src/lib/supabase';
import Colors from '../../constants/Colors';
import { useOnboardingStore } from '../../store/onboardingStore';
import { usePregnancyStore } from '../../store/pregnancyStore';
import { requestPermissions } from '../../src/lib/notifications';
import { Calendar, Star, Lightbulb, Heart, Cake, Check, PartyPopper, Bell } from 'lucide-react-native';

// ── Types ────────────────────────────────────────────────────────────────
type Status      = 'pregnant' | 'parenting' | null;
type BirthType   = 'vaginal'  | 'cesarean'  | null;
type BabyCount   = 'single'   | 'twins'     | 'triplets' | null;
type ChildGender = 'boy'      | 'girl'      | 'other'    | null;
type LangCode    = 'en'       | 'fil'       | 'zh';

// ── Step layout ───────────────────────────────────────────────────────────
// Pregnant  : 1 (status) → 3 (count) → 4 (due date) → 5 (language) → 6 (notifications)  = 5 visible
// Parenting : 1 (status) → 2 (birth type) → 3 (count) → 4 (details) → 5 (language) → 6 (notifications) = 6 visible
const MAX_STEPS = 6;

// ── Kawaii SVG Icons ──────────────────────────────────────────────────────

function IconPregnant() {
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72">
      <Circle cx="36" cy="12" r="11" fill="#F5C994" />
      <Path d="M 25 9 Q 36 1 47 9 Q 43 5 36 5 Q 29 5 25 9Z" fill="#C8855A" />
      <Circle cx="31" cy="11" r="2.2" fill="#2C1A0E" />
      <Circle cx="41" cy="11" r="2.2" fill="#2C1A0E" />
      <Circle cx="32" cy="10" r="0.9" fill="white" />
      <Circle cx="42" cy="10" r="0.9" fill="white" />
      <Path d="M 31 16 Q 36 20 41 16" stroke="#D47A8F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Ellipse cx="25" cy="15" rx="3" ry="1.8" fill="#F4A8C0" opacity="0.6" />
      <Ellipse cx="47" cy="15" rx="3" ry="1.8" fill="#F4A8C0" opacity="0.6" />
      <Rect x="32" y="22" width="8" height="8" rx="4" fill="#F5C994" />
      <Rect x="10" y="24" width="22" height="9" rx="4.5" fill="#F5C994" />
      <Rect x="40" y="24" width="22" height="9" rx="4.5" fill="#F5C994" />
      <Circle cx="36" cy="51" r="19" fill="#FFD6E4" />
      <Circle cx="36" cy="51" r="19" fill="none" stroke="#F4A8C0" strokeWidth="1.5" />
      <Circle cx="36" cy="47" r="9" fill="#FFADC4" opacity="0.4" />
      <Circle cx="36" cy="41" r="5.5" fill="#FFADC4" opacity="0.5" />
      <Circle cx="33.5" cy="40.5" r="0.9" fill="#D47A8F" opacity="0.5" />
      <Circle cx="38.5" cy="40.5" r="0.9" fill="#D47A8F" opacity="0.5" />
      <Path d="M36 57 C36 54.5 33 54.5 33 57 C33 59.5 36 61 36 61 C36 61 39 59.5 39 57 C39 54.5 36 54.5 36 57Z"
        fill="#E8637C" />
    </Svg>
  );
}

function IconParent() {
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72">
      <Circle cx="22" cy="11" r="11" fill="#F5C994" />
      <Path d="M 11 9 Q 14 1 22 1 Q 30 1 33 9 Q 29 4 22 4 Q 15 4 11 9Z" fill="#C8855A" />
      <Circle cx="18" cy="10" r="2" fill="#2C1A0E" />
      <Circle cx="26" cy="10" r="2" fill="#2C1A0E" />
      <Circle cx="19" cy="9.2" r="0.8" fill="white" />
      <Circle cx="27" cy="9.2" r="0.8" fill="white" />
      <Path d="M 18 15 Q 22 19 26 15" stroke="#D47A8F" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Ellipse cx="14" cy="14" rx="3" ry="1.8" fill="#F4A8C0" opacity="0.5" />
      <Ellipse cx="30" cy="14" rx="3" ry="1.8" fill="#F4A8C0" opacity="0.5" />
      <Rect x="15" y="21" width="14" height="30" rx="7" fill="#FFB3C6" />
      <Rect x="29" y="32" width="18" height="9" rx="4.5" fill="#F5C994" />
      <Rect x="5" y="24" width="10" height="8" rx="4" fill="#F5C994" />
      <Ellipse cx="52" cy="52" rx="11" ry="13" fill="#FFE4EE" />
      <Path d="M 41 48 Q 52 44 63 48" stroke="#F4A8C0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Circle cx="52" cy="36" r="8" fill="#FFE0B2" />
      <Path d="M 44 34 Q 46 27 52 27 Q 58 27 60 34Z" fill="#FFB3C6" />
      <Circle cx="52" cy="27" r="3" fill="#E8637C" />
      <Circle cx="49.5" cy="35" r="1.5" fill="#2C1A0E" />
      <Circle cx="54.5" cy="35" r="1.5" fill="#2C1A0E" />
      <Circle cx="50.2" cy="34.2" r="0.6" fill="white" />
      <Circle cx="55.2" cy="34.2" r="0.6" fill="white" />
      <Path d="M 49.5 39 Q 52 41.5 54.5 39" stroke="#D47A8F" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <Ellipse cx="46" cy="37" rx="2.8" ry="1.6" fill="#F4A8C0" opacity="0.55" />
      <Ellipse cx="58" cy="37" rx="2.8" ry="1.6" fill="#F4A8C0" opacity="0.55" />
      <Path d="M38 20 C38 17.5 35 17.5 35 20 C35 22.5 38 24 38 24 C38 24 41 22.5 41 20 C41 17.5 38 17.5 38 20Z"
        fill="#E8637C" />
    </Svg>
  );
}

function IconNatural() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Ellipse cx="32" cy="14" rx="7" ry="12" fill="#FFB3C6" />
      <Ellipse cx="50" cy="23" rx="7" ry="12" fill="#FFB3C6" transform="rotate(60 50 23)" />
      <Ellipse cx="46" cy="46" rx="7" ry="12" fill="#FFB3C6" transform="rotate(120 46 46)" />
      <Ellipse cx="32" cy="52" rx="7" ry="12" fill="#F4A8C0" transform="rotate(180 32 52)" />
      <Ellipse cx="18" cy="46" rx="7" ry="12" fill="#F4A8C0" transform="rotate(240 18 46)" />
      <Ellipse cx="14" cy="23" rx="7" ry="12" fill="#FFB3C6" transform="rotate(300 14 23)" />
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
      <Circle cx="32" cy="32" r="28" fill="#E0F7EF" />
      <Rect x="26" y="14" width="12" height="36" rx="5" fill="#27AE7A" />
      <Rect x="14" y="26" width="36" height="12" rx="5" fill="#27AE7A" />
      <Path d="M32 38 C32 35 28.5 35 28.5 38 C28.5 40.5 32 43 32 43 C32 43 35.5 40.5 35.5 38 C35.5 35 32 35 32 38Z"
        fill="white" opacity="0.9" />
    </Svg>
  );
}

function IconSingle() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Path d="M32 8 L36 24 L52 24 L40 34 L44 50 L32 40 L20 50 L24 34 L12 24 L28 24 Z" fill="#FFE066" />
      <Circle cx="32" cy="30" r="6" fill="white" opacity="0.3" />
      <Circle cx="28" cy="28" r="2" fill="#C8A000" />
      <Circle cx="36" cy="28" r="2" fill="#C8A000" />
      <Path d="M 27 33 Q 32 37 37 33" stroke="#C8A000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconTwins() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Path d="M18 6 L21 16 L32 16 L23 22 L26 32 L18 26 L10 32 L13 22 L4 16 L15 16 Z" fill="#FFB3C6" />
      <Circle cx="16" cy="20" r="3.5" fill="white" opacity="0.25" />
      <Circle cx="14" cy="19" r="1.2" fill="#D47A8F" />
      <Circle cx="19" cy="19" r="1.2" fill="#D47A8F" />
      <Path d="M 13 22 Q 16 24.5 19 22" stroke="#D47A8F" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M46 6 L49 16 L60 16 L51 22 L54 32 L46 26 L38 32 L41 22 L32 16 L43 16 Z" fill="#C8A8F0" />
      <Circle cx="44" cy="20" r="3.5" fill="white" opacity="0.25" />
      <Circle cx="42" cy="19" r="1.2" fill="#9B59B6" />
      <Circle cx="47" cy="19" r="1.2" fill="#9B59B6" />
      <Path d="M 41 22 Q 44 24.5 47 22" stroke="#9B59B6" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M32 36 C32 34 30 34 30 36 C30 38 32 39.5 32 39.5 C32 39.5 34 38 34 36 C34 34 32 34 32 36Z"
        fill="#E8637C" />
    </Svg>
  );
}

function IconTriplets() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Path d="M12 10 L14.5 18 L23 18 L16.5 23 L19 31 L12 26 L5 31 L7.5 23 L1 18 L9.5 18 Z" fill="#FFB3C6" />
      <Circle cx="10.5" cy="21" r="1" fill="#D47A8F" />
      <Circle cx="14" cy="21" r="1" fill="#D47A8F" />
      <Path d="M 10 24 Q 12 26 14.5 24" stroke="#D47A8F" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <Path d="M32 6 L35 17 L46 17 L37.5 24 L40.5 35 L32 28 L23.5 35 L26.5 24 L18 17 L29 17 Z" fill="#FFE066" />
      <Circle cx="29" cy="22" r="1.5" fill="#C8A000" />
      <Circle cx="35" cy="22" r="1.5" fill="#C8A000" />
      <Path d="M 28 26 Q 32 29 36 26" stroke="#C8A000" strokeWidth="1" fill="none" strokeLinecap="round" />
      <Path d="M52 10 L54.5 18 L63 18 L56.5 23 L59 31 L52 26 L45 31 L47.5 23 L41 18 L49.5 18 Z" fill="#A8E6CF" />
      <Circle cx="50.5" cy="21" r="1" fill="#27AE7A" />
      <Circle cx="54" cy="21" r="1" fill="#27AE7A" />
      <Path d="M 50 24 Q 52 26 54.5 24" stroke="#27AE7A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <Path d="M22 46 C22 44.2 19.5 44.2 19.5 46 C19.5 47.8 22 49.5 22 49.5 C22 49.5 24.5 47.8 24.5 46 C24.5 44.2 22 44.2 22 46Z" fill="#E8637C" />
      <Path d="M32 48 C32 46.2 29.5 46.2 29.5 48 C29.5 49.8 32 51.5 32 51.5 C32 51.5 34.5 49.8 34.5 48 C34.5 46.2 32 46.2 32 48Z" fill="#E8637C" />
      <Path d="M42 46 C42 44.2 39.5 44.2 39.5 46 C39.5 47.8 42 49.5 42 49.5 C42 49.5 44.5 47.8 44.5 46 C44.5 44.2 42 44.2 42 46Z" fill="#E8637C" />
    </Svg>
  );
}

// ── Gender Icons ──────────────────────────────────────────────────────────

function IconBoy() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Blue bg */}
      <Circle cx="32" cy="32" r="28" fill="#E8F2FF" />
      {/* Head */}
      <Circle cx="32" cy="26" r="15" fill="#FFE0B2" />
      {/* Short hair */}
      <Path d="M 17 22 Q 19 10 32 10 Q 45 10 47 22 Q 41 14 32 14 Q 23 14 17 22Z" fill="#8B6048" />
      {/* Eyes */}
      <Circle cx="27" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="28" cy="24" r="1" fill="white" />
      <Circle cx="37" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="38" cy="24" r="1" fill="white" />
      {/* Smile */}
      <Path d="M 27 31 Q 32 35 37 31" stroke="#C8855A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <Ellipse cx="21" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.5" />
      <Ellipse cx="43" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.5" />
      {/* Blue body */}
      <Path d="M 16 48 Q 18 58 26 60 L 38 60 Q 46 58 48 48 Q 42 42 32 42 Q 22 42 16 48Z" fill="#1A73C8" />
      {/* Bow tie */}
      <Path d="M 27 42 Q 32 46 37 42 Q 32 39 27 42Z" fill="#1558A8" />
      <Circle cx="32" cy="42" r="2" fill="#1558A8" />
    </Svg>
  );
}

function IconGirl() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Pink bg */}
      <Circle cx="32" cy="32" r="28" fill="#FFF0F4" />
      {/* Head */}
      <Circle cx="32" cy="26" r="15" fill="#FFE0B2" />
      {/* Hair */}
      <Path d="M 17 22 Q 19 9 32 9 Q 45 9 47 22 Q 41 13 32 13 Q 23 13 17 22Z" fill="#C8855A" />
      {/* Bow */}
      <Path d="M 24 10 Q 32 6 32 10 Q 28 13 24 10Z" fill="#E8637C" />
      <Path d="M 40 10 Q 32 6 32 10 Q 36 13 40 10Z" fill="#E8637C" />
      <Circle cx="32" cy="10" r="3.5" fill="#F4A8C0" />
      {/* Eyes */}
      <Circle cx="27" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="28" cy="24" r="1" fill="white" />
      <Circle cx="37" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="38" cy="24" r="1" fill="white" />
      {/* Lashes */}
      <Path d="M 25 22.5 L 23 20.5" stroke="#2C1A0E" strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 39 22.5 L 41 20.5" stroke="#2C1A0E" strokeWidth="1.2" strokeLinecap="round" />
      {/* Smile */}
      <Path d="M 27 31 Q 32 35 37 31" stroke="#D47A8F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <Ellipse cx="21" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.6" />
      <Ellipse cx="43" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.6" />
      {/* Pink dress */}
      <Path d="M 14 48 Q 16 60 26 62 L 38 62 Q 48 60 50 48 Q 43 42 32 42 Q 21 42 14 48Z" fill="#FFB3C6" />
    </Svg>
  );
}

function IconGenderOther() {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      {/* Warm yellow bg */}
      <Circle cx="32" cy="32" r="28" fill="#FFF8E8" />
      {/* Head */}
      <Circle cx="32" cy="26" r="15" fill="#FFE0B2" />
      {/* Hair - short with rainbow streak */}
      <Path d="M 17 22 Q 19 10 32 10 Q 45 10 47 22 Q 41 14 32 14 Q 23 14 17 22Z" fill="#C8855A" />
      <Path d="M 22 12 Q 28 8 34 11" stroke="#FFB3C6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M 30 10 Q 36 7 42 11" stroke="#A8D8FF" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <Circle cx="27" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="28" cy="24" r="1" fill="white" />
      <Circle cx="37" cy="25" r="2.5" fill="#2C1A0E" /><Circle cx="38" cy="24" r="1" fill="white" />
      {/* Smile */}
      <Path d="M 27 31 Q 32 35 37 31" stroke="#C8855A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <Ellipse cx="21" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.5" />
      <Ellipse cx="43" cy="29" rx="4" ry="2.5" fill="#F4A8C0" opacity="0.5" />
      {/* Yellow/rainbow top */}
      <Path d="M 16 48 Q 18 58 26 60 L 38 60 Q 46 58 48 48 Q 42 42 32 42 Q 22 42 16 48Z" fill="#FFE066" />
      {/* Rainbow sparkles */}
      <Path d="M 26 46 L 27.5 43 L 29 46 L 26 44.5 L 30 44.5Z" fill="#F5A623" opacity="0.9" />
      <Path d="M 35 47 L 36.5 44 L 38 47 L 35 45.5 L 39 45.5Z" fill="#E8637C" opacity="0.8" />
    </Svg>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { setData: saveOnboardingData } = useOnboardingStore();
  const { setActivePregnancy, setIsPregnancyMode } = usePregnancyStore();

  const [step,        setStep]        = useState(1);
  const [saving,      setSaving]      = useState(false);
  const [status,      setStatus]      = useState<Status>(null);
  const [birthType,   setBirthType]   = useState<BirthType>(null);
  const [babyCount,   setBabyCount]   = useState<BabyCount>(null);
  const [dateValue,   setDateValue]   = useState('');
  const [language,    setLanguage]    = useState<LangCode>('en');
  // Child details (parenting only — first child)
  const [childName,   setChildName]   = useState('');
  const [childGender, setChildGender] = useState<ChildGender>(null);

  // ── Step routing ────────────────────────────────────────────────────────
  // Pregnant:  1 → 3 → 4 → 5
  // Parenting: 1 → 2 → 3 → 4 → 5
  const visibleSteps = status === 'pregnant' ? 5 : 6;

  function displayStepNum(): number {
    if (status !== 'pregnant') return step;
    const map: Record<number, number> = { 1: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
    return map[step] ?? step;
  }

  function canAdvance(): boolean {
    if (step === 1) return !!status;
    if (step === 2) return !!birthType;
    if (step === 3) return !!babyCount;
    if (step === 4) {
      if (status === 'pregnant') return !!dateValue;
      // Parenting step 4: child details — name + gender + birthday required
      return childName.trim().length > 0 && !!childGender && !!dateValue;
    }
    return true; // step 5 language + step 6 notifications always ok
  }

  function goNext() {
    // Pregnant skips step 2 (birth type)
    if (step === 1 && status === 'pregnant') { setStep(3); return; }
    if (step < MAX_STEPS) { setStep(s => s + 1); return; }
    handleFinish();
  }

  function goBack() {
    if (step === 3 && status === 'pregnant') { setStep(1); return; }
    if (step > 1) setStep(s => s - 1);
  }

  function skipAll() { handleFinish(true); }

  async function handleFinish(skipped = false) {
    // Capture status now — before any async calls change closure scope
    const isPregnant = !skipped && status === 'pregnant';

    if (!skipped) {
      saveOnboardingData({
        status, birthType, babyCount,
        date: dateValue, language,
        childName: childName.trim(),
        childGender,
      } as any);
    }

    // ── If pregnant: set store immediately (before Supabase, no waiting) ──
    if (isPregnant && dateValue) {
      const due    = new Date(dateValue);
      const lmp    = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);
      const lmpStr = lmp.toISOString().split('T')[0];
      setActivePregnancy({
        id:         `local-${Date.now()}`,
        user_id:    '',
        lmp_date:   lmpStr,
        due_date:   dateValue,
        ob_name:    null,
        clinic:     null,
        is_active:  true,
        created_at: new Date().toISOString(),
      });
      setIsPregnancyMode(true);
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').upsert({
          id: user.id, language, onboarding_completed: true,
        });

        // Also persist pregnancy profile to Supabase (best-effort)
        if (isPregnant && dateValue) {
          const due    = new Date(dateValue);
          const lmp    = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);
          const lmpStr = lmp.toISOString().split('T')[0];
          const { data: pregnancy } = await supabase
            .from('pregnancy_profiles')
            .insert({ user_id: user.id, lmp_date: lmpStr, due_date: dateValue, is_active: true })
            .select()
            .single();
          // Update store with real DB id if insert succeeded
          if (pregnancy) setActivePregnancy(pregnancy);
        }
      }
    } catch (err: any) {
      console.warn('Onboarding save failed:', err.message);
      // Store is already hydrated above — safe to continue
    } finally {
      setSaving(false);
    }

    // ── Route: pregnant → dashboard, parenting → baby profile ──
    if (skipped || isPregnant) {
      router.replace('/(tabs)');
    } else {
      router.replace('/child-profile');
    }
  }

  const isLastStep = step === MAX_STEPS;

  return (
    <LinearGradient colors={[Colors.softPink, '#FFCFDA', '#FFB3C6']} style={s.gradient}>
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

        {/* Header row */}
        <View style={s.headerRow}>
          {step > 1 ? (
            <TouchableOpacity onPress={goBack} style={s.backBtn}>
              <Text style={s.backText}>← {t('onboarding.back')}</Text>
            </TouchableOpacity>
          ) : <View style={s.backBtn} />}
          <TouchableOpacity onPress={skipAll}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={s.dotsRow}>
          {Array.from({ length: visibleSteps }).map((_, i) => (
            <View key={i} style={[s.dot, i < displayStepNum() ? s.dotActive : s.dotInactive]} />
          ))}
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* ── STEP 1: Status ──────────────────────────────────────────── */}
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

          {/* ── STEP 2: Birth Type (parenting only) ─────────────────────── */}
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

          {/* ── STEP 3: Baby / Child Count ──────────────────────────────── */}
          {step === 3 && (
            <>
              <Text style={s.stepLabel}>STEP {displayStepNum()} OF {visibleSteps}</Text>
              {/* Different question for pregnant vs parenting */}
              <Text style={s.question}>
                {status === 'pregnant'
                  ? 'How many babies are you expecting?'
                  : 'How many children do you have?'}
              </Text>
              <View style={s.optionGrid}>
                <OptionCard
                  icon={<IconSingle />}
                  badge="×1"
                  label={status === 'pregnant' ? 'One Baby' : t('onboarding.single')}
                  sublabel="1 宝宝 · Single"
                  selected={babyCount === 'single'}
                  onPress={() => setBabyCount('single')}
                />
                <OptionCard
                  icon={<IconTwins />}
                  badge="×2"
                  label={t('onboarding.twins')}
                  sublabel="2 宝宝 · 双胞胎"
                  selected={babyCount === 'twins'}
                  onPress={() => setBabyCount('twins')}
                />
                <OptionCard
                  icon={<IconTriplets />}
                  badge="×3+"
                  label={t('onboarding.triplets')}
                  sublabel="3+ 宝宝 · 多胞胎"
                  selected={babyCount === 'triplets'}
                  onPress={() => setBabyCount('triplets')}
                  wide
                />
              </View>
            </>
          )}

          {/* ── STEP 4a: Due Date (pregnant) ────────────────────────────── */}
          {step === 4 && status === 'pregnant' && (
            <>
              <Text style={s.stepLabel}>STEP {displayStepNum()} OF {visibleSteps}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[s.question, { marginBottom: 0, marginRight: 8 }]}>When is your due date?</Text>
                <Calendar size={16} strokeWidth={1.5} color={Colors.dark} />
              </View>
              <DateSelector value={dateValue} onChange={setDateValue} isPregnant />
            </>
          )}

          {/* ── STEP 4b: Child Details (parenting) ──────────────────────── */}
          {step === 4 && status === 'parenting' && (
            <>
              <Text style={s.stepLabel}>STEP 4 OF {visibleSteps}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text style={[s.question, { marginBottom: 0, marginRight: 8 }]}>Tell us about your child</Text>
                <Star size={16} strokeWidth={1.5} color={Colors.gold} />
              </View>
              {babyCount && babyCount !== 'single' && (
                <View style={s.infoBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Lightbulb size={16} strokeWidth={1.5} color={Colors.dark} style={{ marginRight: 6 }} />
                    <Text style={s.infoBannerText}>
                      You can add more children from your dashboard later
                    </Text>
                  </View>
                </View>
              )}

              {/* Child name */}
              <Text style={s.fieldLabel}>Child's Name</Text>
              <TextInput
                style={s.nameInput}
                placeholder="e.g. Sophia, Lucas…"
                placeholderTextColor={Colors.lightGray}
                value={childName}
                onChangeText={setChildName}
                autoCapitalize="words"
                returnKeyType="done"
              />

              {/* Gender selector */}
              <Text style={s.fieldLabel}>Gender</Text>
              <View style={s.genderRow}>
                <GenderCard icon={<IconBoy />}         label="Boy"   labelSuffix={<Heart size={14} strokeWidth={1.5} color={Colors.blue} style={{ marginLeft: 4 }} />}   selected={childGender === 'boy'}   onPress={() => setChildGender('boy')}   />
                <GenderCard icon={<IconGirl />}        label="Girl"  labelSuffix={<Heart size={14} strokeWidth={1.5} color={Colors.primaryPink} style={{ marginLeft: 4 }} />}  selected={childGender === 'girl'}  onPress={() => setChildGender('girl')}  />
                <GenderCard icon={<IconGenderOther />} label="Other" selected={childGender === 'other'} onPress={() => setChildGender('other')} />
              </View>

              {/* Birthday */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
                <Text style={[s.fieldLabel, { marginBottom: 0, marginTop: 0, marginRight: 6 }]}>Birthday</Text>
                <Cake size={16} strokeWidth={1.5} color={Colors.midGray} />
              </View>
              <DateSelector value={dateValue} onChange={setDateValue} isPregnant={false} />
            </>
          )}

          {/* ── STEP 5: Language ────────────────────────────────────────── */}
          {step === 5 && (
            <>
              <Text style={s.stepLabel}>STEP {displayStepNum()} OF {visibleSteps}</Text>
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
                    {language === code && <Check size={14} strokeWidth={2.5} color={Colors.primaryPink} />}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── STEP 6: Notifications permission ────────────────────────── */}
          {step === 6 && (
            <>
              <Text style={s.stepLabel}>STEP {visibleSteps} OF {visibleSteps}</Text>
              <Text style={s.question}>Never miss a vaccine! 💉</Text>

              {/* Friendly explanation card — shown BEFORE triggering system prompt */}
              <View style={s.notifCard}>
                <View style={s.notifIconRow}>
                  <View style={s.notifIconCircle}>
                    <Bell size={28} strokeWidth={1.5} color={Colors.primaryPink} />
                  </View>
                </View>
                <Text style={s.notifTitle}>Vaccine & Milestone Reminders</Text>
                <Text style={s.notifBody}>
                  BabyBloom will send gentle reminders so you never miss a scheduled vaccine, a monthly milestone, or your weekly health check-in.{'\n\n'}
                  We'll notify you:{'\n'}
                  {'  '}💉 3 days before a vaccine is due{'\n'}
                  {'  '}💉 The day before{'\n'}
                  {'  '}🎉 On each monthly milestone{'\n'}
                  {'  '}📋 Every Sunday for your weekly summary
                </Text>
                <Text style={s.notifNote}>
                  You can adjust notification settings anytime in the app.
                </Text>
              </View>

              <TouchableOpacity
                style={s.notifAllowBtn}
                onPress={() => requestPermissions()}
                activeOpacity={0.8}
              >
                <Bell size={16} strokeWidth={1.5} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={s.notifAllowText}>Allow Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.notifSkipBtn} onPress={handleFinish}>
                <Text style={s.notifSkipText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Next / Finish — hidden on step 6 which has its own CTA buttons */}
          {step !== MAX_STEPS && (
            <TouchableOpacity
              style={[s.nextBtn, (!canAdvance() || saving) && s.nextBtnDisabled]}
              onPress={goNext}
              disabled={!canAdvance() || saving}
            >
              {saving
                ? <ButtonLoader />
                : <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {step === MAX_STEPS - 1 && <PartyPopper size={16} strokeWidth={1.5} color={Colors.white} style={{ marginRight: 6 }} />}
                    <Text style={s.nextBtnText}>
                      {step === MAX_STEPS - 1 ? t('onboarding.finish') : `${t('onboarding.next')} →`}
                    </Text>
                  </View>
              }
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────
function OptionCard({
  icon, label, sublabel, badge, selected, onPress, wide,
}: {
  icon: React.ReactNode; label: string; sublabel?: string; badge?: string;
  selected: boolean; onPress: () => void; wide?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.optCard, selected && s.optCardSelected, wide && s.optCardWide]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <View style={s.optCheck}><Check size={14} strokeWidth={2.5} color={Colors.primaryPink} /></View>}
      <View style={s.optIconWrap}>
        {icon}
        {badge && (
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[s.optLabel, selected && s.optLabelSelected]}>{label}</Text>
      {sublabel && <Text style={s.optSublabel}>{sublabel}</Text>}
    </TouchableOpacity>
  );
}

// ── Gender Card (compact, 3 per row) ─────────────────────────────────────
function GenderCard({
  icon, label, labelSuffix, selected, onPress,
}: {
  icon: React.ReactNode; label: string; labelSuffix?: React.ReactNode; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.genderCard, selected && s.genderCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {selected && <View style={s.genderCheck}><Check size={14} strokeWidth={2.5} color={Colors.primaryPink} /></View>}
      {icon}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Text style={[s.genderLabel, selected && s.genderLabelSelected, { marginTop: 0 }]}>{label}</Text>
        {labelSuffix}
      </View>
    </TouchableOpacity>
  );
}

// ── Date Selector ─────────────────────────────────────────────────────────
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

// ── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradient:      { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 56, paddingBottom: 60 },

  langRow:       { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 12 },
  langBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)' },
  langBtnActive: { backgroundColor: Colors.white },
  langText:      { fontSize: 13, color: '#E8637C', fontWeight: '600' },
  langTextActive:{ color: Colors.primaryPink },

  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn:       { minWidth: 60 },
  backText:      { fontSize: 15, color: '#E8637C', fontWeight: '600' },
  skipText:      { fontSize: 15, color: 'rgba(232,99,124,0.7)', fontWeight: '500' },

  dotsRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  dotActive:     { backgroundColor: '#E8637C' },
  dotInactive:   { backgroundColor: 'rgba(232,99,124,0.25)' },

  card:          { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },

  stepLabel:     { fontSize: 11, fontWeight: '700', color: Colors.lightGray, marginBottom: 6, letterSpacing: 0.8 },
  question:      { fontSize: 20, fontWeight: '800', color: Colors.dark, marginBottom: 20, lineHeight: 28 },

  // Option grid
  optionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  optCard:       { flex: 1, minWidth: '44%', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12, borderRadius: 18, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background, position: 'relative' },
  optCardSelected:{ borderColor: Colors.primaryPink, backgroundColor: '#FFF0F4' },
  optCardWide:   { minWidth: '100%' },
  optIconWrap:   { marginBottom: 10, position: 'relative' },
  optCheck:      { position: 'absolute', top: 10, right: 12 },
  optLabel:      { fontSize: 14, fontWeight: '700', color: Colors.dark, textAlign: 'center' },
  optLabelSelected: { color: Colors.primaryPink },
  optSublabel:   { fontSize: 11, color: Colors.midGray, marginTop: 4, textAlign: 'center', fontWeight: '500' },
  countBadge:    { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.primaryPink, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: Colors.white },
  countBadgeText:{ fontSize: 10, color: Colors.white, fontWeight: '700' },

  // Child details (step 4 parenting)
  infoBanner:    { backgroundColor: Colors.softGold, borderRadius: 12, padding: 10, marginBottom: 16 },
  infoBannerText:{ fontSize: 12, color: Colors.dark, fontWeight: '500', textAlign: 'center' },
  fieldLabel:    { fontSize: 13, fontWeight: '700', color: Colors.midGray, marginBottom: 8, marginTop: 4 },
  nameInput:     { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Colors.dark, backgroundColor: Colors.background, marginBottom: 16, height: 52, fontFamily: 'PlusJakartaSans_400Regular' },
  genderRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderCard:    { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background, position: 'relative' },
  genderCardSelected: { borderColor: Colors.primaryPink, backgroundColor: '#FFF0F4' },
  genderCheck:   { position: 'absolute', top: 6, right: 8 },
  genderLabel:   { fontSize: 12, fontWeight: '600', color: Colors.dark, marginTop: 6, textAlign: 'center' },
  genderLabelSelected: { color: Colors.primaryPink },

  // Language
  langOptions:   { gap: 12, marginBottom: 20 },
  langCard:      { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background },
  langCardActive:{ borderColor: Colors.primaryPink, backgroundColor: '#FFF0F4' },
  langEmoji:     { fontSize: 28, marginRight: 14 },
  langLabel:     { fontSize: 16, fontWeight: '700', color: Colors.dark, flex: 1 },
  langLabelActive:{ color: Colors.primaryPink },
  checkmark:     { },

  // Button
  nextBtn:        { backgroundColor: Colors.primaryPink, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  nextBtnDisabled:{ opacity: 0.4 },
  nextBtnText:    { color: Colors.white, fontSize: 16, fontWeight: '700' },

  // Step 6 — Notifications
  notifCard:       { backgroundColor: Colors.softPink, borderRadius: 18, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#FFB3C6' },
  notifIconRow:    { alignItems: 'center', marginBottom: 14 },
  notifIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primaryPink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  notifTitle:      { fontSize: 16, fontWeight: '800', color: Colors.dark, textAlign: 'center', marginBottom: 10 },
  notifBody:       { fontSize: 13, color: Colors.midGray, lineHeight: 20, marginBottom: 12 },
  notifNote:       { fontSize: 11, color: Colors.lightGray, textAlign: 'center', fontStyle: 'italic' },
  notifAllowBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryPink, borderRadius: 14, height: 52, marginBottom: 12 },
  notifAllowText:  { color: Colors.white, fontSize: 16, fontWeight: '700' },
  notifSkipBtn:    { alignItems: 'center', paddingVertical: 10 },
  notifSkipText:   { fontSize: 14, color: Colors.midGray, fontWeight: '500' },
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
