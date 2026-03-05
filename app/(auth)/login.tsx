import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { sendPhoneOTP } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import i18n from '../../src/i18n';
import Colors from '../../constants/Colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');

  // ── Phone formatting ─────────────────────────────────────────────────
  function handlePhoneChange(text: string) {
    setPhone(text.replace(/\D/g, '').slice(0, 10));
  }

  function formatDisplay(d: string) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  function isValid(d: string) {
    // Spec: starts with 09 or just 9 (we store without leading 0), 10 digits
    return /^9\d{9}$/.test(d);
  }

  // ── Send OTP ─────────────────────────────────────────────────────────
  async function handleSendOTP() {
    if (!isValid(phone)) { Alert.alert('', t('auth.invalid_phone')); return; }
    setLoading(true);
    try {
      const e164 = await sendPhoneOTP(phone);
      router.push({ pathname: '/(auth)/otp-verify', params: { phone: e164 } });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={[Colors.primaryPink, Colors.gold]}
      style={s.gradient}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Language toggle — top right */}
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

        {/* Logo + trilingual tagline */}
        <View style={s.logoArea}>
          <Text style={s.logo}>🌸</Text>
          <Text style={s.appName}>BabyBloom PH</Text>
          <Text style={s.taglineEN}>Your Baby's Health Companion</Text>
          <Text style={s.taglineFIL}>Ang Kasamahan ng Kalusugan ng Iyong Sanggol</Text>
          <Text style={s.taglineZH}>您宝宝的健康伴侣</Text>
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* 1 — Mobile OTP (primary) */}
          <Text style={s.inputLabel}>{t('auth.phone_label')}</Text>
          <View style={s.phoneRow}>
            <View style={s.countryBadge}>
              <Text style={s.flagText}>🇵🇭</Text>
              <Text style={s.countryText}>+63</Text>
            </View>
            <TextInput
              style={s.phoneInput}
              placeholder={t('auth.phone_placeholder')}
              placeholderTextColor={Colors.lightGray}
              keyboardType="phone-pad"
              value={formatDisplay(phone)}
              onChangeText={handlePhoneChange}
              maxLength={12}
              returnKeyType="send"
              onSubmitEditing={handleSendOTP}
            />
          </View>
          {phone.length > 0 && !isValid(phone) && (
            <Text style={s.validationHint}>{t('auth.invalid_phone')}</Text>
          )}

          <TouchableOpacity
            style={[s.otpBtn, (!isValid(phone) || loading) && s.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!isValid(phone) || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.otpBtnText}>📱 {t('auth.send_otp')}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} /><Text style={s.divText}>{t('auth.or_divider')}</Text><View style={s.divLine} />
          </View>

          {/* 2 — Facebook */}
          <SocialButton
            label={t('auth.continue_facebook')}
            bg="#1877F2" textColor="#fff"
            icon="🇫" onPress={() => {}} />

          {/* 3 — Google */}
          <SocialButton
            label={t('auth.continue_google')}
            bg="#fff" textColor={Colors.dark}
            icon="G" bordered onPress={() => {}} />

          {/* 4 — Email */}
          {!showEmailInput ? (
            <SocialButton
              label={t('auth.continue_email')}
              bg="transparent" textColor={Colors.primaryPink}
              icon="✉️" bordered onPress={() => setShowEmailInput(true)} />
          ) : (
            <View style={s.emailSection}>
              <TextInput
                style={s.emailInput}
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor={Colors.lightGray}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
              <TouchableOpacity style={s.emailContinueBtn}>
                <Text style={s.emailContinueText}>{t('auth.continue_email')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 5 — Apple (iOS only) */}
          {Platform.OS === 'ios' && (
            <SocialButton
              label={t('auth.continue_apple')}
              bg="#000" textColor="#fff"
              icon="🍎" onPress={() => {}} />
          )}

          {/* Terms */}
          <Text style={s.terms}>{t('auth.terms')}</Text>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

function SocialButton({
  label, bg, textColor, icon, bordered, onPress,
}: {
  label: string; bg: string; textColor: string;
  icon: string; bordered?: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.socialBtn,
        { backgroundColor: bg },
        bordered && { borderWidth: 1.5, borderColor: Colors.border },
      ]}
    >
      <Text style={s.socialIcon}>{icon}</Text>
      <Text style={[s.socialLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  gradient:       { flex: 1 },
  content:        { padding: 24, paddingTop: 56, paddingBottom: 40 },

  langRow:        { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 28 },
  langBtn:        { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  langBtnActive:  { backgroundColor: '#fff' },
  langText:       { fontSize: 13, color: '#fff', fontWeight: '600' },
  langTextActive: { color: Colors.primaryPink },

  logoArea:       { alignItems: 'center', marginBottom: 28 },
  logo:           { fontSize: 52, marginBottom: 4 },
  appName:        { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 0.5, marginBottom: 10 },
  taglineEN:      { fontSize: 14, color: 'rgba(255,255,255,0.95)', fontWeight: '600' },
  taglineFIL:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, textAlign: 'center' },
  taglineZH:      { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },

  inputLabel:     { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  phoneRow:       { flexDirection: 'row', gap: 8, marginBottom: 6 },
  countryBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.softPink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13 },
  flagText:       { fontSize: 18 },
  countryText:    { fontSize: 16, fontWeight: '700', color: Colors.primaryPink },
  phoneInput:     { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 18, letterSpacing: 1, color: Colors.dark },
  validationHint: { fontSize: 12, color: '#EF4444', marginBottom: 6 },

  otpBtn:         { backgroundColor: Colors.primaryPink, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnDisabled:    { opacity: 0.45 },
  otpBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },

  divider:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  divLine:        { flex: 1, height: 1, backgroundColor: Colors.border },
  divText:        { fontSize: 13, color: Colors.lightGray },

  socialBtn:      { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, marginBottom: 10 },
  socialIcon:     { fontSize: 18, width: 26 },
  socialLabel:    { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },

  emailSection:   { marginBottom: 10 },
  emailInput:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.dark, marginBottom: 8 },
  emailContinueBtn: { backgroundColor: Colors.softPink, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  emailContinueText: { color: Colors.primaryPink, fontSize: 15, fontWeight: '700' },

  terms:          { fontSize: 11, color: Colors.lightGray, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
