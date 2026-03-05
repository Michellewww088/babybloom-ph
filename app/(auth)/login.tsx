import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { sendPhoneOTP } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import i18n from '../../src/i18n';

type LoginTab = 'phone' | 'email';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<LoginTab>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Format phone input (strip non-digits, limit 10) ─────────────────
  function handlePhoneChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  }

  function formatPhoneDisplay(digits: string) {
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  function isValidPHPhone(digits: string) {
    // Philippine mobile: 10 digits starting with 9
    return /^9\d{9}$/.test(digits);
  }

  // ── Send OTP ─────────────────────────────────────────────────────────
  async function handleSendOTP() {
    if (!isValidPHPhone(phone)) {
      Alert.alert('', t('auth.invalid_phone'));
      return;
    }
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

  // ── Language switcher ────────────────────────────────────────────────
  function switchLang(code: LanguageCode) {
    i18n.changeLanguage(code);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {/* Language switcher */}
      <View style={s.langRow}>
        {SUPPORTED_LANGUAGES.map(({ code, nativeLabel }) => (
          <TouchableOpacity
            key={code}
            onPress={() => switchLang(code as LanguageCode)}
            style={[s.langBtn, i18n.language === code && s.langBtnActive]}
          >
            <Text style={[s.langText, i18n.language === code && s.langTextActive]}>
              {nativeLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logo */}
      <View style={s.logoArea}>
        <Text style={s.logo}>🌸 BabyBloom PH</Text>
        <Text style={s.logoSub}>{t('auth.login_subtitle')}</Text>
      </View>

      {/* Tab: Phone / Email */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'phone' && s.tabBtnActive]}
          onPress={() => setTab('phone')}
        >
          <Text style={[s.tabText, tab === 'phone' && s.tabTextActive]}>📱 Phone</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'email' && s.tabBtnActive]}
          onPress={() => setTab('email')}
        >
          <Text style={[s.tabText, tab === 'email' && s.tabTextActive]}>📧 Email</Text>
        </TouchableOpacity>
      </View>

      {/* Phone input */}
      {tab === 'phone' && (
        <View style={s.inputSection}>
          <Text style={s.label}>{t('auth.phone_label')}</Text>
          <View style={s.phoneRow}>
            {/* Country code badge */}
            <View style={s.countryCode}>
              <Text style={s.flagEmoji}>🇵🇭</Text>
              <Text style={s.countryCodeText}>+63</Text>
            </View>
            <TextInput
              style={s.phoneInput}
              placeholder={t('auth.phone_placeholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={formatPhoneDisplay(phone)}
              onChangeText={handlePhoneChange}
              maxLength={12} // formatted: "9XX XXX XXXX"
              returnKeyType="send"
              onSubmitEditing={handleSendOTP}
            />
          </View>
          {/* Validation hint */}
          {phone.length > 0 && !isValidPHPhone(phone) && (
            <Text style={s.hint}>{t('auth.invalid_phone')}</Text>
          )}

          <TouchableOpacity
            style={[s.primaryBtn, (!isValidPHPhone(phone) || loading) && s.primaryBtnDisabled]}
            onPress={handleSendOTP}
            disabled={!isValidPHPhone(phone) || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>{t('auth.send_otp')}</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Email input */}
      {tab === 'email' && (
        <View style={s.inputSection}>
          <Text style={s.label}>{t('auth.email_label')}</Text>
          <TextInput
            style={s.emailInput}
            placeholder={t('auth.email_placeholder')}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>{t('auth.continue_email')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Divider */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>{t('auth.or_divider')}</Text>
        <View style={s.dividerLine} />
      </View>

      {/* Social logins */}
      <View style={s.socialCol}>
        <SocialBtn emoji="🔵" label={t('auth.continue_facebook')} color="#1877F2" />
        <SocialBtn emoji="🔍" label={t('auth.continue_google')}   color="#EA4335" />
        {Platform.OS === 'ios' && (
          <SocialBtn emoji="🍎" label={t('auth.continue_apple')}  color="#000000" />
        )}
      </View>

      {/* Terms */}
      <Text style={s.terms}>{t('auth.terms')}</Text>

    </ScrollView>
  );
}

function SocialBtn({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  return (
    <TouchableOpacity style={[s.socialBtn, { borderColor: color + '40' }]}>
      <Text style={s.socialEmoji}>{emoji}</Text>
      <Text style={[s.socialLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const PINK = '#F472B6';

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FDF2F8' },
  content:          { padding: 24, paddingTop: 60, paddingBottom: 40 },

  langRow:          { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginBottom: 24 },
  langBtn:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  langBtnActive:    { backgroundColor: PINK, borderColor: PINK },
  langText:         { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  langTextActive:   { color: '#fff' },

  logoArea:         { alignItems: 'center', marginBottom: 32 },
  logo:             { fontSize: 32, fontWeight: '800', color: '#BE185D', marginBottom: 6 },
  logoSub:          { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  tabRow:           { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabBtn:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  tabBtnActive:     { backgroundColor: PINK },
  tabText:          { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive:    { color: '#fff' },

  inputSection:     { marginBottom: 8 },
  label:            { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },

  phoneRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  countryCode:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14 },
  flagEmoji:        { fontSize: 20 },
  countryCodeText:  { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  phoneInput:       { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 18, letterSpacing: 1, color: '#1F2937' },

  emailInput:       { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: '#1F2937', marginBottom: 8 },

  hint:             { fontSize: 12, color: '#EF4444', marginBottom: 8 },

  primaryBtn:       { backgroundColor: PINK, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled:{ opacity: 0.5 },
  primaryBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },

  dividerRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine:      { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText:      { fontSize: 14, color: '#9CA3AF' },

  socialCol:        { gap: 12 },
  socialBtn:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  socialEmoji:      { fontSize: 22 },
  socialLabel:      { fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'center' },

  terms:            { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24, lineHeight: 16 },
});
