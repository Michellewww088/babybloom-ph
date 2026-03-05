import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import { verifyPhoneOTP } from '../../src/lib/supabase';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OTPVerifyScreen() {
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Countdown timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── OTP box input handler ───────────────────────────────────────────
  function handleDigit(text: string, index: number) {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (digit && index === OTP_LENGTH - 1 && newOtp.every(Boolean)) {
      verify(newOtp.join(''));
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // ── Paste handler (paste full 6-digit code) ─────────────────────────
  function handlePaste(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    const padded = [...digits, ...Array(OTP_LENGTH - digits.length).fill('')];
    setOtp(padded);
    if (digits.length === OTP_LENGTH) verify(digits.join(''));
  }

  // ── Verify ──────────────────────────────────────────────────────────
  async function verify(code: string) {
    if (code.length < OTP_LENGTH) return;
    setLoading(true);
    try {
      await verifyPhoneOTP(phone!, code);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('', t('auth.invalid_otp'));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      {/* Back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={s.title}>{t('auth.otp_title')}</Text>
      <Text style={s.subtitle}>
        {t('auth.otp_subtitle', { phone: phone?.replace('+63', '') })}
      </Text>

      {/* OTP Boxes */}
      <View style={s.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[s.otpBox, digit ? s.otpBoxFilled : null]}
            value={digit}
            onChangeText={(text) => {
              if (text.length > 1) { handlePaste(text); return; }
              handleDigit(text, i);
            }}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            caretHidden
          />
        ))}
      </View>

      {/* Verify button */}
      <TouchableOpacity
        style={[s.verifyBtn, (otp.some((d) => !d) || loading) && s.verifyBtnDisabled]}
        onPress={() => verify(otp.join(''))}
        disabled={otp.some((d) => !d) || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.verifyBtnText}>{t('auth.verify_otp')}</Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <View style={s.resendRow}>
        {countdown > 0 ? (
          <Text style={s.countdownText}>
            {t('auth.resend_countdown', { seconds: countdown })}
          </Text>
        ) : (
          <TouchableOpacity onPress={() => setCountdown(RESEND_SECONDS)}>
            <Text style={s.resendText}>{t('auth.resend_otp')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ate AI disclaimer */}
      <Text style={s.disclaimer}>{t('ate_ai.disclaimer')}</Text>
    </View>
  );
}

const PINK = '#F472B6';

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FDF2F8', padding: 24, paddingTop: 60 },
  backBtn:          { marginBottom: 32 },
  backText:         { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  title:            { fontSize: 28, fontWeight: '800', color: '#BE185D', marginBottom: 8 },
  subtitle:         { fontSize: 15, color: '#6B7280', marginBottom: 36, lineHeight: 22 },

  otpRow:           { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
  otpBox:           { width: 50, height: 60, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 14, fontSize: 26, fontWeight: '700', color: '#1F2937', backgroundColor: '#fff' },
  otpBoxFilled:     { borderColor: PINK, backgroundColor: '#FDF2F8' },

  verifyBtn:        { backgroundColor: PINK, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  verifyBtnDisabled:{ opacity: 0.5 },
  verifyBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },

  resendRow:        { alignItems: 'center', marginBottom: 32 },
  countdownText:    { fontSize: 14, color: '#9CA3AF' },
  resendText:       { fontSize: 14, color: PINK, fontWeight: '700' },

  disclaimer:       { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 16, position: 'absolute', bottom: 30, left: 24, right: 24 },
});
