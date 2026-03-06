import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { sendEmailOTP } from '../../src/lib/supabase';
import { router } from 'expo-router';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../../src/i18n';
import i18n from '../../src/i18n';
import Colors from '../../constants/Colors';
import LogoBadge from '../../components/LogoBadge';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────
  function isValidEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  // ── Send OTP via Supabase email ───────────────────────────────────────
  async function handleSendOTP() {
    if (!isValidEmail(email)) {
      Alert.alert('', t('auth.invalid_email'));
      return;
    }
    setLoading(true);
    try {
      await sendEmailOTP(email.trim().toLowerCase());
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { email: email.trim().toLowerCase() },
      });
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

        {/* Logo + tagline */}
        <View style={s.logoArea}>

          {/* ── BB Logo Badge (SVG) ── */}
          <LogoBadge size={100} />

          {/* ── Wordmark ── */}
          <View style={s.appNameRow}>
            <Text style={s.appNameLight}>Baby</Text>
            <Text style={s.appNameBold}>Bloom</Text>
            <Text style={s.appNamePH}> PH</Text>
          </View>

          <Text style={s.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Card */}
        <View style={s.card}>

          {/* 1 — Email OTP (primary) */}
          <Text style={s.inputLabel}>{t('auth.email_label')}</Text>
          <TextInput
            style={s.emailInput}
            placeholder={t('auth.email_placeholder')}
            placeholderTextColor={Colors.lightGray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="send"
            onSubmitEditing={handleSendOTP}
          />
          {email.length > 0 && !isValidEmail(email) && (
            <Text style={s.validationHint}>{t('auth.invalid_email')}</Text>
          )}

          <TouchableOpacity
            style={[s.otpBtn, (!isValidEmail(email) || loading) && s.btnDisabled]}
            onPress={handleSendOTP}
            disabled={!isValidEmail(email) || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.otpBtnText}>✉️ {t('auth.send_otp')}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={s.divLine} />
            <Text style={s.divText}>{t('auth.or_divider')}</Text>
            <View style={s.divLine} />
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

          {/* 4 — Apple (iOS only) */}
          {Platform.OS === 'ios' && (
            <SocialButton
              label={t('auth.continue_apple')}
              bg="#000" textColor="#fff"
              icon="🍎" onPress={() => {}} />
          )}

          {/* Terms */}
          <Text style={s.terms}>{t('auth.terms')}</Text>

          {/* DEV ONLY — skip login to preview interior layout */}
          {__DEV__ && (
            <View style={{ gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={s.devSkip}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={s.devSkipText}>⚡ Dev: Skip Login → Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.devSkip, { borderColor: Colors.mint }]}
                onPress={() => router.replace('/(auth)/onboarding')}
              >
                <Text style={[s.devSkipText, { color: Colors.mint }]}>🌱 Dev: Test Onboarding Flow</Text>
              </TouchableOpacity>
            </View>
          )}
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

  // LogoBadge is rendered via SVG component — no badge styles needed here.

  // ── Wordmark ────────────────────────────────────────────────────────────
  appNameRow:     { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  appNameLight:   { fontSize: 28, fontWeight: '300', color: 'rgba(255,255,255,0.88)', letterSpacing: 0.5 },
  appNameBold:    { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  appNamePH:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 2.5, marginLeft: 5, marginBottom: 1 },

  tagline:        { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '400', letterSpacing: 0.4 },

  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },

  inputLabel:     { fontSize: 14, fontWeight: '700', color: Colors.dark, marginBottom: 8 },
  emailInput:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.dark, marginBottom: 6 },
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

  terms:          { fontSize: 11, color: Colors.lightGray, textAlign: 'center', marginTop: 16, lineHeight: 16 },

  devSkip:        { marginTop: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F5A623', alignItems: 'center' },
  devSkipText:    { fontSize: 13, color: '#F5A623', fontWeight: '700' },
});
