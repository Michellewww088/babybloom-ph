/**
 * child-profile.tsx
 * Create / Edit child profile — all fields from docs/02-profile.md
 * Accessible via: router.push('/child-profile') or router.push({ pathname: '/child-profile', params: { id: '...' } })
 */

import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useState, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import Colors from '../constants/Colors';
import { useChildStore, Child, Sex, BirthType, BloodType } from '../store/childStore';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

// ── Constants ────────────────────────────────────────────────────────────────

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const PRESET_ALLERGIES = ['Nuts', 'Dairy', 'Eggs', 'Shellfish', 'Wheat', 'Soy', 'Fish'];

/** 4 default avatar options: colour + emoji */
const DEFAULT_AVATARS = [
  { bg: '#E8F2FF', emoji: '👶🏻', label: 'Boy (light)' },
  { bg: '#FFE4EE', emoji: '👶🏽', label: 'Girl (medium)' },
  { bg: '#E0F7EF', emoji: '👶🏾', label: 'Baby (dark)' },
  { bg: '#FFF8E8', emoji: '👶',   label: 'Baby (neutral)' },
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
  const params   = useLocalSearchParams<{ id?: string }>();
  const { children, addChild, updateChild } = useChildStore();

  const existing = params.id ? children.find((c) => c.id === params.id) : undefined;
  const isEdit   = Boolean(existing);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [photoUri,       setPhotoUri]       = useState(existing?.photoUri ?? '');
  const [avatarIndex,    setAvatarIndex]    = useState<number | undefined>(existing?.avatarIndex ?? 0);

  const [firstName,      setFirstName]      = useState(existing?.firstName ?? '');
  const [middleName,     setMiddleName]     = useState(existing?.middleName ?? '');
  const [lastName,       setLastName]       = useState(existing?.lastName ?? '');
  const [nickname,       setNickname]       = useState(existing?.nickname ?? '');

  const [sex,            setSex]            = useState<Sex>(existing?.sex ?? 'female');
  const [birthday,       setBirthday]       = useState(existing?.birthday ?? '');
  const [birthTime,      setBirthTime]      = useState(existing?.birthTime ?? ''); // "HH:MM" 24h
  const [bloodType,      setBloodType]      = useState<BloodType | undefined>(existing?.bloodType);

  const [birthType,      setBirthType]      = useState<BirthType | undefined>(existing?.birthType);
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

  /** Upload local photo URI to Supabase Storage → return public URL */
  async function uploadPhoto(localUri: string, childId: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? 'anon';
      const path   = `${userId}/${childId}.jpg`;

      // Fetch the image as a Blob (works on both web and native)
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
      return null; // fall back to no photo rather than crash
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
    if (date) setBirthday(date.toISOString().split('T')[0]);
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (date) setBirthTime(dateToHHMM(date));
  };

  // ── Validation & Save ────────────────────────────────────────────────────

  const handleSave = async () => {
    // Required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('', t('profile.required_fields'));
      return;
    }
    // Birthday not in future
    if (birthday && birthday > todayISO()) {
      Alert.alert('', t('profile.birthday_future'));
      return;
    }
    // Numeric range validations
    const bw = parseFloat(birthWeightStr);
    if (birthWeightStr && (isNaN(bw) || bw < 0.5 || bw > 8.0)) {
      Alert.alert('', t('profile.weight_range'));
      return;
    }
    const bh = parseFloat(birthHeightStr);
    if (birthHeightStr && (isNaN(bh) || bh < 25 || bh > 65)) {
      Alert.alert('', t('profile.height_range'));
      return;
    }
    const ga = parseInt(gestAgeStr, 10);
    if (gestAgeStr && (isNaN(ga) || ga < 22 || ga > 42)) {
      Alert.alert('', t('profile.gestational_range'));
      return;
    }

    setSaving(true);
    try {
      const childId = existing?.id ?? generateId();

      // ── Photo: upload to Supabase Storage if configured ──────────────────
      let resolvedPhotoUri = photoUri || undefined;
      let resolvedPhotoUrl: string | undefined;

      if (isSupabaseConfigured && photoUri && !photoUri.startsWith('http')) {
        // Local URI → upload to Storage
        const url = await uploadPhoto(photoUri, childId);
        if (url) {
          resolvedPhotoUrl = url;
          resolvedPhotoUri = url; // store public URL in local store too
        }
      } else if (photoUri?.startsWith('http')) {
        // Already a remote URL (editing existing profile)
        resolvedPhotoUrl = photoUri;
        resolvedPhotoUri = photoUri;
      }

      const childData: Child = {
        id:               childId,
        firstName:        firstName.trim(),
        middleName:       middleName.trim() || undefined,
        lastName:         lastName.trim(),
        nickname:         nickname.trim() || undefined,
        sex,
        birthday:         birthday || todayISO(),
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

      // ── Save to Supabase if configured ───────────────────────────────────
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        const row = {
          id:                 childData.id,
          user_id:            user?.id,
          first_name:         childData.firstName,
          middle_name:        childData.middleName ?? null,
          last_name:          childData.lastName,
          nickname:           childData.nickname ?? null,
          sex:                childData.sex,           // 'male' | 'female' | 'unspecified' ✓
          birthday:           childData.birthday,
          birth_time:         childData.birthTime ?? null,
          blood_type:         childData.bloodType ?? null,
          birth_type:         childData.birthType ?? null,
          birth_weight_kg:    childData.birthWeight ?? null,
          birth_height_cm:    childData.birthHeight ?? null,
          gestational_age_weeks: childData.gestationalAge ?? null,
          allergies:          childData.allergies ?? null,
          photo_url:          resolvedPhotoUrl ?? null,
          pediatrician_name:  childData.pediatricianName ?? null,
          philhealth_number:  childData.philhealthNumber ?? null,
          mch_booklet_number: childData.mchBookletNumber ?? null,
          created_at:         childData.createdAt,
        };
        const { error } = isEdit
          ? await supabase.from('children').update(row).eq('id', childData.id)
          : await supabase.from('children').insert(row);
        if (error) throw error;
      }

      // Always update local store
      if (isEdit) {
        updateChild(childData.id, childData);
      } else {
        addChild(childData);
      }

      // First save → welcome animation; subsequent edits → straight to dashboard
      if (isEdit) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
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

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── 1. Photo ── */}
        <View style={s.card}>
          <SectionTitle label={t('profile.photo_section')} />

          {/* Avatar display */}
          <View style={s.avatarContainer}>
            {renderAvatar()}
          </View>

          {/* Default avatar options */}
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

          {/* Photo action buttons */}
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
        <View style={s.card}>
          <SectionTitle label={t('profile.basic_info')} />
          <Field
            label={t('profile.first_name')}
            value={firstName}
            onChangeText={setFirstName}
            maxLength={50}
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
            onChangeText={setLastName}
            maxLength={50}
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
        <View style={s.card}>
          <SectionTitle label={t('profile.personal_info')} />

          {/* Sex toggle */}
          <Text style={s.fieldLabel}>{t('profile.sex')}</Text>
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

          {/* Birthday */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            {t('profile.birthday')}
          </Text>
          {Platform.OS === 'web' ? (
            // Web: native date input
            <View style={s.input}>
              {/* @ts-ignore */}
              <input
                type="date"
                value={birthday}
                max={todayISO()}
                onChange={(e: any) => setBirthday(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: 15,
                  color: birthday ? Colors.dark : Colors.lightGray,
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={s.input}
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

          {/* Birth time — proper time picker */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>
            {t('profile.birth_time')}
          </Text>
          {Platform.OS === 'web' ? (
            // Web: native time input
            <View style={s.input}>
              {/* @ts-ignore */}
              <input
                type="time"
                value={birthTime}
                onChange={(e: any) => setBirthTime(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: 15,
                  color: birthTime ? Colors.dark : Colors.lightGray,
                  backgroundColor: 'transparent',
                  fontFamily: 'inherit',
                  padding: 0,
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
        <View style={s.card}>
          <SectionTitle label={t('profile.birth_details')} />

          {/* Birth type */}
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
            onChangeText={setBirthWeightStr}
            placeholder="e.g. 3.2"
            keyboardType="decimal-pad"
            optional
          />
          <Field
            label={t('profile.birth_height')}
            value={birthHeightStr}
            onChangeText={setBirthHeightStr}
            placeholder="e.g. 50"
            keyboardType="decimal-pad"
            optional
          />
          <Field
            label={t('profile.gestational_age')}
            value={gestAgeStr}
            onChangeText={setGestAgeStr}
            placeholder="e.g. 39"
            keyboardType="number-pad"
            optional
          />
        </View>

        {/* ── 5. Health Info ── */}
        <View style={s.card}>
          <SectionTitle label={t('profile.health_info')} />

          {/* Allergies */}
          <Text style={s.fieldLabel}>{t('profile.allergies')}</Text>

          {/* Preset allergy chips */}
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

          {/* Active allergy tags */}
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

          {/* Custom allergy input */}
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
        <View style={s.card}>
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
    backgroundColor: '#fff',
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
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },

  // Cards
  card: {
    backgroundColor: '#fff',
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
  required:    { color: Colors.primaryPink },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.dark,
    backgroundColor: '#FAFAFA',
    marginBottom: 0,
  },
  inputText:        { fontSize: 15, color: Colors.dark },
  inputPlaceholder: { fontSize: 15, color: Colors.lightGray },

  // Toggle
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#FAFAFA',
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
  addAllergyBtnText: { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 26 },

  // Bottom save
  bottomSaveBtn: {
    backgroundColor: Colors.primaryPink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  bottomSaveBtnDisabled: { opacity: 0.6 },
  bottomSaveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

// ── Stable sub-components (outside the screen so they never remount on re-render) ──

export function SectionTitle({ label }: { label: string }) {
  return <Text style={s.sectionTitle}>{label}</Text>;
}

export function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength, optional,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  maxLength?: number;
  optional?: boolean;
}) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>
        {label}
        {!optional && <Text style={s.required}> *</Text>}
      </Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.lightGray}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        returnKeyType="done"
      />
    </View>
  );
}
