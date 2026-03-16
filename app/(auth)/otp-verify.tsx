import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { ButtonLoader } from '../../components/SkeletonCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, router } from 'expo-router';
import { verifyEmailOTP, sendEmailOTP, supabase } from '../../src/lib/supabase';
import Colors from '../../constants/Colors';

const OTP_LENGTH      = 6;
const RESEND_SECONDS  = 60;
const MAX_ATTEMPTS    = 3;
const LOCKOUT_MINUTES = 15;

export default function OTPVerifyScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp]             = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [attempts, setAttempts]   = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── 60s resend countdown ─────────────────────────────────────────────
  useEffect(() => {
    if (countdown === 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // ── Lockout countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const secsLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      if (secsLeft <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setLockCountdown(0);
        setOtp(Array(OTP_LENGTH).fill(''));
        clearInterval(tick);
      } else {
        setLockCountdown(secsLeft);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockedUntil]);

  // ── Mask email for subtitle (e.g. j***@example.com) ──────────────────
  function maskEmail(e: string) {
    const [local, domain] = e.split('@');
    if (!local || !domain) return e;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  // ── Digit input ──────────────────────────────────────────────────────
  function handleDigit(text: string, index: number) {
    if (lockedUntil) return;
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1 && next.every(Boolean)) verify(next.join(''));
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    const padded = [...digits, ...Array(OTP_LENGTH - digits.length).fill('')];
    setOtp(padded);
    if (digits.length === OTP_LENGTH) verify(digits.join(''));
  }

  // ── Verify ───────────────────────────────────────────────────────────
  async function verify(code: string) {
    if (code.length < OTP_LENGTH || lockedUntil) return;
    setLoading(true);
    try {
      const { session } = await verifyEmailOTP(email!, code);

      // Check if this is a new user (no profile in user_profiles yet)
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          router.replace('/(auth)/intro');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        setLockedUntil(until);
        Alert.alert(
          'Too many attempts',
          `Locked for ${LOCKOUT_MINUTES} minutes. Please try again later.`
        );
      } else {
        Alert.alert('', t('auth.invalid_otp'));
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setCountdown(RESEND_SECONDS);
    setAttempts(0);
    setOtp(Array(OTP_LENGTH).fill(''));
    try {
      await sendEmailOTP(email!);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to resend OTP');
    }
  }

  const isLocked = !!lockedUntil;
  const minutesLeft = Math.ceil(lockCountdown / 60);
  const secondsLeft = lockCountdown % 60;

  return (
    <LinearGradient colors={[Colors.primaryPink, Colors.gold]} style={s.gradient}>
      <View style={s.container}>

        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← {t('onboarding.back')}</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={s.title}>{t('auth.otp_title')}</Text>
        <Text style={s.subtitle}>
          Sent to {maskEmail(email ?? '')}
        </Text>

        {/* Card */}
        <View style={s.card}>

          {/* Lockout state */}
          {isLocked && (
            <View style={s.lockoutBox}>
              <Text style={s.lockoutEmoji}>🔒</Text>
              <Text style={s.lockoutTitle}>Too many wrong attempts</Text>
              <Text style={s.lockoutTimer}>
                Try again in {minutesLeft}:{String(secondsLeft).padStart(2, '0')}
              </Text>
            </View>
          )}

          {/* OTP Boxes */}
          <View style={s.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[s.otpBox, digit ? s.otpBoxFilled : null, isLocked && s.otpBoxLocked]}
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
                editable={!isLocked}
              />
            ))}
          </View>

          {/* Attempt counter */}
          {attempts > 0 && !isLocked && (
            <Text style={s.attemptText}>
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
            </Text>
          )}

          {/* Verify button */}
          <TouchableOpacity
            style={[s.verifyBtn, (otp.some(d => !d) || loading || isLocked) && s.btnDisabled]}
            onPress={() => verify(otp.join(''))}
            disabled={otp.some(d => !d) || loading || isLocked}
          >
            {loading
              ? <ButtonLoader />
              : <Text style={s.verifyBtnText}>{t('auth.verify_otp')}</Text>
            }
          </TouchableOpacity>

          {/* Resend */}
          <View style={s.resendRow}>
            {countdown > 0 && !isLocked ? (
              <Text style={s.countdownText}>
                {t('auth.resend_countdown', { seconds: countdown })}
              </Text>
            ) : !isLocked ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={s.resendText}>{t('auth.resend_otp')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

        </View>

        {/* Disclaimer */}
        <Text style={s.disclaimer}>{t('ate_ai.disclaimer')}</Text>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient:      { flex: 1 },
  container:     { flex: 1, padding: 24, paddingTop: 56 },

  backBtn:       { marginBottom: 28 },
  backText:      { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  title:         { fontSize: 28, fontWeight: '900', color: Colors.white, marginBottom: 6 },
  subtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 28 },

  card:          { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },

  lockoutBox:    { alignItems: 'center', paddingVertical: 16, marginBottom: 16, backgroundColor: Colors.softPink, borderRadius: 14 },
  lockoutEmoji:  { fontSize: 32, marginBottom: 6 },
  lockoutTitle:  { fontSize: 15, fontWeight: '700', color: Colors.primaryPink, marginBottom: 4 },
  lockoutTimer:  { fontSize: 20, fontWeight: '800', color: Colors.dark },

  otpRow:        { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 8 },
  otpBox:        { width: 46, height: 56, borderWidth: 2, borderColor: Colors.border, borderRadius: 14, fontSize: 24, fontWeight: '800', color: Colors.dark, backgroundColor: Colors.white },
  otpBoxFilled:  { borderColor: Colors.primaryPink, backgroundColor: Colors.softPink },
  otpBoxLocked:  { opacity: 0.4 },

  attemptText:   { fontSize: 12, color: Colors.danger, textAlign: 'center', marginBottom: 8 },

  verifyBtn:     { backgroundColor: Colors.primaryPink, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 12 },
  btnDisabled:   { opacity: 0.45 },
  verifyBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  resendRow:     { alignItems: 'center', minHeight: 24 },
  countdownText: { fontSize: 13, color: Colors.lightGray },
  resendText:    { fontSize: 14, color: Colors.primaryPink, fontWeight: '700' },

  disclaimer:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 28, lineHeight: 16, paddingHorizontal: 8 },
});
