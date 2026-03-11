/**
 * child-profile.tsx
 * Create / Edit child profile — all fields from docs/02-profile.md
 * Accessible via: router.push('/child-profile') or router.push({ pathname: '/child-profile', params: { id: '...' } })
 *
 * Smart UX features:
 *  - Pre-fills birthday & birth type from onboarding answers
 *  - Progress bar (required + optional fields)
 *  - Inline required-field validation with scroll-to-error
 *  - Pre-fill notice banner when data came from onboarding
 */

import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import Colors from '../constants/Colors';
import { useChildStore, Child, Sex, BirthType, BloodType } from '../store/childStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

// ── Constants ────────────────────────────────────────────────────────────────

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const PRESET_ALLERGIES = ['Nuts', 'Dairy', 'Eggs', 'Shellfish', 'Wheat', 'Soy', 'Fish'];

/** 4 default avatar options: colour + emoji */
const DEFAULT_AVATARS = [
  { bg: Colors.softBlue, emoji: '👶🏻', label: 'Boy (light)' },
  { bg: Colors.softPink, emoji: '👶🏽', label: 'Girl (medium)' },
  { bg: Colors.softMint, emoji: '👶🏾', label: 'Baby (dark)' },
  { bg: Colors.softGold, emoji: '👶',   label: 'Baby (neutral)' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `child_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Convert "HH:MM" (24h) → "h:mm AM/PM" */
function formatTime12h(hhmm: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/** Convert a Date → "HH:MM" (24h) string */
function dateToHHMM(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Parse "HH:MM" → Date object (today's date, at that time) */
function hhmmToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function ChildProfileScreen() {
  const { t }    = useTranslation();
  const params   = useLocalSearchParams<{
    id?:                string;
    prefill_birthday?:  string;   // ISO date from onboarding step 4
    prefill_birth_type?: string;  // 'vaginal' | 'cesarean' from onboarding step 2
  }>();
  const { children, addChild, updateChild } = useChildStore();
  const { data: onboardingData, clearData: clearOnboarding } = useOnboardingStore();

  const existing = params.id ? children.find((c) => c.id === params.id) : undefined;
  const isEdit   = Boolean(existing);

  // Determine which fields were pre-filled from onboarding
  const prefillActive =
    !isEdit &&
    onboardingData.status === 'parenting' &&
    (!!onboardingData.date || !!onboardingData.birthType);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [photoUri,       setPhotoUri]       = useState(existing?.photoUri ?? '');
  const [avatarIndex,    setAvatarIndex]    = useState<number | undefined>(existing?.avatarIndex ?? 0);

  const [firstName,      setFirstName]      = useState(existing?.firstName ?? '');
  const [middleName,     setMiddleName]     = useState(existing?.middleName ?? '');
  const [lastName,       setLastName]       = useState(existing?.lastName ?? '');
  const [nickname,       setNickname]       = useState(existing?.nickname ?? '');

  const [sex,            setSex]            = useState<Sex>(existing?.sex ?? 'female');
  // Pre-fill birthday from onboarding (only for parenting status, not pregnant EDD)
  const [birthday, setBirthday] = useState(
    existing?.birthday ?? (prefillActive && onboardingData.date ? onboardingData.date : '')
  );
  const [birthTime,      setBirthTime]      = useState(existing?.birthTime ?? ''); // "HH:MM" 24h
  const [bloodType,      setBloodType]      = useState<BloodType | undefined>(existing?.bloodType);

  // Pre-fill birth type from onboarding
  const [birthType, setBirthType] = useState<BirthType | undefined>(
    existing?.birthType ??
    (prefillActive && onboardingData.birthType
      ? (onboardingData.birthType as BirthType)
      : undefined)
  );
  const [birthWeightStr, setBirthWeightStr] = useState(existing?.birthWeight?.toString() ?? '');
  const [birthHeightStr, setBirthHeightStr] = useState(existing?.birthHeight?.toString() ?? '');
  const [gestAgeStr,     setGestAgeStr]     = useState(existing?.gestationalAge?.toString() ?? '');

  const [allergies,      setAllergies]      = useState<string[]>(existing?.allergies ?? []);
  const [allergyInput,   setAllergyInput]   = useState('');
  const [pediatrician,   setPediatrician]   = useState(existing?.pediatricianName ?? '');
  const [clinic,         setClinic]         = useState(existing?.clinicHospital ?? '');

  const [philhealth,     setPhilhealth]     = useState(existing?.philhealthNumber ?? '');
  const [mch,            setMch]            = useState(existing?.mchBookletNumber ?? '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // ── Scroll + layout refs ──────────────────────────────────────────────────

  const scrollRef   = useRef<ScrollView>(null);
  const sectionYRef = useRef<Record<string, number>>({});

  // ── Progress calculation ─────────────────────────────────────────────────
  // Required (3): firstName, lastName, birthday
  // Optional that count (7): nickname, birthType, birthWeight, birthHeight, bloodType, gestationalAge, pediatrician
  // Total = 10
  function calcProgress() {
    let filled = 0;
    if (firstName.trim())  filled++;
    if (lastName.trim())   filled++;
    if (birthday)          filled++;
    if (nickname.trim())   filled++;
    if (birthType)         filled++;
    if (birthWeightStr)    filled++;
    if (birthHeightStr)    filled++;
    if (bloodType)         filled++;
    if (gestAgeStr)        filled++;
    if (pediatrician.trim()) filled++;
    return Math.round((filled / 10) * 100);
  }

  const progress = calcProgress();

  // ── Image picker ──────────────────────────────────────────────────────────

  const pickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permission_denied'), t('profile.gallery_permission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setAvatarIndex(undefined);
    }
  }, [t]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permission_denied'), t('profile.camera_permission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setAvatarIndex(undefined);
    }
  }, [t]);

  // ── Photo upload to Supabase Storage ──────────────────────────────────────

  async function uploadPhoto(localUri: string, childId: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? 'anon';
      const path   = `${userId}/${childId}.jpg`;

      const response = await fetch(localUri);
      const blob     = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('children')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('children')
        .getPublicUrl(path);

      return urlData.publicUrl ?? null;
    } catch (err) {
      console.warn('[uploadPhoto] failed:', err);
      return null;
    }
  }

  // ── Allergies ─────────────────────────────────────────────────────────────

  const togglePresetAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies((prev) => [...prev, trimmed]);
    }
    setAllergyInput('');
  };

  const removeAllergy = (allergy: string) => {
    setAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  // ── Date / Time pickers ──────────────────────────────────────────────────

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (date) {
      setBirthday(date.toISOString().split('T')[0]);
      setErrors((e) => { const next = { ...e }; delete next.birthday; return next; });
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (date) setBirthTime(dateToHHMM(date));
  };

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) errs.firstName = t('profile.required_first_name');
    if (!lastName.trim())  errs.lastName  = t('profile.required_last_name');
    if (!birthday)         errs.birthday  = t('profile.required_birthday');
    if (birthday && birthday > todayISO()) errs.birthday = t('profile.birthday_future');

    const bw = parseFloat(birthWeightStr);
    if (birthWeightStr && (isNaN(bw) || bw < 0.5 || bw > 8.0))
      errs.birthWeight = t('profile.weight_range');

    const bh = parseFloat(birthHeightStr);
    if (birthHeightStr && (isNaN(bh) || bh < 25 || bh > 65))
      errs.birthHeight = t('profile.height_range');

    const ga = parseInt(gestAgeStr, 10);
    if (gestAgeStr && (isNaN(ga) || ga < 22 || ga > 42))
      errs.gestationalAge = t('profile.gestational_range');

    return errs;
  }

  /** Scroll to the section containing the first validation error */
  function scrollToFirstError(errs: Record<string, string>) {
    const FIELD_TO_SECTION: Record<string, string> = {
      firstName:     'basic',
      lastName:      'basic',
      birthday:      'personal',
      birthWeight:   'birthDetails',
      birthHeight:   'birthDetails',
      gestationalAge:'birthDetails',
    };
    const firstKey = Object.keys(errs)[0];
    if (!firstKey) return;
    const section = FIELD_TO_SECTION[firstKey] ?? 'basic';
    const y = sectionYRef.current[section] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      scrollToFirstError(errs);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const childId = existing?.id ?? generateId();

      let resolvedPhotoUri = photoUri || undefined;
      let resolvedPhotoUrl: string | undefined;

      if (isSupabaseConfigured && photoUri && !photoUri.startsWith('http')) {
        const url = await uploadPhoto(photoUri, childId);
        if (url) {
          resolvedPhotoUrl = url;
          resolvedPhotoUri = url;
        }
      } else if (photoUri?.startsWith('http')) {
        resolvedPhotoUrl = photoUri;
        resolvedPhotoUri = photoUri;
      }

      const bw = parseFloat(birthWeightStr);
      const bh = parseFloat(birthHeightStr);
      const ga = parseInt(gestAgeStr, 10);

      const childData: Child = {
        id:               childId,
        firstName:        firstName.trim(),
        middleName:       middleName.trim() || undefined,
        lastName:         lastName.trim(),
        nickname:         nickname.trim() || undefined,
        sex,
        birthday,
        birthTime:        birthTime.trim() || undefined,
        bloodType,
        birthType,
        birthWeight:      birthWeightStr ? bw  : undefined,
        birthHeight:      birthHeightStr ? bh  : undefined,
        gestationalAge:   gestAgeStr     ? ga  : undefined,
        allergies:        allergies.length ? allergies : undefined,
        pediatricianName: pediatrician.trim() || undefined,
        clinicHospital:   clinic.trim() || undefined,
        philhealthNumber: philhealth.trim() || undefined,
        mchBookletNumber: mch.trim() || undefined,
        photoUri:         resolvedPhotoUri,
        avatarIndex:      resolvedPhotoUri ? undefined : avatarIndex,
        createdAt:        existing?.createdAt ?? new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        const row = {
          id:                    childData.id,
          user_id:               user?.id,
          first_name:            childData.firstName,
          middle_name:           childData.middleName ?? null,
          last_name:             childData.lastName,
          nickname:              childData.nickname ?? null,
          sex:                   childData.sex,
          birthday:              childData.birthday,
          birth_time:            childData.birthTime ?? null,
          blood_type:            childData.bloodType ?? null,
          birth_type:            childData.birthType ?? null,
          birth_weight_kg:       childData.birthWeight ?? null,
          birth_height_cm:       childData.birthHeight ?? null,
          gestational_age_weeks: childData.gestationalAge ?? null,
          allergies:             childData.allergies ?? null,
          photo_url:             resolvedPhotoUrl ?? null,
          pediatrician_name:     childData.pediatricianName ?? null,
          philhealth_number:     childData.philhealthNumber ?? null,
          mch_booklet_number:    childData.mchBookletNumber ?? null,
          created_at:            childData.createdAt,
        };
        const { error } = isEdit
          ? await supabase.from('children').update(row).eq('id', childData.id)
          : await supabase.from('children').insert(row);
        if (error) throw error;
      }

      if (isEdit) {
        updateChild(childData.id, childData);
      } else {
        addChild(childData);
        clearOnboarding(); // Remove pre-fill data after first successful save
      }

      router.replace(isEdit ? '/(tabs)' : '/welcome');
    } catch (err: any) {
      Alert.alert(t('profile.save_error'), err.message ?? '');
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderAvatar = () => {
    if (photoUri) {
      return <Image source={{ uri: photoUri }} style={s.avatarImg} />;
    }
    const av = DEFAULT_AVATARS[avatarIndex ?? 0];
    return (
      <View style={[s.avatarDefault, { backgroundColor: av.bg }]}>
        <Text style={s.avatarEmoji}>{av.emoji}</Text>
      </View>
    );
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isEdit ? t('profile.edit_title') : t('profile.add_title')}
        </Text>
        <TouchableOpacity onPress={handleSave} style={s.saveBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.saveBtnText}>{t('common.save')}</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Progress Bar ── */}
        <View style={s.progressCard}>
          <View style={s.progressLabelRow}>
            <Text style={s.progressLabel}>{t('profile.progress_label')}</Text>
            <Text style={s.progressPct}>{progress}%</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress}%` as any }]} />
          </View>
          {progress === 100 && (
            <Text style={s.progressComplete}>✓ {t('profile.progress_complete')}</Text>
          )}
        </View>

        {/* ── Pre-fill notice ── */}
        {prefillActive && (
          <View style={s.prefillBanner}>
            <Text style={s.prefillText}>✨ {t('profile.prefilled_notice')}</Text>
          </View>
        )}

        {/* ── 1. Photo ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['photo'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.photo_section')} />

          <View style={s.avatarContainer}>
            {renderAvatar()}
          </View>

          <View style={s.defaultAvatarsRow}>
            {DEFAULT_AVATARS.map((av, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => { setAvatarIndex(idx); setPhotoUri(''); }}
                style={[
                  s.defaultAvatarBtn,
                  { backgroundColor: av.bg },
                  avatarIndex === idx && !photoUri && s.defaultAvatarSelected,
                ]}
              >
                <Text style={s.defaultAvatarEmoji}>{av.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.photoActions}>
            <TouchableOpacity style={s.photoBtn} onPress={takePhoto}>
              <Text style={s.photoBtnText}>📷 {t('profile.take_photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.photoBtn} onPress={pickFromGallery}>
              <Text style={s.photoBtnText}>🖼 {t('profile.choose_gallery')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Basic Info ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['basic'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.basic_info')} required />
          <Field
            label={t('profile.first_name')}
            value={firstName}
            onChangeText={(v) => { setFirstName(v); if (v.trim()) setErrors((e) => { const n = { ...e }; delete n.firstName; return n; }); }}
            maxLength={50}
            error={errors.firstName}
          />
          <Field
            label={t('profile.middle_name')}
            value={middleName}
            onChangeText={setMiddleName}
            maxLength={50}
            optional
          />
          <Field
            label={t('profile.last_name')}
            value={lastName}
            onChangeText={(v) => { setLastName(v); if (v.trim()) setErrors((e) => { const n = { ...e }; delete n.lastName; return n; }); }}
            maxLength={50}
            error={errors.lastName}
          />
          <Field
            label={t('profile.nickname')}
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
            optional
          />
        </View>

        {/* ── 3. Personal Info ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['personal'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.personal_info')} required />

          {/* Sex toggle */}
          <Text style={s.fieldLabel}>{t('profile.sex')} <Text style={s.requiredStar}>*</Text></Text>
          <View style={s.toggleRow}>
            {(['male', 'female', 'unspecified'] as Sex[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.toggleBtn, sex === v && s.toggleBtnActive]}
                onPress={() => setSex(v)}
              >
                <Text style={[s.toggleBtnText, sex === v && s.toggleBtnTextActive]}>
                  {v === 'male'   ? `💙 ${t('profile.sex_boy')}`
                   : v === 'female' ? `💗 ${t('profile.sex_girl')}`
                   : `🌈 ${t('profile.sex_other')}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Birthday — required */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            {t('profile.birthday')} <Text style={s.requiredStar}>*</Text>
          </Text>
          {Platform.OS === 'web' ? (
            <View style={[s.input, errors.birthday && s.inputError]}>
              {/* @ts-ignore */}
              <input
                type="date"
                value={birthday}
                max={todayISO()}
                onChange={(e: any) => {
                  setBirthday(e.target.value);
                  if (e.target.value) setErrors((err) => { const n = { ...err }; delete n.birthday; return n; });
                }}
                style={{
                  border: 'none', outline: 'none', width: '100%',
                  fontSize: 15,
                  color: birthday ? Colors.dark : Colors.lightGray,
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit', padding: 0,
                }}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[s.input, errors.birthday && s.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthday ? s.inputText : s.inputPlaceholder}>
                  {birthday || t('profile.birthday_placeholder')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthday ? new Date(birthday) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </>
          )}
          {errors.birthday && <Text style={s.errorText}>{errors.birthday}</Text>}

          {/* Birth time */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            {t('profile.birth_time')}
          </Text>
          {Platform.OS === 'web' ? (
            <View style={s.input}>
              {/* @ts-ignore */}
              <input
                type="time"
                value={birthTime}
                onChange={(e: any) => setBirthTime(e.target.value)}
                style={{
                  border: 'none', outline: 'none', width: '100%',
                  fontSize: 15,
                  color: birthTime ? Colors.dark : Colors.lightGray,
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit', padding: 0,
                }}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={s.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={birthTime ? s.inputText : s.inputPlaceholder}>
                  {birthTime ? formatTime12h(birthTime) : t('profile.birth_time_placeholder')}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={birthTime ? hhmmToDate(birthTime) : new Date()}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}
            </>
          )}

          {/* Blood type */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>{t('profile.blood_type')}</Text>
          <View style={s.chipGrid}>
            {BLOOD_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt}
                style={[s.chip, bloodType === bt && s.chipActive]}
                onPress={() => setBloodType(bloodType === bt ? undefined : bt)}
              >
                <Text style={[s.chipText, bloodType === bt && s.chipTextActive]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4. Birth Details ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['birthDetails'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.birth_details')} />

          <Text style={s.fieldLabel}>{t('profile.birth_type')}</Text>
          <View style={s.toggleRow}>
            {(['vaginal', 'cesarean'] as BirthType[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.toggleBtn, birthType === v && s.toggleBtnActive]}
                onPress={() => setBirthType(birthType === v ? undefined : v)}
              >
                <Text style={[s.toggleBtnText, birthType === v && s.toggleBtnTextActive]}>
                  {v === 'vaginal' ? t('profile.birth_vaginal') : t('profile.birth_cesarean')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label={t('profile.birth_weight')}
            value={birthWeightStr}
            onChangeText={(v) => { setBirthWeightStr(v); if (v) setErrors((e) => { const n = { ...e }; delete n.birthWeight; return n; }); }}
            placeholder="e.g. 3.2"
            keyboardType="decimal-pad"
            optional
            error={errors.birthWeight}
          />
          <Field
            label={t('profile.birth_height')}
            value={birthHeightStr}
            onChangeText={(v) => { setBirthHeightStr(v); if (v) setErrors((e) => { const n = { ...e }; delete n.birthHeight; return n; }); }}
            placeholder="e.g. 50"
            keyboardType="decimal-pad"
            optional
            error={errors.birthHeight}
          />
          <Field
            label={t('profile.gestational_age')}
            value={gestAgeStr}
            onChangeText={(v) => { setGestAgeStr(v); if (v) setErrors((e) => { const n = { ...e }; delete n.gestationalAge; return n; }); }}
            placeholder="e.g. 39"
            keyboardType="number-pad"
            optional
            error={errors.gestationalAge}
          />
        </View>

        {/* ── 5. Health Info ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['health'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.health_info')} />

          <Text style={s.fieldLabel}>{t('profile.allergies')}</Text>

          <View style={s.chipGrid}>
            {PRESET_ALLERGIES.map((a) => (
              <TouchableOpacity
                key={a}
                style={[s.chip, allergies.includes(a) && s.chipActiveRed]}
                onPress={() => togglePresetAllergy(a)}
              >
                <Text style={[s.chipText, allergies.includes(a) && s.chipTextActiveRed]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {allergies.filter((a) => !PRESET_ALLERGIES.includes(a)).length > 0 && (
            <View style={s.tagRow}>
              {allergies
                .filter((a) => !PRESET_ALLERGIES.includes(a))
                .map((a) => (
                  <TouchableOpacity key={a} style={s.tag} onPress={() => removeAllergy(a)}>
                    <Text style={s.tagText}>{a} ×</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          <View style={s.allergyInputRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              value={allergyInput}
              onChangeText={setAllergyInput}
              placeholder={t('profile.add_allergy')}
              placeholderTextColor={Colors.lightGray}
              returnKeyType="done"
              onSubmitEditing={addCustomAllergy}
            />
            <TouchableOpacity style={s.addAllergyBtn} onPress={addCustomAllergy}>
              <Text style={s.addAllergyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <Field
            label={t('profile.pediatrician')}
            value={pediatrician}
            onChangeText={setPediatrician}
            optional
          />
          <Field
            label={t('profile.clinic')}
            value={clinic}
            onChangeText={setClinic}
            optional
          />
        </View>

        {/* ── 6. Government Records ── */}
        <View
          style={s.card}
          onLayout={(e) => { sectionYRef.current['govRecords'] = e.nativeEvent.layout.y; }}
        >
          <SectionTitle label={t('profile.gov_records')} />
          <Field
            label={t('profile.philhealth')}
            value={philhealth}
            onChangeText={setPhilhealth}
            keyboardType="number-pad"
            optional
          />
          <Field
            label={t('profile.mch_booklet')}
            value={mch}
            onChangeText={setMch}
            optional
          />
        </View>

        {/* ── Bottom Save button ── */}
        <TouchableOpacity
          style={[s.bottomSaveBtn, saving && s.bottomSaveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.bottomSaveBtnText}>{t('profile.save')}</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:       { padding: 6 },
  backIcon:      { fontSize: 22, color: Colors.primaryPink },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: Colors.dark, flex: 1, textAlign: 'center' },
  saveBtn: {
    backgroundColor: Colors.primaryPink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  // Progress bar
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, fontWeight: '700', color: Colors.midGray },
  progressPct:   { fontSize: 13, fontWeight: '800', color: Colors.primaryPink },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: Colors.primaryPink,
    borderRadius: 4,
  },
  progressComplete: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.mint,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Pre-fill banner
  prefillBanner: {
    backgroundColor: Colors.softBlue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#B3D4F5',
  },
  prefillText: {
    fontSize: 13,
    color: Colors.blue,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryPink,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.lightGray,
    marginLeft: 6,
  },

  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: 16 },
  avatarImg: {
    width: 120, height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primaryPink,
  },
  avatarDefault: {
    width: 120, height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.softPink,
  },
  avatarEmoji: { fontSize: 56 },

  defaultAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  defaultAvatarBtn: {
    width: 54, height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  defaultAvatarSelected: {
    borderColor: Colors.primaryPink,
  },
  defaultAvatarEmoji: { fontSize: 26 },

  photoActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  photoBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryPink,
    alignItems: 'center',
  },
  photoBtnText: { color: Colors.primaryPink, fontWeight: '600', fontSize: 13 },

  // Fields
  fieldRow:    { marginBottom: 12 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: Colors.midGray, marginBottom: 6 },
  requiredStar:{ color: Colors.primaryPink, fontWeight: '800' },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.dark,
    backgroundColor: Colors.background,
    marginBottom: 0,
  },
  inputError: {
    borderColor: Colors.primaryPink,
    backgroundColor: '#FFF5F7',
  },
  inputText:        { fontSize: 15, color: Colors.dark },
  inputPlaceholder: { fontSize: 15, color: Colors.lightGray },
  errorText: {
    fontSize: 12,
    color: Colors.primaryPink,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },

  // Toggle
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  toggleBtnActive:     { borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  toggleBtnText:       { fontSize: 13, fontWeight: '600', color: Colors.midGray },
  toggleBtnTextActive: { color: Colors.primaryPink },

  // Chips (blood type, etc.)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive:     { borderColor: Colors.blue, backgroundColor: Colors.softBlue },
  chipActiveRed:  { borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  chipText:       { fontSize: 13, fontWeight: '600', color: Colors.midGray },
  chipTextActive: { color: Colors.blue },
  chipTextActiveRed: { color: Colors.primaryPink },

  // Tag row (custom allergies)
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.softPink,
  },
  tagText: { fontSize: 12, color: Colors.primaryPink, fontWeight: '600' },

  // Allergy custom input row
  allergyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  addAllergyBtn: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAllergyBtnText: { color: Colors.white, fontSize: 22, fontWeight: '300', lineHeight: 26 },

  // Bottom save
  bottomSaveBtn: {
    backgroundColor: Colors.primaryPink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  bottomSaveBtnDisabled: { opacity: 0.6 },
  bottomSaveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});

// ── Stable sub-components ─────────────────────────────────────────────────────

export function SectionTitle({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={s.sectionTitle}>
      {label}
      {required && <Text style={s.requiredBadge}> (required)</Text>}
    </Text>
  );
}

export function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength, optional, error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  maxLength?: number;
  optional?: boolean;
  error?: string;
}) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>
        {label}
        {!optional && <Text style={s.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={[s.input, error ? s.inputError : undefined]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.lightGray}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        returnKeyType="done"
      />
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}
